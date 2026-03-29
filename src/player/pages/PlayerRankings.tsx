import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { useOutletContext } from 'react-router-dom';
import {
    Crown, Search,
    Minus, Shield, Star, Swords, Activity,
    ChevronUp, ChevronDown, Globe,
} from 'lucide-react';
import { cn } from '../../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type Region = 'ALL' | 'EU' | 'NA' | 'AS' | 'AF' | 'OCE' | 'SA';
type RankTier = 'Radiant' | 'Immortal' | 'Diamond' | 'Platinum' | 'Gold' | 'Silver' | 'Bronze';

interface Player {
    id: number;
    name: string;
    avatar: string;
    country: string;
    countryCode: string;
    region: Region;
    tier: RankTier;
    elo: number;
    winRate: number;
    wins: number;
    losses: number;
    kd: number;
    matches: number;
    trend: 'up' | 'down' | 'same';
    trendDelta: number;
    isOnline: boolean;
    isPro: boolean;
    game: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PLAYERS: Player[] = [
    { id:1,  name:'ZenithGod',    avatar:'Aidan',      country:'South Korea',    countryCode:'🇰🇷', region:'AS',  tier:'Radiant',  elo:4280, winRate:81, wins:324, losses:75,  kd:3.8, matches:399, trend:'up',   trendDelta:12, isOnline:true,  isPro:true,  game:'Valorant' },
    { id:2,  name:'ShadowBlade',  avatar:'Aneka',      country:'France',         countryCode:'🇫🇷', region:'EU',  tier:'Radiant',  elo:4150, winRate:78, wins:310, losses:88,  kd:3.5, matches:398, trend:'same', trendDelta:0,  isOnline:true,  isPro:true,  game:'Valorant' },
    { id:3,  name:'NeonPhoenix',  avatar:'Leah',       country:'United States',  countryCode:'🇺🇸', region:'NA',  tier:'Radiant',  elo:4090, winRate:76, wins:298, losses:94,  kd:3.2, matches:392, trend:'up',   trendDelta:5,  isOnline:false, isPro:true,  game:'LoL'      },
    { id:4,  name:'VoidHunter',   avatar:'Brooklynn',  country:'Brazil',         countryCode:'🇧🇷', region:'SA',  tier:'Radiant',  elo:3980, winRate:74, wins:285, losses:100, kd:3.0, matches:385, trend:'down', trendDelta:-3, isOnline:true,  isPro:false, game:'CS2'      },
    { id:5,  name:'CyberWolf',    avatar:'Buster',     country:'Germany',        countryCode:'🇩🇪', region:'EU',  tier:'Immortal', elo:3850, winRate:72, wins:270, losses:104, kd:2.9, matches:374, trend:'up',   trendDelta:8,  isOnline:true,  isPro:true,  game:'Valorant' },
    { id:6,  name:'StormRider',   avatar:'Lilith',     country:'Japan',          countryCode:'🇯🇵', region:'AS',  tier:'Immortal', elo:3740, winRate:71, wins:261, losses:107, kd:2.7, matches:368, trend:'down', trendDelta:-6, isOnline:false, isPro:false, game:'LoL'      },
    { id:7,  name:'GhostSniper',  avatar:'Ryker',      country:'United Kingdom', countryCode:'🇬🇧', region:'EU',  tier:'Immortal', elo:3680, winRate:70, wins:255, losses:109, kd:2.6, matches:364, trend:'up',   trendDelta:2,  isOnline:true,  isPro:true,  game:'CS2'      },
    { id:8,  name:'PixelKnight',  avatar:'Zoey',       country:'China',          countryCode:'🇨🇳', region:'AS',  tier:'Immortal', elo:3620, winRate:69, wins:248, losses:112, kd:2.5, matches:360, trend:'same', trendDelta:0,  isOnline:true,  isPro:false, game:'Valorant' },
    { id:9,  name:'ArcaneWitch',  avatar:'Mia',        country:'Sweden',         countryCode:'🇸🇪', region:'EU',  tier:'Immortal', elo:3560, winRate:68, wins:240, losses:113, kd:2.4, matches:353, trend:'up',   trendDelta:4,  isOnline:false, isPro:true,  game:'LoL'      },
    { id:10, name:'IronTitan',    avatar:'Kingston',   country:'Australia',      countryCode:'🇦🇺', region:'OCE', tier:'Diamond',  elo:3490, winRate:67, wins:234, losses:116, kd:2.3, matches:350, trend:'down', trendDelta:-2, isOnline:true,  isPro:false, game:'CS2'      },
    { id:11, name:'BlazeRunner',  avatar:'Chase',      country:'Canada',         countryCode:'🇨🇦', region:'NA',  tier:'Diamond',  elo:3410, winRate:66, wins:226, losses:116, kd:2.2, matches:342, trend:'up',   trendDelta:7,  isOnline:true,  isPro:true,  game:'Valorant' },
    { id:12, name:'QuantumFox',   avatar:'Aidan',      country:'Turkey',         countryCode:'🇹🇷', region:'EU',  tier:'Diamond',  elo:3350, winRate:65, wins:219, losses:118, kd:2.1, matches:337, trend:'same', trendDelta:0,  isOnline:false, isPro:false, game:'LoL'      },
    { id:13, name:'DarkMatter',   avatar:'Mason',      country:'Russia',         countryCode:'🇷🇺', region:'EU',  tier:'Diamond',  elo:3290, winRate:64, wins:212, losses:119, kd:2.0, matches:331, trend:'down', trendDelta:-4, isOnline:true,  isPro:false, game:'CS2'      },
    { id:14, name:'LunarEdge',    avatar:'Leah',       country:'India',          countryCode:'🇮🇳', region:'AS',  tier:'Diamond',  elo:3220, winRate:63, wins:205, losses:120, kd:1.9, matches:325, trend:'up',   trendDelta:9,  isOnline:true,  isPro:false, game:'Valorant' },
    { id:15, name:'FrostByte',    avatar:'Zoey',       country:'Poland',         countryCode:'🇵🇱', region:'EU',  tier:'Diamond',  elo:3160, winRate:62, wins:198, losses:121, kd:1.9, matches:319, trend:'up',   trendDelta:3,  isOnline:false, isPro:true,  game:'LoL'      },
    { id:16, name:'VenomStrike',  avatar:'Ryker',      country:'Mexico',         countryCode:'🇲🇽', region:'NA',  tier:'Platinum', elo:3090, winRate:61, wins:191, losses:122, kd:1.8, matches:313, trend:'down', trendDelta:-1, isOnline:true,  isPro:false, game:'CS2'      },
    { id:17, name:'NightCrawler', avatar:'Brooklynn',  country:'Nigeria',        countryCode:'🇳🇬', region:'AF',  tier:'Platinum', elo:3010, winRate:60, wins:183, losses:122, kd:1.8, matches:305, trend:'up',   trendDelta:6,  isOnline:true,  isPro:false, game:'Valorant' },
    { id:18, name:'OmegaForce',   avatar:'Buster',     country:'Netherlands',    countryCode:'🇳🇱', region:'EU',  tier:'Platinum', elo:2950, winRate:59, wins:176, losses:122, kd:1.7, matches:298, trend:'same', trendDelta:0,  isOnline:false, isPro:true,  game:'LoL'      },
    { id:19, name:'SteelPhantom', avatar:'Mia',        country:'Argentina',      countryCode:'🇦🇷', region:'SA',  tier:'Platinum', elo:2880, winRate:58, wins:168, losses:122, kd:1.7, matches:290, trend:'down', trendDelta:-5, isOnline:true,  isPro:false, game:'CS2'      },
    { id:20, name:'Player One',   avatar:'Felix',      country:'Tunisia',        countryCode:'🇹🇳', region:'AF',  tier:'Diamond',  elo:2840, winRate:68, wins:142, losses:67,  kd:2.1, matches:209, trend:'up',   trendDelta:4,  isOnline:true,  isPro:false, game:'Valorant' },
];

// ─── Tier config ──────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<RankTier, { color: string; bg: string; border: string; emoji: string }> = {
    Radiant:  { color: '#ffd700', bg: 'rgba(255,215,0,0.1)',    border: 'rgba(255,215,0,0.25)',    emoji: '👑' },
    Immortal: { color: '#ff4655', bg: 'rgba(255,70,85,0.1)',    border: 'rgba(255,70,85,0.25)',    emoji: '💀' },
    Diamond:  { color: '#a855f7', bg: 'rgba(168,85,247,0.1)',   border: 'rgba(168,85,247,0.25)',   emoji: '💎' },
    Platinum: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.25)',   emoji: '🔷' },
    Gold:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.25)',   emoji: '🥇' },
    Silver:   { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  border: 'rgba(148,163,184,0.25)',  emoji: '🥈' },
    Bronze:   { color: '#b45309', bg: 'rgba(180,83,9,0.1)',     border: 'rgba(180,83,9,0.25)',     emoji: '🥉' },
};

const REGIONS: { value: Region; label: string; flag: string }[] = [
    { value: 'ALL', label: 'Global',  flag: '🌍' },
    { value: 'EU',  label: 'Europe',  flag: '🇪🇺' },
    { value: 'NA',  label: 'N. America', flag: '🇺🇸' },
    { value: 'AS',  label: 'Asia',    flag: '🌏' },
    { value: 'AF',  label: 'Africa',  flag: '🌍' },
    { value: 'SA',  label: 'S. America', flag: '🌎' },
    { value: 'OCE', label: 'Oceania', flag: '🇦🇺' },
];

const GAMES = ['All Games', 'Valorant', 'LoL', 'CS2'];

type SortKey = 'elo' | 'winRate' | 'kd' | 'matches';

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PlayerRankings() {
    const { profile: myProfile } = useOutletContext<any>() || {};
    const myNickname = myProfile?.nickname || 'Player One';

    const [region, setRegion]     = useState<Region>('ALL');
    const [game, setGame]         = useState('All Games');
    const [search, setSearch]     = useState('');
    const [sortBy, setSortBy]     = useState<SortKey>('elo');
    const [expanded, setExpanded] = useState<number | null>(null);
    const [tierFilter] = useState<RankTier | 'ALL'>('ALL');
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);

    const countryCodeMap: Record<string, string> = {
        'TUNISIA': '🇹🇳', 'FRANCE': '🇫🇷', 'USA': '🇺🇸', 'GERMANY': '🇩🇪', 'JAPAN': '🇯🇵',
        'UK': '🇬🇧', 'CHINA': '🇨🇳', 'SWEDEN': '🇸🇪', 'AUSTRALIA': '🇦🇺', 'CANADA': '🇨🇦'
    };

    useEffect(() => {
        const fetchPlayers = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
                const res = await axios.get(`${API_URL}/player`);

                const mappedPlayers: Player[] = res.data.map((p: any) => ({
                    id: p._id,
                    name: p.userId?.nickname || 'Unknown',
                    avatar: p.userId?.avatar || 'Felix',
                    country: p.userId?.country || 'Unknown',
                    countryCode: countryCodeMap[p.userId?.country?.toUpperCase()] || '🌍',
                    region: (p.userId?.region || 'EU') as Region,
                    tier: (p.rank || 'Diamond') as RankTier,
                    elo: p.elo || 1000,
                    winRate: 50,
                    wins: 0,
                    losses: 0,
                    kd: 1.0,
                    matches: 0,
                    trend: 'same',
                    trendDelta: 0,
                    isOnline: true,
                    isPro: p.isPro || false,
                    game: 'Valorant'
                }));
                setPlayers(mappedPlayers);
            } catch (error) {
                console.error('Failed to fetch players:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlayers();
    }, []);

    const filtered = useMemo(() => {
        return MOCK_PLAYERS
            .filter(p => region === 'ALL' || p.region === region)
            .filter(p => game === 'All Games' || p.game === game)
            .filter(p => tierFilter === 'ALL' || p.tier === tierFilter)
            .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.country.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => b[sortBy] - a[sortBy]);
    }, [region, game, search, sortBy, tierFilter]);

    const topThree = filtered.slice(0, 3);

    return (
        <div className="flex flex-col gap-5 h-full overflow-y-auto animate-fade-in-up pb-4">

            {/* ── Hero ────────────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-3xl shrink-0"
                style={{ background: 'linear-gradient(135deg, #050505 0%, #1a0d00 60%, #050505 100%)', border: '1px solid rgba(255,215,0,0.1)' }}>
                <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
                    backgroundImage: 'linear-gradient(rgba(255,215,0,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.6) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }} />
                <div className="absolute -top-10 right-10 w-80 h-80 rounded-full blur-[120px] pointer-events-none" style={{ background: 'rgba(255,215,0,0.06)' }} />

                <div className="relative px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Crown size={20} style={{ color: '#ffd700' }} />
                            <span className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: 'rgba(255,215,0,0.6)' }}>Global Leaderboard</span>
                        </div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-white leading-none mb-2">
                            World <span style={{ color: '#ffd700', textShadow: '0 0 30px rgba(255,215,0,0.4)' }}>Rankings</span>
                        </h1>
                        <p className="text-sm text-white/35">Top players from every nation, ranked by performance.</p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                        {(['Radiant','Immortal','Diamond'] as RankTier[]).map(t => {
                            const tc = TIER_CONFIG[t];
                            const count = MOCK_PLAYERS.filter(p => p.tier === t).length;
                            return (
                                <div key={t} className="flex flex-col items-center px-4 py-3 rounded-2xl"
                                    style={{ background: tc.bg, border: `1px solid ${tc.border}` }}>
                                    <span className="text-xl mb-0.5">{tc.emoji}</span>
                                    <span className="text-sm font-black leading-none" style={{ color: tc.color }}>{count}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest mt-1" style={{ color: `${tc.color}80` }}>{t}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Filters ─────────────────────────────────────────────── */}
            <div className="flex flex-col gap-3 shrink-0">
                {/* Row 1: search + game */}
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.25)' }} />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search player or country…"
                            className="w-full rounded-2xl pl-10 pr-4 py-3 text-sm font-medium text-white placeholder-white/20 outline-none transition-all"
                    </div>
                    <div className="flex gap-1.5 p-1.5 rounded-2xl" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {GAMES.map(g => (
                            <button key={g} onClick={() => setGame(g)}
                                className="px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                                style={{
                                    background: game === g ? 'rgba(255,215,0,0.12)' : 'transparent',
                                    color: game === g ? '#ffd700' : 'rgba(255,255,255,0.3)',
                                    border: game === g ? '1px solid rgba(255,215,0,0.25)' : '1px solid transparent',
                                }}>
                                {g}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3 flex-wrap">
                    <div className="flex gap-1 p-1 rounded-2xl" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {REGIONS.map(r => (
                            <button key={r.value} onClick={() => setRegion(r.value)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                style={{
                                    background: region === r.value ? 'rgba(255,255,255,0.08)' : 'transparent',
                                    color: region === r.value ? '#fff' : 'rgba(255,255,255,0.3)',
                                }}>
                                <span>{r.flag}</span>
                                <span className="hidden sm:inline">{r.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Sort */}
                    <div className="flex gap-1 p-1 rounded-2xl ml-auto" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {([['elo','ELO'],['winRate','Win%'],['kd','K/D'],['matches','Games']] as [SortKey,string][]).map(([k,l]) => (
                            <button key={k} onClick={() => setSortBy(k)}
                                className="px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                style={{
                                    background: sortBy === k ? 'rgba(255,215,0,0.1)' : 'transparent',
                                    color: sortBy === k ? '#ffd700' : 'rgba(255,255,255,0.3)',
                                    border: sortBy === k ? '1px solid rgba(255,215,0,0.2)' : '1px solid transparent',
                                }}>
                                {l}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Podium (top 3) ───────────────────────────────────────── */}
            {topThree.length >= 3 && !loading && search === '' && region === 'ALL' && tierFilter === 'ALL' && (
                <div className="grid grid-cols-3 gap-3 shrink-0">
                    {[topThree[1], topThree[0], topThree[2]].map((p, visualIdx) => {
                        const podiumColors = [
                            { medal:'🥈', glowColor:'rgba(148,163,184,0.15)', ring:'rgba(148,163,184,0.4)' },
                            { medal:'👑', glowColor:'rgba(255,215,0,0.2)',    ring:'rgba(255,215,0,0.6)'    },
                            { medal:'🥉', glowColor:'rgba(234,88,12,0.15)',   ring:'rgba(234,88,12,0.4)'    },
                        ];
                        const pc = podiumColors[visualIdx];
                        return (
                            <div key={p.id} className={cn("flex flex-col items-center rounded-3xl p-5 transition-all duration-200 relative overflow-hidden", visualIdx === 1 ? 'pt-0' : 'pt-8')}
                                style={{ background: '#0d0d0d', border: `1px solid ${pc.ring.replace('0.4','0.2').replace('0.6','0.25')}`, boxShadow: `0 0 30px ${pc.glowColor}` }}>
                                <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at top, ${pc.glowColor} 0%, transparent 60%)` }} />
                                <span className="text-3xl mb-2 relative z-10">{pc.medal}</span>
                                <div className="relative mb-3 z-10">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2" style={{ borderColor: pc.ring }}>
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.avatar}`} className="w-full h-full bg-black" alt={p.name} />
                                    </div>
                                </div>
                                <p className="font-black text-white text-sm uppercase tracking-tight mb-0.5 z-10 relative">{p.name}</p>
                                <p className="text-[10px] font-bold mb-2 z-10 relative" style={{ color: 'rgba(255,255,255,0.35)' }}>{p.countryCode} {p.country}</p>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl mb-3 z-10 relative" style={{ background: tc.bg, border: `1px solid ${tc.border}` }}>
                                    <span className="text-sm">{tc.emoji}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: tc.color }}>{p.tier}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Table header ─────────────────────────────────────────── */}
            <div className="rounded-3xl overflow-hidden shrink-0" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Syncing database data...</p>
                    </div>
                ) : (
                    <>
                        <div className="grid items-center px-5 py-3.5 border-b border-white/[0.05]"
                            style={{ gridTemplateColumns: '52px 1fr 100px 90px 80px 80px 80px 80px' }}>
                            <span className="text-[10px] font-black uppercase tracking-widest text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>#</span>
                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>Player</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>Nation</span>
                            <SortHeader label="ELO" sortKey="elo" current={sortBy} onSort={setSortBy} />
                            <SortHeader label="Win%" sortKey="winRate" current={sortBy} onSort={setSortBy} />
                            <SortHeader label="W"    sortKey="winRate" current={sortBy} onSort={setSortBy} color="rgba(0,255,0,0.6)" />
                            <SortHeader label="K/D"  sortKey="kd"      current={sortBy} onSort={setSortBy} />
                            <SortHeader label="Games" sortKey="matches" current={sortBy} onSort={setSortBy} />
                        </div>

                        <div>
                            {filtered.map((p, idx) => {
                                const globalRank = idx + 1;
                                const tc = TIER_CONFIG[p.tier] || TIER_CONFIG.Diamond;
                                const isMe = p.name === myNickname;
                                const isExpanded = expanded === p.id;

                        return (
                            <div key={p.id}>
                                <div
                                    onClick={() => setExpanded(isExpanded ? null : p.id)}
                                    className="grid items-center px-5 py-4 cursor-pointer transition-all duration-150 border-t border-white/[0.04] relative"
                                    style={{
                                        gridTemplateColumns: '52px 1fr 100px 90px 80px 80px 80px 80px',
                                        background: isMe ? 'rgba(0,255,0,0.03)' : isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent',
                                        borderLeft: isMe ? '3px solid rgba(0,255,0,0.4)' : '3px solid transparent',
                                    }}
                                    onMouseEnter={e => { if(!isMe && !isExpanded) e.currentTarget.style.background = 'rgba(255,255,255,0.015)'; }}
                                    onMouseLeave={e => { if(!isMe && !isExpanded) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    {/* Rank */}
                                    <div className="flex justify-center">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm"
                                            style={{
                                                background: globalRank === 1 ? 'rgba(255,215,0,0.15)' : globalRank === 2 ? 'rgba(148,163,184,0.1)' : globalRank === 3 ? 'rgba(180,83,9,0.1)' : 'rgba(255,255,255,0.04)',
                                                color: globalRank === 1 ? '#ffd700' : globalRank === 2 ? '#94a3b8' : globalRank === 3 ? '#f97316' : 'rgba(255,255,255,0.3)',
                                            }}>
                                            {globalRank <= 3 ? ['👑','🥈','🥉'][globalRank-1] : globalRank}
                                        </div>
                                    </div>

                                    {/* Player identity */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="relative shrink-0">
                                            <div className="w-10 h-10 rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.avatar}`} className="w-full h-full bg-black" alt={p.name} />
                                            </div>
                                            {p.isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black bg-green-400" />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-sm text-white truncate">{p.name}</span>
                                                {p.isPro && <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,215,0,0.1)', color: '#ffd700', border: '1px solid rgba(255,215,0,0.2)' }}>PRO</span>}
                                                {isMe && <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,255,0,0.1)', color: '#00ff00', border: '1px solid rgba(0,255,0,0.2)' }}>YOU</span>}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md" style={{ background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>{tc.emoji} {p.tier}</span>
                                                <span className="text-[9px] font-bold text-white/25">{p.game}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Country */}
                                    <div className="flex flex-col items-center gap-0.5">
                                        <span className="text-xl">{p.countryCode}</span>
                                        <span className="text-[9px] font-bold text-white/25 truncate text-center max-w-[80px]">{p.country}</span>
                                    </div>

                                    {/* ELO */}
                                    <div className="text-center">
                                        <span className="font-black text-sm text-white">{p.elo.toLocaleString()}</span>
                                        <div className="flex items-center justify-center gap-1 mt-0.5">
                                            {p.trend === 'up'   && <><ChevronUp size={10} style={{ color: '#00ff00' }} /><span className="text-[9px] font-black" style={{ color: '#00ff00' }}>+{p.trendDelta}</span></>}
                                            {p.trend === 'down' && <><ChevronDown size={10} style={{ color: '#ef4444' }} /><span className="text-[9px] font-black" style={{ color: '#ef4444' }}>{p.trendDelta}</span></>}
                                            {p.trend === 'same' && <Minus size={10} style={{ color: 'rgba(255,255,255,0.2)' }} />}
                                        </div>
                                    </div>

                                    {/* Win rate */}
                                    <div className="text-center">
                                        <span className="font-black text-sm" style={{ color: p.winRate >= 70 ? '#00ff00' : p.winRate >= 60 ? '#eab308' : 'rgba(255,255,255,0.5)' }}>{p.winRate}%</span>
                                    </div>

                                    {/* Wins */}
                                    <div className="text-center">
                                        <span className="text-sm font-black text-green-400">{p.wins}</span>
                                        <span className="text-[9px] font-bold text-red-400 ml-1">/{p.losses}</span>
                                    </div>

                                    {/* K/D */}
                                    <div className="text-center">
                                        <span className="font-black text-sm" style={{ color: p.kd >= 3 ? '#ffd700' : p.kd >= 2 ? '#a855f7' : 'rgba(255,255,255,0.5)' }}>{p.kd.toFixed(1)}</span>
                                    </div>

                                    {/* Matches */}
                                    <div className="text-center">
                                        <span className="text-sm font-bold text-white/40">{p.matches}</span>
                                    </div>
                                </div>

                                {/* Expanded detail row */}
                                {isExpanded && (
                                    <div className="px-6 pb-4 border-t border-white/[0.04]" style={{ background: 'rgba(255,255,255,0.01)' }}>
                                        <div className="flex items-center gap-4 pt-4 flex-wrap">
                                            {/* Progress to next tier */}
                                            <div className="flex-1 min-w-[200px]">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Season Progress</span>
                                                    <span className="text-[10px] font-black" style={{ color: tc.color }}>{p.tier}</span>
                                                </div>
                                                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                                    <div className="h-full rounded-full transition-all"
                                                        style={{ width: `${p.winRate}%`, background: `linear-gradient(90deg, ${tc.color}80, ${tc.color})`, boxShadow: `0 0 8px ${tc.color}50` }} />
                                                </div>
                                            </div>
                                            {/* Quick stats */}
                                            {[
                                                { icon: <Activity size={12}/>, label:'Activity', value: p.isOnline ? '🟢 Online' : '⚫ Offline' },
                                                { icon: <Swords size={12}/>, label:'Region', value: p.region },
                                                { icon: <Shield size={12}/>, label:'Game', value: p.game },
                                                { icon: <Star size={12}/>, label:'Pro', value: p.isPro ? '✓ Verified' : '—' },
                                            ].map(s => (
                                                <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>{s.icon}</span>
                                                    <div>
                                                        <div className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>{s.label}</div>
                                                        <div className="text-[11px] font-black text-white">{s.value}</div>
                                                    </div>
                                                </div>
                                            ))}
                                            <button className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                                                style={{ background: 'rgba(0,255,0,0.08)', color: '#00ff00', border: '1px solid rgba(0,255,0,0.2)' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,255,0,0.15)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,255,0,0.08)')}>
                                                <Swords size={13}/> Challenge
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {filtered.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: 'rgba(255,255,255,0.15)' }}>
                            <Globe size={36} />
                            <p className="text-xs font-black uppercase tracking-widest">No players found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Sort header ──────────────────────────────────────────────────────────────

function SortHeader({ label, sortKey, current, onSort, color }: {
    label: string; sortKey: SortKey; current: SortKey; onSort: (k: SortKey) => void; color?: string;
}) {
    const active = current === sortKey;
    return (
        <button onClick={() => onSort(sortKey)}
            className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-widest transition-colors"
            style={{ color: active ? (color ?? '#ffd700') : 'rgba(255,255,255,0.2)' }}>
            {label}
            {active ? <ChevronDown size={10} /> : null}
        </button>
    );
}
