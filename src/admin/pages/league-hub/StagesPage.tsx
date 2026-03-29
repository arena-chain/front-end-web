import { useState, useEffect } from 'react';
import {
    Layers, Plus, Loader2, Trash2, Search, X,
    Flag, Clock, Zap,
    CheckCircle2, Circle, PlayCircle, CalendarClock,
    LayoutList, Trophy, Grid2X2, Shuffle,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { stageService, type Stage, type StageType, type StageStatus, type CreateStageDto } from '../../../services/stageService';
import { useLeagueHub } from './LeagueHubContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const apiErr = (e: unknown) => {
    const err = e as { response?: { data?: { message?: string } } };
    return err?.response?.data?.message || 'Something went wrong';
};

const fmt = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STAGE_TYPE_META: Record<StageType, { label: string; icon: React.ReactNode; color: string }> = {
    LEAGUE: { label: 'League', icon: <LayoutList size={12} />, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    BRACKET: { label: 'Bracket', icon: <Trophy size={12} />, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    SWISS: { label: 'Swiss', icon: <Shuffle size={12} />, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    GROUPS: { label: 'Groups', icon: <Grid2X2 size={12} />, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
};

const STATUS_META: Record<StageStatus, { label: string; icon: React.ReactNode; color: string; dot: string }> = {
    DRAFT: { label: 'Draft', icon: <Circle size={12} />, color: 'text-white/40 bg-white/5 border-white/10', dot: 'bg-white/30' },
    SCHEDULED: { label: 'Scheduled', icon: <CalendarClock size={12} />, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', dot: 'bg-yellow-400' },
    LIVE: { label: 'Live', icon: <PlayCircle size={12} />, color: 'text-green-400 bg-green-500/10 border-green-500/20', dot: 'bg-green-400 animate-pulse' },
    COMPLETED: { label: 'Completed', icon: <CheckCircle2 size={12} />, color: 'text-white/50 bg-white/5 border-white/10', dot: 'bg-green-700' },
};

const STATUS_TRANSITIONS: Record<StageStatus, StageStatus | null> = {
    DRAFT: 'SCHEDULED',
    SCHEDULED: 'LIVE',
    LIVE: 'COMPLETED',
    COMPLETED: null,
};

const STAGE_TYPES: StageType[] = ['LEAGUE', 'BRACKET', 'SWISS', 'GROUPS'];
const STAGE_STATUSES: StageStatus[] = ['DRAFT', 'SCHEDULED', 'LIVE', 'COMPLETED'];

// ─── Default form ─────────────────────────────────────────────────────────────

const defaultForm = (): Omit<CreateStageDto, 'seasonId'> => ({
    name: '',
    stageType: 'LEAGUE',
    orderIndex: 0,
    startAt: '',
    endAt: '',
    status: 'DRAFT',
    rulesetId: '',
    description: '',
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StagesPage() {
    const {
        selectedLeague,
        seasons, seasonsLoading,
        selectedSeason, setSelectedSeason,
        seasonRules,
        stages, stagesLoading, refetchStages,
        notify,
    } = useLeagueHub();

    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(defaultForm());

    // Reset on season change
    useEffect(() => {
        setShowForm(false);
        setForm(defaultForm());
        setSearch('');
    }, [selectedSeason?._id]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSeason) return notify('Select a season first', 'err');
        if (!form.rulesetId) return notify('Please select a ruleset', 'err');
        setSaving(true);
        try {
            await stageService.create({
                ...form,
                seasonId: selectedSeason._id,
                leagueId: selectedLeague?._id,
                orderIndex: Number(form.orderIndex ?? 0),
            });
            notify('Stage created!', 'ok');
            setShowForm(false);
            setForm(defaultForm());
            refetchStages();
        } catch (e) { notify(apiErr(e), 'err'); }
        finally { setSaving(false); }
    };

    const handleStatusAdvance = async (stage: Stage) => {
        const next = STATUS_TRANSITIONS[stage.status];
        if (!next) return;
        try {
            await stageService.updateStatus(stage._id, next);
            notify(`Stage moved to ${next}`, 'ok');
            refetchStages();
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this stage permanently?')) return;
        try {
            await stageService.delete(id);
            notify('Stage deleted.', 'ok');
            refetchStages();
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    const filtered = stages.filter(s =>
        !search || s.name.toLowerCase().includes(search.toLowerCase())
    );

    // ── No league ───────────────────────────────────────────────────────────
    if (!selectedLeague) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <Layers size={40} className="text-text-muted mb-4 opacity-30" />
                <p className="text-white font-black text-lg uppercase tracking-widest mb-1">No League Selected</p>
                <p className="text-text-muted text-sm">Select a league from the sidebar to manage its stages.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <Layers size={24} className="text-violet-400" />
                        Stages
                    </h1>
                    <p className="text-text-muted text-sm mt-1">
                        Manage competition phases (Regular Season, Playoffs, etc.) for each season of{' '}
                        <strong className="text-white">{selectedLeague.name}</strong>.
                    </p>
                </div>
                {selectedSeason && (
                    <button
                        onClick={() => setShowForm(v => !v)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-black bg-primary hover:bg-primary/90 transition-all shrink-0"
                    >
                        {showForm ? <X size={16} /> : <Plus size={16} />}
                        {showForm ? 'Cancel' : 'New Stage'}
                    </button>
                )}
            </div>

            {/* Season Picker */}
            <div className="bg-surface border border-white/8 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">Season</p>
                {seasonsLoading ? (
                    <Loader2 size={18} className="animate-spin text-primary" />
                ) : seasons.length === 0 ? (
                    <p className="text-sm text-text-muted">No seasons yet. Create one in the Seasons page first.</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {seasons.map(s => (
                            <button
                                key={s._id}
                                onClick={() => setSelectedSeason(s)}
                                className={cn(
                                    'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all',
                                    selectedSeason?._id === s._id
                                        ? 'bg-primary/20 border-primary/50 text-primary'
                                        : 'bg-white/5 border-white/10 text-text-muted hover:border-white/25 hover:text-white'
                                )}
                            >
                                {s.name}
                                <span className={cn(
                                    'ml-2 text-[9px] px-1.5 py-0.5 rounded-full border',
                                    s.status === 'ONGOING' ? 'bg-green-500/15 text-green-400 border-green-500/20'
                                        : s.status === 'PLANNED' ? 'bg-gray-500/15 text-gray-400 border-gray-500/20'
                                            : 'bg-white/5 text-white/30 border-white/10'
                                )}>
                                    {s.status}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Season required gate */}
            {!selectedSeason && (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-surface border border-white/5 rounded-2xl">
                    <CalendarClock size={40} className="text-text-muted mb-4 opacity-20" />
                    <p className="text-white font-black uppercase tracking-widest mb-1">Select a Season</p>
                    <p className="text-text-muted text-sm">Pick a season above to view and manage its stages.</p>
                </div>
            )}

            {selectedSeason && (
                <>
                    {/* Create form */}
                    {showForm && (
                        <form onSubmit={handleCreate} className="bg-surface border border-white/8 rounded-2xl p-6 space-y-5">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Zap size={14} className="text-primary" /> New Stage — {selectedSeason.name}
                            </h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                {/* Name */}
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">
                                        Stage Name *
                                    </label>
                                    <input
                                        value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        placeholder='e.g. "Regular Season" or "Playoffs"'
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-text-muted focus:border-primary/50 outline-none transition-colors"
                                        required
                                    />
                                </div>

                                {/* Stage Type */}
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">
                                        Stage Type *
                                    </label>
                                    <select
                                        value={form.stageType}
                                        onChange={e => setForm(f => ({ ...f, stageType: e.target.value as StageType }))}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none transition-colors cursor-pointer"
                                    >
                                        {STAGE_TYPES.map(t => (
                                            <option key={t} value={t}>{STAGE_TYPE_META[t].label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Ruleset */}
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">
                                        Ruleset *
                                    </label>
                                    <select
                                        value={form.rulesetId}
                                        onChange={e => setForm(f => ({ ...f, rulesetId: e.target.value }))}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none transition-colors cursor-pointer"
                                        required
                                    >
                                        <option value="">— Select ruleset —</option>
                                        {seasonRules.map(r => (
                                            <option key={r._id} value={r._id}>
                                                {r.name} ({r.matchType})
                                            </option>
                                        ))}
                                    </select>
                                    {seasonRules.length === 0 && (
                                        <p className="text-[11px] text-yellow-400/70 mt-1.5">
                                            No rules yet — create rules on the Rules page first.
                                        </p>
                                    )}
                                </div>

                                {/* Order Index */}
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">
                                        Order Index
                                    </label>
                                    <input
                                        type="number" min={0}
                                        value={form.orderIndex ?? 0}
                                        onChange={e => setForm(f => ({ ...f, orderIndex: parseInt(e.target.value) || 0 }))}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none transition-colors"
                                    />
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">
                                        Initial Status
                                    </label>
                                    <select
                                        value={form.status}
                                        onChange={e => setForm(f => ({ ...f, status: e.target.value as StageStatus }))}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none transition-colors cursor-pointer"
                                    >
                                        {STAGE_STATUSES.map(s => (
                                            <option key={s} value={s}>{STATUS_META[s].label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Start date */}
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">
                                        Start Date *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={form.startAt}
                                        onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none transition-colors cursor-pointer"
                                        required
                                    />
                                </div>

                                {/* End date */}
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">
                                        End Date *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={form.endAt}
                                        onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none transition-colors cursor-pointer"
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">
                                        Description
                                    </label>
                                    <textarea
                                        value={form.description}
                                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        placeholder="Optional notes about this stage…"
                                        rows={2}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-text-muted focus:border-primary/50 outline-none transition-colors resize-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit" disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-black bg-primary hover:bg-primary/90 disabled:opacity-50 transition-all"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                Create Stage
                            </button>
                        </form>
                    )}

                    {/* Search */}
                    <div className="relative max-w-sm">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search stages…"
                            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-white/8 rounded-xl text-sm text-white placeholder-text-muted focus:border-primary/50 outline-none transition-colors"
                        />
                    </div>

                    {/* Stage list */}
                    {stagesLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 size={32} className="animate-spin text-primary" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center bg-surface border border-white/5 rounded-2xl">
                            <Layers size={48} className="text-text-muted mb-4 opacity-20" />
                            <p className="text-white font-black text-lg uppercase tracking-widest mb-1">No stages found</p>
                            <p className="text-text-muted text-sm mb-6">
                                {search ? 'No stages match your search.' : `Add the first stage to ${selectedSeason.name}`}
                            </p>
                            {!search && (
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-black bg-primary hover:bg-primary/90 transition-all"
                                >
                                    <Plus size={16} /> New Stage
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Timeline header */}
                            <div className="flex items-center gap-3 px-1">
                                <Layers size={14} className="text-violet-400" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-text-muted">
                                    {filtered.length} stage{filtered.length !== 1 ? 's' : ''} — {selectedSeason.name}
                                </span>
                            </div>

                            {/* Stage rows */}
                            {filtered.map((stage, idx) => {
                                const typeMeta = STAGE_TYPE_META[stage.stageType] ?? STAGE_TYPE_META.LEAGUE;
                                const statusMeta = STATUS_META[stage.status] ?? STATUS_META.DRAFT;
                                const nextStatus = STATUS_TRANSITIONS[stage.status];
                                const rulesetName = typeof stage.rulesetId === 'object'
                                    ? `${stage.rulesetId.name} (${stage.rulesetId.matchType})`
                                    : `Rule #${String(stage.rulesetId).slice(-6)}`;

                                return (
                                    <div key={stage._id} className="group bg-surface border border-white/8 rounded-2xl overflow-hidden hover:border-white/15 transition-colors">
                                        <div className="p-5 flex items-center gap-4">
                                            {/* Order badge */}
                                            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 font-black text-violet-400 text-sm">
                                                {idx + 1}
                                            </div>

                                            {/* Main info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <h3 className="text-white font-black text-base truncate">{stage.name}</h3>
                                                    {/* Type badge */}
                                                    <span className={cn('flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest', typeMeta.color)}>
                                                        {typeMeta.icon}{typeMeta.label}
                                                    </span>
                                                    {/* Status badge */}
                                                    <span className={cn('flex items-center gap-1.5 text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest', statusMeta.color)}>
                                                        <span className={cn('w-1.5 h-1.5 rounded-full', statusMeta.dot)} />
                                                        {statusMeta.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 flex-wrap text-[11px] text-text-muted font-medium">
                                                    <span className="flex items-center gap-1">
                                                        <Flag size={11} /> {fmt(stage.startAt)} → {fmt(stage.endAt)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={11} /> {rulesetName}
                                                    </span>
                                                    {stage.description && (
                                                        <span className="text-white/25 truncate max-w-[200px]">{stage.description}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                {nextStatus && (
                                                    <button
                                                        onClick={() => handleStatusAdvance(stage)}
                                                        className={cn(
                                                            'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold border transition-all',
                                                            STATUS_META[nextStatus].color,
                                                            'hover:opacity-80'
                                                        )}
                                                        title={`Advance to ${nextStatus}`}
                                                    >
                                                        {STATUS_META[nextStatus].icon}
                                                        → {STATUS_META[nextStatus].label}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(stage._id)}
                                                    className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted bg-white/5 hover:bg-red-500/15 hover:text-red-400 transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Timeline visual */}
                            {filtered.length > 1 && (
                                <div className="flex items-center gap-0 px-5 py-3 bg-surface border border-white/5 rounded-2xl overflow-x-auto">
                                    {filtered.map((stage, i) => {
                                        const statusMeta = STATUS_META[stage.status] ?? STATUS_META.DRAFT;
                                        const typeMeta = STAGE_TYPE_META[stage.stageType] ?? STAGE_TYPE_META.LEAGUE;
                                        return (
                                            <div key={stage._id} className="flex items-center gap-0 shrink-0">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <div className={cn('w-3 h-3 rounded-full border-2', statusMeta.dot.includes('animate') ? 'animate-pulse' : '')}
                                                        style={{ backgroundColor: stage.status === 'LIVE' ? '#4ade80' : stage.status === 'SCHEDULED' ? '#facc15' : stage.status === 'COMPLETED' ? '#166534' : 'rgba(255,255,255,0.2)', borderColor: 'transparent' }}
                                                    />
                                                    <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border', typeMeta.color)}>{stage.name}</span>
                                                </div>
                                                {i < filtered.length - 1 && (
                                                    <div className="w-8 h-px bg-white/10 mx-1" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
