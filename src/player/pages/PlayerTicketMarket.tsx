import { useState, useEffect } from 'react';
import { Search, Users, Ticket, ArrowRight } from 'lucide-react';
import { Input } from '../../components/ui/core';
import type { Tournament } from '../../models/tournament';
import tournamentService from '../../services/tournamentService';
import { useNavigate } from 'react-router-dom';
import { MOCK_TOURNAMENTS } from '../../_public/data/tournamentData';
import { resolveBackendAssetUrl } from '../../lib/apiBase';
import { placeholderImage } from '../../lib/placeholderImage';

export default function PlayerTicketMarket() {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [gameFilter] = useState<string>('all');

    useEffect(() => {
        fetchTournaments();
    }, []);

    const fetchTournaments = async () => {
        setLoading(true);
        try {
            const data = await tournamentService.fetchTournaments();

            // Enrich with mock data for missing ticket types if needed 
            // (Same logic as before but now strictly for the market page)
            const enrichedData = data.map(t => {
                if (!t.ticketTypes || t.ticketTypes.length === 0) {
                    const mock = MOCK_TOURNAMENTS.find(m =>
                        m.title.toLowerCase() === t.name.toLowerCase() ||
                        t.name.toLowerCase().includes(m.title.toLowerCase())
                    );

                    if (mock && mock.ticketTypes) {
                        return {
                            ...t,
                            ticketTypes: mock.ticketTypes,
                        };
                    }
                }
                return t;
            });

            // Filter ONLY tournaments that are OPEN_REGISTRATION
            setTournaments(enrichedData.filter(t => t.status === 'OPEN_REGISTRATION'));
        } catch (error) {
            console.error('Failed to fetch tournaments:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTournaments = tournaments.filter((tournament) => {
        const matchesSearch = tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tournament.gameId.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGame = gameFilter === 'all' || tournament.gameId._id === gameFilter;
        return matchesSearch && matchesGame;
    });

    const getMinPrice = (tournament: Tournament): number => {
        if (!tournament.ticketTypes || tournament.ticketTypes.length === 0) return 0;
        return Math.min(...tournament.ticketTypes.map(t => t.price));
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header with High Energy Styling */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/20 via-primary/5 to-transparent border border-primary/20 p-8 md:p-12 mb-8">
                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-bold mb-4 animate-pulse">
                        <Ticket className="w-4 h-4" />
                        <span>TICKET SALES OPEN</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-4">
                        Get Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-300">Tickets</span>
                    </h1>
                    <p className="text-xl text-text-muted mb-8">
                        Secure your spot at the biggest esports events. Limited seats available for upcoming championships.
                    </p>
                </div>
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[100px] rounded-full mix-blend-screen" />
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <Input
                        placeholder="Search available tickets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 bg-surface border-white/5"
                    />
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-surface border border-white/5 rounded-xl h-96 animate-pulse" />
                    ))}
                </div>
            ) : filteredTournaments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTournaments.map((tournament) => (
                        <MarketCard
                            key={tournament._id}
                            tournament={tournament}
                            minPrice={getMinPrice(tournament)}
                            onClick={() => navigate(`/player/tournaments/${tournament._id}/tickets`)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-surface/30 rounded-3xl border border-white/5">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Ticket className="w-12 h-12 text-text-muted opacity-50" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">No Tickets Available</h3>
                    <p className="text-text-muted max-w-md mx-auto">
                        There are no tournaments currently open for registration. Check back later or browse upcoming tournaments in the schedule.
                    </p>
                </div>
            )}
        </div>
    );
}

function MarketCard({ tournament, minPrice, onClick }: { tournament: Tournament, minPrice: number, onClick: () => void }) {
    const getImageUrl = (url?: string) => {
        if (!url) return placeholderImage(800, 400, 'Tournament');
        if (url.startsWith('http')) return url;
        return resolveBackendAssetUrl(url);
    };

    return (
        <div
            onClick={onClick}
            className="group relative bg-[#1A1D21] border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-primary/50 hover:shadow-[0_0_40px_-10px_rgba(0,255,136,0.3)] transition-all duration-300"
        >
            <div className="relative h-56 overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url(${getImageUrl(tournament.bannerImageUrl)})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D21] via-transparent to-transparent" />

                <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-xs font-bold text-primary tracking-wider uppercase mb-1 block">
                        {typeof tournament.gameId === 'object' && tournament.gameId?.title
                            ? tournament.gameId.title
                            : 'Game'}
                    </span>
                    <h3 className="text-2xl font-black text-white leading-tight mb-2 shadow-black drop-shadow-md">
                        {tournament.name}
                    </h3>
                </div>
            </div>

            <div className="p-5">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-sm text-text-muted mb-1">Starting from</p>
                        <p className="text-2xl font-black text-white">${minPrice}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-text-muted mb-1">Available Seats</p>
                        <p className="text-xl font-bold text-primary flex items-center justify-end gap-1">
                            <Users className="w-4 h-4" />
                            {tournament.ticketTypes ? tournament.ticketTypes.reduce((acc, t) => acc + t.capacity, 0) : 0}
                        </p>
                    </div>
                </div>

                <div className="w-full py-3 bg-primary text-background font-bold text-center rounded-xl flex items-center justify-center gap-2 group-hover:bg-primary/90 transition-colors">
                    <span>Book Now</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </div>
    );
}
