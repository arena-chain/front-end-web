import { getApiBase } from '../lib/apiBase';

export interface Mission {
    _id: string;
    title: string;
    description: string;
    type: 'daily' | 'weekly' | 'permanent';
    scope: 'individual' | 'friends';
    game: string;
    criteria: {
        type: string;
        target: number;
    };
    rewardType: 'xp' | 'tokens' | 'badge';
    rewardAmount: number;
    iconColor: string;
    userProgress?: {
        current: number;
        completed: boolean;
        claimed: boolean;
    };
}

export interface PlayerLevel {
    userId: string;
    level: number;
    currentXP: number;
    totalXP: number;
    xpToNextLevel: number;
}

const API_BASE = getApiBase();

class RewardsService {
    private async getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        };
    }

    // ── Missions ───────────────────────────────────────────────

    async getActiveMissions(): Promise<{ missions: Mission[]; dailyResetsAt: string; weeklyResetsAt: string }> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${API_BASE}/mission/active`, { headers });
        if (!response.ok) throw new Error('Failed to fetch active missions');
        return response.json();
    }

    async claimMissionReward(missionId: string): Promise<any> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${API_BASE}/mission/${missionId}/claim`, {
            method: 'POST',
            headers,
        });
        if (!response.ok) throw new Error('Failed to claim reward');
        return response.json();
    }

    // ── Leveling (XP) ──────────────────────────────────────────

    async getPlayerLevel(userId: string): Promise<PlayerLevel> {
        const response = await fetch(`${API_BASE}/level/player/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch player level');
        return response.json();
    }
}

export default new RewardsService();
