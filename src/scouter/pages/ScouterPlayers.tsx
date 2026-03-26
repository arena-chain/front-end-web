import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Search, Gamepad2, Users, MapPin } from 'lucide-react';
import { scouterService, type LeaderboardEntry, type ScoutedPlayerProfile } from '../../services/scouterService';
import { scoutingService } from '../../services/scoutingService';
import catalogService from '../../services/catalogService';
import type { Game } from '../../models/game';
import { STATIC_LEADERBOARD } from '../data/staticLeaderboard';

/** Map backend player profile to leaderboard entry shape for the table */
function profileToEntry(p: ScoutedPlayerProfile | Record<string, unknown>, index: number): LeaderboardEntry {
    const userId = typeof p.userId === 'object' && p.userId !== null && '_id' in p.userId
        ? (p.userId as { _id: string })._id
        : (p as { _id?: string })._id ?? `player-${index}`;
    const nickname = typeof p.userId === 'object' && p.userId !== null && 'nickname' in p.userId
        ? (p.userId as { nickname?: string }).nickname
        : (p as { nickname?: string }).nickname ?? 'Player';
    return {
        _id: (p as { _id?: string })._id ?? userId,
        user: { _id: userId, nickname },
        team: (p as { team?: LeaderboardEntry['team'] }).team,
        elo: (p as { elo?: number }).elo,
        tier: (p as { tier?: string }).tier,
        division: (p as { division?: number }).division,
        rank: (p as { rank?: string }).rank,
        region: (p as { region?: string }).region,
    };
}

export default function ScouterPlayers() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [games, setGames] = useState<Game[]>([]);
    const [selectedGameId, setSelectedGameId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [gamesLoading, setGamesLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [dataSource, setDataSource] = useState<'leaderboard' | 'players' | 'filter' | 'demo'>('leaderboard');

    useEffect(() => {
        setGamesLoading(true);
        catalogService
            .fetchGames()
            .then(setGames)
            .catch(() => setGames([]))
            .finally(() => setGamesLoading(false));
    }, []);

    // Auto-select first game so players show immediately when navigating here
    useEffect(() => {
        if (games.length > 0 && !selectedGameId) {
            setSelectedGameId(games[0]._id);
        }
    }, [games]);

    // Prefer real API: leaderboard → players list → filter by game → demo fallback
    useEffect(() => {
        if (!selectedGameId) {
            setLeaderboard([]);
            setDataSource('leaderboard');
            return;
        }
        setLoading(true);
        setDataSource('leaderboard');

        scouterService
            .getLeaderboard(selectedGameId)
            .then((data) => {
                if (data.length > 0) {
                    setLeaderboard(data);
                    setDataSource('leaderboard');
                    return;
                }
                return scouterService.getPlayers().then((players) => {
                    if (players.length > 0) {
                        const entries = players.map((p, i) => profileToEntry(p, i)).sort((a, b) => (b.elo ?? 0) - (a.elo ?? 0));
                        setLeaderboard(entries);
                        setDataSource('players');
                        return;
                    }
                    return scoutingService.filterPlayers({ gameId: selectedGameId }).then((filtered) => {
                        const list = Array.isArray(filtered) ? filtered : [];
                        if (list.length > 0) {
                            const entries = list.map((p: Record<string, unknown>, i: number) => profileToEntry(p, i)).sort((a, b) => (b.elo ?? 0) - (a.elo ?? 0));
                            setLeaderboard(entries);
                            setDataSource('filter');
                            return;
                        }
                        setLeaderboard([...STATIC_LEADERBOARD]);
                        setDataSource('demo');
                    });
                });
            })
            .catch(() =>
                scouterService.getPlayers()
                    .then((players) => {
                        if (players.length > 0) {
                            const entries = players.map((p, i) => profileToEntry(p, i)).sort((a, b) => (b.elo ?? 0) - (a.elo ?? 0));
                            setLeaderboard(entries);
                            setDataSource('players');
                        } else {
                            return scoutingService.filterPlayers({ gameId: selectedGameId }).then((filtered) => {
                                const list = Array.isArray(filtered) ? filtered : [];
                                if (list.length > 0) {
                                    const entries = list.map((p: Record<string, unknown>, i: number) => profileToEntry(p, i)).sort((a, b) => (b.elo ?? 0) - (a.elo ?? 0));
                                    setLeaderboard(entries);
                                    setDataSource('filter');
                                } else {
                                    setLeaderboard([...STATIC_LEADERBOARD]);
                                    setDataSource('demo');
                                }
                            });
                        }
                    })
                    .catch(() =>
                        scoutingService.filterPlayers({ gameId: selectedGameId })
                            .then((filtered) => {
                                const list = Array.isArray(filtered) ? filtered : [];
                                if (list.length > 0) {
                                    const entries = list.map((p: Record<string, unknown>, i: number) => profileToEntry(p, i)).sort((a, b) => (b.elo ?? 0) - (a.elo ?? 0));
                                    setLeaderboard(entries);
                                    setDataSource('filter');
                                } else {
                                    setLeaderboard([...STATIC_LEADERBOARD]);
                                    setDataSource('demo');
                                }
                            })
                            .catch(() => {
                                setLeaderboard([...STATIC_LEADERBOARD]);
                                setDataSource('demo');
                            })
                    )
            )
            .finally(() => setLoading(false));
    }, [selectedGameId]);

    const filtered = leaderboard.filter((e) => {
        const name = (e.user?.nickname ?? '').toLowerCase();
        const country = (e.user?.country ?? e.region ?? '').toLowerCase();
        const teamName = (e.team?.name ?? '').toLowerCase();
        const q = search.toLowerCase();
        return !q || name.includes(q) || country.includes(q) || teamName.includes(q);
    });

    const formatRank = (tier: string, division: number) => {
        if (!tier) return 'Unranked';
        return division != null ? `${tier} ${division}` : tier;
    };

    const origin = (e: LeaderboardEntry) =>
        e.user?.country ?? e.user?.region ?? e.region ?? '—';

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div>
                <div className="flex items-center gap-2 text-primary/80 text-xs font-bold uppercase tracking-widest mb-2">
                    <Trophy size={14} /> Rankings
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-primary" />
                    Rankings
                </h1>
                <p className="text-white/50 text-sm mt-1">
                    View ranked players by game. Filter by Valorant, League of Legends, or other titles. Click a player to see profile and match history.
                </p>
            </div>

            {/* Game filter – Scout Hub style */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-white/70">Game</span>
                </div>
                <select
                    value={selectedGameId}
                    onChange={(e) => setSelectedGameId(e.target.value)}
                    disabled={gamesLoading}
                    className="px-4 py-2.5 rounded-xl bg-white/5 border border-primary/20 text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all min-w-[220px] disabled:opacity-50"
                >
                    <option value="">Select a game…</option>
                    {games.map((g) => (
                        <option key={g._id} value={g._id}>
                            {g.title}
                        </option>
                    ))}
                </select>
            </div>

            {/* Search */}
            {selectedGameId && (
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by nickname, team, or origin…"
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-primary/20 text-white placeholder-white/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                    />
                </div>
            )}

            {!selectedGameId ? (
                <div className="py-24 text-center rounded-2xl border border-primary/10 bg-primary/5">
                    <Gamepad2 className="w-14 h-14 text-primary/50 mx-auto mb-4" />
                    <p className="text-white/80 font-semibold">Select a game</p>
                    <p className="text-white/40 text-sm mt-1 max-w-sm mx-auto">
                        Choose Valorant, League of Legends, or another game to view the leaderboard.
                    </p>
                </div>
            ) : loading ? (
                <div className="py-24 text-center text-primary/70">Loading rankings…</div>
            ) : filtered.length === 0 ? (
                <div className="py-24 text-center rounded-2xl border border-primary/10 bg-primary/5">
                    <Trophy className="w-14 h-14 text-primary/50 mx-auto mb-4" />
                    <p className="text-white/80 font-semibold">No ranked players found</p>
                    <p className="text-white/40 text-sm mt-1">This game has no leaderboard entries yet. Ranks are populated when players compete.</p>
                </div>
            ) : (
                <div className="rounded-2xl border border-primary/10 bg-white/[0.02] overflow-hidden">
                    {dataSource === 'demo' && (
                        <div className="px-6 py-3 border-b border-amber-500/20 bg-amber-500/10 text-amber-200/90 text-sm">
                            Showing demo data. Connect your backend (leaderboard, <code className="text-amber-300/90">/scouter/players</code>, or <code className="text-amber-300/90">/scouting/players/filter</code>) to see real players.
                        </div>
                    )}
                    {(dataSource === 'leaderboard' || dataSource === 'players' || dataSource === 'filter') && (
                        <div className="px-6 py-2 border-b border-primary/10 text-xs text-primary/80 font-medium">
                            Real players from API {dataSource === 'leaderboard' ? '(leaderboard)' : dataSource === 'players' ? '(players list)' : '(filter)'}
                        </div>
                    )}
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-primary/10 text-[10px] font-black uppercase tracking-widest text-primary/80">
                        <div className="col-span-1">#</div>
                        <div className="col-span-4 md:col-span-3">Player</div>
                        <div className="col-span-2 md:col-span-2">Team</div>
                        <div className="col-span-2">Origin</div>
                        <div className="col-span-2">Rank</div>
                        <div className="col-span-1 text-right">Elo</div>
                    </div>
                    <div className="divide-y divide-white/5">
                        {filtered.map((e, idx) => {
                            const userId = typeof e.user === 'object' && e.user !== null && '_id' in e.user ? (e.user as { _id: string })._id : '';
                            const name = (e.user as { nickname?: string })?.nickname ?? 'Player';
                            const rankLabel = formatRank(e.tier ?? '', e.division ?? 0);
                            const teamLogo = e.team?.logo;
                            const teamName = e.team?.name;
                            return (
                                <Link
                                    key={e._id}
                                    to={`/scouter/players/${userId}`}
                                    className="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-primary/5 transition-colors"
                                >
                                    <div className="col-span-1">
                                        <span className="inline-flex w-8 h-8 items-center justify-center rounded-lg bg-primary/20 border border-primary/30 text-primary font-black text-sm">
                                            #{idx + 1}
                                        </span>
                                    </div>
                                    <div className="col-span-4 md:col-span-3 flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-black text-lg shrink-0">
                                            {name.charAt(0).toUpperCase()}
                                        </div>
                                        <p className="font-bold text-white truncate">{name}</p>
                                    </div>
                                    <div className="col-span-2 md:col-span-2 flex items-center gap-2 min-w-0">
                                        {teamName || teamLogo ? (
                                            <>
                                                {teamLogo ? (
                                                    <img
                                                        src={teamLogo}
                                                        alt=""
                                                        className="w-8 h-8 rounded-lg object-contain bg-white/5 border border-white/10 shrink-0"
                                                        onError={(ev) => { ev.currentTarget.style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                                                        <Users className="w-4 h-4 text-white/50" />
                                                    </div>
                                                )}
                                                <span className="text-white/70 text-sm truncate">{teamName ?? '—'}</span>
                                            </>
                                        ) : (
                                            <span className="text-white/40 text-sm">—</span>
                                        )}
                                    </div>
                                    <div className="col-span-2 flex items-center gap-1.5 text-white/70 text-sm">
                                        <MapPin size={12} className="text-primary/70 shrink-0" />
                                        <span className="truncate">{origin(e)}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-primary/90 font-semibold text-sm">{rankLabel}</span>
                                    </div>
                                    <div className="col-span-1 text-right">
                                        <span className="text-white/80 font-mono text-sm">{e.elo ?? '—'}</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
