import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Trophy, Globe, Calendar, ChevronRight, ArrowLeft,
    PlayCircle, Clock, CheckCircle, TrendingUp, Swords, Crown, Shield,
    ChevronDown,
} from 'lucide-react';
import { leagueService } from '../../services/leagueService';
import { seasonService } from '../../services/seasonService';
import { leagueHubService } from '../../services/leagueHubService';
import type { League } from '../../services/leagueService';
import type { Season } from '../../services/seasonService';
import type { StandingRow, HubRound, HubMatch, HubBracket, HubBracketSlot } from '../../services/leagueHubService';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt     = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtTime = (d: string) => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

function tName(t: unknown): string {
    if (!t) return 'TBD';
    if (typeof t === 'object' && t !== null && 'name' in t) return (t as { name: string }).name;
    if (typeof t === 'string') return t.slice(-6);
    return 'TBD';
}
function tLogo(t: unknown): string | undefined {
    if (t && typeof t === 'object' && 'logo' in t) return (t as { logo?: string }).logo || undefined;
    return undefined;
}
function tId(t: unknown): string | undefined {
    if (!t) return undefined;
    if (typeof t === 'string') return t;
    if (typeof t === 'object' && '_id' in t) return (t as { _id: string })._id;
    return undefined;
}

const S_CLS: Record<string, string> = {
    PLANNED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    ONGOING: 'bg-green-500/10 text-green-400 border-green-500/20',
    FINISHED: 'bg-white/5 text-gray-400 border-white/10',
    SCHEDULED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    COMPLETED: 'bg-green-500/10 text-green-400 border-green-500/20',
    FORFEIT: 'bg-red-500/10 text-red-400 border-red-500/20',
    CANCELLED: 'bg-white/5 text-gray-400 border-white/10',
    ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/20',
    READY: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    PENDING: 'bg-white/5 text-gray-400 border-white/10',
};
const S_LABEL: Record<string, string> = {
    PLANNED: 'Planned', ONGOING: 'Live', FINISHED: 'Finished',
    SCHEDULED: 'Scheduled', COMPLETED: 'Completed', FORFEIT: 'Forfeit',
    CANCELLED: 'Cancelled', ACTIVE: 'Active', READY: 'Ready', PENDING: 'Pending',
};
const LEVEL_CLS: Record<string, string> = {
    INTERNATIONAL: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    CONTINENTAL: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    NATIONAL: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    REGIONAL: 'bg-green-500/10 text-green-400 border-green-500/20',
};

type View =
    | { kind: 'leagues' }
    | { kind: 'seasons'; league: League }
    | { kind: 'hub'; league: League; season: Season };

type HubTab = 'standings' | 'schedule' | 'bracket';

// ─── Page Component ───────────────────────────────────────────────────────────
export default function LeaguesPage() {
    const navigate = useNavigate();
    const [view, setView] = useState<View>({ kind: 'leagues' });
    const [leagues, setLeagues] = useState<League[]>([]);
    const [seasonsMap, setSeasonsMap] = useState<Record<string, Season[]>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        leagueService.getAllLeagues()
            .then(setLeagues)
            .catch(() => setLeagues([]))
            .finally(() => setLoading(false));
    }, []);

    const loadSeasons = async (leagueId: string) => {
        if (seasonsMap[leagueId]) return;
        const s = await seasonService.getByLeague(leagueId).catch(() => [] as Season[]);
        setSeasonsMap(prev => ({ ...prev, [leagueId]: s }));
    };

    const goLeague = async (league: League) => {
        await loadSeasons(league._id);
        setView({ kind: 'seasons', league });
    };

    const goBack = () => {
        if (view.kind === 'hub') setView({ kind: 'seasons', league: view.league });
        else setView({ kind: 'leagues' });
    };

    return (
        <div className="min-h-screen bg-[#0d0f14] text-white">
            {/* Top Bar */}
            <header className="border-b border-white/5 bg-[#0d0f14]/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </button>
                    <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-[#00ff00]" />
                        <span className="font-black uppercase tracking-widest text-white text-sm">ArenaChain Leagues</span>
                    </div>
                    <div className="w-24" />
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
                {/* Breadcrumb */}
                {view.kind !== 'leagues' && (
                    <nav className="flex items-center gap-1.5 text-xs text-gray-500">
                        <button onClick={() => setView({ kind: 'leagues' })} className="hover:text-white transition-colors">Leagues</button>
                        <ChevronRight className="w-3 h-3" />
                        <span
                            className={view.kind === 'seasons' ? 'text-white' : 'hover:text-white cursor-pointer transition-colors'}
                            onClick={view.kind === 'hub' ? () => setView({ kind: 'seasons', league: view.league }) : undefined}
                        >{view.league.name}</span>
                        {view.kind === 'hub' && <><ChevronRight className="w-3 h-3" /><span className="text-white">{view.season.name}</span></>}
                    </nav>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        {view.kind === 'leagues' && (
                            <>
                                <h1 className="text-3xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                                    <Trophy className="w-7 h-7 text-[#00ff00]" /> Leagues
                                </h1>
                                <p className="text-gray-400 text-sm mt-1">Competitive leagues powering the ArenaChain ecosystem</p>
                            </>
                        )}
                        {view.kind === 'seasons' && (
                            <>
                                <h1 className="text-3xl font-black uppercase tracking-tighter text-white">{view.league.name}</h1>
                                <p className="text-gray-400 text-sm mt-1">{view.league.level} · {view.league.regionId}</p>
                            </>
                        )}
                        {view.kind === 'hub' && (
                            <>
                                <h1 className="text-3xl font-black uppercase tracking-tighter text-white">{view.season.name}</h1>
                                <p className="text-gray-400 text-sm mt-1">{view.league.name}</p>
                            </>
                        )}
                    </div>
                    {view.kind !== 'leagues' && (
                        <button onClick={goBack} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-colors text-sm">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                    )}
                </div>

                {/* Content */}
                {view.kind === 'leagues' && <LeaguesGrid leagues={leagues} loading={loading} onSelect={goLeague} />}
                {view.kind === 'seasons' && <SeasonsPanel seasons={seasonsMap[view.league._id] ?? []} onSelect={s => setView({ kind: 'hub', league: view.league, season: s })} />}
                {view.kind === 'hub' && <PublicSeasonHub season={view.season} />}
            </div>
        </div>
    );
}

// ─── Leagues Grid ─────────────────────────────────────────────────────────────
function LeaguesGrid({ leagues, loading, onSelect }: { leagues: League[]; loading: boolean; onSelect: (l: League) => void }) {
    if (loading) return <Loader />;
    if (!leagues.length) return <Empty icon={<Trophy />} text="No leagues yet" />;
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {leagues.map(l => (
                <button key={l._id} onClick={() => onSelect(l)} className="text-left bg-white/[0.03] border border-white/5 rounded-2xl p-5 hover:border-[#00ff00]/30 hover:bg-white/[0.05] transition-all group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-[#00ff00]/10 border border-[#00ff00]/20 flex items-center justify-center">
                            {l.logoUrl ? <img src={l.logoUrl} className="w-8 h-8 object-contain rounded" alt={l.name} /> : <Trophy className="w-6 h-6 text-[#00ff00]" />}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${LEVEL_CLS[l.level] ?? 'bg-white/5 text-gray-400 border-white/10'}`}>{l.level}</span>
                    </div>
                    <p className="font-bold text-white text-sm group-hover:text-[#00ff00] transition-colors">{l.name}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5"><Globe className="w-3 h-3" />{l.regionId || 'Global'}</p>
                    {l.description && <p className="text-xs text-gray-600 mt-2 line-clamp-2">{l.description}</p>}
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                        <span>View seasons</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                </button>
            ))}
        </div>
    );
}

// ─── Seasons Panel ────────────────────────────────────────────────────────────
function SeasonsPanel({ seasons, onSelect }: { seasons: Season[]; onSelect: (s: Season) => void }) {
    if (!seasons.length) return <Empty icon={<Calendar />} text="No seasons for this league yet" />;
    return (
        <div className="space-y-3">
            {seasons.map(s => (
                <button key={s._id} onClick={() => onSelect(s)} className="w-full text-left bg-white/[0.03] border border-white/5 rounded-xl px-5 py-4 hover:border-white/10 hover:bg-white/[0.05] transition-all group">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-white font-bold">{s.name}</p>
                                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${S_CLS[s.status]}`}>
                                    {s.status === 'ONGOING' && <PlayCircle className="w-3 h-3" />}
                                    {s.status === 'PLANNED' && <Clock className="w-3 h-3" />}
                                    {s.status === 'FINISHED' && <CheckCircle className="w-3 h-3" />}
                                    {S_LABEL[s.status]}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {fmt(s.startDate)} → {fmt(s.endDate)}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:translate-x-1 group-hover:text-[#00ff00] transition-all" />
                    </div>
                </button>
            ))}
        </div>
    );
}

// ─── Public Season Hub ────────────────────────────────────────────────────────
function PublicSeasonHub({ season }: { season: Season }) {
    const [tab, setTab] = useState<HubTab>('standings');
    const [standings, setStandings] = useState<StandingRow[]>([]);
    const [rounds, setRounds] = useState<HubRound[]>([]);
    const [matchMap, setMatchMap] = useState<Record<string, HubMatch[]>>({});
    const [bracket, setBracket] = useState<HubBracket | null>(null);
    const [selRound, setSelRound] = useState<string | null>(null);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        setLoadingData(true);
        Promise.all([
            leagueHubService.getStandings(season._id),
            leagueHubService.getRoundsBySeason(season._id),
            leagueHubService.getBracket(season._id),
        ]).then(([s, r, b]) => {
            setStandings(s);
            const sorted = [...r].sort((a, b) => a.roundNumber - b.roundNumber);
            setRounds(sorted);
            setBracket(b);
            if (sorted.length) setSelRound(sorted[0]._id);
        }).finally(() => setLoadingData(false));
    }, [season._id]);

    const loadMatches = async (roundId: string) => {
        if (matchMap[roundId]) return;
        const m = await leagueHubService.getMatchesByRound(roundId);
        setMatchMap(prev => ({ ...prev, [roundId]: m }));
    };

    useEffect(() => { if (selRound) loadMatches(selRound); }, [selRound]);

    const tabItems: { id: HubTab; icon: React.ReactNode; label: string }[] = [
        { id: 'standings', icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'Standings' },
        { id: 'schedule',  icon: <Swords className="w-3.5 h-3.5" />,    label: 'Schedule' },
        { id: 'bracket',   icon: <Crown className="w-3.5 h-3.5" />,     label: 'Bracket' },
    ];

    return (
        <div className="space-y-5">
            {/* Season info */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
                <div className="flex flex-wrap gap-6">
                    <div><p className="text-xs text-gray-500 mb-1">Status</p>
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-bold ${S_CLS[season.status]}`}>
                            {season.status === 'ONGOING' && <PlayCircle className="w-3 h-3" />}{S_LABEL[season.status]}
                        </span>
                    </div>
                    <div><p className="text-xs text-gray-500 mb-1">Season Period</p><p className="text-sm text-white font-medium">{fmt(season.startDate)} → {fmt(season.endDate)}</p></div>
                    <div><p className="text-xs text-gray-500 mb-1">Registration Deadline</p><p className="text-sm text-white font-medium">{fmt(season.registrationDeadline)}</p></div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white/[0.03] border border-white/5 rounded-xl p-1 w-fit">
                {tabItems.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-[#00ff00]/10 text-[#00ff00]' : 'text-gray-500 hover:text-white'}`}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {loadingData ? <Loader /> : <>
                {tab === 'standings' && <PubStandingsTab rows={standings} />}
                {tab === 'schedule'  && <PubScheduleTab rounds={rounds} matchMap={matchMap} selRound={selRound} onRound={id => { setSelRound(id); loadMatches(id); }} />}
                {tab === 'bracket'   && <PubBracketTab bracket={bracket} />}
            </>}
        </div>
    );
}

// ─── Standings ────────────────────────────────────────────────────────────────
function PubStandingsTab({ rows }: { rows: StandingRow[] }) {
    if (!rows.length) return <Empty icon={<TrendingUp />} text="Standings will appear once the season starts" />;
    const sorted = [...rows].sort((a, b) => a.rank - b.rank);
    const total = sorted.length;
    return (
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#00ff00]" />
                <h2 className="font-bold text-white text-sm uppercase tracking-wider">Season Standings</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/5">
                            {['#', 'Team', 'P', 'W', 'L', 'Pts', 'GD'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map(row => {
                            const playoff = row.rank <= 4;
                            const danger  = row.rank > total - 2;
                            return (
                                <tr key={row._id} className={`border-b border-white/5 last:border-0 ${playoff ? 'bg-green-500/[0.03]' : danger ? 'bg-red-500/[0.03]' : ''}`}>
                                    <td className="px-4 py-3">
                                        <span className={`text-sm font-bold ${row.rank === 1 ? 'text-yellow-400' : playoff ? 'text-green-400' : danger ? 'text-red-400' : 'text-gray-500'}`}>
                                            {row.rank === 1 && <Crown className="inline w-3.5 h-3.5 mr-0.5 -mt-0.5" />}{row.rank}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-[#00ff00]/10 border border-[#00ff00]/20 flex items-center justify-center overflow-hidden">
                                                {tLogo(row.teamId) ? <img src={tLogo(row.teamId)} alt="" className="w-full h-full object-cover" /> : <Shield className="w-3.5 h-3.5 text-[#00ff00]" />}
                                            </div>
                                            <span className="text-sm text-white font-medium">{tName(row.teamId)}</span>
                                            {playoff && <span className="text-[9px] text-green-400 font-bold border border-green-400/20 px-1.5 rounded-full">Playoffs</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{row.played}</td>
                                    <td className="px-4 py-3 text-sm text-green-400 font-medium">{row.wins}</td>
                                    <td className="px-4 py-3 text-sm text-red-400 font-medium">{row.losses}</td>
                                    <td className="px-4 py-3 text-sm text-white font-bold">{row.points}</td>
                                    <td className="px-4 py-3 text-sm"><span className={row.gameDiff >= 0 ? 'text-green-400' : 'text-red-400'}>{row.gameDiff >= 0 ? '+' : ''}{row.gameDiff}</span></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="px-5 py-3 border-t border-white/5 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Playoff zone (Top 4)</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Relegation zone</span>
            </div>
        </div>
    );
}

// ─── Schedule ─────────────────────────────────────────────────────────────────
function PubScheduleTab({ rounds, matchMap, selRound, onRound }: {
    rounds: HubRound[]; matchMap: Record<string, HubMatch[]>;
    selRound: string | null; onRound: (id: string) => void;
}) {
    if (!rounds.length) return <Empty icon={<Swords />} text="No rounds scheduled yet" />;
    const matches = selRound ? (matchMap[selRound] ?? []) : [];
    const rnd = rounds.find(r => r._id === selRound);
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                {rounds.map(r => (
                    <button key={r._id} onClick={() => onRound(r._id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${selRound === r._id ? 'bg-[#00ff00]/10 text-[#00ff00] border-[#00ff00]/20' : 'bg-white/[0.03] text-gray-500 border-white/5 hover:text-white'}`}>
                        R{r.roundNumber}
                        <span className={`text-[9px] px-1 py-0.5 rounded border ${S_CLS[r.status]}`}>{S_LABEL[r.status]}</span>
                    </button>
                ))}
            </div>
            {rnd && <p className="text-xs text-gray-500">Round {rnd.roundNumber} · {fmt(rnd.startDate)} → {fmt(rnd.endDate)}</p>}
            {matches.length === 0
                ? <Empty icon={<Swords />} text="No matches for this round" />
                : <div className="space-y-3">{matches.map(m => <PubMatchCard key={m._id} match={m} />)}</div>
            }
        </div>
    );
}

function PubMatchCard({ match: m }: { match: HubMatch }) {
    const [exp, setExp] = useState(false);
    const done = m.status === 'COMPLETED';
    const w1 = m.team1GamesWon ?? 0;
    const w2 = m.team2GamesWon ?? 0;
    return (
        <div className="bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden">
            <div className="px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 flex-1 ${done && w2 > w1 ? 'opacity-50' : ''}`}>
                        <div className="w-7 h-7 rounded bg-[#00ff00]/10 border border-[#00ff00]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {tLogo(m.team1Id) ? <img src={tLogo(m.team1Id)} alt="" className="w-full h-full object-cover" /> : <Shield className="w-3.5 h-3.5 text-[#00ff00]" />}
                        </div>
                        <span className={`text-sm font-bold truncate ${done && w1 > w2 ? 'text-white' : 'text-gray-400'}`}>{tName(m.team1Id)}</span>
                        {done && w1 > w2 && <Crown className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 px-2 flex-shrink-0">
                        {done
                            ? <span className="text-xl font-black text-white tabular-nums">{w1} <span className="text-gray-600 text-sm">:</span> {w2}</span>
                            : <div className="text-center"><p className="text-xs font-bold text-gray-500">VS</p><p className="text-[10px] text-gray-600">{m.status === 'ONGOING' ? '🔴 LIVE' : fmtTime(m.scheduledStart)}</p></div>
                        }
                    </div>
                    <div className={`flex items-center gap-2 flex-1 justify-end ${done && w1 > w2 ? 'opacity-50' : ''}`}>
                        {done && w2 > w1 && <Crown className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />}
                        <span className={`text-sm font-bold truncate ${done && w2 > w1 ? 'text-white' : 'text-gray-400'}`}>{tName(m.team2Id)}</span>
                        <div className="w-7 h-7 rounded bg-[#00ff00]/10 border border-[#00ff00]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {tLogo(m.team2Id) ? <img src={tLogo(m.team2Id)} alt="" className="w-full h-full object-cover" /> : <Shield className="w-3.5 h-3.5 text-[#00ff00]" />}
                        </div>
                    </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${S_CLS[m.status]}`}>{S_LABEL[m.status]}</span>
                        {m.format && <span>{m.format}</span>}
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmt(m.scheduledStart)}</span>
                    </div>
                    {done && m.games && m.games.length > 0 && (
                        <button onClick={() => setExp(!exp)} className="text-xs text-[#00ff00] flex items-center gap-1">
                            Games <ChevronDown className={`w-3.5 h-3.5 transition-transform ${exp ? 'rotate-180' : ''}`} />
                        </button>
                    )}
                </div>
            </div>
            {exp && m.games && (
                <div className="border-t border-white/5 px-5 py-3 space-y-1.5">
                    {m.games.map(g => (
                        <div key={g.gameNumber} className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="font-bold text-white w-14">Game {g.gameNumber}</span>
                            {g.mapName && <span className="text-[#00ff00]">{g.mapName}</span>}
                            {g.team1Score !== undefined && <span>{g.team1Score} : {g.team2Score}</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Bracket ──────────────────────────────────────────────────────────────────
function PubBracketTab({ bracket }: { bracket: HubBracket | null }) {
    if (!bracket) return <Empty icon={<Crown />} text="Playoff bracket not generated yet" />;
    const roundNums = [...new Set(bracket.slots.map(s => s.roundNumber))].sort((a, b) => a - b);
    const byRound: Record<number, HubBracketSlot[]> = {};
    roundNums.forEach(r => { byRound[r] = bracket.slots.filter(s => s.roundNumber === r).sort((a, b) => a.position - b.position); });
    const label = (r: number) => r === bracket.totalRounds ? 'Grand Final' : r === bracket.totalRounds - 1 && bracket.totalRounds > 1 ? 'Semifinals' : `Round ${r}`;
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <h2 className="font-bold text-white text-sm uppercase tracking-wider">Playoff Bracket — {bracket.format.replace('_', ' ')}</h2>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${S_CLS[bracket.status]}`}>{S_LABEL[bracket.status]}</span>
            </div>
            {bracket.championId && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-400 font-bold">Champion: {tName(bracket.championId)}</span>
                </div>
            )}
            <div className="overflow-x-auto pb-2">
                <div className="flex gap-6 min-w-max">
                    {roundNums.map((r, ri) => (
                        <div key={r} className="flex flex-col gap-2">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center mb-2">{label(r)}</p>
                            <div className="flex flex-col" style={{ gap: `${Math.pow(2, ri) * 12 + 8}px` }}>
                                {byRound[r].map(slot => {
                                    const done = slot.status === 'COMPLETED';
                                    const t1id = tId(slot.team1Id);
                                    const t2id = tId(slot.team2Id);
                                    const t1w = done && slot.winnerId === t1id;
                                    const t2w = done && slot.winnerId === t2id;
                                    return (
                                        <div key={slot.slotId} className="w-48 bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
                                            {slot.status === 'PENDING' ? (
                                                <div className="p-4 text-center text-xs text-gray-600 italic">TBD</div>
                                            ) : (
                                                <>
                                                    <div className={`flex items-center gap-2 px-3 py-2.5 border-b border-white/5 ${t1w ? 'bg-white/[0.05]' : ''}`}>
                                                        <Shield className="w-3.5 h-3.5 text-[#00ff00]/40 flex-shrink-0" />
                                                        <span className={`text-xs font-medium flex-1 truncate ${t1w ? 'text-white' : 'text-gray-500'}`}>{tName(slot.team1Id)}</span>
                                                        {t1w && <Crown className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
                                                    </div>
                                                    <div className={`flex items-center gap-2 px-3 py-2.5 ${t2w ? 'bg-white/[0.05]' : ''}`}>
                                                        <Shield className="w-3.5 h-3.5 text-[#00ff00]/40 flex-shrink-0" />
                                                        <span className={`text-xs font-medium flex-1 truncate ${t2w ? 'text-white' : 'text-gray-500'}`}>{tName(slot.team2Id)}</span>
                                                        {t2w && <Crown className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
                                                    </div>
                                                </>
                                            )}
                                            <div className={`px-3 py-1 text-[10px] font-bold border-t border-white/5 ${S_CLS[slot.status]}`}>
                                                {slot.status === 'READY' ? 'Ready to play' : S_LABEL[slot.status] ?? slot.status}
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

// ─── Shared ───────────────────────────────────────────────────────────────────
function Loader() { return <div className="text-center py-16 text-gray-500 animate-pulse">Loading…</div>; }
function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-12 text-center text-gray-500">
            <div className="w-10 h-10 mx-auto mb-3 opacity-30">{icon}</div>
            <p className="text-sm">{text}</p>
        </div>
    );
}
