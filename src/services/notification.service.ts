import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function authHeaders() {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
}

export interface AppNotification {
    _id: string;
    title: string;
    message: string;
    type: string;
    category: string;
    isRead: boolean;
    resourceDeleted: boolean;
    archived: boolean;
    link?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
}

export interface NotificationPreferences {
    matches: boolean;
    leagues: boolean;
    social: boolean;
    achievements: boolean;
    streams: boolean;
    security: boolean;
    emailEnabled: boolean;
    emailMatches: boolean;
    emailLeagues: boolean;
    emailSocial: boolean;
    emailAchievements: boolean;
    emailStreams: boolean;
    pushEnabled: boolean;
}

const notificationService = {
    async getNotifications(includeArchived = false): Promise<AppNotification[]> {
        const res = await axios.get(`${API_URL}/notifications`, {
            headers: authHeaders(),
            params: includeArchived ? { archived: 'true' } : {},
        });
        return res.data;
    },

    async getUnreadCount(): Promise<number> {
        const res = await axios.get(`${API_URL}/notifications/unread-count`, {
            headers: authHeaders(),
        });
        return res.data;
    },

    async markRead(id: string): Promise<void> {
        await axios.patch(`${API_URL}/notifications/${id}/read`, {}, { headers: authHeaders() });
    },

    async markAllRead(): Promise<void> {
        await axios.patch(`${API_URL}/notifications/read-all`, {}, { headers: authHeaders() });
    },

    async deleteOne(id: string): Promise<void> {
        await axios.delete(`${API_URL}/notifications/${id}`, { headers: authHeaders() });
    },

    async clearAll(): Promise<void> {
        await axios.delete(`${API_URL}/notifications/clear-all`, { headers: authHeaders() });
    },

    async getPreferences(): Promise<NotificationPreferences> {
        const res = await axios.get(`${API_URL}/notifications/preferences`, {
            headers: authHeaders(),
        });
        return res.data;
    },

    async savePreferences(prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
        const res = await axios.patch(`${API_URL}/notifications/preferences`, prefs, {
            headers: authHeaders(),
        });
        return res.data;
    },

    async registerDeviceToken(token: string, platform: 'fcm' | 'apns'): Promise<void> {
        await axios.post(
            `${API_URL}/notifications/device-token`,
            { token, platform },
            { headers: authHeaders() },
        );
    },
};

export default notificationService;
