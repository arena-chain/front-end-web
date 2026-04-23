import React, { useState, useEffect } from 'react';
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

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-xl bg-[#141419] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div className="w-8" /> {/* Spacer */}
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Create a Tournament</h2>
                    <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 space-y-8 overflow-y-auto max-h-[80vh]">
                    {/* Organizer */}
                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">Organizer</label>
                        <div className="flex items-center gap-4 bg-white/[0.03] p-4 rounded-xl border border-white/5">
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
                            <button className="text-[10px] font-black text-[#00ff88] uppercase tracking-widest hover:underline">CHANGE</button>
                        </div>
                        {errors.organizer && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{errors.organizer}</p>}
                    </div>

                    {/* Tournament Name */}
                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">Tournament Name</label>
                        <Input
                            placeholder="Enter tournament name..."
                            value={formData.name}
                            onChange={e => {
                                setFormData({ ...formData, name: e.target.value });
                                if (errors.name) setErrors({ ...errors, name: '' });
                            }}
                            className={cn(
                                "h-12 bg-white/[0.03] border-white/5 rounded-xl text-white font-bold",
                                errors.name && "border-red-500/50 focus:border-red-500"
                            )}
                        />
                        {errors.name && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{errors.name}</p>}
                    </div>

                    {/* Game */}
                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">Game</label>
                        <div className="relative">
                            {gamesLoading && (
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                                    <Loader2 size={16} className="animate-spin" />
                                </div>
                            )}
                            <select
                                className={cn(
                                    "w-full h-12 bg-white/[0.03] border border-white/5 rounded-xl px-4 text-sm font-bold text-white outline-none focus:border-[#00ff88]/50 appearance-none",
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
                        <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">Region</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                                <Globe size={16} />
                            </div>
                            <select
                                className="w-full h-12 bg-white/[0.03] border border-white/5 rounded-xl pl-12 pr-4 text-sm font-bold text-white outline-none focus:border-[#00ff88]/50 appearance-none"
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
                        <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">Game Mode</label>
                        <div className="grid grid-cols-5 gap-2">
                            {GAME_MODES.map(mode => (
                                <button
                                    key={mode.value}
                                    onClick={() => setFormData({ ...formData, gameMode: mode.value })}
                                    className={cn(
                                        "h-12 rounded-xl flex items-center justify-center text-[10px] font-black uppercase transition-all",
                                        formData.gameMode === mode.value
                                            ? "bg-[#00ff88] text-black shadow-[0_0_15px_rgba(0,255,136,0.3)]"
                                            : "bg-white/[0.03] text-white/40 border border-white/5 hover:border-white/10"
                                    )}
                                >
                                    {mode.label.split(' ')[0]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tournament Format */}
                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">Tournament Format</label>
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex gap-4">
                            <Info size={16} className="text-white/20 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-white/30 font-bold leading-relaxed uppercase tracking-widest">
                                An elimination tournament where the loser of each match is immediately eliminated from winning the tournament.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 flex items-center justify-center gap-8">
                    <button
                        onClick={onClose}
                        className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] hover:text-white transition-colors"
                    >
                        CANCEL
                    </button>
                    <Button
                        onClick={handleCreate}
                        className={cn(
                            "h-12 px-10 font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300",
                            (formData.name && formData.gameId && selectedOrganizer)
                                ? "bg-[#00ff88] text-black shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:scale-105 active:scale-95"
                                : "bg-white/5 border border-white/10 text-white/20 cursor-not-allowed"
                        )}
                    >
                        CREATE TOURNAMENT
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PlayerCreateTournamentModal;
