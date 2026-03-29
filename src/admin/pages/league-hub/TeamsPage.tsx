import { useState, useEffect } from 'react';
import {
    Users, Plus, Loader2, Search, AlertTriangle, CheckSquare,
    ChevronRight, RefreshCw, X, ShieldOff, UserMinus,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { leagueService, type League } from '../../../services/leagueService';
import { seasonService, type Season } from '../../../services/seasonService';
import { seasonTeamService, type SeasonTeam } from '../../../services/seasonTeamService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const apiErr = (e: unknown) => {
    const err = e as { response?: { data?: { message?: string } } };
    return err?.response?.data?.message || 'Something went wrong';
};

const STATUS_STYLE: Record<string, string> = {
    ACTIVE:        'bg-green-500/15 text-green-400 border-green-500/25',
    WITHDRAWN:     'bg-gray-500/15 text-gray-300 border-gray-500/25',
    DISQUALIFIED:  'bg-red-500/15 text-red-400 border-red-500/25',
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

export default function TeamsPage() {
    const [leagues, setLeagues]     = useState<League[]>([]);
    const [seasons, setSeasons]     = useState<Season[]>([]);
    const [teams, setTeams]         = useState<SeasonTeam[]>([]);
    const [selLeague, setSelLeague] = useState('');
    const [selSeason, setSelSeason] = useState('');
    const [search, setSearch]       = useState('');
    const [loading, setLoading]     = useState(true);
    const [showReg, setShowReg]     = useState(false);
    const [regTeamId, setRegTeamId] = useState('');
    const [registering, setRegistering] = useState(false);
    const [toast, setToast]         = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

    const notify = (msg: string, type: 'ok' | 'err') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
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
                        setTeams(await seasonTeamService.getBySeason(sns[0]._id));
                    }
                }
            } catch (e) { notify(apiErr(e), 'err'); }
            finally { setLoading(false); }
        })();
    }, []);

    const loadTeams = async (sid: string) => {
        try { setTeams(await seasonTeamService.getBySeason(sid)); }
        catch (e) { notify(apiErr(e), 'err'); }
    };

    const onLeagueChange = async (lid: string) => {
        setSelLeague(lid); setSelSeason(''); setTeams([]);
        const sns = await seasonService.getByLeague(lid);
        setSeasons(sns);
        if (sns.length) { setSelSeason(sns[0]._id); loadTeams(sns[0]._id); }
    };

    const onSeasonChange = (sid: string) => { setSelSeason(sid); loadTeams(sid); };

    const register = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selSeason) return notify('Select a season first', 'err');
        setRegistering(true);
        try {
            await seasonTeamService.register({ teamId: regTeamId, seasonId: selSeason });
            notify('Team registered!', 'ok');
            setShowReg(false);
            setRegTeamId('');
            loadTeams(selSeason);
        } catch (e) { notify(apiErr(e), 'err'); }
        finally { setRegistering(false); }
    };

    const withdraw = async (id: string) => {
        if (!confirm('Withdraw this team from the season?')) return;
        try {
            await seasonTeamService.withdraw(id);
            notify('Team withdrawn.', 'ok');
            loadTeams(selSeason);
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    const disqualify = async (id: string) => {
        if (!confirm('Disqualify this team? This may affect standings.')) return;
        try {
            await seasonTeamService.disqualify(id);
            notify('Team disqualified.', 'ok');
            loadTeams(selSeason);
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    const filtered = teams.filter(t => {
        const name = typeof t.teamId === 'object' && t.teamId !== null && 'name' in t.teamId
            ? (t.teamId as { name: string }).name : String(t.teamId);
        return !search || name.toLowerCase().includes(search.toLowerCase());
    });

    const teamName = (t: unknown) => {
        if (typeof t === 'object' && t !== null && 'name' in t) return (t as { name: string }).name;
        return String(t).slice(-8);
    };

    const teamLogo = (t: unknown) => {
        if (typeof t === 'object' && t !== null && 'logo' in t) return (t as { logo: string }).logo;
        return null;
    };

    const activeCnt    = teams.filter(t => t.status === 'ACTIVE').length;
    const withdrawnCnt = teams.filter(t => t.status === 'WITHDRAWN').length;
    const disqCnt      = teams.filter(t => t.status === 'DISQUALIFIED').length;

    return (
        <div className="space-y-6">
            {toast && <Toast {...toast} />}

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                        <span>League Hub</span>
                        <ChevronRight size={12} />
                        <span className="text-white font-semibold">Teams</span>
                    </div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <Users size={24} className="text-cyan-400" />
                        Teams Manager
                    </h1>
                    <p className="text-text-muted text-sm mt-1">
                        Register teams for a season and manage their enrollment status.
                    </p>
                </div>
                <button onClick={() => setShowReg(v => !v)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-black bg-green-400 hover:bg-green-300 transition-all shrink-0">
                    {showReg ? <X size={16} /> : <Plus size={16} />}
                    {showReg ? 'Cancel' : 'Register Team'}
                </button>
            </div>

            {/* Register form */}
            {showReg && (
                <form onSubmit={register} className="bg-surface/60 border border-white/8 rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Register Team for Season</h3>
                    <div className="flex gap-3">
                        <input value={regTeamId} onChange={e => setRegTeamId(e.target.value)}
                            placeholder="Team ID (from Teams service)…"
                            className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted focus:border-green-500/50 outline-none" required />
                        <button type="submit" disabled={registering}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm text-black bg-green-400 hover:bg-green-300 disabled:opacity-50 transition-all shrink-0">
                            {registering ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            Register
                        </button>
                    </div>
                </form>
            )}

            {/* Stats */}
            {teams.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Active', val: activeCnt, color: 'text-green-400' },
                        { label: 'Withdrawn', val: withdrawnCnt, color: 'text-gray-400' },
                        { label: 'Disqualified', val: disqCnt, color: 'text-red-400' },
                    ].map(s => (
                        <div key={s.label} className="bg-surface/40 border border-white/8 rounded-xl p-3 text-center">
                            <p className={cn('text-2xl font-black', s.color)}>{s.val}</p>
                            <p className="text-text-muted text-[10px] uppercase tracking-widest">{s.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <select value={selLeague} onChange={e => onLeagueChange(e.target.value)}
                    className="bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none">
                    {leagues.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                </select>
                <select value={selSeason} onChange={e => onSeasonChange(e.target.value)}
                    className="bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none">
                    {seasons.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                <div className="relative flex-1 max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teams…"
                        className="w-full pl-9 pr-3 py-2 bg-surface border border-white/10 rounded-xl text-sm text-white placeholder-text-muted focus:border-green-500/50 outline-none" />
                </div>
                <button onClick={() => selSeason && loadTeams(selSeason)}
                    className="p-2 rounded-xl border border-white/10 hover:bg-white/5 text-text-muted hover:text-white transition-all">
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Team list */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-green-400" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Users size={40} className="text-text-muted mb-4 opacity-50" />
                    <p className="text-text-muted font-semibold">No teams registered</p>
                    <p className="text-text-muted text-sm mt-1">Register the first team for this season</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filtered.map(t => {
                        const logo = teamLogo(t.teamId);
                        const name = teamName(t.teamId);
                        return (
                            <div key={t._id} className="bg-surface/60 border border-white/8 rounded-2xl p-4 hover:border-white/15 transition-all group">
                                <div className="flex items-center gap-3 mb-3">
                                    {logo ? (
                                        <img src={logo} alt={name} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-black text-sm">
                                            {name[0]?.toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-bold text-sm truncate">{name}</p>
                                        <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border', STATUS_STYLE[t.status] || STATUS_STYLE.ACTIVE)}>
                                            {t.status}
                                        </span>
                                    </div>
                                </div>

                                {t.status === 'ACTIVE' && (
                                    <div className="flex gap-2">
                                        <button onClick={() => withdraw(t._id)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-all">
                                            <UserMinus size={11} /> Withdraw
                                        </button>
                                        <button onClick={() => disqualify(t._id)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all">
                                            <ShieldOff size={11} /> Disqualify
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
