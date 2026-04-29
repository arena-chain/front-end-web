import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Globe, ShieldCheck, Trophy } from 'lucide-react';
import { TopNavbar } from '../common/top_navbar';
import { BottomNavbar } from '../common/bottom_navbar';
import { leagueService, type League } from '../../services/leagueService';
import { seasonService, type Season } from '../../services/seasonService';
import {
    getAdminBracket,
    getAdminStandings,
    getMatchesBySeason,
    type AdminBracket,
    type AdminMatch,
    type StandingEntry,
} from '../../services/adminLeagueService';

type LeagueView = League & {
    status?: string;
    startDate?: string;
    endDate?: string;
};

function formatDate(value?: string): string {
    if (!value) return 'TBA';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'TBA';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function LeagueDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const [league, setLeague] = useState<LeagueView | null>(null);
    const [loading, setLoading] = useState(true);
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
    const [matches, setMatches] = useState<AdminMatch[]>([]);
    const [standings, setStandings] = useState<StandingEntry[]>([]);
    const [bracket, setBracket] = useState<AdminBracket | null>(null);
    const [dataLoading, setDataLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        window.scrollTo(0, 0);
        if (!id) {
            setLeague(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        void leagueService.getLeagueById(id)
            .then((data) => {
                if (!cancelled) setLeague(data as LeagueView);
            })
            .catch(() => {
                if (!cancelled) setLeague(null);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [id]);

    useEffect(() => {
        if (!league?._id) {
            setSeasons([]);
            setSelectedSeasonId(null);
            return;
        }
        let cancelled = false;
        void seasonService.getByLeague(league._id)
            .then((data) => {
                if (cancelled) return;
                setSeasons(data);
                const ongoing = data.find((s) => s.status === 'ONGOING');
                setSelectedSeasonId((ongoing ?? data[0])?._id ?? null);
            })
            .catch(() => {
                if (!cancelled) {
                    setSeasons([]);
                    setSelectedSeasonId(null);
                }
            });
        return () => { cancelled = true; };
    }, [league?._id]);

    useEffect(() => {
        if (!selectedSeasonId) {
            setMatches([]);
            setStandings([]);
            setBracket(null);
            return;
        }
        let cancelled = false;
        setDataLoading(true);
        void Promise.all([
            getMatchesBySeason(selectedSeasonId),
            getAdminStandings(selectedSeasonId),
            getAdminBracket(selectedSeasonId),
        ])
            .then(([m, s, b]) => {
                if (cancelled) return;
                setMatches(Array.isArray(m) ? m : []);
                setStandings(Array.isArray(s) ? s : []);
                setBracket(b);
            })
            .catch(() => {
                if (cancelled) return;
                setMatches([]);
                setStandings([]);
                setBracket(null);
            })
            .finally(() => {
                if (!cancelled) setDataLoading(false);
            });
        return () => { cancelled = true; };
    }, [selectedSeasonId]);

    const teamName = (team: AdminMatch['team1Id'] | StandingEntry['teamId'] | string | undefined): string => {
        if (!team) return 'TBD';
        if (typeof team === 'string') return team.slice(-6).toUpperCase();
        return team.name || 'Team';
    };

    const sortedMatches = [...matches].sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
    const liveMatches = sortedMatches.filter((m) => m.status === 'ONGOING');
    const upcomingMatches = sortedMatches.filter((m) => m.status === 'SCHEDULED').slice(0, 5);
    const recentMatches = [...sortedMatches].filter((m) => m.status === 'COMPLETED' || m.status === 'FORFEIT').reverse().slice(0, 5);
    const sortedStandings = [...standings].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999)).slice(0, 8);
    const slotsByRound = (bracket?.slots || []).reduce<Record<number, typeof bracket.slots>>((acc, slot) => {
        const round = slot.roundNumber ?? 0;
        if (!acc[round]) acc[round] = [];
        acc[round].push(slot);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-background text-white flex flex-col">
            <TopNavbar />
            <main className="flex-1">
                {loading ? (
                    <div className="h-[70vh] flex items-center justify-center">
                        <div className="h-10 w-10 rounded-full border-2 border-primary/25 border-t-primary animate-spin" />
                    </div>
                ) : !league ? (
                    <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
                        <h2 className="text-2xl font-black uppercase tracking-widest">League Not Found</h2>
                        <Link to="/" className="px-5 py-2.5 rounded-xl border border-white/15 text-sm font-black uppercase tracking-widest hover:bg-white/5 transition-colors">
                            Back Home
                        </Link>
                    </div>
                ) : (
                    <>
                        <section className="relative min-h-[48vh] overflow-hidden border-b border-white/10">
                            <div className="absolute inset-0 bg-black/60" />
                            <div
                                className="absolute inset-0"
                                style={{
                                    backgroundImage: league.logoUrl ? `url(${league.logoUrl})` : undefined,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    filter: 'blur(4px)',
                                    transform: 'scale(1.05)',
                                    opacity: league.logoUrl ? 0.25 : 0,
                                }}
                            />
                            <div className="container mx-auto px-6 relative z-10 py-16 md:py-24">
                                <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-bold uppercase tracking-widest mb-8">
                                    <ArrowLeft size={14} /> Back
                                </Link>
                                <div className="max-w-4xl">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 mb-4">
                                        <ShieldCheck size={13} className="text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Public League</span>
                                    </div>
                                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight">{league.name}</h1>
                                    <p className="mt-4 text-white/65 max-w-3xl">
                                        {league.description || 'Official Arena Chain league page. Sign in to participate, follow standings and join competition activities.'}
                                    </p>
                                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/35 mb-1">Level</p>
                                            <p className="text-sm font-black text-white">{league.level || 'TBA'}</p>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/35 mb-1">Created</p>
                                            <p className="text-sm font-black text-white">{formatDate(league.createdAt)}</p>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/35 mb-1">Status</p>
                                            <p className="text-sm font-black text-white">{league.status || 'Active'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="container mx-auto px-6 py-10 md:py-14">
                            <div className="rounded-3xl border border-white/10 bg-[#0b0d10] p-6 md:p-8">
                                <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest mb-5">League Overview</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                        <div className="flex items-center gap-2 text-primary mb-2"><Trophy size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Competition</span></div>
                                        <p className="text-sm text-white/75">Full league details, standings and participation are available after login.</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                        <div className="flex items-center gap-2 text-primary mb-2"><Calendar size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Schedule</span></div>
                                        <p className="text-sm text-white/75">Start: {formatDate(league.startDate)} · End: {formatDate(league.endDate)}</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                        <div className="flex items-center gap-2 text-primary mb-2"><Globe size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Region</span></div>
                                        <p className="text-sm text-white/75">{league.regionId || 'Global'}</p>
                                    </div>
                                </div>
                                <div className="mt-7 flex flex-wrap gap-3">
                                    {selectedSeasonId && (
                                        <Link to={`/leagues/${league._id}/seasons/${selectedSeasonId}`} className="px-5 py-2.5 rounded-xl border border-primary/35 bg-primary/10 text-primary text-xs font-black uppercase tracking-widest hover:bg-primary/15 transition-colors">
                                            Open Liquipedia View
                                        </Link>
                                    )}
                                    <Link to="/login" className="px-5 py-2.5 rounded-xl bg-primary text-black text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity">
                                        Login To Join
                                    </Link>
                                    <Link to="/register" className="px-5 py-2.5 rounded-xl border border-white/15 text-xs font-black uppercase tracking-widest text-white hover:bg-white/5 transition-colors">
                                        Create Account
                                    </Link>
                                </div>
                            </div>
                        </section>

                        <section className="container mx-auto px-6 pb-14 md:pb-20">
                            <div className="rounded-3xl border border-white/10 bg-[#0b0d10] p-6 md:p-8">
                                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest">Competition Details</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {seasons.map((season) => (
                                            <button
                                                key={season._id}
                                                onClick={() => setSelectedSeasonId(season._id)}
                                                className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors"
                                                style={{
                                                    borderColor: selectedSeasonId === season._id ? 'rgba(0,255,136,0.45)' : 'rgba(255,255,255,0.15)',
                                                    background: selectedSeasonId === season._id ? 'rgba(0,255,136,0.14)' : 'rgba(255,255,255,0.02)',
                                                    color: selectedSeasonId === season._id ? '#00ff88' : 'rgba(255,255,255,0.7)',
                                                }}
                                            >
                                                {season.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {!selectedSeasonId ? (
                                    <p className="text-sm text-white/50">No season data available yet for this league.</p>
                                ) : dataLoading ? (
                                    <div className="py-10 flex items-center justify-center">
                                        <div className="h-8 w-8 rounded-full border-2 border-primary/25 border-t-primary animate-spin" />
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Live Matches</p>
                                                {liveMatches.length === 0 ? (
                                                    <p className="text-sm text-white/45">No live match right now.</p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {liveMatches.map((m) => (
                                                            <div key={m._id} className="rounded-xl border border-red-400/25 bg-red-400/10 px-3 py-2">
                                                                <p className="text-xs font-black uppercase">{teamName(m.team1Id)} vs {teamName(m.team2Id)}</p>
                                                                <p className="text-[11px] text-red-300 font-bold">LIVE</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 lg:col-span-2">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Upcoming & Recent</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/45 mb-2">Upcoming</p>
                                                        <div className="space-y-2">
                                                            {upcomingMatches.length === 0 ? <p className="text-sm text-white/45">No upcoming matches.</p> : upcomingMatches.map((m) => (
                                                                <div key={m._id} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                                                                    <p className="text-xs font-black uppercase">{teamName(m.team1Id)} vs {teamName(m.team2Id)}</p>
                                                                    <p className="text-[11px] text-white/45">{formatDate(m.scheduledStart)}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/45 mb-2">Recent</p>
                                                        <div className="space-y-2">
                                                            {recentMatches.length === 0 ? <p className="text-sm text-white/45">No completed matches.</p> : recentMatches.map((m) => (
                                                                <div key={m._id} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                                                                    <p className="text-xs font-black uppercase">{teamName(m.team1Id)} {m.team1GamesWon} - {m.team2GamesWon} {teamName(m.team2Id)}</p>
                                                                    <p className="text-[11px] text-white/45">{m.status}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Standings</p>
                                                {sortedStandings.length === 0 ? (
                                                    <p className="text-sm text-white/45">No standings published yet.</p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {sortedStandings.map((row) => (
                                                            <div key={row._id} className="grid grid-cols-[30px_1fr_52px_52px] items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                                                                <span className="text-xs font-black text-primary">#{row.rank}</span>
                                                                <span className="text-xs font-black truncate">{teamName(row.teamId)}</span>
                                                                <span className="text-xs text-center text-white/70">{row.played}</span>
                                                                <span className="text-xs text-center font-black text-primary">{row.points}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Bracket</p>
                                                {!bracket || Object.keys(slotsByRound).length === 0 ? (
                                                    <p className="text-sm text-white/45">No bracket generated yet for this season.</p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {Object.keys(slotsByRound).sort((a, b) => Number(a) - Number(b)).map((round) => (
                                                            <div key={round} className="rounded-xl border border-white/10 bg-black/30 p-3">
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-white/45 mb-2">Round {round}</p>
                                                                <div className="space-y-2">
                                                                    {slotsByRound[Number(round)].map((slot) => (
                                                                        <div key={slot.slotId} className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 text-xs">
                                                                            Slot {slot.position} · {slot.status}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </>
                )}
            </main>
            <BottomNavbar />
        </div>
    );
}
