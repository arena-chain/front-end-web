import { useState, useEffect, useCallback } from 'react';
import {
    ShieldAlert, Eye, CheckCircle, XCircle, X, Check,
    AlertCircle, Search, ChevronDown,
} from 'lucide-react';
import { leagueService, type League } from '../../../services/leagueService';
import { seasonService, type Season } from '../../../services/seasonService';
import {
    matchDisputeService, type MatchDispute, type DisputeStatus,
} from '../../../services/matchDisputeService';

interface Toast { msg: string; ok: boolean }

const STATUS_META: Record<DisputeStatus, { label: string; cls: string }> = {
    PENDING: { label: 'Pending', cls: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
    UNDER_REVIEW: { label: 'Under Review', cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    ACCEPTED: { label: 'Accepted', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    REJECTED: { label: 'Rejected', cls: 'bg-red-500/20 text-red-300 border-red-500/30' },
};



export default function DisputesPage() {
    const [leagues, setLeagues] = useState<League[]>([]);
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [disputes, setDisputes] = useState<MatchDispute[]>([]);
    const [selLeague, setSelLeague] = useState('');
    const [selSeason, setSelSeason] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<Toast | null>(null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<DisputeStatus | 'ALL'>('ALL');
    const [resolving, setResolving] = useState<MatchDispute | null>(null);
    const [resolveForm, setResolveForm] = useState<{ status: 'ACCEPTED' | 'REJECTED'; adminNote: string }>({ status: 'REJECTED', adminNote: '' });
    const [submitting, setSubmitting] = useState(false);
    const [expanded, setExpanded] = useState<string | null>(null);

    const notify = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => { leagueService.getAllLeagues().then(setLeagues).catch(() => { }); }, []);

    useEffect(() => {
        if (!selLeague) { setSeasons([]); setSelSeason(''); return; }
        seasonService.getByLeague(selLeague).then(setSeasons).catch(() => { });
        setSelSeason('');
    }, [selLeague]);

    const load = useCallback(async () => {
        if (!selSeason) { setDisputes([]); return; }
        try {
            setLoading(true);
            setDisputes(await matchDisputeService.getBySeason(selSeason));
        } catch { notify('Failed to load disputes', false); }
        finally { setLoading(false); }
    }, [selSeason]);

    useEffect(() => { load(); }, [load]);

    const handleReview = async (d: MatchDispute) => {
        try { await matchDisputeService.markUnderReview(d._id); notify('Marked under review'); load(); }
        catch { notify('Failed', false); }
    };

    const handleResolve = async () => {
        if (!resolving) return;
        if (!resolveForm.adminNote.trim()) return notify('Admin note required', false);
        try {
            setSubmitting(true);
            await matchDisputeService.resolve(resolving._id, resolveForm);
            notify(`Dispute ${resolveForm.status === 'ACCEPTED' ? 'accepted' : 'rejected'}`);
            setResolving(null);
            load();
        } catch { notify('Resolve failed', false); }
        finally { setSubmitting(false); }
    };

    const visible = disputes.filter(d => {
        if (filterStatus !== 'ALL' && d.status !== filterStatus) return false;
        if (search) {
            const m = typeof d.matchId === 'string' ? d.matchId : (d.matchId as { _id: string })._id;
            if (!m.toLowerCase().includes(search.toLowerCase()) &&
                !d.reason.toLowerCase().includes(search.toLowerCase())) return false;
        }
        return true;
    });

    const matchLabel = (d: MatchDispute) => {
        if (typeof d.matchId === 'string') return `Match …${d.matchId.slice(-8)}`;
        return `Match …${(d.matchId as { _id: string })._id.slice(-8)}`;
    };

    const teamLabel = (d: MatchDispute) => {
        if (typeof d.submittedByTeamId === 'string') return d.submittedByTeamId.slice(-8);
        return (d.submittedByTeamId as { name: string }).name;
    };

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
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white">Match Disputes</h1>
                    <p className="text-sm text-slate-400">Review and resolve team protests</p>
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

            {/* Filters */}
            {selSeason && (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {(Object.keys(STATUS_META) as DisputeStatus[]).map(s => (
                            <div key={s} className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 text-center">
                                <p className="text-xs text-slate-500 mb-1">{STATUS_META[s].label}</p>
                                <p className="text-xl font-bold text-white">{disputes.filter(d => d.status === s).length}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search by match ID or reason…"
                                className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/60" />
                        </div>
                        <div className="flex gap-2">
                            {(['ALL', ...Object.keys(STATUS_META)] as const).map(s => (
                                <button key={s} onClick={() => setFilterStatus(s as DisputeStatus | 'ALL')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border
                                        ${filterStatus === s
                                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'}`}>
                                    {s === 'ALL' ? 'All' : STATUS_META[s as DisputeStatus]?.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Content */}
            {!selSeason ? (
                <div className="text-center py-20 text-slate-500">
                    <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Select a season to view disputes</p>
                </div>
            ) : loading ? (
                <div className="text-slate-500 text-sm text-center py-16">Loading…</div>
            ) : visible.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                    <ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No disputes found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {visible.map(d => {
                        const meta = STATUS_META[d.status];
                        const open = expanded === d._id;
                        return (
                            <div key={d._id} className="bg-slate-800/60 border border-slate-700/40 rounded-xl overflow-hidden">
                                <div className="flex items-center justify-between px-5 py-4">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="text-white text-sm font-medium font-mono">{matchLabel(d)}</span>
                                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${meta.cls}`}>
                                            {meta.label}
                                        </span>
                                        <span className="text-xs bg-slate-700/60 text-slate-400 border border-slate-600/40 px-2 py-0.5 rounded-full">
                                            {d.reason.replace('_', ' ')}
                                        </span>
                                        <span className="text-xs text-slate-500">by Team …{teamLabel(d)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {d.status === 'PENDING' && (
                                            <button onClick={() => handleReview(d)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-xs font-medium">
                                                <Eye className="w-3.5 h-3.5" /> Review
                                            </button>
                                        )}
                                        {(d.status === 'PENDING' || d.status === 'UNDER_REVIEW') && (
                                            <button onClick={() => { setResolving(d); setResolveForm({ status: 'REJECTED', adminNote: '' }); }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-medium">
                                                <ShieldAlert className="w-3.5 h-3.5" /> Resolve
                                            </button>
                                        )}
                                        <button onClick={() => setExpanded(open ? null : d._id)} className="text-slate-400">
                                            <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>
                                </div>
                                {open && (
                                    <div className="px-5 pb-4 border-t border-slate-700/40 space-y-3 pt-3">
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Description</p>
                                            <p className="text-sm text-slate-300">{d.description}</p>
                                        </div>
                                        {d.evidenceUrls?.length > 0 && (
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Evidence</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {d.evidenceUrls.map((url, i) => (
                                                        <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                                            className="text-xs text-blue-400 hover:text-blue-300 underline">
                                                            Evidence {i + 1}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {d.adminNote && (
                                            <div className="bg-slate-700/40 rounded-lg p-3">
                                                <p className="text-xs text-slate-500 mb-1">Admin Note</p>
                                                <p className="text-sm text-slate-300">{d.adminNote}</p>
                                            </div>
                                        )}
                                        {d.resolvedAt && (
                                            <p className="text-xs text-slate-500">
                                                Resolved: {new Date(d.resolvedAt).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Resolve modal */}
            {resolving && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-white font-semibold">Resolve Dispute</h2>
                            <button onClick={() => setResolving(null)}><X className="w-5 h-5 text-slate-400" /></button>
                        </div>

                        <div className="bg-slate-800 rounded-xl p-4 space-y-1 text-sm">
                            <p className="text-slate-400">Match: <span className="text-white">{matchLabel(resolving)}</span></p>
                            <p className="text-slate-400">Reason: <span className="text-white">{resolving.reason}</span></p>
                            <p className="text-slate-400 text-xs mt-1">{resolving.description}</p>
                        </div>

                        <div>
                            <label className="label">Decision</label>
                            <div className="grid grid-cols-2 gap-3">
                                {(['ACCEPTED', 'REJECTED'] as const).map(s => (
                                    <button key={s} onClick={() => setResolveForm(f => ({ ...f, status: s }))}
                                        className={`py-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors
                                            ${resolveForm.status === s
                                                ? s === 'ACCEPTED'
                                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                                    : 'bg-red-500/20 text-red-300 border-red-500/40'
                                                : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                        {s === 'ACCEPTED'
                                            ? <><CheckCircle className="w-4 h-4" /> Accept</>
                                            : <><XCircle className="w-4 h-4" /> Reject</>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="label">Admin Note *</label>
                            <textarea value={resolveForm.adminNote}
                                onChange={e => setResolveForm(f => ({ ...f, adminNote: e.target.value }))}
                                rows={3} className="input-field resize-none" placeholder="Explain your decision…" />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setResolving(null)}
                                className="flex-1 py-2 rounded-lg border border-slate-700 text-slate-400 text-sm">Cancel</button>
                            <button onClick={handleResolve} disabled={submitting}
                                className={`flex-1 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors
                                    ${resolveForm.status === 'ACCEPTED'
                                        ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                                        : 'bg-red-500 hover:bg-red-400 text-white'}`}>
                                {submitting ? 'Saving…' : `${resolveForm.status === 'ACCEPTED' ? 'Accept' : 'Reject'} Dispute`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
