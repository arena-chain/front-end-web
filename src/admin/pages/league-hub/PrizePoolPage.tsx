import { useState, useEffect, useCallback } from 'react';
import {
    Trophy, Plus, Trash2, DollarSign, CheckCircle, Send,
    ChevronDown, X, Percent, FileText, Loader2, Star, Users, ChevronUp
} from 'lucide-react';
import { useLeagueHub } from './LeagueHubContext';
import { prizePoolService } from '../../../services/prizePoolService';
import type { PrizePool, CreatePrizePoolDto, PrizePoolCurrency, PrizePoolSource, PrizeDistribution } from '../../../services/prizePoolService';
import { partnershipService } from '../../../services/partnershipService';
import type { Partnership } from '../../../services/partnershipService';
import { cn } from '../../../lib/utils';
import { Modal } from '../../../components/ui/core';

const CURRENCIES: PrizePoolCurrency[] = ['USD', 'EUR', 'TND', 'GBP'];
const SOURCES: PrizePoolSource[] = ['PLATFORM', 'SPONSORED', 'MIXED'];

const STATUS_STYLES: Record<string, string> = {
    PENDING: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    CONFIRMED: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    DISTRIBUTED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
};

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
    const { selectedLeague, selectedSeason, notify } = useLeagueHub();

    // Data
    const [partners, setPartners] = useState<Partnership[]>([]);
    const [pools, setPools] = useState<PrizePool[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ ...DEFAULT_FORM });
    const [submitting, setSubmitting] = useState(false);

    // Initial partner load
    useEffect(() => {
        partnershipService.getAll().then(setPartners).catch(console.error);
    }, []);

    // Load pools when season changes
    const loadPools = useCallback(async () => {
        if (!selectedSeason) { setPools([]); return; }
        try {
            setLoading(true);
            const data = await prizePoolService.getBySeason(selectedSeason._id);
            setPools(data);
        } catch {
            notify('Failed to load prize pools', 'err');
        } finally {
            setLoading(false);
        }
    }, [selectedSeason, notify]);

    useEffect(() => { loadPools(); }, [loadPools]);

    // Form logic
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSeason || !selectedLeague) return notify('Select a league and season first', 'err');
        if (form.totalAmount <= 0) return notify('Total amount must be greater than 0', 'err');
        if (Math.abs(totalPct - 100) > 1) return notify('Distribution must total exactly 100%', 'err');

        try {
            setSubmitting(true);
            const final = syncAmounts(form.distribution, form.totalAmount);
            await prizePoolService.create({
                ...form,
                distribution: final,
                seasonId: selectedSeason._id,
                leagueId: selectedLeague._id,
                sponsorId: form.sponsorId || undefined,
            });
            notify('Prize pool created successfully', 'ok');
            setShowForm(false);
            setForm({ ...DEFAULT_FORM });
            loadPools();
        } catch {
            notify('Failed to create prize pool', 'err');
        } finally {
            setSubmitting(false);
        }
    };

    // Actions
    const confirmPool = async (pool: PrizePool) => {
        try {
            await prizePoolService.confirm(pool._id);
            notify('Prize pool confirmed', 'ok');
            loadPools();
        } catch { notify('Failed to confirm pool', 'err'); }
    };

    const distribute = async (pool: PrizePool) => {
        if (!window.confirm(`Distribute prizes for this pool? This action is irreversible.`)) return;
        try {
            await prizePoolService.distribute(pool._id);
            notify('Prize pool marked as distributed', 'ok');
            loadPools();
        } catch { notify('Failed to distribute pool', 'err'); }
    };

    const del = async (pool: PrizePool) => {
        if (!window.confirm('Delete this prize pool?')) return;
        try {
            await prizePoolService.delete(pool._id);
            notify('Prize pool deleted', 'ok');
            loadPools();
        } catch { notify('Failed to delete pool', 'err'); }
    };

    // Require Season
    if (!selectedSeason) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-surface border border-white/5 rounded-2xl">
                <Trophy size={48} className="text-amber-500/20 mb-4" />
                <p className="text-white font-black text-lg uppercase tracking-widest mb-1">No Season Selected</p>
                <p className="text-text-muted text-sm max-w-sm">Please select a season from the Seasons tab first to manage its prize pools.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <Trophy size={24} className="text-amber-400" />
                        Prize Pools
                    </h1>
                    <p className="text-text-muted text-sm mt-1">
                        Manage & distribute prize pools for <strong className="text-white">{selectedSeason.name}</strong>.
                    </p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-black bg-green-500 hover:bg-green-400 transition-all shrink-0"
                    >
                        <Plus size={16} />
                        New Prize Pool
                    </button>
                )}
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-amber-500" />
                </div>
            ) : pools.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-surface border border-white/5 rounded-2xl">
                    <DollarSign size={48} className="text-amber-500/20 mb-4" />
                    <p className="text-white font-black text-lg uppercase tracking-widest mb-1">No prize pools active</p>
                    <p className="text-text-muted text-sm mb-6">Create the first prize pool allocation for this season</p>
                    {!showForm && (
                        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-black bg-green-500 hover:bg-green-400 transition-all">
                            <Plus size={16} /> Create Prize Pool
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid gap-4">
                    {pools.map(pool => (
                        <PoolCard key={pool._id} pool={pool} onConfirm={confirmPool} onDistribute={distribute} onDelete={del} partners={partners} />
                    ))}
                </div>
            )}

            {/* Form Modal */}
            <Modal isOpen={showForm} onClose={() => setShowForm(false)} size="lg">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                            <Trophy size={20} className="text-amber-400" />
                            Create Prize Pool
                        </h2>
                        <button type="button" onClick={() => setShowForm(false)} className="p-2 text-text-muted hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-1">Total Amount *</label>
                            <div className="relative">
                                <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                                <input type="number" value={form.totalAmount}
                                    onChange={e => setForm(f => ({
                                        ...f,
                                        totalAmount: +e.target.value,
                                        distribution: syncAmounts(f.distribution, +e.target.value)
                                    }))}
                                    className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:border-amber-500/50 outline-none" min={0} required />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-1">Currency *</label>
                            <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value as PrizePoolCurrency }))}
                                className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:border-amber-500/50 outline-none appearance-none">
                                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-1">Source *</label>
                            <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value as PrizePoolSource }))}
                                className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:border-amber-500/50 outline-none appearance-none">
                                {SOURCES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                            </select>
                        </div>

                        {(form.source === 'SPONSORED' || form.source === 'MIXED') && (
                            <div className="space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                                <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                                    <Star size={10} /> Sponsor
                                </label>
                                <select value={form.sponsorId} onChange={e => setForm(f => ({ ...f, sponsorId: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl text-sm text-white focus:border-amber-500/50 outline-none appearance-none">
                                    <option value="">Select a partner...</option>
                                    {partners.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Distribution Model */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <Percent size={14} className="text-text-muted" />
                                Distribution Model
                                <span className={cn(
                                    "px-2 py-0.5 rounded-md text-[9px] ml-2 border",
                                    totalPct === 100 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"
                                )}>
                                    {totalPct}% / 100%
                                </span>
                            </h3>
                            <button type="button" onClick={addTier} className="text-[10px] font-bold uppercase tracking-widest text-amber-400 hover:text-amber-300 flex items-center gap-1">
                                <Plus size={12} /> Add Rank
                            </button>
                        </div>

                        <div className="space-y-2">
                            {form.distribution.map((d, i) => (
                                <div key={i} className="flex items-center gap-3 bg-black/40 rounded-xl px-4 py-2.5 border border-white/5">
                                    <div className="w-16 flex items-center gap-1.5">
                                        <Trophy size={14} className={i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-orange-400" : "text-white/20"} />
                                        <span className="text-sm font-bold text-white/60">#{d.rank}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-1">
                                        <input type="number" value={d.percentage} min={0} max={100}
                                            onChange={e => setDistPct(i, +e.target.value)}
                                            className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 text-center py-1 text-sm text-white outline-none focus:border-amber-500/50" />
                                        <span className="text-xs text-text-muted">%</span>
                                    </div>
                                    <div className="text-sm font-mono font-bold text-amber-400 min-w-24 text-right px-3 bg-amber-500/10 py-1 rounded-lg border border-amber-500/20">
                                        {formatMoney(d.amount, form.currency)}
                                    </div>
                                    <button type="button" onClick={() => removeTier(i)} className="p-1 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-1 flex items-center gap-1.5">
                            <FileText size={12} /> Internal Notes
                        </label>
                        <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                            rows={3} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:border-amber-500/50 outline-none resize-none placeholder:text-white/20" placeholder="Optional details..." />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-white/5 hover:bg-white/10 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting || totalPct !== 100 || form.totalAmount <= 0}
                            className="flex-2 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-black bg-amber-400 hover:bg-amber-300 disabled:opacity-50 transition-all">
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            Allocate Prize Pool
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

// Display conversion for KRW and USD equivalent (for table display only)
const USD_TO_KRW = 1440;
const TO_USD: Record<PrizePoolCurrency, number> = { USD: 1, EUR: 1.08, GBP: 1.27, TND: 0.32 };

function formatMoney(amount: number, currency: PrizePoolCurrency) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
}

function formatKrw(amountUsd: number): string {
    const krw = Math.round(amountUsd * USD_TO_KRW);
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(krw);
}

const CURRENCY_LABELS: Record<PrizePoolCurrency, string> = { USD: '$ USD', EUR: '€ EUR', GBP: '£ GBP', TND: 'TND' };

const PLACE_STYLES: Record<number, { bg: string; border: string; label: string }> = {
    1: { bg: 'bg-amber-500/25', border: 'border-amber-500/40', label: '1st' },
    2: { bg: 'bg-slate-500/25', border: 'border-slate-400/40', label: '2nd' },
    3: { bg: 'bg-amber-700/30', border: 'border-amber-600/40', label: '3rd' },
    4: { bg: 'bg-orange-600/25', border: 'border-orange-500/40', label: '4th' },
};

function getPlaceStyle(rank: number) {
    return PLACE_STYLES[rank] ?? { bg: 'bg-white/10', border: 'border-white/20', label: `${rank}th` };
}

function PrizePoolBreakdownTable({ pool }: { pool: PrizePool }) {
    const [showLower, setShowLower] = useState(false);
    const topRanks = pool.distribution.slice(0, 4);
    const lowerRanks = pool.distribution.slice(4);
    const toUsd = (amount: number) => amount * (TO_USD[pool.currency] ?? 1);

    const renderRow = (d: PrizeDistribution, compact = false) => {
        const style = getPlaceStyle(d.rank);
        return (
            <tr key={d.rank} className={cn('border-b border-white/5', style.border)}>
                <td className={cn('py-3 px-4 font-bold text-white', style.bg, compact && 'py-2')}>
                    <div className="flex items-center gap-2">
                        <span className={cn('flex items-center justify-center rounded-full bg-white/20 text-xs font-black', compact ? 'h-6 w-6 text-[10px]' : 'h-7 w-7')}>{d.rank}</span>
                        {style.label}
                    </div>
                </td>
                <td className={cn('py-3 px-4 text-white font-mono', compact && 'text-xs py-2')}>
                    {formatMoney(d.amount, pool.currency)}
                </td>
                <td className={cn('py-3 px-4 text-white/90 font-mono', compact && 'text-xs py-2')}>
                    {formatKrw(toUsd(d.amount))}
                </td>
                <td className={cn('py-3 px-4 text-red-400 text-xs font-medium', compact && 'py-2')}>—</td>
                <td className={cn('py-3 px-4 text-text-muted', compact && 'text-xs py-2')}>—</td>
                <td className={cn('py-3 px-4', compact && 'py-2')}>
                    <span className="flex items-center gap-2 text-text-muted">
                        <Users size={compact ? 12 : 14} className="text-white/50" />
                        TBD
                    </span>
                </td>
            </tr>
        );
    };

    return (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                        <th className="py-3 px-4 font-bold text-text-muted uppercase tracking-widest">Place</th>
                        <th className="py-3 px-4 font-bold text-text-muted uppercase tracking-widest">
                            <span className="border-b border-dotted border-text-muted/60">{CURRENCY_LABELS[pool.currency]}</span>
                        </th>
                        <th className="py-3 px-4 font-bold text-text-muted uppercase tracking-widest">
                            <span className="border-b border-dotted border-text-muted/60">₩ KRW</span>
                        </th>
                        <th className="py-3 px-4 font-bold text-text-muted uppercase tracking-widest">Qualifies To</th>
                        <th className="py-3 px-4 font-bold text-text-muted uppercase tracking-widest">Points</th>
                        <th className="py-3 px-4 font-bold text-text-muted uppercase tracking-widest">Participant</th>
                    </tr>
                </thead>
                <tbody>
                    {topRanks.map((d) => renderRow(d))}
                    {showLower && lowerRanks.map((d) => renderRow(d, true))}
                </tbody>
            </table>
            {lowerRanks.length > 0 && (
                <button
                    type="button"
                    onClick={() => setShowLower((v) => !v)}
                    className="w-full py-2.5 text-center text-xs font-medium text-text-muted hover:text-white transition-colors flex items-center justify-center gap-1 border-t border-white/5"
                >
                    {showLower ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    place 5 to {4 + lowerRanks.length}
                </button>
            )}
        </div>
    );
}

function PoolCard({ pool, onConfirm, onDistribute, onDelete, partners }: {
    pool: PrizePool;
    partners: Partnership[];
    onConfirm: (p: PrizePool) => void;
    onDistribute: (p: PrizePool) => void;
    onDelete: (p: PrizePool) => void;
}) {
    const [open, setOpen] = useState(true); // expanded by default so prizepool table is visible

    // Find sponsor name if exists
    const sponsorName = pool.sponsorId
        ? partners.find(p => p._id === pool.sponsorId)?.name || 'Unknown Sponsor'
        : null;

    return (
        <div className="bg-surface border border-white/8 rounded-2xl overflow-hidden hover:border-white/15 transition-all group">
            <div className="p-5 flex items-center justify-between gap-4 cursor-pointer" onClick={() => setOpen(o => !o)}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <DollarSign size={24} className="text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight">{formatMoney(pool.totalAmount, pool.currency)}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted border border-white/10 bg-white/5 px-2 py-0.5 rounded-md">
                                {pool.source}
                            </span>
                            {sponsorName && (
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
                                    <Star size={10} fill="currentColor" /> {sponsorName}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className={cn('text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border', STATUS_STYLES[pool.status])}>
                        {pool.status}
                    </span>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" onClick={e => e.stopPropagation()}>
                        {pool.status === 'PENDING' && (
                            <button onClick={() => onConfirm(pool)} title="Confirm Prize Pool"
                                className="p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
                                <CheckCircle size={16} />
                            </button>
                        )}
                        {pool.status === 'CONFIRMED' && (
                            <button onClick={() => onDistribute(pool)} title="Mark as Distributed"
                                className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                                <Send size={16} />
                            </button>
                        )}
                        <button onClick={() => onDelete(pool)} title="Delete Pool"
                            className="p-2 rounded-xl bg-red-500/10 text-red-500/60 hover:text-red-400 hover:bg-red-500/20 transition-colors">
                            <Trash2 size={16} />
                        </button>
                    </div>

                    <div className="pl-4 border-l border-white/10">
                        <div className={cn("p-1.5 rounded-lg bg-white/5 text-text-muted transition-transform duration-300", open && "rotate-180")}>
                            <ChevronDown size={16} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Expanded: Prizepool breakdown table */}
            <div className={cn("grid transition-all duration-300 ease-in-out", open ? "grid-rows-[1fr] opacity-100 border-t border-white/5" : "grid-rows-[0fr] opacity-0")}>
                <div className="overflow-hidden">
                    <div className="p-5 bg-black/20 space-y-4">
                        <PrizePoolBreakdownTable pool={pool} />
                        {pool.notes && (
                            <div className="p-3 rounded-xl bg-white/5 border border-white/5 border-l-2 border-l-amber-500/50 text-sm text-slate-300 leading-relaxed">
                                {pool.notes}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
