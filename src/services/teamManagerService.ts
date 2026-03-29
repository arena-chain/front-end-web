import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

// ── Payload types ──────────────────────────────────────────────────────────────

export interface UpdateProfilePayload {
    organizationName?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    description?: string;
}

export interface CreateTeamPayload {
    name: string;
    organizationName?: string;
    logo?: string;          // URL or base64 string
    description?: string;
    type?: 'amateur' | 'pro';
}

export interface UpdateTeamPayload {
    name?: string;
    organizationName?: string;
    logo?: string;
    description?: string;
}

// ── Service ────────────────────────────────────────────────────────────────────

export const teamManagerService = {
    /** GET /team-manager/me — full profile with team */
    getMyProfile: async () => {
        const res = await axios.get(`${API_URL}/team-manager/me`, auth());
        return res.data;
    },

    /** PATCH /team-manager/me — update profile fields */
    updateMyProfile: async (payload: UpdateProfilePayload) => {
        const res = await axios.patch(`${API_URL}/team-manager/me`, payload, auth());
        return res.data;
    },

    /** POST /team-manager/me/team — create team (once only) */
    createTeam: async (payload: CreateTeamPayload) => {
        const res = await axios.post(`${API_URL}/team-manager/me/team`, payload, auth());
        return res.data;
    },

    /** GET /team-manager/me/team — full team with populated members. Returns null if no team exists yet (404). */
    getMyTeam: async (): Promise<TeamData | null> => {
        try {
            const res = await axios.get(`${API_URL}/team-manager/me/team`, auth());
            return res.data;
        } catch (err: unknown) {
            if ((err as { response?: { status?: number } })?.response?.status === 404) return null;
            throw err;
        }
    },

    /** PATCH /team-manager/me/team — update team name/logo/description */
    updateTeam: async (payload: UpdateTeamPayload) => {
        const res = await axios.patch(`${API_URL}/team-manager/me/team`, payload, auth());
        return res.data;
    },

    /** GET /team-manager/me/team/roster/search?q= — search available players */
    searchPlayers: async (q?: string) => {
        const res = await axios.get(`${API_URL}/team-manager/me/team/roster/search`, {
            params: q ? { q } : {},
            ...auth(),
        });
        return res.data as PlayerSearchResult[];
    },

    /** POST /team-manager/me/team/roster/invite — invite player by userId */
    invitePlayer: async (playerUserId: string) => {
        const res = await axios.post(`${API_URL}/team-manager/me/team/roster/invite`, { playerUserId }, auth());
        return res.data;
    },

    /** DELETE /team-manager/me/team/roster/:playerUserId — remove player */
    removePlayer: async (playerUserId: string) => {
        const res = await axios.delete(`${API_URL}/team-manager/me/team/roster/${playerUserId}`, auth());
        return res.data;
    },

    // ── Legacy shim (kept so old callers don't break) ──────────────────────────
    updateProfile: async (_userId: string, payload: UpdateProfilePayload) => {
        const res = await axios.patch(`${API_URL}/team-manager/me`, payload, auth());
        return res.data;
    },
};

// ── Shared types ───────────────────────────────────────────────────────────────

export interface PlayerSearchResult {
    _id: string;
    userId: {
        _id: string;
        nickname: string;
        avatar?: string;
        email: string;
        country?: string;
    };
    elo?: number;
    rank?: string;
}

export interface TeamMember {
    _id: string;
    nickname: string;
    avatar?: string;
    email: string;
}

export interface TeamData {
    _id: string;
    name: string;
    organizationName?: string;
    logo?: string;
    description?: string;
    type?: string;
    members: TeamMember[];
    isVerified?: boolean;
}
