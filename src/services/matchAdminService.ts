import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export type MatchStatus = 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'FORFEIT' | 'CANCELLED';

export interface AdminMatch {
    _id: string;
    roundId: string | { _id: string; roundNumber: number };
    seasonId: string;
    team1Id: string | { _id: string; name: string; logo?: string };
    team2Id: string | { _id: string; name: string; logo?: string };
    scheduledStart: string;
    scheduledEnd?: string;
    refereeId?: string | { _id: string; nickname?: string };
    status: MatchStatus;
    team1GamesWon?: number;
    team2GamesWon?: number;
    notes?: string;
    format?: string;
    createdAt?: string;
}

export const matchAdminService = {
    getByRound: (roundId: string): Promise<AdminMatch[]> =>
        axios.get(`${API}/matches?roundId=${roundId}`).then(r => r.data),

    getBySeason: (seasonId: string): Promise<AdminMatch[]> =>
        axios.get(`${API}/matches?seasonId=${seasonId}`).then(r => r.data),

    getById: (id: string): Promise<AdminMatch> =>
        axios.get(`${API}/matches/${id}`).then(r => r.data),

    create: (dto: {
        roundId: string; seasonId: string;
        team1Id: string; team2Id: string;
        scheduledStart: string; scheduledEnd?: string;
        refereeId?: string; notes?: string;
    }): Promise<AdminMatch> =>
        axios.post(`${API}/matches`, dto, auth()).then(r => r.data),

    reportResult: (id: string, dto: { team1GamesWon: number; team2GamesWon: number }): Promise<AdminMatch> =>
        axios.patch(`${API}/matches/${id}/result`, dto, auth()).then(r => r.data),

    submitGame: (id: string, dto: { gameNumber: number; winnerId: string; durationMinutes?: number }): Promise<AdminMatch> =>
        axios.post(`${API}/matches/${id}/game`, dto, auth()).then(r => r.data),

    forfeit: (id: string, dto: { forfeitingTeamId: string; forfeitReason?: string }): Promise<AdminMatch> =>
        axios.patch(`${API}/matches/${id}/forfeit`, dto, auth()).then(r => r.data),

    start: (id: string): Promise<AdminMatch> =>
        axios.patch(`${API}/matches/${id}/start`, {}, auth()).then(r => r.data),

    cancel: (id: string): Promise<AdminMatch> =>
        axios.patch(`${API}/matches/${id}/cancel`, {}, auth()).then(r => r.data),
};
