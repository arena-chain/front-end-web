import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Trophy, Loader2, Crown, Calendar,
} from 'lucide-react';
import { leagueService, type League } from '../../services/leagueService';
import { seasonService, type Season } from '../../services/seasonService';
import {
    getSeasonRule,
    getPrizePool,
    getSeasonTeamsWithPlayers,
    getMatchesBySeason,
    getAdminBracket,
    getAdminStandings,
    getStages,
    type AdminMatch,
    type SeasonRule,
    type PrizePool,
    type SeasonTeamWithPlayersRow,
    type AdminBracket,
    type StandingEntry,
    type Stage,
} from '../../services/adminLeagueService';
import { cn } from '../../lib/utils';
import { expandPlaceholderSingleElimBracket } from '../../lib/syntheticSingleElimBracket';
import {
    LiquipediaParticipantCard,
    buildTeamNameMapFromRows,
    teamNameFromMap,
} from '../../components/leagues/LiquipediaParticipantCard';

type LeagueFull = League & {
    startDate?: string;
    endDate?: string;
    status?: string;
    format?: string;
    maxTeams?: number;
    description?: string;
};

function fmtDate(d?: string | Date) {
    if (!d) return '—';
    const x = typeof d === 'string' ? new Date(d) : d;
    return x.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function teamFromMatchSide(side: AdminMatch['team1Id']): string {
    if (side && typeof side === 'object' && 'name' in side) return (side as { name: string }).name;
    return 'TBD';
}

const LEVEL_CLS: Record<string, string> = {
    INTERNATIONAL: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
    CONTINENTAL: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    NATIONAL: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
    REGIONAL: 'border-primary/30 bg-primary/10 text-primary',
};
const STATUS_CLS: Record<string, string> = {
    ONGOING: 'border-green-500/30 bg-green-500/10 text-green-400',
    PLANNED: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    FINISHED: 'border-white/10 bg-white/5 text-white/40',
};

const TOC = [
    { id: 'format', label: 'Format & Rules' },
    { id: 'prize', label: 'Prize Pool' },
    { id: 'participants', label: 'Participants' },
    { id: 'results', label: 'Standings' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'playoffs', label: 'Bracket' },
] as const;

export type PlayerLeagueWikiPageProps = {
    /**
     * Parent-selected league when embedded under `/player/leagues` (no `:id` in the URL).
     * Without this, `useParams().id` is undefined and the page would spin forever.
     */
    embeddedLeagueId?: string;
};

export default function PlayerLeagueWikiPage({ embeddedLeagueId }: PlayerLeagueWikiPageProps) {
    const params = useParams<{ id: string }>();
    /** Prefer explicit id from parent (embedded tab); else full-page routes like `/player/leagues/:id/hub` */
    const id = embeddedLeagueId ?? params.id;
    const navigate = useNavigate();

    const [league, setLeague] = useState<LeagueFull | null>(null);
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [seasonId, setSeasonId] = useState<string | null>(null);
    const [rule, setRule] = useState<SeasonRule | null>(null);
    const [prize, setPrize] = useState<PrizePool | null>(null);
    const [participantRows, setParticipantRows] = useState<SeasonTeamWithPlayersRow[]>([]);
    const [matches, setMatches] = useState<AdminMatch[]>([]);
    const [bracket, setBracket] = useState<AdminBracket | null>(null);
    const [standings, setStandings] = useState<StandingEntry[]>([]);
    const [stages, setStages] = useState<Stage[]>([]);
    const [loadingLeague, setLoadingLeague] = useState(true);
    const [loadingSeason, setLoadingSeason] = useState(false);

    useEffect(() => {
        if (!id) {
            setLeague(null);
            setSeasons([]);
            setSeasonId(null);
            setLoadingLeague(false);
            return;
        }
        let c = false;
        (async () => {
            setLoadingLeague(true);
            try {
                const L = await leagueService.getLeagueById(id);
                if (c) return;
                setLeague(L as LeagueFull);
                const ss = await seasonService.getByLeague(id);
                if (c) return;
                setSeasons(ss);
                const pick = ss.find((s) => s.status === 'ONGOING') ?? ss[0];
                setSeasonId(pick?._id ?? null);
            } catch {
                if (!c) setLeague(null);
            } finally {
                if (!c) setLoadingLeague(false);
            }
        })();
        return () => {
            c = true;
        };
    }, [id]);

    useEffect(() => {
        if (!seasonId) {
            setRule(null);
            setPrize(null);
            setParticipantRows([]);
            setMatches([]);
            setBracket(null);
            setStandings([]);
            setStages([]);
            return;
        }
        let c = false;
        (async () => {
            setLoadingSeason(true);
            try {
                const [r, p, t, m, b, st, sg] = await Promise.all([
                    getSeasonRule(seasonId),
                    getPrizePool(seasonId),
                    getSeasonTeamsWithPlayers(seasonId),
                    getMatchesBySeason(seasonId),
                    getAdminBracket(seasonId),
                    getAdminStandings(seasonId),
                    getStages(seasonId),
                ]);
                if (c) return;
                setRule(r);
                setPrize(p);
                setParticipantRows(t);
                setMatches(m);
                setBracket(b);
                setStandings(Array.isArray(st) ? st : []);
                setStages(Array.isArray(sg) ? sg : []);
            } catch (e) {
                console.error(e);
            } finally {
                if (!c) setLoadingSeason(false);
            }
        })();
        return () => {
            c = true;
        };
    }, [seasonId]);

    const matchesSorted = useMemo(
        () => [...matches].sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()),
        [matches],
    );

    const matchesByRound = useMemo(() => {
        const map = new Map<string, AdminMatch[]>();
        for (const m of matchesSorted) {
            const label =
                typeof m.roundId === 'object' && m.roundId && 'roundNumber' in m.roundId
                    ? `Round ${(m.roundId as { roundNumber: number }).roundNumber}`
                    : 'Matches';
            map.set(label, [...(map.get(label) || []), m]);
        }
        return map;
    }, [matchesSorted]);

    const teamNameMap = useMemo(() => buildTeamNameMapFromRows(participantRows), [participantRows]);

    /** Full tree when API still has a one-slot placeholder (e.g. Maghreb `gf1` only). */
    const displayBracket = useMemo(
        () => expandPlaceholderSingleElimBracket(bracket, participantRows),
        [bracket, participantRows],
    );

    const bracketByRound = useMemo(() => {
        if (!displayBracket?.slots?.length) return new Map<number, AdminBracket['slots']>();
        const m = new Map<number, AdminBracket['slots']>();
        for (const s of displayBracket.slots) {
            const r = s.roundNumber;
            m.set(r, [...(m.get(r) || []), s]);
        }
        for (const [r, list] of m) {
            list.sort((a, b) => a.position - b.position);
            m.set(r, list);
        }
        return m;
    }, [displayBracket]);

    if (loadingLeague) {
        return (
            <div className="flex h-full min-h-[50vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!league) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-white/40">
                <Trophy className="h-14 w-14" />
                <p className="text-sm font-black uppercase tracking-widest">League not found</p>
                <button
                    type="button"
                    onClick={() => navigate('/player/leagues')}
                    className="rounded-xl border border-white/15 px-4 py-2 text-xs font-bold text-white hover:bg-white/5"
                >
                    Back to leagues
                </button>
            </div>
        );
    }

    const season = seasons.find((s) => s._id === seasonId);

    return (
        <div className="h-full min-h-0 overflow-y-auto">
            <div className="max-w-[1200px] mx-auto px-6">
                {/* HERO */}
                <div className="-mx-6 px-6 pt-8 pb-10 mb-0 border-b border-white/[0.05]" style={{ background: 'linear-gradient(160deg,#0b1a0b 0%,transparent 60%)' }}>
                    <button type="button" onClick={() => navigate(`/player/leagues/${league._id}`)} className="mb-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/25 hover:text-primary transition-colors">
                        <ArrowLeft size={12} /> Back to league hub
                    </button>
                    <div className="flex flex-col sm:flex-row gap-5 items-start mb-8">
                        <div className="w-20 h-20 flex-shrink-0 rounded-2xl border border-white/[0.08] bg-black/50 flex items-center justify-center overflow-hidden">
                            {league.logoUrl ? <img src={league.logoUrl} alt="" className="w-full h-full object-contain p-2" /> : <Trophy className="w-10 h-10 text-primary/40" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap gap-2 mb-3">
                                <LevelBadge level={league.level} />
                                {season && <StatusBadge status={season.status} />}
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white leading-none">{league.name}</h1>
                            {season && <p className="mt-2 text-sm text-white/35 font-semibold">{season.name} · {fmtDate(season.startDate)} – {fmtDate(season.endDate)}</p>}
                            {league.description && <p className="mt-2 text-sm text-white/25 max-w-2xl leading-relaxed">{league.description}</p>}
                        </div>
                        {seasons.length > 0 && (
                            <div className="flex-shrink-0 flex flex-col gap-1">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/25">Season</label>
                                <select value={seasonId ?? ''} onChange={e => setSeasonId(e.target.value || null)} className="rounded-xl border border-white/[0.1] bg-black/60 px-4 py-2.5 text-sm font-bold text-white focus:outline-none">
                                    {seasons.map(s => <option key={s._id} value={s._id}>{s.name} ({s.status})</option>)}
                                </select>
                                {loadingSeason && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <HeroStat emoji="🏆" label="Prize Pool" value={prize ? `${prize.currency} ${prize.totalAmount?.toLocaleString()}` : '—'} accent />
                        <HeroStat emoji="👥" label="Teams" value={participantRows.length ? String(participantRows.length) : '—'} />
                        <HeroStat emoji="🎮" label="Format" value={rule ? `${rule.formatType} · ${rule.matchType}` : '—'} />
                        <HeroStat emoji="📅" label="Reg. Deadline" value={season ? fmtDate(season.registrationDeadline) : '—'} />
                    </div>
                </div>

                {/* STICKY NAV */}
                <nav className="sticky top-0 z-20 -mx-6 mb-8 border-b border-white/[0.05] bg-[#07080d]/95 backdrop-blur-xl">
                    <div className="flex items-center h-11 px-6 gap-0.5 overflow-x-auto">
                        {TOC.map(t => <a key={t.id} href={`#${t.id}`} className="flex-shrink-0 h-full flex items-center px-4 text-[10px] font-black uppercase tracking-widest text-white/25 border-b-2 border-transparent hover:text-white hover:border-primary/50 transition-all">{t.label}</a>)}
                    </div>
                </nav>


                {/* Format */}
                <section id="format" className="scroll-mt-20 border-b border-white/[0.06] pb-10 mb-10">
                    <div className="flex items-center gap-3 mb-6"><span className="text-xl">🎯</span><h2 className="text-lg font-black uppercase tracking-tight text-white">Format & Rules</h2><div className="flex-1 h-px bg-white/[0.05]" /></div>
                    {!rule ? <div className="rounded-xl border border-white/[0.05] p-8 text-center text-sm text-white/25">No rules published for this season.</div> : (
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                                {([['Match Format',rule.matchType],['Structure',rule.formatType],['Win Pts',String(rule.pointsWin)],['Loss Pts',String(rule.pointsLoss)],['Max Teams',String(rule.maxTeams)],['Max Forfeits',String(rule.maxForfeitsBeforeDisqualification)],['Forfeit=Loss',rule.forfeitCountsAsLoss?'Yes':'No'],['Side Selection',rule.sideSelection.replace(/_/g,' ')],['Score Submit',rule.scoreSubmissionMethod.replace(/_/g,' ')],['Tiebreaker',rule.tiebreaker.replace(/_/g,' ')]] as [string,string][]).map(([k,v])=>(
                                    <div key={k} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-1.5">{k}</p>
                                        <p className="text-sm font-black text-white">{v}</p>
                                    </div>
                                ))}
                            </div>
                            {rule.mapPool?.length > 0 && (
                                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-3">Map Pool</p>
                                    <div className="flex flex-wrap gap-2">{rule.mapPool.map(m=><span key={m} className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-xs font-bold text-white/55">{m}</span>)}</div>
                                </div>
                            )}
                            {rule.overtimeConfig?.enabled && (
                                <div className="flex items-center gap-4 rounded-xl border border-primary/15 bg-primary/[0.03] p-4">
                                    <span className="text-3xl">⏱</span>
                                    <div><p className="text-xs font-black text-primary uppercase tracking-widest">Overtime Active</p><p className="text-sm text-white/45 mt-0.5">{rule.overtimeConfig.format?.replace(/_/g,' ')} · {rule.overtimeConfig.maxRoundsPerPeriod} rounds/period</p></div>
                                </div>
                            )}
                            {stages.length > 0 && (
                                <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                                    <div className="px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.05]"><p className="text-[9px] font-black uppercase tracking-widest text-primary">Stages</p></div>
                                    {stages.slice().sort((a,b)=>a.orderIndex-b.orderIndex).map((st,i)=>(
                                        <div key={st._id} className="px-4 py-3 flex items-center gap-3 border-b border-white/[0.04] last:border-0">
                                            <span className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black text-primary flex items-center justify-center flex-shrink-0">{i+1}</span>
                                            <div className="flex-1 min-w-0"><p className="text-sm font-bold text-white">{st.name}</p><p className="text-[10px] text-white/30">{fmtDate(st.startAt)} → {fmtDate(st.endAt)}</p></div>
                                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border border-white/10 text-white/30">{st.stageType}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Prize */}
                <section id="prize" className="scroll-mt-20 border-b border-white/[0.06] pb-10 mb-10">
                    <div className="flex items-center gap-3 mb-6"><span className="text-xl">💰</span><h2 className="text-lg font-black uppercase tracking-tight text-white">Prize Pool</h2><div className="flex-1 h-px bg-white/[0.05]" /></div>
                    {!prize || !prize.distribution?.length ? <div className="rounded-xl border border-white/[0.05] p-8 text-center text-sm text-white/25">Prize distribution not published.</div> : (
                        <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
                            <div className="px-6 py-6 border-b border-white/[0.06]" style={{ background: 'linear-gradient(135deg,rgba(255,200,0,0.05) 0%,transparent 50%)' }}>
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-1.5">Total Prize Pool</p>
                                <p className="text-4xl font-black text-white">{prize.currency} {prize.totalAmount?.toLocaleString()}</p>
                                <span className="mt-2 inline-block text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-yellow-500/20 bg-yellow-500/[0.07] text-yellow-400/80">{prize.source?.replace(/_/g,' ')}</span>
                            </div>
                            <table className="w-full">
                                <thead><tr className="border-b border-white/[0.05]">{['Place','Prize','Share',''].map(h=><th key={h} className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-white/25">{h}</th>)}</tr></thead>
                                <tbody>
                                    {[...prize.distribution].sort((a,b)=>a.rank-b.rank).map(row=>(
                                        <tr key={row.rank} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors">
                                            <td className="px-5 py-4"><span className="flex items-center gap-2 text-sm font-black"><span>{row.rank===1?'🥇':row.rank===2?'🥈':row.rank===3?'🥉':'🏅'}</span><span className={row.rank===1?'text-yellow-400':row.rank===2?'text-slate-300':row.rank===3?'text-amber-500':'text-white/50'}>{(['1st','2nd','3rd'] as const)[row.rank-1]??`${row.rank}th`} Place</span></span></td>
                                            <td className="px-5 py-4 font-black text-white">{prize.currency} {row.amount.toLocaleString()}</td>
                                            <td className="px-5 py-4 text-sm text-white/35 font-bold">{row.percentage}%</td>
                                            <td className="px-5 py-4"><div className="w-28 h-1.5 rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-primary/70" style={{width:`${row.percentage}%`}} /></div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* Participants */}
                <section id="participants" className="scroll-mt-20 border-b border-white/[0.06] pb-10 mb-10">
                    <div className="flex items-center gap-3 mb-6"><span className="text-xl">🛡️</span><h2 className="text-lg font-black uppercase tracking-tight text-white">Participants</h2><div className="flex-1 h-px bg-white/[0.05]" /></div>
                    <p className="text-[11px] text-white/35 mb-4 -mt-2">Liquipedia-style cards — logo with shield fallback; click a card to view roster.</p>
                    {participantRows.length === 0 ? (
                        <div className="rounded-xl border border-white/[0.05] p-8 text-center text-sm text-white/25">No teams registered.</div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {participantRows.map((row) => (
                                <LiquipediaParticipantCard key={row.registration._id} row={row} />
                            ))}
                        </div>
                    )}
                </section>

                {/* Results */}
                <section id="results" className="scroll-mt-28 border-b border-white/[0.06] pb-10 mb-10">
                    <div className="flex items-center gap-3 mb-6"><span className="text-xl">⚔️</span><h2 className="text-lg font-black uppercase tracking-tight text-white">Schedule & Results</h2><div className="flex-1 h-px bg-white/[0.05]" /></div>
                    {matchesSorted.length === 0 ? (
                        <p className="text-sm text-white/35">No matches scheduled for this season.</p>
                    ) : (
                        <div className="space-y-8">
                            {standings.length > 0 && (
                                <div className="overflow-hidden rounded-xl border border-white/10">
                                    <p className="border-b border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary">
                                        Standings (season)
                                    </p>
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="text-[9px] font-black uppercase tracking-widest text-white/35">
                                                <th className="px-3 py-2">#</th>
                                                <th className="px-3 py-2">Team</th>
                                                <th className="px-3 py-2 text-center">P</th>
                                                <th className="px-3 py-2 text-center">W</th>
                                                <th className="px-3 py-2 text-center">Pts</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.05]">
                                            {[...standings]
                                                .sort((a, b) => (a.rank || 0) - (b.rank || 0))
                                                .map((s) => {
                                                    const tid = s.teamId;
                                                    const nm =
                                                        tid && typeof tid === 'object' ? (tid as { name: string }).name : 'Team';
                                                    return (
                                                        <tr key={s._id} className="text-white/75">
                                                            <td className="px-3 py-2 font-bold">{s.rank || '—'}</td>
                                                            <td className="px-3 py-2 font-semibold text-white">{nm}</td>
                                                            <td className="px-3 py-2 text-center">{s.played}</td>
                                                            <td className="px-3 py-2 text-center text-green-400/90">{s.wins}</td>
                                                            <td className="px-3 py-2 text-center font-black text-primary">{s.points}</td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {Array.from(matchesByRound.entries()).map(([roundLabel, list]) => (
                                <div key={roundLabel}>
                                    <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-white/50">
                                        {roundLabel}
                                    </h3>
                                    <div className="space-y-2">
                                        {list.map((m) => (
                                            <MatchWikiRow key={m._id} m={m} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Playoffs bracket */}
                <section id="playoffs" className="scroll-mt-28 pb-10">
                    <div className="flex items-center gap-3 mb-6"><span className="text-xl">🌲</span><h2 className="text-lg font-black uppercase tracking-tight text-white">Playoffs Bracket</h2><div className="flex-1 h-px bg-white/[0.05]" /></div>
                    {!displayBracket || !displayBracket.slots?.length ? (
                        <p className="text-sm text-white/35">
                            No elimination bracket is published. Double-elimination and Swiss stages may appear under
                            schedule above.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-xs text-white/40">
                                {displayBracket.format?.replace(/_/g, ' ')} · {displayBracket.status} — scroll sideways on small screens.
                            </p>
                            <div className="w-full overflow-x-auto rounded-xl border border-white/10 bg-black/50 pb-4 pt-2">
                                <div className="flex gap-8 min-w-max px-3 items-start">
                                    {Array.from(bracketByRound.entries())
                                        .sort(([a], [b]) => a - b)
                                        .map(([roundNum, slots]) => {
                                            const tr = displayBracket.totalRounds || 1;
                                            const roundTitle =
                                                roundNum === tr
                                                    ? 'Grand final'
                                                    : roundNum === tr - 1 && tr > 1
                                                      ? 'Semifinals'
                                                      : roundNum === tr - 2 && tr > 2
                                                        ? 'Quarterfinals'
                                                        : `Round ${roundNum}`;
                                            return (
                                                <div key={roundNum} className="w-[240px] shrink-0 flex flex-col gap-3">
                                                    <p className="text-center text-[10px] font-black uppercase tracking-widest text-cyan-400 border-b border-white/10 pb-2">
                                                        {roundTitle}
                                                    </p>
                                                    {slots.map((slot) => {
                                                        const wid = slot.winnerId != null ? String(slot.winnerId) : '';
                                                        const t1 = slot.team1Id != null ? String(slot.team1Id) : '';
                                                        const t2 = slot.team2Id != null ? String(slot.team2Id) : '';
                                                        const t1w = wid !== '' && t1 !== '' && wid === t1;
                                                        const t2w = wid !== '' && t2 !== '' && wid === t2;
                                                        return (
                                                            <div
                                                                key={slot.slotId}
                                                                className="rounded-lg border border-white/15 bg-[#12141c] overflow-hidden shadow-lg shadow-black/40"
                                                            >
                                                                <div
                                                                    className={cn(
                                                                        'px-3 py-2.5 flex justify-between gap-2 text-sm font-bold border-b border-white/5',
                                                                        t1w ? 'bg-primary/15 border-l-2 border-l-primary text-white' : 'text-white/70',
                                                                    )}
                                                                >
                                                                    <span className="truncate">{teamNameFromMap(teamNameMap, slot.team1Id)}</span>
                                                                    {t1w ? <Crown className="w-3.5 h-3.5 text-yellow-400 shrink-0" /> : null}
                                                                </div>
                                                                <div
                                                                    className={cn(
                                                                        'px-3 py-2.5 flex justify-between gap-2 text-sm font-bold',
                                                                        t2w ? 'bg-primary/15 border-l-2 border-l-primary text-white' : 'text-white/70',
                                                                    )}
                                                                >
                                                                    <span className="truncate">{teamNameFromMap(teamNameMap, slot.team2Id)}</span>
                                                                    {t2w ? <Crown className="w-3.5 h-3.5 text-yellow-400 shrink-0" /> : null}
                                                                </div>
                                                                <div className="text-[9px] text-white/35 px-3 py-1.5 bg-black/40 border-t border-white/5 font-mono">
                                                                    {slot.slotId} · {slot.status}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                <footer className="mt-12 border-t border-white/[0.04] py-8 text-center text-[9px] text-white/15 font-black uppercase tracking-widest">
                    Arena Chain League System
                </footer>
            </div>
        </div>
    );
}

function LevelBadge({ level }: { level: string }) {
    return <span className={cn('text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border', LEVEL_CLS[level] ?? 'border-white/10 bg-white/5 text-white/40')}>{level}</span>;
}

function StatusBadge({ status }: { status: string }) {
    return (
        <span className={cn('inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border', STATUS_CLS[status] ?? 'border-white/10 bg-white/5 text-white/40')}>
            {status === 'ONGOING' && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />}
            {status}
        </span>
    );
}

function HeroStat({ emoji, label, value, accent }: { emoji: string; label: string; value: string; accent?: boolean }) {
    return (
        <div className={cn('rounded-xl border px-4 py-3', accent ? 'border-yellow-500/20 bg-yellow-500/[0.04]' : 'border-white/[0.06] bg-white/[0.02]')}>
            <div className="flex items-center gap-2 mb-1"><span className="text-sm">{emoji}</span><p className="text-[9px] font-black uppercase tracking-widest text-white/25">{label}</p></div>
            <p className={cn('text-sm font-black truncate', accent ? 'text-yellow-400' : 'text-white')}>{value}</p>
        </div>
    );
}

function MatchWikiRow({ m }: { m: AdminMatch }) {
    const t1 = teamFromMatchSide(m.team1Id);
    const t2 = teamFromMatchSide(m.team2Id);
    const done = m.status === 'COMPLETED' || m.status === 'FORFEIT';
    const live = m.status === 'ONGOING';
    const t1w = done && m.team1GamesWon > m.team2GamesWon;
    const t2w = done && m.team2GamesWon > m.team1GamesWon;
    return (
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] hover:border-white/[0.1] transition-all overflow-hidden">
            {live && <div className="px-4 py-1.5 bg-red-500/10 border-b border-red-500/15 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /><span className="text-[9px] font-black uppercase tracking-widest text-red-400">Live Now</span></div>}
            <div className="px-5 py-4 flex items-center gap-4">
                <div className={cn('flex-1 flex items-center gap-2 min-w-0', t2w && 'opacity-45')}><span className={cn('text-sm font-black truncate', t1w ? 'text-white' : 'text-white/60')}>{t1}</span>{t1w && <Crown className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />}</div>
                <div className="flex-shrink-0 text-center min-w-[64px]">{done ? <span className="text-xl font-black text-white tabular-nums">{m.team1GamesWon} <span className="text-white/20 text-sm">:</span> {m.team2GamesWon}</span> : <span className="text-xs font-black text-white/30 uppercase tracking-widest">vs</span>}</div>
                <div className={cn('flex-1 flex items-center gap-2 justify-end min-w-0', t1w && 'opacity-45')}>{t2w && <Crown className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />}<span className={cn('text-sm font-black truncate', t2w ? 'text-white' : 'text-white/60')}>{t2}</span></div>
            </div>
            <div className="px-5 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2"><Calendar className="w-3 h-3 text-white/20" /><span className="text-[10px] text-white/25 font-bold">{fmtDate(m.scheduledStart)}</span>{m.format && <span className="text-[10px] text-white/20 font-bold">· {m.format}</span>}{m.streamUrl && <a href={m.streamUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-primary/60 hover:text-primary ml-2">▶ Stream</a>}</div>
                <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border', m.status==='COMPLETED'?'border-green-500/20 text-green-400/70':m.status==='ONGOING'?'border-red-500/20 text-red-400':m.status==='FORFEIT'?'border-red-500/20 text-red-400/60':'border-white/10 text-white/25')}>{m.status}</span>
            </div>
        </div>
    );
}
