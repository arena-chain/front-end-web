import { useEffect, useState, useRef, useCallback, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Sparkles, ChevronLeft, ChevronRight, Play, Film } from 'lucide-react';
import { videoService } from '../../services/video.service';
import { highlightService, type HighlightRecord } from '../../services/highlight.service';
import { Badge, Button, Modal, Textarea } from '../../components/ui/core';
import { HighlightVisibilityToggle } from '../../components/highlights/HighlightVisibilityToggle';
import { HighlightEngagement } from '../../components/highlights/HighlightEngagement';
import { resolveBackendAssetUrl } from '../../lib/apiBase';
import { useAuth } from '../../contexts/AuthContext';

type HighlightWithSource = HighlightRecord & {
    sourceVideoId: string;
    sourceVideoTitle?: string;
};

export default function PlayerHighlightsHubPage() {
    const { user } = useAuth();
    const [myHighlights, setMyHighlights] = useState<HighlightWithSource[]>([]);
    const [highlightsLoading, setHighlightsLoading] = useState(true);
    const [selectedHighlight, setSelectedHighlight] = useState<HighlightWithSource | null>(null);
    const [savingHighlightVisibilityId, setSavingHighlightVisibilityId] = useState<string | null>(null);
    const [highlightDescDraft, setHighlightDescDraft] = useState('');
    const [savingHighlightDetails, setSavingHighlightDetails] = useState(false);
    const [deletingHighlightId, setDeletingHighlightId] = useState<string | null>(null);
    const highlightsScrollRef = useRef<HTMLDivElement>(null);

    const loadMyHighlights = useCallback(async () => {
        const uploader = user?.id;
        if (!uploader) {
            setMyHighlights([]);
            setHighlightsLoading(false);
            return;
        }
        setHighlightsLoading(true);
        try {
            const list = await videoService.list({ uploader });
            const vids = Array.isArray(list) ? list : [];
            const nested = await Promise.all(
                vids.map(async (v) => {
                    const vid = v._id;
                    if (!vid) return [] as HighlightWithSource[];
                    try {
                        const hl = await highlightService.listByVideo(String(vid), false);
                        return (Array.isArray(hl) ? hl : []).map((h) => ({
                            ...h,
                            sourceVideoId: String(vid),
                            sourceVideoTitle: v.title,
                        }));
                    } catch {
                        return [] as HighlightWithSource[];
                    }
                }),
            );
            const flat = nested.flat();
            flat.sort(
                (a, b) =>
                    new Date(b.updatedAt || b.createdAt || 0).getTime() -
                    new Date(a.updatedAt || a.createdAt || 0).getTime(),
            );
            setMyHighlights(flat);
        } catch {
            setMyHighlights([]);
        } finally {
            setHighlightsLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        void loadMyHighlights();
    }, [loadMyHighlights]);

    useEffect(() => {
        const onVideosChanged = () => void loadMyHighlights();
        window.addEventListener('arena-videos-changed', onVideosChanged);
        return () => window.removeEventListener('arena-videos-changed', onVideosChanged);
    }, [loadMyHighlights]);

    useEffect(() => {
        setHighlightDescDraft(selectedHighlight?.description ?? '');
    }, [selectedHighlight?._id, selectedHighlight?.description]);

    async function saveHighlightDescription(event: FormEvent) {
        event.preventDefault();
        if (!selectedHighlight) return;
        setSavingHighlightDetails(true);
        try {
            await highlightService.updateDetails(selectedHighlight._id, {
                description: highlightDescDraft.trim() || undefined,
            });
            toast.success('Description enregistrée');
            setSelectedHighlight({ ...selectedHighlight, description: highlightDescDraft.trim() || undefined });
            void loadMyHighlights();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Échec de l’enregistrement');
        } finally {
            setSavingHighlightDetails(false);
        }
    }

    async function deleteSelectedHighlight() {
        if (!selectedHighlight) return;
        if (!window.confirm('Supprimer ce clip ?')) return;
        setDeletingHighlightId(selectedHighlight._id);
        try {
            await highlightService.remove(selectedHighlight._id);
            toast.success('Clip supprimé');
            setSelectedHighlight(null);
            window.dispatchEvent(new Event('arena-videos-changed'));
            void loadMyHighlights();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Suppression impossible');
        } finally {
            setDeletingHighlightId(null);
        }
    }

    function scrollHighlights(dir: 'left' | 'right') {
        const el = highlightsScrollRef.current;
        if (!el) return;
        const delta = Math.min(400, el.clientWidth * 0.85);
        el.scrollBy({ left: dir === 'left' ? -delta : delta, behavior: 'smooth' });
    }

    if (!user?.id) {
        return (
            <div className="max-w-3xl mx-auto py-16 text-center text-white/45 text-sm">
                Connectez-vous pour voir vos highlights.
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-fade-in">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-2xl bg-primary/15 border border-primary/25">
                        <Sparkles className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-1">
                            Public
                        </p>
                        <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight italic">
                            Highlights
                        </h1>
                        <p className="text-sm text-white/50 mt-2 max-w-xl">
                            Tous vos clips générés, par vidéo source. Ouvrez une carte pour lire et régler la visibilité.{' '}
                            <Link to="/player/my-videos" className="text-primary hover:underline inline-flex items-center gap-1">
                                <Film size={14} className="inline" /> My videos
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            <section className="rounded-[2rem] border border-white/10 bg-[#0c0e11]/60 p-6 md:p-8 space-y-6 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-primary/90 text-xs font-black uppercase tracking-widest mb-2">
                            <Sparkles size={14} /> Vos clips
                        </div>
                        <p className="text-sm text-white/45 max-w-xl">
                            Faites défiler horizontalement, puis ouvrez un clip pour le lire en grand.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="!px-3"
                            onClick={() => scrollHighlights('left')}
                            aria-label="Défiler vers la gauche"
                        >
                            <ChevronLeft size={18} />
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="!px-3"
                            onClick={() => scrollHighlights('right')}
                            aria-label="Défiler vers la droite"
                        >
                            <ChevronRight size={18} />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => void loadMyHighlights()}
                            disabled={highlightsLoading}
                            isLoading={highlightsLoading}
                        >
                            Actualiser
                        </Button>
                    </div>
                </div>

                {highlightsLoading && myHighlights.length === 0 ? (
                    <div className="py-16 flex justify-center">
                        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : myHighlights.length === 0 ? (
                    <div className="py-12 text-center text-white/40 text-sm rounded-2xl border border-dashed border-white/10">
                        Aucun clip encore. Uploadez une vidéo depuis{' '}
                        <Link to="/player/my-videos" className="text-primary font-bold hover:underline">
                            My videos
                        </Link>{' '}
                        et attendez la fin du traitement, puis actualisez.
                    </div>
                ) : (
                    <div className="relative group/carousel">
                        <div
                            ref={highlightsScrollRef}
                            className="flex gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        >
                            {myHighlights.map((h) => (
                                <button
                                    key={h._id}
                                    type="button"
                                    onClick={() => setSelectedHighlight(h)}
                                    className="group/card shrink-0 w-[min(280px,78vw)] snap-start text-left rounded-2xl border border-white/10 bg-black/40 overflow-hidden hover:border-primary/40 hover:shadow-[0_0_24px_rgba(0,255,135,0.12)] transition-all duration-300"
                                >
                                    <div className="relative aspect-video bg-black">
                                        <video
                                            src={resolveBackendAssetUrl(h.clipUrl)}
                                            className="w-full h-full object-cover opacity-90 group-hover/card:opacity-100"
                                            muted
                                            playsInline
                                            preload="metadata"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                            <span className="w-14 h-14 rounded-full bg-primary text-black flex items-center justify-center shadow-lg shadow-primary/40">
                                                <Play size={24} className="ml-1" fill="currentColor" />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-3 space-y-2">
                                        <p className="text-sm font-bold text-white truncate">{h.title}</p>
                                        {h.sourceVideoTitle && (
                                            <p className="text-[10px] text-white/35 truncate uppercase tracking-wider">
                                                {h.sourceVideoTitle}
                                            </p>
                                        )}
                                        <Badge
                                            variant={h.visibility === 'public' ? 'primary' : 'secondary'}
                                            className="text-[9px] uppercase"
                                        >
                                            {h.visibility}
                                        </Badge>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            <Modal
                isOpen={Boolean(selectedHighlight)}
                onClose={() => setSelectedHighlight(null)}
                size="lg"
                title={selectedHighlight?.title ?? 'Highlight'}
            >
                {selectedHighlight && (
                    <div className="p-5 space-y-4">
                        <video
                            key={selectedHighlight._id}
                            src={resolveBackendAssetUrl(selectedHighlight.clipUrl)}
                            className="w-full max-h-[65vh] rounded-xl bg-black"
                            controls
                            playsInline
                            autoPlay
                        />
                        <HighlightVisibilityToggle
                            value={selectedHighlight.visibility === 'public' ? 'public' : 'private'}
                            onChange={async (v) => {
                                const id = selectedHighlight._id;
                                setSavingHighlightVisibilityId(id);
                                try {
                                    await highlightService.updateVisibility(id, v);
                                    toast.success(
                                        v === 'public'
                                            ? 'Clip public — visible par tous'
                                            : 'Clip privé — visible par vous seulement',
                                    );
                                    setSelectedHighlight({ ...selectedHighlight, visibility: v });
                                    void loadMyHighlights();
                                } catch (error) {
                                    toast.error(
                                        error instanceof Error ? error.message : 'Mise à jour impossible',
                                    );
                                } finally {
                                    setSavingHighlightVisibilityId(null);
                                }
                            }}
                            isLoading={savingHighlightVisibilityId === selectedHighlight._id}
                        />
                        <HighlightEngagement highlightId={selectedHighlight._id} />
                        <form onSubmit={(e) => void saveHighlightDescription(e)} className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                                Description du clip
                            </label>
                            <Textarea
                                rows={3}
                                value={highlightDescDraft}
                                onChange={(e) => setHighlightDescDraft(e.target.value)}
                                placeholder="Décrivez ce moment…"
                                className="bg-white/5 border-white/10 text-sm"
                            />
                            <Button
                                type="submit"
                                size="sm"
                                isLoading={savingHighlightDetails}
                                className="font-black uppercase text-[10px]"
                            >
                                Enregistrer la description
                            </Button>
                        </form>
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-red-400 border-red-500/30 hover:bg-red-500/10 font-black uppercase text-[10px]"
                                onClick={() => void deleteSelectedHighlight()}
                                disabled={Boolean(deletingHighlightId)}
                                isLoading={deletingHighlightId === selectedHighlight._id}
                            >
                                Supprimer le clip
                            </Button>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 justify-between text-sm pt-2 border-t border-white/5">
                            {selectedHighlight.sourceVideoTitle ? (
                                <span className="text-white/50">
                                    Vidéo source :{' '}
                                    <span className="text-white/80">{selectedHighlight.sourceVideoTitle}</span>
                                </span>
                            ) : (
                                <span />
                            )}
                            <Link
                                to={`/player/videos/${selectedHighlight.sourceVideoId}/highlights`}
                                className="text-primary text-xs font-black uppercase tracking-wider hover:underline shrink-0"
                                onClick={() => setSelectedHighlight(null)}
                            >
                                Page vidéo →
                            </Link>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
