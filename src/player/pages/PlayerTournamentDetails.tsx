import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Trophy, Users, ArrowLeft, Shield, Ticket, Share2, Play } from 'lucide-react';
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
    streamUrl?: string;
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
                    (apiData.bannerImageUrl.startsWith('http') ? apiData.bannerImageUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${apiData.bannerImageUrl}`)
                    : 'https://via.placeholder.com/1920x1080',
                color: 'from-primary to-primary/50',
                description: apiData.description || 'No description available.',
                prize: `$${apiData.prizePool?.toLocaleString() || '0'}`,
                location: 'Online / TBD',
                teams: apiData.teams?.length > 0
                    ? apiData.teams.map((t: any) => ({
                        id: t._id || t,
                        name: t.name || 'Team',
                        logo: t.logo || ''
                    }))
                    : MOCK_TOURNAMENTS[0].teams, // Fallback to mock teams
                bracket: MOCK_TOURNAMENTS[0].bracket as any[], // Fallback to mock bracket for visualization
                streamUrl: apiData.streamUrl,
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
                                    className="bg-red-600 text-white hover:bg-red-700 font-black uppercase tracking-wide px-8 py-6 text-lg shadow-[0_0_30px_-5px_rgba(220,38,38,0.4)]"
                                    onClick={() => window.open(tournament.streamUrl || 'https://twitch.tv', '_blank')}
                                >
                                    <Play className="w-5 h-5 mr-2 fill-current" />
                                    Watch Live
                                </Button>

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

                <div className="container mx-auto px-6 py-12 flex flex-col gap-16">

                    {/* 1. Dates (Start - End) */}
                    <section className="flex flex-col items-center justify-center text-center animate-fade-in-up">
                        <div className="flex items-center gap-3 text-2xl md:text-3xl font-black text-primary uppercase tracking-wider mb-2">
                            <Calendar className="w-8 h-8" />
                            <span>{tournament.date}</span>
                        </div>
                        <p className="text-gray-400 font-medium">Tournament Duration</p>
                    </section>

                    {/* 2. Participating Teams */}
                    <section className="animate-fade-in-up delay-100">
                        <h2 className="flex items-center justify-center gap-3 text-2xl font-black uppercase tracking-wide mb-8 text-center text-white">
                            <Users className="w-6 h-6 text-primary" />
                            Participating Teams
                        </h2>

                        {tournament.teams.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {tournament.teams.map((team) => (
                                    <div
                                        key={team.id}
                                        className="group p-4 bg-[#1A1D21] border border-white/5 rounded-2xl hover:border-primary/50 transition-all text-center hover:shadow-[0_0_20px_rgba(0,255,136,0.1)] hover:-translate-y-1"
                                    >
                                        <div className="w-16 h-16 mx-auto mb-3 bg-black/40 rounded-full p-3 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                                            {team.logo ? (
                                                <img src={team.logo} alt={team.name} className="max-w-full max-h-full object-contain" />
                                            ) : (
                                                <Shield className="w-8 h-8 text-white/20" />
                                            )}
                                        </div>
                                        <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors block truncate">{team.name}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-text-muted text-center italic">Teams to be announced.</p>
                        )}
                    </section>

                    {/* 3. Match Schedule (New Section) */}
                    <section className="animate-fade-in-up delay-150">
                        <h2 className="flex items-center justify-center gap-3 text-2xl font-black uppercase tracking-wide mb-8 text-center text-white">
                            <Calendar className="w-6 h-6 text-primary" />
                            Match Schedule
                        </h2>

                        <div className="max-w-4xl mx-auto space-y-3">
                            {tournament.bracket.length > 0 ? (
                                tournament.bracket
                                    .slice() // Create a copy to sort
                                    .sort((a, b) => {
                                        // Simple sort by date string (assuming 'Nov 20' format for now, might need better parsing in real app)
                                        return new Date(a.date).getTime() - new Date(b.date).getTime();
                                    })
                                    .map((match) => (
                                        <div key={match.id} className="flex flex-col md:flex-row items-center gap-4 bg-[#1A1D21] border border-white/5 p-4 rounded-xl hover:border-primary/30 transition-all">

                                            {/* Date & Round */}
                                            <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-1 min-w-[120px]">
                                                <div className="flex items-center gap-2 text-primary font-bold">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{match.date}</span>
                                                </div>
                                                <span className="text-xs text-gray-400 uppercase tracking-widest">{match.time} • {match.round}</span>
                                            </div>

                                            {/* Matchup */}
                                            <div className="flex-1 flex items-center justify-center gap-4 w-full">
                                                {/* Team 1 */}
                                                <div className={`flex items-center gap-3 flex-1 justify-end ${match.winner?.id === match.team1?.id ? 'text-white font-bold' : 'text-gray-400'}`}>
                                                    <span className="text-right hidden md:block">{match.team1?.name || 'TBD'}</span>
                                                    {match.team1?.logo ? (
                                                        <img src={match.team1.logo} alt={match.team1.name} className="w-8 h-8 object-contain" />
                                                    ) : (
                                                        <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center"><Shield className="w-4 h-4" /></div>
                                                    )}
                                                </div>

                                                {/* Score / VS */}
                                                <div className="px-4 py-1 bg-black/40 rounded text-sm font-mono font-bold text-white/80">
                                                    {match.score1 ?? 0} - {match.score2 ?? 0}
                                                </div>

                                                {/* Team 2 */}
                                                <div className={`flex items-center gap-3 flex-1 justify-start ${match.winner?.id === match.team2?.id ? 'text-white font-bold' : 'text-gray-400'}`}>
                                                    {match.team2?.logo ? (
                                                        <img src={match.team2.logo} alt={match.team2.name} className="w-8 h-8 object-contain" />
                                                    ) : (
                                                        <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center"><Shield className="w-4 h-4" /></div>
                                                    )}
                                                    <span className="hidden md:block">{match.team2?.name || 'TBD'}</span>
                                                </div>
                                            </div>

                                            {/* Status */}
                                            <div className="min-w-[100px] text-right">
                                                {(!match.score1 && !match.score2) ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20">
                                                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                                        Upcoming
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-gray-400 text-xs font-bold uppercase tracking-wider border border-white/10">
                                                        Completed
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                <p className="text-center text-text-muted italic">Schedule to be announced.</p>
                            )}
                        </div>
                    </section>

                    {/* 3. Bracket (No Scrollbar Style) */}
                    <section className="w-full overflow-hidden animate-fade-in-up delay-200">
                        <h2 className="flex items-center justify-center gap-3 text-2xl font-black uppercase tracking-wide mb-8 text-center text-white">
                            <Trophy className="w-6 h-6 text-primary" />
                            Tournament Bracket
                        </h2>

                        <div className="overflow-x-auto pb-4 scrollbar-hide flex justify-center">
                            {tournament.bracket.length > 0 ? (
                                <div className="min-w-[900px] py-8 px-4">
                                    <div className="flex justify-between items-stretch gap-8">

                                        {/* Column 1: Quarterfinals */}
                                        <div className="flex flex-col justify-around gap-8 relative">
                                            <h4 className="absolute -top-10 left-0 w-full text-center font-bold text-text-muted uppercase text-xs tracking-wider">Quarterfinals</h4>
                                            {tournament.bracket.filter(m => m.round === 'Quarterfinals').map((match, idx) => (
                                                <div key={match.id} className="relative group">
                                                    <MatchCard match={match} />
                                                    {/* Connector to Semis */}
                                                    {idx % 2 === 0 ? (
                                                        // Even: Top of pair
                                                        <div className="absolute top-1/2 -right-8 w-8 h-[calc(50%+2rem)] border-t-2 border-r-2 border-white/10 rounded-tr-xl" />
                                                    ) : (
                                                        // Odd: Bottom of pair
                                                        <div className="absolute bottom-1/2 -right-8 w-8 h-[calc(50%+2rem)] border-b-2 border-r-2 border-white/10 rounded-br-xl" />
                                                    )}
                                                    <div className="absolute top-1/2 -right-4 w-4 h-[2px] bg-white/10" />
                                                </div>
                                            ))}
                                        </div>

                                        {/* Column 2: Semifinals */}
                                        <div className="flex flex-col justify-around gap-16 relative">
                                            <h4 className="absolute -top-10 left-0 w-full text-center font-bold text-text-muted uppercase text-xs tracking-wider">Semifinals</h4>
                                            {tournament.bracket.filter(m => m.round === 'Semifinals').map((match, idx) => (
                                                <div key={match.id} className="relative group">
                                                    {/* Incoming */}
                                                    <div className="absolute top-1/2 -left-8 w-8 h-[2px] bg-white/10" />

                                                    <MatchCard match={match} />

                                                    {/* Outgoing */}
                                                    {idx % 2 === 0 ? (
                                                        <div className="absolute top-1/2 -right-8 w-8 h-[calc(50%+4rem)] border-t-2 border-r-2 border-white/10 rounded-tr-xl" />
                                                    ) : (
                                                        <div className="absolute bottom-1/2 -right-8 w-8 h-[calc(50%+4rem)] border-b-2 border-r-2 border-white/10 rounded-br-xl" />
                                                    )}
                                                    <div className="absolute top-1/2 -right-4 w-4 h-[2px] bg-white/10" />
                                                </div>
                                            ))}
                                        </div>

                                        {/* Column 3: Grand Finals */}
                                        <div className="flex flex-col justify-center relative">
                                            <h4 className="absolute -top-10 left-0 w-full text-center font-bold text-text-muted uppercase text-xs tracking-wider text-primary">Grand Finals</h4>
                                            {tournament.bracket.filter(m => m.round === 'Finals').map((match) => (
                                                <div key={match.id} className="relative group">
                                                    {/* Incoming */}
                                                    <div className="absolute top-1/2 -left-8 w-8 h-[2px] bg-white/10" />

                                                    <div className="scale-125 origin-center shadow-[0_0_50px_rgba(0,255,136,0.2)] rounded-lg">
                                                        <MatchCard match={match} isFinal />
                                                    </div>

                                                    {/* Trophy Icon above */}
                                                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 text-primary animate-bounce">
                                                        <Trophy className="w-10 h-10 filter drop-shadow-[0_0_10px_rgba(0,255,136,0.5)]" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center text-text-muted">
                                    <Trophy className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-20" />
                                    <p>Bracket information will be available once the tournament starts.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* 4. Prize & Medal */}
                    <section className="flex flex-col items-center justify-center text-center py-8 animate-fade-in-up delay-300">
                        <div className="relative mb-6">
                            {/* Medal Graphic (Using Lucide Icon styled to look like a medal) */}
                            <div className="w-32 h-32 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.4)] border-4 border-[#FFD700]">
                                <Trophy className="w-16 h-16 text-[#FFF] drop-shadow-md" />
                            </div>
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-black/80 px-4 py-1 rounded-full border border-white/10 whitespace-nowrap">
                                <span className="text-xs uppercase font-bold text-yellow-400 tracking-wider">Champion's Reward</span>
                            </div>
                        </div>

                        <h2 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 tracking-tighter mb-2">
                            {tournament.prize}
                        </h2>
                        <p className="text-xl text-primary font-bold uppercase tracking-widest">Total Prize Pool</p>
                    </section>

                </div>
            </main>
        </div>
    );
}

// Sub-components for Bracket
function MatchCard({ match, isFinal = false }: { match: any, isFinal?: boolean }) {
    const isUpcoming = !match.score1 && !match.score2;

    return (
        <div className={`w-56 bg-[#1A1D21] border border-white/10 rounded-lg overflow-hidden shrink-0 relative hover:border-primary/30 transition-colors ${isFinal ? 'border-primary/50 shadow-[0_0_20px_rgba(0,255,136,0.1)]' : ''}`}>
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
