import React, { useState } from 'react';
import type { Tournament } from '../../../models/tournament';
import { TournamentStatus } from '../../../models/tournament';
import { Modal, Button, Badge } from '../../../components/ui/core';
import { Calendar, Users, Globe, Edit, Trash2 } from 'lucide-react';
import TournamentBracket from './TournamentBracket';

interface TournamentDetailsModalProps {
    tournament: Tournament | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: (tournament: Tournament) => void;
    onDelete?: (id: string) => void;
}

const TournamentDetailsModal: React.FC<TournamentDetailsModalProps> = ({
    tournament,
    isOpen,
    onClose,
    onEdit,
    onDelete,
}) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'bracket' | 'management'>('overview');
    const [selectedStatus, setSelectedStatus] = useState<TournamentStatus>(tournament?.status || TournamentStatus.DRAFT);
    const [isUpdating, setIsUpdating] = useState(false);

    // Update selectedStatus when tournament changes
    React.useEffect(() => {
        if (tournament) {
            setSelectedStatus(tournament.status);
        }
    }, [tournament]);

    if (!tournament) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatPrize = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
    };

    const getStatusVariant = (status: TournamentStatus) => {
        switch (status) {
            case TournamentStatus.OPEN_REGISTRATION:
                return 'primary' as const;
            case TournamentStatus.ONGOING:
                return 'info' as const;
            case TournamentStatus.COMPLETED:
                return 'secondary' as const;
            case TournamentStatus.CANCELLED:
                return 'danger' as const;
            default:
                return 'warning' as const;
        }
    };

    const renderOverview = () => (
        <div className="space-y-6">
            {/* Tournament Info */}
            <div>
                <h3 className="text-lg font-bold text-white mb-4">Tournament Information</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-text-muted mb-1">Game</p>
                        <p className="text-white font-semibold">
                            {typeof tournament.gameId === 'object' && tournament.gameId?.title
                                ? tournament.gameId.title
                                : 'Game'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-text-muted mb-1">Format</p>
                        <p className="text-white font-semibold">{tournament.format.replace('_', ' ')}</p>
                    </div>
                    <div>
                        <p className="text-sm text-text-muted mb-1">Status</p>
                        <Badge variant={getStatusVariant(tournament.status)}>
                            {tournament.status.replace('_', ' ')}
                        </Badge>
                    </div>
                    <div>
                        <p className="text-sm text-text-muted mb-1">Organizer</p>
                        <p className="text-white font-semibold">{tournament.organizerId.username}</p>
                    </div>
                </div>
            </div>

            {/* Description */}
            {tournament.description && (
                <div>
                    <h3 className="text-lg font-bold text-white mb-2">Description</h3>
                    <p className="text-text-muted">{tournament.description}</p>
                </div>
            )}

            {/* Dates */}
            <div>
                <h3 className="text-lg font-bold text-white mb-4">Important Dates</h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-white" />
                        <div>
                            <p className="text-sm text-text-muted">Tournament Period</p>
                            <p className="text-white">{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</p>
                        </div>
                    </div>
                    {tournament.registrationStart && tournament.registrationEnd && (
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-white" />
                            <div>
                                <p className="text-sm text-text-muted">Registration Period</p>
                                <p className="text-white">{formatDate(tournament.registrationStart)} - {formatDate(tournament.registrationEnd)}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Prize Breakdown */}
            {tournament.prizePool > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-white mb-4">Prize Distribution</h3>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 rounded-lg p-4">
                            <p className="text-sm text-text-muted mb-1">Total Pool</p>
                            <p className="text-2xl font-bold text-primary">{formatPrize(tournament.prizePool)}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                            <p className="text-sm text-text-muted mb-1">1st Place</p>
                            <p className="text-xl font-bold text-white">{formatPrize(tournament.firstPlace)}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                            <p className="text-sm text-text-muted mb-1">2nd Place</p>
                            <p className="text-xl font-bold text-white">{formatPrize(tournament.secondPlace)}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                            <p className="text-sm text-text-muted mb-1">3rd Place</p>
                            <p className="text-xl font-bold text-white">{formatPrize(tournament.thirdPlace)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stream Link */}
            {tournament.streamUrl && (
                <div>
                    <h3 className="text-lg font-bold text-white mb-2">Live Stream</h3>
                    <a
                        href={tournament.streamUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-2"
                    >
                        <Globe className="w-4 h-4" />
                        {tournament.streamUrl}
                    </a>
                </div>
            )}
        </div>
    );

    const renderTeams = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Registered Teams</h3>
                <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-white font-bold">{tournament.currentTeams}</span>
                    <span className="text-text-muted">/ {tournament.maxTeams}</span>
                </div>
            </div>

            {tournament.currentTeams === 0 ? (
                <div className="text-center py-12">
                    <Users className="w-16 h-16 text-text-muted mx-auto mb-4" />
                    <p className="text-text-muted">No teams registered yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tournament.teams.map((teamId, index) => (
                        <div key={teamId} className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                                <span className="text-lg font-bold text-primary">{index + 1}</span>
                            </div>
                            <div>
                                <p className="text-white font-semibold">Team {index + 1}</p>
                                <p className="text-xs text-text-muted">ID: {teamId}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const getValidTransitions = (currentStatus: TournamentStatus): TournamentStatus[] => {
        switch (currentStatus) {
            case TournamentStatus.DRAFT:
                return [TournamentStatus.DRAFT, TournamentStatus.OPEN_REGISTRATION, TournamentStatus.CANCELLED];
            case TournamentStatus.OPEN_REGISTRATION:
                return [TournamentStatus.OPEN_REGISTRATION, TournamentStatus.ONGOING, TournamentStatus.CANCELLED];
            case TournamentStatus.ONGOING:
                return [TournamentStatus.ONGOING, TournamentStatus.COMPLETED, TournamentStatus.CANCELLED];
            case TournamentStatus.COMPLETED:
            case TournamentStatus.CANCELLED:
                return [currentStatus]; // No transitions from final states
            default:
                return [currentStatus];
        }
    };

    const handleStatusUpdate = async () => {
        if (selectedStatus === tournament.status) return;

        const confirmMessage = `Are you sure you want to change the tournament status from "${tournament.status.replace('_', ' ')}" to "${selectedStatus.replace('_', ' ')}"?`;
        if (!window.confirm(confirmMessage)) {
            setSelectedStatus(tournament.status);
            return;
        }

        setIsUpdating(true);
        try {
            const tournamentService = (await import('../../../services/tournamentService')).default;
            await tournamentService.updateTournamentStatus(tournament._id, selectedStatus);
            window.location.reload(); // Refresh to show updated status
        } catch (error) {
            console.error('Failed to update tournament status:', error);
            alert('Failed to update tournament status. Please try again.');
            setSelectedStatus(tournament.status);
        } finally {
            setIsUpdating(false);
        }
    };

    const renderManagement = () => {
        const validTransitions = getValidTransitions(tournament.status);

        return (
            <div className="space-y-6">
                <h3 className="text-lg font-bold text-white mb-4">Tournament Management</h3>

                {/* Status Management */}
                <div className="space-y-4">
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-3">Update Tournament Status</h4>

                        {/* Status Workflow Visualization */}
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
                            <p className="text-xs text-text-muted mb-3">Valid Status Flow:</p>
                            <div className="flex items-center gap-2 text-xs flex-wrap">
                                <span className="px-2 py-1 bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 rounded">DRAFT</span>
                                <span className="text-text-muted">→</span>
                                <span className="px-2 py-1 bg-green-400/10 border border-green-400/20 text-green-400 rounded">OPEN_REGISTRATION</span>
                                <span className="text-text-muted">→</span>
                                <span className="px-2 py-1 bg-blue-400/10 border border-blue-400/20 text-blue-400 rounded">ONGOING</span>
                                <span className="text-text-muted">→</span>
                                <span className="px-2 py-1 bg-gray-400/10 border border-gray-400/20 text-gray-400 rounded">COMPLETED</span>
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-xs">
                                <span className="text-text-muted">Or</span>
                                <span className="px-2 py-1 bg-red-400/10 border border-red-400/20 text-red-400 rounded">CANCELLED</span>
                                <span className="text-text-muted text-xs">(from any status)</span>
                            </div>
                        </div>

                        {/* Status Dropdown */}
                        <div className="space-y-2">
                            <label className="text-sm text-text-muted">Current Status: <strong className="text-white">{tournament.status.replace('_', ' ')}</strong></label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value as TournamentStatus)}
                                className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                                disabled={isUpdating || validTransitions.length <= 1}
                            >
                                {Object.values(TournamentStatus).map((status) => (
                                    <option
                                        key={status}
                                        value={status}
                                        disabled={!validTransitions.includes(status)}
                                    >
                                        {status.replace('_', ' ')}
                                        {!validTransitions.includes(status) && ' (Invalid transition)'}
                                    </option>
                                ))}
                            </select>
                            {selectedStatus !== tournament.status && (
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleStatusUpdate}
                                        disabled={isUpdating}
                                        className="flex-1"
                                    >
                                        {isUpdating ? 'Updating...' : 'Update Status'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setSelectedStatus(tournament.status)}
                                        disabled={isUpdating}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status Help Text */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <p className="text-xs text-blue-400">
                            <strong>Status Guide:</strong><br />
                            • DRAFT: Tournament is being prepared<br />
                            • OPEN_REGISTRATION: Players can register and buy tickets<br />
                            • ONGOING: Tournament is currently in progress<br />
                            • COMPLETED: Tournament has finished<br />
                            • CANCELLED: Tournament has been cancelled
                        </p>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/10" />

                {/* Other Management Actions */}
                <div className="space-y-4">
                    <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => onEdit && onEdit(tournament)}
                    >
                        <Edit className="w-4 h-4" />
                        Edit Tournament Details
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full justify-start gap-2 !text-red-500 !border-red-500/20 hover:!bg-red-500/10"
                        onClick={() => {
                            if (window.confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) {
                                onDelete && onDelete(tournament._id);
                                onClose();
                            }
                        }}
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Tournament
                    </Button>
                </div>
            </div>
        );
    };


    return (
        <Modal isOpen={isOpen} onClose={onClose} size="full">
            {/* Banner */}
            <div
                className="h-64 relative"
                style={{
                    backgroundImage: `url(${tournament.bannerImageUrl || 'https://via.placeholder.com/1920x400/121212/00ff00?text=Tournament'})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/70 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <Badge variant={getStatusVariant(tournament.status)} className="mb-3">
                                {tournament.status.replace('_', ' ')}
                            </Badge>
                            <h1 className="text-4xl font-black text-white mb-2">{tournament.name}</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm text-text-muted">Prize Pool</p>
                                <p className="text-2xl font-bold text-primary">{formatPrize(tournament.prizePool)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-white/5">
                <div className="flex gap-1 px-6">
                    {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'teams', label: 'Teams' },
                        { id: 'bracket', label: 'Bracket' },
                        { id: 'management', label: 'Management' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'overview' | 'teams' | 'bracket' | 'management')}
                            className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === tab.id
                                ? 'text-white border-primary'
                                : 'text-text-muted border-transparent hover:text-white hover:border-white/20'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'teams' && renderTeams()}
                {activeTab === 'bracket' && <TournamentBracket tournament={tournament} />}
                {activeTab === 'management' && renderManagement()}
            </div>
        </Modal>
    );
};

export default TournamentDetailsModal;
