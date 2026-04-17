import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles, RefreshCw, Film, Trash2 } from 'lucide-react';
import { highlightService, type HighlightRecord } from '../../services/highlight.service';
import { videoService, type VideoRecord } from '../../services/video.service';
import { resolveBackendAssetUrl } from '../../lib/apiBase';
import { Button, Textarea } from '../../components/ui/core';
import { HighlightVisibilityToggle } from '../../components/highlights/HighlightVisibilityToggle';
import { HighlightEngagement } from '../../components/highlights/HighlightEngagement';
import { useAuth } from '../../contexts/AuthContext';

function creatorId(c: HighlightRecord['creator']): string {
    if (!c || typeof c !== 'object') return String(c ?? '');
    return String((c as { _id?: string; id?: string })._id ?? (c as { id?: string }).id ?? '');
}

function uploaderIdFromVideo(v: VideoRecord | null): string | null {
    if (!v?.uploader) return null;
    if (typeof v.uploader === 'string') return v.uploader;
    return String((v.uploader as { _id?: string })._id ?? (v.uploader as { id?: string }).id ?? '');
}

function OwnedHighlightEditor({
    h,
    onChanged,
}: {
    h: HighlightRecord;
    onChanged: () => void;
}) {
    const [desc, setDesc] = useState(h.description ?? '');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        setDesc(h.description ?? '');
    }, [h._id, h.description]);

    async function saveDescription(event: FormEvent) {
        event.preventDefault();
        setSaving(true);
        try {
            await highlightService.updateDetails(h._id, {
                description: desc.trim() || undefined,
            });
            toast.success('Description enregistrée');
            onChanged();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Échec');
        } finally {
            setSaving(false);
        }
    }

    async function removeClip() {
        if (!window.confirm('Supprimer ce clip ?')) return;
        setDeleting(true);
        try {
            await highlightService.remove(h._id);
            toast.success('Clip supprimé');
            window.dispatchEvent(new Event('arena-videos-changed'));
            onChanged();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Suppression impossible');
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="space-y-3 mt-3 pt-3 border-t border-white/10">
            <form onSubmit={(e) => void saveDescription(e)} className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/35">
                    Description
                </label>
                <Textarea
                    rows={2}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="bg-white/5 border-white/10 text-sm"
                    placeholder="Décrivez ce moment…"
                />
                <Button type="submit" size="sm" isLoading={saving} className="text-[10px] font-black uppercase">
                    Enregistrer
                </Button>
            </form>
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-red-400 border-red-500/25 hover:bg-red-500/10 text-[10px] font-black uppercase gap-1"
                onClick={() => void removeClip()}
                disabled={deleting}
                isLoading={deleting}
            >
                <Trash2 size={14} /> Supprimer le clip
            </Button>
        </div>
    );
}

export default function PlayerVideoHighlightsPage() {
    const { videoId } = useParams<{ videoId: string }>();
    const { user } = useAuth();
    const [video, setVideo] = useState<VideoRecord | null>(null);
    const [highlights, setHighlights] = useState<HighlightRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [requeueLoading, setRequeueLoading] = useState(false);
    const [savingVisibilityId, setSavingVisibilityId] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!videoId) return;
        setLoading(true);
        setLoadError(null);
        try {
            const [v, h] = await Promise.all([
                videoService.getById(videoId).catch(() => null),
                highlightService.listByVideo(videoId, false),
            ]);
            setVideo(v);
            setHighlights(h);
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Impossible de charger les highlights';
            setLoadError(msg);
            toast.error(msg);
            setHighlights([]);
        } finally {
            setLoading(false);
        }
    }, [videoId]);

    useEffect(() => {
        if (!videoId) return;
        void load();
    }, [videoId, load]);

    async function setVis(id: string, visibility: 'public' | 'private') {
        setSavingVisibilityId(id);
        try {
            await highlightService.updateVisibility(id, visibility);
            toast.success(visibility === 'public' ? 'Clip visible par tous' : 'Clip privé — visible par vous seulement');
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Mise à jour impossible');
        } finally {
            setSavingVisibilityId(null);
        }
    }

    async function handleRequeue() {
        const uid = user?.id;
        const up = uploaderIdFromVideo(video);
        const uploader = uid ?? up;
        if (!videoId || !uploader) {
            toast.error('Session ou vidéo incomplète — impossible de relancer.');
            return;
        }
        setRequeueLoading(true);
        try {
            const res = await highlightService.enqueue(videoId, uploader);
            if (res.jobId) {
                toast.success(`File d'attente : job ${res.jobId}. Attendez puis actualisez.`);
            } else {
                toast.info('Demande envoyée — vérifiez Redis / worker si rien ne se passe.');
            }
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Échec de la remise en file');
        } finally {
            setRequeueLoading(false);
        }
    }

    const myId = user?.id ?? '';
    const sourceSrc = video?.url ? resolveBackendAssetUrl(video.url) : '';

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <Link
                to="/player/highlights"
                className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-primary transition-colors"
            >
                <ArrowLeft size={16} /> Retour aux highlights
            </Link>

            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <Sparkles className="text-primary w-8 h-8 shrink-0 mt-1" />
                    <div>
                        <h1 className="text-2xl font-black text-white uppercase tracking-tight italic">
                            Highlights
                        </h1>
                        {video && <p className="text-white/60 mt-1">{video.title}</p>}
                        {!video && videoId && !loading && (
                            <p className="text-amber-400/90 text-sm mt-1">
                                Impossible de charger les infos vidéo (vérifiez la connexion / l&apos;API).
                            </p>
                        )}
                    </div>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 border-white/15"
                    disabled={loading}
                    onClick={() => void load()}
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Actualiser
                </Button>
            </div>

            {loadError && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {loadError}
                </div>
            )}

            {/* Source recording — main area (sidebar seulement montrait la miniature) */}
            {loading && !video ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center text-white/40">
                    Chargement de la vidéo…
                </div>
            ) : sourceSrc ? (
                <section className="rounded-2xl border border-white/10 bg-[#0c0e11] overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-black/30">
                        <Film size={16} className="text-primary" />
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/70">
                            Vidéo source (enregistrement complet)
                        </h2>
                    </div>
                    <video
                        src={sourceSrc}
                        className="w-full max-h-[55vh] bg-black object-contain"
                        controls
                        playsInline
                        preload="metadata"
                    />
                    <p className="px-4 py-3 text-[11px] text-white/40 leading-relaxed border-t border-white/5">
                        Les clips ci-dessous sont des extraits courts générés côté serveur (FFmpeg) après passage
                        dans la file Redis. Ce lecteur est le fichier original uploadé.
                    </p>
                </section>
            ) : null}

            {/* Generated clips */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-primary/40 to-transparent" />
                    <h2 className="text-xs font-black uppercase tracking-[0.25em] text-primary shrink-0">
                        Clips générés automatiquement
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-l from-primary/40 to-transparent" />
                </div>

                {loading ? (
                    <div className="py-16 text-center text-white/40 text-sm">Chargement des clips…</div>
                ) : highlights.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 md:p-10 space-y-6">
                        <div className="text-center space-y-2">
                            <p className="text-white font-bold text-lg">Aucun clip pour l&apos;instant</p>
                            <p className="text-sm text-white/50 max-w-lg mx-auto leading-relaxed">
                                Le serveur doit encore traiter la vidéo (queue BullMQ + worker Nest + FFmpeg), ou
                                la génération a échoué. Vérifiez les logs backend.
                            </p>
                        </div>
                        <ul className="text-[12px] text-white/40 space-y-2 max-w-md mx-auto list-disc pl-5">
                            <li>Redis actif et <code className="text-white/60">HIGHLIGHT_QUEUE_ENABLED</code> ≠ false</li>
                            <li>
                                <code className="text-white/60">HIGHLIGHT_WORKER_ENABLED=true</code> sur l&apos;instance
                                qui traite les jobs
                            </li>
                            <li>FFmpeg installé sur la machine du backend</li>
                        </ul>
                        <div className="flex flex-wrap justify-center gap-3">
                            <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
                                <RefreshCw size={14} className="mr-2 inline" />
                                Actualiser la liste
                            </Button>
                            <Button
                                type="button"
                                onClick={() => void handleRequeue()}
                                disabled={
                                    requeueLoading ||
                                    (!user?.id && !uploaderIdFromVideo(video))
                                }
                                isLoading={requeueLoading}
                                title="N’utilisez qu’une fois si aucun clip n’a été créé (sinon doublons côté serveur)."
                            >
                                Relancer la génération
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                        {highlights.map((h) => {
                            const mine = Boolean(myId && creatorId(h.creator) === myId);
                            const src = resolveBackendAssetUrl(h.clipUrl);
                            return (
                                <article
                                    key={h._id}
                                    className="rounded-2xl border border-white/10 bg-[#0c0e11] overflow-hidden flex flex-col"
                                >
                                    <video
                                        src={src}
                                        className="w-full aspect-video bg-black object-cover"
                                        controls
                                        playsInline
                                        preload="metadata"
                                    />
                                    <div className="p-4 flex-1 flex flex-col gap-3">
                                        <p className="font-bold text-white">{h.title}</p>
                                        {h.description && !mine && (
                                            <p className="text-xs text-white/45 leading-relaxed">{h.description}</p>
                                        )}
                                        {mine ? (
                                            <HighlightVisibilityToggle
                                                value={h.visibility === 'public' ? 'public' : 'private'}
                                                onChange={(v) => void setVis(h._id, v)}
                                                isLoading={savingVisibilityId === h._id}
                                                disabled={Boolean(savingVisibilityId && savingVisibilityId !== h._id)}
                                            />
                                        ) : (
                                            <span
                                                className={`text-[10px] font-black uppercase tracking-widest w-fit px-2 py-0.5 rounded ${
                                                    h.visibility === 'public'
                                                        ? 'bg-primary/20 text-primary'
                                                        : 'bg-white/10 text-white/50'
                                                }`}
                                            >
                                                {h.visibility}
                                            </span>
                                        )}
                                        {mine && <OwnedHighlightEditor h={h} onChanged={() => void load()} />}
                                        <HighlightEngagement highlightId={h._id} />
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
