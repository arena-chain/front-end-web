import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Trophy, Plus, ArrowLeft, Globe, Calendar, ChevronRight,
    PlayCircle, CheckCircle, Clock, Edit2, Trash2, Users,
    Layers, BookOpen, Flag, Swords, GitBranch, DollarSign,
    AlertTriangle, RefreshCw, Zap,
} from 'lucide-react';
import { leagueService, type League } from '../../../services/leagueService';
import { seasonService, type Season } from '../../../services/seasonService';
import { getSeasonTeams, getSeasonRule, getPrizePool, getStages, getAdminRounds, getAdminBracket, apiErr } from '../../../services/adminLeagueService';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SeasonHealth {
    hasRules: boolean; hasPrize: boolean; hasTeams: boolean;
    hasStages: boolean; hasRounds: boolean; hasBracket: boolean;
    teamCount: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const LEVEL_CLS: Record<string, { pill: string; hex: string }> = {
    INTERNATIONAL: { pill: 'bg-purple-500/15 text-purple-300 border-purple-500/25', hex: '#a855f7' },
    CONTINENTAL:   { pill: 'bg-blue-500/15 text-blue-300 border-blue-500/25',       hex: '#3b82f6' },
    NATIONAL:      { pill: 'bg-green-500/15 text-green-300 border-green-500/25',     hex: '#22c55e' },
    REGIONAL:      { pill: 'bg-gray-500/15 text-gray-400 border-gray-500/25',        hex: '#6b7280' },
};

const STATUS_CLS: Record<string, string> = {
    PLANNED:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
    ONGOING:  'bg-green-500/10 text-green-400 border-green-500/20',
    FINISHED: 'bg-white/5 text-gray-400 border-white/10',
};

function healthScore(h: SeasonHealth): number {
    const flags = [h.hasRules, h.hasPrize, h.hasTeams, h.hasStages, h.hasRounds];
    return Math.round((flags.filter(Boolean).length / flags.length) * 100);
}

// ─── Season Card ──────────────────────────────────────────────────────────────
function SeasonCard({ season, health, onManage, onDelete }: {
    season: Season; health: SeasonHealth | null;
    onManage: () => void; onDelete: () => void;
}) {
    const score   = health ? healthScore(health) : 0;
    const pct     = health ? score : null;
    const barColor = score === 100 ? 'bg-green-500' : score > 50 ? 'bg-yellow-500' : 'bg-red-500';

    const checks = health ? [
        { label: 'Rules',    done: health.hasRules },
        { label: 'Prize',    done: health.hasPrize },
        { label: 'Teams',    done: health.hasTeams,   extra: health.teamCount ? `${health.teamCount}` : undefined },
        { label: 'Stages',   done: health.hasStages },
        { label: 'Rounds',   done: health.hasRounds },
        { label: 'Bracket',  done: health.hasBracket },
    ] : [];

    return (
        <div className="bg-[#13161e] border border-white/8 rounded-2xl p-5 flex flex-col gap-4 hover:border-white/15 transition-all group">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-white font-bold text-sm truncate">{season.name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_CLS[season.status]}`}>
                            {season.status === 'ONGOING'  && <PlayCircle  className="inline w-2.5 h-2.5 mr-0.5" />}
                            {season.status === 'PLANNED'  && <Clock       className="inline w-2.5 h-2.5 mr-0.5" />}
                            {season.status === 'FINISHED' && <CheckCircle className="inline w-2.5 h-2.5 mr-0.5" />}
                            {season.status}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" /> {fmt(season.startDate)} → {fmt(season.endDate)}
                    </p>
                </div>
                <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Setup progress */}
            {health && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-500 font-medium uppercase tracking-wider">Setup Progress</span>
                        <span className={`font-bold ${score === 100 ? 'text-green-400' : score > 50 ? 'text-yellow-400' : 'text-red-400'}`}>{pct}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                        {checks.map(c => (
                            <span key={c.label} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${c.done ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/3 text-gray-600 border-white/8'}`}>
                                {c.done ? '✓' : '○'} {c.label}{c.extra ? ` (${c.extra})` : ''}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <button onClick={onManage} className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-[11px] font-bold text-gray-400 hover:bg-[#00ff00]/10 hover:border-[#00ff00]/25 hover:text-[#00ff00] transition-all uppercase tracking-wider">
                <span className="flex items-center gap-2"><Zap className="w-3.5 h-3.5" /> Open Workspace</span>
                <ChevronRight className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

// ─── Create Season Modal ──────────────────────────────────────────────────────
function CreateSeasonModal({ leagueId, onClose, onCreated }: { leagueId: string; onClose: () => void; onCreated: (s: Season) => void }) {
    const [form, setForm] = useState({ name: '', startDate: '', endDate: '', registrationDeadline: '', description: '' });
    const [busy, setBusy] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        try {
            const s = await seasonService.create({ ...form, leagueId });
            toast.success('Season created!');
            onCreated(s as Season);
        } catch (err) { toast.error(apiErr(err)); }
        finally { setBusy(false); }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#13161e] border border-white/10 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-white font-black uppercase tracking-tight mb-5">New Season</h2>
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-400 font-medium mb-1 block">Season Name <span className="text-red-400">*</span></label>
                        <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                            placeholder="e.g. Spring Split 2026"
                            className="w-full bg-[#1a1e28] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff00]/40" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-gray-400 font-medium mb-1 block">Start Date <span className="text-red-400">*</span></label>
                            <input type="date" required value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                                className="w-full bg-[#1a1e28] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff00]/40" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-medium mb-1 block">End Date <span className="text-red-400">*</span></label>
                            <input type="date" required value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                                className="w-full bg-[#1a1e28] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff00]/40" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 font-medium mb-1 block">Registration Deadline <span className="text-red-400">*</span></label>
                        <input type="date" required value={form.registrationDeadline} onChange={e => setForm(p => ({ ...p, registrationDeadline: e.target.value }))}
                            className="w-full bg-[#1a1e28] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff00]/40" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 font-medium mb-1 block">Description</label>
                        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
                            className="w-full bg-[#1a1e28] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff00]/40 resize-none" />
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                        <button type="submit" disabled={busy} className="flex-1 py-2.5 rounded-xl bg-[#00ff00] text-black font-bold text-sm hover:bg-[#00ff00]/90 transition-colors disabled:opacity-50">
                            {busy ? 'Creating…' : 'Create Season'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Edit League Modal ────────────────────────────────────────────────────────
function EditLeagueModal({ league, onClose, onSaved }: { league: League; onClose: () => void; onSaved: (l: League) => void }) {
    const [form, setForm] = useState({ name: league.name, description: league.description || '', logoUrl: league.logoUrl || '' });
    const [busy, setBusy] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        try {
            const updated = await leagueService.updateLeague(league._id, form);
            toast.success('League updated');
            onSaved(updated as League);
        } catch (err) { toast.error(apiErr(err)); }
        finally { setBusy(false); }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#13161e] border border-white/10 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-white font-black uppercase tracking-tight mb-5">Edit League</h2>
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-400 font-medium mb-1 block">Name</label>
                        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
                            className="w-full bg-[#1a1e28] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff00]/40" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 font-medium mb-1 block">Logo URL</label>
                        <input value={form.logoUrl} onChange={e => setForm(p => ({ ...p, logoUrl: e.target.value }))}
                            className="w-full bg-[#1a1e28] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff00]/40" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 font-medium mb-1 block">Description</label>
                        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} 
                            className="w-full bg-[#1a1e28] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff00]/40 resize-none" />
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                        <button type="submit" disabled={busy} className="flex-1 py-2.5 rounded-xl bg-[#00ff00] text-black font-bold text-sm hover:bg-[#00ff00]/90 transition-colors disabled:opacity-50">
                            {busy ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminLeagueHubV2() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [league, setLeague]     = useState<League | null>(null);
    const [seasons, setSeasons]   = useState<Season[]>([]);
    const [healthMap, setHealthMap] = useState<Record<string, SeasonHealth | null>>({});
    const [loading, setLoading]   = useState(true);
    const [showNewSeason, setShowNewSeason] = useState(false);
    const [showEditLeague, setShowEditLeague] = useState(false);

    const load = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [lg, ss] = await Promise.all([
                leagueService.getLeagueById(id),
                seasonService.getByLeague(id).catch(() => [] as Season[]),
            ]);
            setLeague(lg as League);
            setSeasons(ss as Season[]);
            // Load health for each season in parallel
            const healths = await Promise.all((ss as Season[]).map(async (s) => {
                try {
                    const [rule, prize, teams, stages, rounds, bracket] = await Promise.all([
                        getSeasonRule(s._id),
                        getPrizePool(s._id),
                        getSeasonTeams(s._id),
                        getStages(s._id),
                        getAdminRounds(s._id),
                        getAdminBracket(s._id),
                    ]);
                    return [s._id, {
                        hasRules: !!rule, hasPrize: !!prize,
                        hasTeams: teams.length > 0, teamCount: teams.length,
                        hasStages: stages.length > 0, hasRounds: rounds.length > 0,
                        hasBracket: !!bracket,
                    } as SeasonHealth] as const;
                } catch { return [s._id, null] as const; }
            }));
            setHealthMap(Object.fromEntries(healths));
        } catch (err) { toast.error(apiErr(err)); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, [id]);

    const handleDeleteSeason = async (s: Season) => {
        if (!confirm(`Delete season "${s.name}"? This cannot be undone.`)) return;
        try {
            await seasonService.delete(s._id);
            toast.success('Season deleted');
            setSeasons(prev => prev.filter(x => x._id !== s._id));
        } catch (err) { toast.error(apiErr(err)); }
    };

    const lc = league ? (LEVEL_CLS[league.level] || LEVEL_CLS.REGIONAL) : LEVEL_CLS.REGIONAL;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                <RefreshCw className="w-6 h-6 animate-spin mr-3" /> Loading league…
            </div>
        );
    }

    if (!league) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <AlertTriangle className="w-10 h-10 mb-3 opacity-30" />
                <p>League not found.</p>
                <button onClick={() => navigate('/admin/leagues')} className="mt-4 text-sm text-[#00ff00] hover:underline">Back to leagues</button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* ── League Header ─────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-start gap-5">
                {/* Back */}
                <button onClick={() => navigate('/admin/leagues')} className="hidden md:flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors mt-1 shrink-0">
                    <ArrowLeft className="w-3.5 h-3.5" /> All Leagues
                </button>

                <div className="flex-1 flex items-start gap-4">
                    {/* Logo */}
                    <div className="w-16 h-16 rounded-2xl bg-[#1a1e28] border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {league.logoUrl
                            ? <img src={league.logoUrl} alt={league.name} className="w-full h-full object-contain p-1" />
                            : <Trophy className="w-8 h-8 text-[#00ff00]/40" />
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${lc.pill}`}>{league.level}</span>
                            {league.regionId && <span className="text-[10px] text-gray-500 flex items-center gap-1 font-medium"><Globe className="w-3 h-3" /> {league.regionId}</span>}
                        </div>
                        <h1 className="text-2xl font-black uppercase tracking-tight text-white leading-tight">{league.name}</h1>
                        {league.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{league.description}</p>}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setShowEditLeague(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => setShowNewSeason(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00ff00] text-black text-xs font-black uppercase tracking-widest hover:bg-[#00ff00]/90 transition-all">
                        <Plus className="w-3.5 h-3.5" /> New Season
                    </button>
                </div>
            </div>

            {/* ── Quick stats ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { icon: <Calendar className="w-4 h-4" />, label: 'Total Seasons', val: seasons.length, color: 'text-white' },
                    { icon: <PlayCircle className="w-4 h-4" />, label: 'Active Seasons', val: seasons.filter(s => s.status === 'ONGOING').length, color: 'text-green-400' },
                    { icon: <Users className="w-4 h-4" />, label: 'Planned Seasons', val: seasons.filter(s => s.status === 'PLANNED').length, color: 'text-blue-400' },
                ].map(s => (
                    <div key={s.label} className="bg-[#13161e] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                        <span className={`opacity-60 ${s.color}`}>{s.icon}</span>
                        <div>
                            <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Workflow guide ────────────────────────────────────────────── */}
            <div className="bg-[#13161e] border border-[#00ff00]/15 rounded-2xl p-5">
                <p className="text-xs font-black text-[#00ff00] uppercase tracking-widest mb-3 flex items-center gap-2"><Zap className="w-3.5 h-3.5" /> How to set up a season</p>
                <div className="flex flex-wrap gap-2 text-[10px] text-gray-400">
                    {[
                        { n: 1, icon: <BookOpen className="w-3 h-3" />, label: 'Set Rules' },
                        { n: 2, icon: <DollarSign className="w-3 h-3" />, label: 'Prize Pool' },
                        { n: 3, icon: <Users className="w-3 h-3" />, label: 'Register Teams' },
                        { n: 4, icon: <Layers className="w-3 h-3" />, label: 'Create Stages' },
                        { n: 5, icon: <Flag className="w-3 h-3" />, label: 'Generate Rounds' },
                        { n: 6, icon: <PlayCircle className="w-3 h-3" />, label: 'Open Season' },
                        { n: 7, icon: <Swords className="w-3 h-3" />, label: 'Submit Results' },
                        { n: 8, icon: <GitBranch className="w-3 h-3" />, label: 'Generate Bracket' },
                        { n: 9, icon: <CheckCircle className="w-3 h-3" />, label: 'Close Season' },
                    ].map((s, i) => (
                        <div key={s.n} className="flex items-center gap-1">
                            <span className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-full px-2 py-1 font-bold">
                                <span className="text-[#00ff00] font-black">{s.n}</span>
                                {s.icon} {s.label}
                            </span>
                            {i < 8 && <ChevronRight className="w-2.5 h-2.5 text-white/15 flex-shrink-0" />}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Seasons grid ──────────────────────────────────────────────── */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#00ff00]" /> Seasons
                    </h2>
                    <button onClick={load} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                </div>

                {seasons.length === 0 ? (
                    <div className="bg-[#13161e] border-2 border-dashed border-white/8 rounded-2xl p-12 text-center">
                        <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                        <p className="text-white font-bold mb-1">No seasons yet</p>
                        <p className="text-gray-500 text-sm mb-4">Create a season to start setting up your league</p>
                        <button onClick={() => setShowNewSeason(true)} className="px-5 py-2.5 rounded-xl bg-[#00ff00] text-black font-bold text-sm hover:bg-[#00ff00]/90 transition-all">
                            <Plus className="inline w-3.5 h-3.5 mr-1" /> Create First Season
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {seasons.map(s => (
                            <SeasonCard
                                key={s._id}
                                season={s}
                                health={healthMap[s._id] ?? null}
                                onManage={() => navigate(`/admin/leagues/${id}/seasons/${s._id}`)}
                                onDelete={() => handleDeleteSeason(s)}
                            />
                        ))}
                        <button onClick={() => setShowNewSeason(true)} className="border-2 border-dashed border-white/8 rounded-2xl flex flex-col items-center justify-center gap-3 text-gray-500 hover:text-white hover:border-white/20 hover:bg-white/[0.02] transition-all min-h-[220px] group">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#00ff00]/10 group-hover:border-[#00ff00]/30 transition-all">
                                <Plus className="w-5 h-5 group-hover:text-[#00ff00] transition-colors" />
                            </div>
                            <p className="text-[11px] font-black uppercase tracking-widest">New Season</p>
                        </button>
                    </div>
                )}
            </div>

            {/* ── Modals ────────────────────────────────────────────────────── */}
            {showNewSeason && (
                <CreateSeasonModal
                    leagueId={id!}
                    onClose={() => setShowNewSeason(false)}
                    onCreated={s => { setSeasons(p => [...p, s]); setShowNewSeason(false); }}
                />
            )}
            {showEditLeague && (
                <EditLeagueModal
                    league={league}
                    onClose={() => setShowEditLeague(false)}
                    onSaved={l => { setLeague(l); setShowEditLeague(false); }}
                />
            )}
        </div>
    );
}
