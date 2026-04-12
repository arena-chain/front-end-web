import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Badge, Button, Input, Textarea } from '../../components/ui/core';
import { createLiveSocket, getIceServers } from '../../lib/live';
import { getStreamEmbed, pickPreferredStreamUrl } from '../../lib/stream';
import { channelService, type ChannelRecord } from '../../services/channel.service';
import { streamService, type StreamRecord } from '../../services/stream.service';
import type { Socket } from 'socket.io-client';
import { getStreamCategory, sortLiveStreams, type LiveSortMode } from '../../lib/streamBrowse';
import { cn } from '../../lib/utils';
import { Link2, Monitor, Radio, Sparkles, Tv, Check, Calendar, Clock, ChevronDown } from 'lucide-react';

const PREDEFINED_TAGS = [
    'Gaming', 'Live', 'Competitive', 'Chill', 'Education',
    'Creative', 'Esports', 'Music', 'Talk Show', 'IRL',
    'Programming', 'Design', 'Strategy', 'Tutorial'
];

export default function GoLivePage() {
    const emptyForm = {
        title: '',
        description: '',
        streamUrl: '',
        playbackUrl: '',
        thumbnailUrl: '',
        tags: [] as string[],
        scheduledStartTime: '',
        scheduledEndTime: '',
    };
    const [channel, setChannel] = useState<ChannelRecord | null>(null);
    const [streams, setStreams] = useState<StreamRecord[]>([]);
    const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [broadcastMode, setBroadcastMode] = useState<'screen' | 'camera' | 'screen-camera' | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [isScheduled, setIsScheduled] = useState(false);
    const [savedSortMode, setSavedSortMode] = useState<LiveSortMode>('date-desc');

    const sortedSavedStreams = useMemo(
        () => sortLiveStreams(streams, savedSortMode),
        [streams, savedSortMode],
    );

    const currentStream = useMemo(() => {
        if (selectedStreamId) {
            return streams.find((stream) => stream._id === selectedStreamId) ?? null;
        }

        return streams.find((stream) => stream.isLive) ?? streams[0] ?? null;
    }, [selectedStreamId, streams]);
    const embed = getStreamEmbed(
        pickPreferredStreamUrl(
            form.streamUrl,
            form.playbackUrl,
            currentStream?.streamUrl,
            currentStream?.playbackUrl,
        ),
    );
    const watchUrl = channel ? `${window.location.origin}/watch/${channel._id}` : '';
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const localPreviewStreamRef = useRef<MediaStream | null>(null);
    const sourceStreamsRef = useRef<MediaStream[]>([]);
    const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const compositeFrameRef = useRef<number | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const pendingIceCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
    const iceServersRef = useRef<RTCIceServer[]>([]);

    function fillFormFromStream(stream: StreamRecord | null) {
        if (!stream) {
            setForm(emptyForm);
            return;
        }

        setForm({
            title: stream.title || '',
            description: stream.description || '',
            streamUrl: stream.streamUrl || '',
            playbackUrl: stream.playbackUrl || '',
            thumbnailUrl: stream.thumbnailUrl || '',
            tags: stream.tags || [],
            scheduledStartTime: stream.scheduledStartTime || '',
            scheduledEndTime: stream.scheduledEndTime || '',
        });
        setIsScheduled(!!stream.scheduledStartTime);
    }

    function formatStreamDate(value?: string) {
        if (!value) {
            return 'No date';
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return 'No date';
        }

        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(date);
    }

    async function attachLocalPreview(stream: MediaStream | null) {
        const video = localVideoRef.current;
        if (!video) {
            return;
        }

        localPreviewStreamRef.current = stream
            ? new MediaStream(stream.getVideoTracks())
            : null;

        video.srcObject = localPreviewStreamRef.current;
        video.muted = true;

        if (!localPreviewStreamRef.current) {
            return;
        }

        const startPlayback = async () => {
            try {
                await video.play();
            } catch {
                // muted local preview should usually autoplay, but keep stream attached if blocked
            }
        };

        if (video.readyState >= 1) {
            await startPlayback();
        } else {
            video.onloadedmetadata = () => {
                void startPlayback();
            };
        }
    }

    useEffect(() => {
        void load();
        void getIceServers().then((servers) => {
            iceServersRef.current = servers;
        });

        return () => {
            stopRealtimeBroadcast(false);
        };
    }, []);

    async function load() {
        setLoading(true);
        try {
            const [myChannel, myStreams] = await Promise.all([
                channelService.getMyChannel(),
                streamService.getMyStreams(),
            ]);

            setChannel(myChannel);
            setStreams(myStreams);
            const initialStream = myStreams.find((stream) => stream.isLive) ?? myStreams[0] ?? null;
            setSelectedStreamId(initialStream?._id ?? null);
            fillFormFromStream(initialStream);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to load creator data');
        } finally {
            setLoading(false);
        }
    }

    async function saveStream(makeLive: boolean) {
        if (!channel) {
            toast.error('Create your channel first');
            return null;
        }

        if (!form.title.trim()) {
            toast.error('Add a live session title first');
            return null;
        }

        setSaving(true);
        try {
            const payload = {
                channelId: channel._id,
                title: form.title.trim(),
                description: form.description.trim() || undefined,
                streamUrl: form.streamUrl.trim() || undefined,
                playbackUrl: form.playbackUrl.trim() || undefined,
                thumbnailUrl: form.thumbnailUrl.trim() || undefined,
                tags: form.tags,
                scheduledStartTime: isScheduled ? form.scheduledStartTime || undefined : undefined,
                scheduledEndTime: isScheduled ? form.scheduledEndTime || undefined : undefined,
            };

            let saved = currentStream
                ? await streamService.updateStream(currentStream._id, payload)
                : await streamService.createStream({ ...payload, isLive: false });

            if (makeLive && !saved.isLive) {
                saved = await streamService.startStream(saved._id);
            }

            if (!makeLive && saved.isLive) {
                saved = await streamService.endStream(saved._id);
            }

            setStreams((previous) => [saved, ...previous.filter((item) => item._id !== saved._id)]);
            setSelectedStreamId(saved._id);
            fillFormFromStream(saved);
            toast.success(makeLive ? 'Stream is live. Your watch link is ready.' : 'Stream draft saved');
            return saved;
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save stream');
            return null;
        } finally {
            setSaving(false);
        }
    }

    function cleanupPeer(targetId: string) {
        const peer = peerConnectionsRef.current.get(targetId);
        if (peer) {
            peer.onicecandidate = null;
            peer.close();
            peerConnectionsRef.current.delete(targetId);
        }
        pendingIceCandidatesRef.current.delete(targetId);
    }

    function stopCompositeRenderer() {
        if (compositeFrameRef.current) {
            cancelAnimationFrame(compositeFrameRef.current);
            compositeFrameRef.current = null;
        }
        compositeCanvasRef.current = null;
    }

    async function createScreenCameraBroadcastStream() {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        const screenVideo = document.createElement('video');
        screenVideo.srcObject = screenStream;
        screenVideo.muted = true;
        screenVideo.playsInline = true;
        await screenVideo.play();

        const cameraVideo = document.createElement('video');
        cameraVideo.srcObject = cameraStream;
        cameraVideo.muted = true;
        cameraVideo.playsInline = true;
        await cameraVideo.play();

        const canvas = document.createElement('canvas');
        const width = screenVideo.videoWidth || 1280;
        const height = screenVideo.videoHeight || 720;
        canvas.width = width;
        canvas.height = height;
        compositeCanvasRef.current = canvas;

        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Could not create the live video compositor');
        }

        const drawFrame = () => {
            context.clearRect(0, 0, width, height);
            context.drawImage(screenVideo, 0, 0, width, height);

            const overlayWidth = Math.max(width * 0.22, 220);
            const overlayHeight = overlayWidth * 0.5625;
            const margin = Math.max(width * 0.02, 18);
            const overlayX = width - overlayWidth - margin;
            const overlayY = height - overlayHeight - margin;

            context.fillStyle = 'rgba(0, 0, 0, 0.45)';
            context.fillRect(overlayX - 8, overlayY - 8, overlayWidth + 16, overlayHeight + 16);
            context.drawImage(cameraVideo, overlayX, overlayY, overlayWidth, overlayHeight);

            context.strokeStyle = '#39ff14';
            context.lineWidth = 3;
            context.strokeRect(overlayX, overlayY, overlayWidth, overlayHeight);

            compositeFrameRef.current = requestAnimationFrame(drawFrame);
        };

        drawFrame();

        const composedStream = canvas.captureStream(30);
        [...screenStream.getAudioTracks(), ...cameraStream.getAudioTracks()].forEach((track) => {
            composedStream.addTrack(track);
        });

        sourceStreamsRef.current = [screenStream, cameraStream];

        screenStream.getVideoTracks().forEach((track) => {
            track.onended = () => {
                void stopRealtimeBroadcast(true);
            };
        });

        cameraStream.getVideoTracks().forEach((track) => {
            track.onended = () => {
                void stopRealtimeBroadcast(true);
            };
        });

        return composedStream;
    }

    async function ensureSocket() {
        if (socketRef.current) {
            return socketRef.current;
        }

        const socket = createLiveSocket();
        socketRef.current = socket;

        socket.on('viewer-joined', async ({ viewerId, channelId }: { viewerId: string; channelId: string }) => {
            if (!channel || channel._id !== channelId || !localStreamRef.current) {
                return;
            }

            const peer = new RTCPeerConnection({ iceServers: iceServersRef.current.length ? iceServersRef.current : undefined });
            peerConnectionsRef.current.set(viewerId, peer);

            peer.onconnectionstatechange = () => {
                console.info('broadcaster connectionState', viewerId, peer.connectionState);
            };

            peer.oniceconnectionstatechange = () => {
                console.info('broadcaster iceConnectionState', viewerId, peer.iceConnectionState);
            };

            localStreamRef.current.getTracks().forEach((track) => {
                peer.addTrack(track, localStreamRef.current as MediaStream);
            });

            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('ice-candidate', {
                        targetId: viewerId,
                        channelId,
                        candidate: event.candidate.toJSON(),
                    });
                }
            };

            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            socket.emit('signal-offer', {
                targetId: viewerId,
                channelId,
                description: offer,
            });
        });

        socket.on('signal-answer', async ({ sourceId, description }: { sourceId: string; description: RTCSessionDescriptionInit }) => {
            const peer = peerConnectionsRef.current.get(sourceId);
            if (!peer || !description) {
                return;
            }

            await peer.setRemoteDescription(new RTCSessionDescription(description));

            const pendingCandidates = pendingIceCandidatesRef.current.get(sourceId) || [];
            for (const candidate of pendingCandidates) {
                await peer.addIceCandidate(new RTCIceCandidate(candidate));
            }
            pendingIceCandidatesRef.current.delete(sourceId);
        });

        socket.on('ice-candidate', async ({ sourceId, candidate }: { sourceId: string; candidate: RTCIceCandidateInit }) => {
            const peer = peerConnectionsRef.current.get(sourceId);
            if (!peer || !candidate) {
                return;
            }

            if (!peer.remoteDescription) {
                const pending = pendingIceCandidatesRef.current.get(sourceId) || [];
                pending.push(candidate);
                pendingIceCandidatesRef.current.set(sourceId, pending);
                return;
            }

            await peer.addIceCandidate(new RTCIceCandidate(candidate));
        });

        socket.on('viewer-left', ({ viewerId }: { viewerId: string }) => {
            cleanupPeer(viewerId);
        });

        return socket;
    }

    async function startRealtimeBroadcast(mode: 'screen' | 'camera' | 'screen-camera') {
        if (!channel) {
            toast.error('Create your channel first');
            return;
        }

        const saved = await saveStream(true);
        if (!saved) {
            return;
        }

        try {
            const stream = mode === 'screen'
                ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                : mode === 'camera'
                    ? await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                    : await createScreenCameraBroadcastStream();

            localStreamRef.current = stream;
            await attachLocalPreview(stream);

            if (mode !== 'screen-camera') {
                stream.getVideoTracks().forEach((track) => {
                    track.onended = () => {
                        void stopRealtimeBroadcast(true);
                    };
                });
            }

            const socket = await ensureSocket();
            const joinBroadcasterChannel = () => {
                socket.emit('join-channel', {
                    channelId: channel._id,
                    role: 'broadcaster',
                });
            };

            if (socket.connected) {
                joinBroadcasterChannel();
            } else {
                socket.once('connect', joinBroadcasterChannel);
            }

            setBroadcastMode(mode);
            setIsBroadcasting(true);
            toast.success(
                mode === 'screen'
                    ? 'Screen sharing is live'
                    : mode === 'camera'
                        ? 'Camera live is active'
                        : 'Screen and camera live is active',
            );
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not start live broadcast');
        }
    }

    async function copyWatchLink() {
        if (!watchUrl) {
            toast.error('Create your channel first');
            return;
        }

        try {
            await navigator.clipboard.writeText(watchUrl);
            toast.success('Watch link copied');
        } catch {
            toast.error('Could not copy the link');
        }
    }

    function resetForm() {
        setSelectedStreamId(null);
        setForm(emptyForm);
        toast.success('Live form reset');
    }

    async function stopRealtimeBroadcast(updateServer: boolean) {
        peerConnectionsRef.current.forEach((_, targetId) => cleanupPeer(targetId));

        if (socketRef.current) {
            socketRef.current.emit('leave-channel');
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
        }

        sourceStreamsRef.current.forEach((stream) => {
            stream.getTracks().forEach((track) => track.stop());
        });
        sourceStreamsRef.current = [];
        stopCompositeRenderer();
        pendingIceCandidatesRef.current.clear();

        if (localVideoRef.current) {
            void attachLocalPreview(null);
        }

        setIsBroadcasting(false);
        setBroadcastMode(null);

        if (updateServer && currentStream) {
            try {
                const ended = await streamService.endStream(currentStream._id);
                setStreams((previous) => [ended, ...previous.filter((item) => item._id !== ended._id)]);
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to end stream');
            }
        }
    }

    async function endLive() {
        setSaving(true);
        try {
            await stopRealtimeBroadcast(!!currentStream);
            toast.success('Stream ended');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to end stream');
        } finally {
            setSaving(false);
        }
    }

    async function deleteCurrentStream() {
        if (!currentStream) {
            toast.error('No stream to delete');
            return;
        }

        setSaving(true);
        try {
            await stopRealtimeBroadcast(false);
            await streamService.deleteStream(currentStream._id);
            setStreams((previous) => previous.filter((item) => item._id !== currentStream._id));
            setSelectedStreamId(null);
            setForm(emptyForm);
            toast.success('Stream deleted');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete stream');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="animate-fade-in max-w-[1680px] mx-auto space-y-12 pb-10 selection:bg-primary/30 selection:text-white relative z-10">
            {/* Elite Go Live Header */}
            <header className="relative py-16 px-10 rounded-[3rem] bg-[#0c0e11]/40 backdrop-blur-3xl border border-white/5 overflow-hidden group shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)]">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/20 p-2.5 rounded-2xl ring-1 ring-primary/30 shadow-lg shadow-primary/10">
                                <Sparkles className="w-6 h-6 text-primary" />
                            </div>
                            <span className="text-xs font-black text-primary uppercase tracking-[0.3em]">University Creator Elite</span>
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-[0.85] italic">
                                Go <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-hover to-primary shadow-sm">Live</span>
                            </h1>
                        </div>
                        <p className="text-lg md:text-xl text-text-muted font-medium max-w-xl leading-relaxed border-l-2 border-primary/20 pl-6 py-2">
                            <span className="text-white font-black uppercase tracking-tight">Diffusez votre talent.</span> <br />
                            Tableau de diffusion WebRTC : configure ton titre et ta chaîne, puis lance l’écran, la caméra ou les deux.
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-5 shrink-0">
                        {channel && (
                            <div className={cn(
                                "flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all duration-500 shadow-xl",
                                currentStream?.isLive
                                    ? "bg-primary/10 border-primary/20 shadow-primary/5"
                                    : "bg-white/5 border-white/5 shadow-black/20"
                            )}>
                                {currentStream?.isLive && <div className="w-2.5 h-2.5 bg-primary rounded-full animate-ping shadow-[0_0_10px_rgba(0,255,135,0.8)]" />}
                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-[0.2em]",
                                    currentStream?.isLive ? "text-primary" : "text-white/30"
                                )}>
                                    {currentStream?.isLive ? "En Direct — Studio Actif" : "Hors Ligne — Prêt à diffuser"}
                                </span>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-3 lg:justify-end">
                            {channel ? (
                                <>
                                    <Link to="/player/all-lives">
                                        <Button variant="outline" className="h-14 px-8 rounded-2xl group/btn border-white/5 bg-white/5 backdrop-blur hover:border-white/20 transition-all">
                                            <Tv className="mr-3 h-5 w-5 opacity-50 group-hover/btn:opacity-100 group-hover/btn:scale-110 transition-all" />
                                            <span className="text-xs font-black uppercase tracking-widest text-white/70 group-hover/btn:text-white">Parcourir</span>
                                        </Button>
                                    </Link>
                                    <Link to={`/watch/${channel._id}`}>
                                        <Button variant="outline" className="h-14 px-8 rounded-2xl group/btn border-white/5 bg-white/5 backdrop-blur hover:border-white/20 transition-all">
                                            <span className="text-xs font-black uppercase tracking-widest text-white/70 group-hover/btn:text-white">Page Spectateur</span>
                                        </Button>
                                    </Link>
                                </>
                            ) : (
                                <Link to="/player/channel">
                                    <Button size="lg" className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-primary/20">Créer une chaîne</Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="rounded-2xl border border-white/10 bg-surface/80 p-12 text-center text-text-muted backdrop-blur-sm">
                    Chargement du studio…
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Pipeline steps */}
                    <div className="grid gap-6 md:grid-cols-3">
                        {[
                            { step: 1, title: 'Chaîne', desc: channel ? `Prêt : ${channel.name}` : 'Crée une chaîne.', icon: Radio, active: !!channel },
                            { step: 2, title: 'Infos du stream', desc: 'Titre & détails publics.', icon: Link2, active: !!form.title },
                            { step: 3, title: 'Source vidéo', desc: 'Lance ta diffusion.', icon: Monitor, active: isBroadcasting }
                        ].map((item, i) => (
                            <div key={i} className={cn(
                                "group relative overflow-hidden rounded-3xl border p-7 transition-all duration-500",
                                item.active
                                    ? "bg-primary/5 border-primary/20 shadow-lg shadow-primary/5"
                                    : "bg-[#0c0e11]/40 backdrop-blur-xl border-white/5 hover:border-white/10 shadow-xl"
                            )}>
                                <div className={cn(
                                    "mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-500",
                                    item.active ? "bg-primary/20 border-primary/30 text-primary shadow-lg shadow-primary/20" : "bg-white/5 border-white/10 text-white/30"
                                )}>
                                    <item.icon className="h-7 w-7" />
                                </div>
                                <div className="space-y-1">
                                    <p className={cn("text-[10px] font-black uppercase tracking-[0.3em]", item.active ? "text-primary" : "text-white/20")}>Étape {item.step}</p>
                                    <h2 className="text-xl font-black text-white uppercase tracking-tight italic">{item.title}</h2>
                                    <p className="text-sm font-medium text-text-muted/80">{item.desc}</p>
                                </div>
                                {item.step === 3 && (
                                    <div className="mt-6 flex flex-wrap gap-2.5">
                                        <button onClick={() => void copyWatchLink()} disabled={!channel} className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-wider text-white/40 hover:bg-white/10 transition-all hover:text-white disabled:opacity-50">
                                            Copier le lien
                                        </button>
                                        {channel && (
                                            <Link to={`/watch/${channel._id}`}>
                                                <button className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-wider text-primary hover:bg-primary/20 transition-all">
                                                    Ouvrir Watch
                                                </button>
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="grid gap-10 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
                        <div className="space-y-10 rounded-[2.5rem] border border-white/10 bg-[#0c0e11]/60 backdrop-blur-2xl p-10 md:p-14 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_15px_rgba(0,255,135,0.5)]" />
                                    <label className="text-xs font-black uppercase tracking-[0.3em] text-white/40">Stream Setup</label>
                                </div>
                                <h3 className="text-2xl font-black text-white uppercase italic">Détails & Sources</h3>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/60 ml-1 italic group-hover:text-primary transition-colors">Fiche publique spectateur</p>
                                    <div className="space-y-4">
                                        <Input
                                            placeholder="Titre de votre live (obligatoire)"
                                            className="h-16 bg-[#16191d]/50 border-white/5 rounded-2xl px-8 text-lg font-bold placeholder:text-white/5 focus:ring-primary/20 focus:border-primary/40 transition-all"
                                            value={form.title}
                                            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                                        />
                                        <Textarea
                                            placeholder="Description détaillée de votre session..."
                                            rows={4}
                                            className="w-full bg-[#16191d]/50 border-white/5 rounded-2xl px-8 py-6 text-base font-medium placeholder:text-white/5 focus:ring-primary/20 focus:border-primary/40 transition-all resize-none"
                                            value={form.description}
                                            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                                <div className="space-y-6">
                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/60 ml-1 italic">Paramètres avancés & Metadata</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            placeholder="URL de preview (optionnel)"
                                            className="h-14 bg-[#16191d]/30 border-white/5 rounded-2xl px-6 font-medium placeholder:text-white/5 focus:ring-primary/20"
                                            value={form.streamUrl}
                                            onChange={(event) => setForm((current) => ({ ...current, streamUrl: event.target.value }))}
                                        />
                                        <Input
                                            placeholder="Thumbnail personnalisée (URL)"
                                            className="h-14 bg-[#16191d]/30 border-white/5 rounded-2xl px-6 font-medium placeholder:text-white/5 focus:ring-primary/20"
                                            value={form.thumbnailUrl}
                                            onChange={(event) => setForm((current) => ({ ...current, thumbnailUrl: event.target.value }))}
                                        />
                                        <div className="md:col-span-2 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-4 bg-primary/40 rounded-full" />
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Séléctionnez vos tags</label>
                                            </div>
                                            <div className="flex flex-wrap gap-2 p-6 rounded-3xl bg-[#16191d]/30 border border-white/5 shadow-inner">
                                                {PREDEFINED_TAGS.map((tag) => {
                                                    const isSelected = form.tags.includes(tag);
                                                    return (
                                                        <button
                                                            key={tag}
                                                            type="button"
                                                            onClick={() => {
                                                                setForm((prev) => ({
                                                                    ...prev,
                                                                    tags: isSelected
                                                                        ? prev.tags.filter((t) => t !== tag)
                                                                        : [...prev.tags, tag],
                                                                }));
                                                            }}
                                                            className={cn(
                                                                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border",
                                                                isSelected
                                                                    ? "bg-primary text-black border-primary shadow-[0_0_20px_rgba(0,255,135,0.2)] scale-105"
                                                                    : "bg-white/5 text-white/40 border-white/5 hover:border-white/10 hover:text-white"
                                                            )}
                                                        >
                                                            {isSelected && <Check size={10} strokeWidth={4} />}
                                                            {tag}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <p className="text-[9px] text-white/20 font-medium italic ml-2">Ces tags aideront les spectateurs à découvrir votre contenu dans l'arène.</p>
                                        </div>

                                        <div className="md:col-span-2 pt-4">
                                            <div className="p-8 rounded-[2rem] bg-black/40 border border-white/5 space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        <h4 className="text-sm font-black text-white uppercase tracking-wider italic">Planification du Direct</h4>
                                                        <p className="text-[11px] text-text-muted/60 font-medium">Annoncez votre live à l'avance pour votre communauté.</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsScheduled(!isScheduled)}
                                                        className={cn(
                                                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                                            isScheduled ? "bg-primary" : "bg-white/10"
                                                        )}
                                                    >
                                                        <span className={cn(
                                                            "inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                            isScheduled ? "translate-x-5" : "translate-x-0"
                                                        )} />
                                                    </button>
                                                </div>

                                                {isScheduled && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-500">
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-2 text-primary">
                                                                <Calendar size={14} />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">Début programmé</span>
                                                            </div>
                                                            <input
                                                                type="datetime-local"
                                                                className="w-full h-12 bg-[#16191d]/50 border border-white/5 rounded-xl px-4 text-xs font-bold text-white focus:border-primary/40 focus:outline-none [color-scheme:dark]"
                                                                value={form.scheduledStartTime}
                                                                onChange={(e) => setForm(f => ({ ...f, scheduledStartTime: e.target.value }))}
                                                            />
                                                        </div>
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-2 text-white/30">
                                                                <Clock size={14} />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">Fin estimée</span>
                                                            </div>
                                                            <input
                                                                type="datetime-local"
                                                                className="w-full h-12 bg-[#16191d]/50 border border-white/5 rounded-xl px-4 text-xs font-bold text-white focus:border-primary/40 focus:outline-none [color-scheme:dark]"
                                                                value={form.scheduledEndTime}
                                                                onChange={(e) => setForm(f => ({ ...f, scheduledEndTime: e.target.value }))}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Button type="button" size="lg" variant="outline" className="h-16 rounded-2xl border-white/5 bg-white/5 hover:border-white/20 font-black uppercase tracking-widest text-xs" onClick={resetForm}>
                                        Réinitialiser
                                    </Button>
                                    <Button type="button" size="lg" isLoading={saving} className="h-16 rounded-2xl font-black uppercase tracking-widest text-xs" onClick={() => void saveStream(false)}>
                                        Sauvegarder
                                    </Button>

                                    <div className="sm:col-span-2 h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent my-4" />

                                    <Button type="button" size="lg" variant="outline" className="h-20 rounded-2xl border-primary/20 bg-primary/5 hover:bg-primary/10 font-black uppercase tracking-widest text-xs group" onClick={() => void startRealtimeBroadcast('screen')} disabled={!channel}>
                                        <div className="flex flex-col items-center">
                                            <Monitor className="mb-1 h-5 w-5 group-hover:scale-110 transition-transform" />
                                            Partage d'Acran
                                        </div>
                                    </Button>
                                    <Button type="button" size="lg" variant="outline" className="h-20 rounded-2xl border-primary/20 bg-primary/5 hover:bg-primary/10 font-black uppercase tracking-widest text-xs group" onClick={() => void startRealtimeBroadcast('camera')} disabled={!channel}>
                                        <div className="flex flex-col items-center">
                                            <Tv className="mb-1 h-5 w-5 group-hover:scale-110 transition-transform" />
                                            Caméra Live
                                        </div>
                                    </Button>
                                    <Button type="button" size="lg" className="sm:col-span-2 h-20 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20" onClick={() => void startRealtimeBroadcast('screen-camera')} disabled={!channel}>
                                        GO LIVE — Écran + Caméra
                                    </Button>

                                    {currentStream?.isLive && (
                                        <Button type="button" size="lg" variant="danger" className="sm:col-span-2 h-16 rounded-2xl font-black uppercase tracking-widest text-xs animate-pulse" onClick={() => void endLive()}>
                                            Mettre fin au live maintenant
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 rounded-2xl bg-black/40 border border-white/5 p-6 space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 italic">Guide de l'Elite Streamer</p>
                                <ul className="text-[11px] text-text-muted/60 space-y-2 leading-relaxed">
                                    <li className="flex gap-2">
                                        <span className="text-primary font-black">→</span>
                                        <span>Garde cet onglet ouvert pour maintenir le tunneling WebRTC actif.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-primary font-black">→</span>
                                        <span>Les spectateurs reçoivent la source composite (image et son) directement.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="space-y-6 xl:sticky xl:top-4 xl:self-start">
                            <div className="overflow-hidden rounded-[2.5rem] bg-[#0c0e11]/80 backdrop-blur-2xl border border-white/5 shadow-2xl relative">
                                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                                <div className="bg-white/5 px-8 pt-10 pb-6 border-b border-white/5">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Live Monitor</p>
                                    <h3 className="mt-1 text-2xl font-black text-white uppercase italic">Aperçu & Statut</h3>
                                    <p className="text-xs font-medium text-text-muted/60 mt-1">Données temps réel de votre session.</p>
                                </div>

                                <div className="p-8 space-y-6">
                                    {isBroadcasting && (
                                        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 animate-in fade-in zoom-in duration-500">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-white font-black text-sm uppercase tracking-tight">Signal Actif</p>
                                                    <p className="text-[11px] text-text-muted leading-tight">
                                                        {broadcastMode === 'screen' ? 'Partage d\'écran' : broadcastMode === 'camera' ? 'Webcam actue' : 'Composite Mix'} diffusé aux spectateurs.
                                                    </p>
                                                </div>
                                                <Badge className="bg-primary text-black font-black text-[10px] px-4 rounded-lg uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.3)]">WEBRTC LIVE</Badge>
                                            </div>
                                        </div>
                                    )}
                                    {isBroadcasting && (
                                        <video
                                            ref={localVideoRef}
                                            autoPlay
                                            muted
                                            playsInline
                                            controls
                                            className="w-full aspect-video rounded-2xl border border-primary/20 bg-black"
                                        />
                                    )}
                                    {embed?.type === 'iframe' && (
                                        <iframe
                                            src={embed.src}
                                            title="Live preview"
                                            className="w-full aspect-video rounded-2xl border border-white/10 bg-black"
                                            allow="autoplay; fullscreen"
                                        />
                                    )}
                                    {embed?.type === 'video' && (
                                        <video src={embed.src} controls className="w-full aspect-video rounded-2xl border border-white/10 bg-black" />
                                    )}
                                    {embed?.type === 'link' && (
                                        <a href={embed.src} target="_blank" rel="noreferrer" className="block p-4 rounded-2xl border border-white/10 text-primary">
                                            Open external player
                                        </a>
                                    )}
                                    {!embed && (
                                        <div className="relative aspect-video overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-br from-[#141820] via-black to-[#0a0c10] ring-1 ring-inset ring-white/[0.04]">
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
                                                <div className="rounded-full border border-primary/25 bg-primary/5 p-3 text-primary">
                                                    <Tv className="h-8 w-8 opacity-80" />
                                                </div>
                                                <p className="text-sm font-semibold text-white/80">Aucun aperçu</p>
                                                <p className="max-w-xs text-xs text-text-muted">
                                                    Ajoute une URL de lecture valide pour prévisualiser le lecteur, ou lance un mode
                                                    WebRTC ci-contre.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {currentStream && (
                                        <div className="rounded-2xl border border-white/10 p-4">
                                            <div className="flex items-center justify-between gap-3 mb-3">
                                                <h2 className="text-xl font-black text-white">{currentStream.title}</h2>
                                                <Badge variant={currentStream.isLive ? 'success' : 'secondary'}>
                                                    {currentStream.isLive ? 'Live' : 'Saved Only'}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-text-muted mt-2">{currentStream.description}</p>
                                            <div className="mt-4 text-xs text-white/50 space-y-1 break-all">
                                                <p>Channel ID: {channel?._id || '-'}</p>
                                                <p>Stream ID: {currentStream._id}</p>
                                                <p>Watch URL: {watchUrl || '-'}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-4">
                                                {(currentStream.tags || []).map((tag) => (
                                                    <Link key={tag} to={`/player/all-lives?category=${encodeURIComponent(tag)}`}>
                                                        <Badge variant="secondary" className="hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer">{tag}</Badge>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/[0.07] bg-[#0c0e11] p-4 shadow-inner shadow-black/30 sm:p-5">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <p className="text-xs font-black uppercase tracking-[0.25em] text-white/40">Bibliothèque</p>
                                        <Badge variant="secondary">{streams.length}</Badge>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-white/35">Trier</label>
                                        <select
                                            value={savedSortMode}
                                            onChange={(e) => setSavedSortMode(e.target.value as LiveSortMode)}
                                            className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-primary/40"
                                        >
                                            <option value="date-desc">Date (récent)</option>
                                            <option value="date-asc">Date (ancien)</option>
                                            <option value="category-asc">Catégorie A→Z</option>
                                            <option value="category-desc">Catégorie Z→A</option>
                                        </select>
                                    </div>
                                </div>
                                {streams.length === 0 && (
                                    <p className="text-sm text-text-muted">No saved lives yet. Save a draft first and it will appear here.</p>
                                )}
                                <div className="space-y-2 max-h-[min(520px,55vh)] overflow-y-auto pr-1">
                                    {sortedSavedStreams.map((stream) => {
                                        const isSelected = currentStream?._id === stream._id;
                                        const cat = getStreamCategory(stream);
                                        return (
                                            <button
                                                key={stream._id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedStreamId(stream._id);
                                                    fillFormFromStream(stream);
                                                }}
                                                className={`w-full rounded-xl border text-left transition overflow-hidden flex ${isSelected
                                                    ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                                                    : 'border-white/10 bg-black/10 hover:border-white/25'
                                                    }`}
                                            >
                                                <div className="relative w-28 shrink-0 aspect-video bg-gradient-to-br from-white/5 to-black">
                                                    {stream.thumbnailUrl ? (
                                                        <img src={stream.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="absolute inset-0 flex items-center justify-center text-lg font-black text-white/15">
                                                            {stream.title.slice(0, 1).toUpperCase()}
                                                        </div>
                                                    )}
                                                    {stream.isLive && (
                                                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-[#e91916] text-[9px] font-black text-white uppercase">
                                                            Live
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 p-3 flex flex-col justify-center gap-1">
                                                    <p className="font-bold text-white text-sm line-clamp-2 leading-snug">{stream.title}</p>
                                                    <p className="text-[11px] text-white/45 font-medium">{cat}</p>
                                                    <p className="text-xs text-text-muted line-clamp-1">{stream.description || 'No description yet'}</p>
                                                    <p className="text-[10px] text-white/35">
                                                        {stream.isLive ? 'Live depuis' : stream.scheduledStartTime ? 'Programmé le' : 'Sauvegardé le'} {formatStreamDate(stream.scheduledStartTime || stream.updatedAt || stream.createdAt || stream.startedAt)}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1 pt-0.5">
                                                        {(stream.tags || []).slice(0, 3).map((tag) => (
                                                            <Link
                                                                key={tag}
                                                                to={`/player/all-lives?category=${encodeURIComponent(tag)}`}
                                                                className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10 hover:border-primary/40 hover:text-primary transition-colors"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {tag}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="shrink-0 pr-3 flex items-center">
                                                    <Badge variant={stream.isLive ? 'success' : 'secondary'}>
                                                        {stream.isLive ? 'Live' : 'Saved'}
                                                    </Badge>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
