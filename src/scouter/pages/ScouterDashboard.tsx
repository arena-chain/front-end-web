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
        }).catch(() => {});
        scoutingService.listProspects().then((p) => setProspectsCount(p.length)).catch(() => {});
        scoutingService.listRecommendationsByScouter(scouterId).then((r) => setRecommendationsCount(r.length)).catch(() => {});
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
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-scout-violet-deep/15 via-black/40 to-scout-cyan/10 p-6 sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-scout-cyan/10 blur-3xl" />
                <div className="relative">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest mb-2">
                        <span className="flex items-center gap-2 text-primary">
                            <ScanLine size={14} /> Scout Hub
                        </span>
                        <span className="text-white/25">·</span>
                        <span className="text-scout-cyan/90">Live pool</span>
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Dashboard</h1>
                    <p className="text-white/55 text-sm mt-2 max-w-xl">
                        Overview, epic highlights, filter players, and quick access to reports and recommendations.
                    </p>
                </div>
            </div>

            {/* Public highlight clips */}
            <section className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-scout-violet-deep/[0.12] to-black/20 overflow-hidden shadow-[0_0_40px_rgba(124,58,237,0.08)]">
                <div className="px-5 sm:px-6 py-4 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-scout-amber/25 to-primary/20 border border-scout-amber/30 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-white">Highlights</h2>
                            <p className="text-xs text-white/45 mt-0.5">
                                Top clips by reactions (likes, comments, saves) — scroll sideways.
                            </p>
                        </div>
                    </div>
                    <Link
                        to="/scouter/highlights"
                        className="text-xs font-bold text-primary hover:text-primary-light shrink-0 border border-primary/25 rounded-lg px-3 py-1.5 hover:bg-primary/10 transition-colors"
                    >
                        Full list →
                    </Link>
                </div>
                <div className="p-5 sm:p-6">
                    {epicMediaLoading ? (
                        <div className="flex gap-6 overflow-hidden sm:gap-7">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="shrink-0 w-[200px] sm:w-[220px] aspect-[9/16] rounded-2xl bg-white/5 animate-pulse border border-white/5"
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
                                    className="group/card shrink-0 w-[200px] sm:w-[220px] snap-start text-left rounded-2xl border border-white/10 bg-black/50 overflow-hidden hover:border-primary/45 hover:shadow-[0_0_28px_rgba(0,255,135,0.14)] transition-all duration-300"
                                >
                                    <div className="relative aspect-[9/16] w-full bg-black">
                                        {h.clipUrl ? (
                                            <video
                                                src={resolveBackendAssetUrl(h.clipUrl)}
                                                className="h-full w-full object-cover opacity-92 transition-opacity group-hover/card:opacity-100"
                                                muted
                                                playsInline
                                                preload="metadata"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-scout-violet-deep/40 to-black">
                                                <Sparkles className="h-10 w-10 text-primary/35" />
                                            </div>
                                        )}
                                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover/card:opacity-100">
                                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-black shadow-lg shadow-primary/40">
                                                <Play size={22} className="ml-0.5" fill="currentColor" />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-2 p-3">
                                        <p className="line-clamp-2 text-xs font-bold leading-tight text-white">{h.title}</p>
                                        <p className="line-clamp-1 text-[9px] font-bold uppercase tracking-wider text-white/35">
                                            {highlightCreatorLabel(h.creator)}
                                        </p>
                                        <div className="flex flex-wrap items-center justify-end gap-1">
                                            <MediaEngagementStrip kind="highlight" id={h._id} />
                                        </div>
                                        {h.description?.trim() ? (
                                            <p className="line-clamp-3 border-t border-white/[0.06] pt-2 text-left text-[10px] leading-snug text-white/50">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                    to="/scouter/players"
                    className="bg-white/5 border border-primary/20 rounded-xl p-5 hover:border-primary/40 hover:bg-primary/[0.06] transition-all group"
                >
                    <Users className="w-8 h-8 text-primary mb-3 group-hover:scale-105 transition-transform" />
                    <p className="text-2xl font-black text-white">{loading ? '—' : players.length}</p>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/50">Players in pool</p>
                </Link>
                <Link
                    to="/scouter/reports"
                    className="bg-white/5 border border-scout-cyan/25 rounded-xl p-5 hover:border-scout-cyan/45 hover:bg-scout-cyan/[0.06] transition-all group"
                >
                    <FileText className="w-8 h-8 text-scout-cyan mb-3 group-hover:scale-105 transition-transform" />
                    <p className="text-2xl font-black text-white">{reportsCount}</p>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/50">My reports</p>
                </Link>
                <div className="bg-white/5 border border-scout-violet/25 rounded-xl p-5 hover:border-scout-violet/40 hover:bg-scout-violet/[0.05] transition-all">
                    <Star className="w-8 h-8 text-scout-violet mb-3" />
                    <p className="text-2xl font-black text-white">{prospectsCount}</p>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/50">Prospects</p>
                </div>
                <Link
                    to="/scouter/recommendations"
                    className="bg-white/5 border border-scout-amber/30 rounded-xl p-5 hover:border-scout-amber/50 hover:bg-scout-amber/[0.06] transition-all group"
                >
                    <Send className="w-8 h-8 text-scout-amber mb-3 group-hover:scale-105 transition-transform" />
                    <p className="text-2xl font-black text-white">{recommendationsCount}</p>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/50">Recommendations</p>
                </Link>
            </div>

            {/* Filter players */}
            <div className="rounded-2xl border border-scout-cyan/15 bg-gradient-to-br from-white/[0.03] to-scout-cyan/[0.02] overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-2">
                    <Filter className="w-5 h-5 text-scout-cyan" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-white">
                        Filter players
                        <span className="text-primary/90 ml-2">·</span>
                        <span className="text-primary/80"> scout tools</span>
                    </h2>
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
                    className="group flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-primary/22 via-scout-cyan/8 to-transparent border border-primary/25 hover:border-primary/45 transition-all shadow-[0_0_22px_rgba(0,255,0,0.07)]"
                >
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/25 to-scout-cyan/15 border border-primary/25 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Users className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">Browse players</h3>
                        <p className="text-sm text-white/50">View rankings, open profiles, and create reports.</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-scout-cyan opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                <Link
                    to="/scouter/reports"
                    className="group flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-scout-violet-deep/15 to-transparent border border-scout-violet/25 hover:border-scout-violet/45 hover:bg-scout-violet/[0.04] transition-all shadow-[0_0_20px_rgba(124,58,237,0.06)]"
                >
                    <div className="w-14 h-14 rounded-xl bg-scout-violet/15 border border-scout-violet/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <FileText className="w-7 h-7 text-scout-violet" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">Reports</h3>
                        <p className="text-sm text-white/50">View and create player evaluations.</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-scout-violet opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Recent players */}
                <div className="rounded-2xl border border-scout-cyan/15 bg-white/[0.03] overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                        <h2 className="text-sm font-black uppercase tracking-widest text-scout-cyan">Recent players</h2>
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
                <div className="rounded-2xl border border-scout-violet/15 bg-white/[0.03] overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                        <h2 className="text-sm font-black uppercase tracking-widest text-scout-violet">Recent reports</h2>
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
