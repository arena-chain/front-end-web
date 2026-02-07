import type { AuthResponse, LoginRequest, RegisterAdminRequest, RegisterPlayerRequest, RegisterTeamManagerRequest, RegisterRefereeRequest } from '../models/auth.models';

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

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
};
