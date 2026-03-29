import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export type ScouterLevel = 'REGIONAL' | 'NATIONAL' | 'INTERNATIONAL';

export interface ScouterProfile {
    _id: string;
    userId: string | { _id: string; nickname: string; email: string };
    level: ScouterLevel;
    notes?: string;
    evaluatedPlayerIds?: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface ScoutedPlayerProfile {
    _id: string;
    userId?: string | { _id: string; nickname: string; email: string; avatar?: string };
    elo?: number;
    rank?: string;
    region?: string;
    isPro?: boolean;
    stats?: Record<string, unknown>;
    [key: string]: unknown;
}

export interface PlayerMatchSummary {
    _id: string;
    roundId?: string | { roundNumber: number };
    team1Id?: unknown;
    team2Id?: unknown;
    scheduledStart: string;
    status: string;
    team1GamesWon?: number;
    team2GamesWon?: number;
    winnerId?: string;
    [key: string]: unknown;
}

/** Leaderboard entry for Rankings (by game): ranked players with optional team and origin */
export interface LeaderboardEntry {
    _id: string;
    gameId?: string;
    user?: {
        _id: string;
        nickname?: string;
        email?: string;
        avatar?: string;
        country?: string;
        region?: string;
    };
    team?: {
        _id: string;
        name?: string;
        logo?: string;
    };
    elo?: number;
    tier?: string;
    division?: number;
    rank?: string;
    region?: string;
    [key: string]: unknown;
}

const base = `${API}/scouter`;

export const scouterService = {
    /** GET /scouter/me/:userId – scouter profile */
    getMyProfile: (userId: string): Promise<ScouterProfile> =>
        axios.get(`${base}/me/${userId}`, auth()).then(r => r.data),

    /** PATCH /scouter/:userId – update scouter profile */
    updateProfile: (userId: string, data: { level?: ScouterLevel; notes?: string }): Promise<ScouterProfile> =>
        axios.patch(`${base}/${userId}`, data, auth()).then(r => r.data),

    /** GET /scouter/players – list all players (for scouting) */
    getPlayers: (): Promise<ScoutedPlayerProfile[]> =>
        axios.get(`${base}/players`, auth()).then(r => (Array.isArray(r.data) ? r.data : r.data?.data ?? r.data?.players ?? [])),

    /** GET /scouter/players/:playerUserId – player profile detail */
    getPlayerProfile: (playerUserId: string): Promise<ScoutedPlayerProfile> =>
        axios.get(`${base}/players/${playerUserId}`, auth()).then(r => r.data),

    /** GET /scouter/players/:playerUserId/matches – player match history */
    getPlayerMatches: (playerUserId: string): Promise<PlayerMatchSummary[]> =>
        axios.get(`${base}/players/${playerUserId}/matches`, auth()).then(r => (Array.isArray(r.data) ? r.data : r.data?.data ?? r.data?.matches ?? [])),

    /** PATCH /scouter/:scouterUserId/scouted/:playerProfileId – add player to evaluated list */
    addToEvaluated: (scouterUserId: string, playerProfileId: string): Promise<unknown> =>
        axios.patch(`${base}/${scouterUserId}/scouted/${playerProfileId}`, {}, auth()).then(r => r.data),

    /** GET leaderboard by game – ranked players (best to worst); optional team logo & origin from user/team */
    getLeaderboard: (gameId: string): Promise<LeaderboardEntry[]> =>
        axios.get(`${base}/leaderboard`, { ...auth(), params: { gameId } })
            .then(r => {
                const d = r.data;
                if (Array.isArray(d)) return d;
                if (d?.data && Array.isArray(d.data)) return d.data;
                if (d?.leaderboard && Array.isArray(d.leaderboard)) return d.leaderboard;
                return [];
            })
            .then((entries: LeaderboardEntry[]) =>
                [...entries].sort((a, b) => (b.elo ?? 0) - (a.elo ?? 0))
            ),
};
