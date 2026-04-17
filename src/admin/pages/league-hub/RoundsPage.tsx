import { useState, useEffect } from 'react';
import {
    Flag, Loader2, Search, AlertTriangle, CheckSquare,
    ChevronRight, RefreshCw, X, Calendar, Zap, Plus, Trash2,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { leagueService, type League } from '../../../services/leagueService';
import { seasonService, type Season } from '../../../services/seasonService';
import { roundService, type Round, type RoundStatus } from '../../../services/roundService';
import { Modal } from '../../../components/ui/core';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const apiErr = (e: unknown) => {
    const err = e as { response?: { data?: { message?: string } } };
    return err?.response?.data?.message || 'Something went wrong';
};
const fmt = (d: string) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const ROUND_STATUS: Record<RoundStatus, string> = {
    SCHEDULED: 'bg-gray-500/15 text-gray-300 border-gray-500/25',
    ONGOING:   'bg-green-500/15 text-green-400 border-green-500/25',
    COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
};

function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' }) {
    return (
        <div className={cn('fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl',
            type === 'ok' ? 'bg-green-500/20 border border-green-500/30 text-green-300' : 'bg-red-500/20 border border-red-500/30 text-red-300')}>
            {type === 'ok' ? <CheckSquare size={15} /> : <AlertTriangle size={15} />}
            {msg}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RoundsPage() {
    const [leagues, setLeagues]   = useState<League[]>([]);
    const [seasons, setSeasons]   = useState<Season[]>([]);
    const [rounds, setRounds]     = useState<Round[]>([]);
    const [selLeague, setSelLeague] = useState('');
    const [selSeason, setSelSeason] = useState('');
    const [search, setSearch]     = useState('');
    const [loading, setLoading]   = useState(true);
    const [genLoading, setGenLoading] = useState(false);
    const [showGen, setShowGen]   = useState(false);
    const [genForm, setGenForm]   = useState({ weekCount: 9, generateMatches: false });
    const [showCreate, setShowCreate] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [createForm, setCreateForm] = useState({
        roundNumber: 1,
        startDate: '',
        endDate: '',
    });
    const [toast, setToast]       = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

    const selectedSeason = seasons.find(s => s._id === selSeason);

    const notify = (msg: string, type: 'ok' | 'err') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadRounds = async (seasonId: string) => {
        const data = await roundService.getBySeason(seasonId);
        setRounds(data);
    };

    useEffect(() => {
        (async () => {
            try {
                const lgs = await leagueService.getAllLeagues();
                setLeagues(lgs);
                if (lgs.length) {
                    setSelLeague(lgs[0]._id);
                    const sns = await seasonService.getByLeague(lgs[0]._id);
                    setSeasons(sns);
                    if (sns.length) {
                        setSelSeason(sns[0]._id);
                        await loadRounds(sns[0]._id);
                    }
                }
            } catch (e) { notify(apiErr(e), 'err'); }
            finally { setLoading(false); }
        })();
    }, []);

    const onLeagueChange = async (lid: string) => {
        setSelLeague(lid);
        setSelSeason('');
        setRounds([]);
        try {
            const sns = await seasonService.getByLeague(lid);
            setSeasons(sns);
            if (sns.length) {
                setSelSeason(sns[0]._id);
                await loadRounds(sns[0]._id);
            }
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    const onSeasonChange = async (sid: string) => {
        setSelSeason(sid);
        setRounds([]);
        try {
            await loadRounds(sid);
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    /** POST /rounds/generate – backend uses season start/end dates; we only send seasonId and optional weekCount */
    const generate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selSeason) return notify('Select a season first', 'err');
        setGenLoading(true);
        try {
            await roundService.generate({
                seasonId: selSeason,
                weekCount: genForm.weekCount,
                generateMatches: genForm.generateMatches || undefined,
            });
            notify(`${genForm.weekCount} rounds generated!`, 'ok');
            setShowGen(false);
            await loadRounds(selSeason);
        } catch (e) { notify(apiErr(e), 'err'); }
        finally { setGenLoading(false); }
    };

    /** POST /rounds – create a single round (ISO 8601 dates) */
    const createRound = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selSeason) return notify('Select a season first', 'err');
        if (!createForm.startDate || !createForm.endDate) return notify('Start and end date required', 'err');
        setCreateLoading(true);
        try {
            const startDate = new Date(createForm.startDate).toISOString();
            const endDate = new Date(createForm.endDate).toISOString();
            await roundService.create({
                seasonId: selSeason,
                roundNumber: createForm.roundNumber,
                startDate,
                endDate,
            });
            notify('Round created.', 'ok');
            setShowCreate(false);
            setCreateForm({ roundNumber: (createForm.roundNumber || 1), startDate: '', endDate: '' });
            await loadRounds(selSeason);
        } catch (e) { notify(apiErr(e), 'err'); }
        finally { setCreateLoading(false); }
    };

    /** PATCH /rounds/:id – update status (or other fields) */
    const updateStatus = async (id: string, status: RoundStatus) => {
        try {
            await roundService.update(id, { status });
            notify('Round updated.', 'ok');
            if (selSeason) await loadRounds(selSeason);
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    /** DELETE /rounds/:id */
    const deleteRound = async (r: Round) => {
        if (!window.confirm(`Delete Round ${r.roundNumber}?`)) return;
        try {
            await roundService.delete(r._id);
            notify('Round deleted.', 'ok');
            if (selSeason) await loadRounds(selSeason);
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    const filtered = rounds.filter(r =>
        !search || `round ${r.roundNumber}`.includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {toast && <Toast {...toast} />}

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                        <span>League Hub</span>
                        <ChevronRight size={12} />
                        <span className="text-white font-semibold">Rounds</span>
                    </div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <Flag size={24} className="text-orange-400" />
                        Rounds Manager
                    </h1>
                    <p className="text-text-muted text-sm mt-1">
                        Generate rounds from season dates or create a single round. List uses <code className="text-white/70">GET /rounds?seasonId=...</code>.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowCreate(true)} disabled={!selSeason}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-black bg-white/90 hover:bg-white transition-all shrink-0 disabled:opacity-50">
                        <Plus size={16} />
                        Create Round
                    </button>
                    <button onClick={() => setShowGen(v => !v)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-black bg-green-400 hover:bg-green-300 transition-all shrink-0">
                        {showGen ? <X size={16} /> : <Zap size={16} />}
                        {showGen ? 'Cancel' : 'Generate Rounds'}
                    </button>
                </div>
            </div>

            {/* Generate form – backend uses season start/end; we only send seasonId + optional weekCount */}
            {showGen && (
                <form onSubmit={generate} className="bg-surface/60 border border-white/8 rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Auto-Generate Rounds</h3>
                    <p className="text-xs text-text-muted">
                        Start and end dates are taken from the selected season. Each round lasts 7 days.
                    </p>
                    <div className="grid md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Week count (optional)</label>
                            <input type="number" min={1} max={52} value={genForm.weekCount}
                                onChange={e => setGenForm(f => ({ ...f, weekCount: Number(e.target.value) || 1 }))}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none" />
                            <p className="text-[10px] text-text-muted mt-1">If omitted, backend derives from season duration.</p>
                        </div>
                    </div>
                    <label className="flex items-center gap-3 text-sm text-white cursor-pointer">
                        <input type="checkbox" checked={genForm.generateMatches}
                            onChange={e => setGenForm(f => ({ ...f, generateMatches: e.target.checked }))}
                            className="rounded border-white/20 bg-black/30 text-green-500 focus:ring-green-500/50" />
                        <span>Generate matches (round-robin; requires 2+ registered teams and season rules)</span>
                    </label>
                    <div className="flex items-center gap-3 text-xs text-text-muted bg-orange-500/8 border border-orange-500/20 rounded-xl p-3">
                        <Zap size={14} className="text-orange-400 shrink-0" />
                        Creates {genForm.weekCount} rounds (Round 1 to Round {genForm.weekCount}), one per week from the season start date.
                    </div>
                    <button type="submit" disabled={genLoading}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-black bg-green-400 hover:bg-green-300 disabled:opacity-50 transition-all">
                        {genLoading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                        Generate {genForm.weekCount} Rounds
                    </button>
                </form>
            )}

            {/* Create single round modal – POST /rounds */}
            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} size="md" title="Create Round">
                <form onSubmit={createRound} className="p-4 space-y-4">
                    <p className="text-xs text-text-muted">
                        Season: <strong className="text-white">{selectedSeason?.name ?? '—'}</strong>
                    </p>
                    <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Round number *</label>
                        <input type="number" min={1} value={createForm.roundNumber}
                            onChange={e => setCreateForm(f => ({ ...f, roundNumber: Number(e.target.value) || 1 }))}
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none" required />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Start date *</label>
                        <input type="date" value={createForm.startDate}
                            onChange={e => setCreateForm(f => ({ ...f, startDate: e.target.value }))}
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none" required />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">End date *</label>
                        <input type="date" value={createForm.endDate}
                            onChange={e => setCreateForm(f => ({ ...f, endDate: e.target.value }))}
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none" required />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setShowCreate(false)}
                            className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-white/10 hover:bg-white/15">
                            Cancel
                        </button>
                        <button type="submit" disabled={createLoading}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-black bg-green-400 hover:bg-green-300 disabled:opacity-50">
                            {createLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            Create
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <select value={selLeague} onChange={e => onLeagueChange(e.target.value)}
                    className="bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none">
                    {leagues.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                </select>
                <select value={selSeason} onChange={e => onSeasonChange(e.target.value)}
                    className="bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none">
                    {seasons.length === 0 && <option value="">No seasons</option>}
                    {seasons.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                <div className="relative flex-1 max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rounds…"
                        className="w-full pl-9 pr-3 py-2 bg-surface border border-white/10 rounded-xl text-sm text-white placeholder-text-muted focus:border-green-500/50 outline-none" />
                </div>
                <button onClick={() => selSeason && onSeasonChange(selSeason)}
                    className="p-2 rounded-xl border border-white/10 hover:bg-white/5 text-text-muted hover:text-white transition-all"
                    title="Refresh">
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Round list – GET /rounds?seasonId=... */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-green-400" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Flag size={40} className="text-text-muted mb-4 opacity-50" />
                    <p className="text-text-muted font-semibold">No rounds yet</p>
                    <p className="text-text-muted text-sm mt-1">Generate rounds or create a single round for the selected season.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filtered.map((r) => (
                        <div key={r._id} className="bg-surface/60 border border-white/8 rounded-2xl p-4 hover:border-white/15 transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-black text-sm">
                                        {r.roundNumber}
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-sm">Round {r.roundNumber}</p>
                                        <p className="text-text-muted text-[10px]">
                                            <Calendar size={9} className="inline mr-1" />
                                            {fmt(r.startDate)} → {fmt(r.endDate)}
                                        </p>
                                    </div>
                                </div>
                                <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border', ROUND_STATUS[r.status])}>
                                    {r.status}
                                </span>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {r.status !== 'COMPLETED' && (
                                    <>
                                        {r.status === 'SCHEDULED' && (
                                            <button onClick={() => updateStatus(r._id, 'ONGOING')}
                                                className="flex-1 min-w-0 text-xs font-bold py-1.5 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-all">
                                                Start Round
                                            </button>
                                        )}
                                        {r.status === 'ONGOING' && (
                                            <button onClick={() => updateStatus(r._id, 'COMPLETED')}
                                                className="flex-1 min-w-0 text-xs font-bold py-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-all">
                                                Complete
                                            </button>
                                        )}
                                    </>
                                )}
                                <button onClick={() => deleteRound(r)} title="Delete round"
                                    className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Stats row */}
            {rounds.length > 0 && (
                <div className="grid grid-cols-3 gap-3 pt-2">
                    {[
                        { label: 'Total', val: rounds.length, color: 'text-white' },
                        { label: 'Completed', val: rounds.filter(r => r.status === 'COMPLETED').length, color: 'text-emerald-400' },
                        { label: 'Scheduled', val: rounds.filter(r => r.status === 'SCHEDULED').length, color: 'text-orange-400' },
                    ].map(s => (
                        <div key={s.label} className="bg-surface/40 border border-white/8 rounded-xl p-3 text-center">
                            <p className={cn('text-2xl font-black', s.color)}>{s.val}</p>
                            <p className="text-text-muted text-[10px] uppercase tracking-widest">{s.label}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
