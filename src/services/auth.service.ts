import type { AuthResponse, LoginRequest, RegisterAdminRequest, RegisterPlayerRequest, RegisterTeamManagerRequest, RegisterRefereeRequest, RegisterScouterRequest, ResetPasswordRequest, User } from '../models/auth.models';
import { getApiBase } from '../lib/apiBase';
import { normalizeAuthUser } from '../lib/parseAuthUser';

const API_URL = getApiBase();

function persistSession(accessToken: string, refreshToken: string, user: User) {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
}

function formatApiError(error: unknown, fallback: string): string {
    if (error && typeof error === 'object' && 'message' in error) {
        const m = (error as { message: unknown }).message;
        if (Array.isArray(m)) return m.map(String).join(', ');
        if (typeof m === 'string' && m.length > 0) return m;
    }
    return fallback;
}

export const AuthService = {
    persistSession,

    async login(data: LoginRequest): Promise<AuthResponse> {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login failed');
        }

        const raw = await response.json();
        const user = normalizeAuthUser(raw.user ?? raw);
        const accessToken = raw.accessToken as string;
        const refreshToken = raw.refreshToken as string;
        persistSession(accessToken, refreshToken, user);
        return { accessToken, refreshToken, user, message: raw.message };
    },

    /** GET /auth/profile — use after role changes or to hydrate `teamId` / profiles. */
    async fetchProfile(): Promise<User> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/auth/profile`, {
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error((err as { message?: string }).message || 'Failed to load profile');
        }
        const raw = await response.json();
        const user = normalizeAuthUser(raw);
        const u = localStorage.getItem('user');
        if (u) {
            try {
                const prev = JSON.parse(u) as User;
                if (!user.teamManagerProfile?.teamId && prev.teamManagerProfile?.teamId) {
                    user.teamManagerProfile = { ...user.teamManagerProfile, ...prev.teamManagerProfile };
                }
                if (!user.profile && prev.profile) user.profile = prev.profile;
            } catch {
                /* ignore */
            }
        }
        localStorage.setItem('user', JSON.stringify(user));
        return user;
    },

    async registerPlayer(data: RegisterPlayerRequest): Promise<AuthResponse> {
        const response = await fetch(`${API_URL}/auth/register/player`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Registration failed');
        }

        return response.json();
    },

    async registerTeamManager(data: RegisterTeamManagerRequest): Promise<AuthResponse> {
        const response = await fetch(`${API_URL}/auth/register/team-manager`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(formatApiError(error, 'Registration failed'));
        }

        return response.json();
    },

    async registerReferee(data: RegisterRefereeRequest): Promise<AuthResponse> {
        const response = await fetch(`${API_URL}/auth/register/referee`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Registration failed');
        }

        return response.json();
    },

    async registerScouter(data: RegisterScouterRequest): Promise<AuthResponse> {
        const response = await fetch(`${API_URL}/auth/register/scouter`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: data.email,
                password: data.password,
                nickname: data.nickname,
                level: data.level,
                notes: data.notes,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Registration failed');
        }

        return response.json();
    },

    async registerAdmin(data: RegisterAdminRequest): Promise<AuthResponse> {
        const response = await fetch(`${API_URL}/auth/register/admin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Registration failed');
        }

        return response.json();
    },

    async forgotPassword(email: string): Promise<any> {
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to request password reset');
        }

        return response.json();
    },

    async verifyResetOtp(email: string, otp: string): Promise<any> {
        const response = await fetch(`${API_URL}/auth/verify-reset-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, otp }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Invalid or expired OTP');
        }

        return response.json();
    },

    async resetPassword(data: ResetPasswordRequest): Promise<any> {
        const response = await fetch(`${API_URL}/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to reset password');
        }

        return response.json();
    },

    async verifyEmail(email: string, otp: string): Promise<any> {
        const response = await fetch(`${API_URL}/auth/verify-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, otp }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Email verification failed');
        }

        return response.json();
    },

    async resendOtp(email: string): Promise<any> {
        const response = await fetch(`${API_URL}/auth/resend-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to resend OTP');
        }

        return response.json();
    },

    getApiUrl() {
        return API_URL;
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    }
};
