import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const LeagueLevel = {
    INTERNATIONAL: 'INTERNATIONAL',
    CONTINENTAL: 'CONTINENTAL',
    NATIONAL: 'NATIONAL',
    REGIONAL: 'REGIONAL',
} as const;
export type LeagueLevel = typeof LeagueLevel[keyof typeof LeagueLevel];

// ─── Interfaces ───────────────────────────────────────────────────────────────

/** Matches the POST /leagues CreateLeagueDto exactly */
export interface CreateLeaguePayload {
    name: string;
    level: LeagueLevel;
    regionId?: string;
    gameId: string;
    description?: string;
    logoUrl?: string;
}

/** Shape returned by GET /leagues and GET /leagues/:id */
export interface League {
    _id: string;
    name: string;
    level: LeagueLevel;
    regionId: string;
    gameId: string;
    description?: string;
    logoUrl?: string;
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
    } | string;
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
    name?: string;
    avatar?: string;
}

export interface RegionEnums {
    continents: string[];
    countries: string[];
}

// ─── Service ─────────────────────────────────────────────────────────────────

const authHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export const leagueService = {
    getAllLeagues: async (): Promise<League[]> => {
        const response = await axios.get(`${API_URL}/leagues`, { headers: authHeader() });
        const d = response.data;
        if (Array.isArray(d)) return d;
        if (d && Array.isArray(d.data)) return d.data;
        if (d && Array.isArray(d.leagues)) return d.leagues;
        return [];
    },

    getLeagueById: async (id: string): Promise<League> => {
        const response = await axios.get(`${API_URL}/leagues/${id}`, { headers: authHeader() });
        return response.data;
    },

    createLeague: async (payload: CreateLeaguePayload | FormData): Promise<League> => {
        const headers = authHeader();
        if (payload instanceof FormData) {
            const response = await axios.post(`${API_URL}/leagues`, payload, { headers });
            return response.data;
        }
        const response = await axios.post(`${API_URL}/leagues`, payload, { headers });
        return response.data;
    },

    updateLeague: async (id: string, payload: Partial<CreateLeaguePayload> | FormData): Promise<League> => {
        const headers = authHeader();
        if (payload instanceof FormData) {
            const response = await axios.patch(`${API_URL}/leagues/${id}`, payload, { headers });
            return response.data;
        }
        const response = await axios.patch(`${API_URL}/leagues/${id}`, payload, { headers });
        return response.data;
    },

    deleteLeague: async (id: string): Promise<void> => {
        await axios.delete(`${API_URL}/leagues/${id}`, { headers: authHeader() });
    },

    getLeagueStandings: async (id: string) => {
        const response = await axios.get(`${API_URL}/standings?leagueId=${id}`);
        return response.data;
    },

    getMyLeagues: async () => {
        const response = await axios.get(`${API_URL}/leagues/my-registrations`, { headers: authHeader() });
        return response.data;
    },

    getRegionEnums: async (): Promise<RegionEnums> => {
        try {
            const response = await axios.get(`${API_URL}/leagues/enums/regions`);
            return response.data;
        } catch {
            return {
                continents: ['Africa', 'Antarctica', 'Asia', 'Europe', 'North America', 'Oceania', 'South America'],
                countries: [
                    'Afghanistan', 'Algeria', 'Argentina', 'Australia', 'Austria', 'Belgium', 'Brazil',
                    'Canada', 'Chile', 'China', 'Colombia', 'Croatia', 'Czech Republic', 'Denmark',
                    'Egypt', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'India', 'Indonesia',
                    'Ireland', 'Israel', 'Italy', 'Japan', 'Jordan', 'Kazakhstan', 'Malaysia', 'Mexico',
                    'Morocco', 'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Pakistan', 'Peru',
                    'Philippines', 'Poland', 'Portugal', 'Romania', 'Russia', 'Saudi Arabia', 'Serbia',
                    'Singapore', 'South Africa', 'South Korea', 'Spain', 'Sweden', 'Switzerland',
                    'Thailand', 'Tunisia', 'Turkey', 'Ukraine', 'United Arab Emirates',
                    'United Kingdom', 'United States of America', 'Vietnam',
                ],
            };
        }
    },

    distributeRewards: async (id: string) => {
        const response = await axios.post(`${API_URL}/leagues/${id}/distribute-rewards`, {}, { headers: authHeader() });
        return response.data;
    },
};
