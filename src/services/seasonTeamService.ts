import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export type SeasonTeamStatus = 'ACTIVE' | 'WITHDRAWN' | 'DISQUALIFIED';

export interface SeasonTeam {
    _id: string;
    seasonId: string;
    teamId: string | { _id: string; name: string; logo?: string; region?: string };
    seed?: number;
    status: SeasonTeamStatus;
    forfeits?: number;
    qualifiedFromSeasonId?: string;
    qualifiedViaRank?: number;
    createdAt?: string;
}

export const seasonTeamService = {
    getBySeason: (seasonId: string): Promise<SeasonTeam[]> =>
        axios.get(`${API}/season-teams/season/${seasonId}`).then(r => r.data),

    register: (dto: {
        seasonId: string; teamId: string;
        seed?: number; qualifiedFromSeasonId?: string; qualifiedViaRank?: number;
    }): Promise<SeasonTeam> =>
        axios.post(`${API}/season-teams`, dto, auth()).then(r => r.data),

    update: (id: string, dto: { seed?: number; qualifiedViaRank?: number }): Promise<SeasonTeam> =>
        axios.patch(`${API}/season-teams/${id}`, dto, auth()).then(r => r.data),

    withdraw: (id: string): Promise<SeasonTeam> =>
        axios.patch(`${API}/season-teams/${id}/withdraw`, {}, auth()).then(r => r.data),

    disqualify: (id: string): Promise<SeasonTeam> =>
        axios.patch(`${API}/season-teams/${id}/disqualify`, {}, auth()).then(r => r.data),
};
