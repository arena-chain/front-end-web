import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const LeagueLevel = {
    INTERNATIONAL: 'INTERNATIONAL',
    CONTINENTAL: 'CONTINENTAL',
    NATIONAL: 'NATIONAL',
    REGIONAL: 'REGIONAL',
} as const;
export type LeagueLevel = typeof LeagueLevel[keyof typeof LeagueLevel];

export const LeagueFormat = {
    ROUND_ROBIN: 'ROUND_ROBIN',
    GROUPS: 'GROUPS',
    SWISS: 'SWISS',
    LADDER: 'LADDER',
} as const;
export type LeagueFormat = typeof LeagueFormat[keyof typeof LeagueFormat];

export const LeagueStatus = {
    REGISTRATION: 'REGISTRATION',
    ONGOING: 'ONGOING',
    FINISHED: 'FINISHED',
} as const;
export type LeagueStatus = typeof LeagueStatus[keyof typeof LeagueStatus];

export interface League {
    _id: string;
    name: string;
    level: LeagueLevel;
    regionId: string; // The specific region value (e.g., "Africa", "France", "Global")
    gameId: string;
    format: LeagueFormat;
    startDate: string; // ISO Date String
    endDate: string;   // ISO Date String
    maxTeams: number;
    status: LeagueStatus;
    // Keeping existing optional fields if they are still relevant for frontend display, 
    // but prioritizing new spec fields
    rewards?: { rank: number; prize: string; points: number }[];
    supervisedBy?: string[];
    rewardsDistributed?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface LeagueParticipant {
    _id: string;
    leagueId: string;
    teamId?: {
        _id: string;
        name: string;
        logo: string;
        region?: string;
    } | string; // Supporting populated object or just ID
    playerId?: {
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
    // Helper to get display name
    name?: string;
    avatar?: string;
}

export interface RegionEnums {
    continents: string[];
    countries: string[];
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

    createLeague: async (leagueData: Partial<League>) => {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/leagues`, leagueData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    updateLeague: async (id: string, leagueData: Partial<League>) => {
        const token = localStorage.getItem('token');
        const response = await axios.patch(`${API_URL}/leagues/${id}`, leagueData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    deleteLeague: async (id: string) => {
        const token = localStorage.getItem('token');
        const response = await axios.delete(`${API_URL}/leagues/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getLeagueStandings: async (id: string) => {
        const response = await axios.get(`${API_URL}/standings?leagueId=${id}`);
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
    },

    getRegionEnums: async (): Promise<RegionEnums> => {
        // Attempt to fetch from backend, fallback to hardcoded if not yet implemented
        try {
            // Check if the endpoint exists, otherwise catch and return mocked data
            // The spec says GET /leagues/enums/regions
            const response = await axios.get(`${API_URL}/leagues/enums/regions`);
            return response.data;
        } catch (error) {
            console.warn('Failed to fetch region enums from backend, using fallback data.', error);
            return {
                continents: ["Africa", "Asia", "Europe", "North America", "Oceania", "South America", "Antarctica"],
                countries: ["Afghanistan", "Albania", "Algeria", "France", "Tunisia", "United States", "Zimbabwe"] // truncated list for fallback
            };
        }
    },

    distributeRewards: async (id: string) => {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/leagues/${id}/distribute-rewards`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};
