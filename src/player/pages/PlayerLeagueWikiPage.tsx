import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Trophy, Users, Award, BookOpen, LayoutGrid, GitBranch,
    Swords, ExternalLink, Lock, Loader2,
} from 'lucide-react';
import { leagueService, type League } from '../../services/leagueService';
import { seasonService, type Season } from '../../services/seasonService';
import {
    getSeasonRule,
    getPrizePool,
    getSeasonTeams,
    getMatchesBySeason,
    getAdminBracket,
    getAdminStandings,
    getStages,
    type AdminMatch,
    type SeasonRule,
    type PrizePool,
    type SeasonTeamEntry,
    type AdminBracket,
    type StandingEntry,
    type Stage,
} from '../../services/adminLeagueService';
import { cn } from '../../lib/utils';

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

function teamLabel(id: string | undefined, roster: SeasonTeamEntry[]): string {
    if (!id) return 'TBD';
    for (const row of roster) {
        const t = row.teamId;
        if (typeof t === 'object' && t._id === id) return t.name ?? 'Team';
        if (typeof t === 'string' && t === id) return 'Team';
    }
    return 'TBD';
}

function teamFromMatchSide(side: AdminMatch['team1Id']): string {
    if (side && typeof side === 'object' && 'name' in side) return (side as { name: string }).name;
    return 'TBD';
}

const TOC = [
    { id: 'about', label: 'About' },
    { id: 'format', label: 'Format & rules' },
    { id: 'prize', label: 'Prize pool' },
    { id: 'participants', label: 'Participants' },
    { id: 'results', label: 'Schedule & results' },
    { id: 'playoffs', label: 'Playoffs' },
] as const;

export default function PlayerLeagueWikiPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [league, setLeague] = useState<LeagueFull | null>(null);
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [seasonId, setSeasonId] = useState<string | null>(null);
    const [rule, setRule] = useState<SeasonRule | null>(null);
    const [prize, setPrize] = useState<PrizePool | null>(null);
    const [roster, setRoster] = useState<SeasonTeamEntry[]>([]);
    const [matches, setMatches] = useState<AdminMatch[]>([]);
    const [bracket, setBracket] = useState<AdminBracket | null>(null);
    const [standings, setStandings] = useState<StandingEntry[]>([]);
    const [stages, setStages] = useState<Stage[]>([]);
    const [loadingLeague, setLoadingLeague] = useState(true);
    const [loadingSeason, setLoadingSeason] = useState(false);

    useEffect(() => {
        if (!id) return;
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
            setRoster([]);
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
                    getSeasonTeams(seasonId),
                    getMatchesBySeason(seasonId),
                    getAdminBracket(seasonId),
                    getAdminStandings(seasonId),
                    getStages(seasonId),
                ]);
                if (c) return;
                setRule(r);
                setPrize(p);
                setRoster(t);
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

    const bracketByRound = useMemo(() => {
        if (!bracket?.slots?.length) return new Map<number, AdminBracket['slots']>();
        const m = new Map<number, AdminBracket['slots']>();
        for (const s of bracket.slots) {
            const r = s.roundNumber;
            m.set(r, [...(m.get(r) || []), s]);
        }
        return m;
    }, [bracket]);

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
        <div className="h-full min-h-0 overflow-y-auto pb-16 animate-fade-in-up">
            <div className="mx-auto max-w-3xl px-4 pt-4 md:px-6">
                <button
                    type="button"
                    onClick={() => navigate(`/player/leagues/${league._id}`)}
                    className="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/45 hover:text-primary transition-colors"
                >
                    <ArrowLeft size={14} />
                    Back to league hub
                </button>

                {/* Title block — Liquipedia-style headline */}
                <header className="mb-6 border-b border-white/10 pb-8">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary">
                            {league.level}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white/40">
                            <Lock size={10} /> View only
                        </span>
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tight text-white md:text-4xl">{league.name}</h1>
                    {league.description && (
                        <p className="mt-3 text-sm leading-relaxed text-white/45">{league.description}</p>
                    )}

                    {seasons.length > 0 && (
                        <div className="mt-5 flex flex-wrap items-center gap-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/35">Season</label>
                            <select
                                value={seasonId ?? ''}
                                onChange={(e) => setSeasonId(e.target.value || null)}
                                className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-primary/40"
                            >
                                {seasons.map((s) => (
                                    <option key={s._id} value={s._id}>
                                        {s.name} ({s.status})
                                    </option>
                                ))}
                            </select>
                            {loadingSeason && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                        </div>
                    )}
                </header>

                {/* Sticky TOC */}
                <nav
                    className="sticky top-0 z-10 -mx-4 mb-8 flex flex-wrap gap-1 border-b border-white/10 bg-[#070708]/95 px-4 py-3 backdrop-blur-md md:-mx-6 md:px-6"
                    aria-label="Page sections"
                >
                    {TOC.map((item) => (
                        <a
                            key={item.id}
                            href={`#${item.id}`}
                            className="rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/40 transition-colors hover:bg-white/5 hover:text-primary"
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>

                {/* About */}
                <section id="about" className="scroll-mt-28 border-b border-white/[0.06] pb-10 mb-10">
                    <h2 className="mb-6 flex items-center gap-2 border-l-4 border-primary pl-4 text-lg font-black uppercase tracking-tight text-white">
                        <BookOpen size={18} className="text-primary" />
                        League information
                    </h2>
                    <div className="overflow-hidden rounded-xl border border-white/10">
                        <table className="w-full text-left text-sm">
                            <tbody className="divide-y divide-white/[0.06]">
                                <InfoRow label="Series / league" value={league.name} />
                                <InfoRow label="Tier" value={league.level.replace('_', ' ')} />
                                <InfoRow
                                    label="Season dates"
                                    value={
                                        season
                                            ? `${fmtDate(season.startDate)} – ${fmtDate(season.endDate)}`
                                            : `${fmtDate(league.startDate)} – ${fmtDate(league.endDate)}`
                                    }
                                />
                                <InfoRow
                                    label="Registration deadline"
                                    value={season ? fmtDate(season.registrationDeadline) : '—'}
                                />
                                <InfoRow label="Teams" value={roster.length ? String(roster.length) : '—'} />
                                <InfoRow label="Max teams (rules)" value={rule?.maxTeams != null ? String(rule.maxTeams) : '—'} />
                                <InfoRow label="Game" value={typeof league.gameId === 'string' ? league.gameId : '—'} />
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Format */}
                <section id="format" className="scroll-mt-28 border-b border-white/[0.06] pb-10 mb-10">
                    <h2 className="mb-6 flex items-center gap-2 border-l-4 border-primary pl-4 text-lg font-black uppercase tracking-tight text-white">
                        <LayoutGrid size={18} className="text-primary" />
                        Format & rules
                    </h2>
                    {!rule ? (
                        <p className="text-sm text-white/35">No season rules are published for this season yet.</p>
                    ) : (
                        <div className="space-y-4 text-sm text-white/70">
                            <ul className="list-disc space-y-2 pl-5 marker:text-primary">
                                <li>
                                    <span className="font-bold text-white">Structure:</span> {rule.formatType} ·{' '}
                                    <span className="text-white/50">match format {rule.matchType}</span>
                                </li>
                                <li>
                                    <span className="font-bold text-white">Points:</span> win {rule.pointsWin} · loss{' '}
                                    {rule.pointsLoss} · tiebreaker {rule.tiebreaker?.replace(/_/g, ' ') ?? '—'}
                                </li>
                                <li>
                                    <span className="font-bold text-white">Map pool:</span>{' '}
                                    {rule.mapPool?.length ? rule.mapPool.join(' · ') : '—'}
                                </li>
                                <li>
                                    <span className="font-bold text-white">Side selection:</span>{' '}
                                    {rule.sideSelection?.replace(/_/g, ' ') ?? '—'}
                                </li>
                                <li>
                                    <span className="font-bold text-white">Score submission:</span>{' '}
                                    {rule.scoreSubmissionMethod?.replace(/_/g, ' ') ?? '—'}
                                </li>
                                {rule.overtimeConfig?.enabled && (
                                    <li>
                                        <span className="font-bold text-white">Overtime:</span>{' '}
                                        {rule.overtimeConfig.format?.replace(/_/g, ' ') ?? 'On'}
                                    </li>
                                )}
                            </ul>
                            {stages.length > 0 && (
                                <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                                    <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-primary">
                                        Stages
                                    </p>
                                    <ol className="space-y-2">
                                        {stages
                                            .slice()
                                            .sort((a, b) => a.orderIndex - b.orderIndex)
                                            .map((st) => (
                                                <li key={st._id} className="flex flex-wrap gap-2 text-xs">
                                                    <span className="font-bold text-white">{st.name}</span>
                                                    <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] uppercase text-white/40">
                                                        {st.stageType}
                                                    </span>
                                                    <span className="text-white/35">
                                                        {fmtDate(st.startAt)} → {fmtDate(st.endAt)}
                                                    </span>
                                                </li>
                                            ))}
                                    </ol>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Prize */}
                <section id="prize" className="scroll-mt-28 border-b border-white/[0.06] pb-10 mb-10">
                    <h2 className="mb-6 flex items-center gap-2 border-l-4 border-primary pl-4 text-lg font-black uppercase tracking-tight text-white">
                        <Award size={18} className="text-primary" />
                        Prize pool
                    </h2>
                    {!prize || !prize.distribution?.length ? (
                        <p className="text-sm text-white/35">Prize distribution is not published.</p>
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-white/10">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/40">
                                        <th className="px-4 py-3">Place</th>
                                        <th className="px-4 py-3">Amount</th>
                                        <th className="px-4 py-3">Share</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.06]">
                                    {[...prize.distribution]
                                        .sort((a, b) => a.rank - b.rank)
                                        .map((row) => (
                                            <tr key={row.rank} className="text-white/80">
                                                <td className="px-4 py-2.5 font-bold">
                                                    {row.rank === 1
                                                        ? '1st'
                                                        : row.rank === 2
                                                          ? '2nd'
                                                          : row.rank === 3
                                                            ? '3rd'
                                                            : `${row.rank}th`}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    {prize.currency} {row.amount.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-2.5 text-white/45">{row.percentage}%</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                            <p className="border-t border-white/10 px-4 py-2 text-xs text-white/35">
                                Total {prize.currency} {prize.totalAmount?.toLocaleString?.() ?? '—'} · {prize.source?.replace(/_/g, ' ')}
                            </p>
                        </div>
                    )}
                </section>

                {/* Participants */}
                <section id="participants" className="scroll-mt-28 border-b border-white/[0.06] pb-10 mb-10">
                    <h2 className="mb-6 flex items-center gap-2 border-l-4 border-primary pl-4 text-lg font-black uppercase tracking-tight text-white">
                        <Users size={18} className="text-primary" />
                        Participants
                    </h2>
                    {roster.length === 0 ? (
                        <p className="text-sm text-white/35">No teams are registered for this season yet.</p>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {roster.map((row) => {
                                const t = row.teamId;
                                const name = typeof t === 'object' ? t.name : 'Team';
                                const logo = typeof t === 'object' ? t.logo : undefined;
                                const tag = typeof t === 'object' ? t.tag : undefined;
                                return (
                                    <div
                                        key={row._id}
                                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4"
                                    >
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/40">
                                            {logo ? (
                                                <img src={logo} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <Trophy className="h-5 w-5 text-white/20" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-black text-white">{name}</p>
                                            <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest text-white/35">
                                                {tag && <span className="text-primary/80">[{tag}]</span>}
                                                <span>Seed {row.seed ?? '—'}</span>
                                                <span>{row.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Results */}
                <section id="results" className="scroll-mt-28 border-b border-white/[0.06] pb-10 mb-10">
                    <h2 className="mb-6 flex items-center gap-2 border-l-4 border-primary pl-4 text-lg font-black uppercase tracking-tight text-white">
                        <Swords size={18} className="text-primary" />
                        Schedule & results
                    </h2>
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
                    <h2 className="mb-6 flex items-center gap-2 border-l-4 border-primary pl-4 text-lg font-black uppercase tracking-tight text-white">
                        <GitBranch size={18} className="text-primary" />
                        Playoffs bracket
                    </h2>
                    {!bracket || !bracket.slots?.length ? (
                        <p className="text-sm text-white/35">
                            No elimination bracket is published. Double-elimination and Swiss stages may appear under
                            schedule above.
                        </p>
                    ) : (
                        <div className="space-y-8">
                            <p className="text-xs text-white/40">
                                {bracket.format?.replace(/_/g, ' ')} · {bracket.status}
                            </p>
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {Array.from(bracketByRound.entries())
                                    .sort(([a], [b]) => a - b)
                                    .map(([roundNum, slots]) => (
                                        <div key={roundNum} className="min-w-[200px] shrink-0">
                                            <p className="mb-3 text-center text-[10px] font-black uppercase tracking-widest text-primary">
                                                Round {roundNum}
                                            </p>
                                            <div className="flex flex-col gap-3">
                                                {slots.map((slot) => (
                                                    <div
                                                        key={slot.slotId}
                                                        className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs"
                                                    >
                                                        <div className="mb-2 flex justify-between text-[9px] font-black uppercase tracking-widest text-white/30">
                                                            <span>{slot.status}</span>
                                                        </div>
                                                        <div
                                                            className={cn(
                                                                'rounded border px-2 py-1.5 font-bold',
                                                                slot.winnerId === slot.team1Id
                                                                    ? 'border-primary/40 bg-primary/10 text-white'
                                                                    : 'border-white/5 text-white/60',
                                                            )}
                                                        >
                                                            {teamLabel(slot.team1Id, roster)}
                                                        </div>
                                                        <div className="py-1 text-center text-[10px] text-white/25">vs</div>
                                                        <div
                                                            className={cn(
                                                                'rounded border px-2 py-1.5 font-bold',
                                                                slot.winnerId === slot.team2Id
                                                                    ? 'border-primary/40 bg-primary/10 text-white'
                                                                    : 'border-white/5 text-white/60',
                                                            )}
                                                        >
                                                            {teamLabel(slot.team2Id, roster)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </section>

                <footer className="mt-12 border-t border-white/10 pt-8 text-center text-[10px] text-white/25">
                    Layout inspired by tournament wikis such as{' '}
                    <a
                        href="https://liquipedia.net/counterstrike/BLAST/Open/2026/Spring"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary/80 hover:underline"
                    >
                        Liquipedia <ExternalLink size={10} />
                    </a>
                    . Data comes from your Arena Chain league configuration.
                </footer>
            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <tr>
            <th className="w-[40%] px-4 py-2.5 text-left text-[11px] font-black uppercase tracking-widest text-white/35">
                {label}
            </th>
            <td className="px-4 py-2.5 text-sm font-semibold text-white/90">{value}</td>
        </tr>
    );
}

function MatchWikiRow({ m }: { m: AdminMatch }) {
    const t1 = teamFromMatchSide(m.team1Id);
    const t2 = teamFromMatchSide(m.team2Id);
    const done = m.status === 'COMPLETED' || m.status === 'FORFEIT';
    const live = m.status === 'ONGOING';
    return (
        <div className="flex flex-col gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                    {fmtDate(m.scheduledStart)}
                </span>
                <div className="flex flex-1 flex-wrap items-center gap-2 font-black text-sm text-white">
                    <span className={cn(done && m.team1GamesWon > m.team2GamesWon && 'text-primary')}>{t1}</span>
                    <span className="text-white/25">
                        {done ? `${m.team1GamesWon} – ${m.team2GamesWon}` : live ? 'LIVE' : 'vs'}
                    </span>
                    <span className={cn(done && m.team2GamesWon > m.team1GamesWon && 'text-primary')}>{t2}</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className="rounded border border-white/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white/40">
                    {m.status}
                </span>
                {m.streamUrl && (
                    <a
                        href={m.streamUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                    >
                        Stream <ExternalLink size={10} />
                    </a>
                )}
            </div>
        </div>
    );
}
