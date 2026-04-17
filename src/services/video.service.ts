import axios from 'axios';
import { getApiBase } from '../lib/apiBase';
import type { HighlightCommentNode, HighlightEngagementSummary } from './highlight.service';

const API = `${getApiBase()}/video`;
const auth = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export interface VideoRecord {
    _id: string;
    title: string;
    description?: string;
    url: string;
    thumbnailUrl?: string;
    uploader: string | { _id: string; nickname?: string; email?: string; username?: string };
    game?: string | { _id: string; title?: string; genre?: string };
    views?: number;
    /** Server-side like count when API provides it */
    likes?: number;
    duration?: number;
    /** When public, listed on the uploader's channel pages */
    channelVisibility?: 'public' | 'private';
    createdAt: string;
    updatedAt?: string;
}

export type VideoUploadResult = {
    video: VideoRecord;
    highlightJobId: string | null;
};

export const videoService = {
    list: async (params?: {
        uploader?: string;
        game?: string;
        /** Only videos marked visible on channel */
        channelPublic?: boolean;
    }): Promise<VideoRecord[]> => {
        const query: Record<string, string> = {};
        if (params?.uploader) query.uploader = params.uploader;
        if (params?.game) query.game = params.game;
        if (params?.channelPublic) query.channelPublic = 'true';
        const res = await axios.get(API, { ...auth(), params: query });
        return Array.isArray(res.data) ? res.data : [];
    },

    getById: async (id: string): Promise<VideoRecord> => {
        const res = await axios.get(`${API}/${encodeURIComponent(id)}`, auth());
        return res.data;
    },

    upload: async (body: {
        file: File;
        title: string;
        description?: string;
        uploader?: string;
        game?: string;
        thumbnailUrl?: string;
        duration?: number;
        /** BullMQ highlight job visibility (default server-side: private) */
        highlightsVisibility?: 'public' | 'private';
        /** Show source video on channel page when public */
        channelVisibility?: 'public' | 'private';
    }): Promise<VideoUploadResult> => {
        const fd = new FormData();
        fd.append('file', body.file);
        fd.append('title', body.title);
        if (body.description) fd.append('description', body.description);
        if (body.uploader) fd.append('uploader', body.uploader);
        if (body.game) fd.append('game', body.game);
        if (body.thumbnailUrl) fd.append('thumbnailUrl', body.thumbnailUrl);
        if (body.duration != null) fd.append('duration', String(body.duration));
        if (body.highlightsVisibility) fd.append('highlightsVisibility', body.highlightsVisibility);
        if (body.channelVisibility) fd.append('channelVisibility', body.channelVisibility);
        const res = await axios.post(`${API}/upload`, fd, auth());
        const data = res.data as VideoUploadResult | VideoRecord;
        if (data && typeof data === 'object' && 'video' in data && data.video) {
            return {
                video: data.video as VideoRecord,
                highlightJobId: (data as VideoUploadResult).highlightJobId ?? null,
            };
        }
        return { video: data as VideoRecord, highlightJobId: null };
    },

    update: async (
        id: string,
        body: {
            title?: string;
            description?: string;
            channelVisibility?: 'public' | 'private';
        },
    ): Promise<VideoRecord> => {
        const res = await axios.patch(`${API}/${encodeURIComponent(id)}`, body, auth());
        return res.data;
    },

    remove: async (id: string): Promise<void> => {
        await axios.delete(`${API}/${id}`, auth());
    },

    getEngagement: async (videoId: string): Promise<HighlightEngagementSummary> => {
        const res = await axios.get(`${API}/${encodeURIComponent(videoId)}/engagement`, auth());
        return res.data;
    },

    listComments: async (videoId: string): Promise<HighlightCommentNode[]> => {
        const res = await axios.get(`${API}/${encodeURIComponent(videoId)}/comments`, auth());
        return Array.isArray(res.data) ? res.data : [];
    },

    addComment: async (
        videoId: string,
        body: string,
        parentCommentId?: string,
    ): Promise<HighlightCommentNode> => {
        const res = await axios.post(
            `${API}/${encodeURIComponent(videoId)}/comments`,
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

    like: async (videoId: string): Promise<{ liked: boolean; likeCount: number }> => {
        const res = await axios.post(`${API}/${encodeURIComponent(videoId)}/like`, null, auth());
        return res.data;
    },

    unlike: async (videoId: string): Promise<{ liked: boolean; likeCount: number }> => {
        const res = await axios.delete(`${API}/${encodeURIComponent(videoId)}/like`, auth());
        return res.data;
    },

    deleteComment: async (commentId: string): Promise<void> => {
        await axios.delete(`${API}/comments/${encodeURIComponent(commentId)}`, auth());
    },
};

