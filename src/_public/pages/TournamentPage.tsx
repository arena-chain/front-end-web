import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Trophy, Calendar, Users, Globe, ArrowLeft, PlayCircle,
    CheckCircle, Clock, Crown, Shield, Swords, Layers,
    GitBranch, DollarSign, ChevronDown, ChevronRight, Tv2,
    Star, AlertCircle, TrendingUp,
} from 'lucide-react';
import { leagueService, type League } from '../../services/leagueService';
import { seasonService, type Season } from '../../services/seasonService';
import {
    getSeasonTeamsWithPlayers,
    getPrizePool, getStages, getGroups,
    getAdminRounds, getMatchesByRound, getAdminStandings, getAdminBracket,
    type SeasonTeamEntry, type SeasonTeamWithPlayersRow, type PrizePool, type Stage, type Group,
    type AdminRound, type AdminMatch, type StandingEntry, type AdminBracket,
} from '../../services/adminLeagueService';
import {
    LiquipediaParticipantCard,
    buildTeamNameMapFromRows,
    teamNameFromMap,
} from '../../components/leagues/LiquipediaParticipantCard';
import { expandPlaceholderSingleElimBracket } from '../../lib/syntheticSingleElimBracket';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt     = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtTime = (d: string) => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

function tName(t: unknown): string {
    if (!t) return 'TBD';
    if (typeof t === 'object' && t !== null && 'name' in t) return (t as { name: string }).name;
    if (typeof t === 'string') return t.slice(-5);
    return 'TBD';
}
function tId(t: unknown): string {
    if (!t) return '';
    if (typeof t === 'string') return t;
    if (typeof t === 'object' && '_id' in t) return (t as { _id: string })._id;
    return '';
}
function tLogo(t: unknown): string | undefined {
    if (t && typeof t === 'object' && 'logo' in t) return (t as { logo?: string }).logo || undefined;
    return undefined;
}

const S_CLS: Record<string, string> = {
    PLANNED: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    ONGOING: 'bg-green-500/20 text-green-300 border-green-500/30',
    FINISHED: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    SCHEDULED: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
    COMPLETED: 'bg-green-500/15 text-green-300 border-green-500/25',
    FORFEIT: 'bg-red-500/15 text-red-300 border-red-500/25',
    CANCELLED: 'bg-slate-500/15 text-slate-300 border-slate-500/25',
    ACTIVE: 'bg-green-500/15 text-green-300 border-green-500/25',
    READY: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/25',
    PENDING: 'bg-slate-500/15 text-slate-300 border-slate-500/25',
    UPCOMING: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
};


// ─── Countdown ────────────────────────────────────────────────────────────────
function Countdown({ target }: { target: string }) {
    const [diff, setDiff] = useState(0);
    useEffect(() => {
        const tick = () => setDiff(new Date(target).getTime() - Date.now());
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [target]);

    if (diff <= 0) return <span className="text-green-400 font-black text-sm animate-pulse">🔴 LIVE NOW</span>;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const cls = diff < 600000 ? 'text-red-400' : diff < 3600000 ? 'text-yellow-400' : 'text-white';
    return (
        <span className={`font-black text-sm tabular-nums ${cls}`}>
            {d > 0 ? `${d}d ` : ''}{String(h).padStart(2, '0')}h {String(m).padStart(2, '0')}m {String(s).padStart(2, '0')}s
        </span>
    );
}

// ─── Match Card ───────────────────────────────────────────────────────────────
function MatchCard({ m, compact = false }: { m: AdminMatch; compact?: boolean }) {
    const [exp, setExp] = useState(false);
    const done = m.status === 'COMPLETED';
    const live = m.status === 'ONGOING';
    const w1 = m.team1GamesWon ?? 0;
    const w2 = m.team2GamesWon ?? 0;

    return (
        <div className={`bg-[#1a1e28] border rounded-xl overflow-hidden transition-all ${live ? 'border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.1)]' : 'border-white/8 hover:border-white/15'}`}>
            <div className={`${compact ? 'px-4 py-3' : 'px-5 py-4'}`}>
                {!compact && (
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-slate-500 flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />{fmt(m.scheduledStart)} · {fmtTime(m.scheduledStart)}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${S_CLS[m.status]}`}>{live ? '🔴 LIVE' : m.status}</span>
                        {m.format && <span className="text-[10px] text-slate-500 font-medium">{m.format}</span>}
                    </div>
                )}
                <div className="flex items-center gap-3">
                    {/* Team 1 */}
                    <div className={`flex items-center gap-2 flex-1 ${done && w2 > w1 ? 'opacity-40' : ''}`}>
                        <div className="w-8 h-8 rounded-lg bg-[#00ff00]/8 border border-[#00ff00]/15 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {tLogo(m.team1Id) ? <img src={tLogo(m.team1Id)} alt="" className="w-full h-full object-cover" /> : <Shield className="w-4 h-4 text-[#00ff00]/40" />}
                        </div>
                        <span className={`text-sm font-bold truncate ${done && w1 > w2 ? 'text-white' : 'text-slate-300'}`}>{tName(m.team1Id)}</span>
                        {done && w1 > w2 && <Crown className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />}
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {done ? (
                            <span className="text-xl font-black text-white tabular-nums">{w1} <span className="text-slate-600 text-sm font-normal">:</span> {w2}</span>
                        ) : live ? (
                            <div className="text-center"><span className="text-[#00ff00] text-xs font-black animate-pulse">LIVE</span></div>
                        ) : (
                            <div className="text-center space-y-0.5">
                                <p className="text-slate-400 text-xs font-black">VS</p>
                                <Countdown target={m.scheduledStart} />
                            </div>
                        )}
                    </div>

                    {/* Team 2 */}
                    <div className={`flex items-center gap-2 flex-1 justify-end ${done && w1 > w2 ? 'opacity-40' : ''}`}>
                        {done && w2 > w1 && <Crown className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />}
                        <span className={`text-sm font-bold truncate text-right ${done && w2 > w1 ? 'text-white' : 'text-slate-300'}`}>{tName(m.team2Id)}</span>
                        <div className="w-8 h-8 rounded-lg bg-[#00ff00]/8 border border-[#00ff00]/15 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {tLogo(m.team2Id) ? <img src={tLogo(m.team2Id)} alt="" className="w-full h-full object-cover" /> : <Shield className="w-4 h-4 text-[#00ff00]/40" />}
                        </div>
                    </div>
                </div>

                {!compact && (
                    <div className="flex items-center justify-between mt-3">
                        {m.streamUrl ? (
                            <a href={m.streamUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-[#00ff00] hover:underline">
                                <Tv2 className="w-3.5 h-3.5" /> Watch Live
                            </a>
                        ) : <div />}
                        {done && m.games && m.games.length > 0 && (
                            <button onClick={() => setExp(!exp)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors">
                                Map details <ChevronDown className={`w-3.5 h-3.5 transition-transform ${exp ? 'rotate-180' : ''}`} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {exp && m.games && m.games.length > 0 && (
                <div className="border-t border-white/5 px-5 py-3 space-y-1.5">
                    {m.games.map(g => (
                        <div key={g.gameNumber} className="flex items-center gap-4 text-xs">
                            <span className="text-slate-500 font-bold w-14">Game {g.gameNumber}</span>
                            {g.mapName && <span className="text-[#00ff00] font-medium">{g.mapName}</span>}
                            {g.team1Score !== undefined && (
                                <span className="text-white font-bold tabular-nums">{g.team1Score} – {g.team2Score}</span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ season, stages, teams, matches }: { season: Season; stages: Stage[]; teams: SeasonTeamEntry[]; matches: AdminMatch[] }) {
    const upcoming = matches.filter(m => m.status === 'SCHEDULED' || m.status === 'ONGOING').slice(0, 1);
    const recent   = [...matches].filter(m => m.status === 'COMPLETED').reverse().slice(0, 5);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Format + Next match */}
            <div className="lg:col-span-2 space-y-6">
                {/* Format */}
                <div className="bg-[#1a1e28] border border-white/8 rounded-2xl p-5">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4"></h3>
                    <div className="space-y-3">
                        {stages.length === 0 ? (
                            <p className="text-slate-500 text-sm">Format details will be announced.</p>
                        ) : (
                            stages.sort((a, b) => a.orderIndex - b.orderIndex).map((s, i) => (
                                <div key={s._id} className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-[#00ff00]/10 border border-[#00ff00]/20 flex items-center justify-center text-[#00ff00] text-xs font-black flex-shrink-0 mt-0.5">{i + 1}</span>
                                    <div>
                                        <p className="text-white font-bold text-sm">{s.name}</p>
                                        <p className="text-slate-500 text-xs mt-0.5">
                                            {s.stageType === 'GROUPS' && `Round-robin groups · Top ${s.advancementCount} per group advance`}
                                            {s.stageType === 'BRACKET' && `Single/Double Elimination · Best-of-3 (Grand Final: Best-of-5)`}
                                            {s.stageType === 'SWISS' && `Swiss format · ${s.advancementCount} teams advance`}
                                            {s.stageType === 'LEAGUE' && `League round-robin · Top ${s.advancementCount} teams advance`}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Next match */}
                {upcoming.length > 0 && (
                    <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Next Match</h3>
                        {upcoming.map(m => <MatchCard key={m._id} m={m} />)}
                    </div>
                )}

                {/* Recent results */}
                {recent.length > 0 && (
                    <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Recent Results</h3>
                        <div className="space-y-2">
                            {recent.map(m => <MatchCard key={m._id} m={m} compact />)}
                        </div>
                    </div>
                )}
            </div>

            {/* Right: Quick info */}
            <div className="space-y-4">
                <div className="bg-[#1a1e28] border border-white/8 rounded-2xl p-5 space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Info</h3>
                    {[
                        { label: 'Teams', value: `${teams.length} registered` },
                        { label: 'Start', value: fmt(season.startDate) },
                        { label: 'End', value: fmt(season.endDate) },
                        { label: 'Reg. Deadline', value: fmt(season.registrationDeadline) },
                    ].map(r => (
                        <div key={r.label} className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">{r.label}</span>
                            <span className="text-sm text-white font-medium">{r.value}</span>
                        </div>
                    ))}
                </div>
                <div className="bg-[#1a1e28] border border-white/8 rounded-2xl p-5">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Matches</h3>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                            { val: matches.length, label: 'Total', cls: 'text-white' },
                            { val: matches.filter(m => m.status === 'COMPLETED').length, label: 'Done', cls: 'text-green-400' },
                            { val: matches.filter(m => m.status === 'SCHEDULED' || m.status === 'ONGOING').length, label: 'Left', cls: 'text-blue-400' },
                        ].map(s => (
                            <div key={s.label} className="bg-[#0d0f14] rounded-xl py-2">
                                <p className={`text-xl font-black ${s.cls}`}>{s.val}</p>
                                <p className="text-[10px] text-slate-500">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Participants Tab ─────────────────────────────────────────────────────────
function ParticipantsTab({ rows }: { rows: SeasonTeamWithPlayersRow[] }) {
    if (!rows.length) return (
        <div className="text-center py-16 text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Participants will be announced soon.</p>
        </div>
    );
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-3">
            {rows.map((row) => (
                <LiquipediaParticipantCard key={row.registration._id} row={row} />
            ))}
        </div>
    );
}

// ─── Groups Tab ───────────────────────────────────────────────────────────────
function GroupsTab({ seasonId, groupStage }: { seasonId: string; groupStage: Stage | null }) {
    const [groups, setGroups] = useState<Group[]>([]);
    const [standingsMap, setStandingsMap] = useState<Record<string, StandingEntry[]>>({});
    const [matchesMap, setMatchesMap] = useState<Record<string, AdminMatch[]>>({});

    useEffect(() => {
        if (!groupStage) return;
        getGroups(groupStage._id).then(async (gs) => {
            setGroups(gs);
            const [sMap, mMap] = await Promise.all([
                Promise.all(gs.map(g => getAdminStandings(seasonId, g._id).then(s => [g._id, s] as const))),
                Promise.all(gs.map(g => {
                    const gid = g._id;
                    return getAdminRounds(seasonId).then(async rounds => {
                        const allM: AdminMatch[] = [];
                        for (const r of rounds) {
                            const ms = await getMatchesByRound(r._id);
                            allM.push(...ms.filter(m => m.groupId === gid));
                        }
                        return [gid, allM] as const;
                    });
                })),
            ]);
            setStandingsMap(Object.fromEntries(sMap));
            setMatchesMap(Object.fromEntries(mMap));
        });
    }, [groupStage, seasonId]);

    if (!groupStage) return (
        <div className="text-center py-16 text-slate-500">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No group stage found for this season.</p>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {groups.sort((a, b) => a.groupIndex - b.groupIndex).map(g => {
                const rows = (standingsMap[g._id] || []).sort((a, b) => a.rank - b.rank);
                const gMatches = matchesMap[g._id] || [];
                return (
                    <div key={g._id} className="bg-[#1a1e28] border border-white/8 rounded-2xl overflow-hidden">
                        {/* Group header */}
                        <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">{g.name}</h3>
                        </div>
                        {/* Standings */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead><tr className="border-b border-white/5">
                                    {['#', 'Team', 'W', 'L', 'Pts'].map(h => <th key={h} className="px-4 py-2 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>)}
                                </tr></thead>
                                <tbody>
                                    {rows.length === 0 && (
                                        <tr><td colSpan={5} className="px-4 py-4 text-center text-xs text-slate-600">No standings yet</td></tr>
                                    )}
                                    {rows.map((row, ri) => {
                                        const playoff = ri < (groupStage.advancementCount);
                                        const elim    = groupStage.eliminationCount > 0 && ri >= rows.length - groupStage.eliminationCount;
                                        return (
                                            <tr key={row._id} className={`border-b border-white/5 last:border-0 ${playoff ? 'bg-green-500/[0.04]' : elim ? 'bg-red-500/[0.04]' : ''}`}>
                                                <td className="px-4 py-2.5">
                                                    <span className={`text-xs font-bold ${playoff ? 'text-green-400' : elim ? 'text-red-400' : 'text-slate-500'}`}>{row.rank}</span>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded bg-[#00ff00]/8 border border-[#00ff00]/15 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                            <Shield className="w-3 h-3 text-[#00ff00]/40" />
                                                        </div>
                                                        <span className="text-xs text-white font-medium">{tName(row.teamId)}</span>
                                                        {playoff && <span className="text-[8px] text-green-400 font-bold border border-green-500/20 px-1 rounded">ADV</span>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 text-xs text-green-400 font-medium">{row.wins}</td>
                                                <td className="px-4 py-2.5 text-xs text-red-400 font-medium">{row.losses}</td>
                                                <td className="px-4 py-2.5 text-xs text-white font-black">{row.points}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {/* Group matches */}
                        {gMatches.length > 0 && (
                            <div className="border-t border-white/5 px-4 py-3 space-y-2">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Results</p>
                                {gMatches.map(m => (
                                    <div key={m._id} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
                                        <span className={`flex-1 text-right truncate pr-2 ${m.winnerId === tId(m.team1Id) ? 'text-white font-bold' : 'text-slate-500'}`}>{tName(m.team1Id)}</span>
                                        <span className={`px-3 font-black tabular-nums ${m.status === 'COMPLETED' ? 'text-white' : 'text-slate-600'}`}>
                                            {m.status === 'COMPLETED' ? `${m.team1GamesWon}–${m.team2GamesWon}` : 'vs'}
                                        </span>
                                        <span className={`flex-1 truncate pl-2 ${m.winnerId === tId(m.team2Id) ? 'text-white font-bold' : 'text-slate-500'}`}>{tName(m.team2Id)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
            {groups.length === 0 && (
                <div className="col-span-2 text-center py-12 text-slate-500">
                    <p>Groups have not been assigned yet.</p>
                </div>
            )}
        </div>
    );
}

// ─── Playoffs Tab ─────────────────────────────────────────────────────────────
function PlayoffsTab({ bracket, teamById }: { bracket: AdminBracket | null; teamById: Map<string, string> }) {
    if (!bracket) return (
        <div className="text-center py-16 text-slate-500">
            <GitBranch className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Playoff bracket has not been generated yet.</p>
        </div>
    );

    const roundNums = [...new Set(bracket.slots.map(s => s.roundNumber))].sort((a, b) => a - b);
    const byRound: Record<number, AdminBracket['slots']> = {};
    roundNums.forEach(r => { byRound[r] = bracket.slots.filter(s => s.roundNumber === r).sort((a, b) => a.position - b.position); });

    const label = (r: number) => {
        if (r === bracket.totalRounds) return 'Grand Final';
        if (r === bracket.totalRounds - 1 && bracket.totalRounds > 1) return 'Semifinals';
        if (r === bracket.totalRounds - 2 && bracket.totalRounds > 2) return 'Quarterfinals';
        return `Round ${r}`;
    };

    const champLabel = bracket.championId ? teamNameFromMap(teamById, bracket.championId) : '';

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-yellow-400" />
                    <h3 className="font-black text-white uppercase tracking-wide">{bracket.format.replace('_', ' ')}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${S_CLS[bracket.status]}`}>{bracket.status}</span>
                </div>
                {bracket.championId && champLabel !== 'TBD' && (
                    <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/25 rounded-xl px-4 py-2">
                        <Crown className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400 font-black text-sm">Champion: {champLabel}</span>
                    </div>
                )}
            </div>

            <div className="w-full overflow-x-auto rounded-xl border border-white/10 bg-black/30 pb-4">
                <div className="flex gap-8 min-w-max items-start pt-3 px-3">
                    {roundNums.map((r, ri) => (
                        <div key={r} className="flex flex-col w-[220px] shrink-0">
                            <div className={`text-center mb-3 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider mx-auto ${r === bracket.totalRounds ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25' : 'bg-white/5 text-slate-400 border border-white/8'}`}>
                                {label(r)}
                            </div>
                            <div className="flex flex-col" style={{ gap: `${Math.pow(2, ri) * 16 + 8}px` }}>
                                {byRound[r].map(slot => {
                                    const wid = slot.winnerId != null ? String(slot.winnerId) : '';
                                    const t1 = slot.team1Id != null ? String(slot.team1Id) : '';
                                    const t2 = slot.team2Id != null ? String(slot.team2Id) : '';
                                    const t1wins = slot.status === 'COMPLETED' && wid !== '' && t1 !== '' && wid === t1;
                                    const t2wins = slot.status === 'COMPLETED' && wid !== '' && t2 !== '' && wid === t2;
                                    const isGF   = r === bracket.totalRounds;
                                    return (
                                        <div key={slot.slotId} className={`rounded-2xl overflow-hidden border transition-all ${isGF ? 'border-yellow-500/30 shadow-[0_0_24px_rgba(234,179,8,0.12)]' : slot.status === 'READY' ? 'border-[#00ff00]/30 shadow-[0_0_16px_rgba(0,255,0,0.06)]' : 'border-white/8'} bg-[#1a1e28]`}>
                                            {slot.status === 'PENDING' && !t1 && !t2 ? (
                                                <div className="px-4 py-5 text-center text-xs text-slate-600 italic">TBD</div>
                                            ) : (
                                                <>
                                                    <div className={`flex items-center gap-2.5 px-4 py-3 border-b border-white/5 ${t1wins ? 'bg-[#00ff00]/10 border-l-2 border-l-[#00ff00]' : ''}`}>
                                                        <div className="w-6 h-6 rounded bg-[#00ff00]/8 border border-[#00ff00]/12 flex items-center justify-center flex-shrink-0">
                                                            <Shield className="w-3.5 h-3.5 text-[#00ff00]/40" />
                                                        </div>
                                                        <span className={`text-xs font-bold flex-1 truncate ${t1wins ? 'text-white' : 'text-slate-400'}`}>{teamNameFromMap(teamById, slot.team1Id)}</span>
                                                        {t1wins && <Crown className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
                                                    </div>
                                                    <div className={`flex items-center gap-2.5 px-4 py-3 ${t2wins ? 'bg-[#00ff00]/10 border-l-2 border-l-[#00ff00]' : ''}`}>
                                                        <div className="w-6 h-6 rounded bg-[#00ff00]/8 border border-[#00ff00]/12 flex items-center justify-center flex-shrink-0">
                                                            <Shield className="w-3.5 h-3.5 text-[#00ff00]/40" />
                                                        </div>
                                                        <span className={`text-xs font-bold flex-1 truncate ${t2wins ? 'text-white' : 'text-slate-400'}`}>{teamNameFromMap(teamById, slot.team2Id)}</span>
                                                        {t2wins && <Crown className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
                                                    </div>
                                                </>
                                            )}
                                            <div className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-wider border-t border-white/5 ${S_CLS[slot.status]}`}>
                                                {slot.status === 'READY' ? '▶ Ready to play' : slot.status}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Schedule Tab ─────────────────────────────────────────────────────────────
function ScheduleTab({ seasonId }: { seasonId: string }) {
    const [rounds, setRounds]   = useState<AdminRound[]>([]);
    const [matchMap, setMatchMap] = useState<Record<string, AdminMatch[]>>({});
    const [sel, setSel]         = useState<string | null>(null);
    const [filter, setFilter]   = useState<'all' | 'upcoming' | 'completed'>('all');

    useEffect(() => {
        getAdminRounds(seasonId).then(r => {
            const sorted = r.sort((a, b) => a.roundNumber - b.roundNumber);
            setRounds(sorted);
            if (sorted.length) setSel(sorted[0]._id);
        });
    }, [seasonId]);

    const loadMatches = useCallback(async (rid: string) => {
        if (matchMap[rid]) return;
        const m = await getMatchesByRound(rid);
        setMatchMap(p => ({ ...p, [rid]: m }));
    }, [matchMap]);

    useEffect(() => { if (sel) loadMatches(sel); }, [sel]);

    const matches = sel ? (matchMap[sel] || []) : [];
    const filtered = matches.filter(m => {
        if (filter === 'upcoming') return m.status === 'SCHEDULED' || m.status === 'ONGOING';
        if (filter === 'completed') return m.status === 'COMPLETED';
        return true;
    });

    return (
        <div className="space-y-5">
            {/* Round tabs */}
            <div className="flex flex-wrap gap-2">
                {rounds.map(r => (
                    <button key={r._id} onClick={() => setSel(r._id)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${sel === r._id ? 'bg-[#00ff00]/10 text-[#00ff00] border-[#00ff00]/20' : 'bg-white/[0.03] text-slate-500 border-white/8 hover:text-white'}`}>
                        Round {r.roundNumber}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border ${S_CLS[r.status]}`}>{r.status}</span>
                    </button>
                ))}
            </div>

            {/* Filter */}
            <div className="flex gap-1.5">
                {(['all', 'upcoming', 'completed'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${filter === f ? 'bg-white text-black border-white' : 'bg-white/5 text-slate-500 border-white/8 hover:text-white'}`}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Matches */}
            {filtered.length === 0 ? (
                <div className="text-center py-12 text-slate-600 text-sm">No matches found</div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(m => <MatchCard key={m._id} m={m} />)}
                </div>
            )}
        </div>
    );
}

// ─── Prize Tab ────────────────────────────────────────────────────────────────
function PrizeTab({ prize }: { prize: PrizePool | null }) {
    if (!prize) return (
        <div className="text-center py-16 text-slate-500">
            <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Prize pool details will be announced soon.</p>
        </div>
    );
    return (
        <div className="max-w-lg mx-auto">
            <div className="bg-[#1a1e28] border border-yellow-500/20 rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-500/10 to-transparent border-b border-yellow-500/15 px-6 py-5 text-center">
                    <p className="text-xs text-yellow-400/60 font-bold uppercase tracking-widest mb-1">Total Prize Pool</p>
                    <p className="text-4xl font-black text-white">{prize.currency} <span className="text-yellow-400">{prize.totalAmount.toLocaleString()}</span></p>
                    {prize.notes && <p className="text-xs text-slate-500 mt-2">{prize.notes}</p>}
                </div>
                <div className="px-6 py-4">
                    {prize.distribution.map((d, i) => (
                        <div key={d.rank} className={`flex items-center justify-between py-3.5 ${i < prize.distribution.length - 1 ? 'border-b border-white/5' : ''}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${d.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' : d.rank === 2 ? 'bg-slate-400/20 text-slate-300' : d.rank === 3 ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-slate-500'}`}>
                                    {d.rank === 1 ? <Crown className="w-4 h-4" /> : `#${d.rank}`}
                                </div>
                                <span className="text-white font-bold text-sm">{d.rank === 1 ? '1st' : d.rank === 2 ? '2nd' : d.rank === 3 ? '3rd' : `${d.rank}th`} Place</span>
                            </div>
                            <div className="text-right">
                                <span className="text-white font-black text-sm">{prize.currency} {d.amount.toLocaleString()}</span>
                                <p className="text-[10px] text-slate-500">{Math.round(d.amount / prize.totalAmount * 100)}%</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Standings Tab ────────────────────────────────────────────────────────────
function StandingsTab({ seasonId }: { seasonId: string }) {
    const [rows, setRows] = useState<StandingEntry[]>([]);
    useEffect(() => { getAdminStandings(seasonId).then(r => setRows(r.sort((a, b) => a.rank - b.rank))); }, [seasonId]);
    if (!rows.length) return <div className="text-center py-12 text-slate-500 text-sm">Standings will appear once matches are played.</div>;
    return (
        <div className="bg-[#1a1e28] border border-white/8 rounded-2xl overflow-hidden">
            <table className="w-full">
                <thead><tr className="border-b border-white/5">
                    {['#', 'Team', 'Played', 'W', 'L', 'Points', 'GD'].map(h => <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>)}
                </tr></thead>
                <tbody>
                    {rows.map(r => (
                        <tr key={r._id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                            <td className="px-4 py-3"><span className={`text-sm font-black ${r.rank === 1 ? 'text-yellow-400' : 'text-slate-500'}`}>{r.rank === 1 && <Crown className="inline w-3.5 h-3.5 mr-0.5 -mt-0.5" />}{r.rank}</span></td>
                            <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded bg-[#00ff00]/8 border border-[#00ff00]/12 flex items-center justify-center"><Shield className="w-3.5 h-3.5 text-[#00ff00]/40" /></div><span className="text-sm text-white font-medium">{tName(r.teamId)}</span></div></td>
                            <td className="px-4 py-3 text-sm text-slate-400">{r.played}</td>
                            <td className="px-4 py-3 text-sm text-green-400 font-medium">{r.wins}</td>
                            <td className="px-4 py-3 text-sm text-red-400 font-medium">{r.losses}</td>
                            <td className="px-4 py-3 text-sm text-white font-black">{r.points}</td>
                            <td className="px-4 py-3 text-sm"><span className={r.gameDiff >= 0 ? 'text-green-400' : 'text-red-400'}>{r.gameDiff >= 0 ? '+' : ''}{r.gameDiff}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TournamentPage() {
    const { leagueId, seasonId } = useParams<{ leagueId: string; seasonId: string }>();
    const navigate = useNavigate();

    const [league, setLeague]   = useState<League | null>(null);
    const [season, setSeason]   = useState<Season | null>(null);
    const [teams, setTeams]     = useState<SeasonTeamEntry[]>([]);
    const [participantRows, setParticipantRows] = useState<SeasonTeamWithPlayersRow[]>([]);
    const [stages, setStages]   = useState<Stage[]>([]);
    const [matches, setMatches] = useState<AdminMatch[]>([]);
    const [prize, setPrize]     = useState<PrizePool | null>(null);
    const [bracket, setBracket] = useState<AdminBracket | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!leagueId || !seasonId) return;
        setLoading(true);
        Promise.all([
            leagueService.getLeagueById(leagueId).catch(() => null),
            seasonService.getById(seasonId).catch(() => null),
            getSeasonTeamsWithPlayers(seasonId),
            getStages(seasonId),
            getPrizePool(seasonId),
            getAdminBracket(seasonId),
        ]).then(async ([lg, sn, tm, st, pr, br]) => {
            setLeague(lg as League);
            setSeason(sn as Season);
            const rows = (tm as SeasonTeamWithPlayersRow[]) ?? [];
            setParticipantRows(rows);
            setTeams(
                rows
                    .filter((r) => r.team)
                    .map((r) => ({
                        _id: r.registration._id,
                        seasonId,
                        teamId: {
                            _id: r.team!._id,
                            name: r.team!.name,
                            logo: r.team!.logo,
                            tag: r.team!.tag,
                        },
                        seed: r.registration.seed,
                        status: (r.registration.status as SeasonTeamEntry['status']) || 'ACTIVE',
                    })),
            );
            setStages(st);
            setPrize(pr);
            setBracket(br);
            // Load all matches
            const rounds = await getAdminRounds(seasonId);
            const allMatches: AdminMatch[] = [];
            await Promise.all(rounds.map(r => getMatchesByRound(r._id).then(m => allMatches.push(...m))));
            setMatches(allMatches);
        }).finally(() => setLoading(false));
    }, [leagueId, seasonId]);

    const groupStage = stages.find(s => s.stageType === 'GROUPS') ?? null;

    const teamById = useMemo(() => buildTeamNameMapFromRows(participantRows), [participantRows]);
    const displayBracket = useMemo(
        () => expandPlaceholderSingleElimBracket(bracket, participantRows),
        [bracket, participantRows],
    );

    if (loading) return (
        <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center text-slate-500">
            <div className="w-6 h-6 border-2 border-[#00ff00]/30 border-t-[#00ff00] rounded-full animate-spin mr-3" />
            Loading tournament…
        </div>
    );

    if (!season || !league) return (
        <div className="min-h-screen bg-[#0d0f14] flex flex-col items-center justify-center text-slate-500">
            <AlertCircle className="w-10 h-10 mb-3 opacity-30" />
            <p>Tournament not found.</p>
            <button onClick={() => navigate('/leagues')} className="mt-4 text-[#00ff00] text-sm hover:underline">Browse leagues</button>
        </div>
    );

    const statusCls = season.status === 'ONGOING' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                      season.status === 'FINISHED' ? 'bg-slate-500/20 text-slate-300 border-slate-500/30' :
                      'bg-blue-500/20 text-blue-300 border-blue-500/30';

    return (
        <div className="min-h-screen bg-[#0d0f14] text-white">
            {/* ── Hero Banner ──────────────────────────────────────────────── */}
            <div className="relative border-b border-white/5 overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#00ff00]/[0.04] via-transparent to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,255,0,0.06),transparent)] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-6">
                        <button onClick={() => navigate('/leagues')} className="hover:text-white transition-colors flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Leagues</button>
                        <ChevronRight className="w-3 h-3" />
                        <button onClick={() => navigate('/leagues')} className="hover:text-white transition-colors">{league.name}</button>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-white">{season.name}</span>
                    </nav>

                    {/* Tournament header */}
                    <div className="flex flex-col md:flex-row md:items-end gap-6">
                        {/* Logo */}
                        <div className="w-20 h-20 rounded-2xl bg-[#1a1e28] border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-2xl">
                            {league.logoUrl
                                ? <img src={league.logoUrl} alt={league.name} className="w-full h-full object-contain p-2" />
                                : <Trophy className="w-10 h-10 text-[#00ff00]/40" />
                            }
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${statusCls}`}>
                                    {season.status === 'ONGOING' && <PlayCircle className="inline w-3 h-3 mr-1" />}
                                    {season.status === 'FINISHED' && <CheckCircle className="inline w-3 h-3 mr-1" />}
                                    {season.status === 'PLANNED' && <Clock className="inline w-3 h-3 mr-1" />}
                                    {season.status}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                    <Globe className="w-3 h-3" /> {league.level} · {league.regionId || 'Global'}
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white leading-none">{season.name}</h1>
                            <p className="text-slate-400 text-sm mt-1.5">{league.name}</p>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-4 md:gap-6 flex-shrink-0">
                            {[
                                { label: 'Teams', val: teams.length, icon: <Users className="w-4 h-4" /> },
                                { label: 'Matches', val: matches.length, icon: <Swords className="w-4 h-4" /> },
                                { label: 'Prize', val: prize ? `${prize.currency} ${(prize.totalAmount / 1000).toFixed(0)}K` : 'TBA', icon: <DollarSign className="w-4 h-4" /> },
                            ].map(s => (
                                <div key={s.label} className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-[#00ff00]/60 mb-1">{s.icon}</div>
                                    <p className="text-xl font-black text-white">{s.val}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Liquipedia 2-column layout ────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6 items-start">

                    {/* LEFT: main sections (scrollable) */}
                    <div className="space-y-5">

                        {/* About — Overview */}
                        <PublicSection icon={<Star className="w-4 h-4" />} title="About">
                            <OverviewTab season={season} stages={stages} teams={teams} matches={matches} />
                        </PublicSection>

                        {/* Prize Pool */}
                        {prize && (
                            <PublicSection icon={<DollarSign className="w-4 h-4" />} title="Prize Pool">
                                <PrizeTab prize={prize} />
                            </PublicSection>
                        )}

                        {/* Participants */}
                        <PublicSection icon={<Users className="w-4 h-4" />} title="Participants">
                            <ParticipantsTab rows={participantRows} />
                        </PublicSection>

                        {/* Group Stage */}
                        {groupStage && (
                            <PublicSection icon={<Layers className="w-4 h-4" />} title="Group Stage">
                                <GroupsTab seasonId={season._id} groupStage={groupStage} />
                            </PublicSection>
                        )}

                        {/* Schedule */}
                        <PublicSection icon={<Calendar className="w-4 h-4" />} title="Schedule &amp; Results">
                            <ScheduleTab seasonId={season._id} />
                        </PublicSection>

                        {/* Playoffs */}
                        <PublicSection icon={<GitBranch className="w-4 h-4" />} title="Playoffs Bracket">
                            <PlayoffsTab bracket={displayBracket} teamById={teamById} />
                        </PublicSection>

                        {/* Standings */}
                        <PublicSection icon={<TrendingUp className="w-4 h-4" />} title="Standings">
                            <StandingsTab seasonId={season._id} />
                        </PublicSection>
                    </div>

                    {/* RIGHT: sidebar */}
                    <div className="space-y-4 xl:sticky xl:top-6">
                        {/* Tournament info card */}
                        <div className="bg-[#13161e] border border-white/8 rounded-2xl overflow-hidden text-sm">
                            <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.015]">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#00ff00]/60">Tournament Info</span>
                            </div>
                            <div className="px-4 py-3 space-y-3">
                                {([
                                    ['Series', league.name],
                                    ['Season', season.name],
                                    ['Organizer', (league as unknown as Record<string,string>).organizerName ?? league.name],
                                    ['Start Date', fmt(season.startDate)],
                                    ['End Date', fmt(season.endDate)],
                                    ['Teams', String(teams.length)],
                                    ['Status', season.status],
                                ] as [string, string][]).map(([k, v]) => (
                                    <div key={k} className="flex items-start justify-between gap-2">
                                        <span className="text-slate-500 text-xs flex-shrink-0">{k}</span>
                                        <span className={`text-xs font-bold text-right ${
                                            k === 'Status'
                                                ? v === 'ONGOING' ? 'text-green-400' : v === 'FINISHED' ? 'text-slate-400' : 'text-blue-400'
                                                : 'text-white'
                                        }`}>{v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Prize summary card */}
                        {prize && (
                            <div className="bg-[#13161e] border border-white/8 rounded-2xl overflow-hidden text-sm">
                                <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.015]">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#00ff00]/60">Prize Pool</span>
                                </div>
                                <div className="px-4 py-3">
                                    <p className="text-xl font-black text-white">{prize.currency} {prize.totalAmount.toLocaleString()}</p>
                                    <div className="mt-2 space-y-1">
                                        {prize.distribution.slice(0, 4).map(d => (
                                            <div key={d.rank} className="flex items-center justify-between text-xs">
                                                <span className="text-slate-400">{d.rank === 1 ? '🥇' : d.rank === 2 ? '🥈' : d.rank === 3 ? '🥉' : `${d.rank}th`}</span>
                                                <span className="text-white font-bold">{prize.currency} {d.amount.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* League level badge */}
                        <div className="bg-[#13161e] border border-white/8 rounded-2xl overflow-hidden text-sm">
                            <div className="px-4 py-3 text-center">
                                <Globe className="w-5 h-5 text-[#00ff00]/40 mx-auto mb-1" />
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{league.level ?? 'Amateur'} League</p>
                                <p className="text-xs text-white font-bold mt-0.5">{(league as unknown as Record<string,string>).regionId ?? 'Global'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Public Section Card ──────────────────────────────────────────────────────
function PublicSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div className="bg-[#13161e] border border-white/8 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3 border-b border-white/5 bg-white/[0.015]">
                <span className="text-[#00ff00]/60">{icon}</span>
                <h2 className="text-xs font-black uppercase tracking-widest text-white">{title}</h2>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}
