import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Radio, Globe, Heart, ChevronRight, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Channel {
    _id: string;
    name: string;
    description: string;
    subscriberCount: number;
    ownerId: {
        _id: string;
        nickname: string;
        avatar?: string;
        region?: string;
    };
    categories: string[];
    isLive?: boolean;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ChannelDiscovery() {
    const navigate = useNavigate();
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        fetchChannels();
    }, []);

    const fetchChannels = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/channel`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // We'll also cross-reference with live streams if possible, 
            // but for now let's just show all channels.
            setChannels(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Error fetching channels:', error);
            toast.error('Impossible de charger les arènes.');
        } finally {
            setLoading(false);
        }
    };

    const filteredChannels = channels.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                             c.ownerId.nickname.toLowerCase().includes(search.toLowerCase());
        
        if (filter === 'LIVE') return matchesSearch && c.isLive;
        if (filter === 'POPULAR') return matchesSearch && c.subscriberCount > 5;
        return matchesSearch;
    });

    return (
        <div className="flex flex-col gap-8 animate-fade-in pb-12">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[48px] border border-white/[0.05] p-12 bg-[#080809] shadow-2xl">
                <div className="absolute top-0 right-0 w-[600px] h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
                <div className="absolute -right-20 -top-20 w-96 h-96 bg-primary/5 blur-[120px] rounded-full" />
                
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <Radio size={20} className="text-primary animate-pulse" />
                            </div>
                            <span className="text-[12px] font-black uppercase tracking-[0.3em] text-text-muted">Discovery Mode</span>
                        </div>
                        <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-none italic">
                            The Arena <span className="text-primary not-italic">Network</span>
                        </h1>
                        <p className="text-text-muted text-lg max-w-xl font-medium leading-relaxed">
                            Explorez les chaînes créées par la communauté. Suivez vos rivaux, soutenez vos alliés et synchronisez-vous avec les meilleurs.
                        </p>
                    </div>

                    <div className="hidden lg:flex items-center gap-12 bg-white/[0.01] border border-white/5 rounded-[40px] p-10 backdrop-blur-xl">
                        <StatItem icon={<Users size={24} className="text-blue-400" />} label="Total Arènes" value={channels.length.toString()} />
                        <div className="w-px h-12 bg-white/5" />
                        <StatItem icon={<Heart size={24} className="text-red-500" />} label="Total Fans" value={channels.reduce((s,c) => s + c.subscriberCount, 0).toString()} />
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary transition-colors">
                        <Search size={20} strokeWidth={3} />
                    </div>
                    <input
                        type="text"
                        placeholder="Rechercher une arène ou un joueur..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-16 pl-16 pr-8 rounded-[24px] bg-surface border border-white/5 text-white placeholder:text-white/10 focus:outline-none focus:border-primary/40 focus:ring-8 focus:ring-primary/5 transition-all text-sm font-black uppercase tracking-wider"
                    />
                </div>

                <div className="flex items-center gap-2 p-1.5 rounded-[24px] bg-surface border border-white/5">
                    {[
                        { id: 'ALL', label: 'Toutes' },
                        { id: 'POPULAR', label: 'Populaires' },
                        { id: 'LIVE', label: 'En Direct', icon: <Radio size={12} className="text-red-500" /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            className={cn(
                                "flex items-center gap-2.5 px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all",
                                filter === tab.id ? "bg-primary text-black shadow-lg shadow-primary/20" : "text-text-muted hover:text-white hover:bg-white/5"
                            )}
                        >
                            {tab.icon}{tab.label}
                        </button>
                    ))}
                </div>

                <button 
                    onClick={fetchChannels}
                    className="w-16 h-16 rounded-[24px] bg-surface border border-white/5 flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/30 transition-all"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Channels Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="h-64 rounded-[40px] bg-surface border border-white/5 animate-pulse" />
                    ))}
                </div>
            ) : filteredChannels.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                    {filteredChannels.map(channel => (
                        <div 
                            key={channel._id}
                            onClick={() => navigate(`/watch/${channel._id}`)}
                            className="bg-surface border border-white/10 rounded-[40px] p-8 group hover:border-primary/40 hover:-translate-y-2 transition-all duration-500 cursor-pointer relative overflow-hidden flex flex-col h-full shadow-xl"
                        >
                            {/* Card Decoration */}
                            <div className="absolute -right-20 -bottom-20 w-48 h-48 bg-primary/5 rounded-full blur-[80px] group-hover:bg-primary/10 transition-all" />
                            
                            <div className="flex items-center gap-5 mb-8 relative z-10">
                                <div className="relative shrink-0">
                                    <div className="w-16 h-16 rounded-[24px] bg-black border-2 border-white/10 overflow-hidden group-hover:border-primary/50 transition-all duration-500">
                                        <img src={channel.ownerId.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${channel.ownerId.nickname}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                                    </div>
                                    {channel.isLive && (
                                        <div className="absolute -top-1 -right-1 flex h-4 w-4">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-surface"></span>
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors truncate uppercase italic tracking-tighter leading-none mb-2">{channel.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <Globe size={11} className="text-text-muted" />
                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{channel.ownerId.region || 'GLOBAL'}</span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-text-muted text-xs font-medium leading-relaxed mb-8 line-clamp-3 opacity-60 flex-1 relative z-10">
                                {channel.description}
                            </p>

                            <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                                        <Users size={12} className="text-primary" />
                                        <span className="text-xs font-black text-white tabular-nums">{channel.subscriberCount}</span>
                                    </div>
                                </div>
                                
                                <button className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all">
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-40 flex flex-col items-center justify-center gap-6 text-center border-2 border-dashed border-white/5 rounded-[48px] bg-black/20">
                    <Radio size={48} className="text-white/5" />
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Aucune Arène Détectée</h3>
                        <p className="text-sm font-medium text-text-muted max-w-sm mx-auto">Il semble qu'aucune chaîne ne corresponde à vos critères. Devenez le premier à créer la vôtre !</p>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center shadow-lg">
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#555] mb-1">{label}</p>
                <p className="text-xl font-black text-white tracking-tight">{value}</p>
            </div>
        </div>
    );
}
