import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const base = `${API}/scouting`;

// ─── String unions (const objects — erasableSyntaxOnly compatible) ───────
export const ProspectLevel = {
    UNKNOWN: 'UNKNOWN',
    WATCHLIST: 'WATCHLIST',
    PROSPECT: 'PROSPECT',
    ELITE_PROSPECT: 'ELITE_PROSPECT',
    SIGNED: 'SIGNED',
} as const;
export type ProspectLevel = (typeof ProspectLevel)[keyof typeof ProspectLevel];

export const ProspectPriority = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
} as const;
export type ProspectPriority = (typeof ProspectPriority)[keyof typeof ProspectPriority];

export const RecommendationLevel = {
    CONSIDER: 'CONSIDER',
    STRONGLY_RECOMMEND: 'STRONGLY_RECOMMEND',
    MUST_SIGN: 'MUST_SIGN',
} as const;
export type RecommendationLevel = (typeof RecommendationLevel)[keyof typeof RecommendationLevel];

export const RecommendationStatus = {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
} as const;
export type RecommendationStatus = (typeof RecommendationStatus)[keyof typeof RecommendationStatus];

// ─── Interfaces ────────────────────────────────────────────────────────
export interface ScoutingReport {
    _id: string;
    scouterId: string | { _id: string; nickname?: string; email?: string };
    playerId: string | { _id: string; nickname?: string; email?: string; country?: string };
    matchId?: string;
    rating: number;
    strengths: string;
    weaknesses: string;
    notes: string;
    recommendedRole: string;
    createdAt: string;
}

export interface PlayerProspectStatus {
    _id: string;
    playerId: string | { _id: string; nickname?: string; email?: string; country?: string };
    prospectLevel: ProspectLevel;
    priority: ProspectPriority;
    lastUpdated: string;
}

export interface PlayerRecommendation {
    _id: string;
    scouterId: string | { _id: string; nickname?: string; email?: string };
    playerId: string | { _id: string; nickname?: string; email?: string; country?: string };
    organizationId: string | { _id: string; name?: string; tag?: string; logo?: string };
    recommendationLevel: RecommendationLevel;
    message: string;
    status: RecommendationStatus;
    createdAt: string;
}

export interface PlayerFilterParams {
    gameId?: string;
    tier?: string;
    country?: string;
    hasTeam?: boolean;
    prospectLevel?: ProspectLevel;
    priority?: ProspectPriority;
}

export interface CreateReportDto {
    scouterId: string;
    playerId: string;
    matchId?: string;
    rating: number;
    strengths?: string;
    weaknesses?: string;
    notes?: string;
    recommendedRole?: string;
}

export interface CreateProspectDto {
    playerId: string;
    prospectLevel: ProspectLevel;
    priority: ProspectPriority;
}

export interface CreateRecommendationDto {
    scouterId: string;
    playerId: string;
    organizationId: string;
    recommendationLevel: RecommendationLevel;
    message?: string;
}

/** Watchlist (SCOUTING_FULL_GUIDE Part 1) */
export interface WatchlistEntry {
    _id: string;
    scouterId: string;
    /** Backend stores player **user** id; list may populate as User or as PlayerProfile (use `userId` / `user` for account id). */
    playerId:
        | string
        | {
              _id?: string;
              id?: string;
              nickname?: string;
              email?: string;
              country?: string;
              region?: string;
              avatar?: string;
              userId?: string | { _id?: string; id?: string; nickname?: string; email?: string; avatar?: string; country?: string };
              user?: { _id?: string; id?: string; nickname?: string; email?: string; avatar?: string; country?: string };
          };
    notes: string;
    priority: ProspectPriority;
    createdAt: string;
}

export interface AddToWatchlistDto {
    scouterId: string;
    playerId: string;
    notes?: string;
    priority?: ProspectPriority;
}

// ─── API ────────────────────────────────────────────────────────────────
export const scoutingService = {
    // Reports
    createReport: (body: CreateReportDto): Promise<ScoutingReport> =>
        axios.post(`${base}/reports`, body, auth()).then((r) => r.data),

    listReportsByScouter: (scouterId: string, playerId?: string): Promise<ScoutingReport[]> =>
        axios
            .get(`${base}/reports/scouter/${scouterId}`, { ...auth(), params: playerId ? { playerId } : {} })
            .then((r) => (Array.isArray(r.data) ? r.data : r.data?.data ?? r.data?.reports ?? [])),

    listReportsByPlayer: (playerId: string): Promise<ScoutingReport[]> =>
        axios
            .get(`${base}/reports/player/${playerId}`, auth())
            .then((r) => (Array.isArray(r.data) ? r.data : r.data?.data ?? r.data?.reports ?? [])),

    getReport: (id: string): Promise<ScoutingReport> =>
        axios.get(`${base}/reports/${id}`, auth()).then((r) => r.data),

    updateReport: (id: string, body: Partial<CreateReportDto>): Promise<ScoutingReport> =>
        axios.patch(`${base}/reports/${id}`, body, auth()).then((r) => r.data),

    deleteReport: (id: string): Promise<void> =>
        axios.delete(`${base}/reports/${id}`, auth()).then(() => undefined),

    // Prospects
    upsertProspect: (body: CreateProspectDto): Promise<PlayerProspectStatus> =>
        axios.post(`${base}/prospects`, body, auth()).then((r) => r.data),

    getProspectByPlayer: (playerId: string): Promise<PlayerProspectStatus | null> =>
        axios
            .get(`${base}/prospects/player/${playerId}`, auth())
            .then((r) => r.data)
            .catch(() => null),

    listProspects: (params?: { prospectLevel?: ProspectLevel; priority?: ProspectPriority }): Promise<PlayerProspectStatus[]> =>
        axios
            .get(`${base}/prospects`, { ...auth(), params: params ?? {} })
            .then((r) => (Array.isArray(r.data) ? r.data : r.data?.data ?? r.data?.prospects ?? [])),

    updateProspect: (playerId: string, body: Partial<CreateProspectDto>): Promise<PlayerProspectStatus> =>
        axios.patch(`${base}/prospects/player/${playerId}`, body, auth()).then((r) => r.data),

    // Recommendations
    createRecommendation: (body: CreateRecommendationDto): Promise<PlayerRecommendation> =>
        axios.post(`${base}/recommendations`, body, auth()).then((r) => r.data),

    listRecommendationsByScouter: (scouterId: string): Promise<PlayerRecommendation[]> =>
        axios
            .get(`${base}/recommendations/scouter/${scouterId}`, auth())
            .then((r) => (Array.isArray(r.data) ? r.data : r.data?.data ?? r.data?.recommendations ?? [])),

    listRecommendationsByPlayer: (playerId: string): Promise<PlayerRecommendation[]> =>
        axios
            .get(`${base}/recommendations/player/${playerId}`, auth())
            .then((r) => (Array.isArray(r.data) ? r.data : r.data?.data ?? r.data?.recommendations ?? [])),

    listRecommendationsByOrganization: (organizationId: string, status?: RecommendationStatus): Promise<PlayerRecommendation[]> =>
        axios
            .get(`${base}/recommendations/organization/${organizationId}`, { ...auth(), params: status ? { status } : {} })
            .then((r) => (Array.isArray(r.data) ? r.data : r.data?.data ?? r.data?.recommendations ?? [])),

    updateRecommendationStatus: (id: string, status: RecommendationStatus): Promise<PlayerRecommendation> =>
        axios.patch(`${base}/recommendations/${id}/status`, { status }, auth()).then((r) => r.data),

    // Player filter (discover talents)
    filterPlayers: (params: PlayerFilterParams): Promise<unknown[]> =>
        axios
            .get(`${base}/players/filter`, { ...auth(), params: params as Record<string, string | boolean | undefined> })
            .then((r) => (Array.isArray(r.data) ? r.data : r.data?.data ?? r.data?.players ?? []))
            .catch(() => []),

    // Watchlist (SCOUTING_FULL_GUIDE Part 1)
    addToWatchlist: (body: AddToWatchlistDto): Promise<WatchlistEntry> =>
        axios.post(`${base}/watchlist`, body, auth()).then((r) => r.data),

    /** DELETE `/scouting/watchlist/scouter/:scouterId/player/:playerId` — `playerId` must be the player **user** Mongo id. */
    removeFromWatchlist: (scouterId: string, playerUserId: string): Promise<void> =>
        axios
            .delete(
                `${base}/watchlist/scouter/${encodeURIComponent(scouterId)}/player/${encodeURIComponent(playerUserId)}`,
                auth(),
            )
            .then(() => undefined),

    /**
     * Deletes a watchlist document by its own `_id`.
     * Use for orphan rows where `playerId` is missing or invalid (standard remove pair cannot run).
     */
    removeWatchlistByEntryId: (watchlistEntryId: string): Promise<void> =>
        axios.delete(`${base}/watchlist/${encodeURIComponent(watchlistEntryId)}`, auth()).then(() => undefined),

    listWatchlistByScouter: (scouterId: string): Promise<WatchlistEntry[]> =>
        axios
            .get(`${base}/watchlist/scouter/${scouterId}`, auth())
            .then((r) => (Array.isArray(r.data) ? r.data : r.data?.data ?? r.data?.watchlist ?? [])),

    checkWatchlist: (scouterId: string, playerId: string): Promise<boolean> =>
        axios
            .get(`${base}/watchlist/check`, { ...auth(), params: { scouterId, playerId } })
            .then((r) => r.data === true || r.data?.inWatchlist === true)
            .catch(() => false),

    updateWatchlistEntry: (id: string, body: { scouterId: string; notes?: string; priority?: ProspectPriority }): Promise<WatchlistEntry> =>
        axios.patch(`${base}/watchlist/${id}`, body, auth()).then((r) => r.data),
};
