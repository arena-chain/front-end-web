import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, Globe, Trash2 } from 'lucide-react';
import { Button, Badge } from '../../components/ui/core';
import type { Tournament } from '../../models/tournament';
import { TournamentStatus } from '../../models/tournament';
import tournamentService from '../../services/tournamentService';
import TournamentBracket from '../components/tournaments/TournamentBracket';

export default function TournamentDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'bracket' | 'management'>('overview');
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<TournamentStatus>(TournamentStatus.DRAFT);

    useEffect(() => {
        if (id) {
            fetchTournament(id);
        }
    }, [id]);

    const fetchTournament = async (tournamentId: string) => {
        setLoading(true);
        try {
            const data = await tournamentService.fetchTournamentById(tournamentId);
            setTournament(data);
            setSelectedStatus(data.status);
        } catch (err) {
            console.error('Failed to fetch tournament details:', err);
            setError('Failed to load tournament details.');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!tournament || selectedStatus === tournament.status) return;

        const confirmMessage = `Are you sure you want to change the tournament status from "${tournament.status.replace('_', ' ')}" to "${selectedStatus.replace('_', ' ')}"?`;
        if (!window.confirm(confirmMessage)) {
            setSelectedStatus(tournament.status);
            return;
        }

        setIsUpdating(true);
        try {
            const updated = await tournamentService.updateTournamentStatus(tournament._id, selectedStatus);
            setTournament(updated);
        } catch (error) {
            console.error('Failed to update tournament status:', error);
            alert('Failed to update tournament status. Please try again.');
            setSelectedStatus(tournament.status);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!tournament) return;

        if (window.confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) {
            try {
                await tournamentService.deleteTournament(tournament._id);
                navigate('/admin/tournaments');
            } catch (error) {
                console.error('Failed to delete tournament:', error);
                alert('Failed to delete tournament.');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#121212] text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !tournament) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#121212] text-white gap-4">
                <h2 className="text-2xl font-bold text-red-500">{error || 'Tournament not found'}</h2>
                <Button onClick={() => navigate('/admin/tournaments')}>Back to Tournaments</Button>
            </div>
        );
    }

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
            case TournamentStatus.OPEN_REGISTRATION: return 'primary';
            case TournamentStatus.ONGOING: return 'info';
            case TournamentStatus.COMPLETED: return 'secondary';
            case TournamentStatus.CANCELLED: return 'danger';
            default: return 'warning';
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

    const renderOverview = () => (
        <div className="space-y-8 animate-fade-in-up">
            <div className="bg-[#1A1D21] border border-white/5 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">Tournament Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <p className="text-sm text-text-muted mb-1">Game</p>
                        <p className="text-white font-semibold flex items-center gap-2">
                            <img src={tournament.gameId.coverImageUrl} className="w-6 h-6 rounded object-cover" alt="" />
                            {tournament.gameId.title}
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
                        <p className="text-sm text-text-muted mb-1">Organizer ID</p>
                        <p className="text-white font-semibold font-mono text-xs">{tournament.organizerId}</p>
                    </div>
                </div>
            </div>

            {tournament.description && (
                <div className="bg-[#1A1D21] border border-white/5 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Description</h3>
                    <p className="text-text-muted">{tournament.description}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1A1D21] border border-white/5 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Important Dates</h3>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-white/5 rounded-lg">
                                <Calendar className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-text-muted">Tournament Period</p>
                                <p className="text-white font-medium">{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</p>
                            </div>
                        </div>
                        {tournament.registrationStart && tournament.registrationEnd && (
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-white/5 rounded-lg">
                                    <Calendar className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-text-muted">Registration Period</p>
                                    <p className="text-white font-medium">{formatDate(tournament.registrationStart)} - {formatDate(tournament.registrationEnd)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {tournament.prizePool > 0 && (
                    <div className="bg-[#1A1D21] border border-white/5 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Prize Pool</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-lg">
                                <span className="text-text-muted">Total Pool</span>
                                <span className="text-2xl font-bold text-primary">{formatPrize(tournament.prizePool)}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-center p-2 bg-white/5 rounded-lg">
                                    <div className="text-xs text-text-muted mb-1">1st</div>
                                    <div className="font-bold text-white">{formatPrize(tournament.firstPlace)}</div>
                                </div>
                                <div className="text-center p-2 bg-white/5 rounded-lg">
                                    <div className="text-xs text-text-muted mb-1">2nd</div>
                                    <div className="font-bold text-white">{formatPrize(tournament.secondPlace)}</div>
                                </div>
                                <div className="text-center p-2 bg-white/5 rounded-lg">
                                    <div className="text-xs text-text-muted mb-1">3rd</div>
                                    <div className="font-bold text-white">{formatPrize(tournament.thirdPlace)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {tournament.streamUrl && (
                <div className="bg-[#1A1D21] border border-white/5 rounded-xl p-6">
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
        <div className="bg-[#1A1D21] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Registered Teams</h3>
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="text-white font-bold">{tournament.currentTeams}</span>
                    <span className="text-text-muted">/ {tournament.maxTeams}</span>
                </div>
            </div>

            {tournament.currentTeams === 0 ? (
                <div className="text-center py-16 bg-white/5 rounded-xl border border-white/5 border-dashed">
                    <Users className="w-16 h-16 text-text-muted mx-auto mb-4" />
                    <p className="text-text-muted">No teams registered yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tournament.teams.map((teamId: string, index: number) => (
                        <div key={teamId} className="bg-[#121212] border border-white/10 rounded-lg p-4 flex items-center gap-4 hover:border-primary/50 transition-colors">
                            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary font-bold">
                                {index + 1}
                            </div>
                            <div>
                                <p className="text-white font-semibold">Team {index + 1}</p>
                                <p className="text-xs text-text-muted font-mono">{String(teamId).substring(0, 8)}...</p>
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
            <div className="space-y-6 animate-fade-in-up">
                <div className="bg-[#1A1D21] border border-white/5 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Tournament Lifecycle</h3>

                    {/* Visual Status Stepper */}
                    <div className="relative flex items-center justify-between mb-12 px-4 max-w-4xl mx-auto">
                        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-white/10 -z-10" />
                        {[
                            { status: TournamentStatus.DRAFT, label: 'Draft' },
                            { status: TournamentStatus.OPEN_REGISTRATION, label: 'Registration' },
                            { status: TournamentStatus.ONGOING, label: 'Ongoing' },
                            { status: TournamentStatus.COMPLETED, label: 'Completed' },
                        ].map((step, index) => {
                            const statusOrder = [TournamentStatus.DRAFT, TournamentStatus.OPEN_REGISTRATION, TournamentStatus.ONGOING, TournamentStatus.COMPLETED, TournamentStatus.CANCELLED];
                            const currentIndex = statusOrder.indexOf(tournament.status);
                            const stepIndex = index;
                            const isCompleted = stepIndex < currentIndex;
                            const isActive = stepIndex === currentIndex;

                            return (
                                <div key={step.status} className="flex flex-col items-center gap-3 bg-[#1A1D21] px-4 z-10">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isActive ? 'border-primary bg-primary/20 text-primary scale-110 shadow-[0_0_20px_rgba(0,255,136,0.3)]' :
                                        isCompleted ? 'border-primary bg-primary text-black' :
                                            'border-white/10 bg-[#25282D] text-text-muted'
                                        }`}>
                                        {isCompleted ? <span className="font-bold">✓</span> : <span className="text-sm font-bold">{index + 1}</span>}
                                    </div>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-primary' : 'text-text-muted'}`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="bg-[#121212] border border-white/10 rounded-xl p-6 max-w-2xl mx-auto">
                        <div className="mb-6">
                            <label className="text-sm text-text-muted block mb-2">Change Status</label>
                            <div className="flex gap-4">
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value as TournamentStatus)}
                                    className="flex-1 bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary appearance-none cursor-pointer"
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
                                <Button
                                    onClick={handleStatusUpdate}
                                    disabled={isUpdating || selectedStatus === tournament.status}
                                    className="min-w-[120px]"
                                >
                                    {isUpdating ? 'Updating...' : 'Update Status'}
                                </Button>
                            </div>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                            <p className="text-sm text-blue-400">
                                <strong>Status Guide:</strong><br />
                                • DRAFT: Tournament is being prepared (not visible to players)<br />
                                • OPEN_REGISTRATION: Players can register and buy tickets<br />
                                • ONGOING: Tournament is currently in progress<br />
                                • COMPLETED: Tournament has finished<br />
                                • CANCELLED: Tournament has been cancelled (refunds logic triggered)
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#1A1D21] border border-white/5 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Danger Zone</h3>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between p-4 border border-red-500/20 bg-red-500/5 rounded-lg">
                            <div>
                                <h4 className="text-white font-bold">Delete Tournament</h4>
                                <p className="text-sm text-text-muted">Permanently remove this tournament and all its data.</p>
                            </div>
                            <Button
                                variant="outline"
                                className="!text-red-500 !border-red-500/20 hover:!bg-red-500/10"
                                onClick={handleDelete}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Tournament
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-[#121212] min-h-screen text-white pb-20">
            {/* Header Hero */}
            <div className="relative h-[300px] w-full">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: `url(${tournament.bannerImageUrl || 'https://via.placeholder.com/1200x400'})`,
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/80 to-transparent" />
                </div>

                <div className="absolute top-6 left-8 z-10">
                    <Button
                        variant="outline"
                        className="bg-black/40 backdrop-blur-md border-white/10 hover:bg-black/60 gap-2"
                        onClick={() => navigate('/admin/tournaments')}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Tournaments
                    </Button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 px-8 pb-8 z-10">
                    <div className="max-w-7xl mx-auto flex items-end justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <Badge variant={getStatusVariant(tournament.status)} className="scale-110">
                                    {tournament.status.replace('_', ' ')}
                                </Badge>
                                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/20">
                                    {tournament.gameId.title}
                                </span>
                            </div>
                            <h1 className="text-5xl font-black text-white leading-tight shadow-black drop-shadow-xl">{tournament.name}</h1>
                        </div>
                        {/* Action Buttons could go here */}
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div className="max-w-7xl mx-auto px-8 mt-8">
                {/* Tabs */}
                <div className="flex border-b border-white/10 mb-8">
                    {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'teams', label: 'Teams' },
                        { id: 'bracket', label: 'Bracket' },
                        { id: 'management', label: 'Management' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === tab.id
                                ? 'text-primary border-primary'
                                : 'text-text-muted border-transparent hover:text-white hover:border-white/20'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px]">
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'teams' && renderTeams()}
                    {activeTab === 'bracket' && <TournamentBracket tournament={tournament} />}
                    {activeTab === 'management' && renderManagement()}
                </div>
            </div>
        </div>
    );
}
