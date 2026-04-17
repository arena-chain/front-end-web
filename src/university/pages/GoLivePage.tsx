import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge, Button, Input, Textarea } from '../../components/ui/core';
import { createLiveSocket, getIceServers } from '../../lib/live';
import { getStreamEmbed, pickPreferredStreamUrl } from '../../lib/stream';
import { channelService, type ChannelRecord } from '../../services/channel.service';
import { streamService, type StreamRecord } from '../../services/stream.service';
import type { Socket } from 'socket.io-client';
import { getStreamCategory, sortLiveStreams, type LiveSortMode } from '../../lib/streamBrowse';
import { cn } from '../../lib/utils';
import { Link2, Monitor, Radio, Sparkles, Tv, Check, Copy, Trash2, Plus, Zap, Activity, Mic, MicOff, Video, VideoOff, Maximize, Upload, X } from 'lucide-react';
import { resolveBackendAssetUrl } from '../../lib/apiBase';

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
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isCamMuted, setIsCamMuted] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [savedSortMode, setSavedSortMode] = useState<LiveSortMode>('date-desc');
    const [isSetupOpen, setIsSetupOpen] = useState(true);
    const [isScheduled, setIsScheduled] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [forceStart, setForceStart] = useState(false);

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

    const { isFutureScheduled, timeUntilStart } = useMemo(() => {
        if (!isScheduled || !form.scheduledStartTime) {
            return { isFutureScheduled: false, timeUntilStart: '' };
        }
        const start = new Date(form.scheduledStartTime);
        if (Number.isNaN(start.getTime())) {
            return { isFutureScheduled: false, timeUntilStart: '' };
        }
        const diff = start.getTime() - currentTime.getTime();
        if (diff <= 0) {
            return { isFutureScheduled: false, timeUntilStart: '' };
        }

        const totalSeconds = Math.floor(diff / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return {
            isFutureScheduled: true,
            timeUntilStart: `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds}s`
        };
    }, [isScheduled, form.scheduledStartTime, currentTime]);

    const isLiveDisabled = isFutureScheduled && !forceStart;
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

        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => {
            clearInterval(timer);
            void stopRealtimeBroadcast(false);
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
            if (initialStream) {
                setSelectedStreamId(initialStream._id);
                fillFormFromStream(initialStream);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Loading failed');
        } finally {
            setLoading(false);
        }
    }

    async function saveStream(setLive: boolean) {
        setSaving(true);
        try {
            const streamData: any = {
                ...form,
                channelId: channel?._id || '',
                isLive: setLive,
            };

            // Sanitize URLs and Dates to avoid backend validation errors on empty strings
            if (!streamData.thumbnailUrl) delete streamData.thumbnailUrl;
            if (!streamData.streamUrl) delete streamData.streamUrl;
            if (!streamData.playbackUrl) delete streamData.playbackUrl;
            if (!streamData.scheduledStartTime) delete streamData.scheduledStartTime;
            if (!streamData.scheduledEndTime) delete streamData.scheduledEndTime;

            let saved: StreamRecord;
            if (currentStream && (currentStream.isLive || selectedStreamId)) {
                saved = await streamService.update(currentStream._id, streamData);
                toast.success('Live details updated');
            } else {
                saved = await streamService.create(streamData);
                setSelectedStreamId(saved._id);
                toast.success('Stream draft created');
            }

            setStreams((previous) => [
                saved,
                ...previous.filter((item) => item._id !== saved._id),
            ]);
            setIsSetupOpen(false);
            return saved;
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Save failed');
            return null;
        } finally {
            setSaving(false);
        }
    }

    async function deleteCurrentStream() {
        if (!currentStream) return;
        if (!window.confirm('Etes-vous sûr de vouloir supprimer ce flux ?')) return;

        setSaving(true);
        try {
            await streamService.delete(currentStream._id);
            setStreams(prev => prev.filter(s => s._id !== currentStream._id));
            resetForm();
            toast.success('Stream supprimé');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Suppression échouée');
        } finally {
            setSaving(false);
        }
    }

    async function ensureSocket() {
        if (socketRef.current?.connected) {
            return socketRef.current;
        }

        const socket = createLiveSocket();
        socketRef.current = socket;

        socket.on('viewer-joined', async ({ viewerId }: { viewerId: string }) => {
            console.info('broadcaster: viewer joined', viewerId);
            const peer = new RTCPeerConnection({ iceServers: iceServersRef.current });
            peerConnectionsRef.current.set(viewerId, peer);

            peer.oniceconnectionstatechange = () => {
                console.info('broadcaster iceConnectionState', viewerId, peer.iceConnectionState);
            };

            localStreamRef.current?.getTracks().forEach((track) => {
                peer.addTrack(track, localStreamRef.current as MediaStream);
            });

            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('ice-candidate', {
                        targetId: viewerId,
                        channelId: channel?._id,
                        candidate: event.candidate.toJSON(),
                    });
                }
            };

            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            socket.emit('signal-offer', {
                targetId: viewerId,
                channelId: channel?._id,
                description: offer,
            });
        });

        socket.on('signal-answer', async ({ sourceId, description }: { sourceId: string; description: RTCSessionDescriptionInit }) => {
            const peer = peerConnectionsRef.current.get(sourceId);
            if (!peer || !description) return;

            await peer.setRemoteDescription(new RTCSessionDescription(description));
            const pendingCandidates = pendingIceCandidatesRef.current.get(sourceId) || [];
            for (const candidate of pendingCandidates) {
                await peer.addIceCandidate(new RTCIceCandidate(candidate));
            }
            pendingIceCandidatesRef.current.delete(sourceId);
        });

        socket.on('ice-candidate', async ({ sourceId, candidate }: { sourceId: string; candidate: RTCIceCandidateInit }) => {
            const peer = peerConnectionsRef.current.get(sourceId);
            if (!peer || !candidate) return;

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

    function cleanupPeer(viewerId: string) {
        const peer = peerConnectionsRef.current.get(viewerId);
        if (peer) {
            peer.close();
            peerConnectionsRef.current.delete(viewerId);
        }
        pendingIceCandidatesRef.current.delete(viewerId);
    }

    async function replaceTrackInPeers(newStream: MediaStream) {
        const videoTrack = newStream.getVideoTracks()[0];
        const audioTrack = newStream.getAudioTracks()[0];

        for (const peer of peerConnectionsRef.current.values()) {
            const senders = peer.getSenders();
            const videoSender = senders.find(s => s.track?.kind === 'video');
            const audioSender = senders.find(s => s.track?.kind === 'audio');

            if (videoSender && videoTrack) await videoSender.replaceTrack(videoTrack);
            if (audioSender && audioTrack) await audioSender.replaceTrack(audioTrack);
        }
    }

    async function toggleMic() {
        const newState = !isMicMuted;
        setIsMicMuted(newState);
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !newState);
        }
        toast.info(newState ? 'Microphone muet' : 'Microphone activé');
    }

    async function toggleCam() {
        const newState = !isCamMuted;
        setIsCamMuted(newState);
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(t => t.enabled = !newState);
        }
        toast.info(newState ? 'Caméra désactivée' : 'Caméra activée');
    }

    async function toggleFullscreen() {
        if (!localVideoRef.current) return;
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        } else {
            await localVideoRef.current.requestFullscreen();
        }
    }

    async function createScreenCameraBroadcastStream(): Promise<MediaStream> {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        sourceStreamsRef.current = [screenStream, cameraStream];

        const canvas = document.createElement('canvas');
        canvas.width = 1920;
        canvas.height = 1080;
        compositeCanvasRef.current = canvas;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get 2d context for composite broadcast');
        }

        const screenVideo = document.createElement('video');
        screenVideo.srcObject = screenStream;
        void screenVideo.play();

        const cameraVideo = document.createElement('video');
        cameraVideo.srcObject = cameraStream;
        void cameraVideo.play();

        const render = () => {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
            ctx.drawImage(cameraVideo, canvas.width - 420, canvas.height - 320, 400, 300);
            compositeFrameRef.current = requestAnimationFrame(render);
        };
        render();

        const compositeVideoTrack = canvas.captureStream(30).getVideoTracks()[0];
        const combinedAudioContext = new AudioContext();
        const destination = combinedAudioContext.createMediaStreamDestination();

        if (screenStream.getAudioTracks().length > 0) {
            combinedAudioContext.createMediaStreamSource(screenStream).connect(destination);
        }
        if (cameraStream.getAudioTracks().length > 0) {
            combinedAudioContext.createMediaStreamSource(cameraStream).connect(destination);
        }

        const compositeStream = new MediaStream([compositeVideoTrack, ...destination.stream.getAudioTracks()]);

        compositeStream.getVideoTracks()[0].onended = () => {
            void stopRealtimeBroadcast(true);
        };

        return compositeStream;
    }

    function stopCompositeRenderer() {
        if (compositeFrameRef.current) {
            cancelAnimationFrame(compositeFrameRef.current);
            compositeFrameRef.current = null;
        }
        compositeCanvasRef.current = null;
    }

    async function startRealtimeBroadcast(mode: 'screen' | 'camera' | 'screen-camera') {
        if (!channel) {
            toast.error('Create your channel first');
            return;
        }

        // If already broadcasting the same mode, do nothing
        if (isBroadcasting && broadcastMode === mode) return;

        try {
            const newStream = mode === 'screen'
                ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                : mode === 'camera'
                    ? await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                    : await createScreenCameraBroadcastStream();

            // Apply current mute states to new tracks
            newStream.getAudioTracks().forEach(t => t.enabled = !isMicMuted);
            newStream.getVideoTracks().forEach(t => t.enabled = !isCamMuted);

            if (isBroadcasting) {
                // SWITCHING MODE
                await replaceTrackInPeers(newStream);

                // Stop old tracks
                if (localStreamRef.current) {
                    localStreamRef.current.getTracks().forEach(t => t.stop());
                }
                sourceStreamsRef.current.forEach(s => s.getTracks().forEach(t => t.stop()));

                localStreamRef.current = newStream;
                await attachLocalPreview(newStream);
                setBroadcastMode(mode);
                toast.success(`Mode switched to ${mode}`);
            } else {
                // STARTING FRESH
                const saved = await saveStream(true);
                if (!saved) {
                    newStream.getTracks().forEach(t => t.stop());
                    return;
                }

                localStreamRef.current = newStream;
                await attachLocalPreview(newStream);

                const socket = await ensureSocket();
                const joinBroadcasterChannel = () => {
                    socket.emit('join-channel', {
                        channelId: channel?._id,
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
                toast.success('Live broadcast started');
            }

            // Set up onended for new main stream tracks
            if (mode !== 'screen-camera') {
                newStream.getVideoTracks().forEach((track) => {
                    track.onended = () => {
                        void stopRealtimeBroadcast(true);
                    };
                });
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not switch/start live');
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

    return (
        <div className="animate-fade-in max-w-[1680px] mx-auto space-y-12 pb-20 selection:bg-primary/30 selection:text-white relative z-10">
            {/* Hero Section: GO LIVE */}
            <header className="relative pt-16 pb-8 px-4 text-center space-y-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">University Creator Elite</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none italic">
                        Go <span className="text-primary drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]">Live</span>
                    </h1>
                    <p className="text-sm md:text-base text-text-muted font-medium max-w-lg leading-relaxed border-l-2 border-primary/20 pl-4 py-1 mx-auto">
                        Diffusez votre talent. Configurez votre session et lancez votre stream en quelques clics.
                    </p>
                </div>

                {channel && (
                    <div className="flex justify-center pt-4">
                        <div className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-500 bg-[#141414]",
                            currentStream?.isLive ? "border-primary/50 shadow-[0_0_10px_rgba(34,197,94,0.15)]" : "border-white/5"
                        )}>
                            <div className={cn(
                                "w-2 h-2 rounded-full",
                                currentStream?.isLive ? "bg-primary animate-pulse" : "bg-white/20"
                            )} />
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-[0.1em]",
                                currentStream?.isLive ? "text-primary" : "text-white/40"
                            )}>
                                {currentStream?.isLive ? "Signal Actif — En Direct" : "Studio Prêt — Hors ligne"}
                            </span>
                        </div>
                    </div>
                )}
            </header>

            {loading ? (
                <div className="rounded-2xl border border-white/10 bg-surface/80 p-12 text-center text-text-muted backdrop-blur-sm">
                    Chargement du studio…
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Steps Section: Chaîne → Infos → Source */}
                    <div className="relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 -translate-y-1/2 hidden md:block" />

                        <div className="grid gap-6 md:grid-cols-3 relative z-10">
                            {[
                                { step: 1, title: 'Chaîne', desc: channel ? `${channel.name}` : 'À configurer', icon: Radio, active: !!channel },
                                { step: 2, title: 'Infos', desc: form.title ? 'Prêtes' : 'Titre session', icon: Link2, active: !!form.title },
                                { step: 3, title: 'Source', desc: isBroadcasting ? 'Live' : 'Prête', icon: Monitor, active: isBroadcasting }
                            ].map((item, i) => (
                                <div key={i} className={cn(
                                    "group flex flex-col items-center text-center space-y-4 p-6 rounded-2xl border transition-all duration-300",
                                    item.active
                                        ? "bg-primary/5 border-primary/20 shadow-[0_0_20px_rgba(34,197,94,0.05)]"
                                        : "bg-[#141414] border-white/5"
                                )}>
                                    <div className={cn(
                                        "flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-300",
                                        item.active ? "bg-primary/20 border-primary/30 text-primary" : "bg-white/5 border-white/10 text-white/20"
                                    )}>
                                        <item.icon className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className={cn("text-[9px] font-black uppercase tracking-[0.2em]", item.active ? "text-primary" : "text-white/20")}>Étape {item.step}</p>
                                        <h2 className="text-sm font-black text-white uppercase tracking-widest italic">{item.title}</h2>
                                        <p className="text-[11px] font-medium text-text-muted/60">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col xl:flex-row gap-10">
                        <div className="flex-1 space-y-8">
                            {/* Section: Stream Setup */}
                            <section className="bg-[#141414] rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-12 bg-primary rounded-br-full pointer-events-none" />
                                <button
                                    type="button"
                                    onClick={() => setIsSetupOpen(v => !v)}
                                    className="w-full flex items-center justify-between px-8 py-6 text-left group"
                                >
                                    <div className="space-y-0.5">
                                        <h3 className="text-xl font-black text-white uppercase italic tracking-tight group-hover:text-primary transition-colors">Détails &amp; Sources</h3>
                                        {!isSetupOpen && form.title
                                            ? <p className="text-[10px] font-bold text-white/30 uppercase italic tracking-widest line-clamp-1">{form.title}</p>
                                            : <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Configuration du Flux</p>
                                        }
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {!isSetupOpen && <span className="text-[8px] font-black text-primary uppercase tracking-widest px-2 py-1 rounded bg-primary/10 border border-primary/20">Modifier</span>}
                                        <div className={cn("w-6 h-6 rounded-md flex items-center justify-center border border-white/10 transition-transform duration-300", isSetupOpen ? "rotate-180" : "")}>
                                            <svg width="10" height="10" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </div>
                                    </div>
                                </button>
                                <div className={cn("overflow-hidden transition-all duration-500", isSetupOpen ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0 pointer-events-none")}>
                                    <div className="px-8 pb-8 space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-primary ml-1">Titre de la session</label>
                                                <Input
                                                    placeholder="Ex: Arène Finale - Tournoi S3"
                                                    className="h-12 bg-black/40 border-white/5 rounded-xl px-5 text-sm font-bold placeholder:text-white/10 focus:ring-primary/20"
                                                    value={form.title}
                                                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                                                />
                                            </div>
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-primary ml-1">Description spectateur</label>
                                                <Textarea
                                                    placeholder="Quel est l'objectif de ce live ?"
                                                    rows={3}
                                                    className="w-full bg-black/40 border-white/5 rounded-xl px-5 py-4 text-sm font-medium placeholder:text-white/10 focus:ring-primary/20 resize-none"
                                                    value={form.description}
                                                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                                                />
                                            </div>
                                            <div className="md:col-span-2 space-y-3">
                                                <div className="flex items-center justify-between px-1">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-primary">Tags & Catégories Arène</label>
                                                    <span className="text-[8px] font-bold text-white/20 uppercase italic">Multi-séléction active</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2 p-5 rounded-xl bg-black/40 border border-white/5 min-h-[60px] shadow-inner">
                                                    {PREDEFINED_TAGS.map(tag => {
                                                        const isSelected = form.tags.includes(tag);
                                                        return (
                                                            <button
                                                                key={tag}
                                                                type="button"
                                                                onClick={() => {
                                                                    setForm(f => ({
                                                                        ...f,
                                                                        tags: isSelected ? f.tags.filter(t => t !== tag) : [...f.tags, tag]
                                                                    }));
                                                                }}
                                                                className={cn(
                                                                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all duration-300",
                                                                    isSelected
                                                                        ? "bg-primary text-black border-primary shadow-[0_0_15px_rgba(34,197,94,0.3)] scale-105"
                                                                        : "bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white"
                                                                )}
                                                            >
                                                                <span className="flex items-center gap-1.5">
                                                                    {isSelected ? <Check size={10} strokeWidth={4} /> : <Plus size={10} />}
                                                                    {tag}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <p className="text-[8px] text-white/20 font-medium italic ml-2">Séléctionnez jusqu'à 5 tags pour maximiser votre visibilité.</p>
                                            </div>

                                            {/* Advanced Metadata Fields */}
                                            <div className="md:col-span-2 pt-4 space-y-4">
                                                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                                                <div className="flex items-center gap-2 px-1">
                                                    <Zap className="w-3 h-3 text-primary/60" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-primary/60 italic">Advanced Metadata (Tunneling & Preview)</span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[8px] font-black uppercase tracking-widest text-white/30 ml-1 italic">Preview URL (Source externe)</label>
                                                        <Input
                                                            placeholder="rtmp:// ou https://..."
                                                            className="h-10 bg-black/20 border-white/5 rounded-lg px-4 text-[10px] font-bold focus:ring-primary/10"
                                                            value={form.streamUrl}
                                                            onChange={(e) => setForm(f => ({ ...f, streamUrl: e.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[8px] font-black uppercase tracking-widest text-white/30 ml-1 italic">Playback URL (Source HLS/DASH)</label>
                                                        <Input
                                                            placeholder="https://.../playlist.m3u8"
                                                            className="h-10 bg-black/20 border-white/5 rounded-lg px-4 text-[10px] font-bold focus:ring-primary/10"
                                                            value={form.playbackUrl}
                                                            onChange={(e) => setForm(f => ({ ...f, playbackUrl: e.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2 space-y-2">
                                                        <label className="text-[9px] font-black uppercase tracking-widest text-primary ml-1">Vignette du Stream (16:9)</label>
                                                        <ThumbnailUpload
                                                            value={form.thumbnailUrl}
                                                            onChange={(url) => setForm(f => ({ ...f, thumbnailUrl: url }))}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-primary ml-1">Planification</label>
                                                <div className="flex items-center gap-4 h-12 px-4 rounded-xl bg-black/20 border border-white/5">
                                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex-1">Activer le rappel</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const next = !isScheduled;
                                                            setIsScheduled(next);
                                                            if (next && typeof Notification !== 'undefined' && Notification.permission === 'default') {
                                                                void Notification.requestPermission();
                                                            }
                                                        }}
                                                        className={cn(
                                                            "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                                                            isScheduled ? "bg-primary" : "bg-white/10"
                                                        )}
                                                    >
                                                        <span className={cn(
                                                            "inline-block h-4 w-4 transform rounded-full bg-white transition duration-200",
                                                            isScheduled ? "translate-x-5" : "translate-x-0"
                                                        )} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {isScheduled && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                                                <input
                                                    type="datetime-local"
                                                    className="h-11 bg-black/40 border-white/5 rounded-xl px-4 text-[10px] font-black text-white uppercase [color-scheme:dark]"
                                                    value={form.scheduledStartTime}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setForm(f => ({ ...f, scheduledStartTime: val }));
                                                        if (val) setIsScheduled(true);
                                                    }}
                                                />
                                                <input
                                                    type="datetime-local"
                                                    className="h-11 bg-black/40 border-white/5 rounded-xl px-4 text-[10px] font-black text-white uppercase [color-scheme:dark]"
                                                    value={form.scheduledEndTime}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setForm(f => ({ ...f, scheduledEndTime: val }));
                                                        if (val) setIsScheduled(true);
                                                    }}
                                                />
                                            </div>
                                        )}

                                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                            <Button
                                                onClick={() => void saveStream(false)}
                                                disabled={saving}
                                                variant="outline"
                                                className="flex-1 h-12 rounded-xl border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest"
                                            >
                                                {currentStream?.isLive ? 'Mettre à jour les infos' : 'Enregistrer le draft'}
                                            </Button>
                                            <div className="flex-1 flex flex-col gap-2">
                                                {currentStream?.isLive ? (
                                                    <Button
                                                        onClick={() => void endLive()}
                                                        disabled={saving}
                                                        className="w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                                                    >
                                                        Arrêter le Direct
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        onClick={() => void saveStream(true)}
                                                        disabled={saving || (isLiveDisabled && !forceStart)}
                                                        className={cn(
                                                            "w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                                            (isLiveDisabled && !forceStart)
                                                                ? "bg-white/5 text-white/20 border border-white/5"
                                                                : "bg-primary text-black hover:bg-primary/90 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                                                        )}
                                                    >
                                                        <div className="flex flex-col items-center">
                                                            {isFutureScheduled ? (
                                                                <>
                                                                    <span>Diffuser : {timeUntilStart}</span>
                                                                    <span className="text-[7px] opacity-60">Planifié pour {formatStreamDate(form.scheduledStartTime)}</span>
                                                                </>
                                                            ) : (
                                                                <span>Mettre à jour & Live</span>
                                                            )}
                                                        </div>
                                                    </Button>
                                                )}

                                                {isFutureScheduled && (
                                                    <div className="flex items-center gap-2 px-2">
                                                        <input
                                                            type="checkbox"
                                                            id="forceStart"
                                                            checked={forceStart}
                                                            onChange={(e) => setForceStart(e.target.checked)}
                                                            className="w-3 h-3 rounded border-white/10 bg-black/40 text-primary focus:ring-primary/20"
                                                        />
                                                        <label htmlFor="forceStart" className="text-[8px] font-bold text-white/40 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
                                                            Optionnel : Forcer le démarrage immédiat
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                            {currentStream && (
                                                <Button
                                                    onClick={() => void deleteCurrentStream()}
                                                    disabled={saving}
                                                    variant="outline"
                                                    className="h-12 w-12 rounded-xl border-red-500/20 hover:bg-red-500/10 text-red-500 transition-all flex items-center justify-center"
                                                    title="Supprimer ce flux"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-6 bg-[#141414] rounded-2xl border border-white/5 p-8 shadow-2xl relative">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-4">
                                            <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Aperçu & Statut</h3>
                                            {currentStream?.isLive && (
                                                <Button
                                                    onClick={() => void endLive()}
                                                    variant="outline"
                                                    className="h-8 px-4 rounded-xl border-red-500/20 bg-red-500/5 text-red-500 text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                                                >
                                                    Arrêter le Direct
                                                </Button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Live Monitor</p>
                                            {watchUrl && (
                                                <button
                                                    onClick={() => void copyWatchLink()}
                                                    className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[8px] font-black text-white/40 uppercase hover:text-primary hover:border-primary/20 transition-all"
                                                >
                                                    <Copy className="w-2.5 h-2.5" />
                                                    Copier le lien
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {isBroadcasting && (
                                        <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20">
                                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Signal Actif</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    {/* Video Preview Container (16:9) */}
                                    <div className="relative aspect-video rounded-xl bg-black border border-white/5 overflow-hidden group shadow-inner">
                                        {isBroadcasting ? (
                                            <div className="relative w-full h-full">
                                                <video
                                                    ref={localVideoRef}
                                                    autoPlay
                                                    muted
                                                    playsInline
                                                    className="w-full h-full object-cover"
                                                />
                                                {/* Broadcast Status & Controls Overlay */}
                                                <div className="absolute top-4 right-4 flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); void toggleFullscreen(); }}
                                                        className="p-2 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-white hover:text-primary transition-colors"
                                                    >
                                                        <Maximize className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
                                                    <button
                                                        onClick={() => void toggleMic()}
                                                        className={cn(
                                                            "p-2.5 rounded-xl transition-all duration-300",
                                                            isMicMuted ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-white/5 text-white hover:bg-white/10 hover:text-primary"
                                                        )}
                                                    >
                                                        {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                                    </button>
                                                    <div className="w-px h-4 bg-white/10" />
                                                    <div className="flex items-center gap-2 px-3">
                                                        <Activity className="w-3 h-3 text-primary animate-pulse" />
                                                        <span className="text-[9px] font-black text-white uppercase tracking-widest whitespace-nowrap">
                                                            {broadcastMode === 'screen' ? 'Capture Écran' : broadcastMode === 'camera' ? 'Webcam Live' : 'Studio Mixte'}
                                                        </span>
                                                    </div>
                                                    <div className="w-px h-4 bg-white/10" />
                                                    <button
                                                        onClick={() => void toggleCam()}
                                                        className={cn(
                                                            "p-2.5 rounded-xl transition-all duration-300",
                                                            isCamMuted ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-white/5 text-white hover:bg-white/10 hover:text-primary"
                                                        )}
                                                    >
                                                        {isCamMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : embed ? (
                                            <div className="w-full h-full">
                                                {embed.type === 'iframe' && (
                                                    <iframe
                                                        src={embed.src}
                                                        title="Live preview"
                                                        className="w-full h-full border-none"
                                                        allow="autoplay; fullscreen"
                                                    />
                                                )}
                                                {embed.type === 'video' && (
                                                    <video src={embed.src} controls className="w-full h-full object-contain bg-black" />
                                                )}
                                                {embed.type === 'link' && (
                                                    <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-3">
                                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                                            <Tv className="w-6 h-6 text-primary" />
                                                        </div>
                                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">Aperçu Externe</p>
                                                        <a href={embed.src} target="_blank" rel="noreferrer" className="text-[9px] text-primary hover:underline truncate max-w-full italic px-4">
                                                            {embed.src}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-gradient-to-b from-white/[0.02] to-transparent">
                                                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                                    <Tv className="w-8 h-8 text-white/10" />
                                                </div>
                                                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">En attente de signal</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Live Metrics Overlay */}
                                    {isBroadcasting && (
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                                                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Bitrate</p>
                                                <p className="text-xs font-black text-primary">4500 Kbps</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                                                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Latence</p>
                                                <p className="text-xs font-black text-primary">120 ms</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                                                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Spectateurs</p>
                                                <p className="text-xs font-black text-primary">1,240</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {[
                                            { id: 'camera', label: 'Caméra', icon: Video, desc: 'Webcam directe' },
                                            { id: 'screen', label: 'Écran', icon: Monitor, desc: 'Partage bureau' },
                                            { id: 'screen-camera', label: 'Studio Mixte', icon: Sparkles, desc: 'Composé auto' },
                                        ].map((m) => {
                                            const isActive = broadcastMode === m.id && isBroadcasting;
                                            return (
                                                <Button
                                                    key={m.id}
                                                    onClick={() => void startRealtimeBroadcast(m.id as any)}
                                                    variant="outline"
                                                    disabled={isLiveDisabled && !forceStart}
                                                    className={cn(
                                                        "h-24 rounded-2xl flex flex-col items-center justify-center space-y-2 transition-all duration-500 border-white/5 relative overflow-hidden group",
                                                        isActive
                                                            ? "bg-primary/15 border-primary/40 shadow-[0_0_25px_rgba(34,197,94,0.15)] scale-[1.02]"
                                                            : (isLiveDisabled && !forceStart)
                                                                ? "bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed"
                                                                : "bg-white/5 hover:border-primary/30 hover:bg-primary/5"
                                                    )}
                                                >
                                                    {isActive && (
                                                        <div className="absolute top-2 right-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(34,197,94,1)]" />
                                                        </div>
                                                    )}
                                                    <m.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-primary" : "text-white/20 group-hover:text-primary")} />
                                                    <div className="space-y-0.5">
                                                        <span className={cn("text-[10px] font-black uppercase tracking-widest block", isActive ? "text-primary" : "text-white/60 group-hover:text-white")}>{m.label}</span>
                                                        <span className="text-[7px] font-bold text-white/20 uppercase tracking-tighter block line-clamp-1">{m.desc}</span>
                                                    </div>
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Sidebar: Library */}
                        <div className="xl:w-96 space-y-6">
                            <section className="space-y-6 bg-[#141414] rounded-2xl border border-white/5 p-6 shadow-2xl relative">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Bibliothèque</h3>
                                        <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Flux Enregistrés</p>
                                    </div>
                                    <button onClick={resetForm} className="p-2 rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-white transition-all">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={savedSortMode}
                                        onChange={(e) => setSavedSortMode(e.target.value as LiveSortMode)}
                                        className="w-full h-10 px-3 bg-black/40 border border-white/5 rounded-xl text-[9px] font-black text-white/60 uppercase outline-none cursor-pointer"
                                    >
                                        <option value="date-desc">Récents</option>
                                        <option value="date-asc">Anciens</option>
                                        <option value="title-asc">A-Z</option>
                                    </select>
                                </div>

                                <div className="space-y-4 max-h-[1000px] overflow-y-auto pr-1 custom-scrollbar">
                                    {streams.length === 0 ? (
                                        <div className="py-10 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-white/20 italic">Aucun enregistrement</p>
                                        </div>
                                    ) : (
                                        sortedSavedStreams.map(stream => (
                                            <button
                                                key={stream._id}
                                                onClick={() => {
                                                    setSelectedStreamId(stream._id);
                                                    fillFormFromStream(stream);
                                                }}
                                                className={cn(
                                                    "group w-full flex flex-col rounded-xl border bg-black/40 overflow-hidden transition-all duration-300 relative",
                                                    selectedStreamId === stream._id ? "border-primary/40 shadow-lg scale-[1.02]" : "border-white/5 hover:border-white/10"
                                                )}
                                            >
                                                <div className="aspect-video bg-black relative overflow-hidden shrink-0">
                                                    <div
                                                        className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-110 transition-transform duration-700"
                                                        style={{ backgroundImage: stream.thumbnailUrl ? `url(${stream.thumbnailUrl})` : 'none' }}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                                                    {stream.isLive && (
                                                        <div className="absolute top-2 right-2">
                                                            <Badge variant="success" className="text-[8px] font-black uppercase px-2 py-0.5">Live</Badge>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-4 text-left space-y-2 flex-1">
                                                    <h4 className="text-[10px] font-black text-white uppercase tracking-tight line-clamp-1 italic group-hover:text-primary transition-colors">{stream.title}</h4>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">{formatStreamDate(stream.createdAt)}</span>
                                                        <span className="text-[8px] font-black text-primary uppercase">{getStreamCategory(stream)}</span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ThumbnailUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Veuillez sélectionner une image');
            return;
        }

        setUploading(true);
        try {
            const url = await streamService.uploadThumbnail(file);
            onChange(url);
            toast.success('Vignette mise à jour');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erreur upload');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div
            className="relative aspect-video rounded-xl bg-black/40 border border-dashed border-white/10 overflow-hidden group hover:border-primary/40 transition-all cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
        >
            {value ? (
                <>
                    <img src={resolveBackendAssetUrl(value)} alt="Thumbnail" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <Upload className="w-8 h-8 text-primary" />
                        <span className="text-[10px] font-black uppercase text-white">Changer l'image</span>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onChange(''); }}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white/40 hover:text-red-500 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <Upload className="w-6 h-6 text-white/20 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="space-y-1 text-center px-4">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Importer une vignette</p>
                        <p className="text-[8px] text-white/20 font-medium">Recommandé : 1280x720 (16:9)</p>
                    </div>
                </div>
            )}

            {uploading && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Upload...</span>
                    </div>
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFile(file);
                }}
            />
        </div>
    );
}
