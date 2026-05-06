import { useCallback, useEffect, useId, useState, type FormEvent } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Pencil, Plus, RefreshCw, Sparkles, Trash2, Upload } from 'lucide-react';
import { Button, Input, Modal, Textarea } from '../../components/ui/core';
import { videoService, type VideoRecord } from '../../services/video.service';
import { useAuth } from '../../contexts/AuthContext';
import { resolveBackendAssetUrl } from '../../lib/apiBase';
import { cn } from '../../lib/utils';

const DEFAULT_MAX_UPLOAD_MB = 2048;
const maxUploadMb = Number(import.meta.env.VITE_MAX_VIDEO_UPLOAD_MB ?? DEFAULT_MAX_UPLOAD_MB);

function channelVisLabel(v: VideoRecord): 'public' | 'private' {
    return v.channelVisibility === 'public' ? 'public' : 'private';
}

export function MyVideosManager() {
    const { user } = useAuth();
    const uid = user?.id;
    const uploadRadioHl = useId();
    const uploadRadioCh = useId();
    const [videos, setVideos] = useState<VideoRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [channelBusyId, setChannelBusyId] = useState<string | null>(null);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [editing, setEditing] = useState<VideoRecord | null>(null);
    const [editSaving, setEditSaving] = useState(false);

    const [uploadForm, setUploadForm] = useState({
        title: '',
        description: '',
        file: null as File | null,
        highlightsVisibility: 'private' as 'public' | 'private',
        channelVisibility: 'private' as 'public' | 'private',
    });

    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        channelVisibility: 'private' as 'public' | 'private',
    });

    const loadVideos = useCallback(async () => {
        if (!uid) {
            setVideos([]);
            return;
        }
        setLoading(true);
        try {
            const list = await videoService.list({ uploader: uid });
            setVideos(Array.isArray(list) ? list : []);
        } catch {
            setVideos([]);
        } finally {
            setLoading(false);
        }
    }, [uid]);

    useEffect(() => {
        void loadVideos();
    }, [loadVideos]);

    useEffect(() => {
        const onChange = () => void loadVideos();
        window.addEventListener('arena-videos-changed', onChange);
        return () => window.removeEventListener('arena-videos-changed', onChange);
    }, [loadVideos]);

    useEffect(() => {
        if (editing) {
            setEditForm({
                title: editing.title,
                description: editing.description ?? '',
                channelVisibility: channelVisLabel(editing),
            });
        }
    }, [editing]);

    async function handleUpload(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!uid) {
            toast.error('Connectez-vous pour uploader.');
            return;
        }
        if (!uploadForm.file || !uploadForm.title.trim()) {
            toast.error('Titre et fichier vidéo requis.');
            return;
        }
        if (Number.isFinite(maxUploadMb) && uploadForm.file.size > maxUploadMb * 1024 * 1024) {
            toast.error(
                `Fichier trop volumineux (${(uploadForm.file.size / 1024 / 1024).toFixed(1)} Mo). Limite front actuelle: ${maxUploadMb} Mo.`,
            );
            return;
        }
        setUploading(true);
        try {
            const { highlightJobId } = await videoService.upload({
                file: uploadForm.file,
                title: uploadForm.title.trim(),
                description: uploadForm.description.trim() || undefined,
                uploader: uid,
                highlightsVisibility: uploadForm.highlightsVisibility,
                channelVisibility: uploadForm.channelVisibility,
            });
            setUploadForm({
                title: '',
                description: '',
                file: null,
                highlightsVisibility: 'private',
                channelVisibility: 'private',
            });
            setUploadOpen(false);
            window.dispatchEvent(new Event('arena-videos-changed'));
            if (highlightJobId) {
                toast.success(`Vidéo enregistrée — file highlights (${highlightJobId})`);
            } else {
                toast.success('Vidéo enregistrée');
            }
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Échec de l’upload');
        } finally {
            setUploading(false);
        }
    }

    async function patchChannelVisibility(v: VideoRecord, channelVisibility: 'public' | 'private') {
        if (channelVisLabel(v) === channelVisibility) return;
        setChannelBusyId(v._id);
        try {
            await videoService.update(v._id, { channelVisibility });
            setVideos((prev) =>
                prev.map((x) => (x._id === v._id ? { ...x, channelVisibility } : x)),
            );
            window.dispatchEvent(new Event('arena-videos-changed'));
            toast.success(
                channelVisibility === 'public'
                    ? 'Vidéo affichée sur votre chaîne (studio + page publique).'
                    : 'Vidéo retirée de la chaîne publique.',
            );
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Mise à jour impossible');
        } finally {
            setChannelBusyId(null);
        }
    }

    async function handleDelete(id: string) {
        if (!window.confirm('Supprimer cette vidéo et ses métadonnées ?')) return;
        setDeletingId(id);
        try {
            await videoService.remove(id);
            window.dispatchEvent(new Event('arena-videos-changed'));
            toast.success('Vidéo supprimée');
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Suppression impossible');
        } finally {
            setDeletingId(null);
        }
    }

    async function handleSaveEdit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!editing) return;
        setEditSaving(true);
        try {
            await videoService.update(editing._id, {
                title: editForm.title.trim(),
                description: editForm.description.trim() || undefined,
                channelVisibility: editForm.channelVisibility,
            });
            toast.success('Vidéo mise à jour');
            setEditing(null);
            window.dispatchEvent(new Event('arena-videos-changed'));
            await loadVideos();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Mise à jour impossible');
        } finally {
            setEditSaving(false);
        }
    }

    if (!uid) {
        return <p className="text-sm text-white/40">Connectez-vous pour gérer vos vidéos.</p>;
    }

    const uploadFormBody = (
        <form onSubmit={(e) => void handleUpload(e)} className="p-1 space-y-4">
            <div className="flex items-center gap-2 text-primary/80 text-xs font-black uppercase tracking-widest">
                <Upload size={14} /> Nouvelle vidéo
            </div>
            <div>
                <label className="block text-xs font-bold text-white/60 mb-1">Titre</label>
                <Input
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="ex. Best clutch rounds"
                    required
                    className="bg-white/5 border-white/10"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-white/60 mb-1">Description</label>
                <Textarea
                    rows={3}
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Optionnel"
                    className="bg-white/5 border-white/10"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-white/60 mb-1">Fichier vidéo</label>
                <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/*"
                    onChange={(e) =>
                        setUploadForm((f) => ({ ...f, file: e.target.files?.[0] ?? null }))
                    }
                    className="w-full text-sm text-white/70 file:mr-4 file:rounded-lg file:border-0 file:bg-primary/20 file:px-3 file:py-2 file:text-xs file:font-bold file:text-primary"
                />
                <p className="mt-1 text-[11px] text-white/40">
                    Taille max recommandée: {maxUploadMb} Mo (configurable via `VITE_MAX_VIDEO_UPLOAD_MB`).
                </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/45">
                        Sur ma chaîne
                    </p>
                    <p className="text-[11px] text-white/35 leading-snug">
                        Public = visible sur la page chaîne. Privé = vous seul dans la liste joueur.
                    </p>
                    <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
                        <input
                            type="radio"
                            name={uploadRadioCh}
                            checked={uploadForm.channelVisibility === 'private'}
                            onChange={() => setUploadForm((f) => ({ ...f, channelVisibility: 'private' }))}
                            className="accent-primary"
                        />
                        Privé
                    </label>
                    <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
                        <input
                            type="radio"
                            name={uploadRadioCh}
                            checked={uploadForm.channelVisibility === 'public'}
                            onChange={() => setUploadForm((f) => ({ ...f, channelVisibility: 'public' }))}
                            className="accent-primary"
                        />
                        Public
                    </label>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/45">
                        Clips générés
                    </p>
                    <p className="text-[11px] text-white/35 leading-snug">
                        Visibilité par défaut des extraits créés après traitement.
                    </p>
                    <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
                        <input
                            type="radio"
                            name={uploadRadioHl}
                            checked={uploadForm.highlightsVisibility === 'private'}
                            onChange={() => setUploadForm((f) => ({ ...f, highlightsVisibility: 'private' }))}
                            className="accent-primary"
                        />
                        Privé
                    </label>
                    <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
                        <input
                            type="radio"
                            name={uploadRadioHl}
                            checked={uploadForm.highlightsVisibility === 'public'}
                            onChange={() => setUploadForm((f) => ({ ...f, highlightsVisibility: 'public' }))}
                            className="accent-primary"
                        />
                        Public
                    </label>
                </div>
            </div>
            <Button type="submit" isLoading={uploading} className="w-full font-black uppercase">
                Envoyer la vidéo
            </Button>
        </form>
    );

    return (
        <div className="space-y-6">
            <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-relaxed text-white/60">
                <strong className="text-primary">Chaîne publique :</strong> seules les VOD en{' '}
                <strong className="text-white/80">Public</strong> (ci-dessous) apparaissent dans votre studio chaîne et pour
                les visiteurs. Le réglage <strong className="text-white/80">Privé</strong> garde la vidéo dans votre liste
                joueur uniquement.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                    type="button"
                    onClick={() => setUploadOpen(true)}
                    className="gap-2 font-black uppercase tracking-wider"
                >
                    <Plus size={18} /> Uploader une vidéo
                </Button>
                <button
                    type="button"
                    title="Rafraîchir"
                    onClick={() => void loadVideos()}
                    disabled={loading}
                    className="p-2 rounded-xl border border-white/10 text-white/40 hover:text-primary hover:bg-white/5 disabled:opacity-40"
                >
                    <RefreshCw size={18} className={cn(loading && 'animate-spin')} />
                </button>
            </div>

            <Modal isOpen={uploadOpen} onClose={() => !uploading && setUploadOpen(false)} size="lg" title="Upload vidéo">
                {uploadFormBody}
            </Modal>

            <Modal
                isOpen={Boolean(editing)}
                onClose={() => !editSaving && setEditing(null)}
                size="md"
                title="Modifier la vidéo"
            >
                {editing && (
                    <form onSubmit={(e) => void handleSaveEdit(e)} className="p-1 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-white/60 mb-1">Titre</label>
                            <Input
                                value={editForm.title}
                                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                                required
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-white/60 mb-1">Description</label>
                            <Textarea
                                rows={3}
                                value={editForm.description}
                                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-white/60 mb-2">Sur ma chaîne</label>
                            <div className="flex flex-col gap-2">
                                <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="edit-ch-vis"
                                        checked={editForm.channelVisibility === 'private'}
                                        onChange={() =>
                                            setEditForm((f) => ({ ...f, channelVisibility: 'private' }))
                                        }
                                        className="accent-primary"
                                    />
                                    Privé (pas sur la chaîne publique)
                                </label>
                                <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="edit-ch-vis"
                                        checked={editForm.channelVisibility === 'public'}
                                        onChange={() =>
                                            setEditForm((f) => ({ ...f, channelVisibility: 'public' }))
                                        }
                                        className="accent-primary"
                                    />
                                    Public (visible sur la chaîne)
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button type="submit" isLoading={editSaving} className="flex-1 font-black uppercase">
                                Enregistrer
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditing(null)}
                                disabled={editSaving}
                            >
                                Annuler
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>

            {loading && videos.length === 0 ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-36 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
                    ))}
                </div>
            ) : videos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] py-20 text-center space-y-4">
                    <p className="text-white/50 font-bold">Aucune vidéo pour l’instant</p>
                    <Button type="button" onClick={() => setUploadOpen(true)} className="gap-2 font-black uppercase">
                        <Upload size={16} /> Premier upload
                    </Button>
                </div>
            ) : (
                <ul className="space-y-4">
                    {videos.map((v) => {
                        const ch = channelVisLabel(v);
                        return (
                            <li
                                key={v._id}
                                className="rounded-2xl border border-white/10 bg-[#0c0e11]/80 overflow-hidden flex flex-col sm:flex-row gap-0 shadow-lg shadow-black/20"
                            >
                                <NavLink
                                    to={`/player/videos/${v._id}/highlights`}
                                    className="sm:w-72 shrink-0 aspect-video sm:aspect-auto sm:min-h-[200px] bg-black border-b sm:border-b-0 sm:border-r border-white/10 block relative group/thumb"
                                >
                                    <video
                                        src={resolveBackendAssetUrl(v.url)}
                                        className="w-full h-full object-cover opacity-90 group-hover/thumb:opacity-100 transition-opacity"
                                        muted
                                        playsInline
                                        preload="metadata"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                                            <Sparkles size={14} /> Highlights
                                        </span>
                                    </div>
                                </NavLink>
                                <div className="flex-1 p-5 flex flex-col min-w-0">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0 space-y-2">
                                            <h3 className="text-lg font-black text-white uppercase tracking-tight italic truncate">
                                                {v.title}
                                            </h3>
                                            {v.description ? (
                                                <p className="text-sm text-white/50 line-clamp-2">{v.description}</p>
                                            ) : (
                                                <p className="text-sm text-white/25 italic">Pas de description</p>
                                            )}
                                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                                                {new Date(v.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-stretch gap-2 shrink-0 sm:items-end">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-white/35">
                                                Sur la chaîne
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {channelBusyId === v._id ? (
                                                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" aria-hidden />
                                                ) : null}
                                                <div
                                                    className="inline-flex rounded-xl border border-white/15 bg-black/50 p-1"
                                                    role="group"
                                                    aria-label="Visibilité sur la chaîne"
                                                >
                                                    <button
                                                        type="button"
                                                        disabled={channelBusyId === v._id}
                                                        onClick={() => void patchChannelVisibility(v, 'private')}
                                                        className={cn(
                                                            'rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wide transition',
                                                            ch === 'private'
                                                                ? 'bg-white/15 text-white'
                                                                : 'text-white/45 hover:text-white/75',
                                                        )}
                                                    >
                                                        Privé
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={channelBusyId === v._id}
                                                        onClick={() => void patchChannelVisibility(v, 'public')}
                                                        className={cn(
                                                            'rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wide transition',
                                                            ch === 'public'
                                                                ? 'bg-primary/25 text-primary'
                                                                : 'text-white/45 hover:text-white/75',
                                                        )}
                                                    >
                                                        Public
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-white/5">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5 font-black uppercase text-[10px]"
                                            onClick={() => setEditing(v)}
                                        >
                                            <Pencil size={14} /> Modifier
                                        </Button>
                                        <Link to={`/player/videos/${v._id}/highlights`}>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="gap-1.5 font-black uppercase text-[10px]"
                                            >
                                                <Sparkles size={14} /> Clips
                                            </Button>
                                        </Link>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5 text-red-400 border-red-500/30 hover:bg-red-500/10 font-black uppercase text-[10px] ml-auto"
                                            onClick={() => void handleDelete(v._id)}
                                            disabled={deletingId === v._id}
                                        >
                                            <Trash2 size={14} /> Supprimer
                                        </Button>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
