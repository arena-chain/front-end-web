import axios from 'axios';
import { getApiBase } from '../lib/apiBase';

const API = `${getApiBase()}/video`;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export interface VideoRecord {
    _id: string;
    title: string;
    description?: string;
    url: string;
    thumbnailUrl?: string;
    uploader: string | { _id: string; nickname?: string; email?: string; username?: string };
    game?: string | { _id: string; title?: string; genre?: string };
    views?: number;
    duration?: number;
    createdAt: string;
    updatedAt?: string;
}

export const videoService = {
    list: async (params?: { uploader?: string; game?: string }): Promise<VideoRecord[]> => {
        const res = await axios.get(API, { ...auth(), params });
        return Array.isArray(res.data) ? res.data : [];
    },

    upload: async (body: {
        file: File;
        title: string;
        description?: string;
        uploader?: string;
        game?: string;
        thumbnailUrl?: string;
        duration?: number;
    }): Promise<VideoRecord> => {
        const fd = new FormData();
        fd.append('file', body.file);
        fd.append('title', body.title);
        if (body.description) fd.append('description', body.description);
        if (body.uploader) fd.append('uploader', body.uploader);
        if (body.game) fd.append('game', body.game);
        if (body.thumbnailUrl) fd.append('thumbnailUrl', body.thumbnailUrl);
        if (body.duration != null) fd.append('duration', String(body.duration));
        const res = await axios.post(`${API}/upload`, fd, auth());
        return res.data;
    },

    remove: async (id: string): Promise<void> => {
        await axios.delete(`${API}/${id}`, auth());
    },
};

