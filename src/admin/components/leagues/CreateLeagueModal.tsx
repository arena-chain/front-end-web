import React, { useState, useEffect } from 'react';
import { Button, Input, Modal, Select } from '../../../components/ui/core';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Plus, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { leagueService, LeagueLevel, LeagueFormat, LeagueStatus, type League } from '../../../services/leagueService';
import { default as catalogService } from '../../../services/catalogService';
import type { Game } from '../../../models/game';

interface CreateLeagueModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    league?: League;
}

const CreateLeagueModal: React.FC<CreateLeagueModalProps> = ({ isOpen, onClose, onSubmit, league }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Enums for dropdowns
    const [continents, setContinents] = useState<string[]>([]);
    const [countries, setCountries] = useState<string[]>([]);
    const [loadingEnums, setLoadingEnums] = useState(false);

    const [games, setGames] = useState<Game[]>([]);
    const [loadingGames, setLoadingGames] = useState(false);

    interface LeagueFormData {
        name: string;
        gameId: string;
        level: LeagueLevel;
        format: LeagueFormat;
        regionId: string;
        startDate: string;
        endDate: string;
        maxTeams: number;
        status: LeagueStatus;
        rewards: { rank: number; prize: string; points: number }[];
    }

    const [formData, setFormData] = useState<LeagueFormData>({
        name: '',
        gameId: 'super_striker_01',
        level: LeagueLevel.INTERNATIONAL,
        format: LeagueFormat.GROUPS,
        regionId: 'Global', // Default for International
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        maxTeams: 16,
        status: LeagueStatus.REGISTRATION,
        rewards: [
            { rank: 1, prize: '', points: 0 }
        ]
    });

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const fetchEnums = async () => {
            setLoadingEnums(true);
            try {
                const data = await leagueService.getRegionEnums();
                setContinents(data.continents);
                setCountries(data.countries);
            } catch (error) {
                console.error("Failed to load region enums", error);
            } finally {
                setLoadingEnums(false);
            }
        };

        if (isOpen) {
            fetchEnums();
        }
    }, [isOpen]);

    useEffect(() => {
        const fetchGames = async () => {
            setLoadingGames(true);
            try {
                const data = await catalogService.fetchGames();
                setGames(data);
            } catch (error) {
                console.error("Failed to load games", error);
            } finally {
                setLoadingGames(false);
            }
        };

        if (isOpen) {
            fetchGames();
        }
    }, [isOpen]);

    useEffect(() => {
        if (league) {
            setFormData({
                name: league.name || '',
                gameId: league.gameId || 'super_striker_01',
                level: league.level || LeagueLevel.INTERNATIONAL,
                format: league.format || LeagueFormat.GROUPS,
                regionId: league.regionId || 'Global',
                startDate: league.startDate ? new Date(league.startDate).toISOString().split('T')[0] : today,
                endDate: league.endDate ? new Date(league.endDate).toISOString().split('T')[0] : today,
                maxTeams: league.maxTeams || 16,
                status: league.status || LeagueStatus.REGISTRATION,
                rewards: league.rewards || [{ rank: 1, prize: '', points: 0 }]
            });
        } else {
            setFormData({
                name: '',
                gameId: 'super_striker_01',
                level: LeagueLevel.INTERNATIONAL,
                format: LeagueFormat.GROUPS,
                regionId: 'Global',
                startDate: today,
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                maxTeams: 16,
                status: LeagueStatus.REGISTRATION,
                rewards: [{ rank: 1, prize: '', points: 0 }]
            });
        }
        setErrors({});
        setCurrentStep(1);
    }, [league, isOpen, today]);

    // Effect to reset regionId when level changes
    useEffect(() => {
        // Only reset if it's a manual change, not initial load (handled above)
        // We can check if isOpen is true and we are interacting.
        // For simplicity, we can just enforce the rule if the current regionId is invalid for the new level.
        if (!isOpen) return;

        if (formData.level === LeagueLevel.INTERNATIONAL) {
            if (formData.regionId !== 'Global') updateField('regionId', 'Global');
        } else if (formData.level === LeagueLevel.CONTINENTAL) {
            // If current region is not in continents, reset to first continent or empty
            if (!continents.includes(formData.regionId)) {
                updateField('regionId', continents[0] || '');
            }
        } else if (formData.level === LeagueLevel.NATIONAL) {
            // If current region is not in countries, reset
            if (!countries.includes(formData.regionId)) {
                updateField('regionId', countries[0] || '');
            }
        } else {
            // Regional - free text, no reset needed typically unless empty
        }
    }, [formData.level, continents, countries]);


    const totalSteps = 3;

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrs = { ...prev };
                delete newErrs[field];
                return newErrs;
            });
        }
    };

    const updateReward = (index: number, field: string, value: any) => {
        const newRewards = [...formData.rewards];
        newRewards[index] = { ...newRewards[index], [field]: value };
        updateField('rewards', newRewards);
    };

    const addReward = () => {
        updateField('rewards', [...formData.rewards, { rank: formData.rewards.length + 1, prize: '', points: 0 }]);
    };

    const removeReward = (index: number) => {
        const newRewards = formData.rewards.filter((_, i) => i !== index);
        updateField('rewards', newRewards);
    };

    const handleNext = () => {
        const stepErrors: Record<string, string> = {};

        if (currentStep === 1) {
            if (!formData.name.trim()) stepErrors.name = 'Le nom est obligatoire';
            else if (formData.name.length < 3) stepErrors.name = 'Le nom doit faire au moins 3 caractères';

            if (!formData.gameId.trim()) stepErrors.gameId = 'L\'ID du jeu est obligatoire';

            // Region validation
            if (formData.level === LeagueLevel.CONTINENTAL && !formData.regionId) {
                stepErrors.regionId = 'Veuillez sélectionner un continent';
            }
            if (formData.level === LeagueLevel.NATIONAL && !formData.regionId) {
                stepErrors.regionId = 'Veuillez sélectionner un pays';
            }
            if (formData.level === LeagueLevel.REGIONAL && !formData.regionId.trim()) {
                stepErrors.regionId = 'Veuillez entrer une région';
            }
        }
        else if (currentStep === 2) {
            if (!formData.startDate) stepErrors.startDate = 'La date de début est obligatoire';
            if (!formData.endDate) stepErrors.endDate = 'La date de fin est obligatoire';

            if (formData.startDate && formData.endDate) {
                if (new Date(formData.endDate) <= new Date(formData.startDate)) {
                    stepErrors.endDate = 'La date de fin doit être après la date de début';
                }
            }

            if (formData.maxTeams < 2) stepErrors.maxTeams = 'Il faut au moins 2 équipes';
        }

        if (Object.keys(stepErrors).length > 0) {
            setErrors(stepErrors);
            return;
        }

        setErrors({});
        if (currentStep < totalSteps) setCurrentStep(prev => prev + 1);
    };

    const handlePrevious = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setErrors({});
        try {
            await onSubmit(formData);
            onClose();
        } catch (error: any) {
            console.error('Error saving league:', error);
            if (error.message && Array.isArray(error.message)) {
                error.message.forEach((msg: string) => toast.error(msg));
                const backendErrs: Record<string, string> = {};
                // Simple mapping attempt, might need refinement based on exact backend error keys
                setErrors(backendErrs);
            } else if (error.message) {
                toast.error(error.message);
            } else {
                toast.error('Une erreur est survenue lors de la sauvegarde');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderLevelSpecificRegion = () => {
        if (loadingEnums) return <p className="text-xs text-text-muted"><Loader2 className="animate-spin w-3 h-3 inline" /> Loading regions...</p>;

        switch (formData.level) {
            case LeagueLevel.INTERNATIONAL:
                return (
                    <Input
                        value="Global"
                        disabled
                        className="bg-white/5 text-text-muted cursor-not-allowed"
                        title="International leagues are always Global"
                    />
                );
            case LeagueLevel.CONTINENTAL:
                return (
                    <Select
                        value={formData.regionId}
                        onChange={(e) => updateField('regionId', e.target.value)}
                        className={errors.regionId ? 'border-red-500' : ''}
                    >
                        <option value="">Select Continent</option>
                        {continents.map(c => <option key={c} value={c}>{c}</option>)}
                    </Select>
                );
            case LeagueLevel.NATIONAL:
                return (
                    <Select
                        value={formData.regionId}
                        onChange={(e) => updateField('regionId', e.target.value)}
                        className={errors.regionId ? 'border-red-500' : ''}
                    >
                        <option value="">Select Country</option>
                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </Select>
                );
            case LeagueLevel.REGIONAL:
                return (
                    <Input
                        placeholder="e.g. Ile-de-France, California..."
                        value={formData.regionId}
                        onChange={(e) => updateField('regionId', e.target.value)}
                        className={errors.regionId ? 'border-red-500' : ''}
                    />
                );
            default:
                return null;
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Basic Settings</h3>
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2">League Name</label>
                            <Input
                                placeholder="e.g. African Champions Cup"
                                value={formData.name}
                                onChange={(e) => updateField('name', e.target.value)}
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase flex items-center gap-1"><AlertCircle size={10} /> {errors.name}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2">Game</label>
                                {loadingGames ? (
                                    <div className="flex items-center gap-2 text-xs text-text-muted">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Loading games...
                                    </div>
                                ) : (
                                    <Select
                                        value={formData.gameId}
                                        onChange={(e) => updateField('gameId', e.target.value)}
                                        className={errors.gameId ? 'border-red-500' : ''}
                                    >
                                        <option value="">Select a Game</option>
                                        {games.map((game: any) => (
                                            <option key={game._id} value={game._id}>
                                                {game.title}
                                            </option>
                                        ))}
                                    </Select>
                                )}
                                {errors.gameId && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase flex items-center gap-1"><AlertCircle size={10} /> {errors.gameId}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2">League Level</label>
                                <Select value={formData.level} onChange={(e) => updateField('level', e.target.value)} className={errors.level ? 'border-red-500' : ''}>
                                    {Object.values(LeagueLevel).map((lvl) => (
                                        <option key={lvl} value={lvl}>{lvl}</option>
                                    ))}
                                </Select>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2">Region</label>
                                {renderLevelSpecificRegion()}
                                {errors.regionId && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase flex items-center gap-1"><AlertCircle size={10} /> {errors.regionId}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2">Format</label>
                                <Select value={formData.format} onChange={(e) => updateField('format', e.target.value)} className={errors.format ? 'border-red-500' : ''}>
                                    {Object.values(LeagueFormat).map((fmt) => (
                                        <option key={fmt} value={fmt}>{fmt.replace('_', ' ')}</option>
                                    ))}
                                </Select>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2">Status</label>
                                <Select value={formData.status} onChange={(e) => updateField('status', e.target.value)}>
                                    {Object.values(LeagueStatus).map((st) => (
                                        <option key={st} value={st}>{st}</option>
                                    ))}
                                </Select>
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Duration & Capacity</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2">Start Date</label>
                                <Input
                                    type="date"
                                    min={today}
                                    value={formData.startDate}
                                    onChange={(e) => updateField('startDate', e.target.value)}
                                    className={errors.startDate ? 'border-red-500' : ''}
                                />
                                {errors.startDate && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase flex items-center gap-1"><AlertCircle size={10} /> {errors.startDate}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2">End Date</label>
                                <Input
                                    type="date"
                                    min={formData.startDate || today}
                                    value={formData.endDate}
                                    onChange={(e) => updateField('endDate', e.target.value)}
                                    className={errors.endDate ? 'border-red-500' : ''}
                                />
                                {errors.endDate && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase flex items-center gap-1"><AlertCircle size={10} /> {errors.endDate}</p>}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2">Max Teams</label>
                            <Input
                                type="number"
                                value={formData.maxTeams}
                                onChange={(e) => updateField('maxTeams', parseInt(e.target.value))}
                                className={errors.maxTeams ? 'border-red-500' : ''}
                            />
                            {errors.maxTeams && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase flex items-center gap-1"><AlertCircle size={10} /> {errors.maxTeams}</p>}
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">Rewards</h3>
                            <Button size="sm" variant="outline" onClick={addReward} className="gap-2">
                                <Plus size={14} /> Add Rank
                            </Button>
                        </div>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                            {formData.rewards.map((reward, index) => (
                                <div key={index} className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3 relative group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12">
                                            <label className="text-[10px] font-black uppercase text-text-muted">Rank</label>
                                            <Input
                                                type="number"
                                                value={reward.rank}
                                                onChange={(e) => updateReward(index, 'rank', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] font-black uppercase text-text-muted">Prize Description</label>
                                            <Input
                                                placeholder="e.g. Gold Medal"
                                                value={reward.prize}
                                                onChange={(e) => updateReward(index, 'prize', e.target.value)}
                                            />
                                        </div>
                                        <div className="w-24">
                                            <label className="text-[10px] font-black uppercase text-text-muted">Points</label>
                                            <Input
                                                type="number"
                                                value={reward.points}
                                                onChange={(e) => updateReward(index, 'points', parseInt(e.target.value))}
                                            />
                                        </div>
                                        {formData.rewards.length > 1 && (
                                            <button onClick={() => removeReward(index)} className="mt-4 text-red-500 hover:text-red-400 p-2">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" title={league ? "Edit League" : "Create League"}>
            <div className="p-6">
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        {[1, 2, 3].map((step) => (
                            <div
                                key={step}
                                className={`flex-1 h-1 ${step <= currentStep ? 'bg-primary' : 'bg-white/10'} ${step !== 3 ? 'mr-2' : ''}`}
                            />
                        ))}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                        Step {currentStep} of {totalSteps}
                    </p>
                </div>

                <div className="min-h-[350px]">
                    {renderStep()}
                </div>

                <div className="flex justify-between mt-8 pt-6 border-t border-white/5">
                    <Button variant="ghost" onClick={handlePrevious} disabled={currentStep === 1} className="gap-2">
                        <ChevronLeft size={16} /> Previous
                    </Button>
                    <div className="flex gap-3">
                        {currentStep < totalSteps ? (
                            <Button onClick={handleNext} className="gap-2">
                                Next <ChevronRight size={16} />
                            </Button>
                        ) : (
                            <Button onClick={handleSubmit} isLoading={isSubmitting}>
                                {league ? "Save Changes" : "Create League"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default CreateLeagueModal;
