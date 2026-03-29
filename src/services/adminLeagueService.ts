import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const apiErr = (e: unknown) => {
    const err = e as { response?: { data?: { message?: string | string[] } } };
    const m = err?.response?.data?.message;
    return Array.isArray(m) ? m[0] : (m || 'Something went wrong');
};
export { apiErr };

// ── Season Rules  (backend: /league-rules) ────────────────────────────────────
export type MapVetoFormat =
    | 'ADMIN_PICK' | 'RANDOM' | 'BAN_BAN_DECIDER'
    | 'BAN_BAN_PICK_PICK_BAN_BAN_DECIDER' | 'PICK_PICK_DECIDER'
    | 'BAN_BAN_PICK_PICK_PICK_PICK_DECIDER';
export type VetoFirstPick = 'HIGHER_SEED' | 'LOWER_SEED' | 'COIN_FLIP' | 'ADMIN';
export type RuleUsage = 'REGULAR_SEASON' | 'PLAYOFFS' | 'GRAND_FINAL' | 'PLAY_IN' | 'QUALIFICATION' | 'GROUP_STAGE';
export type SideSelection = 'HIGHER_SEED_CHOOSES' | 'KNIFE_ROUND' | 'COIN_TOSS' | 'VETO_WINNER_CHOOSES' | 'FIXED_TEAM_A_ATTACK';
export type ScoreSubmissionMethod = 'ADMIN_VERIFIED' | 'BOTH_TEAMS_CONFIRM' | 'AUTO_FROM_API';
export type OvertimeFormat = 'NONE' | 'VALORANT_OT' | 'CS2_OT';

export interface OvertimeConfig {
    format: OvertimeFormat;
    enabled: boolean;
    maxRoundsPerPeriod: number;
    startMoney: number;
    allowDrawIfDisabled: boolean;
    maxOvertimePeriods: number;
}

export interface SeasonRule {
    _id: string;
    seasonId: string;
    name: string;
    gameId: string;
    formatType: 'LEAGUE' | 'SWISS' | 'KNOCKOUT';
    matchType: 'BO1' | 'BO3' | 'BO5';
    pointsWin: number;
    pointsLoss: number;
    maxTeams: number;
    maxForfeitsBeforeDisqualification: number;
    forfeitCountsAsLoss: boolean;
    tiebreaker: 'POINTS' | 'GAME_DIFF' | 'HEAD_TO_HEAD';
    mapPool: string[];
    mapVetoEnabled: boolean;
    mapVetoFormat?: MapVetoFormat;
    vetoFirstPick?: VetoFirstPick;
    ruleUsage: RuleUsage[];
    sideSelection: SideSelection;
    scoreSubmissionMethod: ScoreSubmissionMethod;
    substitutionsAllowed: boolean;
    maxSubstitutions: number;
    emergencySubsOnly: boolean;
    pauseAllowedForDisconnect: boolean;
    replayConditions?: string;
    remakeConditions?: string;
    adminDecisionRequired: boolean;
    overtimeConfig: OvertimeConfig;
    extraRules?: Record<string, unknown>;
}
export type CreateSeasonRuleDto = Omit<SeasonRule, '_id'>;

export const getSeasonRule = (seasonId: string): Promise<SeasonRule | null> =>
    axios.get(`${API}/league-rules?seasonId=${seasonId}`, auth())
        .then(r => { const d = r.data; return Array.isArray(d) ? (d[0] ?? null) : (d ?? null); })
        .catch(() => null);
export const createSeasonRule = (dto: Partial<CreateSeasonRuleDto>) =>
    axios.post(`${API}/league-rules`, dto, auth()).then(r => r.data as SeasonRule);
export const updateSeasonRule = (id: string, dto: Partial<CreateSeasonRuleDto>) =>
    axios.patch(`${API}/league-rules/${id}`, dto, auth()).then(r => r.data as SeasonRule);

// ── Prize Pool  (backend: /prize-pools) ──────────────────────────────────────
export interface PrizeEntry { rank: number; amount: number; percentage: number; }
export interface PrizePool {
    _id: string;
    seasonId: string;
    leagueId: string;
    totalAmount: number;
    currency: 'USD' | 'EUR' | 'TND' | 'GBP';
    source: 'PLATFORM' | 'SPONSORED' | 'MIXED';
    distribution: PrizeEntry[];
    notes?: string;
}
export const getPrizePool = (seasonId: string): Promise<PrizePool | null> =>
    axios.get(`${API}/prize-pools/by-season?seasonId=${seasonId}`, auth())
        .then(r => { const d = r.data; if (!d) return null; if (Array.isArray(d)) return d[0] ?? null; if (d._id) return d; return null; })
        .catch(() => null);
export const createPrizePool = (dto: Omit<PrizePool, '_id'>) =>
    axios.post(`${API}/prize-pools`, dto, auth()).then(r => r.data as PrizePool);
export const updatePrizePool = (id: string, dto: Partial<Omit<PrizePool, '_id'>>) =>
    axios.patch(`${API}/prize-pools/${id}`, dto, auth()).then(r => r.data as PrizePool);

// ── Season Teams  (backend: /season-teams) ───────────────────────────────────
export interface SeasonTeamEntry {
    _id: string;
    seasonId: string;
    teamId: string | { _id: string; name: string; logo?: string; tag?: string };
    seed?: number;
    status: 'ACTIVE' | 'DISQUALIFIED' | 'WITHDRAWN';
    qualifiedFromSeasonId?: string;
    qualifiedViaRank?: number;
}
export const getSeasonTeams = (seasonId: string): Promise<SeasonTeamEntry[]> =>
    axios.get(`${API}/season-teams/season/${seasonId}`, auth())
        .then(r => (Array.isArray(r.data) ? r.data : []) as SeasonTeamEntry[])
        .catch(() => [] as SeasonTeamEntry[]);
export const registerTeam = (dto: { seasonId: string; teamId: string; seed?: number }) =>
    axios.post(`${API}/season-teams`, dto, auth()).then(r => r.data);
export const updateRegistration = (id: string, dto: { seed?: number }) =>
    axios.patch(`${API}/season-teams/${id}`, dto, auth()).then(r => r.data);
export const removeRegistration = (id: string) =>
    axios.patch(`${API}/season-teams/${id}/withdraw`, {}, auth()).then(r => r.data);

// ── All Teams lookup ──────────────────────────────────────────────────────────
export interface TeamRef { _id: string; name: string; logo?: string; tag?: string; type?: string; }

function extractTeams(d: unknown): TeamRef[] {
    if (Array.isArray(d)) return d as TeamRef[];
    if (d && typeof d === 'object') {
        for (const key of ['data', 'teams', 'results', 'items']) {
            const v = (d as Record<string, unknown>)[key];
            if (Array.isArray(v)) return v as TeamRef[];
        }
    }
    return [];
}

export const getAllTeams = (): Promise<TeamRef[]> =>
    axios.get(`${API}/teams`, auth())
        .then(r => extractTeams(r.data))
        .catch(err => { console.warn('[getAllTeams] failed:', (err as Error).message); return [] as TeamRef[]; });

// ── Stages  (backend: /stages) ────────────────────────────────────────────────
export interface Stage {
    _id: string;
    seasonId: string;
    name: string;
    stageType: 'LEAGUE' | 'BRACKET' | 'SWISS' | 'GROUPS';
    orderIndex: number;
    startAt: string;
    endAt: string;
    status: 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'COMPLETED';
    advancementCount: number;
    eliminationCount: number;
    rulesetId?: string;
    description?: string;
}
export const getStages = (seasonId: string): Promise<Stage[]> =>
    axios.get(`${API}/stages?seasonId=${seasonId}`, auth())
        .then(r => (Array.isArray(r.data) ? r.data : []) as Stage[])
        .catch(() => [] as Stage[]);
export const createStage = (dto: Partial<Stage> & { seasonId: string; name: string }) =>
    axios.post(`${API}/stages`, dto, auth()).then(r => r.data as Stage);
export const updateStage = (id: string, dto: Partial<Stage>) =>
    axios.patch(`${API}/stages/${id}`, dto, auth()).then(r => r.data as Stage);
export const deleteStage = (id: string) =>
    axios.delete(`${API}/stages/${id}`, auth()).then(r => r.data);

// ── Groups  (backend: /groups) ────────────────────────────────────────────────
export interface Group {
    _id: string;
    seasonId: string;
    stageId: string;
    name: string;
    groupIndex: number;
    teamIds: string[];
    advancementCount: number;
}
export const getGroups = (stageId: string): Promise<Group[]> =>
    axios.get(`${API}/groups?stageId=${stageId}`, auth())
        .then(r => (Array.isArray(r.data) ? r.data : []) as Group[])
        .catch(() => [] as Group[]);
export const createGroup = (dto: Partial<Group>) =>
    axios.post(`${API}/groups`, dto, auth()).then(r => r.data as Group);
export const assignGroupTeams = (groupId: string, teamIds: string[]) =>
    axios.patch(`${API}/groups/${groupId}/teams/bulk`, { teamIds }, auth()).then(r => r.data);
export const deleteGroup = (id: string) =>
    axios.delete(`${API}/groups/${id}`, auth()).then(r => r.data);

// ── Rounds  (backend: /rounds) ────────────────────────────────────────────────
export interface AdminRound {
    _id: string;
    seasonId: string;
    stageId?: string;
    roundNumber: number;
    startDate: string;
    endDate: string;
    status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED';
}
export const getAdminRounds = (seasonId: string): Promise<AdminRound[]> =>
    axios.get(`${API}/rounds?seasonId=${seasonId}`, auth())
        .then(r => (Array.isArray(r.data) ? r.data : []) as AdminRound[])
        .catch(() => [] as AdminRound[]);
export const generateRounds = (dto: { seasonId: string; stageId?: string; weekCount?: number; generateMatches?: boolean; }) =>
    axios.post(`${API}/rounds/generate`, dto, auth()).then(r => r.data);
export const updateRound = (id: string, dto: Partial<AdminRound>) =>
    axios.patch(`${API}/rounds/${id}`, dto, auth()).then(r => r.data);
export const deleteRound = (id: string) =>
    axios.delete(`${API}/rounds/${id}`, auth()).then(r => r.data);

// ── Matches  (backend: /matches) ─────────────────────────────────────────────
export interface GameResult {
    gameNumber: number; winnerId: string; mapName?: string;
    team1Score?: number; team2Score?: number;
}
export interface AdminMatch {
    _id: string;
    roundId: string | { _id: string; roundNumber: number };
    seasonId: string;
    groupId?: string;
    team1Id: string | { _id: string; name: string; logo?: string };
    team2Id: string | { _id: string; name: string; logo?: string };
    format?: 'BO1' | 'BO3' | 'BO5';
    scheduledStart: string;
    streamUrl?: string;
    status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'FORFEIT' | 'CANCELLED';
    team1GamesWon: number;
    team2GamesWon: number;
    winnerId?: string;
    games: GameResult[];
}
export const getMatchesByRound = (roundId: string): Promise<AdminMatch[]> =>
    axios.get(`${API}/matches?roundId=${roundId}`, auth())
        .then(r => (Array.isArray(r.data) ? r.data : []) as AdminMatch[])
        .catch(() => [] as AdminMatch[]);
export const getMatchesBySeason = (seasonId: string): Promise<AdminMatch[]> =>
    axios.get(`${API}/matches?seasonId=${seasonId}`, auth())
        .then(r => (Array.isArray(r.data) ? r.data : []) as AdminMatch[])
        .catch(() => [] as AdminMatch[]);
export const submitResult = (matchId: string, dto: { team1GamesWon: number; team2GamesWon: number; games?: GameResult[] }) =>
    axios.patch(`${API}/matches/${matchId}/result`, dto, auth()).then(r => r.data);
export const forfeitMatch = (matchId: string, dto: { forfeitingTeamId: string; forfeitReason?: string }) =>
    axios.patch(`${API}/matches/${matchId}/forfeit`, dto, auth()).then(r => r.data);

// ── Standings  (backend: /standings) ─────────────────────────────────────────
export interface StandingEntry {
    _id: string; seasonId: string; stageId?: string; groupId?: string;
    teamId: string | { _id: string; name: string; logo?: string };
    played: number; wins: number; losses: number; draws: number;
    points: number; gamesWon: number; gamesLost: number; gameDiff: number; rank: number;
}
export const getAdminStandings = (seasonId: string, groupId?: string, stageId?: string): Promise<StandingEntry[]> => {
    const q = new URLSearchParams({ seasonId });
    if (groupId) q.set('groupId', groupId);
    if (stageId) q.set('stageId', stageId);
    return axios.get(`${API}/standings?${q}`, auth())
        .then(r => (Array.isArray(r.data) ? r.data : []) as StandingEntry[])
        .catch(() => [] as StandingEntry[]);
};
export const recalculateStandings = (seasonId: string) =>
    axios.post(`${API}/standings/recalculate`, { seasonId }, auth()).then(r => r.data);

// ── Brackets  (backend: /brackets) ───────────────────────────────────────────
export interface BracketSlot {
    slotId: string; roundNumber: number; position: number;
    team1Id?: string; team2Id?: string; winnerId?: string;
    matchId?: string; nextSlotId?: string;
    status: 'PENDING' | 'READY' | 'COMPLETED' | 'BYE';
}
export interface AdminBracket {
    _id: string; seasonId: string;
    format: 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION';
    totalRounds: number; slots: BracketSlot[];
    status: 'PENDING' | 'ACTIVE' | 'COMPLETED'; championId?: string;
}
export const getAdminBracket = (seasonId: string): Promise<AdminBracket | null> =>
    axios.get(`${API}/brackets?seasonId=${seasonId}`, auth())
        .then(r => { const d = r.data; return Array.isArray(d) ? (d[0] ?? null) : (d ?? null); })
        .catch(() => null);
export const generateBracket = (dto: { seasonId: string; format: string; seededTeamIds?: string[] }) =>
    axios.post(`${API}/brackets/generate`, dto, auth()).then(r => r.data as AdminBracket);

// ── Season status  (backend: /seasons) ───────────────────────────────────────
export const activateSeason = (seasonId: string) =>
    axios.patch(`${API}/seasons/${seasonId}`, { status: 'ONGOING' }, auth()).then(r => r.data);
export const closeSeason = (seasonId: string) =>
    axios.patch(`${API}/seasons/${seasonId}`, { status: 'FINISHED' }, auth()).then(r => r.data);
