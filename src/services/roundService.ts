import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export type RoundStatus = 'SCHEDULED' | 'ONGOING' | 'COMPLETED';

export interface Round {
    _id: string;
    seasonId: string;
    roundNumber: number;
    startDate: string;
    endDate: string;
    status: RoundStatus;
    createdAt?: string;
}

export const roundService = {
    getBySeason: (seasonId: string): Promise<Round[]> =>
        axios.get(`${API}/rounds?seasonId=${seasonId}`).then(r => r.data),

    generate: (dto: { seasonId: string; startDate: string; weekCount: number }): Promise<Round[]> =>
        axios.post(`${API}/rounds/generate`, dto, auth()).then(r => r.data),

    create: (dto: { seasonId: string; roundNumber: number; startDate: string; endDate: string }): Promise<Round> =>
        axios.post(`${API}/rounds`, dto, auth()).then(r => r.data),

    update: (id: string, dto: { status?: RoundStatus; startDate?: string; endDate?: string }): Promise<Round> =>
        axios.patch(`${API}/rounds/${id}`, dto, auth()).then(r => r.data),

    delete: (id: string): Promise<void> =>
        axios.delete(`${API}/rounds/${id}`, auth()).then(r => r.data),
};
