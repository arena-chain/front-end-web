import { highlightService, type HighlightRecord } from '../../services/highlight.service';

/** Avoid hundreds of parallel GETs if the public catalog grows; raise when backend adds a trending endpoint. */
const MAX_HIGHLIGHTS_TO_SCORE = 120;

export function sortPublicHighlights(highlights: HighlightRecord[]): HighlightRecord[] {
    return [...highlights].sort((a, b) => {
        const tb = new Date(b.createdAt ?? b.updatedAt ?? 0).getTime();
        const ta = new Date(a.createdAt ?? a.updatedAt ?? 0).getTime();
        return tb - ta;
    });
}

export function highlightCreatorLabel(c: HighlightRecord['creator']): string {
    if (typeof c === 'object' && c) {
        return (c.nickname ?? c.username ?? c.email ?? 'Creator').trim();
    }
    return 'Creator';
}

/** Stable user id for filtering highlights by creator (matches profile / player user id). */
export function highlightCreatorUserId(c: HighlightRecord['creator']): string {
    if (!c || typeof c !== 'object') return String(c ?? '');
    return String((c as { _id?: string; id?: string })._id ?? (c as { id?: string }).id ?? '');
}

export function highlightClipDurationLabel(h: HighlightRecord): string {
    const sec = Math.max(0, (Number(h.endTime) || 0) - (Number(h.startTime) || 0));
    if (!Number.isFinite(sec) || sec <= 0) return '—';
    if (sec < 60) return `${Math.round(sec)}s`;
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Sorts public highlights by total reactions: likes + comments + saves (from {@link highlightService.getEngagement}).
 * Clips with more activity surface first; ties use newest `updatedAt` / `createdAt`.
 * If there are more than {@link MAX_HIGHLIGHTS_TO_SCORE} items, only the newest chunk is scored and the rest follow by date
 * (until the API exposes a dedicated trending feed).
 */
export async function rankHighlightsByEngagement(highlights: HighlightRecord[]): Promise<HighlightRecord[]> {
    if (highlights.length === 0) return [];

    const byRecency = sortPublicHighlights(highlights);
    const pool =
        byRecency.length > MAX_HIGHLIGHTS_TO_SCORE
            ? byRecency.slice(0, MAX_HIGHLIGHTS_TO_SCORE)
            : byRecency;
    const tail =
        byRecency.length > MAX_HIGHLIGHTS_TO_SCORE ? byRecency.slice(MAX_HIGHLIGHTS_TO_SCORE) : [];

    const scored = await Promise.all(
        pool.map(async (h) => {
            try {
                const e = await highlightService.getEngagement(h._id);
                const score =
                    (e.likeCount ?? 0) + (e.commentCount ?? 0) + (e.saveCount ?? 0);
                return { h, score };
            } catch {
                return { h, score: 0 };
            }
        }),
    );

    scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const tb = new Date(b.h.updatedAt ?? b.h.createdAt ?? 0).getTime();
        const ta = new Date(a.h.updatedAt ?? a.h.createdAt ?? 0).getTime();
        return tb - ta;
    });

    return [...scored.map((x) => x.h), ...tail];
}
