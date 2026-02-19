import { useState, useEffect, useCallback } from 'react';
import {
    Calendar, Plus, Loader2, Play, CheckSquare, Trash2, Search,
    AlertTriangle, ChevronRight, Clock, RefreshCw, X, Flag,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { leagueService, type League } from '../../../services/leagueService';
import { seasonService, type Season } from '../../../services/seasonService';
import { leagueRulesService, type LeagueRule } from '../../../services/leagueRulesService';

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
    PLANNED:  'bg-gray-500/15 text-gray-300 border-gray-500/25',
    ONGOING:  'bg-green-500/15 text-green-400 border-green-500/25',
    FINISHED: 'bg-white/5 text-text-muted border-white/10',
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

interface CreateForm {
    leagueId: string;
    rulesId: string;
    name: string;
    registrationDeadline: string;
    startDate: string;
    endDate: string;
}

const EMPTY_FORM: CreateForm = {
    leagueId: '',
    rulesId: '',
    name: '',
    registrationDeadline: '',
    startDate: '',
    endDate: '',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SeasonsPage() {
    const [leagues, setLeagues] = useState<League[]>([]);
    const [rules, setRules] = useState<LeagueRule[]>([]);
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [filterLeague, setFilterLeague] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
    const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

    const notify = (msg: string, type: 'ok' | 'err') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [lgs, rls] = await Promise.all([
                leagueService.getAllLeagues(),
                leagueRulesService.getAll(),
            ]);
            setLeagues(lgs);
            setRules(rls);
            // Load seasons for first league or selected
            if (lgs.length) {
                const target = filterLeague || lgs[0]._id;
                const sns = await seasonService.getByLeague(target);
                setSeasons(sns);
                if (!filterLeague) setFilterLeague(target);
            }
        } catch (e) {
            notify(apiErr(e), 'err');
        } finally {
            setLoading(false);
        }
    }, [filterLeague]);

    useEffect(() => { loadAll(); }, []); // eslint-disable-line

    const loadSeasons = useCallback(async (lid: string) => {
        try {
            const sns = await seasonService.getByLeague(lid);
            setSeasons(sns);
        } catch (e) {
            notify(apiErr(e), 'err');
        }
    }, []);

    const handleLeagueChange = (lid: string) => {
        setFilterLeague(lid);
        loadSeasons(lid);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await seasonService.create(form);
            notify('Season created!', 'ok');
            setShowForm(false);
            setForm(EMPTY_FORM);
            loadSeasons(form.leagueId);
        } catch (e) { notify(apiErr(e), 'err'); }
        finally { setCreating(false); }
    };

    const activate = async (id: string) => {
        try {
            await seasonService.activate(id);
            notify('Season activated!', 'ok');
            loadSeasons(filterLeague);
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    const close = async (id: string) => {
        if (!confirm('Close this season? This cannot be undone.')) return;
        try {
            await seasonService.close(id);
            notify('Season closed.', 'ok');
            loadSeasons(filterLeague);
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    const del = async (id: string) => {
        if (!confirm('Delete season permanently?')) return;
        try {
            await seasonService.delete(id);
            notify('Season deleted.', 'ok');
            loadSeasons(filterLeague);
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    const filtered = seasons.filter(s =>
        !search || s.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {toast && <Toast {...toast} />}

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                        <span>League Hub</span>
                        <ChevronRight size={12} />
                        <span className="text-white font-semibold">Seasons</span>
                    </div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <Calendar size={24} className="text-amber-400" />
                        Seasons Manager
                    </h1>
                    <p className="text-text-muted text-sm mt-1">
                        Create and manage competition seasons. Each season needs a league and a rule set.
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(v => !v)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-black bg-green-400 hover:bg-green-300 transition-all shrink-0"
                >
                    {showForm ? <X size={16} /> : <Plus size={16} />}
                    {showForm ? 'Cancel' : 'New Season'}
                </button>
            </div>

            {/* Create form */}
            {showForm && (
                <form onSubmit={handleCreate} className="bg-surface/60 border border-white/8 rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Create New Season</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">League *</label>
                            <select value={form.leagueId} onChange={e => setForm(f => ({ ...f, leagueId: e.target.value }))}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none" required>
                                <option value="">Select league…</option>
                                {leagues.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Rules *</label>
                            <select value={form.rulesId} onChange={e => setForm(f => ({ ...f, rulesId: e.target.value }))}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none" required>
                                <option value="">Select rules…</option>
                                {rules.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Season Name *</label>
                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="e.g. Spring Split 2026"
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted focus:border-green-500/50 outline-none" required />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Registration Deadline</label>
                            <input type="date" value={form.registrationDeadline} onChange={e => setForm(f => ({ ...f, registrationDeadline: e.target.value }))}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Start Date</label>
                            <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">End Date</label>
                            <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none" />
                        </div>
                    </div>
                    <button type="submit" disabled={creating}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-black bg-green-400 hover:bg-green-300 disabled:opacity-50 transition-all">
                        {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        Create Season
                    </button>
                </form>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <select value={filterLeague} onChange={e => handleLeagueChange(e.target.value)}
                    className="bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none">
                    {leagues.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                </select>
                <div className="relative flex-1 max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search seasons…"
                        className="w-full pl-9 pr-3 py-2 bg-surface border border-white/10 rounded-xl text-sm text-white placeholder-text-muted focus:border-green-500/50 outline-none" />
                </div>
                <button onClick={() => loadSeasons(filterLeague)} className="p-2 rounded-xl border border-white/10 hover:bg-white/5 text-text-muted hover:text-white transition-all">
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-green-400" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Calendar size={40} className="text-text-muted mb-4 opacity-50" />
                    <p className="text-text-muted font-semibold">No seasons yet</p>
                    <p className="text-text-muted text-sm mt-1">Create your first season for this league</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(s => {
                        const deadline = s.registrationDeadline ? daysLeft(s.registrationDeadline) : null;
                        return (
                            <div key={s._id} className="bg-surface/60 border border-white/8 rounded-2xl p-4 hover:border-white/15 transition-all">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                                        <Calendar size={18} className="text-amber-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <h3 className="text-white font-bold text-sm">{s.name}</h3>
                                            <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border', STATUS_STYLE[s.status] || STATUS_STYLE.PLANNED)}>
                                                {s.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-[10px] text-text-muted">
                                            <span className="flex items-center gap-1">
                                                <Flag size={10} />
                                                {fmt(s.startDate)} → {fmt(s.endDate)}
                                            </span>
                                            {deadline !== null && s.status === 'PLANNED' && (
                                                <span className={cn('flex items-center gap-1', deadline < 7 ? 'text-red-400' : 'text-amber-400')}>
                                                    <Clock size={10} />
                                                    Reg. deadline in {deadline}d
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {s.status === 'PLANNED' && (
                                            <button onClick={() => activate(s._id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-green-400 border border-green-500/30 hover:bg-green-500/10 transition-all">
                                                <Play size={12} /> Activate
                                            </button>
                                        )}
                                        {s.status === 'ONGOING' && (
                                            <button onClick={() => close(s._id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-all">
                                                <CheckSquare size={12} /> Close
                                            </button>
                                        )}
                                        <button onClick={() => del(s._id)}
                                            className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all border border-white/5 hover:border-red-500/20">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
