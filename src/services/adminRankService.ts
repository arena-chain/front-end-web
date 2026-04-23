import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface RankGeneralConfig {
    eloWinAmount: number;
    eloLossAmount: number;
    startingElo: number;
    isActive: boolean;
}

export interface RankTierConfig {
    _id?: string;
    tier: string;
    minElo: number;
    maxElo?: number;
    division: number;
    color?: string;
    icon?: string;
    divisions: number;
    isActive: boolean;
    displayOrder: number;
}

export const adminRankService = {
    getGeneralConfig: async (gameId?: string): Promise<RankGeneralConfig> => {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/rank/config`, {
            params: { gameId },
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    updateGeneralConfig: async (data: Partial<RankGeneralConfig>, gameId?: string): Promise<RankGeneralConfig> => {
        const token = localStorage.getItem('token');
        const res = await axios.post(`${API_URL}/rank/config`, data, {
            params: { gameId },
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    getTierConfigs: async (gameId?: string): Promise<RankTierConfig[]> => {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/rank/tiers`, {
            params: { gameId },
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    updateTierConfig: async (tier: string, data: Partial<RankTierConfig>, gameId?: string): Promise<RankTierConfig> => {
        const token = localStorage.getItem('token');
        const res = await axios.patch(`${API_URL}/rank/tiers/${tier}`, data, {
            params: { gameId },
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    }
};
