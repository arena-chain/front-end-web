import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Swords, Clock, Trophy, Zap, Target,
    ChevronRight, Flame, Star, Activity,
    Users, Crown, UserPlus, MessageCircle,
    Globe, Search,
} from 'lucide-react';
import { PerformanceChart } from '../components/PerformanceChart';
import { cn } from '../../lib/utils';

// ─── Mock data ────────────────────────────────────────────────────────────────

const RECENT_MATCHES = [
    { id: 1, result: 'W', game: 'Valorant', mode: 'Ranked', map: 'Ascent', score: '13 – 7', kda: '24 / 8 / 5', mvp: true, ago: '12m ago' },
    { id: 2, result: 'W', game: 'Valorant', mode: 'Ranked', map: 'Haven', score: '13 – 10', kda: '18 / 12 / 9', mvp: false, ago: '1h ago' },
    { id: 3, result: 'L', game: 'Valorant', mode: 'Ranked', map: 'Bind', score: '9 – 13', kda: '14 / 16 / 4', mvp: false, ago: '2h ago' },
    { id: 4, result: 'W', game: 'LoL', mode: 'Ranked', map: 'Summoner\'s Rift', score: '32 – 18', kda: '8 / 2 / 14', mvp: true, ago: '5h ago' },
    { id: 5, result: 'W', game: 'Valorant', mode: 'Unrated', map: 'Split', score: '13 – 5', kda: '22 / 6 / 11', mvp: false, ago: '1d ago' },
];

const ACTIVE_CHALLENGES = [
    { id: 1, title: 'Win 5 Ranked Matches', progress: 3, total: 5, reward: '500 XP', icon: '🏆' },
    { id: 2, title: 'Achieve 20 Kills in One Match', progress: 1, total: 1, reward: '200 XP', icon: '⚡', done: true },
    { id: 3, title: 'Play 3 Different Games', progress: 2, total: 3, reward: '300 XP', icon: '🎮' },
];

// All online players on the platform (not just friends)
const ONLINE_PLAYERS: {
    id: number; name: string; avatar: string; rank: string; rankEmoji: string;
    status: 'online' | 'in-game'; game?: string; region: string; elo: number;
}[] = [
    { id: 1,  name: 'ShadowBlade',  avatar: 'Aneka',       rank: 'Diamond I',    rankEmoji: '💎', status: 'in-game', game: 'Valorant',  region: 'EU', elo: 2980 },
    { id: 2,  name: 'NeonPhoenix',  avatar: 'Leah',        rank: 'Platinum II',  rankEmoji: '🏆', status: 'online',                     region: 'NA', elo: 2310 },
    { id: 3,  name: 'VoidHunter',   avatar: 'Brooklynn',   rank: 'Diamond III',  rankEmoji: '💎', status: 'in-game', game: 'LoL',       region: 'EU', elo: 2650 },
    { id: 4,  name: 'CyberWolf',    avatar: 'Buster',      rank: 'Gold I',       rankEmoji: '⚡', status: 'online',                     region: 'AS', elo: 1920 },
    { id: 5,  name: 'StormRider',   avatar: 'Lilith',      rank: 'Diamond II',   rankEmoji: '💎', status: 'in-game', game: 'Valorant',  region: 'NA', elo: 2840 },
    { id: 6,  name: 'GhostSniper',  avatar: 'Ryker',       rank: 'Gold III',     rankEmoji: '⚡', status: 'online',                     region: 'EU', elo: 1750 },
    { id: 7,  name: 'PixelKnight',  avatar: 'Zoey',        rank: 'Platinum I',   rankEmoji: '🏆', status: 'in-game', game: 'CS2',       region: 'AS', elo: 2430 },
    { id: 8,  name: 'ArcaneWitch',  avatar: 'Mia',         rank: 'Diamond II',   rankEmoji: '💎', status: 'online',                     region: 'EU', elo: 2760 },
    { id: 9,  name: 'IronTitan',    avatar: 'Kingston',    rank: 'Silver II',    rankEmoji: '🥈', status: 'online',                     region: 'AF', elo: 1540 },
    { id: 10, name: 'BlazeRunner',  avatar: 'Chase',       rank: 'Platinum III', rankEmoji: '🏆', status: 'in-game', game: 'Valorant',  region: 'NA', elo: 2190 },
    { id: 11, name: 'QuantumFox',   avatar: 'Aidan',       rank: 'Gold II',      rankEmoji: '⚡', status: 'online',                     region: 'AS', elo: 1860 },
    { id: 12, name: 'DarkMatter',   avatar: 'Mason',       rank: 'Diamond I',    rankEmoji: '💎', status: 'in-game', game: 'LoL',       region: 'EU', elo: 2910 },
];

type FriendStatus = 'online' | 'in-game' | 'offline';
const FRIENDS: {
    id: number; name: string; avatar: string; rank: string;
    status: FriendStatus; game?: string; winRate: number;
}[] = [
    { id: 1, name: 'ShadowBlade', avatar: 'Aneka',    rank: '💎 Diamond I',  status: 'in-game',  game: 'Valorant',  winRate: 71 },
    { id: 2, name: 'NeonPhoenix', avatar: 'Leah',     rank: '🏆 Platinum II', status: 'online',                     winRate: 63 },
    { id: 3, name: 'VoidHunter',  avatar: 'Brooklynn',rank: '💎 Diamond III', status: 'in-game',  game: 'LoL',       winRate: 68 },
    { id: 4, name: 'CyberWolf',   avatar: 'Buster',   rank: '⚡ Gold I',      status: 'online',                     winRate: 55 },
    { id: 5, name: 'IronFalcon',  avatar: 'Felix',    rank: '🏆 Platinum I',  status: 'offline',                    winRate: 58 },
    { id: 6, name: 'StormRider',  avatar: 'Lilith',   rank: '💎 Diamond II',  status: 'offline',                    winRate: 65 },
    { id: 7, name: 'GhostSniper', avatar: 'Ryker',    rank: '⚡ Gold III',    status: 'online',                     winRate: 52 },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PlayerDashboard() {
    const navigate = useNavigate();
    const [finding, setFinding] = useState(false);

    const handleFindMatch = () => {
        setFinding(true);
        setTimeout(() => setFinding(false), 3000);
    };

    return (
        <div className="flex gap-4 h-full animate-fade-in-up overflow-hidden">

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
                                onClick={handleFindMatch}
                                className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest text-black transition-all duration-200 hover:scale-105 active:scale-95"
                                style={{
                                    background: finding ? 'rgba(0,255,0,0.7)' : '#00ff00',
                                    boxShadow: '0 0 24px rgba(0,255,0,0.4), 0 4px 20px rgba(0,0,0,0.4)',
                                }}
                            >
                                {finding ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                                        Searching…
                                    </>
                                ) : (
                                    <>
                                        <Swords size={16} />
                                        Find Match
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => navigate('/player/tournaments')}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl font-black text-sm uppercase tracking-widest text-white/70 border border-white/10 hover:border-white/25 hover:text-white transition-all duration-200 bg-white/[0.03]"
                            >
                                <Clock size={15} />
                                Scheduled Scrims
                            </button>
                        </div>
                    </div>

                    {/* Right: Rank card */}
                    <div className="shrink-0 flex flex-col items-center justify-center rounded-2xl border border-white/10 px-8 py-5 text-center"
                        style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)' }}>
                        <div className="relative mb-2">
                            <div className="text-5xl" style={{ filter: 'drop-shadow(0 0 12px rgba(185,162,80,0.6))' }}>💎</div>
                        </div>
                        <div className="text-xl font-black text-white uppercase tracking-tight">Diamond II</div>
                        <div className="text-[10px] font-black uppercase tracking-widest mt-1" style={{ color: '#00ff00' }}>Top 5% · 2,840 MMR</div>
                        <div className="w-full mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: '65%', background: 'linear-gradient(90deg, #b9a250, #ffd700)', boxShadow: '0 0 6px rgba(255,215,0,0.4)' }} />
                        </div>
                        <div className="text-[9px] font-bold text-white/30 mt-1 uppercase tracking-widest">650 / 1000 to Diamond I</div>
                    </div>
                </div>
            </div>

            {/* ── Quick Stats row ───────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
                <HudStat icon={<Target size={18} />} label="Win Rate" value="68%" sub="+4% this week" color="#00ff00" />
                <HudStat icon={<Flame size={18} />} label="Win Streak" value="4" sub="Personal best: 9" color="#f97316" />
                <HudStat icon={<Activity size={18} />} label="K/D Ratio" value="2.14" sub="Season avg: 1.89" color="#a855f7" />
                <HudStat icon={<Zap size={18} />} label="Total Matches" value="312" sub="142 wins · 170 losses" color="#3b82f6" />
            </div>

            {/* ── Middle split ──────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 flex-1 min-h-0">

                {/* Performance chart */}
                <div className="min-h-0">
                    <PerformanceChart />
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
                            {RECENT_MATCHES.map((m, i) => (
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
                                            {m.mvp && (
                                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md shrink-0"
                                                    style={{ background: 'rgba(234,179,8,0.12)', color: '#eab308', border: '1px solid rgba(234,179,8,0.25)' }}>
                                                    MVP
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.28)' }}>{m.score}</span>
                                            <span className="w-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
                                            <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.28)' }}>{m.kda}</span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold shrink-0" style={{ color: 'rgba(255,255,255,0.18)' }}>{m.ago}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Daily Challenges ── */}
                    <div className="rounded-2xl overflow-hidden" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(234,179,8,0.1)' }}>
                                    <Star size={12} style={{ color: '#eab308' }} />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-[0.15em] text-white">Daily Challenges</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full"
                                style={{ background: 'rgba(0,255,0,0.08)', color: '#00ff00', border: '1px solid rgba(0,255,0,0.15)' }}>
                                2 / 3
                            </div>
                        </div>
                        <div className="p-3 space-y-2">
                            {ACTIVE_CHALLENGES.map((c) => (
                                <div key={c.id} className="rounded-xl p-3 transition-all"
                                    style={{
                                        background: c.done ? 'rgba(0,255,0,0.04)' : 'rgba(255,255,255,0.02)',
                                        border: c.done ? '1px solid rgba(0,255,0,0.15)' : '1px solid rgba(255,255,255,0.05)',
                                    }}>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="text-base shrink-0 leading-none">{c.icon}</span>
                                            <span className="text-[11px] font-bold truncate" style={{
                                                color: c.done ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.85)',
                                                textDecoration: c.done ? 'line-through' : 'none',
                                            }}>
                                                {c.title}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-black shrink-0"
                                            style={{ color: c.done ? '#00ff00' : '#eab308' }}>
                                            {c.done ? '✓ Done' : c.reward}
                                        </span>
                                    </div>
                                    {!c.done && (
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                                <div className="h-full rounded-full"
                                                    style={{
                                                        width: `${(c.progress / c.total) * 100}%`,
                                                        background: 'linear-gradient(90deg, #00cc00, #00ff00)',
                                                        boxShadow: '0 0 8px rgba(0,255,0,0.5)',
                                                    }} />
                                            </div>
                                            <span className="text-[9px] font-black shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>
                                                {c.progress}/{c.total}
                                            </span>
                                        </div>
                                    )}
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
        <OnlinePanel />

        </div>
    );
}

// ─── Online Players Panel (right) ────────────────────────────────────────────

function OnlinePanel() {
    const [filter, setFilter] = useState<'all' | 'in-game' | 'online'>('all');
    const [search, setSearch] = useState('');

    const inGameCount  = ONLINE_PLAYERS.filter(p => p.status === 'in-game').length;
    const onlineCount  = ONLINE_PLAYERS.filter(p => p.status === 'online').length;

    const visible = ONLINE_PLAYERS.filter(p => {
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
                            {ONLINE_PLAYERS.length} online
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

// ─── Social Sidebar ───────────────────────────────────────────────────────────

function SocialSidebar() {
    const onlineCount = FRIENDS.filter(f => f.status !== 'offline').length;

    return (
        <div className="w-60 shrink-0 flex flex-col gap-3 h-full overflow-hidden">

            {/* Player card */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 p-4 shrink-0"
                style={{ background: 'linear-gradient(145deg, #0d1a0d, #0a0a0a)' }}>
                <div className="absolute inset-0 pointer-events-none opacity-[0.06]" style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,0,0.4) 3px, rgba(0,255,0,0.4) 4px)',
                }} />
                {/* Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full blur-[50px] pointer-events-none" style={{ background: 'rgba(0,255,0,0.12)' }} />

                <div className="relative flex flex-col items-center text-center">
                    {/* Avatar */}
                    <div className="relative mb-3">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 p-[2px]"
                            style={{ borderColor: 'rgba(0,255,0,0.5)', boxShadow: '0 0 16px rgba(0,255,0,0.25)' }}>
                            <img
                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                                className="w-full h-full rounded-xl bg-black"
                                alt="You"
                            />
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-black"
                            style={{ background: '#00ff00', boxShadow: '0 0 8px rgba(0,255,0,0.6)' }} />
                    </div>

                    <p className="font-black text-white text-sm uppercase tracking-tight">Player One</p>
                    <p className="text-[10px] font-bold text-white/40 mb-2">player.one@arena.com</p>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full mb-3"
                        style={{ background: 'rgba(0,255,0,0.08)', border: '1px solid rgba(0,255,0,0.2)' }}>
                        <span style={{ color: '#00ff00' }} className="text-sm">💎</span>
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#00ff00' }}>Diamond II</span>
                    </div>

                    {/* Mini stats */}
                    <div className="w-full grid grid-cols-3 gap-1 text-center">
                        {[
                            { label: 'Wins', value: '142' },
                            { label: 'K/D', value: '2.1' },
                            { label: 'WR', value: '68%' },
                        ].map(s => (
                            <div key={s.label} className="rounded-xl py-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <div className="text-sm font-black text-white">{s.value}</div>
                                <div className="text-[9px] font-bold text-white/30 uppercase tracking-wider">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Friends list */}
            <div className="flex-1 flex flex-col rounded-2xl overflow-hidden min-h-0"
                style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
                {/* Header */}
                <div className="px-4 py-3.5 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,255,0,0.1)' }}>
                            <Users size={12} style={{ color: '#00ff00' }} />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.15em] text-white">Friends</span>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(0,255,0,0.08)', color: '#00ff00', border: '1px solid rgba(0,255,0,0.15)' }}>
                            {onlineCount} online
                        </span>
                    </div>
                    <button className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                        style={{ color: 'rgba(255,255,255,0.25)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        title="Add Friend">
                        <UserPlus size={12} />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
                    {/* Online / in-game first */}
                    {(['in-game', 'online', 'offline'] as FriendStatus[]).map(statusGroup => {
                        const group = FRIENDS.filter(f => f.status === statusGroup);
                        if (group.length === 0) return null;
                        return (
                            <div key={statusGroup}>
                                <div className="px-4 pt-3 pb-1">
                                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/20">
                                        {statusGroup === 'in-game' ? `In Game — ${group.length}` :
                                         statusGroup === 'online' ? `Online — ${group.length}` :
                                         `Offline — ${group.length}`}
                                    </span>
                                </div>
                                {group.map(friend => (
                                    <FriendRow key={friend.id} friend={friend} />
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── Friend Row ───────────────────────────────────────────────────────────────

function FriendRow({ friend }: { friend: typeof FRIENDS[number] }) {
    const [hovered, setHovered] = useState(false);

    const dotColor =
        friend.status === 'in-game' ? '#a855f7' :
        friend.status === 'online'  ? '#00ff00' : '#ffffff22';

    const dotGlow =
        friend.status === 'in-game' ? '0 0 6px rgba(168,85,247,0.8)' :
        friend.status === 'online'  ? '0 0 6px rgba(0,255,0,0.8)' : 'none';

    return (
        <div
            className="relative flex items-center gap-3 px-4 py-2.5 transition-colors cursor-pointer"
            style={{ background: hovered ? 'rgba(255,255,255,0.02)' : 'transparent' }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Avatar */}
            <div className="relative shrink-0">
                <div className={cn("w-8 h-8 rounded-xl overflow-hidden border", friend.status === 'offline' ? 'border-white/10 opacity-40 grayscale' : 'border-white/15')}>
                    <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.avatar}`}
                        className="w-full h-full bg-black"
                        alt={friend.name}
                    />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black"
                    style={{ background: dotColor, boxShadow: dotGlow }} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className={cn("text-xs font-black truncate", friend.status === 'offline' ? 'text-white/30' : 'text-white')}>
                    {friend.name}
                </p>
                <p className="text-[10px] font-bold truncate" style={{
                    color: friend.status === 'in-game' ? '#a855f7' :
                           friend.status === 'online' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.2)'
                }}>
                    {friend.status === 'in-game' ? `🎮 ${friend.game}` :
                     friend.status === 'online' ? friend.rank : 'Offline'}
                </p>
            </div>

            {/* Action buttons on hover */}
            {hovered && friend.status !== 'offline' && (
                <div className="flex items-center gap-1 shrink-0">
                    <button className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                        title="Challenge" style={{ color: '#00ff00' }}>
                        <Swords size={11} />
                    </button>
                    <button className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                        title="Message" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        <MessageCircle size={11} />
                    </button>
                </div>
            )}
            {/* Win rate bar (when not hovered) */}
            {!hovered && friend.status !== 'offline' && (
                <div className="w-8 text-right shrink-0">
                    <span className="text-[9px] font-black" style={{ color: friend.winRate >= 65 ? '#00ff00' : 'rgba(255,255,255,0.25)' }}>
                        {friend.winRate}%
                    </span>
                </div>
            )}
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

