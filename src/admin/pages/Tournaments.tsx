import React, { useState, useEffect } from 'react';
import { Plus, Globe, Medal, Search } from 'lucide-react';
import { Button, Input, Select } from '../../components/ui/core';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import type { Tournament, CreateTournamentDto } from '../../models/tournament';
import { TournamentStatus } from '../../models/tournament';
import tournamentService from '../../services/tournamentService';
import TournamentCard from '../components/tournaments/TournamentCard';
import CreateTournamentModal from '../components/tournaments/CreateTournamentModal';
import TournamentDetailsModal from '../components/tournaments/TournamentDetailsModal';

export default function Tournaments() {
    const [activeTab, setActiveTab] = useState<'official' | 'ranked'>('official');
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

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

            // Close details modal if open and matching
            if (isDetailsModalOpen && selectedTournament?._id === confirmation.id) {
                setIsDetailsModalOpen(false);
                setSelectedTournament(null);
            }
        } catch (error) {
            console.error(`Failed to ${confirmation.type} tournament:`, error);
        } finally {
            setIsConfirming(false);
            setConfirmation(prev => ({ ...prev, isOpen: false }));
        }
    };

    const handleTournamentClick = (tournament: Tournament) => {
        setSelectedTournament(tournament);
        setIsDetailsModalOpen(true);
    };

    // Filter tournaments
    const filteredTournaments = tournaments.filter((tournament) => {
        const matchesSearch =
            tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tournament.gameId.title.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || tournament.status === statusFilter;

        // Filter by Tier (Official vs Ranked/Community)
        const matchesTab = activeTab === 'official'
            ? tournament.tier === 'OFFICIAL'
            : tournament.tier !== 'OFFICIAL';

        return matchesSearch && matchesStatus && matchesTab;
    });

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Tournaments</h1>
                    <p className="text-text-muted">Manage official and community ranked tournaments.</p>
                </div>
                <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4" />
                    Create Tournament
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/5 pb-1">
                <TabButton
                    active={activeTab === 'official'}
                    onClick={() => setActiveTab('official')}
                    icon={<Globe size={16} />}
                    label="Official"
                />
                <TabButton
                    active={activeTab === 'ranked'}
                    onClick={() => setActiveTab('ranked')}
                    icon={<Medal size={16} />}
                    label="Ranked"
                />
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <Input
                            placeholder="Search tournaments..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11"
                        />
                    </div>
                </div>
                <div className="w-full md:w-48">
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
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

            {/* Content Area */}
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
                            onClick={() => handleTournamentClick(tournament)}
                            isOfficial={activeTab === 'official'}
                            onDelete={handleDeleteClick}
                            onCancel={handleCancelClick}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        {activeTab === 'official' ? (
                            <Globe className="w-10 h-10 text-text-muted" />
                        ) : (
                            <Medal className="w-10 h-10 text-text-muted" />
                        )}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">No Tournaments Found</h3>
                    <p className="text-text-muted mb-6">
                        {searchQuery || statusFilter !== 'all'
                            ? 'Try adjusting your filters'
                            : `Create your first ${activeTab} tournament to get started`
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

            {/* Modals */}
            <CreateTournamentModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateTournament}
            />

            <TournamentDetailsModal
                tournament={selectedTournament}
                isOpen={isDetailsModalOpen}
                onClose={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedTournament(null);
                }}
                onDelete={handleDeleteClick}
                onEdit={(tournament) => {
                    // TODO: Implement edit functionality
                    console.log('Edit tournament:', tournament);
                }}
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

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-2 px-6 py-3 rounded-t-lg text-sm font-bold transition-all duration-200 border-b-2
                ${active
                    ? 'text-white border-primary bg-white/5'
                    : 'text-text-muted border-transparent hover:text-white hover:bg-white/5'
                }
            `}
        >
            {icon}
            {label}
        </button>
    );
}
