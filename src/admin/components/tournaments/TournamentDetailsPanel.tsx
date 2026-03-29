import React, { useState } from 'react';
import type { Tournament } from '../../../models/tournament';
import { TournamentStatus } from '../../../models/tournament';
import { Button, Badge } from '../../../components/ui/core';
import { Calendar, Users, Globe, Edit, Trash2, X } from 'lucide-react';
import TournamentBracket from './TournamentBracket';
import tournamentService from '../../../services/tournamentService';
import { placeholderImage } from '../../../lib/placeholderImage';

interface TournamentDetailsPanelProps {
    tournament: Tournament | null;
    onClose: () => void;
    onDelete?: (id: string) => void;
    onEdit?: (tournament: Tournament) => void;
    onStatusUpdate?: (tournamentId: string, newStatus: TournamentStatus) => void;
}

const TournamentDetailsPanel: React.FC<TournamentDetailsPanelProps> = ({
    tournament,
    onClose,
    onDelete,
    onEdit,
    onStatusUpdate,
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
                return [currentStatus];
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
            await tournamentService.updateTournamentStatus(tournament._id, selectedStatus);
            // Call the callback to update parent state dynamically
            if (onStatusUpdate) {
                onStatusUpdate(tournament._id, selectedStatus);
            }
        } catch (error) {
            console.error('Failed to update tournament status:', error);
            alert('Failed to update tournament status. Please try again.');
            setSelectedStatus(tournament.status);
        } finally {
            setIsUpdating(false);
        }
    };

    const renderOverview = () => (
        <div className="space-y-6">
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

            {tournament.description && (
                <div>
                    <h3 className="text-lg font-bold text-white mb-2">Description</h3>
                    <p className="text-text-muted">{tournament.description}</p>
                </div>
            )}

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

            {tournament.prizePool > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-white mb-4">Prize Distribution</h3>
                    <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 gap-4">
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

    const renderManagement = () => {
        const validTransitions = getValidTransitions(tournament.status);

        return (
            <div className="space-y-6">
                <h3 className="text-lg font-bold text-white mb-4">Tournament Management</h3>

                <div className="space-y-6">
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-4">Tournament Lifecycle</h4>

                        {/* Visual Status Stepper */}
                        <div className="relative flex items-center justify-between mb-8 px-2">
                            {/* Connecting Line */}
                            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-white/10 -z-10" />

                            {[
                                { status: TournamentStatus.DRAFT, label: 'Draft' },
                                { status: TournamentStatus.OPEN_REGISTRATION, label: 'Registration' },
                                { status: TournamentStatus.ONGOING, label: 'Ongoing' },
                                { status: TournamentStatus.COMPLETED, label: 'Completed' },
                            ].map((step, index) => {
                                // Determine if this step is active, completed, or future
                                const statusOrder: TournamentStatus[] = [
                                    TournamentStatus.DRAFT,
                                    TournamentStatus.OPEN_REGISTRATION,
                                    TournamentStatus.ONGOING,
                                    TournamentStatus.COMPLETED
                                ];
                                const currentIndex = statusOrder.indexOf(tournament.status);
                                const stepIndex = index;
                                const isCompleted = stepIndex < currentIndex;
                                const isActive = stepIndex === currentIndex;

                                return (
                                    <div key={step.status} className="flex flex-col items-center gap-2 bg-[#121212] px-2 z-10">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${isActive ? 'border-primary bg-primary/20 text-primary scale-110 shadow-[0_0_15px_rgba(0,255,136,0.5)]' :
                                            isCompleted ? 'border-primary bg-primary text-black' :
                                                'border-white/10 bg-[#1A1D21] text-text-muted'
                                            }`}>
                                            {isCompleted ? <span className="font-bold">✓</span> : <span className="text-xs font-bold">{index + 1}</span>}
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-primary' : 'text-text-muted'}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Status Controls */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-sm text-text-muted">Current Status</p>
                                    <p className="text-lg font-bold text-white">{tournament.status.replace('_', ' ')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-text-muted">Next Step</p>
                                    <p className="text-sm font-bold text-white">
                                        {validTransitions.find(t => t !== tournament.status)?.replace('_', ' ') || 'None'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm text-text-muted block">Change Status To:</label>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value as TournamentStatus)}
                                        className="flex-1 bg-black border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary appearance-none cursor-pointer"
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
                                </div>

                                {selectedStatus !== tournament.status && (
                                    <div className="flex gap-2 animate-fade-in-up">
                                        <Button
                                            onClick={handleStatusUpdate}
                                            disabled={isUpdating}
                                            className="flex-1"
                                        >
                                            {isUpdating ? 'Updating...' : 'Confirm Update'}
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
                    </div>

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

                    <div className="border-t border-white/10 pt-4 space-y-4">
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
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-[#121212] overflow-hidden border-l border-white/10 animate-slide-in-right">
            {/* Header with Hero Image Banner */}
            <div className="relative h-48 flex-shrink-0">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: `url(${tournament.bannerImageUrl || placeholderImage(800, 400, 'Tournament')})`,
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/60 to-transparent" />
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white/70 hover:text-white hover:bg-black/60 transition-all z-20 border border-white/10"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header Content */}
                <div className="absolute bottom-4 left-6 right-6 z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getStatusVariant(tournament.status)}>
                            {tournament.status.replace('_', ' ')}
                        </Badge>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/20">
                            {typeof tournament.gameId === 'object' && tournament.gameId?.title
                                ? tournament.gameId.title
                                : 'Game'}
                        </span>
                    </div>
                    <h2 className="text-3xl font-black text-white leading-tight shadow-black drop-shadow-lg">{tournament.name}</h2>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex-shrink-0 border-b border-white/5 px-6">
                <div className="flex gap-1">
                    {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'teams', label: 'Teams' },
                        { id: 'bracket', label: 'Bracket' },
                        { id: 'management', label: 'Management' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'overview' | 'teams' | 'bracket' | 'management')}
                            className={`px-4 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === tab.id
                                ? 'text-white border-primary'
                                : 'text-text-muted border-transparent hover:text-white hover:border-white/20'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-none">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'teams' && renderTeams()}
                {activeTab === 'bracket' && <TournamentBracket tournament={tournament} />}
                {activeTab === 'management' && renderManagement()}
            </div>
        </div>
    );
};

export default TournamentDetailsPanel;
