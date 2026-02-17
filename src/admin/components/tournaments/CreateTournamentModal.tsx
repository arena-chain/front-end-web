import React, { useState, useEffect } from 'react';
import React, { useState } from 'react';
import type { CreateTournamentDto } from '../../../models/tournament';
import { TournamentFormat } from '../../../models/tournament';
import { Button, Input, Textarea, Select, Modal } from '../../../components/ui/core';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import catalogService from '../../../services/catalogService'; // Import catalogService
import type { Game } from '../../../models/game'; // Import Game interface

interface CreateTournamentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateTournamentDto) => Promise<void>;
}

const CreateTournamentModal: React.FC<CreateTournamentModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [games, setGames] = useState<Game[]>([]); // State to store fetched games
    const [bannerFile, setBannerFile] = useState<File | null>(null); // State for banner file upload
    const [formData, setFormData] = useState<Partial<CreateTournamentDto>>({
        maxTeams: 16,
        format: TournamentFormat.SINGLE_ELIMINATION,
        registrationOpen: true,
    });

    const totalSteps = 5;


    // Fetch games when the modal opens
    useEffect(() => {
        if (isOpen) {
            const fetchGames = async () => {
                try {
                    const fetchedGames = await catalogService.fetchGames();
                    setGames(fetchedGames);
                } catch (error) {
                    console.error('Failed to fetch games for tournament creation:', error);
                }
            };
            fetchGames();
        }
    }, [isOpen]);

    const updateField = (field: keyof CreateTournamentDto, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        if (currentStep < totalSteps) setCurrentStep(prev => prev + 1);
    };

    const handlePrevious = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Prepare FormData if file is selected, otherwise use JSON
            let payload: CreateTournamentDto | FormData;

            if (bannerFile) {
                const formDataObj = new FormData();
                if (formData.name) formDataObj.append('name', formData.name);
                if (formData.description) formDataObj.append('description', formData.description);
                if (formData.gameId) formDataObj.append('gameId', formData.gameId);
                if (formData.organizerId) formDataObj.append('organizerId', formData.organizerId);
                if (formData.startDate) formDataObj.append('startDate', formData.startDate.toString()); // Ensure date string format matches backend expectation
                if (formData.endDate) formDataObj.append('endDate', formData.endDate.toString());
                if (formData.registrationStart) formDataObj.append('registrationStart', formData.registrationStart.toString());
                if (formData.registrationEnd) formDataObj.append('registrationEnd', formData.registrationEnd.toString());
                formDataObj.append('maxTeams', (formData.maxTeams || 16).toString());
                formDataObj.append('format', formData.format || TournamentFormat.SINGLE_ELIMINATION);
                formDataObj.append('prizePool', (formData.prizePool || 0).toString());
                formDataObj.append('firstPlace', (formData.firstPlace || 0).toString());
                formDataObj.append('secondPlace', (formData.secondPlace || 0).toString());
                formDataObj.append('thirdPlace', (formData.thirdPlace || 0).toString());
                formDataObj.append('registrationOpen', String(formData.registrationOpen ?? true));
                if (formData.streamUrl) formDataObj.append('streamUrl', formData.streamUrl);

                // Append file
                formDataObj.append('file', bannerFile); // Backend expects 'file'

                payload = formDataObj;
            } else {
                // Use JSON object as before
                const cleanData: any = {
                    name: formData.name,
                    gameId: formData.gameId,
                    organizerId: formData.organizerId,
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    maxTeams: formData.maxTeams || 16,
                    format: formData.format,
                    prizePool: formData.prizePool || 0,
                    firstPlace: formData.firstPlace || 0,
                    secondPlace: formData.secondPlace || 0,
                    thirdPlace: formData.thirdPlace || 0,
                    registrationOpen: formData.registrationOpen ?? true,
                };
            // Clean up and serialize the data properly
            const cleanData: any = {
                name: formData.name,
                gameId: formData.gameId,
                organizerId: formData.organizerId,
                startDate: formData.startDate,
                endDate: formData.endDate,
                maxTeams: formData.maxTeams || 16,
                format: formData.format,
                prizePool: formData.prizePool || 0,
                firstPlace: formData.firstPlace || 0,
                secondPlace: formData.secondPlace || 0,
                thirdPlace: formData.thirdPlace || 0,
                registrationOpen: formData.registrationOpen ?? true,
            };

            // Add optional fields only if they have values
            if (formData.description?.trim()) {
                cleanData.description = formData.description.trim();
            }
            if (formData.registrationStart) {
                cleanData.registrationStart = formData.registrationStart;
            }
            if (formData.registrationEnd) {
                cleanData.registrationEnd = formData.registrationEnd;
            }
            if (formData.bannerImageUrl?.trim()) {
                cleanData.bannerImageUrl = formData.bannerImageUrl.trim();
            }
            if (formData.streamUrl?.trim()) {
                cleanData.streamUrl = formData.streamUrl.trim();
            }

                payload = cleanData;
            }

            console.log('Submitting tournament data...');
            await onSubmit(payload as any); // Cast to any to bypass strict type check for now since onSubmit expects DTO
            console.log('Submitting tournament data:', cleanData);

            await onSubmit(cleanData as CreateTournamentDto);
            onClose();
            // Reset form
            setFormData({ maxTeams: 16, format: TournamentFormat.SINGLE_ELIMINATION, registrationOpen: true });
            setBannerFile(null);
            setCurrentStep(1);
        } catch (error) {
            console.error('Error creating tournament:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Basic Information</h3>
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-2">Tournament Name *</label>
                            <Input
                                placeholder="Enter tournament name"
                                value={formData.name || ''}
                                onChange={(e) => updateField('name', e.target.value)}
                            />
                        </div>
                        <div>
                            <Textarea
                                label="Description"
                                placeholder="Describe your tournament..."
                                value={formData.description || ''}
                                onChange={(e) => updateField('description', e.target.value)}
                                rows={4}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-2">Game *</label>
                            <Select
                            <Input
                                placeholder="Game ID"
                                value={formData.gameId || ''}
                                onChange={(e) => updateField('gameId', e.target.value)}
                            >
                                <option value="" disabled>Select a game</option>
                                {games.map((game) => (
                                    <option key={game._id} value={game._id}>
                                        {game.title}
                                    </option>
                                ))}
                            </Select>
                            <p className="text-xs text-text-muted mt-1">Select the game from the catalog</p>
                            />
                            <p className="text-xs text-text-muted mt-1">Enter the game database ID</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-2">Organizer ID *</label>
                            <Input
                                placeholder="Organizer ID"
                                value={formData.organizerId || ''}
                                onChange={(e) => updateField('organizerId', e.target.value)}
                            />
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Tournament Dates</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-2">Start Date *</label>
                                <Input
                                    type="date"
                                    value={formData.startDate && !isNaN(new Date(formData.startDate).getTime())
                                        ? new Date(formData.startDate).toISOString().split('T')[0]
                                        : ''}
                                    onChange={(e) => updateField('startDate', e.target.value ? new Date(e.target.value) : undefined)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-2">End Date *</label>
                                <Input
                                    type="date"
                                    value={formData.endDate && !isNaN(new Date(formData.endDate).getTime())
                                        ? new Date(formData.endDate).toISOString().split('T')[0]
                                        : ''}
                                    onChange={(e) => updateField('endDate', e.target.value ? new Date(e.target.value) : undefined)}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-2">Registration Start</label>
                                <Input
                                    type="date"
                                    value={formData.registrationStart && !isNaN(new Date(formData.registrationStart).getTime())
                                        ? new Date(formData.registrationStart).toISOString().split('T')[0]
                                        : ''}
                                    onChange={(e) => updateField('registrationStart', e.target.value ? new Date(e.target.value) : undefined)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-2">Registration End</label>
                                <Input
                                    type="date"
                                    value={formData.registrationEnd && !isNaN(new Date(formData.registrationEnd).getTime())
                                        ? new Date(formData.registrationEnd).toISOString().split('T')[0]
                                        : ''}
                                    onChange={(e) => updateField('registrationEnd', e.target.value ? new Date(e.target.value) : undefined)}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Teams & Format</h3>
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-2">Maximum Teams *</label>
                            <Input
                                type="number"
                                min="2"
                                placeholder="16"
                                value={formData.maxTeams || ''}
                                onChange={(e) => updateField('maxTeams', parseInt(e.target.value))}
                            />
                        </div>
                        <div>
                            <Select
                                label="Tournament Format *"
                                value={formData.format}
                                onChange={(e) => updateField('format', e.target.value as TournamentFormat)}
                            >
                                <option value={TournamentFormat.SINGLE_ELIMINATION}>Single Elimination</option>
                                <option value={TournamentFormat.DOUBLE_ELIMINATION}>Double Elimination</option>
                                <option value={TournamentFormat.SWISS}>Swiss</option>
                                <option value={TournamentFormat.ROUND_ROBIN}>Round Robin</option>
                            </Select>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Prize Pool</h3>
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-2">Total Prize Pool ($)</label>
                            <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={formData.prizePool || ''}
                                onChange={(e) => updateField('prizePool', parseFloat(e.target.value))}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-2">1st Place ($)</label>
                                <Input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={formData.firstPlace || ''}
                                    onChange={(e) => updateField('firstPlace', parseFloat(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-2">2nd Place ($)</label>
                                <Input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={formData.secondPlace || ''}
                                    onChange={(e) => updateField('secondPlace', parseFloat(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-2">3rd Place ($)</label>
                                <Input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={formData.thirdPlace || ''}
                                    onChange={(e) => updateField('thirdPlace', parseFloat(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Additional Settings</h3>
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-2">Banner Image</label>

                            <div className="border-2 border-dashed border-white/10 rounded-lg p-6 hover:border-primary/50 transition-colors text-center cursor-pointer relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setBannerFile(e.target.files[0]);
                                        }
                                    }}
                                />
                                {bannerFile ? (
                                    <div className="text-sm">
                                        <p className="text-primary font-bold mb-1">Selected File:</p>
                                        <p className="text-white truncate">{bannerFile.name}</p>
                                        <p className="text-text-muted text-xs mt-1">{(bannerFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                ) : (
                                    <div className="text-sm text-text-muted">
                                        <p className="mb-1">Drag & drop or click to upload</p>
                                        <p className="text-xs">Supports: JPG, PNG, WEBP</p>
                                    </div>
                                )}
                            </div>

                            {/* Fallback URL input (optional, kept for now or removed) */}
                            <div className="mt-4">
                                <p className="text-xs text-text-muted mb-2">Or provide a URL (optional)</p>
                                <Input
                                    placeholder="https://example.com/banner.jpg"
                                    value={formData.bannerImageUrl || ''}
                                    onChange={(e) => updateField('bannerImageUrl', e.target.value)}
                                    disabled={!!bannerFile}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-2">Stream URL</label>
                            <Input
                                placeholder="https://twitch.tv/channel"
                                value={formData.streamUrl || ''}
                                onChange={(e) => updateField('streamUrl', e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="registrationOpen"
                                checked={formData.registrationOpen}
                                onChange={(e) => updateField('registrationOpen', e.target.checked)}
                                className="w-4 h-4 accent-primary"
                            />
                            <label htmlFor="registrationOpen" className="text-sm text-white cursor-pointer">
                                Open registration immediately
                            </label>
                        </div>
                    </div>
                );



            default:
                return null;
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Create Tournament">
            <div className="p-6">
                {/* Progress Indicator */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        {[1, 2, 3, 4, 5].map((step) => (
                            <div
                                key={step}
                                className={`flex-1 h-1 ${step <= currentStep ? 'bg-primary' : 'bg-white/10'} ${step !== 5 ? 'mr-2' : ''
                                    }`}
                            />
                        ))}
                    </div>
                    <p className="text-sm text-text-muted">
                        Step {currentStep} of {totalSteps}
                    </p>
                </div>

                {/* Form Content */}
                <div className="min-h-[400px]">
                    {renderStep()}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-white/5">
                    <Button
                        variant="ghost"
                        onClick={handlePrevious}
                        disabled={currentStep === 1}
                        className="gap-2"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                    </Button>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        {currentStep < totalSteps ? (
                            <Button onClick={handleNext} className="gap-2">
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Button onClick={handleSubmit} isLoading={isSubmitting}>
                                Create Tournament
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default CreateTournamentModal;
