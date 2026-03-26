import { useState, useEffect } from 'react';
import {
    Swords, Plus, Loader2, Search, AlertTriangle, CheckSquare,
    ChevronRight, RefreshCw, X, XCircle, RotateCcw, Play,
    Gamepad2, ChevronDown, ClockAlert, Calendar, List,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { leagueService, type League } from '../../../services/leagueService';
import { seasonService, type Season } from '../../../services/seasonService';
import { roundService, type Round } from '../../../services/roundService';
import { matchAdminService, type AdminMatch } from '../../../services/matchAdminService';
import { checkInService } from '../../../services/checkInService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const apiErr = (e: unknown) => {
    const err = e as { response?: { data?: { message?: string } } };
    return err?.response?.data?.message || 'Something went wrong';
};
const fmt = (d: string) =>
    d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_STYLE: Record<string, string> = {
    SCHEDULED: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
    ONGOING:   'bg-green-500/15 text-green-400 border-green-500/25',
    COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    FORFEIT:   'bg-red-500/15 text-red-400 border-red-500/25',
    CANCELLED: 'bg-white/5 text-slate-400 border-white/10',
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

interface ResultModal  { matchId: string; team1GamesWon: number; team2GamesWon: number }
interface ForfeitModal { matchId: string; forfeitingTeamId: string }
interface GameModal    { matchId: string; gameNumber: number; winnerId: string; durationMinutes: number }
interface CheckInModal { matchId: string; deadline: string; seasonId: string }

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
    const [showCreate, setShowCreate]   = useState(false);
    const [createForm, setCreateForm]   = useState({ team1Id: '', team2Id: '', scheduledStart: '' });
    const [creating, setCreating]       = useState(false);
    const [expandedId, setExpandedId]   = useState<string | null>(null);
    const [viewMode, setViewMode]       = useState<'list' | 'schedule'>('schedule');
    const [seasonMatches, setSeasonMatches] = useState<AdminMatch[]>([]);
    const [scheduleLoading, setScheduleLoading] = useState(false);

    const [resultModal,  setResultModal]  = useState<ResultModal | null>(null);
    const [forfeitModal, setForfeitModal] = useState<ForfeitModal | null>(null);
    const [gameModal,    setGameModal]    = useState<GameModal | null>(null);
    const [checkInModal, setCheckInModal] = useState<CheckInModal | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

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

    // Load all matches for the season when in schedule view (for calendar)
    useEffect(() => {
        if (viewMode !== 'schedule' || !selSeason) {
            setSeasonMatches([]);
            return;
        }
        let cancelled = false;
        setScheduleLoading(true);
        matchAdminService.getBySeason(selSeason)
            .then(data => { if (!cancelled) setSeasonMatches(Array.isArray(data) ? data : []); })
            .catch(() => { if (!cancelled) setSeasonMatches([]); })
            .finally(() => { if (!cancelled) setScheduleLoading(false); });
        return () => { cancelled = true; };
    }, [viewMode, selSeason]);

    const roundIdFromMatch = (m: AdminMatch): string =>
        typeof m.roundId === 'string' ? m.roundId : (m.roundId as { _id: string })._id;

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

    const startMatch = async (id: string) => {
        try { await matchAdminService.start(id); notify('Match started!', 'ok'); loadMatches(selRound); }
        catch (e) { notify(apiErr(e), 'err'); }
    };

    const reportResult = async () => {
        if (!resultModal) return;
        try {
            await matchAdminService.reportResult(resultModal.matchId, {
                team1GamesWon: resultModal.team1GamesWon,
                team2GamesWon: resultModal.team2GamesWon,
            });
            notify('Result reported!', 'ok');
            setResultModal(null);
            loadMatches(selRound);
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    const submitGame = async () => {
        if (!gameModal || !gameModal.winnerId.trim()) return notify('Winner ID required', 'err');
        try {
            await matchAdminService.submitGame(gameModal.matchId, {
                gameNumber: gameModal.gameNumber,
                winnerId: gameModal.winnerId,
                durationMinutes: gameModal.durationMinutes || undefined,
            });
            notify(`Game ${gameModal.gameNumber} reported!`, 'ok');
            setGameModal(null);
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

    const createCheckIn = async () => {
        if (!checkInModal || !checkInModal.deadline) return notify('Deadline required', 'err');
        try {
            await checkInService.create({
                matchId: checkInModal.matchId,
                seasonId: checkInModal.seasonId,
                deadline: new Date(checkInModal.deadline).toISOString(),
            });
            notify('Check-in window created!', 'ok');
            setCheckInModal(null);
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    const filtered = matches.filter(m =>
        !search || [m.team1Id, m.team2Id].some(t => String(t).toLowerCase().includes(search.toLowerCase()))
    );

    const teamName = (t: unknown) => {
        if (typeof t === 'object' && t !== null && 'name' in t) return (t as { name: string }).name;
        return String(t).slice(-6);
    };

    const teamId = (t: unknown): string => {
        if (typeof t === 'object' && t !== null && '_id' in t) return (t as { _id: string })._id;
        return String(t);
    };

    return (
        <div className="space-y-6">
            {toast && <Toast {...toast} />}

            {/* Result modal */}
            {resultModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4">
                        <h3 className="text-white font-black text-base">Report Final Result</h3>
                        <p className="text-xs text-slate-500">Total games won per team across all maps.</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Team 1 Wins</label>
                                <input type="number" min={0} value={resultModal.team1GamesWon}
                                    onChange={e => setResultModal(r => r && ({ ...r, team1GamesWon: +e.target.value }))}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-green-500/50" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Team 2 Wins</label>
                                <input type="number" min={0} value={resultModal.team2GamesWon}
                                    onChange={e => setResultModal(r => r && ({ ...r, team2GamesWon: +e.target.value }))}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-green-500/50" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={reportResult} className="flex-1 py-2 rounded-xl text-sm font-bold text-black bg-green-400 hover:bg-green-300 transition-all">Confirm</button>
                            <button onClick={() => setResultModal(null)} className="flex-1 py-2 rounded-xl text-sm font-bold text-slate-400 border border-white/10 hover:bg-white/5 transition-all">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Per-game modal */}
            {gameModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-white font-black text-base">Submit Game Result</h3>
                            <button onClick={() => setGameModal(null)}><X size={18} className="text-slate-400" /></button>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Game #</label>
                            <input type="number" min={1} value={gameModal.gameNumber}
                                onChange={e => setGameModal(g => g && ({ ...g, gameNumber: +e.target.value }))}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500/50" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Winner Team ID *</label>
                            <input value={gameModal.winnerId}
                                onChange={e => setGameModal(g => g && ({ ...g, winnerId: e.target.value }))}
                                placeholder="Team ID…"
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500/50 placeholder-slate-600" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Duration (min)</label>
                            <input type="number" min={0} value={gameModal.durationMinutes}
                                onChange={e => setGameModal(g => g && ({ ...g, durationMinutes: +e.target.value }))}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500/50" />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={submitGame} className="flex-1 py-2 rounded-xl text-sm font-bold text-white bg-blue-500 hover:bg-blue-400 transition-all">Submit</button>
                            <button onClick={() => setGameModal(null)} className="flex-1 py-2 rounded-xl text-sm font-bold text-slate-400 border border-white/10 hover:bg-white/5 transition-all">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Forfeit modal */}
            {forfeitModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4">
                        <h3 className="text-white font-black text-base">Declare Forfeit</h3>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Forfeiting Team ID</label>
                            <input value={forfeitModal.forfeitingTeamId}
                                onChange={e => setForfeitModal(f => f && ({ ...f, forfeitingTeamId: e.target.value }))}
                                placeholder="Team ID…"
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-red-500/50 placeholder-slate-600" />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={doForfeit} className="flex-1 py-2 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-400 transition-all">Declare Forfeit</button>
                            <button onClick={() => setForfeitModal(null)} className="flex-1 py-2 rounded-xl text-sm font-bold text-slate-400 border border-white/10 hover:bg-white/5 transition-all">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Check-in modal */}
            {checkInModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-white font-black text-base">Create Check-In Window</h3>
                            <button onClick={() => setCheckInModal(null)}><X size={18} className="text-slate-400" /></button>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Deadline *</label>
                            <input type="datetime-local" value={checkInModal.deadline}
                                onChange={e => setCheckInModal(c => c && ({ ...c, deadline: e.target.value }))}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500/50" />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={createCheckIn} className="flex-1 py-2 rounded-xl text-sm font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-all">Create</button>
                            <button onClick={() => setCheckInModal(null)} className="flex-1 py-2 rounded-xl text-sm font-bold text-slate-400 border border-white/10 hover:bg-white/5 transition-all">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                        <span>League Hub</span><ChevronRight size={12} /><span className="text-white font-semibold">Matches</span>
                    </div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <Swords size={24} className="text-rose-400" />
                        Matches Manager
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Schedule, start, report per-game results, and manage forfeits. Use Schedule view to see rounds and matches (or TBD) even before teams are added.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex rounded-xl border border-white/10 overflow-hidden bg-slate-800/50">
                        <button
                            onClick={() => setViewMode('schedule')}
                            className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-all', viewMode === 'schedule' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-slate-500 hover:text-white')}
                        >
                            <Calendar size={16} /> Schedule
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-all', viewMode === 'list' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-slate-500 hover:text-white')}
                        >
                            <List size={16} /> List
                        </button>
                    </div>
                    <button onClick={() => setShowCreate(v => !v)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-black bg-green-400 hover:bg-green-300 transition-all shrink-0">
                    {showCreate ? <X size={16} /> : <Plus size={16} />}
                    {showCreate ? 'Cancel' : 'Schedule Match'}
                </button>
                </div>
            </div>

            {/* Create form */}
            {showCreate && (
                <form onSubmit={createMatch} className="bg-slate-800/60 border border-white/8 rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Schedule New Match</h3>
                    <div className="grid md:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Team 1 ID *</label>
                            <input value={createForm.team1Id} onChange={e => setCreateForm(f => ({ ...f, team1Id: e.target.value }))}
                                placeholder="<teamId>"
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-green-500/50 outline-none" required />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Team 2 ID *</label>
                            <input value={createForm.team2Id} onChange={e => setCreateForm(f => ({ ...f, team2Id: e.target.value }))}
                                placeholder="<teamId>"
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-green-500/50 outline-none" required />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Scheduled Start</label>
                            <input type="datetime-local" value={createForm.scheduledStart}
                                onChange={e => setCreateForm(f => ({ ...f, scheduledStart: e.target.value }))}
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
                    className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none">
                    {leagues.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                </select>
                <select value={selSeason} onChange={e => onSeasonChange(e.target.value)}
                    className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none">
                    {seasons.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                {viewMode === 'list' && (
                    <>
                        <select value={selRound} onChange={e => onRoundChange(e.target.value)}
                            className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none">
                            {rounds.map(r => <option key={r._id} value={r._id}>Round {r.roundNumber}</option>)}
                        </select>
                        <div className="relative flex-1 max-w-xs">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teams…"
                                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:border-green-500/50 outline-none" />
                        </div>
                    </>
                )}
                <button onClick={() => viewMode === 'schedule' && selSeason ? (matchAdminService.getBySeason(selSeason).then(setSeasonMatches)) : (selRound && loadMatches(selRound))}
                    className="p-2 rounded-xl border border-white/10 hover:bg-white/5 text-slate-500 hover:text-white transition-all" title="Refresh">
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Schedule view: rounds + matches (or TBD placeholders) */}
            {viewMode === 'schedule' && (
                <div className="space-y-6">
                    {!selSeason ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Calendar size={40} className="text-slate-500 mb-4 opacity-50" />
                            <p className="text-slate-500 font-semibold">Select a season</p>
                            <p className="text-slate-600 text-sm mt-1">Choose a league and season to see the schedule</p>
                        </div>
                    ) : scheduleLoading ? (
                        <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-green-400" /></div>
                    ) : rounds.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Calendar size={40} className="text-slate-500 mb-4 opacity-50" />
                            <p className="text-slate-500 font-semibold">No rounds yet</p>
                            <p className="text-slate-600 text-sm mt-1">Generate rounds on the Rounds page first; then matches (or TBD slots) will appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {rounds.map(round => {
                                const roundMatches = seasonMatches.filter(m => roundIdFromMatch(m) === round._id);
                                const sortedMatches = [...roundMatches].sort((a, b) => {
                                    const orderA = a.matchOrder ?? 0;
                                    const orderB = b.matchOrder ?? 0;
                                    if (orderA !== orderB) return orderA - orderB;
                                    return new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime();
                                });
                                const placeholders = sortedMatches.length === 0 ? [1, 2] : []; // show 2 TBD slots if no matches
                                return (
                                    <div key={round._id} className="bg-slate-800/60 border border-white/8 rounded-2xl overflow-hidden">
                                        <div className="px-5 py-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-black text-sm">
                                                    {round.roundNumber}
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-bold">Round {round.roundNumber}</h3>
                                                    <p className="text-slate-500 text-xs">{fmtDate(round.startDate)} — {fmtDate(round.endDate)}</p>
                                                </div>
                                            </div>
                                            <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border', STATUS_STYLE[round.status] || STATUS_STYLE.SCHEDULED)}>
                                                {round.status}
                                            </span>
                                        </div>
                                        <div className="p-4 space-y-2">
                                            {sortedMatches.map(m => (
                                                <div key={m._id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-900/60 border border-white/5 flex-wrap">
                                                    <span className="text-slate-500 text-[10px] shrink-0 w-20">Match {m.matchOrder ?? '—'}</span>
                                                    <span className="text-white font-bold text-sm truncate">{teamName(m.team1Id)}</span>
                                                    {(m.team1GamesWon !== undefined && m.team2GamesWon !== undefined) ? (
                                                        <span className="text-green-400 font-black text-sm px-2 py-0.5 bg-green-500/10 rounded-lg">{m.team1GamesWon} – {m.team2GamesWon}</span>
                                                    ) : (
                                                        <span className="text-slate-500 font-black text-xs px-2 py-0.5 bg-white/5 rounded-lg">VS</span>
                                                    )}
                                                    <span className="text-white font-bold text-sm truncate">{teamName(m.team2Id)}</span>
                                                    <span className="text-slate-500 text-[10px] ml-auto shrink-0">{fmt(m.scheduledStart)}</span>
                                                    <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border shrink-0', STATUS_STYLE[m.status])}>{m.status}</span>
                                                </div>
                                            ))}
                                            {placeholders.map(i => (
                                                <div key={`tbd-${round._id}-${i}`} className="flex items-center gap-4 p-3 rounded-xl bg-slate-900/30 border border-dashed border-white/10 flex-wrap">
                                                    <span className="text-slate-500 text-[10px] shrink-0 w-20">Match {i}</span>
                                                    <span className="text-slate-500 font-medium text-sm">TBD</span>
                                                    <span className="text-slate-600 font-black text-xs px-2 py-0.5 bg-white/5 rounded-lg">VS</span>
                                                    <span className="text-slate-500 font-medium text-sm">TBD</span>
                                                    <span className="text-slate-600 text-[10px] ml-auto shrink-0">{fmt(round.startDate)}</span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-slate-500/30 text-slate-500 shrink-0">Scheduled</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Match list (list view only) */}
            {viewMode === 'list' && (
            <>
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-green-400" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Swords size={40} className="text-slate-500 mb-4 opacity-50" />
                    <p className="text-slate-500 font-semibold">No matches in this round</p>
                    <p className="text-slate-600 text-sm mt-1">Schedule the first match for this round</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(m => {
                        const isActive = m.status === 'ONGOING';
                        const isLive   = m.status === 'SCHEDULED' || isActive;
                        const expanded = expandedId === m._id;
                        return (
                            <div key={m._id} className="bg-slate-800/60 border border-white/8 rounded-2xl overflow-hidden hover:border-white/15 transition-all">
                                <div className="flex items-center gap-4 p-4 flex-wrap">
                                    {/* Teams */}
                                    <div className="flex-1 flex items-center gap-3 min-w-0">
                                        <span className="text-white font-bold text-sm truncate">{teamName(m.team1Id)}</span>
                                        {(m.team1GamesWon !== undefined && m.team2GamesWon !== undefined) ? (
                                            <span className="text-green-400 font-black text-sm shrink-0 px-2 py-0.5 bg-green-500/10 rounded-lg">
                                                {m.team1GamesWon} – {m.team2GamesWon}
                                            </span>
                                        ) : (
                                            <span className="text-slate-500 font-black text-xs px-2 py-0.5 bg-white/5 rounded-lg shrink-0">VS</span>
                                        )}
                                        <span className="text-white font-bold text-sm truncate">{teamName(m.team2Id)}</span>
                                    </div>
                                    {/* Date */}
                                    <span className="text-slate-500 text-[10px] shrink-0">{fmt(m.scheduledStart)}</span>
                                    {/* Status */}
                                    <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border shrink-0', STATUS_STYLE[m.status] || STATUS_STYLE.SCHEDULED)}>
                                        {m.status}
                                    </span>
                                    {/* Actions */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {m.status === 'SCHEDULED' && (
                                            <button onClick={() => startMatch(m._id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 transition-all">
                                                <Play size={12} /> Start
                                            </button>
                                        )}
                                        {m.status === 'SCHEDULED' && (
                                            <button onClick={() => setCheckInModal({ matchId: m._id, deadline: '', seasonId: m.seasonId })}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/10 transition-all">
                                                <ClockAlert size={12} /> Check-in
                                            </button>
                                        )}
                                        {isLive && (
                                            <>
                                                <button onClick={() => setGameModal({ matchId: m._id, gameNumber: 1, winnerId: '', durationMinutes: 0 })}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 transition-all">
                                                    <Gamepad2 size={12} /> Game
                                                </button>
                                                <button onClick={() => setResultModal({ matchId: m._id, team1GamesWon: 0, team2GamesWon: 0 })}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-green-400 border border-green-500/30 hover:bg-green-500/10 transition-all">
                                                    <CheckSquare size={12} /> Result
                                                </button>
                                                <button onClick={() => setForfeitModal({ matchId: m._id, forfeitingTeamId: '' })}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-all">
                                                    <RotateCcw size={12} /> Forfeit
                                                </button>
                                                <button onClick={() => cancelMatch(m._id)}
                                                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all border border-white/5 hover:border-red-500/20">
                                                    <XCircle size={14} />
                                                </button>
                                            </>
                                        )}
                                        <button onClick={() => setExpandedId(expanded ? null : m._id)}
                                            className="p-1.5 rounded-lg text-slate-500 hover:text-white border border-white/5">
                                            <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded detail */}
                                {expanded && (
                                    <div className="border-t border-white/5 px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                        <Detail label="Match ID"     value={`…${m._id.slice(-8)}`} mono />
                                        <Detail label="Round"        value={typeof m.roundId === 'string'
                                            ? `…${m.roundId.slice(-6)}`
                                            : `Round ${(m.roundId as { roundNumber: number }).roundNumber}`} />
                                        <Detail label="Season"       value={`…${m.seasonId.slice(-6)}`} mono />
                                        <Detail label="Format"       value={m.format ?? '—'} />
                                        <Detail label="T1 ID"        value={teamId(m.team1Id).slice(-8)} mono />
                                        <Detail label="T2 ID"        value={teamId(m.team2Id).slice(-8)} mono />
                                        {m.scheduledEnd && <Detail label="Ends"   value={fmt(m.scheduledEnd)} />}
                                        {m.refereeId    && <Detail label="Referee" value={typeof m.refereeId === 'string'
                                            ? `…${m.refereeId.slice(-6)}`
                                            : ((m.refereeId as { nickname?: string }).nickname ?? '—')} />}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            </>
            )}
        </div>
    );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div>
            <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-0.5">{label}</p>
            <p className={`text-slate-300 ${mono ? 'font-mono' : ''}`}>{value}</p>
        </div>
    );
}
