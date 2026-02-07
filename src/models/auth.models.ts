export interface UserProfile {
    isPro?: boolean;
    isVerified?: boolean;
    [key: string]: any;
}

export interface User {
    id: string;
    email: string;
    nickname: string;
    role: 'player' | 'admin' | 'team-manager' | 'referee';
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
