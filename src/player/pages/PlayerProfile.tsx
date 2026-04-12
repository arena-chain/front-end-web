import { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { User, Edit2, Share2, Trophy, Target, Sparkles, Play, XCircle, PlusCircle, AlertCircle, Star, Shield, Zap, Gamepad2, X, Check, RefreshCw, Upload, Wand2, Palette } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import LevelCard from '../components/LevelCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface UserProfile {
    _id: string;
    nickname: string;
    email: string;
    region?: string;
    avatar?: string;
    bio?: string;
    role: string;
}

interface Channel {
    _id: string;
    name: string;
    subscriberCount: number;
    ownerId: string;
}

interface PlayerRank {
    _id: string;
    game: { _id: string; title: string, genre: string, coverImageUrl?: string };
    elo: number;
    tier: string;
    division: number;
    level: number;
    wins: number;
    losses: number;
    winRate: number;
    totalMatches: number;
}

const REGIONS = [
    { code: 'EUROPE', name: 'Europe' },
    { code: 'AFRICA', name: 'Afrique' },
    { code: 'ASIA', name: 'Asie' },
    { code: 'AMERICAS', name: 'Amériques' },
    { code: 'OCEANIA', name: 'Océanie' }
];

const AVATAR_STYLES = [
    { id: 'avataaars', name: 'Humain', icon: '👤' },
    { id: 'bottts', name: 'Robot', icon: '🤖' },
    { id: 'pixel-art', name: 'Pixel', icon: '👾' },
    { id: 'lorelei', name: 'Anime', icon: '✨' },
    { id: 'adventurer', name: 'Aventurier', icon: '⚔️' },
    { id: 'miniavs', name: 'Minimal', icon: '🟣' },
    { id: 'big-smile', name: 'Sourire', icon: '😊' }
];

const TABS = [
    { id: 'resume', label: 'Résumé' },
    { id: 'matches', label: 'Historique' },
    { id: 'stats', label: 'Stats' },
    { id: 'leagues', label: 'Ligues' },
    { id: 'tournaments', label: 'Tournois' },
];

export default function PlayerProfile() {
    const { id } = useParams();
    const context = useOutletContext<{ 
        profile?: { _id: string; nickname?: string } | null;
        refreshProfile: () => void;
    } | null>();
    const currentUserId = context?.profile?._id;
    const refreshProfile = context?.refreshProfile;

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [channel, setChannel] = useState<Channel | null>(null);
    const [ranks, setRanks] = useState<PlayerRank[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editNickname, setEditNickname] = useState('');
    const [editBio, setEditBio] = useState('');
    const [activeTab, setActiveTab] = useState('resume');
    const [region, setRegion] = useState('EUROPE');
    
    // Avatar Studio States
    const [avatar, setAvatar] = useState('');
    const [avatarStyle, setAvatarStyle] = useState('avataaars');
    const [avatarSeed, setAvatarSeed] = useState('');
    const [showAvatarLab, setShowAvatarLab] = useState(false);
    
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const getTargetId = () => {
        if (!id) return currentUserId;
        return id.match(/^[a-f\d]{24}$/i) ? id : currentUserId;
    };

    const targetId = getTargetId();
    const isOwnProfile = !id || targetId === currentUserId;

    useEffect(() => { if (targetId) fetchProfile(); }, [id, currentUserId, targetId]);

    const fetchProfile = async () => {
        setLoading(true);
        if (!targetId || targetId === 'undefined') { setLoading(false); return; }
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get((id && targetId !== currentUserId) ? `${API_URL}/users/${targetId}` : `${API_URL}/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(response.data);
            setRegion(response.data.region || 'EUROPE');
            setAvatar(response.data.avatar || '');
            setEditNickname(response.data.nickname || '');
            setEditBio(response.data.bio || '');
            setAvatarSeed(response.data.nickname || 'arena');

            try {
                if (targetId.match(/^[a-f\d]{24}$/i)) {
                    const rankRes = await axios.get(`${API_URL}/rank/user/${targetId}`);
                    setRanks(rankRes.data || []);
                }
            } catch (err) {}

            try {
                if (targetId.match(/^[a-f\d]{24}$/i)) {
                    const chRes = await axios.get(`${API_URL}/channel/owner/${targetId}`);
                    if (chRes.data && chRes.data.length > 0) {
                        setChannel(chRes.data[0]);
                        if (currentUserId && token) {
                            const subRes = await axios.get(`${API_URL}/channel/${chRes.data[0]._id}/is-subscribed`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            setIsSubscribed(subRes.data);
                        }
                    } else setChannel(null);
                }
            } catch (err) { setChannel(null); }
        } catch (e) {} finally { setLoading(false); }
    };

    // Update avatar live preview
    useEffect(() => {
        if (editing && avatarSeed) {
            setAvatar(`https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${avatarSeed}`);
        }
    }, [avatarStyle, avatarSeed, editing]);

    const handleUpdateIdentity = async () => {
        if (!editNickname.trim()) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.patch(`${API_URL}/auth/profile`, { 
                nickname: editNickname, 
                avatar, 
                region,
                country: region,
                bio: editBio
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            toast.success('PROFILE SYNCHRONISÉ !');
            setEditing(false);
            setShowAvatarLab(false);
            
            // Refresh global header
            if (refreshProfile) refreshProfile();
            
            // Refresh local profile
            fetchProfile();
        } catch (error) {
            console.error('Update error:', error);
            toast.error('Échec de la mise à jour.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateChannel = async () => {
        if (!isOwnProfile || !currentUserId) return;
        const token = localStorage.getItem('token');
        setActionLoading(true);
        try {
            await axios.post(`${API_URL}/channel`, { name: `${profile?.nickname}'s Official Arena`, description: `Official Arena channel for ${profile?.nickname}.`, categories: ['Gaming'] }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('CHAÎNE ACTIVE !');
            fetchProfile();
        } catch (e) { toast.error('Erreur activation channel.'); } finally { setActionLoading(false); }
    };

    const handleSubscribe = async () => {
        if (!channel || !currentUserId) return;
        const token = localStorage.getItem('token');
        if (!token) { toast.error('Connectez-vous pour continuer.'); return; }
        setActionLoading(true);
        try {
            const endpoint = isSubscribed ? 'unsubscribe' : 'subscribe';
            await axios.post(`${API_URL}/channel/${channel._id}/${endpoint}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setIsSubscribed(!isSubscribed);
            toast.success(isSubscribed ? 'Suivi annulé.' : 'Abonnement réussi !');
            fetchProfile();
        } catch (e) { toast.error('Erreur technique.'); } finally { setActionLoading(false); }
    };

    const generateRandomSeed = () => {
        setAvatarSeed(Math.random().toString(36).substring(7));
    };

    if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

    const totalWins = ranks.reduce((s, r) => s + r.wins, 0);
    const totalMatches = ranks.reduce((s, r) => s + r.totalMatches, 0);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header Tabs */}
            <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden shadow-xl mt-4">
                <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-10 py-5 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative shrink-0 ${activeTab === tab.id ? 'text-primary bg-primary/[0.03]' : 'text-text-muted hover:text-white hover:bg-white/5'}`}
                        >
                            {tab.label}
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary shadow-[0_0_15px_rgba(0,255,136,0.6)]" />}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8 mb-20">
                {/* Column Identity */}
                <div className="col-span-12 lg:col-span-4 xl:col-span-3">
                    <div className="bg-surface border border-white/5 rounded-[32px] p-8 sticky top-8 shadow-2xl flex flex-col items-center overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl pointer-events-none" />
                        
                        {/* Avatar Creator Interface */}
                        <div className="relative mb-8 group/avatar">
                            <div className="w-44 h-44 rounded-[42px] bg-black border-4 border-white/10 flex items-center justify-center overflow-hidden relative shadow-[0_30px_60px_rgba(0,0,0,0.4)] group-hover/avatar:border-primary/40 transition-all duration-500">
                                {avatar ? (
                                    <img src={avatar} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <User className="w-20 h-20 text-white/5" />
                                )}
                                {editing && (
                                    <div 
                                        onClick={() => setShowAvatarLab(!showAvatarLab)}
                                        className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer text-white gap-2"
                                    >
                                        <Wand2 className="w-8 h-8 text-primary animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Avatar Lab</span>
                                    </div>
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-primary text-black p-2.5 rounded-2xl shadow-xl">
                                <Sparkles size={20} />
                            </div>
                        </div>

                        {/* Lab Modal-like UI when editing */}
                        {editing && showAvatarLab && (
                            <div className="w-full bg-black/40 border border-primary/20 rounded-2xl p-5 mb-6 space-y-5 animate-in zoom-in-95 duration-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Palette size={14} className="text-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Style Lab</span>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {AVATAR_STYLES.map(st => (
                                        <button 
                                            key={st.id} 
                                            onClick={() => setAvatarStyle(st.id)}
                                            className={cn(
                                                "p-3 rounded-xl border flex flex-col items-center gap-1 transition-all",
                                                avatarStyle === st.id ? "bg-primary border-primary text-black" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                                            )}
                                        >
                                            <span className="text-lg">{st.icon}</span>
                                            <span className="text-[7px] font-black uppercase">{st.name}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-[#555]">Signature d'ADN (Seed)</span>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={avatarSeed}
                                            onChange={(e) => setAvatarSeed(e.target.value)}
                                            className="flex-1 bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-primary"
                                        />
                                        <button onClick={generateRandomSeed} className="p-2 bg-white/5 rounded-lg text-primary hover:bg-white/10 transition-colors">
                                            <RefreshCw size={14} />
                                        </button>
                                    </div>
                                </div>
                                <button onClick={() => setShowAvatarLab(false)} className="w-full py-2 bg-primary/10 text-primary rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all">Terminer Configuration</button>
                            </div>
                        )}

                        <div className="text-center w-full mb-8">
                            {editing ? (
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        value={editNickname}
                                        onChange={(e) => setEditNickname(e.target.value)}
                                        className="w-full text-xl font-black text-white text-center bg-black/40 border-2 border-primary/20 rounded-2xl px-4 py-4 focus:outline-none focus:border-primary shadow-inner"
                                        placeholder="Pseudo"
                                    />
                                    <select 
                                        value={region}
                                        onChange={(e) => setRegion(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white uppercase font-black outline-none"
                                    >
                                        {REGIONS.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}
                                    </select>
                                    <div className="flex gap-2">
                                        <button onClick={handleUpdateIdentity} className="flex-1 bg-primary text-black py-4 rounded-2xl font-black text-[11px] uppercase flex items-center justify-center gap-2 hover:bg-emerald-400">
                                            <Check size={16} /> Appliquer
                                        </button>
                                        <button onClick={() => { setEditing(false); setShowAvatarLab(false); }} className="bg-white/5 text-white/40 p-4 rounded-2xl hover:text-white transition-all">
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <div className="pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Edit2 size={12} className="text-[#555]" />
                                            <span className="text-[10px] font-black uppercase text-[#555]">Ma Bio</span>
                                        </div>
                                        <textarea 
                                            value={editBio}
                                            onChange={(e) => setEditBio(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-white/70 min-h-[100px] outline-none focus:border-primary/50 resize-none transition-all"
                                            placeholder="Parle-nous de toi..."
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">{profile?.nickname}</h1>
                                    <div className="flex items-center justify-center gap-2 mb-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(0,255,136,1)]" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#444] italic">Division {region}</p>
                                    </div>
                                    {profile?.bio && (
                                        <div className="relative group/bio px-6 py-4 bg-white/[0.02] border border-white/5 rounded-2xl mb-8 transition-all hover:bg-white/[0.04]">
                                            <Sparkles size={12} className="absolute -top-1 -right-1 text-primary/40 group-hover/bio:text-primary transition-colors" />
                                            <p className="text-[11px] text-text-muted/60 leading-relaxed italic line-clamp-3">
                                                "{profile.bio}"
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="w-full flex flex-col gap-4">
                            {isOwnProfile ? (
                                <>
                                    {!editing && <button onClick={() => setEditing(true)} className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest border border-white/5 transition-all flex items-center justify-center gap-3"><Edit2 size={16} className="text-primary" /> Modifier Le Profil</button>}
                                    {!channel && <button onClick={handleCreateChannel} className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest border border-primary/20 flex items-center justify-center gap-3 animate-pulse"><PlusCircle size={18} /> Activer Arena Channel</button>}
                                </>
                            ) : (
                                <>
                                    {channel ? (
                                        <button onClick={handleSubscribe} className={cn("w-full py-5 rounded-[22px] font-black uppercase text-[11px] tracking-widest transition-all shadow-xl", isSubscribed ? "bg-white/5 text-red-500 border border-red-500/20" : "bg-primary text-black shadow-primary/20")}>
                                            {isSubscribed ? <XCircle size={18} className="mx-auto" /> : "S'abonner à l'Arène"}
                                        </button>
                                    ) : <div className="text-[10px] font-black uppercase text-center opacity-20 py-5 border-2 border-dashed border-white/5 rounded-2xl italic">Arène Non Configurée</div>}
                                </>
                            )}
                        </div>
                        
                        {/* Sidebar Footer */}
                        <div className="mt-10 pt-8 border-t border-white/5 w-full">
                            <div className="flex items-center justify-between opacity-40 hover:opacity-100 transition-opacity">
                                <span className="text-[9px] font-bold uppercase tracking-widest">ID Statut</span>
                                <span className="text-[9px] font-black text-primary uppercase italic">Vérifié ✓</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-8">
                    {activeTab === 'resume' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            {/* Level Progression */}
                            <LevelCard />

                            {/* Main Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard icon={<Trophy className="text-primary" />} label="Matchs" value={totalMatches.toString()} />
                                <StatCard icon={<Target className="text-green-500" />} label="Victoires" value={totalWins.toString()} />
                                <StatCard icon={<Shield className="text-blue-500" />} label="ELO Max" value={ranks.length > 0 ? Math.max(...ranks.map(r => r.elo)).toString() : '0'} />
                                <StatCard icon={<Zap className="text-amber-400" />} label="Win Rate" value={totalMatches > 0 ? `${Math.round((totalWins / totalMatches) * 100)}%` : '0%'} />
                            </div>

                            {/* Competitive Ladders */}
                            <div className="space-y-6">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                                    <div className="w-2 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(0,255,136,0.4)]" />
                                    Statut Compétitif
                                </h2>
                                
                                {ranks.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {ranks.map(r => (
                                            <div key={r._id} className="bg-surface border border-white/5 rounded-[32px] p-8 relative overflow-hidden group/r hover:border-primary/40 transition-all shadow-xl">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/[0.02] blur-3xl pointer-events-none" />
                                                <div className="flex items-center justify-between mb-8">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-16 h-16 rounded-2xl bg-black border border-white/10 overflow-hidden shadow-inner flex items-center justify-center">
                                                            {r.game.coverImageUrl ? <img src={r.game.coverImageUrl} className="w-full h-full object-cover" /> : <Gamepad2 size={24} className="text-white/5" />}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-black text-white uppercase italic leading-none mb-1">{r.game.title}</h3>
                                                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{r.game.genre}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-3xl font-black text-white tabular-nums tracking-tighter">{r.elo}</div>
                                                        <p className="text-[9px] font-black text-[#666] uppercase tracking-widest">Points ELO</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-8">
                                                    <div className={cn(
                                                        "w-20 h-20 rounded-[28px] flex items-center justify-center text-4xl font-black shadow-2xl",
                                                        (r.tier === 'CHALLENGER' || r.tier === 'GRANDMASTER') ? "bg-primary text-black" : "bg-white/5 text-white/20 border border-white/10"
                                                    )}>
                                                        {r.tier.charAt(0)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-2xl font-black text-white uppercase tracking-tight italic">{r.tier} {r.division}</div>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <div className="w-2 h-2 rounded-full bg-primary/40" />
                                                            <span className="text-[10px] font-black text-[#555] uppercase tracking-widest">Niveau Compétitif {r.level}</span>
                                                        </div>
                                                    </div>
                                                    <div className="px-5 py-3 bg-black/40 border border-white/5 rounded-2xl text-center">
                                                        <p className="text-sm font-black text-white">{r.winRate}%</p>
                                                        <p className="text-[8px] font-black text-[#444] uppercase">W/R</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-surface border border-white/5 rounded-[32px] p-20 flex flex-col items-center justify-center text-center opacity-40">
                                        <Gamepad2 size={48} className="text-white/5 mb-6" />
                                        <h3 className="text-sm font-black uppercase tracking-widest mb-2 italic">Aucune donnée de jeu</h3>
                                        <p className="text-xs max-w-sm">Défiez d'autres joueurs dans l'arène pour apparaître dans les classements officiels.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {activeTab !== 'resume' && (
                        <div className="bg-surface border border-white/5 rounded-[40px] p-20 flex flex-col items-center justify-center text-center min-h-[500px] animate-in slide-in-from-bottom-4 duration-500">
                             <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/5">
                                <Sparkles size={32} className="text-white/10" />
                            </div>
                            <h4 className="text-lg font-black text-white uppercase tracking-widest mb-3 italic">Données en cours de synchronisation</h4>
                            <p className="text-xs text-text-muted/40 max-w-md font-medium px-4">Cette section sera débloquée dès que les premiers résultats de tournois et de ligues seront entérinés par les arbitres de l'Arena.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="bg-surface border border-white/5 rounded-[28px] p-6 hover:bg-white/[0.02] transition-all group overflow-hidden relative">
            <div className="relative z-10 flex flex-col gap-4">
                <div className="w-12 h-12 rounded-2xl bg-black border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    {icon}
                </div>
                <div>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">{label}</p>
                    <p className="text-2xl font-black text-white tracking-tighter tabular-nums">{value}</p>
                </div>
            </div>
        </div>
    );
}
