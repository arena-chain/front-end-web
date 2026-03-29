import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Users,
    Heart,
    PlayCircle,
    Clock,
    MessageSquare,
    ArrowLeft,
} from 'lucide-react';
import { Badge, Button, Input } from '../../components/ui/core';
import { cn } from '../../lib/utils';
import { createLiveSocket, getIceServers } from '../../lib/live';
import { getStreamEmbed, pickPreferredStreamUrl } from '../../lib/stream';
import { channelService, type ChannelRecord } from '../../services/channel.service';
import { chatService, type ChatMessageRecord } from '../../services/chat.service';
import { streamService, type StreamRecord } from '../../services/stream.service';
import type { Socket } from 'socket.io-client';

type ReactionSummary = Record<string, number>;
type FloatingReaction = {
    id: string;
    emoji: string;
};

const reactionChoices = ['👏', '🔥', '❤️', '🎉', '😂'];

export default function WatchChannelPage() {
    const { channelId = '' } = useParams();
    const [channel, setChannel] = useState<ChannelRecord | null>(null);
    const [streams, setStreams] = useState<StreamRecord[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessageRecord[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [reactionCounts, setReactionCounts] = useState<ReactionSummary>({});
    const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [remotePlaybackBlocked, setRemotePlaybackBlocked] = useState(false);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);
    const peerRef = useRef<RTCPeerConnection | null>(null);
    const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
    const socketRef = useRef<Socket | null>(null);
    const chatEndRef = useRef<HTMLDivElement | null>(null);
    const iceServersRef = useRef<RTCIceServer[]>([]);
    const storedUser = useMemo(() => {
        const raw = localStorage.getItem('user');
        if (!raw) {
            return null;
        }

        try {
            return JSON.parse(raw) as { nickname?: string; role?: string };
        } catch {
            return null;
        }
    }, []);

    function formatMessageDate(value?: string) {
        if (!value) {
            return 'Just now';
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return 'Just now';
        }

        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(date);
    }

    useEffect(() => {
        void load();
    }, [channelId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    useEffect(() => {
        void getIceServers().then((servers) => {
            iceServersRef.current = servers;
        });
    }, []);

    async function attachStreamToVideo(video: HTMLVideoElement | null, stream: MediaStream | null) {
        if (!video) {
            return;
        }

        video.srcObject = stream;
        video.muted = true;

        if (!stream) {
            return;
        }

        const startPlayback = async () => {
            try {
                await video.play();
                setRemotePlaybackBlocked(false);
            } catch {
                setRemotePlaybackBlocked(true);
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
        if (!channelId) {
            return;
        }

        const tryPlayRemoteVideo = async () => {
            const video = remoteVideoRef.current;
            if (!video) {
                return;
            }

            try {
                await video.play();
                setRemotePlaybackBlocked(false);
            } catch {
                setRemotePlaybackBlocked(true);
            }
        };

        const socket = createLiveSocket();
        socketRef.current = socket;

        socket.on('broadcaster-status', ({ isBroadcasting: active }: { isBroadcasting: boolean }) => {
            setIsBroadcasting(active);
            if (!active) {
                if (peerRef.current) {
                    peerRef.current.close();
                    peerRef.current = null;
                }
                if (remoteVideoRef.current) {
                    void attachStreamToVideo(remoteVideoRef.current, null);
                }
                remoteStreamRef.current = null;
                pendingIceCandidatesRef.current = [];
                setRemotePlaybackBlocked(false);
            }
        });

        socket.on('broadcast-ended', () => {
            setIsBroadcasting(false);
            if (peerRef.current) {
                peerRef.current.close();
                peerRef.current = null;
            }
            if (remoteVideoRef.current) {
                void attachStreamToVideo(remoteVideoRef.current, null);
            }
            remoteStreamRef.current = null;
            pendingIceCandidatesRef.current = [];
            setRemotePlaybackBlocked(false);
        });

        socket.on('chat-message', (message: ChatMessageRecord) => {
            setChatMessages((previous) => [...previous.slice(-49), message]);
        });

        socket.on('chat-error', ({ message }: { message: string }) => {
            toast.error(message);
        });

        socket.on('reaction-summary', ({ counts }: { counts: ReactionSummary }) => {
            setReactionCounts(counts || {});
        });

        socket.on('reaction-event', ({ emoji }: { emoji: string }) => {
            const id = `${emoji}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            setFloatingReactions((previous) => [...previous, { id, emoji }]);
            window.setTimeout(() => {
                setFloatingReactions((previous) => previous.filter((item) => item.id !== id));
            }, 2200);
        });

        socket.on('reaction-error', ({ message }: { message: string }) => {
            toast.error(message);
        });

        socket.on('signal-offer', async ({ sourceId, description }: { sourceId: string; description: RTCSessionDescriptionInit }) => {
            const peer = new RTCPeerConnection({ iceServers: iceServersRef.current.length ? iceServersRef.current : undefined });
            peerRef.current = peer;
            remoteStreamRef.current = new MediaStream();

            peer.onconnectionstatechange = () => {
                console.info('viewer connectionState', peer.connectionState);
            };

            peer.oniceconnectionstatechange = () => {
                console.info('viewer iceConnectionState', peer.iceConnectionState);
                if (peer.iceConnectionState === 'failed') {
                    toast.error('WebRTC connection failed. TURN may be required for this browser/network.');
                }
            };

            if (remoteVideoRef.current) {
                void attachStreamToVideo(remoteVideoRef.current, remoteStreamRef.current);
            }

            peer.ontrack = (event) => {
                if (event.streams && event.streams[0]) {
                    remoteStreamRef.current = event.streams[0];
                    if (remoteVideoRef.current) {
                        void attachStreamToVideo(remoteVideoRef.current, event.streams[0]);
                    }
                } else if (remoteStreamRef.current) {
                    const alreadyAdded = remoteStreamRef.current.getTracks().some((track) => track.id === event.track.id);
                    if (!alreadyAdded) {
                        remoteStreamRef.current.addTrack(event.track);
                    }
                }

                event.track.onunmute = () => {
                    void tryPlayRemoteVideo();
                };

                void tryPlayRemoteVideo();
            };

            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('ice-candidate', {
                        targetId: sourceId,
                        channelId,
                        candidate: event.candidate.toJSON(),
                    });
                }
            };

            await peer.setRemoteDescription(new RTCSessionDescription(description));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            for (const candidate of pendingIceCandidatesRef.current) {
                await peer.addIceCandidate(new RTCIceCandidate(candidate));
            }
            pendingIceCandidatesRef.current = [];

            socket.emit('signal-answer', {
                targetId: sourceId,
                channelId,
                description: answer,
            });
        });

        socket.on('ice-candidate', async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
            if (!peerRef.current || !candidate) {
                return;
            }

            if (!peerRef.current.remoteDescription) {
                pendingIceCandidatesRef.current.push(candidate);
                return;
            }

            await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        });

        const joinViewerChannel = () => {
            socket.emit('join-channel', {
                channelId,
                role: 'viewer',
            });
        };

        if (socket.connected) {
            joinViewerChannel();
        } else {
            socket.once('connect', joinViewerChannel);
        }

        return () => {
            socket.emit('leave-channel');
            socket.disconnect();
            socketRef.current = null;
            if (peerRef.current) {
                peerRef.current.close();
                peerRef.current = null;
            }
            if (remoteVideoRef.current) {
                void attachStreamToVideo(remoteVideoRef.current, null);
            }
            pendingIceCandidatesRef.current = [];
            setRemotePlaybackBlocked(false);
        };
    }, [channelId]);

    async function load() {
        setLoading(true);
        try {
            const [channelData, streamData, messageData] = await Promise.all([
                channelService.getChannel(channelId),
                streamService.getStreamsByChannel(channelId),
                chatService.getChannelMessages(channelId),
            ]);
            setChannel(channelData);
            setStreams(streamData);
            setChatMessages(messageData);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to load channel');
        } finally {
            setLoading(false);
        }
    }

    function sendChatMessage() {
        const message = chatInput.trim();
        if (!message) {
            return;
        }

        if (!socketRef.current) {
            toast.error('Live connection is not ready yet');
            return;
        }

        socketRef.current.emit('chat-message', {
            channelId,
            message,
        });
        setChatInput('');
    }

    function sendReaction(emoji: string) {
        if (!socketRef.current) {
            toast.error('Live connection is not ready yet');
            return;
        }

        socketRef.current.emit('reaction', {
            channelId,
            emoji,
        });
    }

    const liveStream = useMemo(() => streams.find((item) => item.isLive) ?? streams[0] ?? null, [streams]);
    const shouldWaitForRealtimeBroadcast = !!liveStream?.isLive;
    const embed = getStreamEmbed(
        shouldWaitForRealtimeBroadcast
            ? undefined
            : pickPreferredStreamUrl(
                liveStream?.streamUrl,
                liveStream?.playbackUrl,
            ),
    );

    return (
        <div className="flex h-[calc(100vh-64px-24px)] overflow-hidden bg-[#060709] rounded-tl-[2rem]">
            {/* ─── Main Stream Area (Left) ─── */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="max-w-[1400px] mx-auto p-6 md:p-8 space-y-8">
                    {/* Header Info */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-[#0f1115] border border-white/5 p-1 overflow-hidden shrink-0">
                                <img
                                    src={channel?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${channel?.name}`}
                                    alt=""
                                    className="w-full h-full rounded-xl object-cover"
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-black uppercase tracking-tighter italic text-white">{channel?.name || 'Channel'}</h1>
                                    <Badge variant="success" className="h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">✓</Badge>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-white/40 italic">
                                    <span className="text-primary">{liveStream?.isLive ? 'En Direct' : 'Hors Ligne'}</span>
                                    <div className="w-1 h-1 rounded-full bg-white/10" />
                                    <span>{channel?.categories[0] || 'Studio Talent'}</span>
                                    <div className="w-1 h-1 rounded-full bg-white/10" />
                                    <span className="flex items-center gap-2">
                                        <Users size={12} className="text-primary" />
                                        {liveStream?.viewerCount || 0} Vues
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button size="lg" className="rounded-2xl px-10 bg-primary text-black font-black uppercase tracking-widest text-xs italic hover:scale-105 transition-all shadow-xl shadow-primary/10">
                                S'abonner
                            </Button>
                            <Button variant="outline" className="rounded-2xl px-4 border-white/10 hover:bg-white/5">
                                <Heart size={18} />
                            </Button>
                        </div>
                    </div>

                    {/* Video Player Section */}
                    <div className="space-y-4">
                        <div className="relative group/player">
                            {floatingReactions.length > 0 && (
                                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2.5rem] z-20">
                                    {floatingReactions.map((reaction, index) => (
                                        <div
                                            key={reaction.id}
                                            className="absolute bottom-10 text-4xl animate-bounce drop-shadow-[0_0_10px_rgba(0,255,135,0.4)]"
                                            style={{
                                                left: `${20 + (index % 5) * 15}%`,
                                            }}
                                        >
                                            {reaction.emoji}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="aspect-video bg-[#000] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl relative">
                                {isBroadcasting ? (
                                    <video
                                        ref={remoteVideoRef}
                                        autoPlay
                                        playsInline
                                        controls
                                        className="w-full h-full object-contain"
                                    />
                                ) : embed?.type === 'iframe' ? (
                                    <iframe
                                        src={embed.src}
                                        title={liveStream?.title || 'Live stream'}
                                        className="w-full h-full"
                                        allow="autoplay; fullscreen"
                                    />
                                ) : embed?.type === 'video' ? (
                                    <video src={embed.src} controls className="w-full h-full" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center space-y-4 bg-gradient-to-br from-[#0c0e11] to-black">
                                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/5 animate-pulse">
                                            <PlayCircle size={40} className="text-white/20" />
                                        </div>
                                        <p className="text-white/30 font-black uppercase tracking-[0.3em] text-[10px]">
                                            {shouldWaitForRealtimeBroadcast ? 'Connexion au signal direct...' : 'Aucun flux actif'}
                                        </p>
                                    </div>
                                )}

                                {remotePlaybackBlocked && (
                                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-md px-12 text-center">
                                        <div className="max-w-md space-y-6">
                                            <div className="w-16 h-16 bg-amber-500/10 rounded-3xl flex items-center justify-center border border-amber-500/30 mx-auto">
                                                <Clock size={32} className="text-amber-500" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Lecture Bloquée</h3>
                                                <p className="text-sm text-white/40 font-medium">L'autoplay est désactivé sur votre navigateur.</p>
                                            </div>
                                            <Button type="button" size="lg" className="w-full rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs" onClick={() => {
                                                const video = remoteVideoRef.current;
                                                if (!video) return;
                                                void video.play()
                                                    .then(() => setRemotePlaybackBlocked(false))
                                                    .catch(() => toast.error('Toujours bloqué. Utilisez les contrôles du lecteur.'));
                                            }}>
                                                Débloquer le flux
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Title & Description Card */}
                        <div className="bg-[#0f1115] border border-white/5 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="flex items-center justify-between gap-6 mb-4">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">{liveStream?.title || 'Session sans titre'}</h2>
                                <div className="flex gap-2">
                                    {reactionChoices.map((emoji) => (
                                        <button
                                            key={emoji}
                                            onClick={() => sendReaction(emoji)}
                                            className="px-3 py-2 rounded-xl bg-white/5 border border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center gap-2 group/react"
                                        >
                                            <span className="text-lg group-hover/react:scale-125 transition-transform">{emoji}</span>
                                            <span className="text-[10px] font-black text-white/40 group-hover/react:text-primary transition-colors">{reactionCounts[emoji] || 0}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <p className="text-white/50 font-medium leading-relaxed max-w-4xl italic">
                                {liveStream?.description || 'Le créateur n\'a pas encore fourni de détails pour cette transmission.'}
                            </p>
                        </div>
                    </div>

                    {/* Secondary Info Area */}
                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* About Channel */}
                        <div className="bg-[#0f1115] border border-white/5 rounded-[2.5rem] p-8 shadow-xl">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-6 italic">À propos du Studio</h3>
                            <div className="flex items-start gap-6">
                                <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary text-3xl shrink-0 italic shadow-inner">
                                    {channel?.name?.slice(0, 1).toUpperCase() || 'A'}
                                </div>
                                <div className="space-y-4">
                                    <p className="text-white/70 font-medium italic leading-relaxed line-clamp-3">
                                        {channel?.description || 'Membre certifié de l\'Arena Grid. Ce studio est dédié à l\'excellence streaming et à l\'innovation communautaire.'}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {channel?.categories.map(cat => (
                                            <Link key={cat} to={`/player/all-lives?category=${encodeURIComponent(cat)}`}>
                                                <Badge variant="secondary" className="bg-white/5 border-white/5 text-[9px] font-black px-3 py-1 uppercase tracking-widest hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer">{cat}</Badge>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Archives */}
                        <div className="bg-[#0f1115] border border-white/5 rounded-[2.5rem] p-8 shadow-xl">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-6 italic">Archives Récentes</h3>
                            <div className="space-y-3">
                                {streams.slice(1, 4).map((stream) => (
                                    <div key={stream._id} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-8 rounded-lg bg-black border border-white/10 overflow-hidden shrink-0">
                                                {stream.thumbnailUrl && <img src={stream.thumbnailUrl} alt="" className="w-full h-full object-cover opacity-50" />}
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[11px] font-black text-white italic uppercase tracking-tight truncate max-w-[180px]">{stream.title}</p>
                                                <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">{formatMessageDate(stream.createdAt)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users size={10} className="text-white/20" />
                                            <span className="text-[10px] font-black text-white/40">{stream.viewerCount}</span>
                                        </div>
                                    </div>
                                ))}
                                {streams.length <= 1 && <p className="text-[11px] text-white/20 font-bold uppercase tracking-widest italic pt-4">Aucune archive disponible.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Chat Sidebar (Right) ─── */}
            <aside className="w-[360px] flex flex-col bg-[#0b0c0f] border-l border-white/5 shrink-0">
                {/* Chat Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 shadow-sm shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-white italic">Direct Chat</span>
                    </div>
                    <Badge variant="secondary" className="bg-white/5 border-white/5 text-[9px] font-black text-white/40 uppercase tracking-widest">
                        {chatMessages.length} Msg
                    </Badge>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide bg-black/10">
                    {chatMessages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center px-8 opacity-20">
                            <MessageSquare size={48} className="mb-4" />
                            <p className="text-xs font-black uppercase tracking-widest leading-relaxed">Le silence règne sur l'arène. Soyez le premier à briser la glace.</p>
                        </div>
                    )}
                    {chatMessages.map((message) => (
                        <div key={message._id} className="group/msg animate-in slide-in-from-right-2 duration-300">
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className={cn(
                                    "text-[11px] font-black italic uppercase tracking-tighter cursor-pointer",
                                    message.senderRole === 'streamer' ? 'text-primary' : 'text-white/80'
                                )}>
                                    {message.senderNickname}
                                </span>
                                <span className="text-[9px] font-bold text-white/10 uppercase tracking-widest shrink-0">
                                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <p className="text-[13px] text-white/60 font-medium leading-relaxed bg-[#16181d]/30 p-2 rounded-xl border border-transparent group-hover/msg:border-white/5 transition-all">
                                {message.message}
                            </p>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 border-t border-white/5 bg-[#0b0c0f]">
                    <div className="relative group/input">
                        <Input
                            placeholder="Envoyer un message..."
                            value={chatInput}
                            onChange={(event) => setChatInput(event.target.value)}
                            className="bg-white/5 border-white/5 rounded-2xl h-12 text-sm text-white placeholder:text-white/10 focus:border-primary/40 focus:ring-primary/5 pl-4 pr-12 transition-all"
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    sendChatMessage();
                                }
                            }}
                        />
                        <button
                            onClick={sendChatMessage}
                            disabled={!chatInput.trim()}
                            className="absolute right-2 top-2 h-8 w-8 rounded-xl bg-primary text-black flex items-center justify-center hover:scale-105 disabled:opacity-20 disabled:scale-100 transition-all shadow-lg shadow-primary/20"
                        >
                            <ArrowLeft size={16} className="rotate-180" />
                        </button>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20">
                            {storedUser ? `Connecté en tant que ${storedUser.nickname}` : 'Spectateur anonyme'}
                        </p>
                    </div>
                </div>
            </aside>
        </div>
    );
}
