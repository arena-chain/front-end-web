import { useState, useEffect, useCallback } from 'react';
import {
    ClockAlert, Plus, X, Check, AlertCircle, RefreshCw,
    CheckCircle2, XCircle, Clock, Ban,
} from 'lucide-react';
import { leagueService, type League } from '../../../services/leagueService';
import { seasonService, type Season } from '../../../services/seasonService';
import { checkInService, type CheckIn, type CheckInStatus } from '../../../services/checkInService';

interface Toast { msg: string; ok: boolean }

const STATUS_META: Record<CheckInStatus, { label: string; cls: string; icon: React.ReactNode }> = {
    OPEN:        { label: 'Open',        cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30',      icon: <Clock className="w-3.5 h-3.5" /> },
    BOTH_READY:  { label: 'Both Ready',  cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    TEAM1_MISSED:{ label: 'T1 Missed',   cls: 'bg-red-500/20 text-red-300 border-red-500/30',         icon: <XCircle className="w-3.5 h-3.5" /> },
    TEAM2_MISSED:{ label: 'T2 Missed',   cls: 'bg-orange-500/20 text-orange-300 border-orange-500/30', icon: <XCircle className="w-3.5 h-3.5" /> },
    BOTH_MISSED: { label: 'Both Missed', cls: 'bg-red-700/20 text-red-300 border-red-600/30',         icon: <XCircle className="w-3.5 h-3.5" /> },
    CANCELLED:   { label: 'Cancelled',   cls: 'bg-slate-700/60 text-slate-400 border-slate-600/40',   icon: <Ban className="w-3.5 h-3.5" /> },
};

export default function CheckInsPage() {
    const [leagues, setLeagues]       = useState<League[]>([]);
    const [seasons, setSeasons]       = useState<Season[]>([]);
    const [checkIns, setCheckIns]     = useState<CheckIn[]>([]);
    const [selLeague, setSelLeague]   = useState('');
    const [selSeason, setSelSeason]   = useState('');
    const [loading, setLoading]       = useState(false);
    const [toast, setToast]           = useState<Toast | null>(null);
    const [showForm, setShowForm]     = useState(false);
    const [form, setForm]             = useState({ matchId: '', deadline: '' });
    const [submitting, setSubmitting] = useState(false);
    const [filterStatus, setFilterStatus] = useState<CheckInStatus | 'ALL'>('ALL');
    const [processing, setProcessing] = useState(false);

    const notify = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => { leagueService.getAllLeagues().then(setLeagues).catch(() => {}); }, []);

    useEffect(() => {
        if (!selLeague) { setSeasons([]); setSelSeason(''); return; }
        seasonService.getByLeague(selLeague).then(setSeasons).catch(() => {});
        setSelSeason('');
    }, [selLeague]);

    const load = useCallback(async () => {
        if (!selSeason) { setCheckIns([]); return; }
        try {
            setLoading(true);
            setCheckIns(await checkInService.getBySeason(selSeason));
        } catch { notify('Failed to load check-ins', false); }
        finally   { setLoading(false); }
    }, [selSeason]);

    useEffect(() => { load(); }, [load]);

    const handleCreate = async () => {
        if (!form.matchId.trim() || !form.deadline) return notify('Match ID and deadline required', false);
        try {
            setSubmitting(true);
            await checkInService.create({ matchId: form.matchId, seasonId: selSeason, deadline: form.deadline });
            notify('Check-in window created');
            setShowForm(false);
            setForm({ matchId: '', deadline: '' });
            load();
        } catch { notify('Create failed', false); }
        finally  { setSubmitting(false); }
    };

    const handleCancel = async (ci: CheckIn) => {
        try { await checkInService.cancel(ci._id); notify('Cancelled'); load(); }
        catch { notify('Failed', false); }
    };

    const handleDelete = async (ci: CheckIn) => {
        if (!confirm('Delete this check-in?')) return;
        try { await checkInService.delete(ci._id); notify('Deleted'); load(); }
        catch { notify('Failed', false); }
    };

    const handleProcessExpired = async () => {
        try {
            setProcessing(true);
            const r = await checkInService.processExpired(selSeason);
            notify(`Processed ${r.processed} expired check-in(s)`);
            load();
        } catch { notify('Process failed', false); }
        finally  { setProcessing(false); }
    };

    const visible = checkIns.filter(ci => filterStatus === 'ALL' || ci.status === filterStatus);

    const matchId = (ci: CheckIn) =>
        typeof ci.matchId === 'string' ? ci.matchId.slice(-8) : (ci.matchId as { _id: string })._id.slice(-8);

    const fmt = (d: string) => new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

    const isExpired = (ci: CheckIn) => new Date(ci.deadline) < new Date() && ci.status === 'OPEN';

    return (
        <div className="space-y-6 p-6">
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-sm font-medium border
                    ${toast.ok ? 'bg-emerald-900/90 text-emerald-200 border-emerald-500/40' : 'bg-red-900/90 text-red-200 border-red-500/40'}`}>
                    {toast.ok ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                        <ClockAlert className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Check-Ins</h1>
                        <p className="text-sm text-slate-400">Pre-match team check-in management</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {selSeason && (
                        <button onClick={handleProcessExpired} disabled={processing}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors disabled:opacity-50">
                            <RefreshCw className={`w-4 h-4 ${processing ? 'animate-spin' : ''}`} />
                            Process Expired
                        </button>
                    )}
                    <button onClick={() => setShowForm(true)} disabled={!selSeason}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-semibold disabled:opacity-40 transition-colors">
                        <Plus className="w-4 h-4" /> New Check-In
                    </button>
                </div>
            </div>

            {/* Season selector */}
            <div className="grid grid-cols-2 gap-3">
                <select value={selLeague} onChange={e => setSelLeague(e.target.value)} className="input-field">
                    <option value="">— Select League —</option>
                    {leagues.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                </select>
                <select value={selSeason} onChange={e => setSelSeason(e.target.value)} className="input-field" disabled={!selLeague}>
                    <option value="">— Select Season —</option>
                    {seasons.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
            </div>

            {/* Status filter */}
            {selSeason && (
                <div className="flex flex-wrap gap-2">
                    {(['ALL', 'OPEN', 'BOTH_READY', 'TEAM1_MISSED', 'TEAM2_MISSED', 'CANCELLED'] as const).map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border
                                ${filterStatus === s
                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'}`}>
                            {s === 'ALL' ? 'All' : STATUS_META[s]?.label ?? s}
                        </button>
                    ))}
                </div>
            )}

            {/* Stats */}
            {selSeason && checkIns.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {(Object.keys(STATUS_META) as CheckInStatus[]).map(s => {
                        const cnt = checkIns.filter(ci => ci.status === s).length;
                        return (
                            <div key={s} className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 text-center">
                                <p className="text-xs text-slate-500 mb-1">{STATUS_META[s].label}</p>
                                <p className="text-xl font-bold text-white">{cnt}</p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Content */}
            {!selSeason ? (
                <div className="text-center py-20 text-slate-500">
                    <ClockAlert className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Select a season to view check-ins</p>
                </div>
            ) : loading ? (
                <div className="text-slate-500 text-sm text-center py-16">Loading…</div>
            ) : visible.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                    <ClockAlert className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No check-ins found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {visible.map(ci => {
                        const meta    = STATUS_META[ci.status];
                        const expired = isExpired(ci);
                        return (
                            <div key={ci._id}
                                className={`bg-slate-800/60 border rounded-xl px-5 py-4 flex items-center justify-between gap-4 transition-all
                                    ${expired ? 'border-red-500/30' : 'border-slate-700/40'}`}>
                                <div className="space-y-1 flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-white text-sm font-medium font-mono">Match …{matchId(ci)}</span>
                                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${meta.cls}`}>
                                            {meta.icon}{meta.label}
                                        </span>
                                        {expired && (
                                            <span className="text-xs bg-red-900/40 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                                                Deadline passed
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                                        <span>Deadline: {fmt(ci.deadline)}</span>
                                        <span className={ci.team1CheckedIn ? 'text-emerald-400' : 'text-red-400'}>
                                            Team 1: {ci.team1CheckedIn ? '✓' : '✗'}
                                            {ci.team1CheckedInAt && ` ${fmt(ci.team1CheckedInAt)}`}
                                        </span>
                                        <span className={ci.team2CheckedIn ? 'text-emerald-400' : 'text-red-400'}>
                                            Team 2: {ci.team2CheckedIn ? '✓' : '✗'}
                                            {ci.team2CheckedInAt && ` ${fmt(ci.team2CheckedInAt)}`}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {ci.status === 'OPEN' && (
                                        <button onClick={() => handleCancel(ci)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs">
                                            <Ban className="w-3.5 h-3.5" /> Cancel
                                        </button>
                                    )}
                                    <button onClick={() => handleDelete(ci)}
                                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create modal */}
            {showForm && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-white font-semibold">Create Check-In Window</h2>
                            <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <div>
                            <label className="label">Match ID *</label>
                            <input value={form.matchId} onChange={e => setForm(f => ({ ...f, matchId: e.target.value }))}
                                className="input-field" placeholder="Match ID…" />
                        </div>
                        <div>
                            <label className="label">Deadline *</label>
                            <input type="datetime-local" value={form.deadline}
                                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                                className="input-field" />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowForm(false)}
                                className="flex-1 py-2 rounded-lg border border-slate-700 text-slate-400 text-sm">Cancel</button>
                            <button onClick={handleCreate} disabled={submitting}
                                className="flex-1 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-semibold disabled:opacity-50">
                                {submitting ? 'Creating…' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
