import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Calendar, Trophy, Users, ArrowRight, MapPin } from 'lucide-react';
import { MOCK_TOURNAMENTS } from '../data/tournamentData';
import { leagueService, type League } from '../../services/leagueService';
import { seasonService } from '../../services/seasonService';

type HomeCompetitionCard = {
    id: string;
    title: string;
    game: string;
    date: string;
    location: string;
    image: string;
    color: string;
    prize: string;
    teamsCount: number | null;
    href: string;
};

const LEAGUE_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop';

function inferLeagueStyle(league: League): { game: string; color: string } {
    const gameText = String(league.gameId || '').toLowerCase();
    const nameText = String(league.name || '').toLowerCase();
    const source = `${gameText} ${nameText}`;

    if (source.includes('valorant')) {
        return { game: 'Valorant', color: 'from-rose-500 to-red-600' };
    }
    if (source.includes('league') || source.includes('lol')) {
        return { game: 'League of Legends', color: 'from-blue-500 to-indigo-600' };
    }
    if (source.includes('cs2') || source.includes('counter')) {
        return { game: 'Counter-Strike 2', color: 'from-yellow-400 to-orange-500' };
    }
    return { game: 'Esports League', color: 'from-emerald-500 to-green-600' };
}

function formatLeagueDate(createdAt?: string): string {
    if (!createdAt) return 'Date TBA';
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return 'Date TBA';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function HomeTournaments() {
    const [latestLeagues, setLatestLeagues] = useState<League[]>([]);
    const [seasonHrefByLeagueId, setSeasonHrefByLeagueId] = useState<Record<string, string>>({});

    useEffect(() => {
        let cancelled = false;
        void leagueService.getAllLeagues()
            .then((leagues) => {
                if (cancelled) return;
                const latest = [...leagues]
                    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                    .slice(0, 3);
                setLatestLeagues(latest);
            })
            .catch(() => {
                if (!cancelled) setLatestLeagues([]);
            });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        let cancelled = false;
        if (latestLeagues.length === 0) {
            setSeasonHrefByLeagueId({});
            return;
        }
        void Promise.all(
            latestLeagues.map(async (league) => {
                try {
                    const seasons = await seasonService.getByLeague(league._id);
                    const selected = seasons.find((s) => s.status === 'ONGOING') || seasons[0];
                    return [league._id, selected ? `/leagues/${league._id}/seasons/${selected._id}` : `/league/${league._id}`] as const;
                } catch {
                    return [league._id, `/league/${league._id}`] as const;
                }
            }),
        ).then((rows) => {
            if (cancelled) return;
            setSeasonHrefByLeagueId(Object.fromEntries(rows));
        });
        return () => { cancelled = true; };
    }, [latestLeagues]);

    const competitionCards = useMemo<HomeCompetitionCard[]>(() => {
        if (latestLeagues.length > 0) {
            return latestLeagues.map((league) => {
                const style = inferLeagueStyle(league);
                return {
                    id: league._id,
                    title: league.name,
                    game: style.game,
                    date: formatLeagueDate(league.createdAt),
                    location: league.level || 'Global',
                    image: league.logoUrl || LEAGUE_FALLBACK_IMAGE,
                    color: style.color,
                    prize: 'TBA',
                    teamsCount: null,
                    href: seasonHrefByLeagueId[league._id] || `/league/${league._id}`,
                };
            });
        }

        return MOCK_TOURNAMENTS.slice(0, 3).map((tournament) => ({
            id: String(tournament.id),
            title: tournament.title,
            game: tournament.game,
            date: tournament.date,
            location: tournament.location,
            image: tournament.image,
            color: tournament.color,
            prize: tournament.prize,
            teamsCount: tournament.teams.length,
            href: `/tournaments/${tournament.id}`,
        }));
    }, [latestLeagues, seasonHrefByLeagueId]);

    return (
        <section id="tournaments" className="min-h-screen flex flex-col justify-center py-24 bg-background relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-20 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 text-primary mb-4">
                        <Trophy className="w-5 h-5" />
                        <span className="font-bold uppercase tracking-wider text-sm">Active Tournaments</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-6 leading-none">
                        Compete for <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary">Glory</span>
                    </h2>

                    <p className="max-w-2xl mx-auto text-text-muted text-lg">
                        Join the world's most prestigious esports events. Prove your worth and claim your share of the prize pool.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {competitionCards.map((tournament) => (
                        <Link
                            to={tournament.href}
                            key={tournament.id}
                            className="block group relative h-[500px] rounded-3xl overflow-hidden cursor-pointer"
                        >
                            {/* Background Image */}
                            <div className="absolute inset-0">
                                <img
                                    src={tournament.image}
                                    alt={tournament.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90 group-hover:opacity-80 transition-opacity" />
                            </div>

                            {/* Content */}
                            <div className="absolute inset-0 p-8 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <span className={`px-4 py-1.5 rounded-full bg-gradient-to-r ${tournament.color} text-white text-xs font-black uppercase tracking-wider shadow-lg`}>
                                        {tournament.game}
                                    </span>
                                </div>

                                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                    <h3 className="text-3xl font-black text-white uppercase leading-tight mb-4 group-hover:text-primary transition-colors">
                                        {tournament.title}
                                    </h3>

                                    <div className="space-y-3 mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                        <div className="flex items-center gap-3 text-sm text-gray-300">
                                            <Calendar className="w-4 h-4 text-primary" />
                                            <span>{tournament.date}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-300">
                                            <MapPin className="w-4 h-4 text-primary" />
                                            <span>{tournament.location}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-300">
                                            <Users className="w-4 h-4 text-primary" />
                                            <span>{tournament.teamsCount != null && tournament.teamsCount > 0 ? `${tournament.teamsCount} Teams` : 'TBA'}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-white/20 pt-6">
                                        <div>
                                            <p className="text-xs text-text-muted uppercase font-bold mb-1">Prize Pool</p>
                                            <p className="text-2xl font-black text-white">{tournament.prize}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-white/10 group-hover:bg-primary group-hover:text-black flex items-center justify-center transition-all duration-300 border border-white/20 group-hover:border-primary">
                                            <ArrowRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
