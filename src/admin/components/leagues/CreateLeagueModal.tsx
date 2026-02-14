import React, { useState } from 'react';
import { Button, Input, Modal, Select } from '../../../components/ui/core';
import { ChevronLeft, ChevronRight, Plus, Trash2, AlertCircle } from 'lucide-react';
import type { League } from '../../../services/leagueService';

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
    const [formData, setFormData] = useState({
        name: '',
        gameId: 'super_striker_01',
        tier: 'OFFICIAL',
        mode: 'SOLO',
        regionFilter: 'GLOBAL',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        maxParticipants: 100,
        minElo: 0,
        rewards: [
            { rank: 1, prize: '', points: 0 }
        ]
    });

    const today = new Date().toISOString().split('T')[0];

    React.useEffect(() => {
        if (league) {
            setFormData({
                name: league.name || '',
                gameId: league.gameId || 'super_striker_01',
                tier: league.tier || 'OFFICIAL',
                mode: league.mode || 'SOLO',
                regionFilter: league.regionFilter || 'GLOBAL',
                startDate: league.startDate ? new Date(league.startDate).toISOString().split('T')[0] : today,
                endDate: league.endDate ? new Date(league.endDate).toISOString().split('T')[0] : today,
                maxParticipants: league.maxParticipants || 100,
                minElo: league.minElo || 0,
                rewards: league.rewards || [{ rank: 1, prize: '', points: 0 }]
            });
        } else {
            setFormData({
                name: '',
                gameId: 'super_striker_01',
                tier: 'OFFICIAL',
                mode: 'SOLO',
                regionFilter: 'GLOBAL',
                startDate: today,
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                maxParticipants: 100,
                minElo: 0,
                rewards: [{ rank: 1, prize: '', points: 0 }]
            });
        }
        setErrors({});
        setCurrentStep(1);
    }, [league, isOpen, today]);

    const totalSteps = 3;

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when field changes
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

            if (formData.minElo < 0) stepErrors.minElo = 'L\'ELO ne peut pas être négatif';
        }
        else if (currentStep === 2) {
            if (!formData.startDate) stepErrors.startDate = 'La date de début est obligatoire';
            if (!formData.endDate) stepErrors.endDate = 'La date de fin est obligatoire';

            if (formData.startDate && formData.endDate) {
                if (new Date(formData.endDate) <= new Date(formData.startDate)) {
                    stepErrors.endDate = 'La date de fin doit être après la date de début';
                }
            }

            if (formData.maxParticipants < 2) stepErrors.maxParticipants = 'Il faut au moins 2 participants';
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
                const backendErrs: Record<string, string> = {};
                error.message.forEach((msg: string) => {
                    const fields = ['name', 'gameId', 'tier', 'mode', 'regionFilter', 'minElo', 'maxParticipants', 'startDate', 'endDate'];
                    const field = fields.find(f => msg.toLowerCase().includes(f.toLowerCase()));
                    if (field) backendErrs[field] = msg;
                });
                setErrors(backendErrs);
                // Switch to first step if there are errors there
                if (backendErrs.name || backendErrs.gameId || backendErrs.tier || backendErrs.mode || backendErrs.minElo) {
                    setCurrentStep(1);
                } else if (backendErrs.startDate || backendErrs.endDate || backendErrs.maxParticipants) {
                    setCurrentStep(2);
                }
            } else if (error.message) {
                alert('Erreur: ' + error.message);
            }
        } finally {
            setIsSubmitting(false);
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
                                placeholder="e.g. Winter Season 2026"
                                value={formData.name}
                                onChange={(e) => updateField('name', e.target.value)}
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase flex items-center gap-1"><AlertCircle size={10} /> {errors.name}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2">Tier</label>
                                <Select value={formData.tier} onChange={(e) => updateField('tier', e.target.value)} className={errors.tier ? 'border-red-500' : ''}>
                                    <option value="OFFICIAL">Official</option>
                                    <option value="PREMIUM">Premium</option>
                                    <option value="COMMUNITY">Community</option>
                                </Select>
                                {errors.tier && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase flex items-center gap-1"><AlertCircle size={10} /> {errors.tier}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2">Mode</label>
                                <Select value={formData.mode} onChange={(e) => updateField('mode', e.target.value)} className={errors.mode ? 'border-red-500' : ''}>
                                    <option value="SOLO">Solo</option>
                                    <option value="TEAM">Team</option>
                                </Select>
                                {errors.mode && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase flex items-center gap-1"><AlertCircle size={10} /> {errors.mode}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2">Region Filter</label>
                                <Select value={formData.regionFilter} onChange={(e) => updateField('regionFilter', e.target.value)} className={errors.regionFilter ? 'border-red-500' : ''}>
                                    <option value="GLOBAL">Global</option>
                                    <option value="EUROPE">Europe</option>
                                    <option value="AFRICA">Afrique</option>
                                    <option value="ASIA">Asie</option>
                                    <option value="AMERICAS">Amériques</option>
                                    <option value="OCEANIA">Océanie</option>
                                </Select>
                                {errors.regionFilter && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase flex items-center gap-1"><AlertCircle size={10} /> {errors.regionFilter}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2">Min ELO</label>
                                <Input
                                    type="number"
                                    value={formData.minElo}
                                    onChange={(e) => updateField('minElo', parseInt(e.target.value))}
                                    className={errors.minElo ? 'border-red-500' : ''}
                                />
                                {errors.minElo && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase flex items-center gap-1"><AlertCircle size={10} /> {errors.minElo}</p>}
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
                                    onFocus={(e) => (e.target as any).showPicker?.()}
                                    onClick={(e) => (e.target as any).showPicker?.()}
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
                                    onFocus={(e) => (e.target as any).showPicker?.()}
                                    onClick={(e) => (e.target as any).showPicker?.()}
                                />
                                {errors.endDate && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase flex items-center gap-1"><AlertCircle size={10} /> {errors.endDate}</p>}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2">Max Participants</label>
                            <Input
                                type="number"
                                value={formData.maxParticipants}
                                onChange={(e) => updateField('maxParticipants', parseInt(e.target.value))}
                                className={errors.maxParticipants ? 'border-red-500' : ''}
                            />
                            {errors.maxParticipants && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase flex items-center gap-1"><AlertCircle size={10} /> {errors.maxParticipants}</p>}
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
        <Modal isOpen={isOpen} onClose={onClose} size="lg" title={league ? "Edit Official League" : "Create Official League"}>
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
