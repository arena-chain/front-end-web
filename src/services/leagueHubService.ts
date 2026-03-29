import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface StandingRow {
    _id: string;
    seasonId: string;
    teamId: string | { _id: string; name: string; logo?: string };
    played: number;
    wins: number;
    losses: number;
    points: number;
    gamesWon: number;
    gamesLost: number;
    gameDiff: number;
    rank: number;
}

export interface HubRound {
    _id: string;
    seasonId: string;
    roundNumber: number;
    startDate: string;
    endDate: string;
    status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED';
}

export interface HubMatch {
    _id: string;
    roundId: string | { _id: string; roundNumber: number };
    seasonId: string;
    team1Id: string | { _id: string; name: string; logo?: string };
    team2Id: string | { _id: string; name: string; logo?: string };
    scheduledStart: string;
    status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'FORFEIT' | 'CANCELLED';
    team1GamesWon?: number;
    team2GamesWon?: number;
    winnerId?: string;
    format?: string;
    games?: {
        gameNumber: number;
        winnerId?: string;
        mapName?: string;
        team1Score?: number;
        team2Score?: number;
    }[];
}

export interface HubBracketSlot {
    slotId: string;
    roundNumber: number;
    position: number;
    team1Id?: string | { _id: string; name: string; logo?: string };
    team2Id?: string | { _id: string; name: string; logo?: string };
    winnerId?: string;
    matchId?: string;
    status: 'PENDING' | 'READY' | 'COMPLETED' | 'BYE';
}

export interface HubBracket {
    _id: string;
    seasonId: string;
    format: 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION';
    totalRounds: number;
    slots: HubBracketSlot[];
    status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
    championId?: string | { _id: string; name: string; logo?: string };
}

export interface LeagueRegistration {
    _id: string;
    seasonId: string;
    teamId: string | { _id: string; name: string; logo?: string };
    status?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normaliseArray(d: unknown): unknown[] {
    if (Array.isArray(d)) return d;
    if (d && typeof d === 'object') {
        for (const key of ['data', 'results', 'standings', 'rounds', 'matches', 'registrations']) {
            const v = (d as Record<string, unknown>)[key];
            if (Array.isArray(v)) return v;
        }
    }
    return [];
}

// ── Service ───────────────────────────────────────────────────────────────────

export const leagueHubService = {
    /** GET /standings/season/:seasonId — sorted standings */
    getStandings: (seasonId: string): Promise<StandingRow[]> =>
        axios.get(`${API}/standings/season/${seasonId}`)
            .then(r => normaliseArray(r.data) as StandingRow[])
            .catch(() => []),

    /** GET /rounds/season/:seasonId — all rounds */
    getRoundsBySeason: (seasonId: string): Promise<HubRound[]> =>
        axios.get(`${API}/rounds/season/${seasonId}`)
            .then(r => normaliseArray(r.data) as HubRound[])
            .catch(() => []),

    /** GET /matches/round/:roundId — matches in a round */
    getMatchesByRound: (roundId: string): Promise<HubMatch[]> =>
        axios.get(`${API}/matches/round/${roundId}`)
            .then(r => normaliseArray(r.data) as HubMatch[])
            .catch(() => []),

    /** GET /matches/season/:seasonId — all matches in a season */
    getMatchesBySeason: (seasonId: string): Promise<HubMatch[]> =>
        axios.get(`${API}/matches/season/${seasonId}`)
            .then(r => normaliseArray(r.data) as HubMatch[])
            .catch(() => []),

    /** GET /brackets/season/:seasonId — playoff bracket */
    getBracket: (seasonId: string): Promise<HubBracket | null> =>
        axios.get(`${API}/brackets/season/${seasonId}`)
            .then(r => r.data as HubBracket)
            .catch(() => null),

    /** GET /league-registration/season/:seasonId */
    getRegistrations: (seasonId: string): Promise<LeagueRegistration[]> =>
        axios.get(`${API}/league-registration/season/${seasonId}`, auth())
            .then(r => normaliseArray(r.data) as LeagueRegistration[])
            .catch(() => []),

    /** POST /league-registration — register team */
    registerTeam: (seasonId: string, teamId: string): Promise<LeagueRegistration> =>
        axios.post(`${API}/league-registration`, { seasonId, teamId }, auth()).then(r => r.data),

    /** DELETE /league-registration/:id — withdraw */
    withdrawTeam: (registrationId: string): Promise<void> =>
        axios.delete(`${API}/league-registration/${registrationId}`, auth()).then(r => r.data),
};
