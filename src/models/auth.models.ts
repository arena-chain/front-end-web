export interface UserProfile {
    isPro?: boolean;
    isVerified?: boolean;
    elo?: number;
    rank?: string;
    [key: string]: unknown;
}

/** Mirrors Flutter `TeamManagerProfile` / backend team-manager profile. */
export interface TeamManagerProfile {
    organizationName?: string;
    firstName?: string;
    lastName?: string;
    cin?: string;
    age?: number;
    gender?: string;
    description?: string;
    phoneNumber?: string;
    /** Resolved team id (from ObjectId or populated `team`). */
    teamId?: string;
    teamName?: string;
    status: string;
    userId: string;
    isVerified?: boolean;
}

export interface User {
    id: string;
    email: string;
    nickname: string;
    /** Always normalized to lowercase with underscores (e.g. `team_manager`). */
    role: 'player' | 'admin' | 'team_manager' | 'referee' | 'scouter';
    isEmailVerified?: boolean;
    avatar?: string;
    country?: string;
    /** Set when `role === 'player'`. */
    profile?: UserProfile;
    /** Set when `role === 'team_manager'`. */
    teamManagerProfile?: TeamManagerProfile;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
    message?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface VerifyOtpRequest {
    email: string;
    otp: string;
}

export interface ResetPasswordRequest {
    email: string;
    otp: string;
    newPassword: string;
}

export interface VerifyEmailRequest {
    email: string;
    otp: string;
}

export interface RegisterPlayerRequest {
    email: string;
    password: string;
    nickname: string;
    isPro?: boolean;
    isVerified?: boolean;
    role?: 'player';
}

export interface RegisterAdminRequest {
    email: string;
    password: string;
    nickname: string;
    adminLevel: number;
    permissions: string[];
    role?: 'admin';
}

export interface RegisterTeamManagerRequest {
    email: string;
    password: string;
    nickname: string;
    organizationName?: string;
    /** Selected team Mongo id from GET /teams */
    teamId: string;
    role?: 'team-manager';
    region?: string;
    country?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    description?: string;
}

export interface RegisterRefereeRequest {
    email: string;
    password: string;
    nickname: string;
    level?: string;
    role?: 'referee';
}

export interface RegisterScouterRequest {
    email: string;
    password: string;
    nickname: string;
    role?: 'scouter';
    level?: 'REGIONAL' | 'NATIONAL' | 'INTERNATIONAL';
    notes?: string;
}
