import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export type BracketFormat = 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION';
export type BracketStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED';
export type SlotStatus    = 'PENDING' | 'READY' | 'COMPLETED' | 'BYE';

export interface BracketSlot {
    slotId: string;
    roundNumber: number;
    position: number;
    team1Id?: string | { _id: string; name: string; logo?: string };
    team2Id?: string | { _id: string; name: string; logo?: string };
    winnerId?: string;
    matchId?: string | { _id: string };
    nextSlotId?: string;
    status: SlotStatus;
}

export interface Bracket {
    _id: string;
    seasonId: string;
    format: BracketFormat;
    totalRounds: number;
    slots: BracketSlot[];
    status: BracketStatus;
    championId?: string | { _id: string; name: string; logo?: string };
    createdAt?: string;
}

export interface GenerateBracketDto {
    seasonId: string;
    format: BracketFormat;
    seededTeamIds?: string[];
}

function normalizeBracketPayload(d: unknown): Bracket | null {
    if (d == null) return null;
    if (Array.isArray(d)) return (d[0] as Bracket) ?? null;
    if (typeof d === 'object' && d !== null && 'slots' in d) return d as Bracket;
    return null;
}

export const bracketService = {
    getBySeason: (seasonId: string): Promise<Bracket | null> =>
        axios
            .get(`${API}/brackets?seasonId=${encodeURIComponent(seasonId)}`, auth())
            .then((r) => normalizeBracketPayload(r.data)),

    generate: (dto: GenerateBracketDto): Promise<Bracket> =>
        axios.post(`${API}/brackets/generate`, dto, auth()).then(r => r.data),

    createManual: (dto: { seasonId: string; format: BracketFormat; totalRounds: number }): Promise<Bracket> =>
        axios.post(`${API}/brackets`, dto, auth()).then(r => r.data),

    reset: (id: string): Promise<Bracket> =>
        axios.post(`${API}/brackets/${id}/reset`, {}, auth()).then(r => r.data),

    delete: (id: string): Promise<void> =>
        axios.delete(`${API}/brackets/${id}`, auth()).then(r => r.data),
};
