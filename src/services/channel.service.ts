import { getApiBase } from '../lib/apiBase';

const API_URL = getApiBase();

export interface ChannelPayload {
    name: string;
    description?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    categories?: string[];
}

export interface ChannelRecord extends ChannelPayload {
    _id: string;
    ownerId: {
        _id: string;
        email?: string;
        nickname?: string;
    };
    subscriberCount: number;
    subscribers?: string[];
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
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

export const channelService = {
    /** All channels (public list — same as GET /channel) */
    async getAllChannels(): Promise<ChannelRecord[]> {
        const response = await fetch(`${API_URL}/channel`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        return parseResponse<ChannelRecord[]>(response);
    },

    async getMyChannel(): Promise<ChannelRecord | null> {
        const response = await fetch(`${API_URL}/channel/my`, {
            headers: authHeaders(),
        });

        if (response.status === 404) {
            return null;
        }

        return parseResponse<ChannelRecord | null>(response);
    },

    async createChannel(payload: ChannelPayload): Promise<ChannelRecord> {
        const response = await fetch(`${API_URL}/channel`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload),
        });

        return parseResponse<ChannelRecord>(response);
    },

    async updateChannel(id: string, payload: Partial<ChannelPayload>): Promise<ChannelRecord> {
        const response = await fetch(`${API_URL}/channel/${id}`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify(payload),
        });

        return parseResponse<ChannelRecord>(response);
    },

    async getChannel(id: string): Promise<ChannelRecord> {
        const response = await fetch(`${API_URL}/channel/${id}`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        return parseResponse<ChannelRecord>(response);
    },

    async subscribe(id: string): Promise<ChannelRecord> {
        const response = await fetch(`${API_URL}/channel/${id}/subscribe`, {
            method: 'POST',
            headers: authHeaders(),
        });

        return parseResponse<ChannelRecord>(response);
    },

    async unsubscribe(id: string): Promise<ChannelRecord> {
        const response = await fetch(`${API_URL}/channel/${id}/unsubscribe`, {
            method: 'POST',
            headers: authHeaders(),
        });

        return parseResponse<ChannelRecord>(response);
    },
};
