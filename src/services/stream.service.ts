const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface StreamPayload {
    channelId: string;
    title: string;
    description?: string;
    streamUrl?: string;
    playbackUrl?: string;
    thumbnailUrl?: string;
    tags?: string[];
    isLive?: boolean;
    scheduledStartTime?: string;
    scheduledEndTime?: string;
}

export interface StreamRecord {
    _id: string;
    channelId: {
        _id: string;
        name: string;
        avatarUrl?: string;
    };
    title: string;
    description?: string;
    streamUrl?: string;
    playbackUrl?: string;
    thumbnailUrl?: string;
    tags?: string[];
    isLive?: boolean;
    streamerId: {
        _id: string;
        nickname?: string;
        email?: string;
    };
    viewerCount: number;
    startedAt?: string;
    endedAt?: string;
    createdAt?: string;
    updatedAt?: string;
    scheduledStartTime?: string;
    scheduledEndTime?: string;
}

function authHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

async function parseResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Request failed');
    }

    return response.json() as Promise<T>;
}

export const streamService = {
    async getMyStreams(): Promise<StreamRecord[]> {
        const response = await fetch(`${API_URL}/stream/my`, {
            headers: authHeaders(),
        });
        return parseResponse<StreamRecord[]>(response);
    },

    async createStream(payload: StreamPayload): Promise<StreamRecord> {
        const response = await fetch(`${API_URL}/stream`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload),
        });
        return parseResponse<StreamRecord>(response);
    },

    async updateStream(id: string, payload: Partial<StreamPayload>): Promise<StreamRecord> {
        const response = await fetch(`${API_URL}/stream/${id}`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify(payload),
        });
        return parseResponse<StreamRecord>(response);
    },

    async startStream(id: string): Promise<StreamRecord> {
        const response = await fetch(`${API_URL}/stream/${id}/start`, {
            method: 'PATCH',
            headers: authHeaders(),
        });
        return parseResponse<StreamRecord>(response);
    },

    async endStream(id: string): Promise<StreamRecord> {
        const response = await fetch(`${API_URL}/stream/${id}/end`, {
            method: 'PATCH',
            headers: authHeaders(),
        });
        return parseResponse<StreamRecord>(response);
    },

    async deleteStream(id: string): Promise<StreamRecord> {
        const response = await fetch(`${API_URL}/stream/${id}`, {
            method: 'DELETE',
            headers: authHeaders(),
        });
        return parseResponse<StreamRecord>(response);
    },

    async getLiveStreams(): Promise<StreamRecord[]> {
        const response = await fetch(`${API_URL}/stream/live`, {
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });
        return parseResponse<StreamRecord[]>(response);
    },

    async getStreamsByChannel(channelId: string): Promise<StreamRecord[]> {
        const response = await fetch(`${API_URL}/stream/channel/${channelId}`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return parseResponse<StreamRecord[]>(response);
    },
};
