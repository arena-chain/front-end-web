import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export type CheckInStatus =
    | 'OPEN'
    | 'BOTH_READY'
    | 'TEAM1_MISSED'
    | 'TEAM2_MISSED'
    | 'BOTH_MISSED'
    | 'CANCELLED';

export interface CheckIn {
    _id: string;
    matchId: string | { _id: string };
    seasonId: string;
    deadline: string;
    team1CheckedIn: boolean;
    team1CheckedInAt?: string;
    team2CheckedIn: boolean;
    team2CheckedInAt?: string;
    status: CheckInStatus;
    createdAt?: string;
}

export interface CreateCheckInDto {
    matchId: string;
    seasonId: string;
    deadline: string;
}

export const checkInService = {
    getBySeason: (seasonId: string): Promise<CheckIn[]> =>
        axios.get(`${API}/check-ins?seasonId=${seasonId}`, auth()).then(r => r.data),

    getByMatch: (matchId: string): Promise<CheckIn> =>
        axios.get(`${API}/check-ins?matchId=${matchId}`, auth()).then(r => r.data[0]),

    create: (dto: CreateCheckInDto): Promise<CheckIn> =>
        axios.post(`${API}/check-ins`, dto, auth()).then(r => r.data),

    processExpired: (seasonId: string): Promise<{ processed: number }> =>
        axios.post(`${API}/check-ins/process-expired`, { seasonId }, auth()).then(r => r.data),

    cancel: (id: string): Promise<CheckIn> =>
        axios.patch(`${API}/check-ins/${id}/cancel`, {}, auth()).then(r => r.data),

    delete: (id: string): Promise<void> =>
        axios.delete(`${API}/check-ins/${id}`, auth()).then(r => r.data),
};
