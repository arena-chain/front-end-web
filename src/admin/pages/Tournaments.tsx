import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Globe, Search } from 'lucide-react';
import { Button, Input, Select } from '../../components/ui/core';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import type { Tournament, CreateTournamentDto } from '../../models/tournament';
import { TournamentStatus } from '../../models/tournament';
import tournamentService from '../../services/tournamentService';
import TournamentCard from '../components/tournaments/TournamentCard';
import CreateTournamentModal from '../components/tournaments/CreateTournamentModal';

export default function Tournaments() {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    // const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null); // Removed for page navigation
    // const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false); // Removed for page navigation

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

    const handleCreateTournament = async (data: CreateTournamentDto) => {
        try {
            await tournamentService.createTournament(data);
            await fetchTournaments();
            setIsCreateModalOpen(false);
        } catch (error) {
            console.error('Failed to create tournament:', error);
            throw error;
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

    // Filter tournaments
    const filteredTournaments = tournaments.filter((tournament) => {
        const matchesSearch = tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tournament.gameId.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || tournament.status === statusFilter;
        const isOfficial = tournament.type !== 'RANKED';
        return matchesSearch && matchesStatus && isOfficial;
    });

    // Handle status update from panel - update state dynamically


    // Deselect tournament when clicking card (to close panel)
    const navigate = useNavigate();

    // Navigate to details page
    const handleTournamentClick = (tournament: Tournament) => {
        navigate(`/admin/tournaments/${tournament._id}`);
    };

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Tournament List Section */}
            <div className={`flex-1 overflow-y-auto px-8 py-8 transition-all duration-300`}>
                <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Tournaments</h1>
                            <p className="text-text-muted">Manage official tournaments.</p>
                        </div>
                        <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
                            <Plus className="w-4 h-4" />
                            Create Tournament
                        </Button>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 bg-[#1A1D21] p-4 rounded-xl border border-white/5">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <Input
                                    placeholder="Search tournaments..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-11 bg-black/20 border-white/5"
                                />
                            </div>
                        </div>
                        <div className="w-full md:w-48">
                            <Select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-black/20 border-white/5"
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

                    {/* Content Area - List View */}
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-surface border border-white/5 rounded-xl h-24 animate-pulse" />
                            ))}
                        </div>
                    ) : filteredTournaments.length > 0 ? (
                        <div className="space-y-3">
                            {filteredTournaments.map((tournament) => (
                                <TournamentCard
                                    key={tournament._id}
                                    tournament={tournament}
                                    onClick={() => handleTournamentClick(tournament)}
                                    isOfficial={true}
                                    onDelete={handleDeleteClick}
                                    onCancel={handleCancelClick}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-[#1A1D21] rounded-xl border border-white/5 border-dashed">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Globe className="w-10 h-10 text-text-muted" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">No Tournaments Found</h3>
                            <p className="text-text-muted mb-6">
                                {searchQuery || statusFilter !== 'all'
                                    ? 'Try adjusting your filters'
                                    : 'Create your first official tournament to get started'
                                }
                            </p>
                            {!searchQuery && statusFilter === 'all' && (
                                <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    Create Tournament
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>



            {/* Modals */}
            <CreateTournamentModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateTournament}
            />

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
