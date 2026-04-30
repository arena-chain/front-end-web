import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal, Button } from '../../components/ui/core';
import { HighlightEngagement } from '../../components/highlights/HighlightEngagement';
import { resolveBackendAssetUrl } from '../../lib/apiBase';
import type { HighlightRecord } from '../../services/highlight.service';
import { highlightCreatorLabel, highlightClipDurationLabel } from '../lib/scouterHighlightUtils';

/**
 * Matches Channel Studio / player highlight viewer: full-screen modal, vertical 9:16 clip,
 * prev/next when multiple clips, fixed engagement rail on the right (embedded layout).
 */
export function ScouterHighlightDetailModal({
    highlights,
    activeHighlightId,
    onClose,
    onNavigate,
}: {
    highlights: HighlightRecord[];
    activeHighlightId: string | null;
    onClose: () => void;
    /** Called when user picks prev/next clip */
    onNavigate: (highlightId: string) => void;
}) {
    const index = activeHighlightId ? highlights.findIndex((h) => h._id === activeHighlightId) : -1;
    const selected = index >= 0 ? highlights[index] : null;
    const canStep = highlights.length > 1;

    function goAdjacent(delta: number) {
        if (!canStep || index < 0) return;
        const next = index + delta;
        if (next < 0 || next >= highlights.length) return;
        onNavigate(highlights[next]._id);
    }

    return (
        <Modal isOpen={Boolean(selected)} onClose={onClose} size="full" bodyScroll={false} hideDefaultHeader>
            {selected && (
                <div className="relative flex h-[min(90vh,960px)] max-h-[90vh] w-full flex-1 min-h-0 flex-col bg-black lg:flex-row">
                    <span className="sr-only">{selected.title}</span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute left-2 top-2 z-[60] flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white/80 backdrop-blur-md transition-colors hover:border-primary/40 hover:bg-white/10 hover:text-white"
                        aria-label="Fermer"
                    >
                        <X size={20} />
                    </button>

                    <div className="relative flex flex-1 min-h-0 min-w-0 items-center justify-center overflow-hidden border-b border-white/10 px-1 pt-11 pb-1 sm:px-2 sm:pt-10 sm:pb-2 lg:border-b-0 lg:border-r">
                        <div className="flex h-full min-h-0 w-full max-w-[min(1100px,100%)] items-center justify-center gap-1 sm:gap-2 md:gap-3">
                            {canStep && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="!h-10 !w-10 sm:!h-11 sm:!w-11 !p-0 shrink-0 rounded-full border-white/15 bg-white/5 text-white/80 hover:border-primary/45 hover:text-primary hidden sm:inline-flex"
                                    onClick={() => goAdjacent(-1)}
                                    aria-label="Clip précédent"
                                >
                                    <ChevronLeft size={20} />
                                </Button>
                            )}

                            <div className="flex h-full min-h-0 flex-col items-center justify-center gap-2">
                                <div
                                    className="relative mx-auto w-full max-w-[min(580px,94vw)] sm:max-w-[min(600px,92vw)] lg:max-w-[min(620px,calc(94vw-24rem))] aspect-[9/16] max-h-[min(82vh,880px)] overflow-hidden rounded-2xl bg-black shadow-[0_0_0_1px_rgba(0,255,135,0.15),0_16px_56px_rgba(0,0,0,0.85)] ring-1 ring-white/10"
                                >
                                    <div className="pointer-events-none absolute inset-0 z-[2] rounded-2xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]" />
                                    <video
                                        key={selected._id}
                                        src={resolveBackendAssetUrl(selected.clipUrl)}
                                        className="h-full w-full object-cover bg-black"
                                        controls
                                        playsInline
                                        autoPlay
                                    />
                                </div>
                                {canStep && (
                                    <>
                                        <div className="flex w-full max-w-[min(600px,94vw)] items-center justify-center gap-2 sm:hidden">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="!h-9 flex-1 rounded-lg border-white/15 text-xs"
                                                onClick={() => goAdjacent(-1)}
                                            >
                                                <ChevronLeft size={16} className="mr-0.5" /> Préc.
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="!h-9 flex-1 rounded-lg border-white/15 text-xs"
                                                onClick={() => goAdjacent(1)}
                                            >
                                                Suiv. <ChevronRight size={16} className="ml-0.5" />
                                            </Button>
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 tabular-nums">
                                            {index + 1} / {highlights.length}
                                        </p>
                                    </>
                                )}
                            </div>

                            {canStep && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="!h-10 !w-10 sm:!h-11 sm:!w-11 !p-0 shrink-0 rounded-full border-white/15 bg-white/5 text-white/80 hover:border-primary/45 hover:text-primary hidden sm:inline-flex"
                                    onClick={() => goAdjacent(1)}
                                    aria-label="Clip suivant"
                                >
                                    <ChevronRight size={20} />
                                </Button>
                            )}
                        </div>
                    </div>

                    <aside className="flex w-full shrink-0 flex-col bg-[#070809] min-h-0 max-h-[40vh] lg:h-auto lg:max-h-none lg:w-[380px] xl:w-[400px] lg:border-l border-white/10">
                        <div className="flex min-h-0 flex-1 flex-col px-4 py-3 sm:px-5 sm:py-4">
                            <div className="mb-3 shrink-0 space-y-2 border-b border-white/[0.06] pb-3">
                                <h2 className="font-black uppercase tracking-tighter text-white text-base leading-tight line-clamp-2">
                                    {selected.title}
                                </h2>
                                <span className="text-[10px] text-white/45">
                                    {highlightCreatorLabel(selected.creator)} · {highlightClipDurationLabel(selected)}
                                </span>
                            </div>
                            <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/[0.08] bg-black/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-4 sm:p-5">
                                <HighlightEngagement
                                    key={selected._id}
                                    highlightId={selected._id}
                                    layout="embedded"
                                />
                            </div>
                            {selected.description ? (
                                <p className="mt-3 shrink-0 text-xs text-white/50 line-clamp-4">{selected.description}</p>
                            ) : null}
                        </div>
                    </aside>
                </div>
            )}
        </Modal>
    );
}
