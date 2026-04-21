import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Plus, Star, Calendar, ArrowRight, Search, User } from 'lucide-react';
import { scoutingService, type ScoutingReport } from '../../services/scoutingService';
import { scouterService, type ScoutedPlayerProfile } from '../../services/scouterService';
import { Modal, Button, Input } from '../../components/ui/core';

interface PlayerOption {
    id: string;
    nickname: string;
    email?: string;
    region?: string;
}

function toPlayerOption(p: ScoutedPlayerProfile, index: number): PlayerOption {
    const userId = typeof p.userId === 'object' && p.userId !== null && '_id' in p.userId
        ? (p.userId as { _id: string })._id
        : (p as { _id?: string })._id ?? `player-${index}`;
    const nickname = typeof p.userId === 'object' && p.userId !== null && 'nickname' in p.userId
        ? (p.userId as { nickname?: string }).nickname ?? 'Player'
        : (p as { nickname?: string }).nickname ?? 'Player';
    const email = typeof p.userId === 'object' && p.userId !== null && 'email' in p.userId
        ? (p.userId as { email?: string }).email
        : undefined;
    return { id: userId, nickname, email, region: p.region };
}

const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function collectIdsFromPlayerRef(v: unknown, out: string[], depth: number): void {
    if (depth > 8 || v == null) return;
    if (typeof v === 'string') {
        const t = v.trim();
        if (t) out.push(t);
        return;
    }
    if (typeof v !== 'object') return;
    const o = v as Record<string, unknown>;
    if (typeof o.$oid === 'string' && o.$oid.trim()) out.push(o.$oid.trim());
    for (const key of ['_id', 'id']) {
        if (o[key] != null) collectIdsFromPlayerRef(o[key], out, depth + 1);
    }
    for (const key of ['userId', 'user']) {
        if (o[key] != null) collectIdsFromPlayerRef(o[key], out, depth + 1);
    }
}

/** Ids that might identify the player on a report (user id, profile id, BSON `$oid`, populated refs). */
function reportPlayerIdCandidates(r: ScoutingReport): string[] {
    const out: string[] = [];
    collectIdsFromPlayerRef(r.playerId, out, 0);
    return [...new Set(out)];
}

function reportMatchesFilterSet(r: ScoutingReport, acceptedIds: Set<string>): boolean {
    if (acceptedIds.size === 0) return true;
    return reportPlayerIdCandidates(r).some((id) => acceptedIds.has(id));
}

function reportInPlayerView(
    r: ScoutingReport,
    playerFilterId: string,
    acceptedIds: Set<string>,
    apiMatchedReportIds: Set<string>
): boolean {
    if (!playerFilterId) return true;
    return reportMatchesFilterSet(r, acceptedIds) || apiMatchedReportIds.has(r._id);
}

/** `/scouter/players/:playerUserId` expects the account user id when the payload includes it. */
function reportPlayerUserRouteId(r: ScoutingReport): string {
    const p = r.playerId;
    if (typeof p === 'string' && p.trim()) return p.trim();
    if (p && typeof p === 'object') {
        const o = p as Record<string, unknown>;
        const uid = o.userId ?? o.user;
        if (typeof uid === 'string' && uid.trim()) return uid.trim();
        if (uid && typeof uid === 'object') {
            const u = uid as Record<string, unknown>;
            if (u._id != null) return String(u._id);
            if (u.id != null) return String(u.id);
        }
        if (o._id != null) return String(o._id);
    }
    return '';
}

function getScouterId(): string | null {
    try {
        const raw = localStorage.getItem('user');
        const user = raw ? JSON.parse(raw) : null;
        return user?.id ?? user?._id ?? null;
    } catch {
        return null;
    }
}

export default function ScouterReports() {
    const location = useLocation();
    const scouterId = getScouterId();
    const [reports, setReports] = useState<ScoutingReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [players, setPlayers] = useState<PlayerOption[]>([]);
    const [playersLoading, setPlayersLoading] = useState(false);
    const [playerSearch, setPlayerSearch] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState<PlayerOption | null>(null);
    const [playerDropdownOpen, setPlayerDropdownOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<ScoutingReport | null>(null);
    /** Profile `_id` / nested user ids for `?playerId=` (user id) so reports keyed by profile id still match. */
    const [resolvedFilterExtraIds, setResolvedFilterExtraIds] = useState<string[]>([]);
    /** Report `_id`s returned by `GET …/reports/player/:id` for query id / profile id (authoritative when embed shape is odd). */
    const [matchedReportIdsFromPlayerApi, setMatchedReportIdsFromPlayerApi] = useState<string[]>([]);
    const [form, setForm] = useState({
        playerId: '',
        rating: 85,
        strengths: '',
        weaknesses: '',
        notes: '',
        recommendedRole: '',
    });

    const loadReports = () => {
        if (!scouterId) return;
        setLoading(true);
        scoutingService
            .listReportsByScouter(scouterId)
            .then(setReports)
            .catch(() => setReports([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadReports();
    }, [scouterId]);

    // Fetch players by name when modal opens (for dropdown)
    useEffect(() => {
        if (!modalOpen) return;
        setPlayerSearch('');
        setSelectedPlayer(null);
        setPlayerDropdownOpen(false);
        setPlayersLoading(true);
        scouterService
            .getPlayers()
            .then((list) => setPlayers(list.map(toPlayerOption)))
            .catch(() => setPlayers([]))
            .finally(() => setPlayersLoading(false));
    }, [modalOpen]);

    const filteredPlayers = playerSearch.trim()
        ? players.filter(
            (p) =>
                p.nickname.toLowerCase().includes(playerSearch.toLowerCase()) ||
                (p.email?.toLowerCase().includes(playerSearch.toLowerCase()))
        )
        : players;

    const handleSelectPlayer = (p: PlayerOption) => {
        setSelectedPlayer(p);
        setForm((f) => ({ ...f, playerId: p.id }));
        setPlayerSearch(p.nickname);
        setPlayerDropdownOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!scouterId || !form.playerId.trim()) return;
        setSubmitting(true);
        scoutingService
            .createReport({
                scouterId,
                playerId: form.playerId.trim(),
                rating: form.rating,
                strengths: form.strengths || undefined,
                weaknesses: form.weaknesses || undefined,
                notes: form.notes || undefined,
                recommendedRole: form.recommendedRole || undefined,
            })
            .then(() => {
                setModalOpen(false);
                setForm({ playerId: '', rating: 85, strengths: '', weaknesses: '', notes: '', recommendedRole: '' });
                setSelectedPlayer(null);
                setPlayerSearch('');
                loadReports();
            })
            .catch(() => {})
            .finally(() => setSubmitting(false));
    };

    const playerName = (r: ScoutingReport) => {
        const p = r.playerId;
        if (typeof p === 'object' && p && 'nickname' in p) return (p as { nickname?: string }).nickname ?? 'Player';
        return 'Player';
    };

    const query = new URLSearchParams(location.search);
    const playerFilterId = query.get('playerId')?.trim() ?? '';

    useEffect(() => {
        if (!playerFilterId) {
            setResolvedFilterExtraIds([]);
            setMatchedReportIdsFromPlayerApi([]);
            return;
        }
        setResolvedFilterExtraIds([]);
        setMatchedReportIdsFromPlayerApi([]);
        let cancelled = false;

        const mergeReportIds = (into: Set<string>, list: ScoutingReport[]) => {
            for (const r of list) {
                if (r?._id) into.add(r._id);
            }
        };

        const tryListByPlayer = async (id: string, into: Set<string>) => {
            if (!id.trim()) return;
            try {
                const list = await scoutingService.listReportsByPlayer(id.trim());
                if (!cancelled) mergeReportIds(into, list);
            } catch {
                /* ignore */
            }
        };

        (async () => {
            const reportIds = new Set<string>();
            await tryListByPlayer(playerFilterId, reportIds);

            try {
                const profile = await scouterService.getPlayerProfile(playerFilterId);
                if (cancelled) return;

                const extra: string[] = [];
                if (profile?._id) extra.push(String(profile._id));
                const u = profile?.userId;
                if (typeof u === 'string' && u.trim()) extra.push(u.trim());
                else if (u && typeof u === 'object' && u !== null && '_id' in u) {
                    const id = (u as { _id?: string })._id;
                    if (id) extra.push(String(id));
                }
                const uniqueExtras = [...new Set(extra)];
                setResolvedFilterExtraIds(uniqueExtras);

                for (const alt of uniqueExtras) {
                    if (alt && alt !== playerFilterId) await tryListByPlayer(alt, reportIds);
                }
            } catch {
                if (!cancelled) setResolvedFilterExtraIds([]);
            }

            if (!cancelled) setMatchedReportIdsFromPlayerApi([...reportIds]);
        })();

        return () => {
            cancelled = true;
        };
    }, [playerFilterId]);

    const playerFilterIdSet = useMemo(() => {
        const s = new Set<string>();
        if (!playerFilterId) return s;
        s.add(playerFilterId);
        for (const x of resolvedFilterExtraIds) {
            if (x) s.add(x);
        }
        return s;
    }, [playerFilterId, resolvedFilterExtraIds]);

    const matchedFromApiSet = useMemo(
        () => new Set(matchedReportIdsFromPlayerApi),
        [matchedReportIdsFromPlayerApi]
    );

    const visibleReports = playerFilterId
        ? reports.filter((r) => reportInPlayerView(r, playerFilterId, playerFilterIdSet, matchedFromApiSet))
        : reports;

    useEffect(() => {
        if (!playerFilterId || reports.length === 0) return;
        const first = reports.find((r) =>
            reportInPlayerView(r, playerFilterId, playerFilterIdSet, matchedFromApiSet)
        );
        if (first) setSelectedReport(first);
    }, [playerFilterId, reports, playerFilterIdSet, matchedFromApiSet]);

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-primary/80 text-xs font-bold uppercase tracking-widest mb-2">
                        <FileText size={14} /> Reports
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">My reports</h1>
                    <p className="text-white/50 text-sm mt-1">
                        All evaluations you have written. Create new reports from a player profile.
                    </p>
                    {playerFilterId && (
                        <p className="text-xs text-primary/80 mt-2">
                            Filtered by selected player.
                            {' '}
                            <Link to="/scouter/reports" className="underline hover:text-primary">
                                Show all reports
                            </Link>
                        </p>
                    )}
                </div>
                <Button
                    onClick={() => setModalOpen(true)}
                    className="bg-primary text-black hover:bg-primary/90 font-bold shrink-0"
                >
                    <Plus size={18} className="mr-2" /> New report
                </Button>
            </div>

            <div className="rounded-2xl border border-primary/10 bg-white/[0.02] overflow-hidden">
                {loading ? (
                    <div className="py-24 text-center text-primary/70">Loading reports…</div>
                ) : visibleReports.length === 0 ? (
                    <div className="py-24 text-center">
                        <FileText className="w-14 h-14 text-primary/40 mx-auto mb-4" />
                        <p className="text-white/80 font-semibold">
                            {playerFilterId ? 'No report found for this player' : 'No reports yet'}
                        </p>
                        <p className="text-white/40 text-sm mt-1 max-w-sm mx-auto">
                            Open a player profile and click &quot;New report&quot; to add an evaluation (rating, strengths, weaknesses, recommended role).
                        </p>
                        <Link
                            to="/scouter/players"
                            className="mt-4 inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline"
                        >
                            Browse players <ArrowRight size={14} />
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {visibleReports.map((r) => (
                            <div
                                key={r._id}
                                className="flex flex-wrap items-center gap-4 px-6 py-4 hover:bg-white/[0.02]"
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                                    <Star className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white">{playerName(r)}</p>
                                    <p className="text-sm text-white/50">
                                        Rating: <span className="text-primary font-semibold">{r.rating}</span>/100
                                        {r.recommendedRole && ` · ${r.recommendedRole}`}
                                    </p>
                                    {r.notes && (
                                        <p className="text-xs text-white/40 mt-1 line-clamp-2">{r.notes}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-white/50">
                                    <Calendar size={14} /> {fmtDate(r.createdAt)}
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedReport(r)}
                                        className="inline-flex items-center gap-1 text-white/80 font-bold text-sm hover:text-white hover:underline"
                                    >
                                        View details
                                    </button>
                                    <Link
                                        to={`/scouter/players/${reportPlayerUserRouteId(r)}#reports`}
                                        className="inline-flex items-center gap-1 text-primary font-bold text-sm hover:underline"
                                    >
                                        View profile <ArrowRight size={14} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Modal
                isOpen={Boolean(selectedReport)}
                onClose={() => setSelectedReport(null)}
                title="Report details"
            >
                {selectedReport && (
                    <div className="px-6 pb-6 space-y-4">
                        <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
                            <p className="text-xs text-white/60 uppercase tracking-widest">Player</p>
                            <p className="text-lg font-bold text-white">{playerName(selectedReport)}</p>
                            <p className="text-sm text-white/60 mt-1">
                                Rating: <span className="text-primary font-bold">{selectedReport.rating}</span>/100
                                {selectedReport.recommendedRole ? ` · Role: ${selectedReport.recommendedRole}` : ''}
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3">
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Strengths</p>
                                <p className="text-sm text-white/80">{selectedReport.strengths || '—'}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Weaknesses</p>
                                <p className="text-sm text-white/80">{selectedReport.weaknesses || '—'}</p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Notes</p>
                            <p className="text-sm text-white/80 whitespace-pre-wrap">{selectedReport.notes || '—'}</p>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <p className="text-xs text-white/50">Created: {fmtDate(selectedReport.createdAt)}</p>
                            <Link
                                to={`/scouter/players/${reportPlayerUserRouteId(selectedReport)}#reports`}
                                className="text-sm font-bold text-primary hover:underline"
                                onClick={() => setSelectedReport(null)}
                            >
                                Open player profile
                            </Link>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New report">
                <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6">
                    <p className="text-white/60 text-sm">
                        Select a player by name to create an evaluation report.
                    </p>
                    <div className="relative">
                        <label className="block text-sm font-medium text-white/80 mb-1">Player</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                            <input
                                type="text"
                                value={playerSearch}
                                onChange={(e) => {
                                    setPlayerSearch(e.target.value);
                                    setPlayerDropdownOpen(true);
                                    if (!e.target.value) setSelectedPlayer(null);
                                }}
                                onFocus={() => setPlayerDropdownOpen(true)}
                                placeholder="Search by player name or email…"
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-primary/20 text-white placeholder-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none"
                            />
                            {playersLoading && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">Loading…</span>
                            )}
                        </div>
                        {playerDropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-[1]"
                                    aria-hidden
                                    onClick={() => setPlayerDropdownOpen(false)}
                                />
                                <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-xl border border-primary/20 bg-[#0d0e12] shadow-xl max-h-56 overflow-y-auto">
                                    {filteredPlayers.length === 0 ? (
                                        <div className="px-4 py-6 text-center text-white/40 text-sm">
                                            {playersLoading ? 'Loading players…' : 'No players found. Try another name or ensure the backend has players.'}
                                        </div>
                                    ) : (
                                        filteredPlayers.map((p) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => handleSelectPlayer(p)}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/10 transition-colors border-b border-white/5 last:border-0"
                                            >
                                                <div className="w-9 h-9 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                                                    <User className="w-4 h-4 text-primary" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold text-white truncate">{p.nickname}</p>
                                                    {p.email && <p className="text-xs text-white/40 truncate">{p.email}</p>}
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                        {selectedPlayer && (
                            <p className="mt-1.5 text-xs text-primary/80">
                                Selected: <span className="font-semibold text-white">{selectedPlayer.nickname}</span>
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-1">Rating (0–100)</label>
                        <input
                            type="number"
                            min={0}
                            max={100}
                            value={form.rating}
                            onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) || 0 }))}
                            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-primary/20 text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-1">Strengths</label>
                        <Input value={form.strengths} onChange={(e) => setForm((f) => ({ ...f, strengths: e.target.value }))} placeholder="Strong aim, good positioning" className="rounded-xl bg-white/5 border border-primary/20" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-1">Weaknesses</label>
                        <Input value={form.weaknesses} onChange={(e) => setForm((f) => ({ ...f, weaknesses: e.target.value }))} placeholder="Needs work on communication" className="rounded-xl bg-white/5 border border-primary/20" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-1">Recommended role</label>
                        <Input value={form.recommendedRole} onChange={(e) => setForm((f) => ({ ...f, recommendedRole: e.target.value }))} placeholder="e.g. Duelist, Support, Controller" className="rounded-xl bg-white/5 border border-primary/20" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-1">Notes</label>
                        <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Promising for tier 2" className="rounded-xl bg-white/5 border border-primary/20" />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting || !form.playerId.trim()} className="bg-primary text-black hover:bg-primary/90">
                            {submitting ? 'Saving…' : 'Create report'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
