import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export type FormatType  = 'LEAGUE' | 'SWISS' | 'KNOCKOUT';
export type MatchType   = 'BO1' | 'BO3' | 'BO5';
export type Tiebreaker  = 'POINTS' | 'GAME_DIFF' | 'HEAD_TO_HEAD';

export interface LeagueRule {
    _id: string;
    name: string;
    gameId: string | { _id: string; title: string };
    formatType: FormatType;
    matchType: MatchType;
    pointsWin: number;
    pointsDraw: number;
    pointsLoss: number;
    maxTeams: number;
    maxForfeitsBeforeDisqualification?: number;
    forfeitCountsAsLoss?: boolean;
    tiebreaker: Tiebreaker;
    extraRules?: Record<string, unknown>;
    createdAt?: string;
}

export interface CreateLeagueRuleDto {
    name: string;
    gameId: string;
    formatType: FormatType;
    matchType: MatchType;
    pointsWin: number;
    pointsDraw: number;
    pointsLoss: number;
    maxTeams: number;
    maxForfeitsBeforeDisqualification?: number;
    forfeitCountsAsLoss?: boolean;
    tiebreaker: Tiebreaker;
    extraRules?: Record<string, unknown>;
}

export const leagueRulesService = {
    getAll: (): Promise<LeagueRule[]> =>
        axios.get(`${API}/league-rules`).then(r => r.data),

    getById: (id: string): Promise<LeagueRule> =>
        axios.get(`${API}/league-rules/${id}`).then(r => r.data),

    create: (dto: CreateLeagueRuleDto): Promise<LeagueRule> =>
        axios.post(`${API}/league-rules`, dto, auth()).then(r => r.data),

    update: (id: string, dto: Partial<CreateLeagueRuleDto>): Promise<LeagueRule> =>
        axios.patch(`${API}/league-rules/${id}`, dto, auth()).then(r => r.data),

    delete: (id: string): Promise<void> =>
        axios.delete(`${API}/league-rules/${id}`, auth()).then(r => r.data),
};
