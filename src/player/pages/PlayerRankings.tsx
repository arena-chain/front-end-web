import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Search, Trophy, Globe, Medal, Crown, Star, TrendingUp, Users, ChevronDown, Info, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { cn } from '../../lib/utils';
import catalogService from '../../services/catalogService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Player {
    id: string;
    userId: string;
    rank: number;
    name: string;
    avatar: string;
    region: string;
    country: string;
    elo: number;
    winRate: string;
    totalMatches: number;
    tier: string;
    division: number;
}

interface ApiPlayerRank {
    _id: string;
    user: { _id: string; nickname: string; avatar?: string; country?: string; region?: string };
    game: { _id: string; title: string };
    elo: number;
    tier: string;
    division: number;
    winRate: number;
    totalMatches: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REGION_TABS = [
    { id: 'GLOBAL', label: 'Global', icon: <Globe size={13} className="text-blue-400" /> },
    { id: 'EUROPE', label: 'Europe' },
    { id: 'AFRICA', label: 'Afrique' },
    { id: 'ASIA', label: 'Asie' },
    { id: 'AMERICAS', label: 'Amériques' },
];

const TIER_FILTERS = [
    { id: 'ALL', label: 'Tout Paliers', icon: <Star size={12} /> },
    { id: 'CHALLENGER', label: 'Challenger', icon: <Crown size={12} /> },
    { id: 'MASTER', label: 'Master' },
    { id: 'DIAMOND', label: 'Diamant' },
    { id: 'PLATINUM', label: 'Platine' },
    { id: 'GOLD', label: 'Or' },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PlayerRankings() {
    const navigate = useNavigate();
    const context = useOutletContext<{ profile?: { nickname?: string } | null } | null>();
    const myNickname = context?.profile?.nickname || 'Player One';

    const [search, setSearch] = useState('');
    const [games, setGames] = useState<any[]>([]);
    const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
    const [regionTab, setRegionTab] = useState('GLOBAL');
    const [tierFilter, setTierFilter] = useState('ALL');
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const fetchedGames = await catalogService.fetchGames();
                setGames(fetchedGames);
                if (fetchedGames.length > 0) {
                    setSelectedGameId(fetchedGames[0]._id);
                }
            } catch (err) {
                console.error('Failed to fetch games', err);
            }
        };
        fetchGames();
    }, []);

    useEffect(() => {
        if (!selectedGameId) return;

        const fetchRankings = async () => {
            setLoading(true);
            try {
                // Use the new rank/leaderboard endpoint
                const res = await axios.get(`${API_URL}/rank/leaderboard/${selectedGameId}`);

                if (Array.isArray(res.data)) {
                    let filtered = res.data;

                    // Frontend filtering for search (optional if backend doesn't support it in leaderboard yet)
                    if (search) {
                        filtered = filtered.filter((p: ApiPlayerRank) => 
                            p.user.nickname.toLowerCase().includes(search.toLowerCase())
                        );
                    }

                    // Region filtering
                    if (regionTab !== 'GLOBAL') {
                        filtered = filtered.filter((p: ApiPlayerRank) => 
                            p.user.region === regionTab
                        );
                    }

                    // Tier filtering
                    if (tierFilter !== 'ALL') {
                        filtered = filtered.filter((p: ApiPlayerRank) => 
                            p.tier === tierFilter
                        );
                    }

                    const mapped: Player[] = filtered.map((p: ApiPlayerRank, idx: number) => ({
                        id: p._id,
                        userId: p.user._id,
                        rank: idx + 1,
                        name: p.user.nickname || 'Unknown',
                        avatar: p.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user.nickname}`,
                        region: p.user.region || 'EU',
                        country: p.user.country || 'Unknown',
                        elo: p.elo,
                        winRate: `${p.winRate}%`,
                        totalMatches: p.totalMatches,
                        tier: p.tier,
                        division: p.division,
                    }));
                    setPlayers(mapped);
                }
            } catch (error) {
                console.error('Error fetching rankings:', error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchRankings, 300);
        return () => clearTimeout(timer);
    }, [selectedGameId, search, regionTab, tierFilter]);

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-12">
            {/* Header section */}
            <div className="relative overflow-hidden rounded-[40px] border border-white/[0.05] p-12 bg-[#0a0a0b] shadow-2xl">
                <div className="absolute top-0 right-0 w-[500px] h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
                <div className="absolute -right-20 -top-20 w-96 h-96 bg-primary/5 blur-[140px] rounded-full" />
                <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full" />

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <Trophy size={20} className="text-primary" />
                            </div>
                            <span className="text-[12px] font-black uppercase tracking-[0.3em] text-text-muted">Competitive Division</span>
                        </div>
                        <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-none italic">
                            Hall of <span className="text-primary not-italic">Legends</span>
                        </h1>
                        <p className="text-text-muted text-base max-w-lg font-medium leading-relaxed">
                            Synchronisation en temps réel des meilleurs talents de l'infrastructure Arena. Dominez votre discipline.
                        </p>
                    </div>

                    <div className="hidden lg:flex items-center gap-16 bg-white/[0.02] border border-white/5 rounded-[32px] p-10 backdrop-blur-xl group">
                        <StatItem icon={<Users size={24} className="text-blue-400 group-hover:scale-110 transition-transform" />} label="Joueurs Actifs" value={players.length.toString()} />
                        <div className="w-px h-12 bg-white/10" />
                        <StatItem icon={<TrendingUp size={24} className="text-green-400 group-hover:scale-110 transition-transform" />} label="Matchs Trackés" value="2.4k+" />
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                    {/* Search */}
                    <div className="xl:col-span-12 relative group">
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary transition-colors">
                            <Search size={20} strokeWidth={3} />
                        </div>
                        <input
                            type="text"
                            placeholder="Rechercher un rival ou un coéquipier..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-16 pl-16 pr-8 rounded-3xl bg-surface border border-white/5 text-white placeholder:text-white/10 focus:outline-none focus:border-primary/40 focus:ring-8 focus:ring-primary/5 transition-all text-sm font-black uppercase tracking-[0.1em]"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-6">
                    {/* Game Selector - Real Data */}
                    <div className="flex items-center bg-surface border border-white/5 rounded-3xl p-1.5 overflow-x-auto scrollbar-hide max-w-full">
                        {games.map(game => (
                            <button
                                key={game._id}
                                onClick={() => setSelectedGameId(game._id)}
                                className={cn(
                                    "px-8 h-12 rounded-[20px] text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-3",
                                    selectedGameId === game._id ? "bg-primary text-black shadow-lg shadow-primary/20" : "text-text-muted hover:text-white hover:bg-white/5"
                                )}
                            >
                                <div className={cn("w-1.5 h-1.5 rounded-full", selectedGameId === game._id ? "bg-black" : "bg-primary/40")} />
                                {game.title}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-5">
                        {/* Region Selector */}
                        <div className="flex items-center gap-1.5 p-1.5 rounded-3xl bg-surface border border-white/5">
                            {REGION_TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setRegionTab(tab.id)}
                                    className={cn(
                                        "flex items-center gap-3 px-6 py-2.5 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all",
                                        regionTab === tab.id
                                            ? "bg-white/[0.08] text-white border border-white/10 shadow-lg"
                                            : "text-text-muted hover:text-white"
                                    )}
                                >
                                    {tab.icon}{tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tier Filter */}
                        <div className="flex items-center gap-1.5 p-1.5 rounded-3xl bg-surface border border-white/5">
                            {TIER_FILTERS.map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setTierFilter(f.id)}
                                    className={cn(
                                        "flex items-center gap-3 px-6 py-2.5 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all",
                                        tierFilter === f.id ? "bg-primary/15 text-primary border border-primary/20 shadow-lg shadow-primary/5" : "text-text-muted hover:text-white"
                                    )}
                                >
                                    {f.icon}{f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-surface border border-white/5 rounded-[48px] overflow-hidden shadow-2xl relative">
                <div className="min-w-full">
                    {/* Header */}
                    <div className="grid grid-cols-[100px_1fr_140px_140px_120px] gap-6 px-12 py-8 border-b border-white/5 text-[11px] font-black uppercase tracking-[0.3em] text-[#444]">
                        <div className="flex items-center gap-2">Rang <ChevronDown size={12} className="text-primary"/></div>
                        <div className="flex items-center gap-2">Athlète <Info size={10} className="opacity-30" /></div>
                        <div className="text-center">Origine</div>
                        <div className="text-center">Points (ELO)</div>
                        <div className="text-center">Taux Victoires</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-white/[0.02]">
                        {loading ? (
                            <div className="p-32 flex flex-col items-center justify-center gap-6 text-text-muted">
                                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(0,255,136,0.2)]" />
                                <p className="text-[12px] font-black uppercase tracking-[0.4em] animate-pulse">Scanning Neural Network...</p>
                            </div>
                        ) : players.length > 0 ? players.map((player) => (
                            <div key={player.id} 
                                onClick={() => navigate(`/player/profile/${player.userId}`)}
                                className={cn(
                                    "grid grid-cols-[100px_1fr_140px_140px_120px] gap-6 items-center px-12 py-8 transition-all duration-500 group hover:bg-white/[0.03] relative cursor-pointer",
                                    player.name === myNickname && "bg-primary/[0.03] border-y border-primary/10"
                                )}>

                                {/* Rank/Pos */}
                                <div className="flex items-center">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black transition-all group-hover:scale-110",
                                        player.rank === 1 ? "bg-primary text-black shadow-[0_0_30px_rgba(0,255,136,0.4)]" :
                                            player.rank === 2 ? "bg-slate-400 text-black" :
                                                player.rank === 3 ? "bg-orange-600 text-white" :
                                                    "bg-white/5 text-white/40 border border-white/5"
                                    )}>
                                        {player.rank === 1 ? <Crown size={18} /> :
                                            player.rank === 2 ? <Medal size={18} /> :
                                                player.rank === 3 ? <Medal size={18} /> :
                                                    player.rank}
                                    </div>
                                </div>

                                {/* Player Identity */}
                                <div className="flex items-center gap-6 min-w-0">
                                    <div className="relative shrink-0">
                                        <div className="w-16 h-16 rounded-[24px] bg-black border-2 border-white/5 overflow-hidden group-hover:border-primary/50 transition-all duration-500">
                                            <img src={player.avatar} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary border-4 border-[#0a0a0b] rounded-full shadow-[0_0_15px_rgba(0,255,136,0.6)]" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-3 mb-1.5">
                                            <span className="font-black text-white text-xl truncate group-hover:text-primary transition-colors uppercase tracking-tight italic">{player.name}</span>
                                            {player.name === myNickname && (
                                                <div className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                                                    <span className="text-[8px] font-black text-primary uppercase">Moi</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black px-3 py-1 rounded-lg bg-white/5 text-white/60 border border-white/10 flex items-center gap-2 uppercase tracking-widest">
                                                <Star size={10} className="text-primary" fill="currentColor" /> {player.tier} {player.division}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Nation */}
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-3">
                                        <Globe size={18} className="text-blue-500/60" />
                                        <span className="text-sm font-black text-white/80 uppercase tracking-widest">{player.region}</span>
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-text-muted mt-2 opacity-40">{player.country}</span>
                                </div>

                                {/* ELO */}
                                <div className="text-center">
                                    <span className="text-2xl font-black text-white group-hover:text-primary transition-colors tabular-nums">{player.elo.toLocaleString()}</span>
                                </div>

                                {/* Win Rate */}
                                <div className="text-center flex flex-col items-center">
                                    <span className="text-base font-black text-white/80 tabular-nums">{player.winRate}</span>
                                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-1">{player.totalMatches} matchs</span>
                                </div>
                            </div>
                        )) : (
                            <div className="p-40 flex flex-col items-center gap-6 text-center">
                                <RefreshCw size={40} className="text-white/5" />
                                <div className="space-y-2">
                                    <p className="text-[14px] font-black uppercase tracking-[0.4em] text-text-muted">Aucune Donnée</p>
                                    <p className="text-[10px] font-medium text-white/20 uppercase tracking-widest">Ajustez vos filtres pour découvrir de nouveaux talents</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center shadow-xl">
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted mb-1">{label}</p>
                <p className="text-2xl font-black text-white tracking-tighter">{value}</p>
            </div>
        </div>
    );
}
