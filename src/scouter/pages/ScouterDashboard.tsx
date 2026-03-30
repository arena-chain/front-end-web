import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Users,
    Binoculars,
    TrendingUp,
    Star,
    ArrowRight,
    ScanLine,
    FileText,
    Send,
    Filter,
    Gamepad2,
} from 'lucide-react';
import { scouterService, type ScoutedPlayerProfile } from '../../services/scouterService';
import {
    scoutingService,
    type ScoutingReport,
    type PlayerFilterParams,
    ProspectLevel,
    ProspectPriority,
} from '../../services/scoutingService';
import catalogService from '../../services/catalogService';
import type { Game } from '../../models/game';

function getScouterId(): string | null {
    try {
        const raw = localStorage.getItem('user');
        const user = raw ? JSON.parse(raw) : null;
        return user?.id ?? user?._id ?? null;
    } catch {
        return null;
    }
}

export default function ScouterDashboard() {
    const scouterId = getScouterId();
    const [players, setPlayers] = useState<ScoutedPlayerProfile[]>([]);
    const [reports, setReports] = useState<ScoutingReport[]>([]);
    const [reportsCount, setReportsCount] = useState(0);
    const [prospectsCount, setProspectsCount] = useState(0);
    const [recommendationsCount, setRecommendationsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filterLoading, setFilterLoading] = useState(false);
    const [games, setGames] = useState<Game[]>([]);
    const [filterResults, setFilterResults] = useState<unknown[]>([]);
    const [filterOpen, setFilterOpen] = useState(false);
    const [filters, setFilters] = useState<PlayerFilterParams>({});

    useEffect(() => {
        scouterService
            .getPlayers()
            .then(setPlayers)
            .catch(() => setPlayers([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        catalogService.fetchGames().then(setGames).catch(() => setGames([]));
    }, []);

    useEffect(() => {
        if (!scouterId) return;
        scoutingService.listReportsByScouter(scouterId).then((r) => {
            setReports(r);
            setReportsCount(r.length);
        }).catch(() => {});
        scoutingService.listProspects().then((p) => setProspectsCount(p.length)).catch(() => {});
        scoutingService.listRecommendationsByScouter(scouterId).then((r) => setRecommendationsCount(r.length)).catch(() => {});
    }, [scouterId]);

    const runFilter = () => {
        setFilterLoading(true);
        scoutingService
            .filterPlayers(filters)
            .then((data) => setFilterResults(Array.isArray(data) ? data : []))
            .catch(() => setFilterResults([]))
            .finally(() => setFilterLoading(false));
        setFilterOpen(true);
    };

    const recentCount = Math.min(5, players.length);
    const recentPlayers = players.slice(0, recentCount);
    const recentReports = reports.slice(0, 5);

    const playerName = (r: ScoutingReport) => {
        const p = r.playerId;
        if (typeof p === 'object' && p && 'nickname' in p) return (p as { nickname?: string }).nickname ?? 'Player';
        return 'Player';
    };

    const playerIdFromReport = (r: ScoutingReport) => {
        const p = r.playerId;
        if (typeof p === 'object' && p && '_id' in p) return (p as { _id: string })._id;
        return typeof p === 'string' ? p : '';
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div>
                <div className="flex items-center gap-2 text-primary/80 text-xs font-bold uppercase tracking-widest mb-2">
                    <ScanLine size={14} /> Scout Hub
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">Dashboard</h1>
                <p className="text-white/50 text-sm mt-1">
                    Overview, filter players, and quick access to reports and recommendations.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                    to="/scouter/players"
                    className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-primary/25 hover:bg-primary/[0.04] transition-all group"
                >
                    <Users className="w-8 h-8 text-primary/80 mb-3 group-hover:text-primary" />
                    <p className="text-2xl font-black text-white">{loading ? '—' : players.length}</p>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/50">Players in pool</p>
                </Link>
                <Link
                    to="/scouter/reports"
                    className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-primary/25 hover:bg-primary/[0.04] transition-all group"
                >
                    <FileText className="w-8 h-8 text-primary/80 mb-3 group-hover:text-primary" />
                    <p className="text-2xl font-black text-white">{reportsCount}</p>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/50">My reports</p>
                </Link>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-primary/25 hover:bg-primary/[0.03] transition-all">
                    <Star className="w-8 h-8 text-primary/80 mb-3" />
                    <p className="text-2xl font-black text-white">{prospectsCount}</p>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/50">Prospects</p>
                </div>
                <Link
                    to="/scouter/recommendations"
                    className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-primary/25 hover:bg-primary/[0.04] transition-all group"
                >
                    <Send className="w-8 h-8 text-primary/80 mb-3 group-hover:text-primary" />
                    <p className="text-2xl font-black text-white">{recommendationsCount}</p>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/50">Recommendations</p>
                </Link>
            </div>

            {/* Filter players */}
            <div className="rounded-2xl border border-primary/10 bg-white/[0.02] overflow-hidden">
                <div className="px-6 py-4 border-b border-primary/10 flex items-center gap-2">
                    <Filter className="w-5 h-5 text-primary" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-primary/90">Filter players</h2>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-white/60 mb-1">Game</label>
                        <select
                            value={filters.gameId ?? ''}
                            onChange={(e) => setFilters((f) => ({ ...f, gameId: e.target.value || undefined }))}
                            className="w-full px-4 py-2.5 rounded-xl bg-[#111317] border border-white/10 text-white text-sm focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30 transition-all"
                        >
                            <option value="">Any</option>
                            {games.map((g) => (
                                <option key={g._id} value={g._id}>{g.title}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-white/60 mb-1">Tier</label>
                        <select
                            value={filters.tier ?? ''}
                            onChange={(e) => setFilters((f) => ({ ...f, tier: e.target.value || undefined }))}
                            className="w-full px-4 py-2.5 rounded-xl bg-[#111317] border border-white/10 text-white text-sm focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30 transition-all"
                        >
                            <option value="">Any</option>
                            {['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER', 'IMMORTAL', 'RADIANT'].map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-white/60 mb-1">Country</label>
                        <input
                            type="text"
                            value={filters.country ?? ''}
                            onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value || undefined }))}
                            placeholder="e.g. Tunisia"
                            className="w-full px-4 py-2.5 rounded-xl bg-[#111317] border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-white/60 mb-1">Has team</label>
                        <select
                            value={filters.hasTeam === undefined ? '' : String(filters.hasTeam)}
                            onChange={(e) => {
                                const v = e.target.value;
                                setFilters((f) => ({ ...f, hasTeam: v === '' ? undefined : v === 'true' }));
                            }}
                            className="w-full px-4 py-2.5 rounded-xl bg-[#111317] border border-white/10 text-white text-sm focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30 transition-all"
                        >
                            <option value="">Any</option>
                            <option value="true">Yes</option>
                            <option value="false">Free agent</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-white/60 mb-1">Prospect level</label>
                        <select
                            value={filters.prospectLevel ?? ''}
                            onChange={(e) => setFilters((f) => ({ ...f, prospectLevel: (e.target.value || undefined) as ProspectLevel | undefined }))}
                            className="w-full px-4 py-2.5 rounded-xl bg-[#111317] border border-white/10 text-white text-sm focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30 transition-all"
                        >
                            <option value="">Any</option>
                            {Object.values(ProspectLevel).map((l) => (
                                <option key={l} value={l}>{l.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-white/60 mb-1">Priority</label>
                        <select
                            value={filters.priority ?? ''}
                            onChange={(e) => setFilters((f) => ({ ...f, priority: (e.target.value || undefined) as ProspectPriority | undefined }))}
                            className="w-full px-4 py-2.5 rounded-xl bg-[#111317] border border-white/10 text-white text-sm focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30 transition-all"
                        >
                            <option value="">Any</option>
                            {Object.values(ProspectPriority).map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="px-6 pb-6 flex gap-2">
                    <button
                        type="button"
                        onClick={runFilter}
                        disabled={filterLoading}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary/25 to-primary/15 border border-primary/35 text-primary font-bold text-sm hover:from-primary/35 hover:to-primary/20 disabled:opacity-50 flex items-center gap-2 shadow-[0_0_16px_rgba(57,255,20,0.12)] transition-all"
                    >
                        <Filter size={16} /> {filterLoading ? 'Searching…' : 'Search'}
                    </button>
                    <Link
                        to="/scouter/players"
                        className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80 font-bold text-sm hover:bg-white/10 hover:border-primary/20 hover:text-white flex items-center gap-2 transition-all"
                    >
                        <Gamepad2 size={16} /> Browse all players
                    </Link>
                </div>
                {filterOpen && filterResults.length >= 0 && (
                    <div className="px-6 pb-6">
                        <p className="text-sm text-white/60 mb-2">
                            Found <span className="text-primary font-bold">{filterResults.length}</span> players. Open a player to view profile and create reports.
                        </p>
                        {filterResults.length > 0 && (
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2 max-h-48 overflow-y-auto">
                                {filterResults.slice(0, 10).map((p: { _id?: string; userId?: { _id?: string; nickname?: string } }, i: number) => (
                                    <Link
                                        key={p._id ?? i}
                                        to={`/scouter/players/${(p.userId as { _id?: string })?._id ?? p._id}`}
                                        className="block text-primary hover:underline text-sm"
                                    >
                                        {(p.userId as { nickname?: string })?.nickname ?? 'Player'} →
                                    </Link>
                                ))}
                                {filterResults.length > 10 && (
                                    <p className="text-xs text-white/40">… and {filterResults.length - 10} more</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Quick actions */}
            <div className="grid md:grid-cols-2 gap-4">
                <Link
                    to="/scouter/players"
                    className="group flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all shadow-[0_0_18px_rgba(57,255,20,0.08)]"
                >
                    <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Users className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">Browse players</h3>
                        <p className="text-sm text-white/50">View rankings, open profiles, and create reports.</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                <Link
                    to="/scouter/reports"
                    className="group flex items-center gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/20 hover:bg-white/10 transition-all"
                >
                    <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <FileText className="w-7 h-7 text-white/70" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">Reports</h3>
                        <p className="text-sm text-white/50">View and create player evaluations.</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Recent players */}
                <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                    <div className="px-6 py-4 border-b border-primary/10 flex items-center justify-between">
                        <h2 className="text-sm font-black uppercase tracking-widest text-primary/90">Recent players</h2>
                        <Link to="/scouter/players" className="text-xs font-bold text-primary hover:underline">
                            View all →
                        </Link>
                    </div>
                    <div className="divide-y divide-white/5">
                        {loading ? (
                            <div className="px-6 py-12 text-center text-white/40 text-sm">Loading…</div>
                        ) : recentPlayers.length === 0 ? (
                            <div className="px-6 py-12 text-center text-white/40 text-sm">No players in pool yet.</div>
                        ) : (
                            recentPlayers.map((p) => {
                                const userId = typeof p.userId === 'object' && p.userId !== null && '_id' in p.userId ? (p.userId as { _id: string })._id : (p as { _id?: string })._id;
                                const name = typeof p.userId === 'object' && p.userId !== null && 'nickname' in p.userId ? (p.userId as { nickname: string }).nickname : (p as { nickname?: string }).nickname ?? 'Player';
                                return (
                                    <Link
                                        key={userId ?? p._id}
                                        to={`/scouter/players/${userId ?? p._id}`}
                                        className="flex items-center gap-4 px-6 py-4 hover:bg-primary/5 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
                                            {name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-white truncate">{name}</p>
                                            <p className="text-xs text-white/50">Elo: {p.elo ?? '—'} · Rank: {p.rank ?? '—'}</p>
                                        </div>
                                        <ArrowRight size={16} className="text-primary/60 shrink-0" />
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Recent reports */}
                <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                    <div className="px-6 py-4 border-b border-primary/10 flex items-center justify-between">
                        <h2 className="text-sm font-black uppercase tracking-widest text-primary/90">Recent reports</h2>
                        <Link to="/scouter/reports" className="text-xs font-bold text-primary hover:underline">
                            View all →
                        </Link>
                    </div>
                    <div className="divide-y divide-white/5">
                        {recentReports.length === 0 ? (
                            <div className="px-6 py-12 text-center text-white/40 text-sm">No reports yet. Create one from a player profile.</div>
                        ) : (
                            recentReports.map((r) => (
                                <Link
                                    key={r._id}
                                    to={`/scouter/players/${playerIdFromReport(r)}`}
                                    className="flex items-center gap-4 px-6 py-4 hover:bg-primary/5 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
                                        {playerName(r).charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-white truncate">{playerName(r)}</p>
                                        <p className="text-xs text-white/50">Rating {r.rating}/100 {r.recommendedRole && `· ${r.recommendedRole}`}</p>
                                    </div>
                                    <ArrowRight size={16} className="text-primary/60 shrink-0" />
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
