import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Users,
    Star,
    ArrowRight,
    ScanLine,
    FileText,
    Send,
    Filter,
    Gamepad2,
    Play,
    Sparkles,
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
import { highlightService, type HighlightRecord } from '../../services/highlight.service';
import { resolveBackendAssetUrl } from '../../lib/apiBase';
import { sortPublicHighlights, highlightCreatorLabel, rankHighlightsByEngagement } from '../lib/scouterHighlightUtils';
import { MediaEngagementStrip } from '../../components/highlights/MediaEngagementStrip';
import { ScouterHighlightDetailModal } from '../components/ScouterHighlightDetailModal';

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
    const [epicClips, setEpicClips] = useState<HighlightRecord[]>([]);
    const [epicMediaLoading, setEpicMediaLoading] = useState(true);
    const [activeClipId, setActiveClipId] = useState<string | null>(null);

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
        }).catch(() => { });
        scoutingService.listProspects().then((p) => setProspectsCount(p.length)).catch(() => { });
        scoutingService.listRecommendationsByScouter(scouterId).then((r) => setRecommendationsCount(r.length)).catch(() => { });
    }, [scouterId]);

    useEffect(() => {
        let cancelled = false;
        setEpicMediaLoading(true);
        highlightService
            .listPublic()
            .then((list) => sortPublicHighlights(Array.isArray(list) ? list : []))
            .then((sorted) => rankHighlightsByEngagement(sorted))
            .then((ranked) => ranked.slice(0, 12))
            .catch(() => [] as HighlightRecord[])
            .then((c) => {
                if (!cancelled) setEpicClips(c);
            })
            .finally(() => {
                if (!cancelled) setEpicMediaLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

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
            <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#141820] p-6 shadow-xl shadow-black/40 sm:p-8">
                <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                    aria-hidden
                />
                <div className="relative pt-0.5">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-2 text-primary">
                            <ScanLine size={14} /> Scout Hub
                        </span>
                        <span className="text-zinc-600">·</span>
                        <span className="text-scout-cyan">Live pool</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-white">Dashboard</h1>
                    <p className="mt-2 max-w-xl text-sm text-zinc-400">
                        Overview, epic highlights, filter players, and quick access to reports and recommendations.
                    </p>
                </div>
            </div>

            {/* Public highlight clips */}
            <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#141820] shadow-xl shadow-black/40">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900 px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950">
                            <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-white">Highlights</h2>
                            <p className="mt-0.5 text-xs text-zinc-500">
                                Top clips by reactions (likes, comments, saves) — scroll sideways.
                            </p>
                        </div>
                    </div>
                    <Link
                        to="/scouter/highlights"
                        className="shrink-0 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:border-primary/50 hover:bg-zinc-900"
                    >
                        Full list →
                    </Link>
                </div>
                <div className="bg-[#141820] p-5 sm:p-6">
                    {epicMediaLoading ? (
                        <div className="flex gap-6 overflow-hidden sm:gap-7">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="aspect-[9/16] w-[200px] shrink-0 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900 sm:w-[220px]"
                                />
                            ))}
                        </div>
                    ) : epicClips.length === 0 ? (
                        <p className="text-xs text-white/40 py-2">
                            No public highlight clips yet.
                        </p>
                    ) : (
                        <div className="flex gap-6 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory sm:gap-7 scrollbar-thin [scrollbar-color:rgba(167,139,250,0.35)_transparent] [-webkit-overflow-scrolling:touch]">
                            {epicClips.map((h) => (
                                <button
                                    key={h._id}
                                    type="button"
                                    onClick={() => setActiveClipId(h._id)}
                                    className="group/card w-[200px] shrink-0 snap-start overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 text-left shadow-md shadow-black/30 transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-black/50 sm:w-[220px]"
                                >
                                    <div className="relative aspect-[9/16] w-full bg-zinc-950">
                                        {h.clipUrl ? (
                                            <video
                                                src={resolveBackendAssetUrl(h.clipUrl)}
                                                className="h-full w-full object-cover opacity-92 transition-opacity group-hover/card:opacity-100"
                                                muted
                                                playsInline
                                                preload="metadata"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-zinc-900">
                                                <Sparkles className="h-10 w-10 text-zinc-600" />
                                            </div>
                                        )}
                                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover/card:opacity-100">
                                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-black shadow-lg">
                                                <Play size={22} className="ml-0.5" fill="currentColor" />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-2 border-t border-zinc-800 p-3">
                                        <p className="line-clamp-2 text-xs font-bold leading-tight text-white">{h.title}</p>
                                        <p className="line-clamp-1 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                                            {highlightCreatorLabel(h.creator)}
                                        </p>
                                        <div className="flex flex-wrap items-center justify-end gap-1">
                                            <MediaEngagementStrip kind="highlight" id={h._id} />
                                        </div>
                                        {h.description?.trim() ? (
                                            <p className="line-clamp-3 border-t border-zinc-800 pt-2 text-left text-[10px] leading-snug text-zinc-500">
                                                {h.description.trim()}
                                            </p>
                                        ) : null}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <ScouterHighlightDetailModal
                highlights={epicClips}
                activeHighlightId={activeClipId}
                onClose={() => setActiveClipId(null)}
                onNavigate={setActiveClipId}
            />

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Link
                    to="/scouter/players"
                    className="group rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-md shadow-black/25 transition-all hover:border-primary/60 hover:bg-zinc-800"
                >
                    <Users className="mb-3 h-8 w-8 text-primary transition-transform group-hover:scale-105" />
                    <p className="text-2xl font-black text-white">{loading ? '—' : players.length}</p>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Players in pool</p>
                </Link>
                <Link
                    to="/scouter/reports"
                    className="group rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-md shadow-black/25 transition-all hover:border-scout-cyan/50 hover:bg-zinc-800"
                >
                    <FileText className="mb-3 h-8 w-8 text-scout-cyan transition-transform group-hover:scale-105" />
                    <p className="text-2xl font-black text-white">{reportsCount}</p>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">My reports</p>
                </Link>
                <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-md shadow-black/25 transition-colors hover:border-scout-violet/40 hover:bg-zinc-800">
                    <Star className="mb-3 h-8 w-8 text-scout-violet" />
                    <p className="text-2xl font-black text-white">{prospectsCount}</p>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Prospects</p>
                </div>
                <Link
                    to="/scouter/recommendations"
                    className="group rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-md shadow-black/25 transition-all hover:border-scout-amber/50 hover:bg-zinc-800"
                >
                    <Send className="mb-3 h-8 w-8 text-scout-amber transition-transform group-hover:scale-105" />
                    <p className="text-2xl font-black text-white">{recommendationsCount}</p>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Recommendations</p>
                </Link>
            </div>

            {/* Filter players */}
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#141820] shadow-xl shadow-black/40">
                <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-6 py-4">
                    <Filter className="h-5 w-5 text-scout-cyan" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-white">
                        Filter players
                        <span className="ml-2 text-primary">·</span>
                        <span className="text-zinc-400"> scout tools</span>
                    </h2>
                </div>
                <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <label className="mb-1 block text-xs font-bold text-zinc-500">Game</label>
                        <select
                            value={filters.gameId ?? ''}
                            onChange={(e) => setFilters((f) => ({ ...f, gameId: e.target.value || undefined }))}
                            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                        >
                            <option value="">Any</option>
                            {games.map((g) => (
                                <option key={g._id} value={g._id}>{g.title}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-bold text-zinc-500">Tier</label>
                        <select
                            value={filters.tier ?? ''}
                            onChange={(e) => setFilters((f) => ({ ...f, tier: e.target.value || undefined }))}
                            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                        >
                            <option value="">Any</option>
                            {['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER', 'IMMORTAL', 'RADIANT'].map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-bold text-zinc-500">Country</label>
                        <input
                            type="text"
                            value={filters.country ?? ''}
                            onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value || undefined }))}
                            placeholder="e.g. Tunisia"
                            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-bold text-zinc-500">Has team</label>
                        <select
                            value={filters.hasTeam === undefined ? '' : String(filters.hasTeam)}
                            onChange={(e) => {
                                const v = e.target.value;
                                setFilters((f) => ({ ...f, hasTeam: v === '' ? undefined : v === 'true' }));
                            }}
                            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                        >
                            <option value="">Any</option>
                            <option value="true">Yes</option>
                            <option value="false">Free agent</option>
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-bold text-zinc-500">Prospect level</label>
                        <select
                            value={filters.prospectLevel ?? ''}
                            onChange={(e) => setFilters((f) => ({ ...f, prospectLevel: (e.target.value || undefined) as ProspectLevel | undefined }))}
                            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                        >
                            <option value="">Any</option>
                            {Object.values(ProspectLevel).map((l) => (
                                <option key={l} value={l}>{l.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-bold text-zinc-500">Priority</label>
                        <select
                            value={filters.priority ?? ''}
                            onChange={(e) => setFilters((f) => ({ ...f, priority: (e.target.value || undefined) as ProspectPriority | undefined }))}
                            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                        >
                            <option value="">Any</option>
                            {Object.values(ProspectPriority).map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex gap-2 px-6 pb-6">
                    <button
                        type="button"
                        onClick={runFilter}
                        disabled={filterLoading}
                        className="flex items-center gap-2 rounded-xl border border-primary bg-zinc-900 px-4 py-2.5 text-sm font-bold text-primary transition-all hover:bg-zinc-800 disabled:opacity-50"
                    >
                        <Filter size={16} /> {filterLoading ? 'Searching…' : 'Search'}
                    </button>
                    <Link
                        to="/scouter/players"
                        className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm font-bold text-zinc-200 transition-all hover:border-zinc-600 hover:bg-zinc-900 hover:text-white"
                    >
                        <Gamepad2 size={16} /> Browse all players
                    </Link>
                </div>
                {filterOpen && filterResults.length >= 0 && (
                    <div className="px-6 pb-6">
                        <p className="mb-2 text-sm text-zinc-400">
                            Found <span className="font-bold text-primary">{filterResults.length}</span> players. Open a player to view profile and create reports.
                        </p>
                        {filterResults.length > 0 && (
                            <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950 p-4">
                                {(filterResults.slice(0, 10) as Array<{ _id?: string; userId?: { _id?: string; nickname?: string } }>).map((p, i) => (
                                    <Link
                                        key={p._id ?? i}
                                        to={`/scouter/players/${(p.userId as { _id?: string })?._id ?? p._id}`}
                                        className="block text-primary hover:underline text-sm"
                                    >
                                        {(p.userId as { nickname?: string })?.nickname ?? 'Player'} →
                                    </Link>
                                ))}
                                {filterResults.length > 10 && (
                                    <p className="text-xs text-zinc-500">… and {filterResults.length - 10} more</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Quick actions */}
            <div className="grid gap-4 md:grid-cols-2">
                <Link
                    to="/scouter/players"
                    className="group flex items-center gap-4 rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-md shadow-black/25 transition-all hover:border-primary/50 hover:bg-zinc-800"
                >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-zinc-600 bg-zinc-950 transition-transform group-hover:scale-105">
                        <Users className="h-7 w-7 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-white">Browse players</h3>
                        <p className="text-sm text-zinc-500">View rankings, open profiles, and create reports.</p>
                    </div>
                    <ArrowRight className="h-5 w-5 shrink-0 text-scout-cyan opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
                <Link
                    to="/scouter/reports"
                    className="group flex items-center gap-4 rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-md shadow-black/25 transition-all hover:border-scout-violet/50 hover:bg-zinc-800"
                >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-zinc-600 bg-zinc-950 transition-transform group-hover:scale-105">
                        <FileText className="h-7 w-7 text-scout-violet" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-white">Reports</h3>
                        <p className="text-sm text-zinc-500">View and create player evaluations.</p>
                    </div>
                    <ArrowRight className="h-5 w-5 shrink-0 text-scout-violet opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Recent players */}
                <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#141820] shadow-xl shadow-black/40">
                    <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6 py-4">
                        <h2 className="text-sm font-black uppercase tracking-widest text-scout-cyan">Recent players</h2>
                        <Link to="/scouter/players" className="text-xs font-bold text-primary hover:underline">
                            View all →
                        </Link>
                    </div>
                    <div className="divide-y divide-zinc-800">
                        {loading ? (
                            <div className="px-6 py-12 text-center text-sm text-zinc-500">Loading…</div>
                        ) : recentPlayers.length === 0 ? (
                            <div className="px-6 py-12 text-center text-sm text-zinc-500">No players in pool yet.</div>
                        ) : (
                            recentPlayers.map((p) => {
                                const userId = typeof p.userId === 'object' && p.userId !== null && '_id' in p.userId ? (p.userId as { _id: string })._id : (p as { _id?: string })._id;
                                const name = typeof p.userId === 'object' && p.userId !== null && 'nickname' in p.userId ? (p.userId as { nickname: string }).nickname : (p as { nickname?: string }).nickname ?? 'Player';
                                return (
                                    <Link
                                        key={userId ?? p._id}
                                        to={`/scouter/players/${userId ?? p._id}`}
                                        className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-zinc-900/80"
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-600 bg-zinc-950 text-sm font-bold text-primary">
                                            {name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-semibold text-white">{name}</p>
                                            <p className="text-xs text-zinc-500">Elo: {p.elo ?? '—'} · Rank: {p.rank ?? '—'}</p>
                                        </div>
                                        <ArrowRight size={16} className="shrink-0 text-primary/70" />
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Recent reports */}
                <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#141820] shadow-xl shadow-black/40">
                    <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6 py-4">
                        <h2 className="text-sm font-black uppercase tracking-widest text-scout-violet">Recent reports</h2>
                        <Link to="/scouter/reports" className="text-xs font-bold text-primary hover:underline">
                            View all →
                        </Link>
                    </div>
                    <div className="divide-y divide-zinc-800">
                        {recentReports.length === 0 ? (
                            <div className="px-6 py-12 text-center text-sm text-zinc-500">
                                No reports yet. Create one from a player profile.
                            </div>
                        ) : (
                            recentReports.map((r) => (
                                <Link
                                    key={r._id}
                                    to={`/scouter/players/${playerIdFromReport(r)}`}
                                    className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-zinc-900/80"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-600 bg-zinc-950 text-sm font-bold text-scout-violet">
                                        {playerName(r).charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold text-white">{playerName(r)}</p>
                                        <p className="text-xs text-zinc-500">
                                            Rating {r.rating}/100 {r.recommendedRole && `· ${r.recommendedRole}`}
                                        </p>
                                    </div>
                                    <ArrowRight size={16} className="shrink-0 text-primary/70" />
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
