import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export type DisputeReason =
    | 'CHEATING'
    | 'WRONG_RESULT'
    | 'NO_SHOW'
    | 'TECHNICAL_ISSUE'
    | 'RULE_VIOLATION'
    | 'OTHER';

export type DisputeStatus = 'PENDING' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED';

export interface MatchDispute {
    _id: string;
    matchId: string | { _id: string };
    seasonId: string;
    submittedByTeamId: string | { _id: string; name: string; logo?: string };
    reason: DisputeReason;
    description: string;
    evidenceUrls: string[];
    status: DisputeStatus;
    adminNote?: string;
    resolvedAt?: string;
    resolvedByAdminId?: string;
    createdAt?: string;
}

export interface CreateDisputeDto {
    matchId: string;
    seasonId: string;
    submittedByTeamId: string;
    reason: DisputeReason;
    description: string;
    evidenceUrls?: string[];
}

export interface ResolveDisputeDto {
    status: 'ACCEPTED' | 'REJECTED';
    adminNote: string;
}

export const matchDisputeService = {
    getBySeason: (seasonId: string): Promise<MatchDispute[]> =>
        axios.get(`${API}/match-disputes?seasonId=${seasonId}`, auth()).then(r => r.data),

    getPending: (): Promise<MatchDispute[]> =>
        axios.get(`${API}/match-disputes?status=PENDING`, auth()).then(r => r.data),

    getByMatch: (matchId: string): Promise<MatchDispute[]> =>
        axios.get(`${API}/match-disputes?matchId=${matchId}`, auth()).then(r => r.data),

    create: (dto: CreateDisputeDto): Promise<MatchDispute> =>
        axios.post(`${API}/match-disputes`, dto, auth()).then(r => r.data),

    markUnderReview: (id: string): Promise<MatchDispute> =>
        axios.patch(`${API}/match-disputes/${id}/review`, {}, auth()).then(r => r.data),

    resolve: (id: string, dto: ResolveDisputeDto): Promise<MatchDispute> =>
        axios.patch(`${API}/match-disputes/${id}/resolve`, dto, auth()).then(r => r.data),
};
