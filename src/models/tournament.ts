// Tournament TypeScript Models and Interfaces



// Using const objects instead of enums for better TypeScript compatibility
export const TournamentFormat = {
    SINGLE_ELIMINATION: 'SINGLE_ELIMINATION',
    DOUBLE_ELIMINATION: 'DOUBLE_ELIMINATION',
    SWISS: 'SWISS',
    ROUND_ROBIN: 'ROUND_ROBIN',
} as const;
export type TournamentFormat = typeof TournamentFormat[keyof typeof TournamentFormat];

export const TournamentStatus = {
    DRAFT: 'DRAFT',
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    OPEN_REGISTRATION: 'OPEN_REGISTRATION',
    ONGOING: 'ONGOING',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    REJECTED: 'REJECTED',
    BLOCKED: 'BLOCKED',
} as const;
export type TournamentStatus = typeof TournamentStatus[keyof typeof TournamentStatus];

import type { TicketType } from './ticket';
export type { TicketType };

export const PhaseName = {
    PLAY_IN: 'PLAY_IN',
    GROUP_STAGE: 'GROUP_STAGE',
    QUARTERFINALS: 'QUARTERFINALS',
    SEMIFINALS: 'SEMIFINALS',
    FINALS: 'FINALS',
} as const;
export type PhaseName = typeof PhaseName[keyof typeof PhaseName];

export const PhaseStatus = {
    PENDING: 'PENDING',
    ONGOING: 'ONGOING',
    COMPLETED: 'COMPLETED',
} as const;
export type PhaseStatus = typeof PhaseStatus[keyof typeof PhaseStatus];

export const TournamentRegion = {
    GLOBAL: 'GLOBAL',
    EUROPE: 'EUROPE',
    NORTH_AMERICA: 'NORTH_AMERICA',
    ASIA: 'ASIA',
    SOUTH_AMERICA: 'SOUTH_AMERICA',
    MIDDLE_EAST: 'MIDDLE_EAST',
} as const;
export type TournamentRegion = typeof TournamentRegion[keyof typeof TournamentRegion];

export const GameMode = {
    SOLO: '1v1 (SOLO)',
    DUO: '2v2 (DUO)',
    SQUAD_3: '3v3 (TRIO)',
    SQUAD_4: '4v4 (SQUAD)',
    SQUAD_5: '5v5 (PRO)',
    BATTLE_ROYALE: 'BATTLE ROYALE',
} as const;
export type GameMode = typeof GameMode[keyof typeof GameMode];

export interface TournamentPhase {
    name: PhaseName;
    status: PhaseStatus;
    startDate?: string;
    endDate?: string;
    matches: string[]; // Array of match IDs
}

export interface Game {
    _id: string;
    title: string;
    genre: string;
    coverImageUrl?: string;
}

export interface Organizer {
    _id: string;
    username: string;
    name?: string;
    avatarUrl?: string;
    email: string;
    bio?: string;
    verified?: boolean;
}

export interface Tournament {
    _id: string;
    name: string;
    description?: string;
    gameId: Game;
    organizerId: Organizer;
    region: TournamentRegion;
    gameMode: GameMode;
    startDate: string;
    endDate: string;
    registrationStart?: string;
    registrationEnd?: string;
    maxTeams: number;
    currentTeams: number;
    teams: string[]; // Array of team IDs or populated team objects
    registrationOpen: boolean;
    prizePool: number;
    firstPlace: number;
    secondPlace: number;
    thirdPlace: number;
    format: TournamentFormat;
    phases: TournamentPhase[];
    status: TournamentStatus;
    rules?: Record<string, any>;
    bannerImageUrl?: string;
    streamUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTournamentDto {
    name: string;
    description?: string;
    gameId: string;
    organizerId: string;
    region: TournamentRegion;
    gameMode: GameMode;
    startDate: Date;
    endDate: Date;
    registrationStart?: Date;
    registrationEnd?: Date;
    maxTeams: number;
    format: TournamentFormat;
    prizePool: number;
    firstPlace: number;
    secondPlace: number;
    thirdPlace: number;
    bannerImageUrl?: string; // Made optional
    streamUrl?: string; // Made optional
    registrationOpen: boolean;
}

export interface UpdateTournamentDto {
    name?: string;
    description?: string;
    region?: TournamentRegion;
    gameMode?: GameMode;
    startDate?: Date;
    endDate?: Date;
    registrationStart?: Date;
    registrationEnd?: Date;
    maxTeams?: number;
    prizePool?: number;
    firstPlace?: number;
    secondPlace?: number;
    thirdPlace?: number;
    format?: TournamentFormat;
    status?: TournamentStatus;
    registrationOpen?: boolean;
    rules?: Record<string, any>;
    bannerImageUrl?: string;
    streamUrl?: string;
}

export interface AddPhaseDto {
    name: PhaseName;
    startDate?: Date;
    endDate?: Date;
}

export interface UpdatePhaseStatusDto {
    status: PhaseStatus;
}
