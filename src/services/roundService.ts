import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export type RoundStatus = 'SCHEDULED' | 'ONGOING' | 'COMPLETED';

export interface Round {
    _id: string;
    seasonId: string;
    stageId?: string;
    roundNumber: number;
    startDate: string;
    endDate: string;
    status: RoundStatus;
    createdAt?: string;
    updatedAt?: string;
}

/** Body for POST /rounds – create a single round */
export interface CreateRoundDto {
    seasonId: string;
    stageId?: string;
    roundNumber: number;
    startDate: string; // ISO 8601
    endDate: string;   // ISO 8601
}

/** Body for POST /rounds/generate – backend uses season start/end dates */
export interface GenerateRoundsDto {
    seasonId: string;
    stageId?: string;
    weekCount?: number; // optional; if omitted, derived from season duration
    generateMatches?: boolean; // if true, creates round-robin matches (needs 2+ ACTIVE teams, season rulesId)
}

/** Body for PATCH /rounds/:id – all fields optional (backend may support status) */
export interface UpdateRoundDto {
    seasonId?: string;
    stageId?: string;
    roundNumber?: number;
    startDate?: string;
    endDate?: string;
    status?: RoundStatus;
}

function buildQuery(params: { seasonId?: string; stageId?: string }): string {
    const q = new URLSearchParams();
    if (params.seasonId) q.set('seasonId', params.seasonId);
    if (params.stageId) q.set('stageId', params.stageId);
    const s = q.toString();
    return s ? `?${s}` : '';
}

export const roundService = {
    /** GET /rounds?seasonId=... or ?stageId=... or both. At least one recommended. */
    list: (params: { seasonId?: string; stageId?: string }): Promise<Round[]> =>
        axios.get(`${API}/rounds${buildQuery(params)}`).then(r => r.data),

    /** List rounds by season (convenience). */
    getBySeason: (seasonId: string): Promise<Round[]> =>
        axios.get(`${API}/rounds?seasonId=${encodeURIComponent(seasonId)}`).then(r => r.data),

    /** List rounds by stage (convenience). */
    getByStage: (stageId: string): Promise<Round[]> =>
        axios.get(`${API}/rounds?stageId=${encodeURIComponent(stageId)}`).then(r => r.data),

    /** GET /rounds/:id */
    getById: (id: string): Promise<Round> =>
        axios.get(`${API}/rounds/${id}`).then(r => r.data),

    /** POST /rounds – create a single round */
    create: (dto: CreateRoundDto): Promise<Round> =>
        axios.post(`${API}/rounds`, dto, auth()).then(r => r.data),

    /** POST /rounds/generate – creates weekly rounds from season dates; start/end come from season */
    generate: (dto: GenerateRoundsDto): Promise<Round[]> =>
        axios.post(`${API}/rounds/generate`, dto, auth()).then(r => r.data),

    /** PATCH /rounds/:id */
    update: (id: string, dto: UpdateRoundDto): Promise<Round> =>
        axios.patch(`${API}/rounds/${id}`, dto, auth()).then(r => r.data),

    /** DELETE /rounds/:id */
    delete: (id: string): Promise<Round> =>
        axios.delete(`${API}/rounds/${id}`, auth()).then(r => r.data),
};
