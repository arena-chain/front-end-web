import { getApiBase } from '../lib/apiBase';

export interface PlayerLevel {
    userId: string;
    level: number;
    currentXP: number;
    totalXP: number;
    xpToNextLevel: number;
}

export interface XpHistoryItem {
    amount: number;
    action: string;
    source: string;
    timestamp: string;
    multiplier?: number;
}

const API_BASE = `${getApiBase()}/level`;

class XPService {
    /**
     * Get level and XP data for a specific user
     */
    async getPlayerLevel(userId: string): Promise<PlayerLevel> {
        const response = await fetch(`${API_BASE}/player/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch player level');
        return response.json();
    }

    /**
     * (Admin) Grant XP to a user
     */
    async grantXP(userId: string, amount: number, reason: string): Promise<any> {
        const response = await fetch(`${API_BASE}/grant`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, amount, reason, type: 'MANUAL' }),
        });
        if (!response.ok) throw new Error('Failed to grant XP');
        return response.json();
    }

    /**
     * (Admin) Create an event boost
     */
    async createBoost(multiplier: number, expiresAt: Date, reason: string): Promise<any> {
        const response = await fetch(`${API_BASE}/boost`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ multiplier, expiresAt, reason }),
        });
        if (!response.ok) throw new Error('Failed to create boost');
        return response.json();
    }
}

export default new XPService();
