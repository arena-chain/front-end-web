import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Globe, User, ChevronDown, Info, Loader2 } from 'lucide-react';
import { Button, Input } from '../../components/ui/core';
import catalogService from '../../services/catalogService';
import organizerService from '../../services/organizerService';
import type { Game } from '../../models/game';
import type { Organizer } from '../../models/tournament';
import { TournamentFormat, TournamentRegion, GameMode } from '../../models/tournament';
import { cn } from '../../lib/utils';

interface PlayerCreateTournamentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
}

const GAME_MODES = [
    { value: GameMode.SOLO, label: '1vs1 (SOLO)' },
    { value: GameMode.DUO, label: '2vs2 (DUO)' },
    { value: GameMode.SQUAD_3, label: '3vs3 (TRIO)', fallback: '3v3' },
    { value: GameMode.SQUAD_4, label: '4vs4 (SQUAD)', fallback: '4v4' },
    { value: GameMode.SQUAD_5, label: '5vs5 (PRO)' },
];

const PlayerCreateTournamentModal: React.FC<PlayerCreateTournamentModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [games, setGames] = useState<Game[]>([]);
    const [gamesLoading, setGamesLoading] = useState(false);
    const [gamesError, setGamesError] = useState<string | null>(null);
    const [, setOrganizers] = useState<Organizer[]>([]);
    const [selectedOrganizer, setSelectedOrganizer] = useState<Organizer | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        gameId: '',
        region: TournamentRegion.GLOBAL as TournamentRegion,
        gameMode: GameMode.SQUAD_5 as GameMode,
        format: TournamentFormat.SINGLE_ELIMINATION as TournamentFormat,
        startDate: new Date().toISOString().split('T')[0],
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            setGamesLoading(true);
            setGamesError(null);
            catalogService.fetchGames()
                .then(data => {
                    setGames(data);
                })
                .catch(err => {
                    console.error('Failed to fetch catalog games:', err);
                    setGamesError('Failed to load games. Please try again.');
                })
                .finally(() => setGamesLoading(false));

            organizerService.fetchOrganizers().then(data => {
                setOrganizers(data);
                if (data.length > 0) setSelectedOrganizer(data[0]);
            });
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleCreate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name) newErrors.name = 'Tournament name is required.';
        if (!formData.gameId) newErrors.gameId = 'Please select a game from the list.';
        if (!selectedOrganizer) newErrors.organizer = 'No organizer profile found.';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const startDate = new Date(formData.startDate);
        const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // Default +7 days

        onSubmit({
            name: formData.name,
            gameId: formData.gameId,
            organizerId: selectedOrganizer?._id,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            maxTeams: 16,
            format: formData.format,
            type: 'OFFICIAL',
            rules: {
                region: formData.region,
                gameMode: formData.gameMode,
            }
        });
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-2xl max-h-[92vh] bg-[#11131a]/95 border border-white/12 rounded-3xl overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.65)] flex flex-col backdrop-blur-2xl">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(0,255,136,0.12),transparent_35%),radial-gradient(circle_at_8%_100%,rgba(147,51,234,0.08),transparent_36%)]" />
                {/* Header */}
                <div className="relative sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-[#11131a]/90 backdrop-blur-xl">
                    <div className="w-8" /> {/* Spacer */}
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Create Tournament</h2>
                    <button onClick={onClose} className="text-white/40 hover:text-white transition-colors rounded-lg border border-white/10 p-1.5 hover:border-white/20">
                        <X size={24} />
                    </button>
                </div>

                <div className="relative flex-1 min-h-0 p-8 space-y-6 overflow-y-auto scrollbar-hide">
                    {/* Organizer */}
                    <div className="space-y-3">
                        <label className="block text-[11px] font-black text-white/45 uppercase tracking-widest">Organizer</label>
                        <div className="flex items-center gap-4 bg-black/30 p-4 rounded-xl border border-white/10">
                            <div className="w-10 h-10 rounded-lg bg-white/5 overflow-hidden flex items-center justify-center border border-white/10">
                                {selectedOrganizer?.avatarUrl ? (
                                    <img src={selectedOrganizer.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={20} className="text-white/20" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-white tracking-tight">{selectedOrganizer?.username || 'Select Organizer'}</p>
                            </div>
                            <button className="text-[11px] font-black text-primary uppercase tracking-widest hover:underline">CHANGE</button>
                        </div>
                        {errors.organizer && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{errors.organizer}</p>}
                    </div>

                    {/* Tournament Name */}
                    <div className="space-y-3">
                        <label className="block text-[11px] font-black text-white/45 uppercase tracking-widest">Tournament Name</label>
                        <Input
                            placeholder="Enter tournament name..."
                            value={formData.name}
                            onChange={e => {
                                setFormData({ ...formData, name: e.target.value });
                                if (errors.name) setErrors({ ...errors, name: '' });
                            }}
                            className={cn(
                                "h-12 bg-black/30 border-white/10 rounded-xl text-white text-sm font-semibold",
                                errors.name && "border-red-500/50 focus:border-red-500"
                            )}
                        />
                        {errors.name && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{errors.name}</p>}
                    </div>

                    {/* Game */}
                    <div className="space-y-3">
                        <label className="block text-[11px] font-black text-white/45 uppercase tracking-widest">Game</label>
                        <div className="relative">
                            {gamesLoading && (
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                                    <Loader2 size={16} className="animate-spin" />
                                </div>
                            )}
                            <select
                                className={cn(
                                    "w-full h-12 bg-black/30 border border-white/10 rounded-xl px-4 text-sm font-semibold text-white outline-none focus:border-primary/50 appearance-none",
                                    errors.gameId && "border-red-500/50",
                                    gamesLoading && "pl-10 opacity-60"
                                )}
                                value={formData.gameId}
                                disabled={gamesLoading}
                                onChange={e => {
                                    setFormData({ ...formData, gameId: e.target.value });
                                    if (errors.gameId) setErrors({ ...errors, gameId: '' });
                                }}
                            >
                                <option value="" disabled className="bg-[#141419]">
                                    {gamesLoading ? 'Loading games...' : games.length === 0 ? 'No games available' : 'Select a game...'}
                                </option>
                                {games.map(g => (
                                    <option key={g._id} value={g._id} className="bg-[#141419]">{g.title}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
                        </div>
                        {gamesError && <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">{gamesError}</p>}
                        {errors.gameId && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{errors.gameId}</p>}
                    </div>

                    {/* Region */}
                    <div className="space-y-3">
                        <label className="block text-[11px] font-black text-white/45 uppercase tracking-widest">Region</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                                <Globe size={16} />
                            </div>
                            <select
                                className="w-full h-12 bg-black/30 border border-white/10 rounded-xl pl-12 pr-4 text-sm font-semibold text-white outline-none focus:border-primary/50 appearance-none"
                                value={formData.region}
                                onChange={e => setFormData({ ...formData, region: e.target.value as TournamentRegion })}
                            >
                                {Object.values(TournamentRegion).map(r => (
                                    <option key={r} value={r} className="bg-[#141419]">{r}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
                        </div>
                    </div>

                    {/* Game Mode Selector (1vs1 to 5vs5) */}
                    <div className="space-y-3">
                        <label className="block text-[11px] font-black text-white/45 uppercase tracking-widest">Game Mode</label>
                        <div className="grid grid-cols-5 gap-2">
                            {GAME_MODES.map(mode => (
                                <button
                                    key={mode.value}
                                    onClick={() => setFormData({ ...formData, gameMode: mode.value })}
                                    className={cn(
                                        "h-11 rounded-xl flex items-center justify-center text-[11px] font-black uppercase transition-all",
                                        formData.gameMode === mode.value
                                            ? "bg-primary text-black shadow-[0_0_15px_rgba(0,255,136,0.3)]"
                                            : "bg-black/30 text-white/40 border border-white/10 hover:border-white/20"
                                    )}
                                >
                                    {mode.label.split(' ')[0]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tournament Format */}
                    <div className="space-y-3">
                        <label className="block text-[11px] font-black text-white/45 uppercase tracking-widest">Tournament Format</label>
                        <div className="bg-black/30 border border-white/10 rounded-xl p-4 flex gap-4">
                            <Info size={16} className="text-white/20 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-white/35 font-semibold leading-relaxed uppercase tracking-wide">
                                An elimination tournament where the loser of each match is immediately eliminated from winning the tournament.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative sticky bottom-0 z-10 p-5 border-t border-white/10 bg-[#11131a]/92 backdrop-blur-xl flex items-center justify-center gap-6">
                    <button
                        onClick={onClose}
                        className="text-[11px] font-black text-white/45 uppercase tracking-[0.18em] hover:text-white transition-colors"
                    >
                        CANCEL
                    </button>
                    <Button
                        onClick={handleCreate}
                        className={cn(
                            "h-11 px-8 font-black uppercase tracking-[0.16em] rounded-xl transition-all duration-300",
                            (formData.name && formData.gameId && selectedOrganizer)
                                ? "bg-primary text-black shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:scale-105 active:scale-95"
                                : "bg-white/5 border border-white/10 text-white/20 cursor-not-allowed"
                        )}
                    >
                        CREATE TOURNAMENT
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PlayerCreateTournamentModal;
