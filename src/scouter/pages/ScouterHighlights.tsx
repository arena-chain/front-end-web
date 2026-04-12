import { useState, useEffect } from 'react';
import { Sparkles, Play } from 'lucide-react';
import { highlightService, type HighlightRecord } from '../../services/highlight.service';
import { resolveBackendAssetUrl } from '../../lib/apiBase';
import { sortPublicHighlights, highlightCreatorLabel, rankHighlightsByEngagement } from '../lib/scouterHighlightUtils';
import { MediaEngagementStrip } from '../../components/highlights/MediaEngagementStrip';
import { ScouterHighlightDetailModal } from '../components/ScouterHighlightDetailModal';

export default function ScouterHighlights() {
    const [clips, setClips] = useState<HighlightRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeClipId, setActiveClipId] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        highlightService
            .listPublic()
            .then((list) => sortPublicHighlights(Array.isArray(list) ? list : []))
            .then((sorted) => rankHighlightsByEngagement(sorted))
            .catch(() => [] as HighlightRecord[])
            .then((h) => {
                if (!cancelled) setClips(h);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const stripSkeleton = (
        <div className="flex gap-6 overflow-hidden pb-2 sm:gap-7">
            {[1, 2, 3, 4, 5].map((i) => (
                <div
                    key={i}
                    className="shrink-0 w-[200px] sm:w-[220px] aspect-[9/16] rounded-2xl bg-white/5 animate-pulse border border-white/5"
                />
            ))}
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div>
                <div className="flex items-center gap-2 text-scout-cyan/90 text-xs font-bold uppercase tracking-widest mb-2">
                    <Sparkles size={14} className="text-scout-amber" />
                    Public pool
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Highlights</h1>
                <p className="text-white/50 text-sm mt-1 max-w-xl">
                    Public clips ranked by reactions (likes, comments, saves) — the most active appear first. Open a card for
                    the full viewer.
                </p>
                {!loading && (
                    <p className="text-[11px] font-bold uppercase tracking-wider text-white/35 mt-3">
                        {clips.length} clip{clips.length === 1 ? '' : 's'}
                    </p>
                )}
            </div>

            {loading ? (
                stripSkeleton
            ) : clips.length === 0 ? (
                <div className="rounded-xl border border-dashed border-primary/20 bg-primary/[0.03] px-6 py-16 text-center text-sm text-white/45">
                    No public highlight clips yet. They appear after processing.
                </div>
            ) : (
                <div className="relative group/carousel flex gap-6 overflow-x-auto pb-3 scroll-smooth snap-x snap-mandatory sm:gap-7 [-ms-overflow-style:none] [scrollbar-width:thin] [scrollbar-color:rgba(34,211,238,0.35)_transparent] [-webkit-overflow-scrolling:touch]">
                    {clips.map((h) => (
                        <button
                            key={h._id}
                            type="button"
                            onClick={() => setActiveClipId(h._id)}
                            className="group/card shrink-0 w-[200px] sm:w-[220px] snap-start text-left rounded-2xl border border-white/10 bg-black/50 overflow-hidden hover:border-primary/45 hover:shadow-[0_0_28px_rgba(0,255,135,0.14)] transition-all duration-300"
                        >
                            <div className="relative aspect-[9/16] w-full bg-black">
                                {h.clipUrl ? (
                                    <video
                                        src={resolveBackendAssetUrl(h.clipUrl)}
                                        className="h-full w-full object-cover opacity-92 transition-opacity group-hover/card:opacity-100"
                                        muted
                                        playsInline
                                        preload="metadata"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-scout-violet-deep/50 to-black">
                                        <Sparkles className="h-10 w-10 text-primary/40" />
                                    </div>
                                )}
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover/card:opacity-100">
                                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-black shadow-lg shadow-primary/40">
                                        <Play size={22} className="ml-0.5" fill="currentColor" />
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-2 p-3">
                                <p className="line-clamp-2 text-xs font-bold leading-tight text-white">{h.title}</p>
                                <p className="line-clamp-1 text-[9px] font-bold uppercase tracking-wider text-white/35">
                                    {highlightCreatorLabel(h.creator)}
                                </p>
                                <div className="flex flex-wrap items-center justify-end gap-1">
                                    <MediaEngagementStrip kind="highlight" id={h._id} />
                                </div>
                                {h.description?.trim() ? (
                                    <p className="line-clamp-3 border-t border-white/[0.06] pt-2 text-left text-[10px] leading-snug text-white/50">
                                        {h.description.trim()}
                                    </p>
                                ) : null}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            <ScouterHighlightDetailModal
                highlights={clips}
                activeHighlightId={activeClipId}
                onClose={() => setActiveClipId(null)}
                onNavigate={setActiveClipId}
            />
        </div>
    );
}
