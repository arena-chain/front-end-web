const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface ChatMessageRecord {
    _id: string;
    channelId: string;
    senderId?: string | null;
    senderNickname: string;
    senderRole: string;
    message: string;
    createdAt?: string;
    updatedAt?: string;
}

export const chatService = {
    async getChannelMessages(channelId: string, limit = 50): Promise<ChatMessageRecord[]> {
        const response = await fetch(`${API_URL}/chat/channel/${channelId}?limit=${limit}`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Failed to load chat messages');
        }

        return response.json() as Promise<ChatMessageRecord[]>;
    },
};
