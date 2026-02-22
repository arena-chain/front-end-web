import { useState, useEffect, useCallback } from 'react';
import {
    Trophy, Plus, Trash2, DollarSign, CheckCircle, Send,
    ChevronDown, X, Check, AlertCircle, Percent,
} from 'lucide-react';
import { leagueService } from '../../../services/leagueService';
import type { League } from '../../../services/leagueService';
import { seasonService } from '../../../services/seasonService';
import type { Season } from '../../../services/seasonService';
import {
    prizePoolService,
} from '../../../services/prizePoolService';
import type { PrizePool, CreatePrizePoolDto, PrizePoolCurrency, PrizePoolSource, PrizeDistribution } from '../../../services/prizePoolService';
import { partnershipService } from '../../../services/partnershipService';
import type { Partnership } from '../../../services/partnershipService';

const CURRENCIES: PrizePoolCurrency[] = ['USD', 'EUR', 'TND', 'GBP'];
const SOURCES: PrizePoolSource[] = ['PLATFORM', 'SPONSORED', 'MIXED'];

const STATUS_STYLES: Record<string, string> = {
    PENDING: 'bg-slate-700/60 text-slate-300 border-slate-600/40',
    CONFIRMED: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    DISTRIBUTED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

interface Toast { msg: string; ok: boolean }

const EMPTY_DIST: PrizeDistribution = { rank: 1, amount: 0, percentage: 0 };

const DEFAULT_FORM: Omit<CreatePrizePoolDto, 'seasonId' | 'leagueId'> = {
    totalAmount: 0,
    currency: 'USD',
    source: 'PLATFORM',
    sponsorId: '',
    distribution: [
        { rank: 1, amount: 0, percentage: 50 },
        { rank: 2, amount: 0, percentage: 30 },
        { rank: 3, amount: 0, percentage: 20 },
    ],
    notes: '',
};

export default function PrizePoolPage() {
    const [leagues, setLeagues] = useState<League[]>([]);
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [partners, setPartners] = useState<Partnership[]>([]);
    const [pools, setPools] = useState<PrizePool[]>([]);
    const [selLeague, setSelLeague] = useState('');
    const [selSeason, setSelSeason] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<Toast | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ ...DEFAULT_FORM });
    const [submitting, setSubmitting] = useState(false);

    const notify = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        leagueService.getAllLeagues()
            .then(data => { setLeagues(data); })
            .catch(err => { console.error('Failed to load leagues:', err); notify('Failed to load leagues', false); });
        partnershipService.getAll().then(setPartners).catch(console.error);
    }, []);

    useEffect(() => {
        if (!selLeague) { setSeasons([]); setSelSeason(''); return; }
        seasonService.getByLeague(selLeague).then(setSeasons).catch(() => { });
        setSelSeason('');
    }, [selLeague]);

    const loadPools = useCallback(async () => {
        if (!selSeason) { setPools([]); return; }
        try {
            setLoading(true);
            setPools(await prizePoolService.getBySeason(selSeason));
        } catch { notify('Failed to load prize pools', false); }
        finally { setLoading(false); }
    }, [selSeason]);

    useEffect(() => { loadPools(); }, [loadPools]);

    const syncAmounts = (dist: PrizeDistribution[], total: number): PrizeDistribution[] =>
        dist.map(d => ({ ...d, amount: Math.round((d.percentage / 100) * total) }));

    const setDistPct = (i: number, pct: number) => {
        const updated = form.distribution.map((d, idx) => idx === i ? { ...d, percentage: pct } : d);
        setForm(f => ({ ...f, distribution: syncAmounts(updated, f.totalAmount) }));
    };

    const addTier = () => {
        const next = form.distribution.length + 1;
        setForm(f => ({ ...f, distribution: [...f.distribution, { ...EMPTY_DIST, rank: next }] }));
    };

    const removeTier = (i: number) =>
        setForm(f => ({ ...f, distribution: f.distribution.filter((_, idx) => idx !== i) }));

    const totalPct = form.distribution.reduce((s, d) => s + d.percentage, 0);

    const handleSubmit = async () => {
        if (!selSeason || !selLeague) return notify('Select a league + season', false);
        if (form.totalAmount <= 0) return notify('Total amount must be > 0', false);
        if (Math.abs(totalPct - 100) > 1) return notify('Distribution must total 100%', false);
        try {
            setSubmitting(true);
            const final = syncAmounts(form.distribution, form.totalAmount);
            await prizePoolService.create({
                ...form,
                distribution: final,
                seasonId: selSeason,
                leagueId: selLeague,
                sponsorId: form.sponsorId || undefined,
            });
            notify('Prize pool created');
            setShowForm(false);
            setForm({ ...DEFAULT_FORM });
            loadPools();
        } catch { notify('Create failed', false); }
        finally { setSubmitting(false); }
    };

    const confirmPool = async (pool: PrizePool) => {
        try { await prizePoolService.confirm(pool._id); notify('Confirmed'); loadPools(); }
        catch { notify('Failed', false); }
    };

    const distribute = async (pool: PrizePool) => {
        if (!window.confirm(`Distribute prizes for this pool? This is irreversible.`)) return;
        try { await prizePoolService.distribute(pool._id); notify('Distributed!'); loadPools(); }
        catch { notify('Distribution failed', false); }
    };

    const del = async (pool: PrizePool) => {
        if (!window.confirm('Delete prize pool?')) return;
        try { await prizePoolService.delete(pool._id); notify('Deleted'); loadPools(); }
        catch { notify('Delete failed', false); }
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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Prize Pools</h1>
                        <p className="text-sm text-slate-400">Manage &amp; distribute season prizes</p>
                    </div>
                </div>
                <button onClick={() => setShowForm(true)} disabled={!selSeason}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-semibold disabled:opacity-40 transition-colors">
                    <Plus className="w-4 h-4" /> New Pool
                </button>
            </div>

            {/* Season selector */}
            <div className="grid grid-cols-2 gap-3">
                <select value={selLeague} onChange={e => setSelLeague(e.target.value)}
                    className="input-field">
                    <option value="">— Select League —</option>
                    {leagues.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                </select>
                <select value={selSeason} onChange={e => setSelSeason(e.target.value)}
                    className="input-field" disabled={!selLeague}>
                    <option value="">— Select Season —</option>
                    {seasons.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
            </div>

            {/* Pool list */}
            {!selSeason ? (
                <div className="text-center py-20 text-slate-500">
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Select a season to view prize pools</p>
                </div>
            ) : loading ? (
                <div className="text-slate-500 text-sm text-center py-16">Loading…</div>
            ) : pools.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                    <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No prize pools yet</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {pools.map(pool => (
                        <PoolCard key={pool._id} pool={pool} onConfirm={confirmPool} onDistribute={distribute} onDelete={del} />
                    ))}
                </div>
            )}

            {/* Create modal */}
            {showForm && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-white font-semibold text-lg">Create Prize Pool</h2>
                            <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Total Amount</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input type="number" value={form.totalAmount}
                                        onChange={e => setForm(f => ({
                                            ...f,
                                            totalAmount: +e.target.value,
                                            distribution: syncAmounts(f.distribution, +e.target.value),
                                        }))}
                                        className="input-field pl-9" min={0} />
                                </div>
                            </div>
                            <div>
                                <label className="label">Currency</label>
                                <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value as PrizePoolCurrency }))}
                                    className="input-field">
                                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label">Source</label>
                                <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value as PrizePoolSource }))}
                                    className="input-field">
                                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            {(form.source === 'SPONSORED' || form.source === 'MIXED') && (
                                <div>
                                    <label className="label">Sponsor</label>
                                    <select value={form.sponsorId} onChange={e => setForm(f => ({ ...f, sponsorId: e.target.value }))}
                                        className="input-field">
                                        <option value="">None</option>
                                        {partners.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Distribution tiers */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="label">Distribution ({totalPct}% / 100%)</span>
                                <button onClick={addTier} className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Add tier
                                </button>
                            </div>
                            <div className="space-y-2">
                                {form.distribution.map((d, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
                                        <span className="text-xs text-slate-400 w-14">#{d.rank}</span>
                                        <div className="flex items-center gap-1 flex-1">
                                            <Percent className="w-3 h-3 text-slate-500" />
                                            <input type="number" value={d.percentage} min={0} max={100}
                                                onChange={e => setDistPct(i, +e.target.value)}
                                                className="w-16 bg-transparent text-white text-sm outline-none" />
                                        </div>
                                        <span className="text-xs text-yellow-400 font-mono w-20 text-right">
                                            {form.currency} {d.amount.toLocaleString()}
                                        </span>
                                        <button onClick={() => removeTier(i)} className="text-slate-500 hover:text-red-400">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="label">Notes</label>
                            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                rows={2} className="input-field resize-none" placeholder="Optional notes…" />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowForm(false)}
                                className="flex-1 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white text-sm">
                                Cancel
                            </button>
                            <button onClick={handleSubmit} disabled={submitting}
                                className="flex-1 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-semibold disabled:opacity-50">
                                {submitting ? 'Creating…' : 'Create Pool'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function PoolCard({ pool, onConfirm, onDistribute, onDelete }: {
    pool: PrizePool;
    onConfirm: (p: PrizePool) => void;
    onDistribute: (p: PrizePool) => void;
    onDelete: (p: PrizePool) => void;
}) {
    const [open, setOpen] = useState(true);
    return (
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <div>
                        <span className="text-white font-semibold">{pool.currency} {pool.totalAmount.toLocaleString()}</span>
                        <span className="ml-3 text-xs text-slate-400">{pool.source}</span>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${STATUS_STYLES[pool.status]}`}>
                        {pool.status}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {pool.status === 'PENDING' && (
                        <button onClick={() => onConfirm(pool)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-xs font-medium">
                            <CheckCircle className="w-3.5 h-3.5" /> Confirm
                        </button>
                    )}
                    {pool.status === 'CONFIRMED' && (
                        <button onClick={() => onDistribute(pool)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-medium">
                            <Send className="w-3.5 h-3.5" /> Distribute
                        </button>
                    )}
                    <button onClick={() => onDelete(pool)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setOpen(o => !o)} className="text-slate-400">
                        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>
            {open && (
                <div className="px-5 pb-4 border-t border-slate-700/40">
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {pool.distribution.map(d => (
                            <div key={d.rank} className="bg-slate-700/40 rounded-lg p-3 text-center">
                                <p className="text-xs text-slate-500 mb-1">#{d.rank} Place</p>
                                <p className="text-sm font-bold text-yellow-400">{pool.currency} {d.amount.toLocaleString()}</p>
                                <p className="text-xs text-slate-500">{d.percentage}%</p>
                            </div>
                        ))}
                    </div>
                    {pool.notes && <p className="text-xs text-slate-500 mt-3">{pool.notes}</p>}
                </div>
            )}
        </div>
    );
}
