import { useEffect, useState } from 'react';
import { Heart, MessageCircle, Bookmark } from 'lucide-react';
import { highlightService } from '../../services/highlight.service';
import { videoService } from '../../services/video.service';

type Kind = 'highlight' | 'video';

export function MediaEngagementStrip({
    kind,
    id,
    className = '',
}: {
    kind: Kind;
    id: string;
    className?: string;
}) {
    const [likes, setLikes] = useState<number | null>(null);
    const [comments, setComments] = useState<number | null>(null);
    const [saves, setSaves] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        const svc = kind === 'highlight' ? highlightService : videoService;
        void svc
            .getEngagement(id)
            .then((e) => {
                if (!cancelled) {
                    setLikes(e.likeCount);
                    setComments(e.commentCount);
                    if (kind === 'highlight') setSaves(e.saveCount ?? 0);
                    else setSaves(null);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setLikes(0);
                    setComments(0);
                    if (kind === 'highlight') setSaves(0);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [kind, id]);

    const loading = likes === null || comments === null || (kind === 'highlight' && saves === null);
    if (loading) {
        return (
            <div className={`flex gap-3 ${className}`}>
                <span className="h-3 w-10 rounded bg-white/10 animate-pulse" />
                <span className="h-3 w-10 rounded bg-white/10 animate-pulse" />
                {kind === 'highlight' ? <span className="h-3 w-10 rounded bg-white/10 animate-pulse" /> : null}
            </div>
        );
    }

    return (
        <div
            className={`inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-black uppercase tracking-wider text-white/55 ${className}`}
        >
            <span className="inline-flex items-center gap-1 text-primary/90">
                <Heart size={12} className="shrink-0" />
                {likes ?? 0}
            </span>
            <span className="inline-flex items-center gap-1 text-white/45">
                <MessageCircle size={12} className="shrink-0" />
                {comments ?? 0}
            </span>
            {kind === 'highlight' ? (
                <span className="inline-flex items-center gap-1 text-scout-cyan/80">
                    <Bookmark size={12} className="shrink-0" />
                    {saves ?? 0}
                </span>
            ) : null}
        </div>
    );
}
