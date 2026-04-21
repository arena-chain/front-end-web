import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Search, ExternalLink } from 'lucide-react';
import { Select } from '../../components/ui/core';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import type { Tournament } from '../../models/tournament';
import { TournamentStatus } from '../../models/tournament';
import tournamentService from '../../services/tournamentService';

export default function Tournaments() {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Confirmation Modal State
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        type: 'delete' | 'cancel' | null;
        id: string | null;
        title: string;
        message: string;
    }>({
        isOpen: false,
        type: null,
        id: null,
        title: '',
        message: '',
    });
    const [isConfirming, setIsConfirming] = useState(false);

    // Success Modal State
    const [successModal, setSuccessModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
    });

    // Fetch tournaments
    useEffect(() => {
        fetchTournaments();
    }, []);

    const fetchTournaments = async () => {
        setLoading(true);
        try {
            const data = await tournamentService.fetchTournaments();
            setTournaments(data);
        } catch (error) {
            console.error('Failed to fetch tournaments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (id: string) => {
        const tournament = tournaments.find(t => t._id === id);
        setConfirmation({
            isOpen: true,
            type: 'delete',
            id,
            title: 'Delete Tournament',
            message: `Are you sure you want to delete "${tournament?.name}"? This action cannot be undone.`
        });
    };

    const handleCancelClick = (id: string) => {
        const tournament = tournaments.find(t => t._id === id);
        setConfirmation({
            isOpen: true,
            type: 'cancel',
            id,
            title: 'Cancel Tournament',
            message: `Are you sure you want to cancel "${tournament?.name}"? This will stop all ongoing matches and registration.`
        });
    };

    const handleConfirmAction = async () => {
        if (!confirmation.id || !confirmation.type) return;

        setIsConfirming(true);
        try {
            if (confirmation.type === 'delete') {
                await tournamentService.deleteTournament(confirmation.id);
            } else if (confirmation.type === 'cancel') {
                await tournamentService.updateTournament(confirmation.id, {
                    status: TournamentStatus.CANCELLED
                });
            }
            await fetchTournaments();
        } catch (error) {
            console.error(`Failed to ${confirmation.type} tournament:`, error);
        } finally {
            setIsConfirming(false);
            setConfirmation(prev => ({ ...prev, isOpen: false }));
        }
    };

    // Navigate to details page
    const handleTournamentClick = (tournament: Tournament) => {
        navigate(`/admin/tournaments/${tournament._id}`);
    };

    const formatMoney = (value: number) => {
        if (!Number.isFinite(value) || value <= 0) return '$0';
        if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
        if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
        return `$${value.toFixed(0)}`;
    };

    // Filter tournaments
    const filteredTournaments = tournaments.filter((tournament) => {
        // Safe access to gameId properties
        const gameTitle = typeof tournament.gameId === 'object' && tournament.gameId?.title
            ? tournament.gameId.title
            : '';

        const matchesSearch = tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            gameTitle.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || tournament.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="animate-fade-in-up text-zinc-300">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-8">
                <div>
                    <h1 className="text-5xl md:text-6xl font-black italic text-white uppercase tracking-tighter leading-none mb-4">
                        Tournament <span className="text-[#00FF00]">Management</span>
                    </h1>
                    <p className="text-zinc-500 font-medium max-w-2xl">
                        Oversee the entire competitive ecosystem. Configure parameters, monitor registration yields, and deploy live brackets.
                    </p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl mb-8">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            placeholder="QUERY SYSTEM..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-11 bg-zinc-900/50 border border-zinc-800 rounded-lg py-2 pl-11 pr-4 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-[#00FF00]/50 text-white"
                        />
                    </div>
                </div>
                <div className="w-full md:w-48">
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-11 bg-zinc-900/50 border-zinc-800 text-white"
                    >
                        <option value="all">All Status</option>
                        <option value={TournamentStatus.DRAFT}>Draft</option>
                        <option value={TournamentStatus.OPEN_REGISTRATION}>Open Registration</option>
                        <option value={TournamentStatus.ONGOING}>Ongoing</option>
                        <option value={TournamentStatus.COMPLETED}>Completed</option>
                        <option value={TournamentStatus.CANCELLED}>Cancelled</option>
                    </Select>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-zinc-900/40 border border-zinc-800 rounded-xl h-80 animate-pulse" />
                    ))}
                </div>
            ) : filteredTournaments.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {filteredTournaments.map((tournament) => (
                        <div
                            key={tournament._id}
                            className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden hover:border-[#00FF00]/50 transition-all duration-300 group"
                        >
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={tournament.bannerImageUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800'}
                                    alt={tournament.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
                                {tournament.status === TournamentStatus.ONGOING && (
                                    <div className="absolute top-4 left-4 bg-[#00FF00] text-black text-[10px] font-black px-2 py-1 rounded flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
                                        ONGOING
                                    </div>
                                )}
                                {tournament.status === TournamentStatus.OPEN_REGISTRATION && (
                                    <div className="absolute top-4 left-4 bg-zinc-800/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded border border-zinc-700">
                                        OPEN REGISTRATION
                                    </div>
                                )}
                            </div>

                            <div className="p-6">
                                <h3 className="text-2xl font-black italic text-white mb-1 uppercase tracking-tight">{tournament.name}</h3>
                                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-6">
                                    OFFICIAL • {(tournament.status || 'UNKNOWN').replace('_', ' ')}
                                </p>

                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    <div>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Revenue Est.</p>
                                        <p className="text-[#00FF00] font-black italic">{formatMoney(Number(tournament.prizePool || 0))}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Slots Filled</p>
                                        <p className="text-white font-black italic">{tournament.currentTeams || 0} / {tournament.maxTeams || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Ticketing</p>
                                        <p className="text-white font-black italic">{Array.isArray(tournament.ticketTypes) ? tournament.ticketTypes.length : 0} Tiers</p>
                                    </div>
                                </div>

                                <button
                                    className="w-full flex items-center justify-between group/btn text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-[#00FF00] transition-colors"
                                    onClick={() => handleTournamentClick(tournament)}
                                >
                                    <span>Manage Core Node</span>
                                    <ExternalLink size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-zinc-900/40 rounded-xl border border-zinc-800 border-dashed">
                    <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Globe className="w-10 h-10 text-zinc-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">No Tournaments Found</h3>
                    <p className="text-zinc-500 mb-2">
                        {searchQuery || statusFilter !== 'all'
                            ? 'Try adjusting your filters'
                            : 'No tournament data available yet'
                        }
                    </p>
                </div>
            )}

            <div className="mt-10 pt-6 border-t border-zinc-900 flex justify-between items-center text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
                <div className="flex gap-8">
                    <span>Network Latency: <span className="text-[#00FF00]">12ms Optimal</span></span>
                    <span>Active Admins: <span className="text-white">4 Online</span></span>
                </div>
                <span>KINETIC.DASH_BORD_SYSTEMS_V2</span>
            </div>

            <ConfirmationModal
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleConfirmAction}
                title={confirmation.title}
                message={confirmation.message}
                confirmText={confirmation.type === 'delete' ? 'Delete' : 'Cancel Tournament'}
                variant={confirmation.type === 'delete' ? 'danger' : 'warning'}
                isLoading={isConfirming}
            />
        </div>
    );
}
