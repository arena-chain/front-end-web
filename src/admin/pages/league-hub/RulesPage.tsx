import { useState, useEffect } from 'react';
import {
    BookOpen, Plus, Loader2, Trash2, Search, AlertTriangle,
    CheckSquare, ChevronRight, RefreshCw, X, Gamepad2,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { leagueRulesService, type LeagueRule, type FormatType, type MatchType, type Tiebreaker } from '../../../services/leagueRulesService';
import catalogService from '../../../services/catalogService';
import type { Game } from '../../../models/game';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const apiErr = (e: unknown) => {
    const err = e as { response?: { data?: { message?: string } } };
    return err?.response?.data?.message || 'Something went wrong';
};

const FORMAT_COLORS: Record<string, string> = {
    LEAGUE: 'bg-green-500/15 text-green-400 border-green-500/25',
    GROUPS: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    SWISS:  'bg-purple-500/15 text-purple-400 border-purple-500/25',
    LADDER: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
};
const MATCH_COLORS: Record<string, string> = {
    BO1: 'bg-white/5 text-text-muted border-white/10',
    BO3: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
    BO5: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
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
    name: string;
    gameId: string;
    formatType: FormatType;
    matchType: MatchType;
    pointsWin: number;
    pointsLoss: number;
    maxTeams: number;
    maxForfeitsBeforeDisqualification: number;
    tiebreaker: Tiebreaker;
}

const EMPTY: CreateForm = {
    name: '',
    gameId: '',
    formatType: 'LEAGUE',
    matchType: 'BO3',
    pointsWin: 3,
    pointsLoss: 0,
    maxTeams: 10,
    maxForfeitsBeforeDisqualification: 3,
    tiebreaker: 'GAME_DIFF',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RulesPage() {
    const [rules, setRules] = useState<LeagueRule[]>([]);
    const [games, setGames] = useState<Game[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<CreateForm>(EMPTY);
    const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

    const notify = (msg: string, type: 'ok' | 'err') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const load = async () => {
        setLoading(true);
        try {
            const [rls, gms] = await Promise.all([
                leagueRulesService.getAll(),
                catalogService.fetchGames(),
            ]);
            setRules(rls);
            setGames(gms);
        } catch (e) { notify(apiErr(e), 'err'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await leagueRulesService.create({ ...form, pointsDraw: 0 });
            notify('Rule template created!', 'ok');
            setShowForm(false);
            setForm(EMPTY);
            load();
        } catch (e) { notify(apiErr(e), 'err'); }
        finally { setCreating(false); }
    };

    const del = async (id: string) => {
        if (!confirm('Delete this rule template?')) return;
        try {
            await leagueRulesService.delete(id);
            notify('Rule deleted.', 'ok');
            load();
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    const filtered = rules.filter(r =>
        !search || r.name.toLowerCase().includes(search.toLowerCase())
    );

    const f = (field: keyof CreateForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const numFields = ['pointsWin', 'pointsDraw', 'pointsLoss', 'maxTeams', 'maxForfeitsBeforeDisqualification'];
        const val = numFields.includes(field) ? Number(e.target.value) : e.target.value;
        setForm(prev => ({ ...prev, [field]: val } as CreateForm));
    };

    return (
        <div className="space-y-6">
            {toast && <Toast {...toast} />}

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                        <span>League Hub</span>
                        <ChevronRight size={12} />
                        <span className="text-white font-semibold">Rules</span>
                    </div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <BookOpen size={24} className="text-blue-400" />
                        Rules Manager
                    </h1>
                    <p className="text-text-muted text-sm mt-1">
                        Reusable rule templates. Define format, match type, points, and tiebreakers.
                    </p>
                </div>
                <button onClick={() => setShowForm(v => !v)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-black bg-green-400 hover:bg-green-300 transition-all shrink-0">
                    {showForm ? <X size={16} /> : <Plus size={16} />}
                    {showForm ? 'Cancel' : 'New Rule'}
                </button>
            </div>

            {/* Create form */}
            {showForm && (
                <form onSubmit={handleCreate} className="bg-surface/60 border border-white/8 rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Create Rule Template</h3>
                    <div className="grid md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Name *</label>
                            <input value={form.name} onChange={f('name')} placeholder="e.g. Valorant Standard BO3"
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted focus:border-green-500/50 outline-none" required />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Game *</label>
                            <div className="relative">
                                <select
                                    value={form.gameId}
                                    onChange={f('gameId')}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-green-500/50 outline-none appearance-none"
                                    required
                                >
                                    <option value="">Select game…</option>
                                    {games.map(g => (
                                        <option key={g._id} value={g._id}>{g.title}</option>
                                    ))}
                                </select>
                                {/* Show selected game icon */}
                                {form.gameId ? (
                                    (() => {
                                        const g = games.find(g => g._id === form.gameId);
                                        return g?.logoUrl || g?.coverImageUrl ? (
                                            <img src={g.logoUrl || g.coverImageUrl} alt={g.title}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded object-cover pointer-events-none" />
                                        ) : (
                                            <Gamepad2 size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                        );
                                    })()
                                ) : (
                                    <Gamepad2 size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Format</label>
                            <select value={form.formatType} onChange={f('formatType')}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none">
                                {['LEAGUE','GROUPS','SWISS','LADDER'].map(v => <option key={v}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Match Type</label>
                            <select value={form.matchType} onChange={f('matchType')}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none">
                                {['BO1','BO3','BO5'].map(v => <option key={v}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Tiebreaker</label>
                            <select value={form.tiebreaker} onChange={f('tiebreaker')}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none">
                                {['GAME_DIFF','HEAD_TO_HEAD','WIN_RATE'].map(v => <option key={v}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Points — Win</label>
                            <input type="number" value={form.pointsWin} onChange={f('pointsWin')} min={0}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Points — Loss</label>
                            <input type="number" value={form.pointsLoss} onChange={f('pointsLoss')} min={0}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Max Teams</label>
                            <input type="number" value={form.maxTeams} onChange={f('maxTeams')} min={2}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Max Forfeits</label>
                            <input type="number" value={form.maxForfeitsBeforeDisqualification} onChange={f('maxForfeitsBeforeDisqualification')} min={1}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none" />
                        </div>
                    </div>
                    <button type="submit" disabled={creating}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-black bg-green-400 hover:bg-green-300 disabled:opacity-50 transition-all">
                        {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        Create Rule
                    </button>
                </form>
            )}

            {/* Search + refresh */}
            <div className="flex gap-3">
                <div className="relative flex-1 max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rules…"
                        className="w-full pl-9 pr-3 py-2 bg-surface border border-white/10 rounded-xl text-sm text-white placeholder-text-muted focus:border-green-500/50 outline-none" />
                </div>
                <button onClick={load} className="p-2 rounded-xl border border-white/10 hover:bg-white/5 text-text-muted hover:text-white transition-all">
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-green-400" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <BookOpen size={40} className="text-text-muted mb-4 opacity-50" />
                    <p className="text-text-muted font-semibold">No rules yet</p>
                    <p className="text-text-muted text-sm mt-1">Create your first rule template to link to seasons</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map(r => {
                        const gId = typeof r.gameId === 'object' ? (r.gameId as { _id: string })._id : r.gameId;
                        const gameObj = typeof r.gameId === 'object'
                            ? r.gameId as { _id: string; title: string }
                            : null;
                        const game = games.find(g => g._id === gId);
                        const gameTitle = gameObj?.title ?? game?.title ?? 'Unknown Game';
                        const cover = game?.coverImageUrl;
                        const logo = game?.logoUrl;
                        const genre = game?.genre;

                        return (
                            <div key={r._id} className="rounded-2xl border border-white/8 overflow-hidden hover:border-white/20 transition-all group bg-surface/60">

                                {/* Game banner header */}
                                <div className="relative h-24 overflow-hidden">
                                    {cover ? (
                                        <img src={cover} alt={gameTitle}
                                            className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-black" />
                                    )}
                                    {/* Dark vignette */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                                    {/* Delete btn */}
                                    <button onClick={() => del(r._id)}
                                        className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 bg-black/60 text-text-muted hover:text-red-400 transition-all border border-white/10 hover:border-red-500/30">
                                        <Trash2 size={13} />
                                    </button>

                                    {/* Game identity bottom-left */}
                                    <div className="absolute bottom-2 left-3 flex items-center gap-2">
                                        {logo ? (
                                            <img src={logo} alt={gameTitle}
                                                className="w-7 h-7 rounded-lg object-contain bg-black/40 border border-white/10 p-0.5" />
                                        ) : (
                                            <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/20 flex items-center justify-center">
                                                <Gamepad2 size={13} className="text-blue-400" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-white font-black text-xs leading-tight drop-shadow">{gameTitle}</p>
                                            {genre && <p className="text-white/50 text-[9px] uppercase tracking-widest">{genre}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Card body */}
                                <div className="p-4 space-y-3">
                                    {/* Rule name */}
                                    <p className="text-white font-bold text-sm leading-tight">{r.name}</p>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-1.5">
                                        <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border', FORMAT_COLORS[r.formatType] || FORMAT_COLORS.LEAGUE)}>
                                            {r.formatType}
                                        </span>
                                        <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border', MATCH_COLORS[r.matchType] || MATCH_COLORS.BO3)}>
                                            {r.matchType}
                                        </span>
                                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border bg-white/5 text-text-muted border-white/10">
                                            {r.tiebreaker}
                                        </span>
                                    </div>

                                    {/* Points grid */}
                                    <div className="grid grid-cols-3 gap-1.5">
                                    {[
                                        { label: 'Win', val: r.pointsWin, color: 'text-green-400' },
                                        { label: 'Loss', val: r.pointsLoss, color: 'text-red-400' },
                                    ].map(p => (
                                            <div key={p.label} className="bg-black/30 rounded-lg p-2 text-center border border-white/5">
                                                <p className={cn('font-black text-sm', p.color)}>{p.val}</p>
                                                <p className="text-text-muted text-[9px] uppercase tracking-widest">{p.label}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Footer meta */}
                                    <div className="flex items-center justify-between text-[10px] text-text-muted pt-1 border-t border-white/5">
                                        <span>{r.maxTeams} teams max</span>
                                        <span>{r.maxForfeitsBeforeDisqualification ?? '—'} forfeit limit</span>
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
