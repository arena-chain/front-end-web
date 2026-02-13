import type { AuthResponse, LoginRequest, RegisterAdminRequest, RegisterPlayerRequest, RegisterTeamManagerRequest, RegisterRefereeRequest, ResetPasswordRequest } from '../models/auth.models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const AuthService = {
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

        return response.json();
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
            const error = await response.json();
            throw new Error(error.message || 'Registration failed');
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
        localStorage.removeItem('user');
    }
};
