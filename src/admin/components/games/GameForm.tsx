import { useState, useEffect, useRef } from 'react';
import { X, Save, Gamepad2, Upload, Image as ImageIcon } from 'lucide-react';
import { Button, Input } from '../../../components/ui/core';
import type { Game } from '../../../models/game';
import type { CreateGameDto, UpdateGameDto } from '../../../services/catalogService';
import { resolveBackendAssetUrl } from '../../../lib/apiBase';

interface GameFormProps {
    game?: Game;
    onSubmit: (data: FormData | CreateGameDto | UpdateGameDto) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

const GENRE_OPTIONS = [
    'MOBA',
    'FPS',
    'Battle Royale',
    'Strategy',
    'Sports',
    'RPG',
    'Fighting',
    'Racing',
    'Simulation',
    'Other'
];

const PLATFORM_OPTIONS = [
    'PC',
    'PlayStation 5',
    'PlayStation 4',
    'Xbox Series X',
    'Xbox Series S',
    'Nintendo Switch',
    'Mobile (iOS)',
    'Mobile (Android)'
];

export default function GameForm({ game, onSubmit, onCancel, isLoading = false }: GameFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState<CreateGameDto>({
        title: '',
        genre: '',
        description: '',
        publisher: '',
        platforms: [],
        releaseDate: '',
        coverImageUrl: '',
        isActive: true,
        teamSize: 5,
        supportsTeams: true,
        supportsSolo: false,
        metadata: {},
        isPartner: false,
        roles: []
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [roleInput, setRoleInput] = useState('');

    const resolveImageUrl = (url: string) => {
        if (url.startsWith('/uploads/') || url.startsWith('/uploads') || url.startsWith('uploads/')) {
            return resolveBackendAssetUrl(url);
        }
        return url;
    };

    useEffect(() => {
        if (game) {
            setFormData({
                title: game.title,
                genre: game.genre,
                description: game.description || '',
                publisher: game.publisher || '',
                platforms: game.platforms || [],
                releaseDate: game.releaseDate ? game.releaseDate.split('T')[0] : '',
                coverImageUrl: game.coverImageUrl || '',
                isActive: game.isActive ?? true,
                teamSize: game.teamSize ?? 5,
                supportsTeams: game.supportsTeams ?? true,
                supportsSolo: game.supportsSolo ?? false,
                metadata: game.metadata || {},
                isPartner: game.isPartner,
                roles: game.roles || []
            });
            if (game.coverImageUrl) {
                setImagePreview(resolveImageUrl(game.coverImageUrl));
            }
        }
    }, [game]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handlePlatformToggle = (platform: string) => {
        setFormData(prev => {
            const currentPlatforms = prev.platforms || [];
            if (currentPlatforms.includes(platform)) {
                return { ...prev, platforms: currentPlatforms.filter(p => p !== platform) };
            } else {
                return { ...prev, platforms: [...currentPlatforms, platform] };
            }
        });
    };

    const handleAddRole = () => {
        if (roleInput.trim()) {
            setFormData(prev => ({
                ...prev,
                roles: [...(prev.roles || []), roleInput.trim()]
            }));
            setRoleInput('');
        }
    };

    const handleRemoveRole = (roleToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            roles: (prev.roles || []).filter(role => role !== roleToRemove)
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const data = new FormData();

        data.append('title', formData.title);
        data.append('genre', formData.genre);
        if (formData.description) data.append('description', formData.description);
        if (formData.publisher)   data.append('publisher', formData.publisher);
        if (formData.releaseDate) data.append('releaseDate', formData.releaseDate);
        data.append('teamSize', String(formData.teamSize ?? 5));
        data.append('supportsTeams', String(formData.supportsTeams ?? true));
        data.append('supportsSolo',  String(formData.supportsSolo  ?? false));

        if (formData.platforms && formData.platforms.length > 0) {
            formData.platforms.forEach(platform => data.append('platforms[]', platform));
        }

        if (formData.roles && formData.roles.length > 0) {
            formData.roles.forEach(role => data.append('roles[]', role));
        }

        data.append('isPartner', String(formData.isPartner));

        if (selectedFile) {
            data.append('file', selectedFile);
        } else if (formData.coverImageUrl) {
            data.append('coverImageUrl', formData.coverImageUrl);
        }

        await onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-primary" />
                    {game ? 'Edit Game' : 'Add New Game'}
                </h2>
                <button
                    type="button"
                    onClick={onCancel}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors text-text-muted hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto pb-4 custom-scrollbar">
                {/* Column 1: Core Info */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-2 border-b border-white/5 pb-1">Core Info</h3>
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">Title *</label>
                        <Input
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g. Valorant"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">Genre *</label>
                        <select
                            name="genre"
                            value={formData.genre}
                            onChange={handleChange}
                            className="w-full bg-background border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
                            required
                        >
                            <option value="">Select Genre</option>
                            {GENRE_OPTIONS.map(g => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">Publisher</label>
                        <Input
                            name="publisher"
                            value={formData.publisher}
                            onChange={handleChange}
                            placeholder="e.g. Riot Games"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">Release Date</label>
                        <Input
                            type="date"
                            name="releaseDate"
                            value={formData.releaseDate}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">Team Size</label>
                        <Input
                            type="number"
                            name="teamSize"
                            value={formData.teamSize ?? 5}
                            onChange={e => setFormData(prev => ({ ...prev, teamSize: +e.target.value }))}
                            min={1}
                            max={50}
                            placeholder="e.g. 5"
                        />
                        <p className="text-xs text-text-muted mt-1">Players per team (e.g. 5 → 5v5)</p>
                    </div>
                </div>

                {/* Column 2: Details & Media */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-2 border-b border-white/5 pb-1">Details & Media</h3>
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">Cover Image</label>
                        <div
                            className="border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-white/5 transition-all text-center relative overflow-hidden group min-h-[160px]"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />

                            {imagePreview ? (
                                <>
                                    <div className="absolute inset-0 bg-black/60 z-10 hidden group-hover:flex items-center justify-center">
                                        <p className="text-white font-medium flex items-center gap-2">
                                            <Upload className="w-4 h-4" /> Change Image
                                        </p>
                                    </div>
                                    <img
                                        src={imagePreview}
                                        alt="Cover Preview"
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                </>
                            ) : (
                                <>
                                    <ImageIcon className="w-8 h-8 text-text-muted mb-2 group-hover:text-primary transition-colors" />
                                    <p className="text-sm text-text-muted font-medium group-hover:text-white transition-colors">Click to upload cover</p>
                                    <p className="text-xs text-text-muted/60 mt-1">JPG, PNG, GIF up to 5MB</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={6}
                            className="w-full bg-surface border border-white/5 rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none placeholder:text-text-muted"
                            placeholder="Brief overview of the game..."
                        />
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        <label className="flex items-center gap-3 cursor-pointer p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                            <input
                                type="checkbox"
                                name="isPartner"
                                checked={formData.isPartner}
                                onChange={handleCheckboxChange}
                                className="w-4 h-4 rounded border-white/10 bg-background text-primary focus:ring-primary"
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">Partner Game</span>
                                <span className="text-xs text-text-muted">Show partner badge</span>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors opacity-50 pointer-events-none">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleCheckboxChange}
                                className="w-4 h-4 rounded border-white/10 bg-background text-primary focus:ring-primary"
                                disabled
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">Active Status</span>
                                <span className="text-xs text-text-muted">Always active (backend limitation)</span>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Column 3: Config */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-2 border-b border-white/5 pb-1">Configuration</h3>

                    {/* Platforms */}
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-2">Supported Platforms</label>
                        <div className="flex flex-wrap gap-2">
                            {PLATFORM_OPTIONS.map(platform => (
                                <button
                                    key={platform}
                                    type="button"
                                    onClick={() => handlePlatformToggle(platform)}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all flex-grow text-center ${(formData.platforms || []).includes(platform)
                                            ? 'bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                                            : 'bg-surface border-white/5 text-text-muted hover:border-white/20 hover:bg-white/5'
                                        }`}
                                >
                                    {platform}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Roles */}
                    <div className="pt-2">
                        <label className="block text-sm font-medium text-text-muted mb-2">Game Roles</label>
                        <div className="flex items-center gap-2 mb-3">
                            <Input
                                value={roleInput}
                                onChange={(e) => setRoleInput(e.target.value)}
                                placeholder="Role name (e.g. Duelist)"
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRole())}
                                className="h-10"
                            />
                            <Button type="button" onClick={handleAddRole} size="sm" variant="secondary" className="h-10 px-4">Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto">
                            {(formData.roles || []).map(role => (
                                <span key={role} className="pl-3 pr-1 py-1.5 rounded-md bg-surface border border-white/10 text-xs text-white flex items-center gap-2 group hover:border-white/20 transition-colors">
                                    {role}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveRole(role)}
                                        className="p-1 hover:bg-white/20 rounded-full transition-colors text-text-muted group-hover:text-white"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                            {(formData.roles || []).length === 0 && (
                                <div className="text-xs text-text-muted italic w-full text-center py-4 bg-white/5 rounded-lg border border-white/5 border-dashed">
                                    No roles added yet
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/10 mt-auto">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="gap-2 min-w-[140px]">
                    <Save className="w-4 h-4" />
                    {isLoading ? 'Saving...' : (game ? 'Update Game' : 'Save Game')}
                </Button>
            </div>
        </form>
    );
}
