import { useState, useEffect } from 'react';
import { Search, Gamepad2, Trophy, Star, Edit, Trash2, AlertTriangle, Building2, Users, Monitor } from 'lucide-react';
import { Button, Input, Modal } from '../../components/ui/core';
import type { Game } from '../../models/game';
import catalogService, { type CreateGameDto, type UpdateGameDto } from '../../services/catalogService';
import GameForm from '../components/games/GameForm';
import { placeholderImage } from '../../lib/placeholderImage';
import { resolveBackendAssetUrl } from '../../lib/apiBase';

export default function Games() {
    const [searchQuery, setSearchQuery] = useState('');
    const [games, setGames] = useState<Game[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingGame, setEditingGame] = useState<Game | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; game: Game | null }>({ isOpen: false, game: null });

    useEffect(() => {
        loadGames();
    }, []);

    const loadGames = async () => {
        try {
            const data = await catalogService.fetchGames();
            setGames(data);
        } catch (error) {
            console.error('Failed to load games:', error);
            // Fallback to empty list or show error notification
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateGame = async (data: CreateGameDto | UpdateGameDto | FormData) => {
        setIsSubmitting(true);
        try {
            await catalogService.createGame(data as CreateGameDto | FormData);
            await loadGames();
            setIsFormOpen(false);
        } catch (error) {
            console.error('Failed to create game:', error);
            alert('Failed to create game. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateGame = async (data: CreateGameDto | UpdateGameDto | FormData) => {
        if (!editingGame) return;
        setIsSubmitting(true);
        try {
            await catalogService.updateGame(editingGame._id, data as UpdateGameDto | FormData);
            await loadGames();
            setIsFormOpen(false);
            setEditingGame(undefined);
        } catch (error) {
            console.error('Failed to update game:', error);
            alert('Failed to update game. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteGame = async (id: string) => {
        try {
            await catalogService.deleteGame(id);
            await loadGames();
            setDeleteConfirmation({ isOpen: false, game: null });
        } catch (error) {
            console.error('Failed to delete game:', error);
            alert('Failed to delete game.');
        }
    };

    const openDeleteConfirmation = (game: Game) => {
        setDeleteConfirmation({ isOpen: true, game });
    };

    const closeDeleteConfirmation = () => {
        setDeleteConfirmation({ isOpen: false, game: null });
    };

    const openEditModal = (game: Game) => {
        setEditingGame(game);
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingGame(undefined);
    };

    const filteredGames = games.filter(game =>
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.genre.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in-up relative">
            <div className={`transition-all duration-300 ${isFormOpen ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Games Catalog</h1>
                        <p className="text-text-muted">Manage supported games and partner integrations.</p>
                    </div>
                    <Button className="gap-2" onClick={() => setIsFormOpen(true)}>
                        <Gamepad2 className="w-4 h-4" />
                        Add Game
                    </Button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <Input
                        placeholder="Search games..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 max-w-md"
                    />
                </div>

                {/* Games Grid */}
                <div className="mt-8">
                    {isLoading ? (
                        <div className="text-center py-20 text-text-muted">Loading games...</div>
                    ) : (
                        <div className="flex flex-col gap-8">
                            {filteredGames.map(game => (
                                <GameCard
                                    key={game._id}
                                    game={game}
                                    onEdit={() => openEditModal(game)}
                                    onDelete={() => openDeleteConfirmation(game)}
                                />
                            ))}
                        </div>
                    )}

                    {!isLoading && filteredGames.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
                            <div className="bg-white/5 p-4 rounded-full mb-4">
                                <Gamepad2 className="w-8 h-8 text-text-muted" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No games found</h3>
                            <p className="text-text-muted mb-6 max-w-sm">
                                {searchQuery
                                    ? `We couldn't find any games matching "${searchQuery}". Try adjusting your search terms.`
                                    : "There are no games in the catalog yet. Add your first game to get started."}
                            </p>
                            {searchQuery && (
                                <Button variant="secondary" onClick={() => setSearchQuery('')}>
                                    Clear Search
                                </Button>
                            )}
                            {!searchQuery && (
                                <Button className="gap-2" onClick={() => setIsFormOpen(true)}>
                                    <Gamepad2 className="w-4 h-4" />
                                    Add First Game
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Form */}
            <Modal isOpen={isFormOpen} onClose={closeForm} size="xl">
                <div className="p-6">
                    <GameForm
                        game={editingGame}
                        onSubmit={editingGame ? handleUpdateGame : handleCreateGame}
                        onCancel={closeForm}
                        isLoading={isSubmitting}
                    />
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                game={deleteConfirmation.game}
                onConfirm={() => deleteConfirmation.game && handleDeleteGame(deleteConfirmation.game._id)}
                onCancel={closeDeleteConfirmation}
            />
        </div>
    );
}

function GameCard({ game, onEdit, onDelete }: { game: Game; onEdit: () => void; onDelete: () => void }) {
    const imageUrl = game.coverImageUrl
        ? (game.coverImageUrl.startsWith('/uploads/') || game.coverImageUrl.startsWith('/uploads') || game.coverImageUrl.startsWith('uploads/')
            ? resolveBackendAssetUrl(game.coverImageUrl)
            : game.coverImageUrl)
        : placeholderImage(400, 200, 'No image');

    return (
        <div className="relative p-1" style={{
            background: 'linear-gradient(135deg, rgba(0, 255, 157, 0.2), rgba(0, 255, 157, 0.05), rgba(0, 255, 157, 0.2))',
            clipPath: 'polygon(2% 0%, 100% 0%, 98% 100%, 0% 100%)',
        }}>
            <div
                className="group relative overflow-hidden transition-all duration-500 flex flex-row hover:scale-[1.01]"
                style={{
                    clipPath: 'polygon(2% 0%, 100% 0%, 98% 100%, 0% 100%)',
                    background: 'linear-gradient(135deg, rgba(20, 20, 25, 0.95) 0%, rgba(15, 15, 20, 0.98) 100%)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                }}
            >          {/* Animated gradient border on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{
                    background: 'linear-gradient(90deg, transparent, rgba(0, 255, 157, 0.3), transparent)',
                    animation: 'shimmer 3s infinite',
                }} />

                {/* Cover Image - Left Side */}
                <div className="w-96 h-64 relative overflow-hidden flex-shrink-0" style={{
                    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(20, 20, 25, 0.9) 100%)'
                }}>
                    <img
                        src={imageUrl}
                        alt={game.title}
                        className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                        onError={(e) => {
                            e.currentTarget.src = placeholderImage(400, 200, 'No image');
                        }}
                    />
                    {/* Multi-layer gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-surface" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Glossy effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Partner Badge */}
                    {game.isPartner && (
                        <div className="absolute top-4 left-4 z-10 animate-pulse">
                            <div className="relative bg-gradient-to-r from-yellow-500/30 to-yellow-600/30 backdrop-blur-xl border border-yellow-400/60 text-yellow-300 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-2xl shadow-yellow-500/30">
                                <Star className="w-4 h-4 fill-yellow-400 animate-spin-slow" />
                                <span className="bg-gradient-to-r from-yellow-200 to-yellow-400 bg-clip-text text-transparent">PARTNER</span>
                            </div>
                        </div>
                    )}

                    {/* Image corner accent */}
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                {/* Content - Right Side */}
                <div className="flex-1 p-8 flex flex-col justify-between relative">
                    {/* Background accent gradient */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    <div className="flex items-start justify-between gap-4 relative z-10">
                        <div className="flex-1">
                            {/* Title + genre */}
                            <h3 className="text-3xl font-black text-white group-hover:text-primary transition-all duration-300 mb-1 tracking-tight" style={{
                                textShadow: '0 2px 10px rgba(0, 255, 157, 0.2)'
                            }}>
                                {game.title}
                            </h3>
                            <div className="flex items-center gap-3 mb-3">
                                <p className="text-sm text-primary font-bold uppercase tracking-widest">{game.genre}</p>
                                <div className="h-1 w-12 bg-gradient-to-r from-primary to-transparent rounded-full" />
                            </div>

                            {/* Meta row — publisher · team size · platforms */}
                            <div className="flex flex-wrap items-center gap-4 mb-4">
                                {game.publisher && (
                                    <div className="flex items-center gap-1.5 text-xs text-text-muted">
                                        <Building2 className="w-3.5 h-3.5 text-primary/60" />
                                        <span className="font-semibold text-white/80">{game.publisher}</span>
                                    </div>
                                )}
                                {(() => {
                                    const meta = game.metadata as Record<string, unknown> | undefined;
                                    const raw = game.teamSize ?? meta?.teamSize;
                                    if (raw === undefined || raw === null || raw === '') return null;
                                    const label = String(raw);
                                    return (
                                    <div className="flex items-center gap-1.5 text-xs text-text-muted">
                                        <Users className="w-3.5 h-3.5 text-primary/60" />
                                        <span>
                                            {label}v{label} per team
                                        </span>
                                    </div>
                                    );
                                })()}
                                {(game.platforms || []).length > 0 && (
                                    <div className="flex items-center gap-1.5 text-xs text-text-muted">
                                        <Monitor className="w-3.5 h-3.5 text-primary/60" />
                                        <span>{(game.platforms || []).join(' · ')}</span>
                                    </div>
                                )}
                                {game.releaseDate && (
                                    <span className="text-xs text-text-muted">
                                        Released {new Date(game.releaseDate).getFullYear()}
                                    </span>
                                )}
                            </div>

                            {game.description && (
                                <p className="text-text-muted text-sm leading-relaxed line-clamp-2 mb-4 opacity-80 group-hover:opacity-100 transition-opacity">
                                    {game.description}
                                </p>
                            )}

                            {/* Roles section */}
                            <div className="space-y-1.5">
                                {(game.roles || []).length > 0 ? (
                                    <>
                                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                                            <Users className="w-3 h-3" /> In-game Roles
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {(game.roles || []).slice(0, 8).map((role, index) => (
                                                <span
                                                    key={role}
                                                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-white/5 to-white/10 border border-white/20 text-xs text-white font-semibold hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 shadow-lg backdrop-blur-sm"
                                                    style={{ animationDelay: `${index * 50}ms` }}
                                                >
                                                    {role}
                                                </span>
                                            ))}
                                            {(game.roles || []).length > 8 && (
                                                <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary/20 to-primary/30 border border-primary/50 text-xs text-primary font-bold shadow-lg shadow-primary/20">
                                                    +{(game.roles || []).length - 8} more
                                                </span>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-[11px] text-white/20 italic">No roles defined</p>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 shrink-0">
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                                className="group/btn p-3 bg-gradient-to-br from-white/10 to-white/5 hover:from-primary hover:to-primary/80 rounded-xl text-white hover:text-black transition-all duration-300 shadow-xl border border-white/20 hover:border-primary hover:scale-110 backdrop-blur-sm"
                                title="Edit Game"
                            >
                                <Edit className="w-4 h-4 transition-transform group-hover/btn:rotate-12" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                className="group/btn p-3 bg-gradient-to-br from-white/10 to-white/5 hover:from-red-500 hover:to-red-600 rounded-xl text-red-400 hover:text-white transition-all duration-300 shadow-xl border border-white/20 hover:border-red-500 hover:scale-110 backdrop-blur-sm"
                                title="Delete Game"
                            >
                                <Trash2 className="w-4 h-4 transition-transform group-hover/btn:rotate-12" />
                            </button>
                        </div>
                    </div>

                    {/* Footer Stats */}
                    <div className="pt-4 border-t border-white/10 flex items-center gap-6 relative z-10" style={{
                        background: 'linear-gradient(90deg, rgba(0, 255, 157, 0.05) 0%, transparent 100%)'
                    }}>
                        <div className="flex items-center gap-3 group/stat">
                            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30 group-hover/stat:bg-primary/20 transition-colors">
                                <Trophy className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <span className="text-white font-black text-lg">{game.activeTournaments || 0}</span>
                                <span className="text-text-muted text-sm ml-2">Active Tournaments</span>
                            </div>
                        </div>
                        {game.isPartner && (
                            <div className="flex items-center gap-1.5 text-xs text-yellow-400 font-bold">
                                <Star className="w-3.5 h-3.5 fill-yellow-400" />
                                Official Partner
                            </div>
                        )}
                        <div className="ml-auto text-[10px] text-white/20 font-mono">{game._id.slice(-8)}</div>
                    </div>
                </div>

                {/* Animated glow effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{
                }} />
            </div>
        </div>
    );
}

function DeleteConfirmationModal({
    isOpen,
    game,
    onConfirm,
    onCancel
}: {
    isOpen: boolean;
    game: Game | null;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    if (!isOpen || !game) return null;

    return (
        <Modal isOpen={isOpen} onClose={onCancel} size="sm">
            <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Delete Game</h3>
                        <p className="text-sm text-text-muted">This action cannot be undone</p>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
                    <p className="text-sm text-text-muted mb-2">You are about to delete:</p>
                    <p className="text-white font-bold text-lg">{game.title}</p>
                    <p className="text-xs text-text-muted uppercase tracking-wider mt-1">{game.genre}</p>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                    >
                        Delete Game
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
