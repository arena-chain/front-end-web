import { useState, useEffect } from 'react';
import { Search, Calendar, Trophy, Users, Video } from 'lucide-react';
import { Input, Select } from '../../components/ui/core';
import type { Tournament } from '../../models/tournament';
import tournamentService from '../../services/tournamentService';
import { useNavigate } from 'react-router-dom';

export default function PlayerTournaments() {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [gameFilter, setGameFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchTournaments();
    }, []);

    const fetchTournaments = async () => {
        setLoading(true);
        try {
            const data = await tournamentService.fetchTournaments();
            // In a real app, you might want to filter out DRAFT tournaments on the backend
            // For now, we'll filter them out in the UI unless needed
            setTournaments(data.filter(t => t.status !== 'DRAFT'));
        } catch (error) {
            console.error('Failed to fetch tournaments:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTournaments = tournaments.filter((tournament) => {
        // Safe access to gameId properties
        const gameTitle = typeof tournament.gameId === 'object' && tournament.gameId?.title
            ? tournament.gameId.title
            : '';
        const gameId = typeof tournament.gameId === 'object' && tournament.gameId?._id
            ? tournament.gameId._id
            : (tournament.gameId as unknown as string) || '';

        const matchesSearch = tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            gameTitle.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGame = gameFilter === 'all' || gameId === gameFilter;
        const matchesStatus = statusFilter === 'all' || tournament.status === statusFilter;

        return matchesSearch && matchesGame && matchesStatus;
    });

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-2">
                        🏆 Tournaments
                    </h1>
                    <p className="text-text-muted">
                        Follow ongoing matches, view results, and check upcoming schedules.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-surface p-4 rounded-xl border border-white/5">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <Input
                        placeholder="Search tournaments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 bg-background/50 border-white/10"
                    />
                </div>
                <Select
                    value={gameFilter}
                    onChange={(e) => setGameFilter(e.target.value)}
                    className="w-full md:w-48 bg-background/50 border-white/10"
                >
                    <option value="all">All Games</option>
                    {/* Dynamic games would go here */}
                </Select>
                <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full md:w-48 bg-background/50 border-white/10"
                >
                    <option value="all">All Status</option>
                    <option value="ONGOING">Live Now</option>
                    <option value="OPEN_REGISTRATION">Registration Open</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="UPCOMING">Upcoming</option>
                </Select>
            </div>

            {/* Tournament Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-surface border border-white/5 rounded-xl h-96 animate-pulse" />
                    ))}
                </div>
            ) : filteredTournaments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTournaments.map((tournament) => (
                        <TournamentCard
                            key={tournament._id}
                            tournament={tournament}
                            onClick={() => navigate(`/player/tournaments/${tournament._id}`)} // Navigate to player details page
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trophy className="w-10 h-10 text-text-muted" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">No Tournaments Found</h3>
                    <p className="text-text-muted">
                        Try adjusting your filters to find what you're looking for.
                    </p>
                </div>
            )}
        </div>
    );
}

function TournamentCard({ tournament, onClick }: { tournament: Tournament; onClick: () => void }) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const getImageUrl = (url?: string) => {
        if (!url) return 'https://via.placeholder.com/800x400/121212/222222?text=Tournament';
        if (url.startsWith('http')) return url;
        return `${API_URL}/${url.startsWith('/') ? url.slice(1) : url}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getStatusConfig = () => {
        switch (tournament.status) {
            case 'ONGOING':
                return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: Video, label: 'LIVE' };
            case 'OPEN_REGISTRATION':
                return { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: Users, label: 'Registering' };
            case 'COMPLETED':
                return { color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/20', icon: Trophy, label: 'Ended' };
            default:
                return { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Calendar, label: 'Upcoming' };
        }
    };

    const status = getStatusConfig();
    const StatusIcon = status.icon;

    return (
        <div
            onClick={onClick}
            className="group relative bg-[#1A1D21] border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-white/20 hover:shadow-[0_0_30px_-10px_rgba(255,255,255,0.1)] transition-all duration-300"
        >
            {/* Banner */}
            <div className="relative h-48 overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${getImageUrl(tournament.bannerImageUrl)})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D21] via-[#1A1D21]/40 to-transparent" />

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                    <div className={`backdrop-blur-md ${status.bg} border ${status.border} px-3 py-1.5 rounded-full flex items-center gap-2`}>
                        <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
                        <span className={`text-xs font-bold uppercase tracking-wider ${status.color}`}>
                            {status.label}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-primary tracking-wider uppercase">
                            {typeof tournament.gameId === 'object' && tournament.gameId?.title
                                ? tournament.gameId.title
                                : 'Game'}
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-white truncate group-hover:text-primary transition-colors">
                        {tournament.name}
                    </h3>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                    <div className="flex items-center gap-2 text-text-muted bg-white/5 px-3 py-1.5 rounded-lg">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(tournament.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-muted bg-white/5 px-3 py-1.5 rounded-lg">
                        <Users className="w-4 h-4" />
                        <span>{tournament.currentTeams}/{tournament.maxTeams} Teams</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
