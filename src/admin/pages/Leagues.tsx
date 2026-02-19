import { useState, useEffect, useCallback } from 'react';
import {
    Plus, Trophy, Search, Loader2, Award, Users, Globe, Calendar,
    Edit2, Trash2, Play, CheckSquare, ChevronRight, Zap,
    BookOpen, Flag, Swords, Shield, RotateCcw, XCircle, ClipboardList,
    AlertTriangle, Star, BarChart2, List, Settings,
} from 'lucide-react';
import { Input } from '../../components/ui/core';
import { leagueService, type League, LeagueLevel, LeagueStatus } from '../../services/leagueService';
import { seasonService, type Season } from '../../services/seasonService';
import { leagueRulesService, type LeagueRule } from '../../services/leagueRulesService';
import { roundService, type Round } from '../../services/roundService';
import { matchAdminService, type AdminMatch } from '../../services/matchAdminService';
import { seasonTeamService, type SeasonTeam } from '../../services/seasonTeamService';
import CreateLeagueModal from '../components/leagues/CreateLeagueModal';
import { cn } from '../../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminTab = 'standings' | 'seasons' | 'rules' | 'rounds' | 'matches' | 'teams';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const levelColors: Record<string, { pill: string; hex: string }> = {
    INTERNATIONAL: { pill: 'bg-purple-500/15 text-purple-300 border-purple-500/25', hex: '#a855f7' },
    CONTINENTAL:   { pill: 'bg-blue-500/15 text-blue-300 border-blue-500/25',       hex: '#3b82f6' },
    NATIONAL:      { pill: 'bg-green-500/15 text-green-300 border-green-500/25',    hex: '#22c55e' },
    REGIONAL:      { pill: 'bg-white/5 text-text-muted border-white/10',            hex: '#6b7280' },
};
const statusColor: Record<string, string> = {
    PLANNED:   'bg-gray-500/15 text-gray-400 border-gray-500/25',
    ONGOING:   'bg-green-500/15 text-green-400 border-green-500/25',
    FINISHED:  'bg-white/5 text-text-muted border-white/10',
    SCHEDULED: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
    COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    FORFEIT:   'bg-red-500/15 text-red-400 border-red-500/25',
    CANCELLED: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
};
const apiErr = (e: unknown): string => {
    const err = e as { response?: { data?: { message?: string } } };
    return err?.response?.data?.message || 'Something went wrong';
};
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// Small inline label
function Pill({ label, color }: { label: string; color?: string }) {
    return (
        <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border', color || 'bg-white/5 text-text-muted border-white/10')}>
            {label}
        </span>
    );
}

// Inline notification
function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' }) {
    return (
        <div className={cn('fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-black shadow-2xl',
            type === 'ok' ? 'bg-green-500/20 border border-green-500/30 text-green-300' : 'bg-red-500/20 border border-red-500/30 text-red-300')}>
            {type === 'ok' ? <CheckSquare size={16} /> : <AlertTriangle size={16} />}
            {msg}
        </div>
    );
}

// ─── Season Timeline ──────────────────────────────────────────────────────────

function SeasonTimeline({ seasons, rounds }: { seasons: Season[]; rounds: Round[] }) {
    if (!seasons.length) return null;
    const allDates = seasons.flatMap(s => [new Date(s.startDate), new Date(s.endDate)]);
    const tStart = new Date(Math.min(...allDates.map(d => d.getTime())));
    const tEnd   = new Date(Math.max(...allDates.map(d => d.getTime())));
    tStart.setDate(1);
    tEnd.setMonth(tEnd.getMonth() + 1, 1);
    const totalDays = (tEnd.getTime() - tStart.getTime()) / 86400000;
    const toLeft = (d: string) => Math.max(0, ((new Date(d).getTime() - tStart.getTime()) / 86400000 / totalDays) * 100);
    const toWidth = (s: string, e: string) => Math.max(1, ((new Date(e).getTime() - new Date(s).getTime()) / 86400000 / totalDays) * 100);

    const months: { label: string; left: number }[] = [];
    const cur = new Date(tStart); cur.setDate(1);
    while (cur <= tEnd) {
        months.push({ label: cur.toLocaleDateString('en', { month: 'short', year: '2-digit' }), left: toLeft(cur.toISOString()) });
        cur.setMonth(cur.getMonth() + 1);
    }

    return (
        <div className="mb-4 px-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-2">Season Timeline</p>
            <div className="relative bg-white/[0.03] rounded-xl overflow-hidden border border-white/5 h-20">
                {/* Month ruler */}
                {months.map((m, i) => (
                    <div key={i} className="absolute top-0 bottom-0 border-l border-white/5" style={{ left: `${m.left}%` }}>
                        <span className="text-[8px] font-bold text-text-muted/50 pl-1 pt-1 block">{m.label}</span>
                    </div>
                ))}
                {/* Season bars */}
                {seasons.map((s) => {
                    const seaRounds = rounds.filter(r => r.seasonId === s._id);
                    const sc = { PLANNED: '#6b7280', ONGOING: '#3b82f6', FINISHED: '#1f2937' }[s.status] || '#6b7280';
                    const l = toLeft(s.startDate);
                    const w = toWidth(s.startDate, s.endDate);
                    const regW    = toWidth(s.startDate, s.registrationDeadline);
                    return (
                        <div key={s._id} className="absolute" style={{ top: '30%', height: '40%', left: `${l}%`, width: `${w}%` }}>
                            {/* Registration window */}
                            <div className="absolute inset-y-0 left-0 rounded-l-lg opacity-50" style={{ width: `${Math.min(100, regW / (w || 1) * 100)}%`, background: '#f59e0b40', borderLeft: '2px dashed #f59e0b80' }} />
                            {/* Season bar */}
                            <div className="absolute inset-0 rounded-lg flex items-center pl-2 overflow-hidden" style={{ background: sc + '40', border: `1px solid ${sc}60` }}>
                                <span className="text-[8px] font-black text-white/70 truncate">{s.name}</span>
                            </div>
                            {/* Round ticks */}
                            {seaRounds.map((r) => {
                                const seasonLen = new Date(s.endDate).getTime() - new Date(s.startDate).getTime();
                                const rOff = ((new Date(r.startDate).getTime() - new Date(s.startDate).getTime()) / seasonLen) * 100;
                                const rc = { SCHEDULED: '#d1d5db', ONGOING: '#f59e0b', COMPLETED: '#10b981' }[r.status] || '#d1d5db';
                                return (
                                    <div key={r._id} className="absolute top-0 bottom-0 w-px" style={{ left: `${rOff}%`, background: rc + '80' }}>
                                        {r.status === 'ONGOING' && <div className="absolute top-0 w-1.5 h-1.5 -translate-x-1/2 rounded-full" style={{ background: '#f59e0b', animation: 'ping 1s infinite', opacity: 0.7 }} />}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
                {/* Today line */}
                <div className="absolute top-0 bottom-0 w-px bg-primary/50" style={{ left: `${toLeft(new Date().toISOString())}%` }}>
                    <span className="text-[7px] font-black text-primary pl-0.5 pt-0.5 block">TODAY</span>
                </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
                {[['▓', '#f59e0b', 'Reg. window'], ['━', '#3b82f6', 'Ongoing'], ['━', '#6b7280', 'Planned'], ['━', '#1f2937', 'Finished']].map(([sym, col, lbl]) => (
                    <span key={lbl} className="flex items-center gap-1 text-[8px] font-bold text-text-muted/60">
                        <span style={{ color: col }}>{sym}</span> {lbl}
                    </span>
                ))}
            </div>
        </div>
    );
}

// ─── Field Component ──────────────────────────────────────────────────────────

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
            {children}
        </div>
    );
}

const inputCls = "bg-black/30 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors placeholder-white/20 w-full";
const selectCls = "bg-black/30 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors w-full appearance-none";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminLeagues() {
    // — League state —
    const [leagues, setLeagues]           = useState<League[]>([]);
    const [loading, setLoading]           = useState(true);
    const [searchQuery, setSearchQuery]   = useState('');
    const [levelFilter, setLevelFilter]   = useState<LeagueLevel | 'all'>('all');
    const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
    const [showCreateLeague, setShowCreateLeague] = useState(false);
    const [editingLeague, setEditingLeague]       = useState<League | null>(null);

    // — Tab —
    const [activeTab, setActiveTab] = useState<AdminTab>('standings');

    // — Season state —
    const [seasons, setSeasons]               = useState<Season[]>([]);
    const [seasonsLoading, setSeasonsLoading] = useState(false);
    const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
    const [showCreateSeason, setShowCreateSeason] = useState(false);
    const [seasonForm, setSeasonForm] = useState({ name: '', rulesId: '', registrationDeadline: '', startDate: '', endDate: '', description: '' });

    // — Rules state —
    const [rules, setRules]               = useState<LeagueRule[]>([]);
    const [rulesLoading, setRulesLoading] = useState(false);
    const [showCreateRule, setShowCreateRule] = useState(false);
    const [ruleForm, setRuleForm] = useState({ name: '', gameId: '', formatType: 'LEAGUE', matchType: 'BO3', pointsWin: 3, pointsDraw: 1, pointsLoss: 0, maxTeams: 10, maxForfeits: 3, forfeitLoss: true, tiebreaker: 'GAME_DIFF' });

    // — Rounds state —
    const [rounds, setRounds]               = useState<Round[]>([]);
    const [roundsLoading, setRoundsLoading] = useState(false);
    const [showGenRounds, setShowGenRounds] = useState(false);
    const [genForm, setGenForm] = useState({ startDate: '', weekCount: 9 });

    // — Matches state —
    const [matches, setMatches]               = useState<AdminMatch[]>([]);
    const [matchesLoading, setMatchesLoading] = useState(false);
    const [selectedRound, setSelectedRound]   = useState<Round | null>(null);
    const [showCreateMatch, setShowCreateMatch] = useState(false);
    const [matchForm, setMatchForm] = useState({ team1Id: '', team2Id: '', scheduledStart: '', scheduledEnd: '', notes: '' });
    const [resultModal, setResultModal] = useState<{ match: AdminMatch } | null>(null);
    const [resultForm, setResultForm]   = useState({ t1: 0, t2: 0 });
    const [forfeitModal, setForfeitModal] = useState<{ match: AdminMatch } | null>(null);
    const [forfeitForm, setForfeitForm]  = useState({ forfeitingTeamId: '', reason: '' });

    // — Teams state —
    const [teams, setTeams]               = useState<SeasonTeam[]>([]);
    const [teamsLoading, setTeamsLoading] = useState(false);
    const [showRegTeam, setShowRegTeam]   = useState(false);
    const [teamForm, setTeamForm] = useState({ teamId: '', seed: '' });

    // — Standings state —
    const [standings, setStandings]               = useState<any[]>([]);
    const [standingsLoading, setStandingsLoading] = useState(false);

    // — Toast —
    const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
    const notify = (msg: string, type: 'ok' | 'err' = 'ok') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ── Fetchers ────────────────────────────────────────────────────────────

    const fetchLeagues = useCallback(async () => {
        setLoading(true);
        try {
            const data = await leagueService.getAllLeagues();
            setLeagues(data);
            if (data.length > 0 && !selectedLeague) setSelectedLeague(data[0]);
        } finally { setLoading(false); }
    }, [selectedLeague]);

    const fetchSeasons = useCallback(async (leagueId: string) => {
        setSeasonsLoading(true);
        try { setSeasons(await seasonService.getByLeague(leagueId)); }
        catch { setSeasons([]); }
        finally { setSeasonsLoading(false); }
    }, []);

    const fetchRules = useCallback(async () => {
        setRulesLoading(true);
        try { setRules(await leagueRulesService.getAll()); }
        catch { setRules([]); }
        finally { setRulesLoading(false); }
    }, []);

    const fetchRounds = useCallback(async (seasonId: string) => {
        setRoundsLoading(true);
        try { const data = await roundService.getBySeason(seasonId); setRounds(data); if (data.length) setSelectedRound(data[0]); }
        catch { setRounds([]); }
        finally { setRoundsLoading(false); }
    }, []);

    const fetchMatches = useCallback(async (roundId: string) => {
        setMatchesLoading(true);
        try { setMatches(await matchAdminService.getByRound(roundId)); }
        catch { setMatches([]); }
        finally { setMatchesLoading(false); }
    }, []);

    const fetchTeams = useCallback(async (seasonId: string) => {
        setTeamsLoading(true);
        try { setTeams(await seasonTeamService.getBySeason(seasonId)); }
        catch { setTeams([]); }
        finally { setTeamsLoading(false); }
    }, []);

    const fetchStandings = useCallback(async (seasonId: string) => {
        setStandingsLoading(true);
        try { setStandings(await seasonService.getStandings(seasonId)); }
        catch { setStandings([]); }
        finally { setStandingsLoading(false); }
    }, []);

    // ── Effects ─────────────────────────────────────────────────────────────

    useEffect(() => { fetchLeagues(); fetchRules(); }, []);

    useEffect(() => {
        if (!selectedLeague) return;
        fetchSeasons(selectedLeague._id);
        setSelectedSeason(null); setRounds([]); setMatches([]); setTeams([]); setStandings([]);
    }, [selectedLeague]);

    useEffect(() => {
        if (!selectedSeason) return;
        fetchRounds(selectedSeason._id);
        fetchTeams(selectedSeason._id);
        fetchStandings(selectedSeason._id);
    }, [selectedSeason]);

    useEffect(() => {
        if (selectedRound) fetchMatches(selectedRound._id);
    }, [selectedRound]);

    // ── League actions ───────────────────────────────────────────────────────

    const handleLeagueSubmit = async (data: any) => {
        try {
            if (editingLeague) {
                await leagueService.updateLeague(editingLeague._id, data);
                notify('League updated');
            } else {
                await leagueService.createLeague(data);
                notify('League created');
            }
            setShowCreateLeague(false); setEditingLeague(null);
            await fetchLeagues();
        } catch (e) { notify(apiErr(e), 'err'); throw e; }
    };

    const handleDeleteLeague = async () => {
        if (!selectedLeague || !confirm(`Delete "${selectedLeague.name}"?`)) return;
        try { await leagueService.deleteLeague(selectedLeague._id); setSelectedLeague(null); await fetchLeagues(); notify('League deleted'); }
        catch (e) { notify(apiErr(e), 'err'); }
    };

    // ── Season actions ───────────────────────────────────────────────────────

    const handleCreateSeason = async () => {
        if (!selectedLeague) return;
        try {
            await seasonService.create({ ...seasonForm, leagueId: selectedLeague._id });
            notify('Season created'); setShowCreateSeason(false);
            setSeasonForm({ name: '', rulesId: '', registrationDeadline: '', startDate: '', endDate: '', description: '' });
            await fetchSeasons(selectedLeague._id);
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    const handleSeasonLifecycle = async (s: Season, action: 'activate' | 'close' | 'delete') => {
        try {
            if (action === 'activate') { await seasonService.activate(s._id); notify('Season activated'); }
            else if (action === 'close') { await seasonService.close(s._id); notify('Season closed'); }
            else { if (!confirm(`Delete season "${s.name}"?`)) return; await seasonService.delete(s._id); notify('Season deleted'); }
            await fetchSeasons(selectedLeague!._id);
            if (selectedSeason?._id === s._id) setSelectedSeason(null);
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    // ── Rules actions ────────────────────────────────────────────────────────

    const handleCreateRule = async () => {
        try {
            await leagueRulesService.create({
                name: ruleForm.name, gameId: ruleForm.gameId,
                formatType: ruleForm.formatType as any, matchType: ruleForm.matchType as any,
                pointsWin: +ruleForm.pointsWin, pointsDraw: +ruleForm.pointsDraw, pointsLoss: +ruleForm.pointsLoss,
                maxTeams: +ruleForm.maxTeams, maxForfeitsBeforeDisqualification: +ruleForm.maxForfeits,
                forfeitCountsAsLoss: !!ruleForm.forfeitLoss, tiebreaker: ruleForm.tiebreaker as any,
            });
            notify('Rule template created'); setShowCreateRule(false);
            setRuleForm({ name: '', gameId: '', formatType: 'LEAGUE', matchType: 'BO3', pointsWin: 3, pointsDraw: 1, pointsLoss: 0, maxTeams: 10, maxForfeits: 3, forfeitLoss: true, tiebreaker: 'GAME_DIFF' });
            await fetchRules();
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    const handleDeleteRule = async (id: string) => {
        if (!confirm('Delete this rule template?')) return;
        try { await leagueRulesService.delete(id); notify('Rule deleted'); await fetchRules(); }
        catch (e) { notify(apiErr(e), 'err'); }
    };

    // ── Rounds actions ───────────────────────────────────────────────────────

    const handleGenRounds = async () => {
        if (!selectedSeason) return;
        try {
            await roundService.generate({ seasonId: selectedSeason._id, startDate: genForm.startDate, weekCount: +genForm.weekCount });
            notify('Rounds generated'); setShowGenRounds(false);
            await fetchRounds(selectedSeason._id);
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    const handleRoundStatus = async (r: Round, status: Round['status']) => {
        try { await roundService.update(r._id, { status }); notify('Round updated'); await fetchRounds(selectedSeason!._id); }
        catch (e) { notify(apiErr(e), 'err'); }
    };

    // ── Match actions ────────────────────────────────────────────────────────

    const handleCreateMatch = async () => {
        if (!selectedRound || !selectedSeason) return;
        try {
            await matchAdminService.create({
                roundId: selectedRound._id, seasonId: selectedSeason._id,
                team1Id: matchForm.team1Id, team2Id: matchForm.team2Id,
                scheduledStart: matchForm.scheduledStart, scheduledEnd: matchForm.scheduledEnd || undefined,
                notes: matchForm.notes || undefined,
            });
            notify('Match scheduled'); setShowCreateMatch(false);
            setMatchForm({ team1Id: '', team2Id: '', scheduledStart: '', scheduledEnd: '', notes: '' });
            await fetchMatches(selectedRound._id);
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    const handleReportResult = async () => {
        if (!resultModal) return;
        try {
            await matchAdminService.reportResult(resultModal.match._id, { team1GamesWon: +resultForm.t1, team2GamesWon: +resultForm.t2 });
            notify('Result reported'); setResultModal(null);
            if (selectedRound) await fetchMatches(selectedRound._id);
            if (selectedSeason) await fetchStandings(selectedSeason._id);
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    const handleForfeit = async () => {
        if (!forfeitModal) return;
        try {
            await matchAdminService.forfeit(forfeitModal.match._id, { forfeitingTeamId: forfeitForm.forfeitingTeamId, forfeitReason: forfeitForm.reason });
            notify('Forfeit declared'); setForfeitModal(null);
            if (selectedRound) await fetchMatches(selectedRound._id);
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    const handleCancelMatch = async (m: AdminMatch) => {
        if (!confirm('Cancel this match?')) return;
        try { await matchAdminService.cancel(m._id); notify('Match cancelled'); if (selectedRound) await fetchMatches(selectedRound._id); }
        catch (e) { notify(apiErr(e), 'err'); }
    };

    // ── Team actions ─────────────────────────────────────────────────────────

    const handleRegisterTeam = async () => {
        if (!selectedSeason) return;
        try {
            await seasonTeamService.register({ seasonId: selectedSeason._id, teamId: teamForm.teamId, seed: teamForm.seed ? +teamForm.seed : undefined });
            notify('Team registered'); setShowRegTeam(false); setTeamForm({ teamId: '', seed: '' });
            await fetchTeams(selectedSeason._id);
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    const handleTeamAction = async (st: SeasonTeam, action: 'withdraw' | 'disqualify') => {
        const msg = action === 'withdraw' ? 'Withdraw this team?' : 'Disqualify this team?';
        if (!confirm(msg)) return;
        try {
            if (action === 'withdraw') await seasonTeamService.withdraw(st._id);
            else await seasonTeamService.disqualify(st._id);
            notify(`Team ${action}n`);
            await fetchTeams(selectedSeason!._id);
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    // ── Derived ──────────────────────────────────────────────────────────────

    const filteredLeagues = leagues.filter(l =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (levelFilter === 'all' || l.level === levelFilter)
    );

    const ongoingSeason = seasons.find(s => s.status === 'ONGOING') || seasons[0] || null;
    const activeSeason  = selectedSeason || ongoingSeason;

    const teamName = (id: string | { _id: string; name: string } | undefined) =>
        typeof id === 'object' ? id.name : id || '—';

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────

    const TABS: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
        { key: 'standings', label: 'Standings', icon: <BarChart2 size={14}/> },
        { key: 'seasons',   label: 'Seasons',   icon: <Calendar size={14}/> },
        { key: 'rules',     label: 'Rules',     icon: <BookOpen size={14}/> },
        { key: 'rounds',    label: 'Rounds',    icon: <Flag size={14}/> },
        { key: 'matches',   label: 'Matches',   icon: <Swords size={14}/> },
        { key: 'teams',     label: 'Teams',     icon: <Users size={14}/> },
    ];

    return (
        <div className="flex flex-col h-full gap-0 animate-fade-in-up">

            {/* ── Page header ─────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-0.5">League Hub</h1>
                    <p className="text-text-muted text-sm">Full lifecycle management — leagues · seasons · rules · rounds · matches · teams.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {selectedLeague?.status === LeagueStatus.FINISHED && !(selectedLeague as any).rewardsDistributed && (
                        <button onClick={async () => { try { await leagueService.distributeRewards(selectedLeague._id); notify('Rewards distributed'); } catch (e) { notify(apiErr(e), 'err'); } }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 transition-all">
                            <Award size={13}/> Distribute Rewards
                        </button>
                    )}
                    {selectedLeague && <>
                        <button onClick={() => { setEditingLeague(selectedLeague); setShowCreateLeague(true); }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all">
                            <Edit2 size={12}/> Edit League
                        </button>
                        <button onClick={handleDeleteLeague}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all">
                            <Trash2 size={12}/> Delete
                        </button>
                    </>}
                    <button onClick={() => { setEditingLeague(null); setShowCreateLeague(true); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90 transition-all">
                        <Plus size={13}/> Create League
                    </button>
                </div>
            </div>

            {/* ── Split layout ──────────────────────────────────────────── */}
            <div className="flex gap-4 flex-1 min-h-0" style={{ height: 'calc(100vh - 215px)' }}>

                {/* Left: League list */}
                <div className="w-64 flex-shrink-0 flex flex-col gap-2 overflow-hidden">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                        <Input placeholder="Search leagues…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 text-sm h-9" />
                    </div>
                    <select value={levelFilter} onChange={e => setLevelFilter(e.target.value as any)}
                        className="bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary w-full">
                        <option value="all">All Levels</option>
                        {Object.values(LeagueLevel).map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                    </select>

                    <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
                        {loading ? <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-primary animate-spin"/></div>
                        : filteredLeagues.length === 0 ? <p className="text-center py-8 text-text-muted text-xs font-bold uppercase opacity-40">No leagues</p>
                        : filteredLeagues.map(league => {
                            const lc = levelColors[league.level] || levelColors.REGIONAL;
                            const isSelected = selectedLeague?._id === league._id;
                            return (
                                <button key={league._id} onClick={() => setSelectedLeague(league)}
                                    className={cn('w-full text-left px-3.5 py-3 rounded-xl border transition-all duration-200 group',
                                        isSelected ? 'bg-primary/10 border-primary/35' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10')}>
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <span className={cn('font-black text-xs uppercase tracking-tight truncate', isSelected ? 'text-primary' : 'text-white')}>{league.name}</span>
                                        <Pill label={league.level.slice(0,4)} color={lc.pill}/>
                                    </div>
                                    <div className="flex items-center gap-2 text-[9px] font-bold text-text-muted uppercase">
                                        <span>{league.format}</span>
                                        <span className={cn(league.status === LeagueStatus.ONGOING ? 'text-green-500' : league.status === LeagueStatus.REGISTRATION ? 'text-blue-400' : '')}>
                                            {league.status}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Tabbed panel */}
                {!selectedLeague ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-text-muted bg-[#0f0f0f] border border-white/5 rounded-2xl">
                        <Trophy className="w-12 h-12 mb-3 opacity-15"/>
                        <p className="text-sm font-black uppercase tracking-widest opacity-40">Select a league</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col bg-[#0c0c0c] border border-white/5 rounded-2xl overflow-hidden min-w-0">

                        {/* Panel header */}
                        <div className="px-5 py-4 border-b border-white/5 bg-white/[0.015] flex items-center justify-between gap-4 shrink-0">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: (levelColors[selectedLeague.level]?.hex || '#6b7280') + '20', border: `1px solid ${levelColors[selectedLeague.level]?.hex || '#6b7280'}40` }}>
                                    <Trophy size={16} style={{ color: levelColors[selectedLeague.level]?.hex }}/>
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-black text-white text-base uppercase tracking-tight truncate">{selectedLeague.name}</h2>
                                        <Pill label={selectedLeague.level} color={levelColors[selectedLeague.level]?.pill}/>
                                    </div>
                                    <div className="flex items-center gap-3 mt-0.5 text-[9px] font-bold text-text-muted uppercase">
                                        <span className="flex items-center gap-1"><Globe size={9}/>{selectedLeague.regionId || 'Global'}</span>
                                        <span className="flex items-center gap-1"><Users size={9}/>{selectedLeague.maxTeams} max</span>
                                        <span className="flex items-center gap-1"><Calendar size={9}/>{fmtDate(selectedLeague.startDate)}</span>
                                        {activeSeason && <span className="flex items-center gap-1 text-primary"><Star size={9}/>{activeSeason.name}</span>}
                                    </div>
                                </div>
                            </div>
                            {/* Season selector */}
                            {seasons.length > 0 && (
                                <select value={activeSeason?._id || ''} onChange={e => setSelectedSeason(seasons.find(s => s._id === e.target.value) || null)}
                                    className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary shrink-0 max-w-[180px]">
                                    <option value="">— Select season —</option>
                                    {seasons.map(s => <option key={s._id} value={s._id}>{s.name} [{s.status}]</option>)}
                                </select>
                            )}
                        </div>

                        {/* Tab bar */}
                        <div className="flex items-center gap-0.5 px-4 py-2 border-b border-white/5 bg-white/[0.01] shrink-0 overflow-x-auto">
                            {TABS.map(t => (
                                <button key={t.key} onClick={() => setActiveTab(t.key)}
                                    className={cn('flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap',
                                        activeTab === t.key ? 'bg-primary/15 text-primary border border-primary/25' : 'text-text-muted hover:text-white hover:bg-white/5')}>
                                    {t.icon} {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab content */}
                        <div className="flex-1 overflow-y-auto">

                            {/* ══════════════ STANDINGS ══════════════ */}
                            {activeTab === 'standings' && (
                                <div className="p-4">
                                    {!activeSeason ? (
                                        <EmptyState icon={<BarChart2 size={28}/>} text="Select or create a season to see standings" />
                                    ) : standingsLoading ? <Spinner/> : (
                                        <>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">
                                                {activeSeason.name} · Standings
                                            </p>
                                            <div className="grid grid-cols-[44px_1fr_52px_52px_52px_52px_60px] items-center px-4 pb-2 gap-2">
                                                {['#','Team','MP','W','D','L','PTS'].map((h,i) => (
                                                    <span key={i} className={cn('text-[9px] font-black uppercase tracking-widest text-text-muted', i > 0 && 'text-center')}>
                                                        {h}
                                                    </span>
                                                ))}
                                            </div>
                                            {(standings.length > 0 ? standings : Array.from({ length: activeSeason.rulesId ? 8 : 8 })).map((p: any, idx) => {
                                                const isReal = !!p?._id;
                                                const name = isReal ? (typeof p.teamId === 'object' ? p.teamId?.name : p.teamId || 'Team') : '';
                                                const posColor = idx === 0 ? 'border-yellow-500/30 bg-yellow-500/[0.04]' : idx === 1 ? 'border-slate-400/25 bg-slate-400/[0.03]' : idx === 2 ? 'border-orange-600/25 bg-orange-600/[0.03]' : 'border-white/5';
                                                const badge = idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-slate-400 text-black' : idx === 2 ? 'bg-orange-600 text-white' : 'bg-white/10 text-text-muted';
                                                return (
                                                    <div key={idx} className={cn('grid grid-cols-[44px_1fr_52px_52px_52px_52px_60px] items-center px-4 py-3 rounded-xl border gap-2 mb-1.5 hover:bg-white/[0.025] transition-all', posColor)}>
                                                        <div className="flex justify-center">
                                                            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black', badge)}>{idx + 1}</div>
                                                        </div>
                                                        {isReal ? <>
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                                                    <Users size={13} className="text-white/30"/>
                                                                </div>
                                                                <span className="font-black text-sm text-white truncate">{name}</span>
                                                            </div>
                                                            <div className="text-center text-sm font-bold text-text-muted">{p.played ?? 0}</div>
                                                            <div className="text-center text-sm font-black text-green-400">{p.wins ?? 0}</div>
                                                            <div className="text-center text-sm font-black text-yellow-400">{p.draws ?? 0}</div>
                                                            <div className="text-center text-sm font-black text-red-400">{p.losses ?? 0}</div>
                                                            <div className="text-center"><span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 font-black text-sm">{p.points ?? 0}</span></div>
                                                        </> : <>
                                                            <div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06]"/><div className="h-2.5 w-24 bg-white/[0.06] rounded"/></div>
                                                            {[0,1,2,3].map(i => <div key={i} className="flex justify-center"><div className="h-3 w-5 bg-white/[0.04] rounded"/></div>)}
                                                            <div className="flex justify-center"><div className="h-6 w-9 bg-white/[0.04] rounded-lg"/></div>
                                                        </>}
                                                    </div>
                                                );
                                            })}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* ══════════════ SEASONS ══════════════ */}
                            {activeTab === 'seasons' && (
                                <div className="p-4 space-y-3">
                                    <SeasonTimeline seasons={seasons} rounds={rounds}/>

                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Seasons ({seasons.length})</p>
                                        <button onClick={() => setShowCreateSeason(v => !v)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 transition-all">
                                            <Plus size={11}/> New Season
                                        </button>
                                    </div>

                                    {/* Create form */}
                                    {showCreateSeason && (
                                        <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-4 space-y-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Create Season</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Field label="Season Name" required><input className={inputCls} placeholder="Spring Split 2026" value={seasonForm.name} onChange={e => setSeasonForm(f => ({...f, name: e.target.value}))}/></Field>
                                                <Field label="Rule Template" required>
                                                    <select className={selectCls} value={seasonForm.rulesId} onChange={e => setSeasonForm(f => ({...f, rulesId: e.target.value}))}>
                                                        <option value="">— Select rule —</option>
                                                        {rules.map(r => <option key={r._id} value={r._id}>{r.name} ({r.formatType} · {r.matchType})</option>)}
                                                    </select>
                                                </Field>
                                                <Field label="Reg. Deadline" required><input type="date" className={inputCls} value={seasonForm.registrationDeadline} onChange={e => setSeasonForm(f => ({...f, registrationDeadline: e.target.value}))}/></Field>
                                                <Field label="Start Date" required><input type="date" className={inputCls} value={seasonForm.startDate} onChange={e => setSeasonForm(f => ({...f, startDate: e.target.value}))}/></Field>
                                                <Field label="End Date" required><input type="date" className={inputCls} value={seasonForm.endDate} onChange={e => setSeasonForm(f => ({...f, endDate: e.target.value}))}/></Field>
                                                <Field label="Description"><input className={inputCls} placeholder="Optional…" value={seasonForm.description} onChange={e => setSeasonForm(f => ({...f, description: e.target.value}))}/></Field>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={handleCreateSeason} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90 transition-all"><Plus size={11}/> Create</button>
                                                <button onClick={() => setShowCreateSeason(false)} className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 text-text-muted hover:bg-white/10 transition-all">Cancel</button>
                                            </div>
                                        </div>
                                    )}

                                    {seasonsLoading ? <Spinner/> : seasons.length === 0 ? <EmptyState icon={<Calendar size={24}/>} text="No seasons yet — create the first one"/> : (
                                        <div className="space-y-2">
                                            {seasons.map(s => {
                                                const ruleLabel = typeof s.rulesId === 'object' ? s.rulesId.name : '—';
                                                return (
                                                    <div key={s._id} className="rounded-2xl border border-white/6 bg-white/[0.02] p-4 hover:bg-white/[0.035] transition-all">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-black text-white text-sm uppercase tracking-tight">{s.name}</span>
                                                                    <Pill label={s.status} color={statusColor[s.status]}/>
                                                                    <button onClick={() => setSelectedSeason(s)} className="text-[9px] font-black text-primary hover:underline">Use ↗</button>
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-3 text-[9px] font-bold text-text-muted uppercase">
                                                                    <span className="flex items-center gap-1"><BookOpen size={8}/> {ruleLabel}</span>
                                                                    <span className="flex items-center gap-1"><Calendar size={8}/> {fmtDate(s.startDate)} → {fmtDate(s.endDate)}</span>
                                                                    <span className="flex items-center gap-1 text-orange-400/70"><AlertTriangle size={8}/> Deadline {fmtDate(s.registrationDeadline)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                {s.status === 'PLANNED' && <ActionBtn icon={<Play size={11}/>} label="Activate" color="green" onClick={() => handleSeasonLifecycle(s, 'activate')}/>}
                                                                {s.status === 'ONGOING' && <ActionBtn icon={<CheckSquare size={11}/>} label="Close" color="blue" onClick={() => handleSeasonLifecycle(s, 'close')}/>}
                                                                <ActionBtn icon={<Trash2 size={11}/>} label="" color="red" onClick={() => handleSeasonLifecycle(s, 'delete')}/>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ══════════════ RULES ══════════════ */}
                            {activeTab === 'rules' && (
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Rule Templates ({rules.length})</p>
                                        <button onClick={() => setShowCreateRule(v => !v)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 transition-all">
                                            <Plus size={11}/> New Rule
                                        </button>
                                    </div>

                                    {showCreateRule && (
                                        <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-4 space-y-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Create Rule Template</p>
                                            <div className="grid grid-cols-3 gap-3">
                                                <Field label="Name" required><input className={inputCls} placeholder="Valorant Standard BO3" value={ruleForm.name} onChange={e => setRuleForm(f => ({...f, name: e.target.value}))}/></Field>
                                                <Field label="Game ID" required><input className={inputCls} placeholder="catalog _id" value={ruleForm.gameId} onChange={e => setRuleForm(f => ({...f, gameId: e.target.value}))}/></Field>
                                                <Field label="Format">
                                                    <select className={selectCls} value={ruleForm.formatType} onChange={e => setRuleForm(f => ({...f, formatType: e.target.value}))}>
                                                        {['LEAGUE','SWISS','KNOCKOUT'].map(v => <option key={v}>{v}</option>)}
                                                    </select>
                                                </Field>
                                                <Field label="Match Type">
                                                    <select className={selectCls} value={ruleForm.matchType} onChange={e => setRuleForm(f => ({...f, matchType: e.target.value}))}>
                                                        {['BO1','BO3','BO5'].map(v => <option key={v}>{v}</option>)}
                                                    </select>
                                                </Field>
                                                <Field label="Pts Win"><input type="number" className={inputCls} value={ruleForm.pointsWin} onChange={e => setRuleForm(f => ({...f, pointsWin: +e.target.value}))}/></Field>
                                                <Field label="Pts Draw"><input type="number" className={inputCls} value={ruleForm.pointsDraw} onChange={e => setRuleForm(f => ({...f, pointsDraw: +e.target.value}))}/></Field>
                                                <Field label="Pts Loss"><input type="number" className={inputCls} value={ruleForm.pointsLoss} onChange={e => setRuleForm(f => ({...f, pointsLoss: +e.target.value}))}/></Field>
                                                <Field label="Max Teams"><input type="number" className={inputCls} value={ruleForm.maxTeams} onChange={e => setRuleForm(f => ({...f, maxTeams: +e.target.value}))}/></Field>
                                                <Field label="Max Forfeits"><input type="number" className={inputCls} value={ruleForm.maxForfeits} onChange={e => setRuleForm(f => ({...f, maxForfeits: +e.target.value}))}/></Field>
                                                <Field label="Tiebreaker">
                                                    <select className={selectCls} value={ruleForm.tiebreaker} onChange={e => setRuleForm(f => ({...f, tiebreaker: e.target.value}))}>
                                                        {['POINTS','GAME_DIFF','HEAD_TO_HEAD'].map(v => <option key={v}>{v}</option>)}
                                                    </select>
                                                </Field>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={handleCreateRule} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90 transition-all"><Plus size={11}/> Create</button>
                                                <button onClick={() => setShowCreateRule(false)} className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 text-text-muted hover:bg-white/10 transition-all">Cancel</button>
                                            </div>
                                        </div>
                                    )}

                                    {rulesLoading ? <Spinner/> : rules.length === 0 ? <EmptyState icon={<BookOpen size={24}/>} text="No rule templates — create one first"/> : (
                                        <div className="grid grid-cols-1 gap-2">
                                            {rules.map(r => {
                                                const gameName = typeof r.gameId === 'object' ? r.gameId.title : r.gameId;
                                                return (
                                                    <div key={r._id} className="rounded-2xl border border-white/6 bg-white/[0.02] p-4 flex items-center justify-between gap-4 hover:bg-white/[0.04] transition-all">
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                <span className="font-black text-white text-sm">{r.name}</span>
                                                                <Pill label={r.formatType}/>
                                                                <Pill label={r.matchType} color="bg-primary/10 text-primary border-primary/20"/>
                                                            </div>
                                                            <div className="flex flex-wrap gap-3 text-[9px] font-bold text-text-muted uppercase">
                                                                <span>Game: {gameName}</span>
                                                                <span className="text-green-400">W +{r.pointsWin}</span>
                                                                <span className="text-yellow-400">D +{r.pointsDraw}</span>
                                                                <span className="text-red-400">L +{r.pointsLoss}</span>
                                                                <span>Max {r.maxTeams} teams</span>
                                                                <span>Tiebreak: {r.tiebreaker}</span>
                                                                {r.maxForfeitsBeforeDisqualification && <span className="text-orange-400">Max {r.maxForfeitsBeforeDisqualification} forfeits</span>}
                                                            </div>
                                                        </div>
                                                        <button onClick={() => handleDeleteRule(r._id)} className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-all shrink-0"><Trash2 size={13}/></button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ══════════════ ROUNDS ══════════════ */}
                            {activeTab === 'rounds' && (
                                <div className="p-4 space-y-3">
                                    {!activeSeason ? <EmptyState icon={<Flag size={24}/>} text="Select a season to manage rounds"/> : <>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Rounds for <span className="text-white">{activeSeason.name}</span> ({rounds.length})</p>
                                            <div className="flex gap-2">
                                                <button onClick={() => setShowGenRounds(v => !v)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 transition-all">
                                                    <Zap size={11}/> Generate
                                                </button>
                                            </div>
                                        </div>

                                        {showGenRounds && (
                                            <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-4 space-y-3">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Generate All Rounds</p>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Field label="First Round Date" required><input type="date" className={inputCls} value={genForm.startDate} onChange={e => setGenForm(f => ({...f, startDate: e.target.value}))}/></Field>
                                                    <Field label="Number of Weeks" required><input type="number" className={inputCls} value={genForm.weekCount} onChange={e => setGenForm(f => ({...f, weekCount: +e.target.value}))}/></Field>
                                                </div>
                                                <p className="text-[9px] text-text-muted">For 10 teams (round-robin): use 9 weeks. Each round is 7 days apart.</p>
                                                <div className="flex gap-2">
                                                    <button onClick={handleGenRounds} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90 transition-all"><Zap size={11}/> Generate</button>
                                                    <button onClick={() => setShowGenRounds(false)} className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 text-text-muted hover:bg-white/10 transition-all">Cancel</button>
                                                </div>
                                            </div>
                                        )}

                                        {roundsLoading ? <Spinner/> : rounds.length === 0 ? <EmptyState icon={<Flag size={24}/>} text="No rounds yet — generate them"/> : (
                                            <div className="grid grid-cols-1 gap-2">
                                                {rounds.map(r => (
                                                    <div key={r._id} className={cn('rounded-2xl border p-4 flex items-center justify-between gap-4 transition-all cursor-pointer', selectedRound?._id === r._id ? 'border-primary/30 bg-primary/[0.04]' : 'border-white/6 bg-white/[0.02] hover:bg-white/[0.04]')} onClick={() => { setSelectedRound(r); setActiveTab('matches'); }}>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                                                {r.roundNumber}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-white text-sm">Round {r.roundNumber}</p>
                                                                <p className="text-[9px] font-bold text-text-muted">{fmtDate(r.startDate)} → {fmtDate(r.endDate)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Pill label={r.status} color={statusColor[r.status]}/>
                                                            {r.status === 'SCHEDULED' && <ActionBtn icon={<Play size={11}/>} label="Start" color="green" onClick={e => { e.stopPropagation(); handleRoundStatus(r, 'ONGOING'); }}/>}
                                                            {r.status === 'ONGOING' && <ActionBtn icon={<CheckSquare size={11}/>} label="Complete" color="blue" onClick={e => { e.stopPropagation(); handleRoundStatus(r, 'COMPLETED'); }}/>}
                                                            <span className="text-[9px] text-text-muted font-bold">→ Matches</span>
                                                            <ChevronRight size={12} className="text-text-muted"/>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>}
                                </div>
                            )}

                            {/* ══════════════ MATCHES ══════════════ */}
                            {activeTab === 'matches' && (
                                <div className="p-4 space-y-3">
                                    {/* Round selector */}
                                    {rounds.length > 0 && (
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mr-1">Round:</p>
                                            {rounds.map(r => (
                                                <button key={r._id} onClick={() => setSelectedRound(r)}
                                                    className={cn('px-3 py-1.5 rounded-xl text-[10px] font-black transition-all', selectedRound?._id === r._id ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-text-muted border border-white/8 hover:border-white/20')}>
                                                    R{r.roundNumber} <span className="opacity-50">({r.status.slice(0,3)})</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {!selectedRound ? <EmptyState icon={<Swords size={24}/>} text="Select a round to view matches"/> : <>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Matches in Round {selectedRound.roundNumber} ({matches.length})</p>
                                            <button onClick={() => setShowCreateMatch(v => !v)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 transition-all">
                                                <Plus size={11}/> Schedule Match
                                            </button>
                                        </div>

                                        {showCreateMatch && (
                                            <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-4 space-y-3">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Schedule Match</p>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Field label="Team 1 ID" required><input className={inputCls} placeholder="teamId…" value={matchForm.team1Id} onChange={e => setMatchForm(f => ({...f, team1Id: e.target.value}))}/></Field>
                                                    <Field label="Team 2 ID" required><input className={inputCls} placeholder="teamId…" value={matchForm.team2Id} onChange={e => setMatchForm(f => ({...f, team2Id: e.target.value}))}/></Field>
                                                    <Field label="Scheduled Start" required><input type="datetime-local" className={inputCls} value={matchForm.scheduledStart} onChange={e => setMatchForm(f => ({...f, scheduledStart: e.target.value}))}/></Field>
                                                    <Field label="Scheduled End"><input type="datetime-local" className={inputCls} value={matchForm.scheduledEnd} onChange={e => setMatchForm(f => ({...f, scheduledEnd: e.target.value}))}/></Field>
                                                    <Field label="Notes" ><input className={inputCls} placeholder="Stream on…" value={matchForm.notes} onChange={e => setMatchForm(f => ({...f, notes: e.target.value}))}/></Field>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={handleCreateMatch} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90 transition-all"><Plus size={11}/> Schedule</button>
                                                    <button onClick={() => setShowCreateMatch(false)} className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 text-text-muted hover:bg-white/10 transition-all">Cancel</button>
                                                </div>
                                            </div>
                                        )}

                                        {matchesLoading ? <Spinner/> : matches.length === 0 ? <EmptyState icon={<Swords size={24}/>} text="No matches in this round yet"/> : (
                                            <div className="space-y-2">
                                                {matches.map(m => {
                                                    const t1 = teamName(m.team1Id); const t2 = teamName(m.team2Id);
                                                    return (
                                                        <div key={m._id} className="rounded-2xl border border-white/6 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-all">
                                                            <div className="flex items-center justify-between gap-4">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className="text-center min-w-[100px]">
                                                                        <p className="font-black text-white text-xs truncate">{t1}</p>
                                                                        <p className="text-[8px] text-text-muted">Team 1</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 text-text-muted">
                                                                        {m.status === 'COMPLETED' ? (
                                                                            <span className="font-black text-lg text-white">{m.team1GamesWon ?? 0} – {m.team2GamesWon ?? 0}</span>
                                                                        ) : <Swords size={16}/>}
                                                                    </div>
                                                                    <div className="text-center min-w-[100px]">
                                                                        <p className="font-black text-white text-xs truncate">{t2}</p>
                                                                        <p className="text-[8px] text-text-muted">Team 2</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    <Pill label={m.status} color={statusColor[m.status]}/>
                                                                    <p className="text-[9px] text-text-muted">{fmtDate(m.scheduledStart)}</p>
                                                                    {m.status === 'SCHEDULED' || m.status === 'ONGOING' ? <>
                                                                        <ActionBtn icon={<ClipboardList size={11}/>} label="Result" color="green" onClick={() => { setResultModal({ match: m }); setResultForm({ t1: 0, t2: 0 }); }}/>
                                                                        <ActionBtn icon={<AlertTriangle size={11}/>} label="Forfeit" color="orange" onClick={() => { setForfeitModal({ match: m }); setForfeitForm({ forfeitingTeamId: '', reason: '' }); }}/>
                                                                        <ActionBtn icon={<XCircle size={11}/>} label="" color="red" onClick={() => handleCancelMatch(m)}/>
                                                                    </> : null}
                                                                </div>
                                                            </div>
                                                            {m.notes && <p className="mt-2 text-[9px] text-text-muted/60 border-t border-white/5 pt-2">{m.notes}</p>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>}
                                </div>
                            )}

                            {/* ══════════════ TEAMS ══════════════ */}
                            {activeTab === 'teams' && (
                                <div className="p-4 space-y-3">
                                    {!activeSeason ? <EmptyState icon={<Users size={24}/>} text="Select a season to manage teams"/> : <>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                                                Teams in <span className="text-white">{activeSeason.name}</span> ({teams.length})
                                                {activeSeason.status !== 'PLANNED' && <span className="text-orange-400 ml-2">· Registration {activeSeason.status === 'ONGOING' ? 'closed' : 'N/A'}</span>}
                                            </p>
                                            {activeSeason.status === 'PLANNED' && (
                                                <button onClick={() => setShowRegTeam(v => !v)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 transition-all">
                                                    <Plus size={11}/> Register Team
                                                </button>
                                            )}
                                        </div>

                                        {showRegTeam && (
                                            <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-4 space-y-3">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Register Team</p>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Field label="Team ID" required><input className={inputCls} placeholder="teamId…" value={teamForm.teamId} onChange={e => setTeamForm(f => ({...f, teamId: e.target.value}))}/></Field>
                                                    <Field label="Seed (optional)"><input type="number" className={inputCls} placeholder="1" value={teamForm.seed} onChange={e => setTeamForm(f => ({...f, seed: e.target.value}))}/></Field>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={handleRegisterTeam} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90 transition-all"><Plus size={11}/> Register</button>
                                                    <button onClick={() => setShowRegTeam(false)} className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 text-text-muted hover:bg-white/10 transition-all">Cancel</button>
                                                </div>
                                            </div>
                                        )}

                                        {teamsLoading ? <Spinner/> : teams.length === 0 ? <EmptyState icon={<Users size={24}/>} text="No teams registered yet"/> : (
                                            <div className="space-y-2">
                                                {teams.map((st, idx) => {
                                                    const name = typeof st.teamId === 'object' ? st.teamId.name : st.teamId;
                                                    return (
                                                        <div key={st._id} className="rounded-2xl border border-white/6 bg-white/[0.02] p-3.5 flex items-center justify-between gap-4 hover:bg-white/[0.04] transition-all">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-text-muted shrink-0">{idx + 1}</div>
                                                                <div className="min-w-0">
                                                                    <p className="font-black text-white text-sm truncate">{name}</p>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <Pill label={st.status} color={st.status === 'ACTIVE' ? 'bg-green-500/15 text-green-400 border-green-500/25' : st.status === 'DISQUALIFIED' ? 'bg-red-500/15 text-red-400 border-red-500/25' : 'bg-gray-500/15 text-gray-400 border-gray-500/25'}/>
                                                                        {st.seed && <span className="text-[9px] font-bold text-text-muted">Seed #{st.seed}</span>}
                                                                        {(st.forfeits || 0) > 0 && <span className="text-[9px] font-bold text-orange-400">{st.forfeits} forfeit{st.forfeits !== 1 ? 's' : ''}</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {st.status === 'ACTIVE' && (
                                                                <div className="flex gap-1.5 shrink-0">
                                                                    <ActionBtn icon={<RotateCcw size={11}/>} label="Withdraw" color="orange" onClick={() => handleTeamAction(st, 'withdraw')}/>
                                                                    <ActionBtn icon={<Shield size={11}/>} label="DQ" color="red" onClick={() => handleTeamAction(st, 'disqualify')}/>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>}
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </div>

            {/* ── Modals ──────────────────────────────────────────────── */}

            {/* Report result modal */}
            {resultModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setResultModal(null)}>
                    <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="font-black text-white uppercase tracking-tight mb-4">Report Result</h3>
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <div className="text-center flex-1">
                                <p className="text-xs font-black text-white mb-2">{teamName(resultModal.match.team1Id)}</p>
                                <input type="number" min="0" className={cn(inputCls, 'text-center text-2xl font-black')} value={resultForm.t1} onChange={e => setResultForm(f => ({...f, t1: +e.target.value}))}/>
                            </div>
                            <span className="text-text-muted font-black text-xl">–</span>
                            <div className="text-center flex-1">
                                <p className="text-xs font-black text-white mb-2">{teamName(resultModal.match.team2Id)}</p>
                                <input type="number" min="0" className={cn(inputCls, 'text-center text-2xl font-black')} value={resultForm.t2} onChange={e => setResultForm(f => ({...f, t2: +e.target.value}))}/>
                            </div>
                        </div>
                        <p className="text-[9px] text-text-muted mb-4">Games won by each team (e.g. 2–1 for a BO3 win).</p>
                        <div className="flex gap-2">
                            <button onClick={handleReportResult} className="flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90 transition-all">Submit Result</button>
                            <button onClick={() => setResultModal(null)} className="px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-white/5 text-text-muted hover:bg-white/10 transition-all">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Forfeit modal */}
            {forfeitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setForfeitModal(null)}>
                    <div className="bg-[#0f0f0f] border border-red-500/20 rounded-3xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="font-black text-white uppercase tracking-tight mb-1">Declare Forfeit</h3>
                        <p className="text-[10px] text-text-muted mb-4">The forfeiting team will receive a loss and their forfeit counter increments.</p>
                        <div className="space-y-3 mb-4">
                            <Field label="Forfeiting Team ID" required>
                                <select className={selectCls} value={forfeitForm.forfeitingTeamId} onChange={e => setForfeitForm(f => ({...f, forfeitingTeamId: e.target.value}))}>
                                    <option value="">— Select team —</option>
                                    {[forfeitModal.match.team1Id, forfeitModal.match.team2Id].map((tid, i) => {
                                        const id = typeof tid === 'object' ? tid._id : tid;
                                        const nm = teamName(tid);
                                        return <option key={i} value={id}>{nm}</option>;
                                    })}
                                </select>
                            </Field>
                            <Field label="Reason"><input className={inputCls} placeholder="Team did not show up…" value={forfeitForm.reason} onChange={e => setForfeitForm(f => ({...f, reason: e.target.value}))}/></Field>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleForfeit} className="flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-red-500/80 text-white hover:bg-red-500 transition-all">Declare Forfeit</button>
                            <button onClick={() => setForfeitModal(null)} className="px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-white/5 text-text-muted hover:bg-white/10 transition-all">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* League create/edit modal */}
            <CreateLeagueModal
                isOpen={showCreateLeague}
                onClose={() => { setShowCreateLeague(false); setEditingLeague(null); }}
                onSubmit={handleLeagueSubmit}
                league={editingLeague || undefined}
            />

            {/* Toast */}
            {toast && <Toast msg={toast.msg} type={toast.type}/>}
        </div>
    );
}

// ─── Micro components ─────────────────────────────────────────────────────────

function Spinner() {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin"/></div>;
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-14 gap-3 text-text-muted">
            <div className="opacity-20">{icon}</div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-center max-w-[200px]">{text}</p>
        </div>
    );
}

function ActionBtn({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: 'green' | 'blue' | 'red' | 'orange'; onClick: (e: React.MouseEvent) => void }) {
    const colors = {
        green:  'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20',
        blue:   'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20',
        red:    'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20',
        orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20',
    };
    return (
        <button onClick={onClick} className={cn('flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all', colors[color])}>
            {icon}{label && <span>{label}</span>}
        </button>
    );
}

// Suppress unused imports lint
const _unused = { Settings, List, Star, Globe, BarChart2 };
void _unused;
