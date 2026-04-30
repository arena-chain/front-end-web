import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export type FormatType = 'LEAGUE' | 'SWISS' | 'KNOCKOUT';
export type MatchType = 'BO1' | 'BO3' | 'BO5';
export type Tiebreaker = 'POINTS' | 'GAME_DIFF' | 'HEAD_TO_HEAD';

/** Which phase(s) this ruleset applies to */
export type RuleUsage = 'REGULAR_SEASON' | 'PLAYOFFS' | 'GRAND_FINAL' | 'PLAY_IN' | 'QUALIFICATION' | 'GROUP_STAGE';

/** How attack/defense (or blue/red) is decided */
export type SideSelection =
    | 'HIGHER_SEED_CHOOSES'
    | 'KNIFE_ROUND'
    | 'COIN_TOSS'
    | 'VETO_WINNER_CHOOSES'
    | 'FIXED_TEAM_A_ATTACK';

/** How scores are submitted and validated */
export type ScoreSubmissionMethod = 'ADMIN_VERIFIED' | 'BOTH_TEAMS_CONFIRM' | 'AUTO_FROM_API';

export type MapVetoFormat =
    | 'BAN_BAN_PICK_PICK_BAN_BAN_DECIDER'
    | 'BAN_BAN_PICK_PICK_PICK_PICK_DECIDER'
    | 'PICK_PICK_DECIDER'
    | 'BAN_BAN_DECIDER'
    | 'RANDOM'
    | 'ADMIN_PICK';
export type VetoFirstPick = 'HIGHER_SEED' | 'LOWER_SEED' | 'COIN_FLIP' | 'ADMIN';
export type OvertimeFormat = 'NONE' | 'VALORANT_OT' | 'CS2_OT';

export interface OvertimeConfig {
    format: OvertimeFormat;
    enabled: boolean;
    maxRoundsPerPeriod?: number;
    startMoney?: number;
    allowDrawIfDisabled?: boolean;
    maxOvertimePeriods?: number;
}

export interface PopulatedGame {
    _id: string;
    title: string;
    genre?: string;
    publisher?: string;
    teamSize?: number;
    supportsTeams?: boolean;
    coverImageUrl?: string;
}

/** A rule set belonging to a specific season */
export interface SeasonRule {
    _id: string;
    /** The season this rule belongs to */
    seasonId: string;
    name: string;
    gameId: string | PopulatedGame;
    formatType: FormatType;
    matchType: MatchType;
    pointsWin: number;
    pointsLoss: number;
    maxTeams: number;
    maxForfeitsBeforeDisqualification?: number;
    forfeitCountsAsLoss?: boolean;
    tiebreaker: Tiebreaker;
    mapPool?: string[];
    mapVetoEnabled?: boolean;
    mapVetoFormat?: MapVetoFormat | null;
    vetoFirstPick?: VetoFirstPick | null;
    overtimeConfig?: OvertimeConfig;
    extraRules?: Record<string, unknown>;
    /** Phase(s) this ruleset applies to */
    ruleUsage?: RuleUsage[];
    /** How attack/defense (blue/red) is decided */
    sideSelection?: SideSelection;
    /** Score submission / validation */
    scoreSubmissionMethod?: ScoreSubmissionMethod;
    substitutionsAllowed?: boolean;
    maxSubstitutions?: number;
    emergencySubsOnly?: boolean;
    pauseAllowedForDisconnect?: boolean;
    replayConditions?: string;
    remakeConditions?: string;
    adminDecisionRequired?: boolean;
    createdAt?: string;
}

/** Alias for backward compatibility */
export type LeagueRule = SeasonRule;

export interface CreateSeasonRuleDto {
    /** Season this rule is attached to */
    seasonId: string;
    name: string;
    gameId: string;
    formatType: FormatType;
    matchType: MatchType;
    pointsWin: number;
    pointsLoss: number;
    maxTeams: number;
    maxForfeitsBeforeDisqualification?: number;
    forfeitCountsAsLoss?: boolean;
    tiebreaker: Tiebreaker;
    mapPool?: string[];
    mapVetoEnabled?: boolean;
    mapVetoFormat?: MapVetoFormat | null;
    vetoFirstPick?: VetoFirstPick | null;
    overtimeConfig?: OvertimeConfig;
    extraRules?: Record<string, unknown>;
    ruleUsage?: RuleUsage[];
    sideSelection?: SideSelection;
    scoreSubmissionMethod?: ScoreSubmissionMethod;
    substitutionsAllowed?: boolean;
    maxSubstitutions?: number;
    emergencySubsOnly?: boolean;
    pauseAllowedForDisconnect?: boolean;
    replayConditions?: string;
    remakeConditions?: string;
    adminDecisionRequired?: boolean;
}

/** Alias for backward compatibility */
export type CreateLeagueRuleDto = CreateSeasonRuleDto;

export const leagueRulesService = {
    /** Fetch all rules (global — avoid when possible, prefer getBySeasonId) */
    getAll: (): Promise<SeasonRule[]> =>
        axios.get(`${API}/league-rules`).then(r => r.data),

    /** Fetch rules belonging to a specific season */
    getBySeasonId: (seasonId: string): Promise<SeasonRule[]> =>
        axios.get(`${API}/league-rules?seasonId=${seasonId}`).then(r => r.data),

    getById: (id: string): Promise<SeasonRule> =>
        axios.get(`${API}/league-rules/${id}`).then(r => r.data),

    create: (dto: CreateSeasonRuleDto): Promise<SeasonRule> =>
        axios.post(`${API}/league-rules`, dto, auth()).then(r => r.data),

    update: (id: string, dto: Partial<CreateSeasonRuleDto>): Promise<SeasonRule> =>
        axios.patch(`${API}/league-rules/${id}`, dto, auth()).then(r => r.data),

    delete: (id: string): Promise<void> =>
        axios.delete(`${API}/league-rules/${id}`, auth()).then(r => r.data),
};
