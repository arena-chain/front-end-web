import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { createPortal } from 'react-dom';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
    Swords, Clock, Trophy, Zap, Target,
    ChevronRight, Flame, Star, Activity,
    Users, Crown,
    Globe, Search, X, Smartphone, Monitor, ArrowRight,
} from 'lucide-react';
import { PerformanceChart } from '../components/PerformanceChart';
import { getApiBase } from '../../lib/apiBase';

// ─── Main Component ───────────────────────────────────────────────────────────

// ─── Rank config ─────────────────────────────────────────────────────────────

const RANK_CONFIG: Record<string, { emoji: string; color: string; min: number; max: number; next: string }> = {
    Radiant:  { emoji: '👑', color: '#ffd700', min: 4000, max: 5000, next: '' },
    Immortal: { emoji: '💀', color: '#ff4655', min: 3500, max: 4000, next: 'Radiant' },
    Diamond:  { emoji: '💎', color: '#a855f7', min: 2500, max: 3500, next: 'Immortal' },
    Platinum: { emoji: '🔷', color: '#3b82f6', min: 2000, max: 2500, next: 'Diamond' },
    Gold:     { emoji: '🥇', color: '#f59e0b', min: 1500, max: 2000, next: 'Platinum' },
    Silver:   { emoji: '🥈', color: '#94a3b8', min: 1000, max: 1500, next: 'Gold' },
    Bronze:   { emoji: '🥉', color: '#b45309', min:  500, max: 1000, next: 'Silver' },
};

interface PlayerStats {
    elo: number;
    rank: string;
    stats?: { winRate?: number; killsPerRound?: number; deathPerRound?: number };
}
interface RecentMatch {
    id: string;
    result: 'W' | 'L';
    map: string;
    score: string;
    ago: string;
}
interface OnlinePlayer {
    id: string;
    name: string;
    avatar: string;
    rank: string;
    rankEmoji: string;
    status: 'online' | 'in-game';
    game?: string;
    region: string;
    elo: number;
}

type AppModalType = 'match' | 'scrims' | null;

export default function PlayerDashboard() {
    const navigate = useNavigate();
    const outletCtx = useOutletContext<{ profile?: { _id?: string } | null } | null>();
    const [appModal, setAppModal] = useState<AppModalType>(null);
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);
    const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            setStatsLoading(true);
            const token = localStorage.getItem('token');
            const API = getApiBase();
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            try {
                const [meRes, profileRes, allPlayersRes, usersRes, channelsRes] = await Promise.allSettled([
                    axios.get(`${API}/player/me`, { headers }),
                    axios.get(`${API}/auth/profile`, { headers }),
                    axios.get(`${API}/player`, { headers }),
                    axios.get(`${API}/users`, { headers }),
                    axios.get(`${API}/channel`),
                ]);

                const me = meRes.status === 'fulfilled' ? meRes.value.data : null;
                const myUser = profileRes.status === 'fulfilled' ? profileRes.value.data : null;
                const allPlayers = allPlayersRes.status === 'fulfilled' && Array.isArray(allPlayersRes.value.data) ? allPlayersRes.value.data : [];
                const allUsers = usersRes.status === 'fulfilled' && Array.isArray(usersRes.value.data) ? usersRes.value.data : [];
                const allChannels = channelsRes.status === 'fulfilled' && Array.isArray(channelsRes.value.data) ? channelsRes.value.data : [];

                setPlayerStats({
                    elo: me?.elo ?? 0,
                    rank: me?.rank ?? 'Unranked',
                    stats: me?.stats ?? {},
                });

                const myUserId = myUser?._id || outletCtx?.profile?._id;
                if (myUserId) {
                    try {
                        const matchesRes = await axios.get(`${API}/scouter/players/${myUserId}/matches`, { headers });
                        const matches = Array.isArray(matchesRes.data) ? matchesRes.data.slice(0, 5) : [];
                        const mapped: RecentMatch[] = matches.map((m: any) => {
                            const t1 = Number(m.team1GamesWon ?? 0);
                            const t2 = Number(m.team2GamesWon ?? 0);
                            const result: 'W' | 'L' = t1 >= t2 ? 'W' : 'L';
                            const ago = m.scheduledStart ? `${Math.max(1, Math.floor((Date.now() - new Date(m.scheduledStart).getTime()) / 3600000))}h ago` : 'recent';
                            return {
                                id: String(m._id),
                                result,
                                map: typeof m.mapName === 'string' ? m.mapName : 'Match',
                                score: `${t1} – ${t2}`,
                                ago,
                            };
                        });
                        setRecentMatches(mapped);
                    } catch {
                        setRecentMatches([]);
                    }
                } else {
                    setRecentMatches([]);
                }

                const playerProfilesByUser = new Map<string, { elo?: number; rank?: string }>();
                allPlayers.forEach((p: any) => {
                    const uid = typeof p.userId === 'object' ? p.userId?._id : p.userId;
                    if (uid) playerProfilesByUser.set(String(uid), { elo: p.elo, rank: p.rank });
                });

                const liveByOwner = new Map<string, { game?: string }>();
                allChannels.forEach((c: any) => {
                    if (c?.isActive && c?.ownerId?._id) {
                        liveByOwner.set(String(c.ownerId._id), { game: c.categories?.[0] });
                    }
                });

                const mappedOnline: OnlinePlayer[] = allUsers
                    .filter((u: any) => u?.role === 'player' && u?.isActive && u?._id !== myUserId)
                    .slice(0, 30)
                    .map((u: any) => {
                        const prof = playerProfilesByUser.get(String(u._id));
                        const isLive = liveByOwner.has(String(u._id));
                        const rankText = prof?.rank || 'Unranked';
                        const rankEmoji = rankText.toLowerCase().includes('diamond') ? '💎'
                            : rankText.toLowerCase().includes('platinum') ? '🏆'
                                : rankText.toLowerCase().includes('gold') ? '⚡'
                                    : '🥈';
                        return {
                            id: String(u._id),
                            name: u.nickname || 'Player',
                            avatar: u.avatar || u.nickname || String(u._id).slice(-6),
                            rank: rankText,
                            rankEmoji,
                            status: isLive ? 'in-game' : 'online',
                            game: liveByOwner.get(String(u._id))?.game,
                            region: u.region || 'EU',
                            elo: Number(prof?.elo ?? 0),
                        };
                    });
                setOnlinePlayers(mappedOnline);
            } catch {
                setPlayerStats({ elo: 0, rank: 'Unranked' });
                setRecentMatches([]);
                setOnlinePlayers([]);
            } finally {
                setStatsLoading(false);
            }
        };
        fetchStats();
    }, [outletCtx?.profile?._id]);

    const chartData = recentMatches
        .slice()
        .reverse()
        .map((m, idx) => {
            const [a, b] = m.score.split('–').map((v) => Number(v.trim()));
            const delta = Number.isFinite(a) && Number.isFinite(b) ? (a - b) * 20 : 0;
            const base = (playerStats?.elo ?? 1000) - (recentMatches.length - idx) * 15;
            return {
                label: `M${idx + 1}`,
                valorant: Math.max(0, Math.round(base + delta)),
                lol: Math.max(0, Math.round(base - delta / 2)),
            };
        });

    return (
        <div className="flex gap-4 h-full animate-fade-in-up overflow-hidden">
        {appModal && <AppRequiredModal type={appModal} onClose={() => setAppModal(null)} />}

        {/* ── Main content ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 flex-1 min-w-0 overflow-y-auto pr-1">

            {/* ── Hero Banner ──────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 shrink-0" style={{ background: 'linear-gradient(135deg, #050505 0%, #0a1a0a 50%, #050505 100%)' }}>
                {/* Scanline overlay */}
                <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)',
                }} />
                {/* Green grid */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{
                    backgroundImage: 'linear-gradient(rgba(0,255,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,0,0.5) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }} />
                {/* Glow blobs */}
                <div className="absolute -top-12 -right-12 w-80 h-80 rounded-full blur-[120px] pointer-events-none" style={{ background: 'rgba(0,255,0,0.07)' }} />
                <div className="absolute -bottom-8 left-1/3 w-48 h-48 rounded-full blur-[80px] pointer-events-none" style={{ background: 'rgba(0,255,0,0.05)' }} />

                <div className="relative p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    {/* Left: Text + buttons */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border"
                                style={{ color: '#00ff00', borderColor: 'rgba(0,255,0,0.3)', background: 'rgba(0,255,0,0.08)' }}>
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                Arena Online
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Season 4 · Week 7</span>
                        </div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-white leading-none mb-1">
                            Ready to<br />
                            <span style={{ color: '#00ff00', textShadow: '0 0 30px rgba(0,255,0,0.4)' }}>Dominate?</span>
                        </h1>
                        <p className="text-sm text-white/40 font-medium mt-3 mb-5">Queue up and prove your rank on the global leaderboard.</p>

                        <div className="flex items-center gap-3 flex-wrap">
                            <button
                                onClick={() => setAppModal('match')}
                                className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest text-black transition-all duration-200 hover:scale-105 active:scale-95"
                                style={{
                                    background: '#00ff00',
                                    boxShadow: '0 0 24px rgba(0,255,0,0.4), 0 4px 20px rgba(0,0,0,0.4)',
                                }}
                            >
                                <Swords size={16} />
                                Find Match
                            </button>
                            <button
                                onClick={() => setAppModal('scrims')}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl font-black text-sm uppercase tracking-widest text-white/70 border border-white/10 hover:border-white/25 hover:text-white transition-all duration-200 bg-white/[0.03]"
                            >
                                <Clock size={15} />
                                Scheduled Scrims
                            </button>
                        </div>
                    </div>

                    {/* Right: Rank card */}
                    {(() => {
                        const cfg = RANK_CONFIG[playerStats?.rank ?? ''] ?? RANK_CONFIG['Diamond'];
                        const elo = playerStats?.elo ?? 0;
                        const progress = cfg ? Math.min(100, Math.round(((elo - cfg.min) / (cfg.max - cfg.min)) * 100)) : 0;
                        const toNext = cfg ? Math.max(0, cfg.max - elo) : 0;
                        return (
                            <div className="shrink-0 flex flex-col items-center justify-center rounded-2xl border px-8 py-5 text-center transition-all"
                                style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', borderColor: cfg ? `${cfg.color}30` : 'rgba(255,255,255,0.1)' }}>
                                {statsLoading ? (
                                    <div className="flex flex-col items-center gap-2 w-28">
                                        <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse" />
                                        <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
                                        <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
                                        <div className="h-1.5 w-full bg-white/5 rounded-full animate-pulse mt-1" />
                                    </div>
                                ) : playerStats ? (
                                    <>
                                        <div className="text-5xl mb-2" style={{ filter: `drop-shadow(0 0 14px ${cfg.color}60)` }}>
                                            {cfg.emoji}
                                        </div>
                                        <div className="text-xl font-black text-white uppercase tracking-tight">{playerStats.rank}</div>
                                        <div className="text-[10px] font-black uppercase tracking-widest mt-1" style={{ color: cfg.color }}>
                                            {elo.toLocaleString()} ELO
                                        </div>
                                        <div className="w-full mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${cfg.color}80, ${cfg.color})`, boxShadow: `0 0 6px ${cfg.color}60` }} />
                                        </div>
                                        <div className="text-[9px] font-bold text-white/30 mt-1 uppercase tracking-widest">
                                            {cfg.next ? `${toNext.toLocaleString()} ELO to ${cfg.next}` : 'Max Rank'}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-5xl mb-2 opacity-30">?</div>
                                        <div className="text-sm font-black text-white/30 uppercase tracking-tight">No Rank</div>
                                        <div className="text-[9px] font-bold text-white/20 mt-1">Play matches to rank up</div>
                                    </>
                                )}
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* ── Quick Stats row ───────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
                <HudStat
                    icon={<Target size={18} />}
                    label="Win Rate"
                    value={playerStats?.stats?.winRate != null ? `${Math.round(playerStats.stats.winRate)}%` : '—'}
                    sub="from profile stats"
                    color="#00ff00"
                />
                <HudStat
                    icon={<Flame size={18} />}
                    label="Live Players"
                    value={String(onlinePlayers.filter((p) => p.status === 'in-game').length)}
                    sub={`${onlinePlayers.length} online`}
                    color="#f97316"
                />
                <HudStat
                    icon={<Activity size={18} />}
                    label="K/D Ratio"
                    value={
                        playerStats?.stats?.killsPerRound && playerStats?.stats?.deathPerRound
                            ? (playerStats.stats.killsPerRound / Math.max(playerStats.stats.deathPerRound, 0.01)).toFixed(2)
                            : '—'
                    }
                    sub="from profile stats"
                    color="#a855f7"
                />
                <HudStat
                    icon={<Zap size={18} />}
                    label="Recent Matches"
                    value={String(recentMatches.length)}
                    sub="last fetched"
                    color="#3b82f6"
                />
            </div>

            {/* ── Middle split ──────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 flex-1 min-h-0">

                {/* Performance chart */}
                <div className="min-h-0">
                    <PerformanceChart data={chartData} />
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-3 min-h-0 overflow-y-auto">

                    {/* ── Recent Matches ── */}
                    <div className="rounded-2xl overflow-hidden" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,255,0,0.1)' }}>
                                    <Swords size={12} style={{ color: '#00ff00' }} />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-[0.15em] text-white">Recent Matches</span>
                            </div>
                            <button className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest transition-colors"
                                style={{ color: 'rgba(255,255,255,0.25)' }}
                                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
                                onClick={() => navigate('/player/matches')}>
                                View all <ChevronRight size={10} />
                            </button>
                        </div>
                        <div>
                            {recentMatches.map((m, i) => (
                                <div key={m.id}
                                    className="flex items-center gap-3 px-5 py-3 group cursor-pointer transition-colors"
                                    style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    {/* Result pill */}
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0 relative overflow-hidden"
                                        style={{
                                            background: m.result === 'W' ? 'rgba(0,255,0,0.12)' : 'rgba(239,68,68,0.12)',
                                            border: `1px solid ${m.result === 'W' ? 'rgba(0,255,0,0.3)' : 'rgba(239,68,68,0.3)'}`,
                                            color: m.result === 'W' ? '#00ff00' : '#ef4444',
                                            boxShadow: m.result === 'W' ? '0 0 8px rgba(0,255,0,0.15)' : '0 0 8px rgba(239,68,68,0.15)',
                                        }}>
                                        {m.result}
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <span className="text-xs font-black text-white truncate">{m.map}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.28)' }}>{m.score}</span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold shrink-0" style={{ color: 'rgba(255,255,255,0.18)' }}>{m.ago}</span>
                                </div>
                            ))}
                            {recentMatches.length === 0 && (
                                <div className="px-5 py-6 text-center text-[11px] text-white/35">No recent matches available.</div>
                            )}
                        </div>
                    </div>

                    {/* ── Live summary ── */}
                    <div className="rounded-2xl overflow-hidden" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(234,179,8,0.1)' }}>
                                    <Star size={12} style={{ color: '#eab308' }} />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-[0.15em] text-white">Live Ecosystem</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full"
                                style={{ background: 'rgba(0,255,0,0.08)', color: '#00ff00', border: '1px solid rgba(0,255,0,0.15)' }}>
                                Dynamic
                            </div>
                        </div>
                        <div className="p-3 space-y-2">
                            {[
                                { label: 'Players online', value: onlinePlayers.length },
                                { label: 'Players in live channels', value: onlinePlayers.filter((p) => p.status === 'in-game').length },
                                { label: 'Recent matches loaded', value: recentMatches.length },
                            ].map((item) => (
                                <div key={item.label} className="rounded-xl p-3 transition-all border border-white/5 bg-white/[0.02]">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[11px] text-white/75">{item.label}</span>
                                        <span className="text-[11px] font-black text-primary">{item.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Quick Nav ── */}
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { icon: <Trophy size={16} />, label: 'Leagues',     path: '/player/leagues',     color: '#a855f7', bg: 'rgba(168,85,247,0.08)'  },
                            { icon: <Users size={16} />,  label: 'Tournaments', path: '/player/tournaments', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)'  },
                            { icon: <Crown size={16} />,  label: 'Top Ranks',   path: '/player/leagues',     color: '#eab308', bg: 'rgba(234,179,8,0.08)'   },
                        ].map((item) => (
                            <button key={item.label} onClick={() => navigate(item.path)}
                                className="flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl transition-all duration-200 group"
                                style={{ background: item.bg, border: `1px solid ${item.color}22` }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = `${item.color}44`)}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = `${item.color}22`)}
                            >
                                <span className="transition-transform duration-200 group-hover:scale-110" style={{ color: item.color }}>
                                    {item.icon}
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-widest transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* ── RIGHT: Online Players Panel ───────────────────────────── */}
        <OnlinePanel players={onlinePlayers} />

        </div>
    );
}

// ─── Online Players Panel (right) ────────────────────────────────────────────

function OnlinePanel({ players }: { players: OnlinePlayer[] }) {
    const [filter, setFilter] = useState<'all' | 'in-game' | 'online'>('all');
    const [search, setSearch] = useState('');

    const inGameCount  = players.filter(p => p.status === 'in-game').length;
    const onlineCount  = players.filter(p => p.status === 'online').length;

    const visible = players.filter(p => {
        const matchFilter = filter === 'all' || p.status === filter;
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

    const regionFlag: Record<string, string> = { EU: '🇪🇺', NA: '🇺🇸', AS: '🌏', AF: '🌍' };

    return (
        <div className="w-56 shrink-0 flex flex-col gap-3 h-full overflow-hidden">

            {/* Live stats banner */}
            <div className="rounded-2xl p-3 shrink-0"
                style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-1.5 mb-3">
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00ff00', boxShadow: '0 0 6px #00ff00' }} />
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white">Live Activity</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)' }}>
                        <div className="text-lg font-black leading-none" style={{ color: '#a855f7' }}>{inGameCount}</div>
                        <div className="text-[9px] font-black uppercase tracking-widest mt-0.5" style={{ color: 'rgba(168,85,247,0.6)' }}>In Game</div>
                    </div>
                    <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(0,255,0,0.06)', border: '1px solid rgba(0,255,0,0.12)' }}>
                        <div className="text-lg font-black leading-none" style={{ color: '#00ff00' }}>{onlineCount}</div>
                        <div className="text-[9px] font-black uppercase tracking-widest mt-0.5" style={{ color: 'rgba(0,255,0,0.5)' }}>Online</div>
                    </div>
                </div>
            </div>

            {/* Main panel */}
            <div className="flex-1 flex flex-col rounded-2xl overflow-hidden min-h-0"
                style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>

                {/* Header */}
                <div className="px-4 py-3.5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,255,0,0.1)' }}>
                                <Globe size={12} style={{ color: '#00ff00' }} />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-white">Players</span>
                        </div>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(0,255,0,0.08)', color: '#00ff00', border: '1px solid rgba(0,255,0,0.15)' }}>
                            {players.length} online
                        </span>
                    </div>

                    {/* Search */}
                    <div className="relative mb-2.5">
                        <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.25)' }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search player..."
                            className="w-full rounded-xl pl-7 pr-3 py-1.5 text-[11px] font-bold text-white placeholder-white/20 outline-none"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                        />
                    </div>

                    {/* Filter tabs */}
                    <div className="flex gap-1">
                        {(['all', 'in-game', 'online'] as const).map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className="flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                                style={{
                                    background: filter === f
                                        ? f === 'in-game' ? 'rgba(168,85,247,0.2)' : 'rgba(0,255,0,0.12)'
                                        : 'rgba(255,255,255,0.03)',
                                    color: filter === f
                                        ? f === 'in-game' ? '#a855f7' : '#00ff00'
                                        : 'rgba(255,255,255,0.25)',
                                    border: filter === f
                                        ? f === 'in-game' ? '1px solid rgba(168,85,247,0.3)' : '1px solid rgba(0,255,0,0.2)'
                                        : '1px solid transparent',
                                }}>
                                {f === 'all' ? 'All' : f === 'in-game' ? '🎮' : '●'}
                                {f === 'all' ? '' : f === 'in-game' ? ' Game' : ' Online'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Player list */}
                <div className="flex-1 overflow-y-auto">
                    {visible.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
                            <Search size={20} />
                            <p className="text-[10px] font-bold uppercase tracking-widest">No players found</p>
                        </div>
                    ) : visible.map((p, i) => (
                        <div key={p.id}
                            className="flex items-center gap-2.5 px-4 py-2.5 transition-colors cursor-pointer group"
                            style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                            {/* Avatar */}
                            <div className="relative shrink-0">
                                <div className="w-8 h-8 rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                                    <img
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.avatar}`}
                                        className="w-full h-full bg-black"
                                        alt={p.name}
                                    />
                                </div>
                                {/* Status dot */}
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black"
                                    style={{
                                        background: p.status === 'in-game' ? '#a855f7' : '#00ff00',
                                        boxShadow: p.status === 'in-game' ? '0 0 5px rgba(168,85,247,0.8)' : '0 0 5px rgba(0,255,0,0.8)',
                                    }} />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 mb-0.5">
                                    <span className="text-[11px] font-black text-white truncate group-hover:text-primary transition-colors" style={{ '--tw-text-opacity': 1 } as React.CSSProperties}>
                                        {p.name}
                                    </span>
                                    <span className="text-[9px] shrink-0">{regionFlag[p.region]}</span>
                                </div>
                                <div className="text-[9px] font-bold truncate" style={{
                                    color: p.status === 'in-game' ? 'rgba(168,85,247,0.8)' : 'rgba(255,255,255,0.3)',
                                }}>
                                    {p.status === 'in-game' ? `🎮 ${p.game}` : `${p.rankEmoji} ${p.rank}`}
                                </div>
                            </div>

                            {/* ELO */}
                            <div className="shrink-0 text-right">
                                <span className="text-[10px] font-black" style={{ color: 'rgba(255,255,255,0.25)' }}>
                                    {p.elo}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── HUD Stat Card ────────────────────────────────────────────────────────────

function HudStat({ icon, label, value, sub, color }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    sub: string;
    color: string;
}) {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] p-4 group hover:border-white/15 transition-all duration-200"
            style={{ background: '#0a0a0a' }}>
            {/* Subtle corner glow */}
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: color, transform: 'translate(30%, -30%)' }} />

            <div className="flex items-start justify-between gap-2 mb-3">
                <div className="p-2 rounded-xl" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                    <span style={{ color }}>{icon}</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-white/25">{label}</span>
            </div>
            <div className="text-2xl font-black text-white leading-none mb-1" style={{ textShadow: `0 0 20px ${color}30` }}>
                {value}
            </div>
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-wide">{sub}</div>

            {/* Bottom accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl opacity-40"
                style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
        </div>
    );
}

// ─── App Required Modal ───────────────────────────────────────────────────────

function AppRequiredModal({ type, onClose }: { type: 'match' | 'scrims'; onClose: () => void }) {
    const isScrims = type === 'scrims';

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md rounded-3xl overflow-hidden border border-white/10"
                style={{ background: 'linear-gradient(135deg, #0d0d0f 0%, #0a1a0a 100%)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Glow top */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 rounded-full blur-[60px] pointer-events-none"
                    style={{ background: 'rgba(0,255,0,0.12)' }} />

                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
                >
                    <X size={14} />
                </button>

                <div className="relative p-8 text-center">
                    {/* Icon */}
                    <div className="flex items-center justify-center mb-5">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-[rgba(0,255,0,0.25)]"
                            style={{ background: 'rgba(0,255,0,0.08)', boxShadow: '0 0 30px rgba(0,255,0,0.15)' }}>
                            {isScrims ? <Clock size={28} style={{ color: '#00ff00' }} /> : <Swords size={28} style={{ color: '#00ff00' }} />}
                        </div>
                    </div>

                    {/* Title */}
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-2" style={{ color: 'rgba(0,255,0,0.6)' }}>
                        App Required
                    </p>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white leading-tight mb-3">
                        {isScrims ? 'Schedule Scrims' : 'Find Match'}
                    </h2>
                    <p className="text-sm text-white/40 leading-relaxed mb-8">
                        {isScrims
                            ? 'Scrim scheduling and team coordination are available exclusively on the ArenaChain mobile and desktop apps for the best competitive experience.'
                            : 'Real-time matchmaking requires the ArenaChain mobile or desktop app to ensure the lowest latency and best competitive performance.'}
                    </p>

                    {/* App options */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-[rgba(0,255,0,0.3)] hover:bg-[rgba(0,255,0,0.05)] transition-all cursor-pointer group">
                            <Smartphone size={28} className="text-white/50 group-hover:text-[#00ff00] transition-colors" />
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-white group-hover:text-[#00ff00] transition-colors">Mobile App</p>
                                <p className="text-[10px] text-white/30 mt-0.5">iOS & Android</p>
                            </div>
                            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-white/20 group-hover:text-[#00ff00]/60 transition-colors">
                                Download <ArrowRight size={9} />
                            </span>
                        </div>
                        <div className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-[rgba(0,255,0,0.3)] hover:bg-[rgba(0,255,0,0.05)] transition-all cursor-pointer group">
                            <Monitor size={28} className="text-white/50 group-hover:text-[#00ff00] transition-colors" />
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-white group-hover:text-[#00ff00] transition-colors">Desktop App</p>
                                <p className="text-[10px] text-white/30 mt-0.5">Windows & macOS</p>
                            </div>
                            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-white/20 group-hover:text-[#00ff00]/60 transition-colors">
                                Download <ArrowRight size={9} />
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-white/40 hover:text-white text-xs font-black uppercase tracking-widest transition-all"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
