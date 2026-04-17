import { getApiBase } from '../lib/apiBase';

export interface PlayerRank {
    _id: string;
    elo: number;
    level: number;
    tier: string;
    division: number;
    wins: number;
    losses: number;
    winRate: number;
    totalMatches: number;
    currentStreak: number;
    user: {
        _id: string;
        nickname: string;
        avatar?: string;
        country?: string;
    };
    game: {
        _id: string;
        title: string;
    };
}

const API_BASE = `${getApiBase()}/rank`;

class RankingService {
    private async getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        };
    }

    async getLeaderboard(gameId: string, season?: number, limit: number = 100): Promise<PlayerRank[]> {
        let url = `${API_BASE}/leaderboard/${gameId}?limit=${limit}`;
        if (season) url += `&season=${season}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch leaderboard');
        return response.json();
    }

    async getMyRanks(): Promise<PlayerRank[]> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${API_BASE}/me/all`, { headers });
        if (!response.ok) throw new Error('Failed to fetch my ranks');
        return response.json();
    }

    async getPlayerRank(userId: string, gameId: string): Promise<PlayerRank> {
        const response = await fetch(`${API_BASE}/${userId}/${gameId}`);
        if (!response.ok) throw new Error('Failed to fetch player rank');
        return response.json();
    }

    async getRankHistory(userId: string, gameId: string, limit: number = 50): Promise<any[]> {
        const response = await fetch(`${API_BASE}/history/${userId}/${gameId}?limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch rank history');
        return response.json();
    }
}

export default new RankingService();
