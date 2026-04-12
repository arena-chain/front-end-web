import axios from 'axios';
import { getApiBase } from '../lib/apiBase';

const API = `${getApiBase()}/highlights`;
/** Sends Bearer only when a token exists so optional-auth endpoints are not sent `Bearer null`. */
const auth = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export interface HighlightRecord {
    _id: string;
    title: string;
    description?: string;
    video: unknown;
    startTime: number;
    endTime: number;
    creator: string | { _id?: string; id?: string; username?: string; nickname?: string; email?: string };
    clipUrl: string;
    visibility: 'public' | 'private';
    createdAt?: string;
    updatedAt?: string;
}

export interface HighlightEngagementSummary {
    likeCount: number;
    commentCount: number;
    likedByMe: boolean;
    /** Saved highlights (clip bookmarks) — highlights API only */
    saveCount?: number;
    savedByMe?: boolean;
}

/** One comment node; `replies` are direct answers (Facebook-style thread, one level). */
export interface HighlightCommentNode {
    _id: string;
    body: string;
    highlight?: string;
    video?: string;
    author: string | { _id?: string; nickname?: string; email?: string };
    parentComment: string | null;
    createdAt?: string;
    updatedAt?: string;
    likeCount: number;
    likedByMe: boolean;
    replies: HighlightCommentNode[];
}

export const highlightService = {
    listPublic: async (): Promise<HighlightRecord[]> => {
        const res = await axios.get(`${API}/public`, auth());
        return Array.isArray(res.data) ? res.data : [];
    },

    listByVideo: async (videoId: string, publicOnly = false): Promise<HighlightRecord[]> => {
        const params = publicOnly ? { publicOnly: 'true' } : {};
        const res = await axios.get(`${API}/video/${encodeURIComponent(videoId)}`, {
            ...auth(),
            params,
        });
        return Array.isArray(res.data) ? res.data : [];
    },

    updateVisibility: async (id: string, visibility: 'public' | 'private'): Promise<HighlightRecord> => {
        const res = await axios.patch(`${API}/${id}/visibility`, { visibility }, auth());
        return res.data;
    },

    updateDetails: async (
        id: string,
        body: { title?: string; description?: string },
    ): Promise<HighlightRecord> => {
        const res = await axios.patch(`${API}/${id}/details`, body, auth());
        return res.data;
    },

    remove: async (id: string): Promise<void> => {
        await axios.delete(`${API}/${id}`, auth());
    },

    /** Re-queue highlight generation (same as upload hook). Needs Redis + worker. */
    enqueue: async (
        videoId: string,
        uploaderId: string,
        visibility?: 'public' | 'private',
    ): Promise<{ message: string; jobId?: string }> => {
        const params = visibility ? { visibility } : {};
        const res = await axios.post(
            `${API}/enqueue/${encodeURIComponent(videoId)}/${encodeURIComponent(uploaderId)}`,
            null,
            { ...auth(), params },
        );
        return res.data;
    },

    getEngagement: async (highlightId: string): Promise<HighlightEngagementSummary> => {
        const res = await axios.get(`${API}/${encodeURIComponent(highlightId)}/engagement`, auth());
        return res.data;
    },

    listComments: async (highlightId: string): Promise<HighlightCommentNode[]> => {
        const res = await axios.get(`${API}/${encodeURIComponent(highlightId)}/comments`, auth());
        return Array.isArray(res.data) ? res.data : [];
    },

    addComment: async (
        highlightId: string,
        body: string,
        parentCommentId?: string,
    ): Promise<HighlightCommentNode> => {
        const res = await axios.post(
            `${API}/${encodeURIComponent(highlightId)}/comments`,
            { body, ...(parentCommentId ? { parentCommentId } : {}) },
            auth(),
        );
        return res.data;
    },

    likeComment: async (commentId: string): Promise<{ liked: boolean; likeCount: number }> => {
        const res = await axios.post(
            `${API}/comments/${encodeURIComponent(commentId)}/like`,
            null,
            auth(),
        );
        return res.data;
    },

    unlikeComment: async (commentId: string): Promise<{ liked: boolean; likeCount: number }> => {
        const res = await axios.delete(`${API}/comments/${encodeURIComponent(commentId)}/like`, auth());
        return res.data;
    },

    like: async (highlightId: string): Promise<{ liked: boolean; likeCount: number }> => {
        const res = await axios.post(`${API}/${encodeURIComponent(highlightId)}/like`, null, auth());
        return res.data;
    },

    unlike: async (highlightId: string): Promise<{ liked: boolean; likeCount: number }> => {
        const res = await axios.delete(`${API}/${encodeURIComponent(highlightId)}/like`, auth());
        return res.data;
    },

    deleteComment: async (commentId: string): Promise<void> => {
        await axios.delete(`${API}/comments/${encodeURIComponent(commentId)}`, auth());
    },

    saveHighlight: async (highlightId: string): Promise<HighlightEngagementSummary> => {
        const res = await axios.post(`${API}/${encodeURIComponent(highlightId)}/save`, null, auth());
        return res.data;
    },

    unsaveHighlight: async (highlightId: string): Promise<HighlightEngagementSummary> => {
        const res = await axios.delete(`${API}/${encodeURIComponent(highlightId)}/save`, auth());
        return res.data;
    },
};
