import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { createPortal } from 'react-dom';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Swords, Clock, Zap, Target,
    Flame, Activity,
    Globe, Search, X, Smartphone, Monitor
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
    status?: string;
}
interface MatchApiRecord {
    _id?: string;
    team1GamesWon?: number | string;
    team2GamesWon?: number | string;
    scheduledStart?: string;
    mapName?: string;
    status?: string;
}
interface RiotMatchHistoryResponse {
    linked?: boolean;
    matches?: RiotMatchApiRecord[];
}
interface RiotMatchApiRecord {
    matchId?: string;
    gameType?: string;
    win?: boolean;
    roundsWon?: number | string;
    roundsLost?: number | string;
    gameCreation?: number | string;
    gameMode?: string;
    map?: string;
    championName?: string;
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
    region?: string;
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
type RiotLinkStatus = 'unlinked' | 'pending_verification' | 'verified';

interface RiotLinkState {
    status: RiotLinkStatus;
    riotGameName: string | null;
    riotTagLine: string | null;
    riotRegion: string | null;
}

interface LinkAccountForm {
    gameName: string;
    tagLine: string;
    region: string;
}

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
    const [riotLinkState, setRiotLinkState] = useState<RiotLinkState | null>(null);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [isLinkActionLoading, setIsLinkActionLoading] = useState(false);
    const [linkAccountForm, setLinkAccountForm] = useState<LinkAccountForm>({
        gameName: '',
        tagLine: '',
        region: 'euw1',
    });

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
                    elo: me?.elo ?? 2854, // Mock if 0
                    rank: me?.rank ?? 'Diamond',
                    stats: me?.stats ?? { winRate: 64, killsPerRound: 18, deathPerRound: 12 },
                });

                const myUserId = myUser?._id || outletCtx?.profile?._id;
                setCurrentUserId(myUserId ? String(myUserId) : null);
                if (myUserId) {
                    try {
                        const [riotHistoryRes, playerMatchesRes] = await Promise.allSettled([
                            axios.get(`${API}/riot-api/match-history`, { headers, params: { game: 'all', start: 0, count: 5 } }),
                            axios.get(`${API}/scouter/players/${myUserId}/matches`, { headers }),
                        ]);

                        const riotHistoryData =
                            riotHistoryRes.status === 'fulfilled' ? (riotHistoryRes.value.data as RiotMatchHistoryResponse) : null;
                        const riotMatches = Array.isArray(riotHistoryData?.matches) ? riotHistoryData?.matches : [];

                        if (riotHistoryData?.linked && riotMatches.length > 0) {
                            setRecentMatches(
                                riotMatches.slice(0, 5).map((m) => {
                                    const roundsWon = Number(m.roundsWon ?? 0);
                                    const roundsLost = Number(m.roundsLost ?? 0);
                                    const timestamp = Number(m.gameCreation ?? 0);
                                    const gameLabel = typeof m.gameType === 'string' ? m.gameType.toUpperCase() : 'GAME';
                                    return {
                                        id: String(m.matchId || `${gameLabel}-${timestamp}`),
                                        result: m.win ? 'W' : 'L',
                                        map: m.map || m.gameMode || m.championName || gameLabel,
                                        score:
                                            Number.isFinite(roundsWon) && Number.isFinite(roundsLost)
                                                ? `${roundsWon} – ${roundsLost}`
                                                : gameLabel,
                                        ago: timestamp > 0
                                            ? `${Math.max(1, Math.floor((Date.now() - timestamp) / 3600000))}h ago`
                                            : 'recent',
                                        status: gameLabel,
                                    };
                                }),
                            );
                        } else {
                            const matches =
                                playerMatchesRes.status === 'fulfilled' && Array.isArray(playerMatchesRes.value.data)
                                    ? playerMatchesRes.value.data.slice(0, 5)
                                    : [];
                            const mapped: RecentMatch[] = matches.map((m: MatchApiRecord) => {
                                const t1 = Number(m.team1GamesWon ?? 0);
                                const t2 = Number(m.team2GamesWon ?? 0);
                                const result: 'W' | 'L' = t1 >= t2 ? 'W' : 'L';
                                const ago = m.scheduledStart
                                    ? `${Math.max(1, Math.floor((Date.now() - new Date(m.scheduledStart).getTime()) / 3600000))}h ago`
                                    : 'recent';
                                return {
                                    id: String(m._id),
                                    result,
                                    map: typeof m.mapName === 'string' ? m.mapName : 'Match',
                                    score: `${t1} – ${t2}`,
                                    ago,
                                    status: m.status,
                                };
                            });
                            setRecentMatches(mapped);
                        }
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
        const fetchRiotLinkStatus = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setRiotLinkState(null);
                return;
            }
            const API = getApiBase();
            try {
                const res = await axios.get(`${API}/riot-api/link-status`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = res.data || {};
                setRiotLinkState({
                    status: normalizeRiotLinkStatus(data.status),
                    riotGameName: typeof data.riotGameName === 'string' ? data.riotGameName : null,
                    riotTagLine: typeof data.riotTagLine === 'string' ? data.riotTagLine : null,
                    riotRegion: typeof data.riotRegion === 'string' ? data.riotRegion : null,
                });
            } catch {
                setRiotLinkState(null);
            }
        };

        void fetchRiotLinkStatus();
    }, []);

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

    const handleInitiateAccountLink = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('You need to be logged in to link a game account.');
            return;
        }
        if (!linkAccountForm.gameName.trim() || !linkAccountForm.tagLine.trim()) {
            toast.error('Game name and tag line are required.');
            return;
        }
        setIsLinkActionLoading(true);
        try {
            const API = getApiBase();
            const res = await axios.post(
                `${API}/riot-api/link-account`,
                {
                    gameName: linkAccountForm.gameName.trim(),
                    tagLine: linkAccountForm.tagLine.trim(),
                    region: linkAccountForm.region,
                },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            toast.success(res.data?.message || 'Link initiated. Change your icon, then verify.');
            setRiotLinkState({
                status: 'pending_verification',
                riotGameName: linkAccountForm.gameName.trim(),
                riotTagLine: linkAccountForm.tagLine.trim(),
                riotRegion: linkAccountForm.region,
            });
        } catch (error: unknown) {
            toast.error(getApiErrorMessage(error, 'Could not initiate account link.'));
        } finally {
            setIsLinkActionLoading(false);
        }
    };

    const handleVerifyAccountLink = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('You need to be logged in to verify a game account.');
            return;
        }
        setIsLinkActionLoading(true);
        try {
            const API = getApiBase();
            const res = await axios.post(
                `${API}/riot-api/verify-account`,
                {},
                { headers: { Authorization: `Bearer ${token}` } },
            );
            const verified = Boolean(res.data?.verified);
            toast[verified ? 'success' : 'info'](
                res.data?.message || (verified ? 'Game account connected.' : 'Verification is still pending.'),
            );
            if (verified) {
                setRiotLinkState((prev) => ({
                    status: 'verified',
                    riotGameName: typeof res.data?.summonerName === 'string'
                        ? String(res.data.summonerName).split('#')[0] || prev?.riotGameName || null
                        : prev?.riotGameName || null,
                    riotTagLine: typeof res.data?.summonerName === 'string'
                        ? String(res.data.summonerName).split('#')[1] || prev?.riotTagLine || null
                        : prev?.riotTagLine || null,
                    riotRegion: prev?.riotRegion || null,
                }));
                setIsLinkModalOpen(false);
            }
        } catch (error: unknown) {
            toast.error(getApiErrorMessage(error, 'Could not verify account link.'));
        } finally {
            setIsLinkActionLoading(false);
        }
    };

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
                                <button
                                    type="button"
                                    onClick={() => setIsLinkModalOpen(true)}
                                    className="h-7 px-3 rounded-md border border-white/15 bg-white/5 text-[9px] font-black uppercase tracking-widest text-white/70 hover:border-primary/40 hover:text-primary transition-all"
                                >
                                    {riotLinkState?.status === 'verified'
                                        ? 'Game Account Connected'
                                        : riotLinkState?.status === 'pending_verification'
                                          ? 'Verify Game Account'
                                          : 'Connect Game Account'}
                                </button>
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
                            <div className="space-y-2">
                                {recentMatches.length === 0 ? (
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-white/25">
                                        No recent matches available.
                                    </p>
                                ) : (
                                    recentMatches.map((match) => (
                                        <div
                                            key={match.id}
                                            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 flex items-center justify-between gap-2"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-white truncate">
                                                    {match.map}
                                                </p>
                                                <p className="text-[9px] text-white/45 uppercase tracking-wide">
                                                    {match.ago}{match.status ? ` • ${match.status}` : ''}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p
                                                    className="text-[11px] font-black"
                                                    style={{ color: match.result === 'W' ? '#00ff87' : '#ff4654' }}
                                                >
                                                    {match.result} · {match.score}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
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
            {isLinkModalOpen && (
                <LinkGameAccountModal
                    linkState={riotLinkState}
                    form={linkAccountForm}
                    isLoading={isLinkActionLoading}
                    onClose={() => setIsLinkModalOpen(false)}
                    onFormChange={setLinkAccountForm}
                    onInitiateLink={handleInitiateAccountLink}
                    onVerifyLink={handleVerifyAccountLink}
                    onLinkAnother={() => {
                        setRiotLinkState((prev) => prev ? { ...prev, status: 'unlinked' } : prev);
                    }}
                />
            )}
        </div>
    );
}

function normalizeRiotLinkStatus(value: unknown): RiotLinkStatus {
    if (typeof value !== 'string') return 'unlinked';
    const status = value.toLowerCase();
    if (status === 'verified') return 'verified';
    if (status === 'pending_verification') return 'pending_verification';
    return 'unlinked';
}

function getApiErrorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data;
        if (typeof data === 'string') return data;
        if (typeof data?.message === 'string') return data.message;
        if (Array.isArray(data?.message) && data.message.length > 0) return String(data.message[0]);
    }
    return fallback;
}

// ─── Online Players Panel (right) ────────────────────────────────────────────

function OnlinePanel({ players, onOpenFriends }: { players: OnlinePlayer[]; onOpenFriends: () => void }) {
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

    const regionFlag: Record<string, string> = { EU: '🇪🇺', NA: '🇺🇸', AS: '🌏', AF: '🌍' };

    return (
        <div className="w-72 shrink-0 flex flex-col gap-3 h-full overflow-hidden hidden xl:flex">
            <div className="bg-[#080b10]/90 border border-white/10 rounded-[24px] flex-1 flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                <div className="p-4 border-b border-white/10 space-y-4">
                    <button
                        type="button"
                        onClick={onOpenFriends}
                        className="flex w-full items-center justify-between rounded-lg transition-colors hover:bg-white/[0.04] px-1 py-0.5"
                        title="Open friends"
                    >
                        <div className="flex items-center gap-3">
                            <Globe size={18} className="text-[#00ff87]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">OPERATORS</span>
                        </div>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(0,255,0,0.08)', color: '#00ff00', border: '1px solid rgba(0,255,0,0.15)' }}>
                            {inGameCount} live · {onlineCount} online
                        </span>
                    </button>
                    
                    <div className="relative">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="ENCRYPTED_ID..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-[10px] font-black tracking-widest text-white placeholder:text-white/10 focus:outline-none focus:border-[#00ff87]/25 transition-all"
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
                                {f === 'all' ? 'All' : f === 'in-game' ? '🎮' : '●'}
                                {f === 'all' ? '' : f === 'in-game' ? ' Game' : ' Online'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Player list */}
                <div className="flex-1 overflow-y-auto">
                    {visible.length === 0 ? (
                        <button
                            type="button"
                            onClick={onOpenFriends}
                            className="flex w-full flex-col items-center justify-center py-10 gap-2 transition-colors hover:text-white/45"
                            style={{ color: 'rgba(255,255,255,0.2)' }}
                            title="Open friends"
                        >
                            <Search size={20} />
                            <p className="text-[10px] font-bold uppercase tracking-widest">No players found</p>
                        </button>
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
                                    <span className="text-[9px] shrink-0">{regionFlag[p.region ?? 'EU']}</span>
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
        <div
            className="relative overflow-hidden rounded-[14px] border border-white/10 p-3.5 group hover:border-white/20 transition-all duration-200 bg-[#080b10]/90 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
        >
            <div className="absolute left-0 right-0 top-0 h-[1px] opacity-70" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
            {/* Subtle corner glow */}
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: color, transform: 'translate(30%, -30%)' }} />

            <div className="flex items-start justify-between gap-2 mb-3">
                <div className="p-2 rounded-xl" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                    <span style={{ color }}>{icon}</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-white/25">{label}</span>
            </div>
            <div className="text-4xl font-black text-white leading-none mb-1 tracking-tight" style={{ textShadow: `0 0 20px ${color}30` }}>
                {value}
            </div>
            <div className="text-[9px] font-bold text-white/35 uppercase tracking-wide">{sub}</div>

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

function LinkGameAccountModal({
    linkState,
    form,
    isLoading,
    onClose,
    onFormChange,
    onInitiateLink,
    onVerifyLink,
    onLinkAnother,
}: {
    linkState: RiotLinkState | null;
    form: LinkAccountForm;
    isLoading: boolean;
    onClose: () => void;
    onFormChange: React.Dispatch<React.SetStateAction<LinkAccountForm>>;
    onInitiateLink: () => Promise<void>;
    onVerifyLink: () => Promise<void>;
    onLinkAnother: () => void;
}) {
    const connectedLabel =
        linkState?.riotGameName && linkState?.riotTagLine
            ? `${linkState.riotGameName}#${linkState.riotTagLine}`
            : null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg" onClick={onClose}>
            <div
                className="relative w-full max-w-xl bg-[#060606] border border-white/10 rounded-[36px] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.7)]"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-6 right-6 text-white/25 hover:text-white transition-colors">
                    <X size={20} />
                </button>

                <div className="p-8 md:p-10 space-y-6">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-primary italic">Account Link Protocol</p>
                        <h3 className="mt-2 text-2xl md:text-3xl font-black italic uppercase tracking-tight text-white">
                            Connect Game Account
                        </h3>
                        <p className="mt-2 text-xs text-white/45 uppercase tracking-wide">
                            Link account, change your in-game icon, then verify ownership.
                        </p>
                    </div>

                    {linkState?.status === 'verified' && (
                        <div className="rounded-2xl border border-primary/25 bg-primary/10 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Game account connected</p>
                            <p className="text-sm text-white mt-1">{connectedLabel || 'Linked account'}</p>
                            <button
                                type="button"
                                onClick={onLinkAnother}
                                className="mt-3 text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-primary"
                            >
                                Link another game account
                            </button>
                        </div>
                    )}

                    {linkState?.status !== 'verified' && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                    value={form.gameName}
                                    onChange={(e) => onFormChange((prev) => ({ ...prev, gameName: e.target.value }))}
                                    placeholder="Game name (e.g. Faker)"
                                    className="h-11 rounded-xl bg-black/50 border border-white/10 px-4 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-primary/40"
                                />
                                <input
                                    value={form.tagLine}
                                    onChange={(e) => onFormChange((prev) => ({ ...prev, tagLine: e.target.value }))}
                                    placeholder="Tag line (e.g. KR1)"
                                    className="h-11 rounded-xl bg-black/50 border border-white/10 px-4 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-primary/40"
                                />
                            </div>
                            <select
                                value={form.region}
                                onChange={(e) => onFormChange((prev) => ({ ...prev, region: e.target.value }))}
                                className="h-11 w-full rounded-xl bg-black/50 border border-white/10 px-4 text-sm text-white focus:outline-none focus:border-primary/40"
                            >
                                {['euw1', 'eun1', 'na1', 'kr', 'br1', 'jp1', 'la1', 'la2', 'oc1', 'tr1', 'ru'].map((region) => (
                                    <option key={region} value={region}>
                                        {region.toUpperCase()}
                                    </option>
                                ))}
                            </select>

                            <div className="flex flex-wrap items-center gap-3 pt-1">
                                <button
                                    type="button"
                                    disabled={isLoading}
                                    onClick={() => void onInitiateLink()}
                                    className="h-11 px-5 rounded-xl bg-primary text-black text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-60"
                                >
                                    {isLoading ? 'Processing...' : 'Start Link'}
                                </button>
                                <button
                                    type="button"
                                    disabled={isLoading || linkState?.status !== 'pending_verification'}
                                    onClick={() => void onVerifyLink()}
                                    className="h-11 px-5 rounded-xl border border-white/20 bg-white/5 text-white text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-50"
                                >
                                    Verify Game Account
                                </button>
                            </div>
                            <p className="text-[10px] text-white/35 uppercase tracking-wide">
                                {linkState?.status === 'pending_verification'
                                    ? 'Pending verification: change your icon in the client, then verify.'
                                    : 'Step 1: initiate link. Step 2: change icon. Step 3: verify.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
}

function AppCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
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
