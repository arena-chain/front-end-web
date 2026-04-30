import { useState } from 'react';
import {
    Calendar, Plus, Loader2, Play, CheckSquare, Trash2, Search,
    Clock, X, Flag, Star, ChevronDown, ChevronUp, Layers,
    LayoutList, Trophy, Grid2X2, Shuffle,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import { seasonService } from '../../../services/seasonService';
import { stageService, type Stage, type StageType, type StageStatus } from '../../../services/stageService';
import { useLeagueHub } from './LeagueHubContext';

// ─── Stage chip helpers ───────────────────────────────────────────────────────

const STAGE_TYPE_COLOR: Record<StageType, string> = {
    LEAGUE: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    BRACKET: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    SWISS: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    GROUPS: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
};

const STAGE_TYPE_ICON: Record<StageType, React.ReactNode> = {
    LEAGUE: <LayoutList size={10} />,
    BRACKET: <Trophy size={10} />,
    SWISS: <Shuffle size={10} />,
    GROUPS: <Grid2X2 size={10} />,
};

const STAGE_STATUS_DOT: Record<StageStatus, string> = {
    DRAFT: 'bg-white/30',
    SCHEDULED: 'bg-yellow-400',
    LIVE: 'bg-green-400 animate-pulse',
    COMPLETED: 'bg-green-700',
};


// ─── Helpers ──────────────────────────────────────────────────────────────────

const apiErr = (e: unknown) => {
    const err = e as { response?: { data?: { message?: string } } };
    return err?.response?.data?.message || 'Something went wrong';
};
const fmt = (d: string) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const daysLeft = (d: string) => {
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
    return diff;
};

const STATUS_STYLE: Record<string, string> = {
    PLANNED: 'bg-gray-500/15 text-gray-300 border-gray-500/25',
    ONGOING: 'bg-green-500/15 text-green-400 border-green-500/25',
    FINISHED: 'bg-white/5 text-text-muted border-white/10',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SeasonsPage() {
    const {
        selectedLeague,
        seasons, refetchSeasons, seasonsLoading,
        notify,
    } = useLeagueHub();

    const { id: leagueId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        name: '',
        registrationDeadline: '',
        startDate: '',
        endDate: '',
    });

    // ── Stage preview state: { [seasonId]: Stage[] | 'loading' } ────────────
    const [expandedSeasonId, setExpandedSeasonId] = useState<string | null>(null);
    const [stageCache, setStageCache] = useState<Record<string, Stage[] | 'loading'>>({});

    const toggleExpand = async (seasonId: string) => {
        if (expandedSeasonId === seasonId) {
            setExpandedSeasonId(null);
            return;
        }
        setExpandedSeasonId(seasonId);
        if (stageCache[seasonId]) return; // already fetched
        setStageCache(prev => ({ ...prev, [seasonId]: 'loading' }));
        try {
            const data = await stageService.getBySeason(seasonId);
            setStageCache(prev => ({ ...prev, [seasonId]: data }));
        } catch {
            setStageCache(prev => ({ ...prev, [seasonId]: [] }));
        }
    };


    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLeague) return notify('No league selected', 'err');
        setCreating(true);
        try {
            await seasonService.create({ ...form, leagueId: selectedLeague._id });
            notify('Season created!', 'ok');
            setShowForm(false);
            setForm({ name: '', registrationDeadline: '', startDate: '', endDate: '' });
            refetchSeasons();
        } catch (e) { notify(apiErr(e), 'err'); }
        finally { setCreating(false); }
    };

    const activate = async (id: string) => {
        try {
            await seasonService.activate(id);
            notify('Season activated!', 'ok');
            refetchSeasons();
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    const close = async (id: string) => {
        if (!confirm('Close this season? This cannot be undone.')) return;
        try {
            await seasonService.close(id);
            notify('Season closed.', 'ok');
            refetchSeasons();
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    const del = async (id: string) => {
        if (!confirm('Delete season permanently?')) return;
        try {
            await seasonService.delete(id);
            notify('Season deleted.', 'ok');
            refetchSeasons();
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    const filtered = seasons.filter(s =>
        !search || s.name.toLowerCase().includes(search.toLowerCase())
    );

    if (!selectedLeague) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <Calendar size={40} className="text-text-muted mb-4 opacity-30" />
                <p className="text-white font-black text-lg uppercase tracking-widest mb-1">No League Selected</p>
                <p className="text-text-muted text-sm">Please select a league from the list to manage its seasons.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <Calendar size={24} className="text-amber-400" />
                        Seasons
                    </h1>
                    <p className="text-text-muted text-sm mt-1">
                        Create and manage competition seasons for <strong className="text-white">{selectedLeague.name}</strong>.
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(v => !v)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-black bg-primary hover:bg-primary/90 transition-all shrink-0"
                >
                    {showForm ? <X size={16} /> : <Plus size={16} />}
                    {showForm ? 'Cancel' : 'New Season'}
                </button>
            </div>

            {/* Create form */}
            {showForm && (
                <form onSubmit={handleCreate} className="bg-surface border border-white/8 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Star size={14} className="text-primary" /> Create New Season
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Season Name *</label>
                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="e.g. Spring Split 2026"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-text-muted focus:border-primary/50 outline-none transition-colors" required />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Registration Deadline</label>
                            <input type="date" value={form.registrationDeadline} onChange={e => setForm(f => ({ ...f, registrationDeadline: e.target.value }))}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none transition-colors cursor-pointer" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Start Date</label>
                            <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none transition-colors cursor-pointer" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">End Date</label>
                            <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none transition-colors cursor-pointer" />
                        </div>
                    </div>
                    <div className="pt-2">
                        <button type="submit" disabled={creating}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-black bg-primary hover:bg-primary/90 disabled:opacity-50 transition-all w-full sm:w-auto justify-center">
                            {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            Create Season
                        </button>
                    </div>
                </form>
            )}

            {/* Filters */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search seasons…"
                        className="w-full pl-10 pr-4 py-2.5 bg-surface border border-white/8 rounded-xl text-sm text-white placeholder-text-muted focus:border-primary/50 outline-none transition-colors" />
                </div>
            </div>

            {/* Content */}
            {seasonsLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-primary" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-surface border border-white/5 rounded-2xl">
                    <Calendar size={48} className="text-text-muted mb-4 opacity-20" />
                    <p className="text-white font-black text-lg uppercase tracking-widest mb-1">No seasons found</p>
                    <p className="text-text-muted text-sm mb-6">Create the first season for {selectedLeague.name}</p>
                    {!search && (
                        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-black bg-primary hover:bg-primary/90 transition-all">
                            <Plus size={16} /> Create Season
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {filtered.map(s => {
                        const deadline = s.registrationDeadline ? daysLeft(s.registrationDeadline) : null;
                        const isExpanded = expandedSeasonId === s._id;
                        const stagePrev = stageCache[s._id];
                        return (
                            <div key={s._id} className="bg-surface border border-white/8 rounded-2xl overflow-hidden hover:border-white/15 transition-colors group flex flex-col">
                                <div className="p-5 flex-1 space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
                                            <Calendar size={18} className="text-amber-400" />
                                        </div>
                                        <span className={cn('text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border', STATUS_STYLE[s.status] || STATUS_STYLE.PLANNED)}>
                                            {s.status}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-white font-black text-lg truncate mb-1">{s.name}</h3>
                                        <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium">
                                            <Flag size={12} />
                                            {fmt(s.startDate)} → {fmt(s.endDate)}
                                        </div>
                                    </div>

                                    {deadline !== null && s.status === 'PLANNED' && (
                                        <div className={cn(
                                            'flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg border',
                                            deadline < 7 ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                                        )}>
                                            <Clock size={12} />
                                            Registration ends in {deadline}d
                                        </div>
                                    )}
                                </div>

                                {/* Stage preview toggle */}
                                <button
                                    onClick={() => toggleExpand(s._id)}
                                    className="flex items-center gap-2 px-5 py-2.5 border-t border-white/5 text-[11px] font-black uppercase tracking-widest text-text-muted hover:text-white hover:bg-white/[0.03] transition-all w-full text-left"
                                >
                                    <Layers size={12} className="text-violet-400" />
                                    Stages
                                    <span className="ml-auto">{isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}</span>
                                </button>

                                {/* Stage chips */}
                                {isExpanded && (
                                    <div className="px-5 pb-3 pt-1 border-t border-white/5 bg-black/10 space-y-2">
                                        {stagePrev === 'loading' ? (
                                            <div className="flex items-center gap-2 py-2">
                                                <Loader2 size={12} className="animate-spin text-primary" />
                                                <span className="text-[11px] text-text-muted">Loading stages…</span>
                                            </div>
                                        ) : !stagePrev || stagePrev.length === 0 ? (
                                            <div className="flex items-center justify-between py-1">
                                                <span className="text-[11px] text-text-muted">No stages yet.</span>
                                                <button
                                                    onClick={() => navigate(`/admin/leagues/${leagueId}/stages`)}
                                                    className="text-[10px] font-black text-violet-400 hover:text-white uppercase tracking-widest transition-colors"
                                                >
                                                    + Add Stages
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex flex-wrap gap-1.5 py-1">
                                                    {(stagePrev as Stage[]).map(st => (
                                                        <span key={st._id} className={cn(
                                                            'flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-full border uppercase tracking-widest',
                                                            STAGE_TYPE_COLOR[st.stageType] ?? STAGE_TYPE_COLOR.LEAGUE
                                                        )}>
                                                            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', STAGE_STATUS_DOT[st.status] ?? 'bg-white/30')} />
                                                            {STAGE_TYPE_ICON[st.stageType]}
                                                            {st.name}
                                                        </span>
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={() => navigate(`/admin/leagues/${leagueId}/stages`)}
                                                    className="text-[10px] font-black text-violet-400 hover:text-white uppercase tracking-widest transition-colors"
                                                >
                                                    Manage Stages →
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Actions footer */}
                                <div className="p-2 border-t border-white/5 bg-black/20 flex gap-2">
                                    {s.status === 'PLANNED' && (
                                        <button onClick={() => activate(s._id)}
                                            className="flex-1 flex justify-center items-center gap-1.5 py-2 rounded-lg text-[11px] font-bold text-green-400 bg-white/5 hover:bg-green-500/15 transition-colors">
                                            <Play size={12} /> Activate
                                        </button>
                                    )}
                                    {s.status === 'ONGOING' && (
                                        <button onClick={() => close(s._id)}
                                            className="flex-1 flex justify-center items-center gap-1.5 py-2 rounded-lg text-[11px] font-bold text-amber-400 bg-white/5 hover:bg-amber-500/15 transition-colors">
                                            <CheckSquare size={12} /> Close
                                        </button>
                                    )}
                                    <button onClick={() => del(s._id)}
                                        className="w-10 flex justify-center items-center rounded-lg text-text-muted bg-white/5 hover:bg-red-500/15 hover:text-red-400 transition-colors shrink-0">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
