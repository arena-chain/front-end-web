// src/services/userService.ts

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Base User entity from backend
export interface User {
    _id: string;
    nickname: string;
    email: string;
    role: string;
    isActive: boolean;
    refreshToken?: string;
    createdAt: string;
    updatedAt: string;
}

// Profile interfaces matching backend schemas
export interface PlayerProfile {
    _id: string;
    userId: string | User; // Can be populated or just ID
    isPro: boolean;
    isVerified: boolean;
    elo: number;
    rank: string;
    stats: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface TeamManagerProfile {
    _id: string;
    userId: string | User;
    managedTeams: string[];
    organizationName?: string;
    createdAt: string;
    updatedAt: string;
}

export interface RefereeProfile {
    _id: string;
    userId: string | User;
    level: string;
    rating: number;
    assignedMatches: string[];
    createdAt: string;
    updatedAt: string;
}

export interface AdminProfile {
    _id: string;
    userId: string | User;
    adminLevel: number;
    permissions: string[];
    createdAt: string;
    avatar?: string;
    region?: string;
    updatedAt: string;
}

// Generic profile type for the UI
export interface Profile {
    _id: string;
    userId: User;
    [key: string]: any;
}

// Extended user with all profile data (for future use)
export interface UserWithProfiles extends User {
    roles: string[];
    profiles: {
        player?: PlayerProfile;
        teamManager?: TeamManagerProfile;
        referee?: RefereeProfile;
        admin?: AdminProfile;
    };
}

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const UserService = {
    // Get all users from /users endpoint
    async getAllUsers(): Promise<User[]> {
        const response = await fetch(`${API_URL}/users`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch users');
        return response.json();
    },

    // NOTE: The backend doesn't have separate endpoints for each role
    // We need to implement these in the backend or fetch from /users and filter
    // For now, these will throw errors until backend endpoints are created

    async getPlayers(): Promise<Profile[]> {
        // TODO: Backend needs to implement GET /player endpoint
        // Or fetch all users and filter by role
        const response = await fetch(`${API_URL}/player`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch players');
        return response.json();
    },

    async getTeamManagers(): Promise<Profile[]> {
        // TODO: Backend needs to implement GET /team-manager endpoint
        const response = await fetch(`${API_URL}/team-manager`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch team managers');
        return response.json();
    },

    async getReferees(): Promise<Profile[]> {
        // TODO: Backend needs to implement GET /referee endpoint
        const response = await fetch(`${API_URL}/referee`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch referees');
        return response.json();
    },

    async getAdmins(): Promise<Profile[]> {
        // TODO: Backend needs to implement GET /admin endpoint
        const response = await fetch(`${API_URL}/admin`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch admins');
        return response.json();
    },

    // User management actions
    async blockUser(userId: string): Promise<User> {
        const response = await fetch(`${API_URL}/users/${userId}/block`, {
            method: 'PATCH',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to block user');
        return response.json();
    },

    async unblockUser(userId: string): Promise<User> {
        const response = await fetch(`${API_URL}/users/${userId}/unblock`, {
            method: 'PATCH',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to unblock user');
        return response.json();

        if (!response.ok) {
            throw new Error('Failed to unblock user');
        }
    },

    async deleteUser(id: string): Promise<void> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to delete user');

        if (!response.ok) {
            throw new Error('Failed to delete user');
        }
    }
};
