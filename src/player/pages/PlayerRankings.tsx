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
    id: string;
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
    const [expanded, setExpanded] = useState<string | null>(null);
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
        return players
            .filter(p => region === 'ALL' || p.region === region)
            .filter(p => game === 'All Games' || p.game === game)
            .filter(p => tierFilter === 'ALL' || p.tier === tierFilter)
            .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.country.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number));
    }, [players, region, game, search, sortBy, tierFilter]);

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
                            const count = players.filter(p => p.tier === t).length;
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
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.25)' }} />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search player or country…"
                            className="w-full rounded-2xl pl-10 pr-4 py-3 text-sm font-medium text-white placeholder-white/20 outline-none transition-all"
                            style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)' }} />
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
                        const tc = TIER_CONFIG[p.tier] || TIER_CONFIG.Diamond;
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
                                        >
                                            <div className="flex justify-center">
                                                <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm"
                                                    style={{
                                                        background: globalRank === 1 ? 'rgba(255,215,0,0.15)' : globalRank === 2 ? 'rgba(148,163,184,0.1)' : globalRank === 3 ? 'rgba(180,83,9,0.1)' : 'rgba(255,255,255,0.04)',
                                                        color: globalRank === 1 ? '#ffd700' : globalRank === 2 ? '#94a3b8' : globalRank === 3 ? '#f97316' : 'rgba(255,255,255,0.3)',
                                                    }}>
                                                    {globalRank <= 3 ? ['👑','🥈','🥉'][globalRank-1] : globalRank}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="relative shrink-0">
                                                    <div className="w-10 h-10 rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.avatar}`} className="w-full h-full bg-black" alt={p.name} />
                                                    </div>
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-sm text-white truncate">{p.name}</span>
                                                        {isMe && <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,255,0,0.1)', color: '#00ff00', border: '1px solid rgba(0,255,0,0.2)' }}>YOU</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md" style={{ background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>{tc.emoji} {p.tier}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center gap-0.5">
                                                <span className="text-xl">{p.countryCode}</span>
                                                <span className="text-[9px] font-bold text-white/25 truncate text-center max-w-[80px]">{p.country}</span>
                                            </div>

                                            <div className="text-center">
                                                <span className="font-black text-sm text-white">{p.elo.toLocaleString()}</span>
                                            </div>

                                            <div className="text-center">
                                                <span className="font-black text-sm text-white/50">{p.winRate}%</span>
                                            </div>

                                            <div className="text-center">
                                                <span className="text-sm font-black text-green-400">{p.wins}</span>
                                            </div>

                                            <div className="text-center">
                                                <span className="font-black text-sm text-white/50">{p.kd.toFixed(1)}</span>
                                            </div>

                                            <div className="text-center">
                                                <span className="text-sm font-bold text-white/40">{p.matches}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

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
