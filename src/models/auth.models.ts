export interface UserProfile {
    isPro?: boolean;
    isVerified?: boolean;
    [key: string]: unknown;
}

export interface User {
    id: string;
    email: string;
    nickname: string;
    role: 'player' | 'admin' | 'team-manager' | 'team_manager' | 'referee' | 'scouter';
    profile?: UserProfile;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
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
    role?: 'team-manager';
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
