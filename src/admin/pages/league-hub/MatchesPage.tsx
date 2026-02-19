import { useState, useEffect } from 'react';
import {
    Swords, Plus, Loader2, Search, AlertTriangle, CheckSquare,
    ChevronRight, RefreshCw, X, XCircle, RotateCcw,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { leagueService, type League } from '../../../services/leagueService';
import { seasonService, type Season } from '../../../services/seasonService';
import { roundService, type Round } from '../../../services/roundService';
import { matchAdminService, type AdminMatch } from '../../../services/matchAdminService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const apiErr = (e: unknown) => {
    const err = e as { response?: { data?: { message?: string } } };
    return err?.response?.data?.message || 'Something went wrong';
};
const fmt = (d: string) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_STYLE: Record<string, string> = {
    SCHEDULED: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
    ONGOING:   'bg-green-500/15 text-green-400 border-green-500/25',
    COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    FORFEIT:   'bg-red-500/15 text-red-400 border-red-500/25',
    CANCELLED: 'bg-white/5 text-text-muted border-white/10',
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

interface ResultModal { matchId: string; homeScore: number; awayScore: number; }
interface ForfeitModal { matchId: string; forfeitingTeamId: string; }

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MatchesPage() {
    const [leagues, setLeagues]     = useState<League[]>([]);
    const [seasons, setSeasons]     = useState<Season[]>([]);
    const [rounds, setRounds]       = useState<Round[]>([]);
    const [matches, setMatches]     = useState<AdminMatch[]>([]);
    const [selLeague, setSelLeague] = useState('');
    const [selSeason, setSelSeason] = useState('');
    const [selRound, setSelRound]   = useState('');
    const [search, setSearch]       = useState('');
    const [loading, setLoading]     = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ team1Id: '', team2Id: '', scheduledStart: '' });
    const [creating, setCreating]   = useState(false);
    const [resultModal, setResultModal] = useState<ResultModal | null>(null);
    const [forfeitModal, setForfeitModal] = useState<ForfeitModal | null>(null);
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
                        const rds = await roundService.getBySeason(sns[0]._id);
                        setRounds(rds);
                        if (rds.length) {
                            setSelRound(rds[0]._id);
                            setMatches(await matchAdminService.getByRound(rds[0]._id));
                        }
                    }
                }
            } catch (e) { notify(apiErr(e), 'err'); }
            finally { setLoading(false); }
        })();
    }, []);

    const loadMatches = async (rid: string) => {
        try { setMatches(await matchAdminService.getByRound(rid)); }
        catch (e) { notify(apiErr(e), 'err'); }
    };

    const onLeagueChange = async (lid: string) => {
        setSelLeague(lid); setSelSeason(''); setSelRound(''); setMatches([]);
        const sns = await seasonService.getByLeague(lid);
        setSeasons(sns);
        if (sns.length) {
            setSelSeason(sns[0]._id);
            const rds = await roundService.getBySeason(sns[0]._id);
            setRounds(rds);
            if (rds.length) { setSelRound(rds[0]._id); loadMatches(rds[0]._id); }
        }
    };

    const onSeasonChange = async (sid: string) => {
        setSelSeason(sid); setSelRound(''); setMatches([]);
        const rds = await roundService.getBySeason(sid);
        setRounds(rds);
        if (rds.length) { setSelRound(rds[0]._id); loadMatches(rds[0]._id); }
    };

    const onRoundChange = (rid: string) => { setSelRound(rid); loadMatches(rid); };

    const createMatch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selRound) return notify('Select a round first', 'err');
        setCreating(true);
        try {
            await matchAdminService.create({ roundId: selRound, seasonId: selSeason, ...createForm });
            notify('Match scheduled!', 'ok');
            setShowCreate(false);
            setCreateForm({ team1Id: '', team2Id: '', scheduledStart: '' });
            loadMatches(selRound);
        } catch (e) { notify(apiErr(e), 'err'); }
        finally { setCreating(false); }
    };

    const reportResult = async () => {
        if (!resultModal) return;
        try {
            await matchAdminService.reportResult(resultModal.matchId, { team1GamesWon: resultModal.homeScore, team2GamesWon: resultModal.awayScore });
            notify('Result reported!', 'ok');
            setResultModal(null);
            loadMatches(selRound);
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    const doForfeit = async () => {
        if (!forfeitModal) return;
        try {
            await matchAdminService.forfeit(forfeitModal.matchId, { forfeitingTeamId: forfeitModal.forfeitingTeamId });
            notify('Forfeit declared.', 'ok');
            setForfeitModal(null);
            loadMatches(selRound);
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    const cancelMatch = async (id: string) => {
        if (!confirm('Cancel this match?')) return;
        try {
            await matchAdminService.cancel(id);
            notify('Match cancelled.', 'ok');
            loadMatches(selRound);
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    const filtered = matches.filter(m =>
        !search || [m.team1Id, m.team2Id].some(t => String(t).toLowerCase().includes(search.toLowerCase()))
    );

    const teamName = (t: unknown) => {
        if (typeof t === 'object' && t !== null && 'name' in t) return (t as { name: string }).name;
        return String(t).slice(-6);
    };

    return (
        <div className="space-y-6">
            {toast && <Toast {...toast} />}

            {/* Result modal */}
            {resultModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4">
                        <h3 className="text-white font-black text-base">Report Result</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Home Score</label>
                                <input type="number" min={0} value={resultModal.homeScore}
                                    onChange={e => setResultModal(r => r && ({ ...r, homeScore: Number(e.target.value) }))}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-green-500/50" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Away Score</label>
                                <input type="number" min={0} value={resultModal.awayScore}
                                    onChange={e => setResultModal(r => r && ({ ...r, awayScore: Number(e.target.value) }))}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-green-500/50" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={reportResult} className="flex-1 py-2 rounded-xl text-sm font-bold text-black bg-green-400 hover:bg-green-300 transition-all">Confirm</button>
                            <button onClick={() => setResultModal(null)} className="flex-1 py-2 rounded-xl text-sm font-bold text-text-muted border border-white/10 hover:bg-white/5 transition-all">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Forfeit modal */}
            {forfeitModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4">
                        <h3 className="text-white font-black text-base">Declare Forfeit</h3>
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Forfeiting Team ID</label>
                            <input value={forfeitModal.forfeitingTeamId}
                                onChange={e => setForfeitModal(f => f && ({ ...f, forfeitingTeamId: e.target.value }))}
                                placeholder="Team ID…"
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-red-500/50 placeholder-text-muted" />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={doForfeit} className="flex-1 py-2 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-400 transition-all">Declare Forfeit</button>
                            <button onClick={() => setForfeitModal(null)} className="flex-1 py-2 rounded-xl text-sm font-bold text-text-muted border border-white/10 hover:bg-white/5 transition-all">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                        <span>League Hub</span>
                        <ChevronRight size={12} />
                        <span className="text-white font-semibold">Matches</span>
                    </div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <Swords size={24} className="text-rose-400" />
                        Matches Manager
                    </h1>
                    <p className="text-text-muted text-sm mt-1">Schedule matches, report results, and manage forfeits.</p>
                </div>
                <button onClick={() => setShowCreate(v => !v)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-black bg-green-400 hover:bg-green-300 transition-all shrink-0">
                    {showCreate ? <X size={16} /> : <Plus size={16} />}
                    {showCreate ? 'Cancel' : 'Schedule Match'}
                </button>
            </div>

            {/* Create form */}
            {showCreate && (
                <form onSubmit={createMatch} className="bg-surface/60 border border-white/8 rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Schedule New Match</h3>
                    <div className="grid md:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Team 1 ID *</label>
                            <input value={createForm.team1Id} onChange={e => setCreateForm(f => ({ ...f, team1Id: e.target.value }))}
                                placeholder="<teamId>"
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted focus:border-green-500/50 outline-none" required />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Team 2 ID *</label>
                            <input value={createForm.team2Id} onChange={e => setCreateForm(f => ({ ...f, team2Id: e.target.value }))}
                                placeholder="<teamId>"
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted focus:border-green-500/50 outline-none" required />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Scheduled Start</label>
                            <input type="datetime-local" value={createForm.scheduledStart} onChange={e => setCreateForm(f => ({ ...f, scheduledStart: e.target.value }))}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none" />
                        </div>
                    </div>
                    <button type="submit" disabled={creating}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-black bg-green-400 hover:bg-green-300 disabled:opacity-50 transition-all">
                        {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        Schedule
                    </button>
                </form>
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
                <select value={selRound} onChange={e => onRoundChange(e.target.value)}
                    className="bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none">
                    {rounds.map(r => <option key={r._id} value={r._id}>Round {r.roundNumber}</option>)}
                </select>
                <div className="relative flex-1 max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teams…"
                        className="w-full pl-9 pr-3 py-2 bg-surface border border-white/10 rounded-xl text-sm text-white placeholder-text-muted focus:border-green-500/50 outline-none" />
                </div>
                <button onClick={() => selRound && loadMatches(selRound)}
                    className="p-2 rounded-xl border border-white/10 hover:bg-white/5 text-text-muted hover:text-white transition-all">
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Match list */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-green-400" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Swords size={40} className="text-text-muted mb-4 opacity-50" />
                    <p className="text-text-muted font-semibold">No matches in this round</p>
                    <p className="text-text-muted text-sm mt-1">Schedule the first match for this round</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(m => (
                        <div key={m._id} className="bg-surface/60 border border-white/8 rounded-2xl p-4 hover:border-white/15 transition-all">
                            <div className="flex items-center gap-4 flex-wrap">
                                {/* Teams */}
                                <div className="flex-1 flex items-center gap-3 min-w-0">
                                    <span className="text-white font-bold text-sm truncate">{teamName(m.team1Id)}</span>
                                    <span className="text-text-muted font-black text-xs px-2 py-0.5 bg-white/5 rounded-lg shrink-0">VS</span>
                                    <span className="text-white font-bold text-sm truncate">{teamName(m.team2Id)}</span>
                                </div>
                                {/* Score */}
                                {m.team1GamesWon !== undefined && m.team2GamesWon !== undefined && (
                                    <span className="text-green-400 font-black text-sm shrink-0">
                                        {m.team1GamesWon} — {m.team2GamesWon}
                                    </span>
                                )}
                                {/* Date */}
                                <span className="text-text-muted text-[10px] shrink-0">{fmt(m.scheduledStart)}</span>
                                {/* Status */}
                                <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border shrink-0', STATUS_STYLE[m.status] || STATUS_STYLE.SCHEDULED)}>
                                    {m.status}
                                </span>
                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {m.status === 'SCHEDULED' || m.status === 'ONGOING' ? (
                                        <>
                                            <button onClick={() => setResultModal({ matchId: m._id, homeScore: 0, awayScore: 0 })}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-green-400 border border-green-500/30 hover:bg-green-500/10 transition-all">
                                                <CheckSquare size={12} /> Result
                                            </button>
                                            <button onClick={() => setForfeitModal({ matchId: m._id, forfeitingTeamId: '' })}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-all">
                                                <RotateCcw size={12} /> Forfeit
                                            </button>
                                            <button onClick={() => cancelMatch(m._id)}
                                                className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all border border-white/5 hover:border-red-500/20">
                                                <XCircle size={14} />
                                            </button>
                                        </>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
