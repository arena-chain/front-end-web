// src/services/userService.ts

/** Global prefix `/api` — see backend docs (e.g. GET /api/users). */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Base User entity from backend (admin list item)
export interface User {
    _id: string;
    nickname: string;
    email: string;
    role: string;
    isActive: boolean;
    isEmailVerified?: boolean;
    region?: string;
    country?: string;
    avatar?: string;
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

function unwrapUserArray(data: unknown): User[] {
    if (Array.isArray(data)) return data as User[];
    if (data && typeof data === 'object') {
        const o = data as Record<string, unknown>;
        if (Array.isArray(o.data)) return o.data as User[];
        if (Array.isArray(o.users)) return o.users as User[];
    }
    return [];
}

/** Normalized row for reported players (admin moderation). Backend: GET /users/reported */
export interface ReportedPlayerRow {
    _id: string;
    userId: User;
    reportCount?: number;
    lastReason?: string;
    lastReportAt?: string;
    createdAt?: string;
    role?: string;
    [key: string]: unknown;
}

function normalizeReportedRow(item: Record<string, unknown>): ReportedPlayerRow | null {
    if (item.userId && typeof item.userId === 'object' && item.userId !== null && '_id' in item.userId) {
        return item as unknown as ReportedPlayerRow;
    }
    const nested =
        (item.reportedUser as Record<string, unknown> | undefined) ||
        (item.player as Record<string, unknown> | undefined) ||
        (item.user as Record<string, unknown> | undefined);
    const flatUser =
        nested ||
        (item._id && item.email ? item : null);
    if (!flatUser || typeof flatUser !== 'object' || !('_id' in flatUser)) return null;
    const u = flatUser as unknown as User;
    return {
        _id: String(item._id ?? `report-${u._id}`),
        userId: u,
        reportCount: (item.reportCount ?? item.count ?? item.reportsCount) as number | undefined,
        lastReason: (item.reason ?? item.lastReason ?? item.category ?? item.message) as string | undefined,
        lastReportAt: (item.lastReportAt ?? item.updatedAt) as string | undefined,
        createdAt: item.createdAt as string | undefined,
    };
}

export const UserService = {
    // Get all users from /users endpoint
    async getAllUsers(): Promise<User[]> {
        const response = await fetch(`${API_URL}/users`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        return unwrapUserArray(data);
    },

    /** Accounts with isActive === false */
    async getBlockedUsers(): Promise<ReportedPlayerRow[]> {
        const all = await UserService.getAllUsers();
        return all
            .filter(u => !u.isActive)
            .map(u => ({
                _id: u._id,
                userId: u,
                createdAt: u.createdAt,
                role: u.role,
            }));
    },

    /**
     * Players flagged by user reports. Expects backend GET /users/reported (admin).
     * Returns [] if the route is missing or empty.
     */
    async getReportedPlayers(): Promise<ReportedPlayerRow[]> {
        const tryUrls = [
            `${API_URL}/users/reported`,
            `${API_URL}/users/reports`,
            `${API_URL}/admin/users/reported`,
        ];
        for (const url of tryUrls) {
            try {
                const response = await fetch(url, { headers: getHeaders() });
                if (response.status === 404) continue;
                if (!response.ok) continue;
                const data = await response.json();
                const raw = Array.isArray(data) ? data : (data as { data?: unknown[] })?.data ?? (data as { reports?: unknown[] })?.reports ?? [];
                if (!Array.isArray(raw)) continue;
                const rows: ReportedPlayerRow[] = [];
                for (const item of raw) {
                    if (item && typeof item === 'object') {
                        const row = normalizeReportedRow(item as Record<string, unknown>);
                        if (row) rows.push(row);
                    }
                }
                return rows;
            } catch {
                /* try next */
            }
        }
        return [];
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
    },

    async deleteUser(id: string): Promise<void> {
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to delete user');
    }
};
