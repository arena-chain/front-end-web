import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
    Swords, Zap, Target,
    Flame, Activity,
} from 'lucide-react';
import { PerformanceChart } from '../components/PerformanceChart';
import { getApiBase } from '../../lib/apiBase';
import {
    createPresenceSocket,
    friendshipPresenceService,
    type FriendItem,
    type FriendStatus,
} from '../../services/friendshipPresence.service';
import {
    AppRequiredModal,
    HudStat,
    mapFriendToOnlinePlayer,
    mapPresenceStatusToUi,
    OnlinePanel,
    rankEmojiFor,
    statusPriority,
    type OnlinePlayer,
} from './dashboard/PlayerDashboardSections';

// ─── Main Component ───────────────────────────────────────────────────────────

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
interface UserListEntry {
    _id?: string;
    role?: string;
    isActive?: boolean;
    nickname?: string;
    avatar?: string;
    region?: string;
}

interface ChannelListEntry {
    owner?: string | { _id?: string };
    ownerId?: string;
    game?: string;
    title?: string;
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
                const allUsers: UserListEntry[] =
                    usersRes.status === 'fulfilled' && Array.isArray(usersRes.value.data) ? usersRes.value.data : [];
                const allChannels: ChannelListEntry[] =
                    channelsRes.status === 'fulfilled' && Array.isArray(channelsRes.value.data) ? channelsRes.value.data : [];

                const liveByOwner = new Map<string, { game?: string }>();
                for (const ch of allChannels) {
                    const ownerRaw = ch.owner ?? ch.ownerId;
                    const ownerId =
                        typeof ownerRaw === 'object' && ownerRaw && '_id' in ownerRaw
                            ? String((ownerRaw as { _id?: string })._id)
                            : typeof ownerRaw === 'string'
                              ? ownerRaw
                              : '';
                    if (ownerId) {
                        liveByOwner.set(ownerId, { game: ch.game || ch.title });
                    }
                }

                setPlayerStats({
                    elo: Number(me?.elo ?? 0),
                    rank: typeof me?.rank === 'string' && me.rank.trim().length > 0 ? me.rank : 'Unranked',
                    stats: me?.stats,
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

                const mappedOnline: OnlinePlayer[] = allUsers
                    .filter((u) => u?.role === 'player' && u?.isActive && u?._id && String(u._id) !== String(myUserId))
                    .slice(0, 30)
                    .map((u) => {
                        const prof = profileMap[String(u._id)];
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
            const userId = payload.userId;
            if (!userId) return;
            setOnlinePlayers((previous) => {
                const next = [...previous];
                const idx = next.findIndex((item) => item.id === userId);
                const profile = playerProfilesByUser[userId];
                const base: OnlinePlayer =
                    idx >= 0
                        ? next[idx]
                        : {
                            id: userId,
                            name: payload.nickname || userId,
                            avatar: payload.avatar || payload.nickname || userId.slice(-6),
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
    const currentElo = Math.max(0, Math.round(Number(playerStats?.elo ?? 0)));
    const currentRank = playerStats?.rank || 'Unranked';
    const rankGlyph = rankEmojiFor(currentRank);
    const rankProgressPct = currentElo > 0 ? Math.min(100, Math.max(8, (currentElo % 1000) / 10)) : 8;

    return (
        <div className="relative h-full overflow-hidden rounded-[28px]" aria-busy={statsLoading}>
            <div className="relative z-10 flex gap-8 h-full animate-fade-in-up overflow-hidden p-6 lg:p-0">
                {appModal && <AppRequiredModal type={appModal} onClose={() => setAppModal(null)} />}

            {/* ── Main content ─────────────────────────────────────────── */}
            <div className="flex flex-col gap-8 flex-1 min-w-0 overflow-y-auto pr-2 custom-scrollbar">

                {/* ── Hero Banner ──────────────────────────────────────────── */}
                <div className="relative overflow-hidden rounded-[40px] border border-white/10 shrink-0 bg-[#060606] shadow-2xl">
                    <div className="absolute inset-0 bg-primary/10 blur-[120px] -mr-40 -mt-40 rounded-full" />

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
                                <div className="px-3 py-1 rounded-sm bg-primary/10 border border-primary/25 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-primary italic">System Online</span>
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Protocol Node: 0xF4...A2</span>
                            </div>

                            <div className="space-y-2">
                                <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white leading-tight uppercase">
                                    READY TO <span className="text-primary drop-shadow-[0_0_40px_rgba(0,255,136,0.4)]">DOMINATE?</span>
                                </h1>
                                <p className="text-sm text-white/30 font-bold uppercase tracking-widest leading-relaxed max-w-lg italic">
                                    Initiate matchmaking protocol and claim your legacy on the global decentralized ledger.
                                </p>
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <button
                                    onClick={() => setAppModal('match')}
                                    className="h-16 px-10 rounded-2xl bg-primary text-black font-black italic uppercase text-xs tracking-[0.3em] shadow-[0_15px_40px_rgba(0,255,136,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
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
                               {rankGlyph}
                           </div>
                           <h3 className="text-3xl font-black italic tracking-tighter text-white uppercase">{currentRank}</h3>
                           <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a855f7] mt-1 italic">{currentElo.toLocaleString()} ELO // SYNCED</div>

                           <div className="w-48 h-2 bg-white/5 rounded-full mt-6 overflow-hidden">
                               <div className="h-full bg-gradient-to-r from-[#a855f7]/50 to-[#a855f7] rounded-full" style={{ width: `${rankProgressPct}%` }} />
                           </div>
                           <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mt-2">LIVE PLAYER RANKING SIGNAL</p>
                        </div>
                    </div>
                </div>

            {/* ── Quick Stats row ───────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 shrink-0">
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
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-3 flex-1 min-h-0">

                {/* Performance chart */}
                <div className="min-h-0">
                    <PerformanceChart data={chartData} />
                </div>

                {/* Right column: Recent Matches + Live Ecosystem */}
                <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                    <div className="bg-[#080b10]/90 border border-white/10 rounded-[22px] overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.4)]">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Swords size={16} className="text-[#00ff87]" />
                                <span className="text-[10px] font-black uppercase tracking-widest italic">RECENT MATCHES</span>
                            </div>
                            <button onClick={() => navigate('/player/matches')} className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-[#00ff87] transition-all">VIEW ALL</button>
                        </div>
                        <div className="p-4">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-white/25">
                                {recentMatches.length === 0 ? 'No recent matches available.' : `${recentMatches.length} recent matches loaded.`}
                            </p>
                        </div>
                    </div>

                    <div className="bg-[#080b10]/90 border border-white/10 rounded-[22px] overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.4)]">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Zap size={14} className="text-[#eab308]" />
                                <span className="text-[10px] font-black uppercase tracking-widest italic">LIVE ECOSYSTEM</span>
                            </div>
                            <span
                                className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full"
                                style={{ background: 'rgba(0,255,0,0.08)', color: '#00ff00', border: '1px solid rgba(0,255,0,0.15)' }}
                            >
                                Dynamic
                            </span>
                        </div>
                        <div className="p-3 space-y-2">
                            {[
                                { label: 'Players online', value: onlinePlayers.filter((p) => p.status !== 'offline').length },
                                { label: 'Players in live channels', value: onlinePlayers.filter((p) => p.status === 'in-game').length },
                                { label: 'Recent matches loaded', value: recentMatches.length },
                            ].map((item) => (
                                <div key={item.label} className="rounded-xl p-3 transition-all border border-white/10 bg-black/45">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[11px] text-white/75">{item.label}</span>
                                        <span className="text-[11px] font-black text-primary">{item.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            </div>
            {/* Offline/Online Panel */}
                <OnlinePanel players={onlinePlayers} onOpenFriends={() => navigate('/player/friends')} />
            </div>
        </div>
    );
}
