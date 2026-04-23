/**
 * Per-scouter reel engagement (likes, saved, comments) until backend routes exist.
 * Keyed by logged-in user id in localStorage.
 */

export interface ReelComment {
    id: string;
    text: string;
    createdAt: string;
}

export interface ReelEngagementState {
    /** videoId -> scouter liked */
    likes: Record<string, boolean>;
    /** videoId -> saved for later */
    saved: Record<string, boolean>;
    /** videoId -> scouter notes / comments (newest last in array) */
    comments: Record<string, ReelComment[]>;
}

const STORAGE_PREFIX = 'pi_scouter_reel_engagement_v1';

function storageKey(): string {
    try {
        const raw = localStorage.getItem('user');
        const u = raw ? JSON.parse(raw) : null;
        const id = u?.id ?? u?._id ?? 'anon';
        return `${STORAGE_PREFIX}_${id}`;
    } catch {
        return `${STORAGE_PREFIX}_anon`;
    }
}

export function loadReelEngagement(): ReelEngagementState {
    try {
        const raw = localStorage.getItem(storageKey());
        if (!raw) return { likes: {}, saved: {}, comments: {} };
        const p = JSON.parse(raw) as Partial<ReelEngagementState>;
        return {
            likes: typeof p.likes === 'object' && p.likes ? p.likes : {},
            saved: typeof p.saved === 'object' && p.saved ? p.saved : {},
            comments: typeof p.comments === 'object' && p.comments ? p.comments : {},
        };
    } catch {
        return { likes: {}, saved: {}, comments: {} };
    }
}

export function persistReelEngagement(state: ReelEngagementState): void {
    try {
        localStorage.setItem(storageKey(), JSON.stringify(state));
    } catch {
        /* quota / private mode */
    }
}

export function toggleReelLike(state: ReelEngagementState, videoId: string): ReelEngagementState {
    const next = { ...state, likes: { ...state.likes } };
    if (next.likes[videoId]) delete next.likes[videoId];
    else next.likes[videoId] = true;
    persistReelEngagement(next);
    return next;
}

export function toggleReelSaved(state: ReelEngagementState, videoId: string): ReelEngagementState {
    const next = { ...state, saved: { ...state.saved } };
    if (next.saved[videoId]) delete next.saved[videoId];
    else next.saved[videoId] = true;
    persistReelEngagement(next);
    return next;
}

export function addReelComment(state: ReelEngagementState, videoId: string, text: string): ReelEngagementState {
    const trimmed = text.trim();
    if (!trimmed) return state;
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const row: ReelComment = { id, text: trimmed, createdAt: new Date().toISOString() };
    const prev = state.comments[videoId] ?? [];
    const next = {
        ...state,
        comments: { ...state.comments, [videoId]: [...prev, row] },
    };
    persistReelEngagement(next);
    return next;
}

export function deleteReelComment(state: ReelEngagementState, videoId: string, commentId: string): ReelEngagementState {
    const prev = state.comments[videoId] ?? [];
    const filtered = prev.filter((c) => c.id !== commentId);
    const nextComments = { ...state.comments };
    if (filtered.length === 0) delete nextComments[videoId];
    else nextComments[videoId] = filtered;
    const next = { ...state, comments: nextComments };
    persistReelEngagement(next);
    return next;
}

export function isVideoSaved(state: ReelEngagementState, videoId: string): boolean {
    return Boolean(state.saved[videoId]);
}

export function commentCount(state: ReelEngagementState, videoId: string): number {
    return state.comments[videoId]?.length ?? 0;
}

/** Server total + local scouter like (optimistic until POST /video/:id/like exists). */
export function displayLikeCount(state: ReelEngagementState, videoId: string, serverLikes?: number): number {
    const base = serverLikes ?? 0;
    const iLiked = state.likes[videoId] ? 1 : 0;
    return base + iLiked;
}

export function formatCompactCount(n: number): string {
    if (n < 1000) return String(n);
    if (n < 1_000_000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K`.replace('.0K', 'K');
    return `${(n / 1_000_000).toFixed(1)}M`.replace('.0M', 'M');
}
