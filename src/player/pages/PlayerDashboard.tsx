import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { createPortal } from 'react-dom';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
    Swords, Clock, Trophy, Zap, Target,
    ChevronRight, Flame, Star, Activity,
    Users, Crown,
    Globe, Search, X, Smartphone, Monitor, ArrowRight, ShieldCheck, Cpu
} from 'lucide-react';
import { PerformanceChart } from '../components/PerformanceChart';
import { getApiBase } from '../../lib/apiBase';
import {
    createPresenceSocket,
    friendshipPresenceService,
    type FriendItem,
    type FriendStatus,
} from '../../services/friendshipPresence.service';

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
interface MatchApiRecord {
    _id?: string;
    team1GamesWon?: number | string;
    team2GamesWon?: number | string;
    scheduledStart?: string;
    mapName?: string;
}
interface PlayerProfileApiRecord {
    userId?: string | { _id?: string };
    elo?: number | string;
    rank?: string;
}
interface OnlinePlayer {
    id: string;
    name: string;
    avatar: string;
    rank: string;
    rankEmoji: string;
    status: 'online' | 'in-game' | 'in-queue' | 'away' | 'offline';
    game?: string;
    details?: string;
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
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [playerProfilesByUser, setPlayerProfilesByUser] = useState<Record<string, { elo: number; rank: string }>>({});
    const presenceSocketRef = useRef<ReturnType<typeof createPresenceSocket> | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            setStatsLoading(true);
            const token = localStorage.getItem('token');
            const API = getApiBase();
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            try {
                const [meRes, profileRes, allPlayersRes] = await Promise.allSettled([
                    axios.get(`${API}/player/me`, { headers }),
                    axios.get(`${API}/auth/profile`, { headers }),
                    axios.get(`${API}/player`, { headers }),
                ]);

                const me = meRes.status === 'fulfilled' ? meRes.value.data : null;
                const myUser = profileRes.status === 'fulfilled' ? profileRes.value.data : null;
                const allPlayers = allPlayersRes.status === 'fulfilled' && Array.isArray(allPlayersRes.value.data) ? allPlayersRes.value.data : [];

                setPlayerStats({
                    elo: me?.elo ?? 2854, // Mock if 0
                    rank: me?.rank ?? 'Diamond',
                    stats: me?.stats ?? { winRate: 64, killsPerRound: 18, deathPerRound: 12 },
                });

                const myUserId = myUser?._id || outletCtx?.profile?._id;
                setCurrentUserId(myUserId ? String(myUserId) : null);
                if (myUserId) {
                    try {
                        const matchesRes = await axios.get(`${API}/scouter/players/${myUserId}/matches`, { headers });
                        const matches = Array.isArray(matchesRes.data) ? matchesRes.data.slice(0, 5) : [];
                        const mapped: RecentMatch[] = matches.map((m: MatchApiRecord) => {
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

                const profileMap: Record<string, { elo: number; rank: string }> = {};
                allPlayers.forEach((p: PlayerProfileApiRecord) => {
                    const uid = typeof p.userId === 'object' ? p.userId?._id : p.userId;
                    if (uid) {
                        profileMap[String(uid)] = {
                            elo: Number(p.elo ?? 0),
                            rank: typeof p.rank === 'string' ? p.rank : 'Unranked',
                        };
                    }
                });
                setPlayerProfilesByUser(profileMap);
            } catch {
                setPlayerStats({ elo: 0, rank: 'Unranked' });
                setRecentMatches([]);
                setOnlinePlayers([]);
                setCurrentUserId(null);
            } finally {
                setStatsLoading(false);
            }
        };
        fetchStats();
    }, [outletCtx?.profile?._id]);

    useEffect(() => {
        if (!currentUserId) {
            setOnlinePlayers([]);
            return;
        }

        let active = true;
        const toOnlinePlayers = (friends: FriendItem[]) =>
            friends
                .map((friend) => mapFriendToOnlinePlayer(friend, playerProfilesByUser))
                .sort((a, b) => statusPriority(a.status) - statusPriority(b.status) || b.elo - a.elo);
        const applyPresenceList = (friends: FriendItem[]) => {
            if (!active) return;
            setOnlinePlayers(toOnlinePlayers(friends));
        };
        const upsertPresence = (payload: Partial<FriendItem> & { userId?: string }, forcedStatus?: FriendStatus) => {
            if (!payload.userId) return;
            setOnlinePlayers((previous) => {
                const next = [...previous];
                const idx = next.findIndex((item) => item.id === payload.userId);
                const profile = playerProfilesByUser[payload.userId];
                const base: OnlinePlayer =
                    idx >= 0
                        ? next[idx]
                        : {
                            id: payload.userId,
                            name: payload.nickname || payload.userId,
                            avatar: payload.avatar || payload.nickname || payload.userId.slice(-6),
                            rank: profile?.rank || 'Unranked',
                            rankEmoji: rankEmojiFor(profile?.rank || 'Unranked'),
                            status: 'offline',
                            elo: profile?.elo ?? 0,
                        };
                const incomingStatus = forcedStatus || payload.status;
                const merged: OnlinePlayer = {
                    ...base,
                    name: payload.nickname || base.name,
                    avatar: payload.avatar || base.avatar,
                    status: mapPresenceStatusToUi(incomingStatus || 'offline'),
                    game: payload.game ?? base.game,
                    details: payload.details ?? base.details,
                    rank: profile?.rank || base.rank,
                    rankEmoji: rankEmojiFor(profile?.rank || base.rank),
                    elo: profile?.elo ?? base.elo,
                };
                if (idx >= 0) {
                    next[idx] = merged;
                } else {
                    next.push(merged);
                }
                next.sort((a, b) => statusPriority(a.status) - statusPriority(b.status) || b.elo - a.elo);
                return next;
            });
        };
        const loadPresenceSnapshot = async () => {
            try {
                const friends = await friendshipPresenceService.getPresenceFriends(currentUserId);
                applyPresenceList(friends);
            } catch {
                // Keep old state when API is temporarily unavailable.
            }
        };

        void loadPresenceSnapshot();
        const socket = createPresenceSocket();
        presenceSocketRef.current = socket;
        socket.on('connect', () => {
            socket.emit('get-friends');
        });
        socket.on('presence-ready', (payload: FriendItem[] | { friends?: FriendItem[] }) => {
            const friends = Array.isArray(payload) ? payload : Array.isArray(payload?.friends) ? payload.friends : [];
            applyPresenceList(friends);
        });
        socket.on('friend-online', (payload: Partial<FriendItem> & { userId?: string }) => {
            upsertPresence(payload, 'online');
        });
        socket.on('friend-offline', (payload: Partial<FriendItem> & { userId?: string }) => {
            upsertPresence(payload, 'offline');
        });
        socket.on('friend-status', (payload: Partial<FriendItem> & { userId?: string }) => {
            upsertPresence(payload);
        });

        const pollId = window.setInterval(() => {
            if (!socket.connected) {
                void loadPresenceSnapshot();
            }
        }, 30000);

        return () => {
            active = false;
            window.clearInterval(pollId);
            socket.disconnect();
            if (presenceSocketRef.current === socket) {
                presenceSocketRef.current = null;
            }
        };
    }, [currentUserId, playerProfilesByUser]);

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
        <div className="flex gap-8 h-full animate-fade-in-up overflow-hidden p-6 lg:p-0">
            {appModal && <AppRequiredModal type={appModal} onClose={() => setAppModal(null)} />}

            {/* ── Main content ─────────────────────────────────────────── */}
            <div className="flex flex-col gap-8 flex-1 min-w-0 overflow-y-auto pr-2 custom-scrollbar">

                {/* ── Hero Banner ──────────────────────────────────────────── */}
                <div className="relative overflow-hidden rounded-[40px] border border-white/10 shrink-0 bg-[#060606] shadow-2xl">
                    <div className="absolute inset-0 bg-[#00ff87]/5 blur-[120px] -mr-40 -mt-40 rounded-full" />
                    
                    {/* Hex grid */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                         style={{ 
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45v-30z' fill-rule='evenodd' stroke='%23fff' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
                            backgroundSize: '40px' 
                         }} 
                    />

                    <div className="relative p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="px-3 py-1 rounded-sm bg-[#00ff87]/10 border border-[#00ff87]/20 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ff87] animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#00ff87] italic">System Online</span>
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Protocol Node: 0xF4...A2</span>
                            </div>
                            
                            <div className="space-y-2">
                                <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white leading-tight uppercase">
                                    READY TO <span className="text-[#00ff87] drop-shadow-[0_0_40px_rgba(0,255,135,0.4)]">DOMINATE?</span>
                                </h1>
                                <p className="text-sm text-white/30 font-bold uppercase tracking-widest leading-relaxed max-w-lg italic">
                                    Initiate matchmaking protocol and claim your legacy on the global decentralized ledger.
                                </p>
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <button
                                    onClick={() => setAppModal('match')}
                                    className="h-16 px-10 rounded-2xl bg-[#00ff87] text-black font-black italic uppercase text-xs tracking-[0.3em] shadow-[0_15px_40px_rgba(0,255,135,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                                >
                                    <Swords size={18} /> INITIALIZE MATCH
                                </button>
                                <button
                                    onClick={() => setAppModal('scrims')}
                                    className="h-16 px-8 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-black italic uppercase text-xs tracking-widest hover:bg-white/10 hover:text-white transition-all"
                                >
                                    SCRIM_SCHEDULER
                                </button>
                            </div>
                        </div>

                        {/* Rank card - high fid */}
                        <div className="bg-[#111] border border-[#a855f7]/30 rounded-[32px] p-10 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-20 h-20 bg-[#a855f7]/10 blur-[50px] rounded-full" />
                           
                           <div className="text-6xl mb-4 drop-shadow-[0_10px_30px_rgba(168,85,247,0.5)] group-hover:scale-110 transition-transform duration-500">
                               💎
                           </div>
                           <h3 className="text-3xl font-black italic tracking-tighter text-white uppercase">DIAMOND III</h3>
                           <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a855f7] mt-1 italic">2,854 ELO // SYNCED</div>
                           
                           <div className="w-48 h-2 bg-white/5 rounded-full mt-6 overflow-hidden">
                               <div className="h-full bg-gradient-to-r from-[#a855f7]/50 to-[#a855f7] rounded-full" style={{ width: '74%' }} />
                           </div>
                           <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mt-2">146 ELO TO IMMORTAL CLEARANCE</p>
                        </div>
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
                    sub={`${onlinePlayers.filter((p) => p.status !== 'offline').length} online`}
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

                {/* ── Secondary Grid ────────────────────────────────────────── */}
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8 flex-1 min-h-0">
                    
                    {/* Visual Performance Matrix */}
                    <div className="bg-[#111] border border-white/5 rounded-[40px] p-10 space-y-8 shadow-xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black italic tracking-widest uppercase flex items-center gap-3">
                                <Cpu size={20} className="text-[#00ff87]" /> PERFORMANCE_MATRIX
                            </h3>
                            <div className="flex items-center gap-4">
                                <button className="text-[9px] font-black uppercase tracking-widest text-[#00ff87]">LIVE_FEED</button>
                                <button className="text-[9px] font-black uppercase tracking-widest text-white/20">HISTORICAL</button>
                            </div>
                        </div>
                        <div className="h-64">
                            <PerformanceChart data={chartData} />
                        </div>
                    </div>

                    {/* Right column: Recent Logs & Action List */}
                    <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                        
                        {/* COMBAT LOGS */}
                        <div className="bg-[#111] border border-white/5 rounded-[32px] overflow-hidden shadow-xl">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Swords size={16} className="text-[#00ff87]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest italic">RECENT_COMBAT_LOGS</span>
                                </div>
                                <button onClick={() => navigate('/player/matches')} className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-[#00ff87] transition-all">VIEW_FULL_RECORD</button>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full"
                                style={{ background: 'rgba(0,255,0,0.08)', color: '#00ff00', border: '1px solid rgba(0,255,0,0.15)' }}>
                                Dynamic
                            </div>
                        </div>
                        <div className="p-3 space-y-2">
                            {[
                                { label: 'Players online', value: onlinePlayers.filter((p) => p.status !== 'offline').length },
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

                        {/* QUICK ACCESS GRID */}
                        <div className="grid grid-cols-2 gap-4">
                            <QuickNavCard icon={<Trophy size={18} />} label="LEAGUES" color="#a855f7" onClick={() => navigate('/player/leagues')} />
                            <QuickNavCard icon={<Users size={18} />} label="TOURNEYS" color="#3b82f6" onClick={() => navigate('/player/tournaments')} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Offline/Online Panel */}
            <OnlinePanel players={onlinePlayers} />
        </div>
    );
}

function ProtocolHudStat({ icon, label, value, sub, color }: any) {
    return (
        <div className="bg-[#111] border border-white/5 rounded-[32px] p-7 space-y-4 hover:border-white/15 transition-all shadow-xl group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 blur-[40px] opacity-10 rounded-full" style={{ background: color }} />
            <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                    {icon}
                </div>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 italic">{label}</span>
            </div>
            <div>
                <p className="text-3xl font-black italic tracking-tighter text-white" style={{ textShadow: `0 0 30px ${color}30` }}>{value}</p>
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-1 italic">{sub}</p>
            </div>
        </div>
    );
}

function QuickNavCard({ icon, label, color, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className="bg-[#111] border border-white/5 p-6 rounded-[28px] flex flex-col items-center gap-3 hover:border-white/10 transition-all group shadow-lg"
        >
            <div className="p-3 rounded-xl bg-white/5 text-white/20 group-hover:text-white group-hover:bg-white/10 transition-all" style={{ color: `${color}80` }}>
                {icon}
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 group-hover:text-white transition-all italic">{label}</span>
        </button>
    );
}

// ─── Online Players Panel (right) ────────────────────────────────────────────
function OnlinePanel({ players }: { players: OnlinePlayer[] }) {
    const [filter, setFilter] = useState<'all' | 'in-game' | 'online' | 'offline'>('all');
    const [search, setSearch] = useState('');

    const inGameCount  = players.filter(p => p.status === 'in-game').length;
    const onlineCount  = players.filter(p => p.status !== 'offline').length;

    const visible = players.filter(p => {
        const matchFilter =
            filter === 'all' ||
            p.status === filter ||
            (filter === 'online' && (p.status === 'online' || p.status === 'in-queue' || p.status === 'away'));
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

    return (
        <div className="w-72 shrink-0 flex flex-col gap-6 h-full overflow-hidden hidden xl:flex">
            <div className="bg-[#111] border border-white/5 rounded-[40px] flex-1 flex flex-col overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Globe size={18} className="text-[#00ff87]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">OPERATORS</span>
                        </div>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(0,255,0,0.08)', color: '#00ff00', border: '1px solid rgba(0,255,0,0.15)' }}>
                            {onlineCount} online
                        </span>
                    </div>
                    
                    <div className="relative">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                        <input 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="ENCRYPTED_ID..." 
                            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-10 pr-4 text-[10px] font-black tracking-widest text-white placeholder:text-white/10 focus:outline-none focus:border-[#00ff87]/20 transition-all"
                        />
                    </div>

                    {/* Filter tabs */}
                    <div className="flex gap-1">
                        {(['all', 'in-game', 'online', 'offline'] as const).map(f => (
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
                                {f === 'all' ? 'All' : f === 'in-game' ? '🎮 Game' : f === 'online' ? '● Online' : '○ Offline'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {visible.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/[0.02] transition-all group cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                                        <img src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${p.name}`} className="w-full h-full object-cover" />
                                    </div>
                                    <span className={cn(
                                        "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#111]",
                                        p.status === 'in-game' ? "bg-[#a855f7]" : "bg-[#00ff87]"
                                    )} />
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
                                </div>
                                <div className="text-[9px] font-bold truncate" style={{
                                    color:
                                        p.status === 'in-game'
                                            ? 'rgba(168,85,247,0.8)'
                                            : p.status === 'offline'
                                                ? 'rgba(255,255,255,0.22)'
                                                : 'rgba(255,255,255,0.35)',
                                }}>
                                    {presenceLine(p)}
                                </div>
                            </div>
                            <span className="text-[10px] font-black text-white/10 italic">#{p.elo}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function mapPresenceStatusToUi(status: FriendStatus): OnlinePlayer['status'] {
    if (status === 'in_game') return 'in-game';
    if (status === 'in_queue') return 'in-queue';
    return status;
}

function rankEmojiFor(rankText: string): string {
    const value = rankText.toLowerCase();
    if (value.includes('immortal')) return '💀';
    if (value.includes('diamond')) return '💎';
    if (value.includes('platinum')) return '🏆';
    if (value.includes('gold')) return '⚡';
    return '🥈';
}

function mapFriendToOnlinePlayer(
    friend: FriendItem,
    playerProfilesByUser: Record<string, { elo: number; rank: string }>,
): OnlinePlayer {
    const profile = playerProfilesByUser[friend.userId];
    const rank = profile?.rank || 'Unranked';
    return {
        id: friend.userId,
        name: friend.nickname || 'Player',
        avatar: friend.avatar || friend.nickname || friend.userId.slice(-6),
        rank,
        rankEmoji: rankEmojiFor(rank),
        status: mapPresenceStatusToUi(friend.status),
        game: friend.game,
        details: friend.details,
        elo: profile?.elo ?? 0,
    };
}

function statusPriority(status: OnlinePlayer['status']): number {
    switch (status) {
        case 'in-game':
            return 0;
        case 'in-queue':
            return 1;
        case 'online':
            return 2;
        case 'away':
            return 3;
        case 'offline':
            return 4;
        default:
            return 5;
    }
}

function presenceLine(player: OnlinePlayer): string {
    if (player.status === 'in-game') return `🎮 ${player.game || 'In game'}`;
    if (player.status === 'in-queue') return `⏳ ${player.details || 'In queue'}`;
    if (player.status === 'away') return `🌙 ${player.details || 'Away'}`;
    if (player.status === 'offline') return '○ Offline';
    return `${player.rankEmoji} ${player.rank}`;
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl" onClick={onClose}>
            <div className="relative w-full max-w-lg bg-[#060606] border border-white/10 rounded-[48px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]" onClick={e => e.stopPropagation()}>
                <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45v-30z' fill-rule='evenodd' stroke='%23fff' stroke-width='1' fill='none'/%3E%3C/svg%3E")`, backgroundSize: '40px' }} />
                
                <button onClick={onClose} className="absolute top-8 right-8 text-white/20 hover:text-white transition-all"><X size={24} /></button>

                <div className="p-12 text-center space-y-8">
                    <div className="flex justify-center">
                        <div className="w-24 h-24 rounded-[32px] bg-[#00ff87]/5 border border-[#00ff87]/20 flex items-center justify-center shadow-[0_0_50px_rgba(0,255,135,0.1)]">
                            {isScrims ? <Clock size={40} className="text-[#00ff87]" /> : <Swords size={40} className="text-[#00ff87]" />}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00ff87] italic">Protocol Upgrade Required</p>
                        <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase">{isScrims ? "SCRIM_V2 ACCESS" : "MATCHMAKING_v4"}</h2>
                        <p className="text-sm text-white/30 font-bold uppercase tracking-widest leading-relaxed">
                            {isScrims 
                                ? "Advanced team coordination and competitive planning are restricted to the ArenaChain native desktop and mobile environments." 
                                : "Low-latency real-time matchmaking requires a direct neural link via the ArenaChain mobile or desktop application."}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pb-4">
                        <AppCard icon={<Smartphone size={24} />} title="MOBILE" desc="iOS / ANDROID" />
                        <AppCard icon={<Monitor size={24} />} title="DESKTOP" desc="WIN / MACOS" />
                    </div>

                    <button onClick={onClose} className="w-full h-20 bg-white/5 border border-white/10 rounded-3xl font-black italic uppercase text-xs tracking-[0.3em] hover:bg-white/10 transition-all text-white/40 hover:text-white">
                        REVERT_TO_DASHBOARD
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

function AppCard({ icon, title, desc }: any) {
    return (
        <div className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl space-y-4 group hover:border-[#00ff87]/30 transition-all cursor-pointer">
            <div className="text-white/20 group-hover:text-[#00ff87] transition-colors">{icon}</div>
            <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-white group-hover:text-white transition-all italic">{title}</p>
                <p className="text-[8px] font-bold text-white/10 uppercase tracking-widest">{desc}</p>
            </div>
        </div>
    );
}
