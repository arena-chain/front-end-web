import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Trophy, Users, ArrowLeft, Shield, Ticket, Share2 } from 'lucide-react';
import { Button } from '../../components/ui/core';
import { MOCK_TOURNAMENTS } from '../../_public/data/tournamentData';
import tournamentService from '../../services/tournamentService';

// Helper to bridge types if needed
interface TournamentDisplay {
    _id: string;
    title: string;
    game: string;
    status: string;
    date: string;
    image: string;
    color: string;
    description: string;
    prize: string;
    location: string;
    teams: { id: string; name: string; logo: string }[];
    bracket: any[];
    checkAuth?: boolean;
}

export default function PlayerTournamentDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState<TournamentDisplay | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (id) {
            fetchTournamentData(id);
        }
    }, [id]);

    const fetchTournamentData = async (tournamentId: string) => {
        setLoading(true);
        try {
            // 1. Try fetching from API first
            const apiData = await tournamentService.fetchTournamentById(tournamentId);

            // Map API data to display format
            const mappedData: TournamentDisplay = {
                _id: apiData._id,
                title: apiData.name,
                game: apiData.gameId?.title || 'Unknown Game',
                status: apiData.status,
                date: new Date(apiData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                image: apiData.bannerImageUrl ?
                    (apiData.bannerImageUrl.startsWith('http') ? apiData.bannerImageUrl : `${import.meta.env.VITE_API_URL}/${apiData.bannerImageUrl}`)
                    : 'https://via.placeholder.com/1920x1080',
                color: 'from-primary to-primary/50',
                description: apiData.description || 'No description available.',
                prize: `$${apiData.prizePool?.toLocaleString() || '0'}`,
                location: 'Online / TBD',
                teams: apiData.teams?.map((t: any) => ({ id: t._id || t, name: 'Team', logo: '' })) || [],
                bracket: [],
                checkAuth: true
            };

            setTournament(mappedData);
        } catch (error) {
            console.log('API fetch failed, falling back to mock data', error);

            // 2. Fallback to Mock Data
            const found = MOCK_TOURNAMENTS.find(t => t.id === Number(tournamentId));
            if (found) {
                setTournament({
                    _id: found.id.toString(),
                    title: found.title,
                    game: found.game,
                    status: found.status,
                    date: found.date,
                    image: found.image,
                    color: found.color,
                    description: found.description,
                    prize: found.prize,
                    location: found.location,
                    teams: found.teams,
                    bracket: found.bracket,
                    checkAuth: false
                });
            } else {
                setTournament(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBookTickets = () => {
        // Since we are already in player dashboard, we can just navigate
        navigate(`/player/tournaments/${tournament?._id}/tickets`);
    };

    if (loading) {
        return (
            <div className="flex-grow flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="flex-grow flex items-center justify-center h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4 text-white">Tournament Not Found</h2>
                    <Button variant="outline" onClick={() => navigate('/player/tournaments')}>
                        Back to Tournaments
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-white flex flex-col pb-12">

            <main className="flex-grow">
                {/* 1. Hero Section */}
                <div className="relative h-[50vh] min-h-[400px] overflow-hidden group rounded-b-3xl shadow-2xl">
                    <div className="absolute inset-0">
                        <img
                            src={tournament.image}
                            alt={tournament.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-black/60 to-black/30" />
                        <div className={`absolute inset-0 bg-gradient-to-r ${tournament.color} opacity-20 mix-blend-overlay`} />
                    </div>

                    <div className="container mx-auto px-6 relative z-10 h-full flex flex-col justify-end pb-8">
                        <Link to="/player/tournaments" className="mb-6 inline-block">
                            <Button variant="ghost" className="hover:bg-white/10 text-white/80 hover:text-white">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Tournaments
                            </Button>
                        </Link>

                        <div className="flex flex-wrap gap-3 mb-4">
                            <span className={`px-4 py-1.5 rounded-full bg-gradient-to-r ${tournament.color} text-white text-xs font-black uppercase tracking-wider shadow-lg`}>
                                {tournament.game}
                            </span>
                            <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-xs font-bold uppercase tracking-wider">
                                {tournament.status}
                            </span>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                            <div className="max-w-3xl">
                                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 leading-none shadow-black drop-shadow-lg">
                                    {tournament.title}
                                </h1>

                                <div className="flex flex-wrap gap-6 md:gap-10 text-base md:text-lg text-gray-200">
                                    <div className="flex items-center gap-2">
                                        <Trophy className="w-5 h-5 text-primary" />
                                        <span className="font-bold">{tournament.prize}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-primary" />
                                        <span>{tournament.date}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-primary" />
                                        <span>{tournament.location}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Call to Action Buttons */}
                            <div className="flex gap-4">
                                {tournament.status === 'OPEN_REGISTRATION' && (
                                    <Button
                                        size="lg"
                                        className="bg-primary text-black hover:bg-primary/90 font-black uppercase tracking-wide px-8 py-6 text-lg shadow-[0_0_30px_-5px_rgba(0,255,136,0.4)]"
                                        onClick={handleBookTickets}
                                    >
                                        <Ticket className="w-5 h-5 mr-2" />
                                        Get Tickets
                                    </Button>
                                )}
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="border-white/20 hover:bg-white/10 px-6 py-6"
                                >
                                    <Share2 className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Overview & Teams & Bracket */}
                <div className="container mx-auto px-6 py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content (Bracket & Overview) */}
                        <div className="lg:col-span-2 space-y-12">

                            {/* Overview */}
                            <section>
                                <h2 className="flex items-center gap-3 text-xl font-black uppercase tracking-wide mb-4">
                                    <Shield className="w-5 h-5 text-primary" />
                                    Tournament Overview
                                </h2>
                                <p className="text-gray-300 leading-relaxed text-base">
                                    {tournament.description}
                                </p>
                            </section>

                            {/* Bracket Visualizer */}
                            <section>
                                <h2 className="flex items-center gap-3 text-xl font-black uppercase tracking-wide mb-6">
                                    <Trophy className="w-5 h-5 text-primary" />
                                    Tournament Bracket
                                </h2>

                                {tournament.bracket.length > 0 ? (
                                    <div className="overflow-x-auto pb-4 custom-scrollbar">
                                        <div className="min-w-[700px] flex justify-between gap-6">
                                            {/* Quarterfinals Column */}
                                            <BracketColumn title="Quarterfinals" matches={tournament.bracket.filter(m => m.round === 'Quarterfinals')} />

                                            {/* Semifinals Column */}
                                            <BracketColumn title="Semifinals" matches={tournament.bracket.filter(m => m.round === 'Semifinals')} className="justify-around" />

                                            {/* Finals Column */}
                                            <BracketColumn title="Grand Finals" matches={tournament.bracket.filter(m => m.round === 'Finals')} className="justify-center" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center text-text-muted">
                                        <Trophy className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-20" />
                                        <p>Bracket information will be available once the tournament starts.</p>
                                    </div>
                                )}
                            </section>

                        </div>

                        {/* Sidebar (Teams) */}
                        <div className="lg:col-span-1">
                            <div className="bg-surface/50 border border-white/5 rounded-2xl p-6 sticky top-8">
                                <h3 className="flex items-center gap-2 text-lg font-bold uppercase tracking-wider mb-4">
                                    <Users className="w-4 h-4 text-primary" />
                                    Participating Teams
                                </h3>

                                {tournament.teams.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {tournament.teams.map((team) => (
                                            <div
                                                key={team.id}
                                                className="group p-3 bg-black/40 border border-white/5 rounded-xl hover:border-primary/50 transition-all text-center"
                                            >
                                                <div className="w-12 h-12 mx-auto mb-2 bg-white/5 rounded-full p-2 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    {team.logo ? (
                                                        <img src={team.logo} alt={team.name} className="max-w-full max-h-full object-contain" />
                                                    ) : (
                                                        <Shield className="w-6 h-6 text-white/20" />
                                                    )}
                                                </div>
                                                <span className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors block truncate">{team.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-text-muted text-sm">Teams to be announced.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// Sub-components for Bracket
function BracketColumn({ title, matches, className = "" }: { title: string, matches: any[], className?: string }) {
    return (
        <div className="flex-1 flex flex-col">
            <h4 className="text-center font-bold text-text-muted uppercase text-xs mb-4">{title}</h4>
            <div className={`flex flex-col gap-4 flex-grow ${className}`}>
                {matches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                ))}
            </div>
        </div>
    );
}

function MatchCard({ match }: { match: any }) {
    const isUpcoming = !match.score1 && !match.score2;

    return (
        <div className="w-56 bg-surface border border-white/10 rounded-lg overflow-hidden shrink-0 relative hover:border-primary/30 transition-colors">
            {/* Date Header */}
            <div className="bg-black/40 px-3 py-1.5 flex justify-between items-center text-[10px] text-text-muted uppercase font-bold border-b border-white/5">
                <span>{match.date}</span>
                <span>{match.time}</span>
            </div>

            {/* Teams */}
            <div className="p-2 space-y-1.5">
                {/* Team 1 */}
                <div className={`flex justify-between items-center ${match.winner?.id === match.team1?.id ? 'text-primary font-bold' : 'text-gray-400'}`}>
                    <div className="flex items-center gap-2">
                        {match.team1 ? (
                            <>
                                <img src={match.team1.logo} alt={match.team1.name} className="w-4 h-4 object-contain" />
                                <span className="text-xs">{match.team1.name}</span>
                            </>
                        ) : (
                            <span className="text-xs italic opacity-50">TBD</span>
                        )}
                    </div>
                    <span className="text-xs">{match.score1 ?? '-'}</span>
                </div>

                {/* Team 2 */}
                <div className={`flex justify-between items-center ${match.winner?.id === match.team2?.id ? 'text-primary font-bold' : 'text-gray-400'}`}>
                    <div className="flex items-center gap-2">
                        {match.team2 ? (
                            <>
                                <img src={match.team2.logo} alt={match.team2.name} className="w-4 h-4 object-contain" />
                                <span className="text-xs">{match.team2.name}</span>
                            </>
                        ) : (
                            <span className="text-xs italic opacity-50">TBD</span>
                        )}
                    </div>
                    <span className="text-xs">{match.score2 ?? '-'}</span>
                </div>
            </div>

            {/* Status Indicator Line */}
            <div className={`h-0.5 w-full ${isUpcoming ? 'bg-white/10' : 'bg-primary/50'}`} />
        </div>
    );
}
