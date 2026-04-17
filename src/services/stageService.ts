import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

// ─── Enums ────────────────────────────────────────────────────────────────────

export type StageType = 'LEAGUE' | 'BRACKET' | 'SWISS' | 'GROUPS';
export type StageStatus = 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'COMPLETED';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface Stage {
    _id: string;
    leagueId?: string;
    seasonId: string;
    name: string;
    stageType: StageType;
    orderIndex: number;
    startAt: string;
    endAt: string;
    status: StageStatus;
    /** Populated SeasonRule or just the id */
    rulesetId: string | {
        _id: string;
        name: string;
        matchType: string;
        formatType: string;
    };
    /** Populated Bracket or just the id */
    bracketId?: string | { _id: string;[key: string]: unknown };
    standingsId?: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateStageDto {
    seasonId: string;
    leagueId?: string;
    name: string;
    stageType: StageType;
    orderIndex?: number;
    startAt: string;
    endAt: string;
    status?: StageStatus;
    rulesetId: string;
    bracketId?: string;
    standingsId?: string;
    description?: string;
}

export type UpdateStageDto = Partial<CreateStageDto>;

// ─── Service ──────────────────────────────────────────────────────────────────

export const stageService = {
    /** Fetch all stages for a season */
    getBySeason: (seasonId: string): Promise<Stage[]> =>
        axios.get(`${API}/stages?seasonId=${seasonId}`, auth()).then(r => {
            const d = r.data;
            if (Array.isArray(d)) return d;
            if (d && Array.isArray(d.data)) return d.data;
            if (d && Array.isArray(d.stages)) return d.stages;
            return [];
        }),

    /** Fetch all stages for a league */
    getByLeague: (leagueId: string): Promise<Stage[]> =>
        axios.get(`${API}/stages?leagueId=${leagueId}`, auth()).then(r => {
            const d = r.data;
            if (Array.isArray(d)) return d;
            if (d && Array.isArray(d.data)) return d.data;
            return [];
        }),

    /** Fetch a single stage (rulesetId and bracketId populated) */
    getById: (id: string): Promise<Stage> =>
        axios.get(`${API}/stages/${id}`, auth()).then(r => r.data),

    /** Create a new stage */
    create: (dto: CreateStageDto): Promise<Stage> =>
        axios.post(`${API}/stages`, dto, auth()).then(r => r.data),

    /** Partial update */
    update: (id: string, dto: UpdateStageDto): Promise<Stage> =>
        axios.patch(`${API}/stages/${id}`, dto, auth()).then(r => r.data),

    /** Update stage status: DRAFT → SCHEDULED → LIVE → COMPLETED */
    updateStatus: (id: string, status: StageStatus): Promise<Stage> =>
        axios.patch(`${API}/stages/${id}/status`, { status }, auth()).then(r => r.data),

    /** Link bracket to a BRACKET-type stage */
    linkBracket: (id: string, bracketId: string): Promise<Stage> =>
        axios.patch(`${API}/stages/${id}/bracket`, { bracketId }, auth()).then(r => r.data),

    /** Delete a stage */
    delete: (id: string): Promise<void> =>
        axios.delete(`${API}/stages/${id}`, auth()).then(r => r.data),
};
