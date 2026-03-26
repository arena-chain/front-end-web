import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export type PrizePoolStatus = 'PENDING' | 'CONFIRMED' | 'DISTRIBUTED';
export type PrizePoolSource = 'PLATFORM' | 'SPONSORED' | 'MIXED';
export type PrizePoolCurrency = 'USD' | 'EUR' | 'TND' | 'GBP';

export interface PrizeDistribution {
    rank: number;
    amount: number;
    percentage: number;
}

export interface PrizePool {
    _id: string;
    seasonId: string;
    leagueId: string;
    totalAmount: number;
    currency: PrizePoolCurrency;
    source: PrizePoolSource;
    sponsorId?: string | { _id: string; name: string; logo?: string };
    distribution: PrizeDistribution[];
    status: PrizePoolStatus;
    notes?: string;
    createdAt?: string;
}

export interface CreatePrizePoolDto {
    seasonId: string;
    leagueId: string;
    totalAmount: number;
    currency: PrizePoolCurrency;
    source: PrizePoolSource;
    sponsorId?: string;
    distribution: PrizeDistribution[];
    notes?: string;
}

export const prizePoolService = {
    getBySeason: (seasonId: string): Promise<PrizePool[]> =>
        axios.get(`${API}/prize-pools/by-season?seasonId=${seasonId}`).then(r => {
            const d = r.data;
            if (!d) return [];
            if (Array.isArray(d)) return d;
            if (d && Array.isArray(d.data)) return d.data;
            if (d && Array.isArray(d.pools)) return d.pools;
            // Backend returns a single object — wrap it
            if (d && d._id) return [d];
            return [];
        }),

    getByLeague: (leagueId: string): Promise<PrizePool[]> =>
        axios.get(`${API}/prize-pools/by-league?leagueId=${leagueId}`).then(r => {
            const d = r.data;
            if (Array.isArray(d)) return d;
            if (d && Array.isArray(d.data)) return d.data;
            if (d && Array.isArray(d.pools)) return d.pools;
            return [];
        }),

    getById: (id: string): Promise<PrizePool> =>
        axios.get(`${API}/prize-pools/${id}`).then(r => r.data),

    create: (dto: CreatePrizePoolDto): Promise<PrizePool> =>
        axios.post(`${API}/prize-pools`, dto, auth()).then(r => r.data),

    update: (id: string, dto: Partial<CreatePrizePoolDto>): Promise<PrizePool> =>
        axios.patch(`${API}/prize-pools/${id}`, dto, auth()).then(r => r.data),

    confirm: (id: string): Promise<PrizePool> =>
        axios.patch(`${API}/prize-pools/${id}`, { status: 'CONFIRMED' }, auth()).then(r => r.data),

    distribute: (id: string): Promise<PrizePool> =>
        axios.patch(`${API}/prize-pools/${id}/distribute`, {}, auth()).then(r => r.data),

    delete: (id: string): Promise<void> =>
        axios.delete(`${API}/prize-pools/${id}`, auth()).then(r => r.data),
};
