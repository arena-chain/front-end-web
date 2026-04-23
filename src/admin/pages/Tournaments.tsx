import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, Trophy, ShieldOff, ShieldCheck, Trash2, XCircle, ChevronRight, Users, DollarSign, Calendar, Check, X } from 'lucide-react';
import { Button, Input } from '../../components/ui/core';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import SuccessModal from '../../components/ui/SuccessModal';
import type { Tournament, CreateTournamentDto } from '../../models/tournament';
import { TournamentStatus } from '../../models/tournament';
import tournamentService from '../../services/tournamentService';
import CreateTournamentWizard from '../components/tournaments/CreateTournamentWizard';
import { toast } from 'sonner';

export default function Tournaments() {
    const navigate = useNavigate();
    const location = useLocation();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Auto-open modal based on route
    useEffect(() => {
        if (location.pathname === '/admin/tournaments/create') {
            setIsCreateModalOpen(true);
        }
    }, [location.pathname]);

    // Confirmation Modal State
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        type: 'delete' | 'cancel' | 'block' | 'unblock' | null;
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

    const handleCreateTournament = async (data: CreateTournamentDto) => {
        try {
            const createdTournament = await tournamentService.createTournament(data);

            await fetchTournaments();
            setIsCreateModalOpen(false);

            // Show success message
            setSuccessModal({
                isOpen: true,
                title: '🎉 Tournament Created!',
                message: `"${createdTournament.name}" has been successfully created and is now live.`,
            });
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

    const handleBlockClick = (id: string, isBlocked: boolean) => {
        const tournament = tournaments.find(t => t._id === id);
        setConfirmation({
            isOpen: true,
            type: isBlocked ? 'unblock' : 'block',
            id,
            title: isBlocked ? 'Unblock Tournament' : 'Block Tournament',
            message: isBlocked
                ? `Unblock "${tournament?.name}"? It will be visible again but marked as Cancelled.`
                : `Block "${tournament?.name}"? Registration will close and the tournament will be suspended.`,
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
            } else if (confirmation.type === 'block') {
                await tournamentService.blockTournament(confirmation.id);
            } else if (confirmation.type === 'unblock') {
                await tournamentService.unblockTournament(confirmation.id);
            }
            await fetchTournaments();
            toast.success(`Tournament ${confirmation.type}ed successfully!`);
        } catch (error) {
            console.error(`Failed to ${confirmation.type} tournament:`, error);
            const msg = error instanceof Error ? error.message : 'Unknown error';
            toast.error(`Error: ${msg}`);
            alert(`Failed to ${confirmation.type} tournament: ${msg}`);
        } finally {
            setIsConfirming(false);
            setConfirmation(prev => ({ ...prev, isOpen: false }));
        }
    };

    // Navigate to details page
    const handleTournamentClick = (tournament: Tournament) => {
        navigate(`/admin/tournaments/${tournament._id}`);
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
        <div className="space-y-6 animate-fade-in-up">
            {/* Hero Header */}
            <div className="relative overflow-hidden bg-[#141419] border border-white/5 rounded-2xl p-8 mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-[#00ff88]/5 to-transparent pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-2 italic">Start Your Competitive Journey</h1>
                        <p className="text-text-muted max-w-lg">Create professional tournaments, manage brackets, and compete for prizes in the ultimate eSports arena.</p>
                    </div>
                    <Button
                        className="gap-2 bg-[#00ff88] text-black hover:bg-[#00ff88]/90 font-black h-12 px-8 rounded-xl shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all hover:scale-105"
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        <Plus className="w-5 h-5" />
                        CREATE TOURNAMENT
                    </Button>
                </div>
            </div>

            {/* Filters & Controls */}
            <div className="flex flex-col xl:flex-row gap-6 items-center justify-between bg-[#141419] p-4 rounded-3xl border border-white/5 mb-10 shadow-2xl">
                <div className="flex bg-black/40 p-1.5 rounded-2xl w-full xl:w-auto overflow-x-auto no-scrollbar scroll-smooth">
                    {['all', 'PENDING_APPROVAL', 'ONGOING', 'OPEN_REGISTRATION', 'UPCOMING', 'COMPLETED', 'REJECTED', 'BLOCKED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 whitespace-nowrap ${statusFilter === status
                                ? status === 'BLOCKED' || status === 'REJECTED'
                                    ? 'bg-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.4)] scale-105'
                                    : status === 'PENDING_APPROVAL'
                                        ? 'bg-amber-500 text-white shadow-[0_0_25px_rgba(245,158,11,0.4)] scale-105'
                                        : 'bg-[#00ff88] text-black shadow-[0_0_25px_rgba(0,255,136,0.4)] scale-105'
                                : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                                }`}
                        >
                            {status === 'all' ? 'All Units'
                                : status === 'OPEN_REGISTRATION' ? 'Open Access'
                                    : status === 'ONGOING' ? 'Live Engagement'
                                        : status === 'BLOCKED' ? '🔒 Blocked'
                                            : status === 'PENDING_APPROVAL' ? '⏳ Pending'
                                                : status === 'REJECTED' ? '❌ Rejected'
                                                    : status.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4 w-full xl:w-auto">
                    <div className="relative flex-1 xl:w-96">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                        <Input
                            placeholder="Search battlefield..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-14 bg-black/30 border-white/5 h-14 rounded-2xl focus:border-[#00ff88]/50 text-white font-black uppercase tracking-tight"
                        />
                    </div>
                    <Button
                        className="h-14 px-8 bg-white/5 border border-white/10 text-white font-black hover:bg-[#00ff88] hover:text-black transition-all duration-500 rounded-2xl flex items-center gap-3 group shadow-[0_5px_15px_rgba(0,0,0,0.3)]"
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                        <span className="hidden md:inline uppercase tracking-widest text-[10px]">Initialize New</span>
                    </Button>
                </div>
            </div>

            {/* ── Status badge helper ─────────────────────────────────────── */}
            {/* Content Area - List/Table View */}
            <div className="bg-[#141419] border border-white/5 rounded-2xl overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-white/5 bg-black/20">
                    {['Tournament', 'Game', 'Format', 'Status', 'Teams', 'Prize', 'Start Date', ''].map((h) => (
                        <span key={h} className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25">{h}</span>
                    ))}
                </div>

                {loading ? (
                    <div className="divide-y divide-white/5">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 animate-pulse">
                                {[160, 80, 90, 70, 60, 60, 90, 40].map((w, j) => (
                                    <div key={j} className="h-3 rounded bg-white/5" style={{ width: w }} />
                                ))}
                            </div>
                        ))}
                    </div>
                ) : filteredTournaments.length > 0 ? (
                    <div className="divide-y divide-white/[0.04]">
                        {filteredTournaments.map((tournament) => {
                            const gameTitle = typeof tournament.gameId === 'object' && tournament.gameId?.title
                                ? tournament.gameId.title : '—';
                            const isBlocked = tournament.status === TournamentStatus.BLOCKED;
                            const statusColors: Record<string, string> = {
                                ONGOING: 'text-red-400 bg-red-400/10 border-red-400/20',
                                OPEN_REGISTRATION: 'text-[#00ff88] bg-[#00ff88]/10 border-[#00ff88]/20',
                                UPCOMING: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
                                COMPLETED: 'text-white/40 bg-white/5 border-white/10',
                                BLOCKED: 'text-red-500 bg-red-500/10 border-red-500/20',
                                DRAFT: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
                                CANCELLED: 'text-white/30 bg-white/5 border-white/10',
                                PENDING_APPROVAL: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
                                REJECTED: 'text-red-500 bg-red-500/10 border-red-500/20',
                            };
                            const fill = tournament.maxTeams > 0 ? Math.round((tournament.currentTeams / tournament.maxTeams) * 100) : 0;

                            return (
                                <div
                                    key={tournament._id}
                                    className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                    onClick={() => handleTournamentClick(tournament)}
                                >
                                    {/* Name */}
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-black text-white uppercase tracking-tight truncate group-hover:text-[#00ff88] transition-colors">
                                            {tournament.name}
                                        </span>
                                        <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">
                                            {tournament.format?.replace('_', ' ') || '—'}
                                        </span>
                                    </div>

                                    {/* Game */}
                                    <span className="text-xs font-bold text-white/50 uppercase truncate">{gameTitle}</span>

                                    {/* Format */}
                                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest truncate">
                                        {tournament.format?.replace('_', ' ') || '—'}
                                    </span>

                                    {/* Status */}
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border w-fit ${statusColors[tournament.status] ?? statusColors.DRAFT}`}>
                                        {tournament.status?.replace('_', ' ')}
                                    </span>

                                    {/* Teams */}
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-white/50">
                                            <Users size={11} className="text-[#00ff88]" />
                                            {tournament.currentTeams}/{tournament.maxTeams}
                                        </div>
                                        <div className="h-1 w-full max-w-[60px] bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#00ff88] rounded-full" style={{ width: `${fill}%` }} />
                                        </div>
                                    </div>

                                    {/* Prize */}
                                    <div className="flex items-center gap-1 text-xs font-bold text-white/50">
                                        <DollarSign size={11} className="text-[#00ff88]" />
                                        {tournament.prizePool ?? 0}
                                    </div>

                                    {/* Start Date */}
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-white/40">
                                        <Calendar size={11} className="text-white/20" />
                                        {new Date(tournament.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                        {tournament.status === TournamentStatus.PENDING_APPROVAL && (
                                            <>
                                                <button
                                                    title="Approve"
                                                    onClick={async () => {
                                                        if (window.confirm(`Approve "${tournament.name}"?`)) {
                                                            try {
                                                                await tournamentService.updateTournamentStatus(tournament._id, TournamentStatus.OPEN_REGISTRATION);
                                                                fetchTournaments();
                                                                toast.success('Approved!');
                                                            } catch (e) { toast.error('Failed'); }
                                                        }
                                                    }}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#00ff88] hover:bg-[#00ff88]/10 transition-all font-bold"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button
                                                    title="Reject"
                                                    onClick={async () => {
                                                        if (window.confirm(`Reject "${tournament.name}"?`)) {
                                                            try {
                                                                await tournamentService.updateTournamentStatus(tournament._id, TournamentStatus.REJECTED);
                                                                fetchTournaments();
                                                                toast.success('Rejected');
                                                            } catch (e) { toast.error('Failed'); }
                                                        }
                                                    }}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-all font-bold"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </>
                                        )}
                                        <button
                                            title={isBlocked ? 'Unblock' : 'Block'}
                                            onClick={() => handleBlockClick(tournament._id, isBlocked)}
                                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isBlocked ? 'text-[#00ff88] hover:bg-[#00ff88]/10' : 'text-red-400 hover:bg-red-400/10'}`}
                                        >
                                            {isBlocked ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                                        </button>
                                        <button
                                            title="Cancel"
                                            onClick={() => handleCancelClick(tournament._id)}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-yellow-400 hover:bg-yellow-400/10 transition-all"
                                        >
                                            <XCircle size={14} />
                                        </button>
                                        <button
                                            title="Delete"
                                            onClick={() => handleDeleteClick(tournament._id)}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                        <ChevronRight size={14} className="text-white/20 ml-1" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 bg-[#00ff88]/5 rounded-2xl flex items-center justify-center mb-4 border border-[#00ff88]/10">
                            <Trophy className="w-8 h-8 text-[#00ff88]/50" />
                        </div>
                        <p className="text-sm font-black text-white/30 uppercase tracking-widest">No Tournaments Found</p>
                        <p className="text-xs text-white/20 mt-1">
                            {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first tournament'}
                        </p>
                        {!searchQuery && statusFilter === 'all' && (
                            <Button onClick={() => setIsCreateModalOpen(true)} className="mt-6 gap-2 bg-[#00ff88] text-black hover:bg-[#00ff88]/90 font-black px-6">
                                <Plus className="w-4 h-4" /> CREATE
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <CreateTournamentWizard
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    if (location.pathname === '/admin/tournaments/create') {
                        navigate('/admin/tournaments');
                    }
                }}
                onSubmit={handleCreateTournament}
            />

            <ConfirmationModal
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleConfirmAction}
                title={confirmation.title}
                message={confirmation.message}
                confirmText={
                    confirmation.type === 'delete' ? 'Delete' :
                        confirmation.type === 'block' ? '🔒 Block Tournament' :
                            confirmation.type === 'unblock' ? '🔓 Unblock Tournament' :
                                'Cancel Tournament'
                }
                variant={confirmation.type === 'delete' || confirmation.type === 'block' ? 'danger' : 'warning'}
                isLoading={isConfirming}
            />

            <SuccessModal
                isOpen={successModal.isOpen}
                onClose={() => setSuccessModal(prev => ({ ...prev, isOpen: false }))}
                title={successModal.title}
                message={successModal.message}
            />
        </div>
    );
}
