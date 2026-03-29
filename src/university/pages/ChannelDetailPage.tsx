import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Users,
    PlayCircle,
    Heart,
    MessageSquare,
    Calendar,
    Clock,
} from 'lucide-react';
import { Badge, Button } from '../../components/ui/core';
import { cn } from '../../lib/utils';
import { channelService, type ChannelRecord } from '../../services/channel.service';
import { streamService, type StreamRecord } from '../../services/stream.service';
import { chatService, type ChatMessageRecord } from '../../services/chat.service';

export default function ChannelDetailPage() {
    const { channelId = '' } = useParams();
    const [channel, setChannel] = useState<ChannelRecord | null>(null);
    const [streams, setStreams] = useState<StreamRecord[]>([]);
    const [comments, setComments] = useState<ChatMessageRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'videos' | 'community' | 'about'>('videos');

    useEffect(() => {
        void loadData();
    }, [channelId]);

    async function loadData() {
        setLoading(true);
        try {
            const [channelData, streamsData, commentsData] = await Promise.all([
                channelService.getChannel(channelId),
                streamService.getStreamsByChannel(channelId),
                chatService.getChannelMessages(channelId, 10)
            ]);
            setChannel(channelData);
            setStreams(streamsData);
            setComments(commentsData);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to load channel details');
        } finally {
            setLoading(false);
        }
    }

    const formatDate = (value?: string) => {
        if (!value) return '—';
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium'
        }).format(new Date(value));
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="space-y-4 text-center">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                    <p className="text-text-muted animate-pulse">Chargement du studio...</p>
                </div>
            </div>
        );
    }

    if (!channel) {
        return (
            <div className="p-12 text-center space-y-4">
                <h2 className="text-2xl font-black text-white">Studio non trouvé</h2>
                <Link to="/player/channel">
                    <Button variant="outline">Retour à la liste</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-12">
            {/* ─── Profile Hero Section (Kick Style) ─── */}
            <div className="relative mb-8 group">
                {/* Banner */}
                <div
                    className="h-48 md:h-72 bg-cover bg-center relative rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl transition-all duration-700 group-hover:shadow-primary/5"
                    style={{
                        backgroundImage: channel.bannerUrl
                            ? `url(${channel.bannerUrl})`
                            : 'linear-gradient(135deg, rgba(0,255,135,0.05), rgba(10,12,16,1))'
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#060708] via-transparent to-black/10" />

                    {/* Floating "Live Now" Badge on banner if live */}
                    {channel.isActive && (
                        <div className="absolute top-6 right-8 bg-red-600/90 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-2xl animate-pulse uppercase tracking-[0.2em] backdrop-blur-md border border-white/10 flex items-center gap-2 z-20">
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            Direct
                        </div>
                    )}
                </div>

                {/* Profile Info Bar */}
                <div className="max-w-[1400px] mx-auto px-4 md:px-12 -mt-10 relative z-10">
                    <div className="bg-[#0f1115]/80 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-6 md:p-8 flex flex-col md:flex-row items-center md:items-end justify-between gap-8 shadow-2xl">
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-8 text-center md:text-left w-full md:w-auto">
                            {/* Avatar with Ring */}
                            <div className="relative shrink-0">
                                <div
                                    className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] border-8 border-[#0f1115] bg-[#1a1d21] shadow-2xl bg-cover bg-center group-hover:scale-105 transition-transform duration-500 overflow-hidden"
                                    style={{ backgroundImage: channel.avatarUrl ? `url(${channel.avatarUrl})` : undefined }}
                                />
                                {channel.isActive && (
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-primary text-black text-[9px] font-black px-3 py-1 rounded-full shadow-[0_0_15px_rgba(0,255,135,0.6)] uppercase tracking-widest border-2 border-[#0f1115]">
                                        LIVE
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 pb-2 flex-1">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-center md:justify-start gap-3">
                                        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white drop-shadow-sm italic">
                                            {channel.name}
                                        </h1>
                                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20">
                                            <Badge variant="success" className="p-0 bg-transparent text-primary">✓</Badge>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                        <div className="flex items-center gap-2 text-primary/80">
                                            <span className="text-sm font-black uppercase tracking-widest">{channel.subscriberCount.toLocaleString()}</span>
                                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Abonnés</span>
                                        </div>
                                        <div className="w-1 h-1 rounded-full bg-white/10" />
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black text-white/80 uppercase tracking-widest italic">{channel.categories?.[0] || 'Gaming'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Tags Row */}
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                    {(channel.categories ?? []).map(cat => (
                                        <Badge key={cat} variant="secondary" className="bg-white/5 border-white/5 text-[9px] font-black px-4 py-1 uppercase tracking-widest transition-colors hover:border-primary/40 hover:text-primary">
                                            {cat}
                                        </Badge>
                                    ))}
                                    <Badge variant="secondary" className="bg-primary/10 border-primary/20 text-primary text-[9px] font-black px-3 py-1 uppercase tracking-widest">+ Suivre</Badge>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-center gap-4 pb-2 shrink-0">
                            <div className="flex flex-col items-end gap-2 text-right hidden lg:flex mr-4">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary" />
                                    <span className="text-xl font-black text-white">4,550</span>
                                </div>
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic">Spectateurs</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button size="lg" className="rounded-2xl px-10 h-14 shadow-2xl shadow-primary/20 bg-primary text-black hover:bg-primary/80 transition-all font-black uppercase tracking-widest text-xs italic">
                                    S'abonner
                                </Button>
                                <Button variant="outline" size="lg" className="rounded-2xl h-14 px-6 border-white/10 hover:bg-white/5 transition-all group/btn">
                                    <Heart className="w-5 h-5 group-hover/btn:fill-rose-500 group-hover/btn:text-rose-500 transition-colors" />
                                </Button>
                                <Link to={`/watch/${channel._id}`}>
                                    <Button variant="outline" size="lg" className="rounded-2xl h-14 px-6 border-white/10 hover:bg-white/5 font-black uppercase tracking-widest text-[10px] italic">
                                        Live
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Kick-style Navigation Tabs */}
            <div className="px-4 md:px-12 mt-12 mb-8">
                <div className="flex items-center gap-10 border-b border-white/5 pb-0">
                    {[
                        { id: 'videos', label: 'Accueil' },
                        { id: 'videos', label: 'Vidéos' },
                        { id: 'community', label: 'Communauté' },
                        { id: 'about', label: 'À propos' },
                    ].map((tab, idx) => (
                        <button
                            key={`${tab.id}-${idx}`}
                            onClick={() => setActiveTab(tab.id as 'videos' | 'community' | 'about')}
                            className={cn(
                                "pb-4 text-xs font-black uppercase tracking-[0.25em] transition-all relative group/tab italic",
                                activeTab === tab.id && idx !== 0 ? "text-primary invisible" : "", // Small hack for multi-videos tabs
                                (idx === 0 && activeTab === 'videos') || (tab.id === activeTab && idx !== 0)
                                    ? "text-primary"
                                    : "text-white/30 hover:text-white/60"
                            )}
                        >
                            {tab.label}
                            {((idx === 0 && activeTab === 'videos') || (tab.id === activeTab && idx !== 0)) && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(0,255,135,0.4)]" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 md:px-12">
                <div className="min-h-[400px]">
                    {activeTab === 'videos' && (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Vidéos en streaming récentes</h2>
                                <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Tout voir</button>
                            </div>
                            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {streams.length === 0 ? (
                                    <div className="col-span-full py-24 text-center border border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.02]">
                                        <PlayCircle className="w-16 h-16 text-white/5 mx-auto mb-6" />
                                        <p className="text-white/20 font-bold uppercase tracking-widest">Aucune transmission archivée.</p>
                                    </div>
                                ) : (
                                    streams.map((stream) => (
                                        <Link key={stream._id} to={`/watch/${channel._id}`} className="group space-y-4">
                                            <div className="aspect-video bg-[#0f1115] relative rounded-[2rem] overflow-hidden border border-white/5 shadow-xl transition-all duration-500 group-hover:border-primary/30 group-hover:shadow-primary/5">
                                                {stream.thumbnailUrl ? (
                                                    <img src={stream.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent">
                                                        <PlayCircle className="w-12 h-12 text-white/5 group-hover:text-primary/20 transition-all" />
                                                    </div>
                                                )}
                                                {stream.isLive && (
                                                    <div className="absolute top-4 left-4 bg-red-600 text-white text-[9px] font-black px-2.5 py-1 rounded-lg shadow-2xl animate-pulse uppercase tracking-widest">LIVE</div>
                                                )}
                                                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-3 py-1.5 rounded-xl border border-white/10 uppercase tracking-widest">
                                                    {stream.viewerCount} Vues
                                                </div>
                                            </div>
                                            <div className="px-2 space-y-1">
                                                <h3 className="font-black text-white text-sm leading-tight line-clamp-2 italic group-hover:text-primary transition-colors">{stream.title}</h3>
                                                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest flex items-center gap-2">
                                                    <Calendar size={10} className="text-primary/40" />
                                                    {formatDate(stream.createdAt)}
                                                </p>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'community' && (
                        <div className="space-y-6 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Flux communautaire</h2>
                                <Badge variant="secondary" className="text-[10px] border-white/10 text-white/40">{comments.length} Messages</Badge>
                            </div>
                            <div className="grid gap-4">
                                {comments.length === 0 ? (
                                    <div className="py-24 text-center border border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.02]">
                                        <MessageSquare className="w-16 h-16 text-white/5 mx-auto mb-6" />
                                        <p className="text-white/20 font-bold uppercase tracking-widest">Le silence est d'or ici.</p>
                                    </div>
                                ) : (
                                    comments.map((comment, i) => (
                                        <div key={comment._id} className="bg-[#0f1115] border border-white/5 p-6 rounded-[2rem] flex gap-6 items-start hover:border-white/10 transition-all hover:bg-white/[0.02] group/msg" style={{ animationDelay: `${i * 50}ms` }}>
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center font-black text-primary shrink-0 uppercase border border-primary/10 text-2xl italic shadow-inner">
                                                {comment.senderNickname.slice(0, 1)}
                                            </div>
                                            <div className="space-y-3 flex-1 pt-1">
                                                <div className="flex items-center gap-4">
                                                    <span className="font-black text-white text-base italic uppercase tracking-tighter">{comment.senderNickname}</span>
                                                    <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
                                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest flex items-center gap-2">
                                                        <Clock size={12} />
                                                        {formatDate(comment.createdAt)}
                                                    </span>
                                                </div>
                                                <p className="text-[16px] text-white/60 leading-relaxed font-medium">{comment.message}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'about' && (
                        <div className="grid lg:grid-cols-[1fr_400px] gap-12 animate-in fade-in duration-500">
                            <div className="space-y-12">
                                <section className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-px flex-1 bg-white/5" />
                                        <h3 className="text-xs font-black text-primary uppercase tracking-[0.4em] italic">L'ADN du Studio</h3>
                                        <div className="h-px flex-1 bg-white/5" />
                                    </div>
                                    <div className="bg-[#0f1115] p-10 rounded-[3rem] border border-white/5 shadow-inner">
                                        <p className="text-white/80 leading-loose text-xl font-medium italic indent-8">
                                            {channel.description ? `"${channel.description}"` : 'Certifié par Arena. Ce talent n\'a pas encore dévoilé sa biographie complète, mais son influence sur la chaîne est déjà indéniable.'}
                                        </p>
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.4em] italic pl-2">Spécialisations</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {(channel.categories ?? []).map(cat => (
                                            <Link key={cat} to={`/player/all-lives?category=${encodeURIComponent(cat)}`}>
                                                <div className="px-8 py-4 bg-[#0f1115] border border-white/5 rounded-2xl text-xs font-black text-white uppercase tracking-widest hover:border-primary/40 hover:text-primary transition-all cursor-pointer shadow-lg">
                                                    {cat}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            <aside className="space-y-6">
                                <div className="bg-[#0f1115] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-8 flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                        Méta-Données
                                    </h3>
                                    <div className="space-y-8">
                                        {[
                                            { label: 'Statut Opérationnel', value: channel.isActive ? 'Actif' : 'En veille', color: channel.isActive ? 'text-primary' : 'text-white/40' },
                                            { label: 'ID Certification', value: `ARENA-ST-${channel._id.slice(-6).toUpperCase()}` },
                                            { label: 'Membre depuis', value: formatDate(channel.createdAt) },
                                            { label: 'Réseau Principal', value: 'Arena Grid' },
                                        ].map(item => (
                                            <div key={item.label} className="space-y-1.5">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-white/20">{item.label}</span>
                                                <p className={cn("text-xs font-black uppercase tracking-tighter", item.color || "text-white")}>{item.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </aside>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
