import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export type RosterStatus = 'OPEN' | 'LOCKED';

export interface RosterPlayer {
    _id: string;
    nickname: string;
    avatar?: string;
    email?: string;
}

export interface SeasonRoster {
    _id: string;
    seasonId: string;
    teamId: string | { _id: string; name: string; logo?: string };
    playerIds: string[] | RosterPlayer[];
    minRosterSize: number;
    maxRosterSize: number;
    status: RosterStatus;
    lockedAt?: string;
    createdAt?: string;
}

export interface CreateRosterDto {
    seasonId: string;
    teamId: string;
    playerIds: string[];
    minRosterSize?: number;
    maxRosterSize?: number;
}

export const seasonRosterService = {
    getBySeason: (seasonId: string): Promise<SeasonRoster[]> =>
        axios.get(`${API}/season-rosters?seasonId=${seasonId}`, auth()).then(r => r.data),

    getByTeamAndSeason: (teamId: string, seasonId: string): Promise<SeasonRoster> =>
        axios.get(`${API}/season-rosters?teamId=${teamId}&seasonId=${seasonId}`, auth()).then(r => r.data[0]),

    create: (dto: CreateRosterDto): Promise<SeasonRoster> =>
        axios.post(`${API}/season-rosters`, dto, auth()).then(r => r.data),

    addPlayer: (rosterId: string, playerId: string): Promise<SeasonRoster> =>
        axios.post(`${API}/season-rosters/${rosterId}/players`, { playerId }, auth()).then(r => r.data),

    removePlayer: (rosterId: string, playerId: string): Promise<SeasonRoster> =>
        axios.delete(`${API}/season-rosters/${rosterId}/players/${playerId}`, auth()).then(r => r.data),

    lock: (rosterId: string): Promise<SeasonRoster> =>
        axios.patch(`${API}/season-rosters/${rosterId}/lock`, {}, auth()).then(r => r.data),

    unlock: (rosterId: string): Promise<SeasonRoster> =>
        axios.patch(`${API}/season-rosters/${rosterId}/unlock`, {}, auth()).then(r => r.data),

    delete: (rosterId: string): Promise<void> =>
        axios.delete(`${API}/season-rosters/${rosterId}`, auth()).then(r => r.data),
};
