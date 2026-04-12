import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { ExternalLink, Hash, Image as ImageIcon, Sparkles, User as UserIcon, Check, Plus, Video, Trash2, Upload } from 'lucide-react';
import { Badge, Button, Input, Textarea, Modal } from '../../components/ui/core';
import { channelService, type ChannelRecord } from '../../services/channel.service';
import { videoService, type VideoRecord } from '../../services/video.service';
import { resolveBackendAssetUrl } from '../../lib/apiBase';

function ownerLabel(record: ChannelRecord): string {
    const o = record.ownerId as unknown;
    if (o && typeof o === 'object' && 'nickname' in o && (o as { nickname?: string }).nickname) {
        return String((o as { nickname: string }).nickname);
    }
    if (o && typeof o === 'object' && 'email' in o && (o as { email?: string }).email) {
        const e = (o as { email: string }).email;
        return e.split('@')[0] || e;
    }
    return '—';
}

function formatDate(value?: string) {
    if (!value) {
        return '—';
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
        return '—';
    }
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(d);
}

export default function ChannelStudioPage() {
    const [channel, setChannel] = useState<ChannelRecord | null>(null);
    const [allStudios, setAllStudios] = useState<ChannelRecord[]>([]);
    const [listLoading, setListLoading] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showCustomAvatar, setShowCustomAvatar] = useState(false);
    const [showCustomBanner, setShowCustomBanner] = useState(false);
    const [showCustomCategories, setShowCustomCategories] = useState(false);
    const [videos, setVideos] = useState<VideoRecord[]>([]);
    const [videosLoading, setVideosLoading] = useState(true);
    const [videoUploading, setVideoUploading] = useState(false);
    const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
    const [previewVideo, setPreviewVideo] = useState<VideoRecord | null>(null);
    const [videoForm, setVideoForm] = useState({
        title: '',
        description: '',
        file: null as File | null,
    });

    const PREDEFINED_AVATARS = [
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Midnight',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Shadow',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Neon',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Cyber',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Glitch',
    ];

    const PREDEFINED_CATEGORIES = [
        'Gaming', 'League of Legends', 'Valorant', 'Apex Legends', 'Fortnite',
        'Minecraft', 'Just Chatting', 'FIFA', 'Call of Duty', 'Counter-Strike 2'
    ];
    const [form, setForm] = useState({
        name: '',
        description: '',
        avatarUrl: '',
        bannerUrl: '',
        categories: '',
    });

    useEffect(() => {
        void loadChannel();
        void loadAllStudios();
        void loadMyVideos();
    }, []);

    function currentUserId(): string | null {
        try {
            const raw = localStorage.getItem('user');
            const user = raw ? JSON.parse(raw) : null;
            return user?.id ?? user?._id ?? null;
        } catch {
            return null;
        }
    }

    async function loadChannel() {
        setLoading(true);
        try {
            const data = await channelService.getMyChannel();
            setChannel(data);
            if (data) {
                setForm({
                    name: data.name || '',
                    description: data.description || '',
                    avatarUrl: data.avatarUrl || '',
                    bannerUrl: data.bannerUrl || '',
                    categories: (data.categories || []).join(', '),
                });
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to load channel');
        } finally {
            setLoading(false);
        }
    }

    async function loadAllStudios() {
        setListLoading(true);
        try {
            const list = await channelService.getAllChannels();
            setAllStudios(Array.isArray(list) ? list : []);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Impossible de charger la liste des studios');
            setAllStudios([]);
        } finally {
            setListLoading(false);
        }
    }

    async function loadMyVideos() {
        const uploader = currentUserId();
        if (!uploader) {
            setVideos([]);
            setVideosLoading(false);
            return;
        }
        setVideosLoading(true);
        try {
            const list = await videoService.list({ uploader });
            setVideos(Array.isArray(list) ? list : []);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to load videos');
            setVideos([]);
        } finally {
            setVideosLoading(false);
        }
    }

    async function handleUploadVideo(event: React.FormEvent) {
        event.preventDefault();
        const uploader = currentUserId();
        if (!uploader) {
            toast.error('User not found in session');
            return;
        }
        if (!videoForm.file || !videoForm.title.trim()) {
            toast.error('Please choose a video file and enter a title');
            return;
        }
        setVideoUploading(true);
        try {
            await videoService.upload({
                file: videoForm.file,
                title: videoForm.title.trim(),
                description: videoForm.description.trim() || undefined,
                uploader,
            });
            setVideoForm({ title: '', description: '', file: null });
            await loadMyVideos();
            toast.success('Video uploaded');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to upload video');
        } finally {
            setVideoUploading(false);
        }
    }

    async function handleDeleteVideo(id: string) {
        setDeletingVideoId(id);
        try {
            await videoService.remove(id);
            await loadMyVideos();
            toast.success('Video deleted');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete video');
        } finally {
            setDeletingVideoId(null);
        }
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setSaving(true);

        try {
            const payload = {
                name: form.name.trim(),
                description: form.description.trim() || undefined,
                avatarUrl: form.avatarUrl.trim() || undefined,
                bannerUrl: form.bannerUrl.trim() || undefined,
                categories: form.categories.split(',').map((item) => item.trim()).filter(Boolean),
            };

            const result = channel
                ? await channelService.updateChannel(channel._id, payload)
                : await channelService.createChannel(payload);

            setChannel(result);
            void loadAllStudios();
            toast.success(channel ? 'Channel updated' : 'Channel created');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save channel');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-12 animate-fade-in relative z-10 selection:bg-primary/30 selection:text-white">
            <header className="relative py-16 px-10 rounded-[3rem] bg-[#0c0e11]/40 backdrop-blur-3xl border border-white/5 overflow-hidden group shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)]">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/20 p-2.5 rounded-2xl ring-1 ring-primary/30 shadow-lg shadow-primary/10">
                                <Sparkles className="w-6 h-6 text-primary" />
                            </div>
                            <span className="text-xs font-black text-primary uppercase tracking-[0.3em]">University Creator Elite</span>
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-[0.85] italic">
                                Channel <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-hover to-primary shadow-sm">Studio</span>
                            </h1>
                        </div>
                        <p className="text-lg md:text-xl text-text-muted font-medium max-w-xl leading-relaxed border-l-2 border-primary/20 pl-6 py-2">
                            <span className="text-white font-black uppercase tracking-tight">Unifiez votre présence.</span> <br />
                            Créez votre chaîne une fois, puis réutilisez-la à chaque fois que vous lancez un live.
                        </p>
                    </div>

                    {channel && (
                        <div className="flex flex-col items-end gap-4 shrink-0">
                            <div className="flex items-center gap-3 px-6 py-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-xl shadow-primary/5">
                                <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Studio Opérationnel</span>
                            </div>
                            <Link to={`/watch/${channel._id}`}>
                                <Button size="lg" className="h-16 px-10 rounded-3xl group/btn overflow-hidden relative shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-500">
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary-hover to-primary opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                    <span className="relative z-10 flex items-center gap-3 text-sm font-black uppercase tracking-widest text-black">
                                        Voir ma page publique
                                        <ExternalLink className="w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform duration-300" />
                                    </span>
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                <form
                    onSubmit={handleSubmit}
                    className="space-y-10 bg-[#0c0e11]/60 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    <div className="space-y-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_15px_rgba(0,255,135,0.5)]" />
                                <label className="text-xs font-black uppercase tracking-[0.25em] text-white/50">Configuration Identité</label>
                            </div>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="relative group/input">
                                    <Input
                                        className="w-full h-16 bg-[#16191d]/50 border-white/5 rounded-2xl px-8 text-lg font-bold placeholder:text-white/5 focus:ring-primary/20 focus:border-primary/40 transition-all duration-300 hover:border-white/10"
                                        placeholder="Nom de votre chaîne"
                                        value={form.name}
                                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                                        required
                                    />
                                    <div className="absolute inset-0 rounded-2xl ring-1 ring-primary/0 group-focus-within/input:ring-primary/20 transition-all pointer-events-none" />
                                </div>
                                <div className="relative group/input">
                                    <Textarea
                                        rows={4}
                                        className="w-full bg-[#16191d]/50 border-white/5 rounded-2xl px-8 py-6 text-base font-medium placeholder:text-white/5 focus:ring-primary/20 focus:border-primary/40 transition-all duration-300 hover:border-white/10 resize-none"
                                        placeholder="Décrivez l'univers de votre studio..."
                                        value={form.description}
                                        onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                                    />
                                    <div className="absolute inset-0 rounded-2xl ring-1 ring-primary/0 group-focus-within/input:ring-primary/20 transition-all pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_15px_rgba(0,255,135,0.5)]" />
                                    <label className="text-xs font-black uppercase tracking-[0.25em] text-white/50">Galerie d'Avatars</label>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="hidden sm:block text-[10px] text-primary font-black uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full border border-primary/10">8 Modèles Pro</span>
                                    <button
                                        type="button"
                                        onClick={() => setShowCustomAvatar(!showCustomAvatar)}
                                        className={`text-[10px] font-black uppercase tracking-widest transition-colors ${showCustomAvatar ? 'text-primary' : 'text-white/20 hover:text-white/40'}`}
                                    >
                                        {showCustomAvatar ? 'Utiliser la galerie' : 'URL Personnalisée'}
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 sm:grid-cols-4 xl:grid-cols-8 gap-4">
                                {PREDEFINED_AVATARS.map((url, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => {
                                            setForm(f => ({ ...f, avatarUrl: url }));
                                            setShowCustomAvatar(false);
                                        }}
                                        className={`relative aspect-square rounded-2xl border-2 transition-all duration-500 group overflow-hidden hover:scale-105 active:scale-95 ${!showCustomAvatar && form.avatarUrl === url ? 'border-primary shadow-[0_0_30px_rgba(0,255,135,0.2)] ring-4 ring-primary/10' : 'border-white/5 hover:border-white/20'}`}
                                    >
                                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url(${url})` }} />
                                        {!showCustomAvatar && form.avatarUrl === url && (
                                            <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in zoom-in duration-300">
                                                <div className="bg-primary text-black p-1 rounded-full shadow-2xl">
                                                    <Check className="w-4 h-4 font-black" />
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                            {showCustomAvatar && (
                                <div className="relative group/input animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within/input:text-primary transition-colors z-20">
                                        <UserIcon className="w-5 h-5" />
                                    </div>
                                    <Input
                                        className="h-14 pl-14 bg-[#16191d]/30 border-white/5 rounded-2xl focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-white/5"
                                        placeholder="Lien de votre avatar personnalisé (URL)"
                                        value={form.avatarUrl}
                                        onChange={(event) => setForm((current) => ({ ...current, avatarUrl: event.target.value }))}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_15px_rgba(0,255,135,0.5)]" />
                                    <label className="text-xs font-black uppercase tracking-[0.25em] text-white/50">Tags & Catégories Gaming</label>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowCustomCategories(!showCustomCategories)}
                                    className={`text-[10px] font-black uppercase tracking-widest transition-colors ${showCustomCategories ? 'text-primary' : 'text-white/20 hover:text-white/40'}`}
                                >
                                    {showCustomCategories ? 'Masquer' : 'Perso'}
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                                {PREDEFINED_CATEGORIES.map(cat => {
                                    const isSelected = form.categories.split(',').map(s => s.trim()).includes(cat);
                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => {
                                                const currentCats = form.categories.split(',').map(s => s.trim()).filter(Boolean);
                                                if (isSelected) {
                                                    setForm(f => ({ ...f, categories: currentCats.filter(c => c !== cat).join(', ') }));
                                                } else {
                                                    setForm(f => ({ ...f, categories: [...currentCats, cat].join(', ') }));
                                                }
                                            }}
                                            className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider border transition-all duration-300 transform active:scale-95 ${isSelected
                                                ? 'bg-primary text-black border-primary shadow-[0_0_20px_rgba(0,255,135,0.3)]'
                                                : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10 hover:border-white/20 hover:text-white/60'
                                                }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 text-primary" />}
                                                {cat}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            {showCustomCategories && (
                                <div className="relative group/input animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within/input:text-primary transition-colors z-20">
                                        <Hash className="w-5 h-5" />
                                    </div>
                                    <Input
                                        className="h-14 pl-14 bg-[#16191d]/30 border-white/5 rounded-2xl focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-white/5"
                                        placeholder="Catégories libres (séparées par une virgule)"
                                        value={form.categories}
                                        onChange={(event) => setForm((current) => ({ ...current, categories: event.target.value }))}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_15px_rgba(0,255,135,0.5)]" />
                                    <label className="text-xs font-black uppercase tracking-[0.25em] text-white/50">Design de Bannière</label>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowCustomBanner(!showCustomBanner)}
                                    className={`text-[10px] font-black uppercase tracking-widest transition-colors ${showCustomBanner ? 'text-primary' : 'text-white/20 hover:text-white/40'}`}
                                >
                                    {showCustomBanner ? 'Masquer URL' : 'Ajouter une URL'}
                                </button>
                            </div>
                            {showCustomBanner && (
                                <div className="relative group/input animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within/input:text-primary transition-colors z-20">
                                        <ImageIcon className="w-5 h-5" />
                                    </div>
                                    <Input
                                        className="h-14 pl-14 bg-[#16191d]/30 border-white/5 rounded-2xl focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-white/5"
                                        placeholder="Lien de l'image de votre bannière (URL)"
                                        value={form.bannerUrl}
                                        onChange={(event) => setForm((current) => ({ ...current, bannerUrl: event.target.value }))}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-6">
                        <Button type="submit" size="lg" isLoading={saving} className="w-full h-16 rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-500">
                            {channel ? 'Sauvegarder les modifications' : 'Lancer mon Studio'}
                        </Button>
                    </div>
                </form>

                <div className="bg-[#0f1114] border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ExternalLink className="w-12 h-12 text-primary" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-4">Aperçu en temps réel</p>
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div
                                className="h-44 rounded-2xl border border-white/10 bg-cover bg-center shadow-inner relative overflow-hidden"
                                style={{ backgroundImage: form.bannerUrl ? `url(${form.bannerUrl})` : 'linear-gradient(135deg, rgba(0,255,135,0.1), rgba(0,0,0,0.9))' }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            </div>
                            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-12 px-2 relative z-10">
                                <div
                                    className="w-24 h-24 rounded-3xl border-4 border-[#0f1114] bg-cover bg-center bg-[#16191d] shadow-2xl shrink-0"
                                    style={{ backgroundImage: form.avatarUrl ? `url(${form.avatarUrl})` : undefined }}
                                />
                                <div className="pb-2 text-center md:text-left">
                                    <h2 className="text-2xl font-black text-white leading-none uppercase tracking-tighter">{form.name || 'Nom de votre chaîne'}</h2>
                                    <p className="text-sm text-text-muted mt-2 line-clamp-2 max-w-md">{form.description || 'La description de votre studio s\'affichera ici.'}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                                {form.categories.split(',').map((item) => item.trim()).filter(Boolean).map((item) => (
                                    <Badge key={item} variant="secondary" className="bg-white/5 border-white/10 text-[10px] uppercase font-black tracking-widest px-3">{item}</Badge>
                                ))}
                                {form.categories.trim() === '' && <span className="text-[10px] text-white/20 uppercase font-black tracking-widest italic">Aucune catégorie</span>}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <section className="space-y-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    <form
                        onSubmit={handleUploadVideo}
                        className="lg:w-[380px] rounded-2xl border border-white/10 bg-[#0c0e11]/70 p-6 space-y-4"
                    >
                        <div className="flex items-center gap-2 text-primary/80 text-xs font-black uppercase tracking-widest">
                            <Upload size={14} /> Upload video
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-white/60 mb-1">Title</label>
                            <Input
                                value={videoForm.title}
                                onChange={(event) => setVideoForm((f) => ({ ...f, title: event.target.value }))}
                                placeholder="e.g. Best clutch rounds"
                                required
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-white/60 mb-1">Description</label>
                            <Textarea
                                rows={3}
                                value={videoForm.description}
                                onChange={(event) => setVideoForm((f) => ({ ...f, description: event.target.value }))}
                                placeholder="Optional details"
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-white/60 mb-1">Video file</label>
                            <input
                                type="file"
                                accept="video/mp4,video/webm,video/quicktime,video/*"
                                onChange={(event) => setVideoForm((f) => ({ ...f, file: event.target.files?.[0] ?? null }))}
                                className="w-full text-sm text-white/70 file:mr-4 file:rounded-lg file:border-0 file:bg-primary/20 file:px-3 file:py-2 file:text-xs file:font-bold file:text-primary hover:file:bg-primary/30"
                            />
                            {videoForm.file && (
                                <p className="text-[11px] text-white/50 mt-1 truncate">{videoForm.file.name}</p>
                            )}
                        </div>
                        <Button type="submit" isLoading={videoUploading} className="w-full">
                            Upload video
                        </Button>
                    </form>

                    <div className="flex-1 rounded-2xl border border-white/10 bg-[#0c0e11]/50 p-6">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-primary/90 flex items-center gap-2">
                                <Video size={15} /> My uploaded videos
                            </h3>
                            <Button type="button" variant="outline" size="sm" onClick={() => void loadMyVideos()} disabled={videosLoading}>
                                Refresh
                            </Button>
                        </div>
                        {videosLoading ? (
                            <div className="py-10 text-center text-white/40 text-sm">Loading videos...</div>
                        ) : videos.length === 0 ? (
                            <div className="py-10 text-center text-white/40 text-sm">
                                No videos uploaded yet.
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                                {videos.map((v) => (
                                    <div key={v._id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex items-start gap-3">
                                        <button
                                            type="button"
                                            className="shrink-0 rounded-lg overflow-hidden border border-white/10 hover:border-primary/30 transition-colors"
                                            onClick={() => setPreviewVideo(v)}
                                            title="Open larger preview"
                                        >
                                            <video
                                                src={resolveBackendAssetUrl(v.url)}
                                                className="w-40 h-24 object-cover bg-black"
                                                preload="metadata"
                                            />
                                        </button>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-white font-semibold truncate">{v.title}</p>
                                            {v.description && <p className="text-xs text-white/50 mt-1 line-clamp-2">{v.description}</p>}
                                            <div className="text-[10px] text-white/40 mt-2">
                                                {new Date(v.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="p-2 rounded-lg text-red-400 hover:bg-red-500/15 disabled:opacity-50"
                                            onClick={() => void handleDeleteVideo(v._id)}
                                            disabled={deletingVideoId === v._id}
                                            title="Delete video"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <Modal isOpen={Boolean(previewVideo)} onClose={() => setPreviewVideo(null)} size="xl">
                {previewVideo && (
                    <div className="p-5 space-y-3">
                        <div>
                            <h3 className="text-lg font-bold text-white">{previewVideo.title}</h3>
                            {previewVideo.description && (
                                <p className="text-sm text-white/60 mt-1">{previewVideo.description}</p>
                            )}
                        </div>
                        <video
                            src={resolveBackendAssetUrl(previewVideo.url)}
                            className="w-full max-h-[70vh] rounded-xl bg-black"
                            controls
                            autoPlay
                        />
                    </div>
                )}
            </Modal>

            <section className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1 h-4 bg-primary rounded-full" />
                            <p className="text-xs font-black uppercase tracking-[0.25em] text-white/30">Communauté</p>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Studios créés</h2>
                        <p className="text-sm text-text-muted mt-1 max-w-2xl">
                            Découvrez les créateurs de la plateforme. Chaque utilisateur peut posséder un studio unique pour ses diffusions.
                        </p>
                    </div>
                    <Button type="button" variant="outline" onClick={() => void loadAllStudios()} disabled={listLoading} className="shrink-0">
                        Actualiser la liste
                    </Button>
                </div>

                {listLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-64 rounded-3xl bg-white/5 animate-pulse border border-white/10" />
                        ))}
                    </div>
                ) : allStudios.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
                        <p className="text-text-muted font-bold text-lg italic">Aucun studio n'a encore été créé sur la plateforme.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {allStudios.map((row) => {
                            const isMine = channel?._id === row._id;
                            return (
                                <div
                                    key={row._id}
                                    className={`group relative flex flex-col rounded-3xl border transition-all duration-500 overflow-hidden bg-[#0c0e11] hover:translate-y-[-4px] ${isMine
                                        ? 'border-primary/40 shadow-[0_10px_40px_-15px_rgba(0,255,135,0.15)] ring-1 ring-primary/20'
                                        : 'border-white/5 hover:border-white/20 hover:shadow-2xl hover:shadow-black/50'
                                        }`}
                                >
                                    {/* Card Header / Banner */}
                                    <div
                                        className="h-28 bg-cover bg-center relative"
                                        style={{
                                            backgroundImage: row.bannerUrl
                                                ? `url(${row.bannerUrl})`
                                                : 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(0,0,0,0.8))'
                                        }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e11] to-transparent" />
                                        {isMine && (
                                            <div className="absolute top-3 right-3">
                                                <Badge variant="success" className="shadow-lg animate-pulse text-[9px] py-0.5 px-2 bg-primary text-black border-none font-black uppercase">Mon Studio</Badge>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Body */}
                                    <div className="px-6 pb-6 pt-0 flex-1 flex flex-col relative">
                                        {/* Avatar Overflow */}
                                        <div
                                            className="w-16 h-16 rounded-2xl border-4 border-[#0c0e11] bg-cover bg-center shrink-0 -mt-8 mb-3 bg-[#16191d] shadow-xl group-hover:scale-110 transition-transform duration-500"
                                            style={{ backgroundImage: row.avatarUrl ? `url(${row.avatarUrl})` : undefined }}
                                        />

                                        <div className="space-y-1 mb-4">
                                            <h3 className="font-black text-white text-lg uppercase tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                                                {row.name}
                                            </h3>
                                            <p className="text-xs text-text-muted font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 opacity-60">
                                                par {ownerLabel(row)}
                                            </p>
                                            <p className="text-sm text-text-muted/80 line-clamp-2 min-h-[2.5rem] leading-relaxed font-medium italic">
                                                {row.description ? `"${row.description}"` : 'Aucune description fournie.'}
                                            </p>
                                        </div>

                                        {/* Categories */}
                                        <div className="flex flex-wrap gap-1.5 mb-6">
                                            {(row.categories || []).slice(0, 2).map((c) => (
                                                <Badge key={c} variant="secondary" className="text-[9px] bg-white/5 text-white/50 border-white/5 py-0 px-2 font-black uppercase tracking-widest">
                                                    {c}
                                                </Badge>
                                            ))}
                                            {(row.categories || []).length > 2 && (
                                                <span className="text-[9px] text-white/20 font-black flex items-center ml-1">
                                                    +{(row.categories || []).length - 2}
                                                </span>
                                            )}
                                            {(row.categories || []).length === 0 && (
                                                <span className="text-[9px] text-white/10 uppercase font-black tracking-widest italic">Standard</span>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                            <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">
                                                {formatDate(row.createdAt)}
                                            </span>
                                            <Link to={`/player/channel/${row._id}/detail`}>
                                                <Button type="button" variant={isMine ? 'primary' : 'outline'} size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-[0.1em] h-8 px-4">
                                                    Ouvrir
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
