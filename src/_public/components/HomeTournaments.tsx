import { Link } from 'react-router-dom';
import { Calendar, Trophy, Users, ArrowRight, MapPin } from 'lucide-react';
import { MOCK_TOURNAMENTS } from '../data/tournamentData';

export function HomeTournaments() {
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
                    {MOCK_TOURNAMENTS.map((tournament) => (
                        <Link
                            to={`/tournaments/${tournament.id}`}
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
                                            <span>{tournament.teams.length > 0 ? `${tournament.teams.length} Teams` : 'TBA'}</span>
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
