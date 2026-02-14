import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface League {
    _id: string;
    name: string;
    gameId: string;
    tier: string;
    mode: string;
    regionFilter: string;
    regionValue?: string;
    startDate: string;
    endDate: string;
    maxParticipants: number;
    minElo: number;
    status: string;
    rewards?: { rank: number; prize: string; points: number }[];
    supervisedBy?: string[];
    rewardsDistributed?: boolean;
}

export interface LeagueParticipant {
    _id: string;
    leagueId: string;
    playerId: {
        _id: string;
        nickname: string;
        email: string;
        region?: string;
        avatar?: string;
    };
    rankPoints: number;
    matchesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    currentStanding: number;
}

export const leagueService = {
    getAllLeagues: async () => {
        const response = await axios.get(`${API_URL}/leagues`);
        return response.data;
    },

    getLeagueById: async (id: string) => {
        const response = await axios.get(`${API_URL}/leagues/${id}`);
        return response.data;
    },

    getLeagueStandings: async (id: string) => {
        const response = await axios.get(`${API_URL}/leagues/${id}/standings`);
        return response.data;
    },

    registerForLeague: async (id: string) => {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/leagues/${id}/register`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getMyLeagues: async () => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/leagues/my-registrations`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};
