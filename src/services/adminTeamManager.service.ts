import axios from 'axios';
import { getApiBase } from '../lib/apiBase';

const API_URL = getApiBase();
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export interface PendingTeamManagerRow {
    _id: string;
    userId: unknown;
    organizationName?: string;
    status: string;
    team?: unknown;
    firstName?: string;
    lastName?: string;
}

function extractUserId(userId: unknown): string {
    if (userId != null && typeof userId === 'object' && '_id' in (userId as object)) {
        return String((userId as { _id: unknown })._id);
    }
    return userId != null ? String(userId) : '';
}

/** Admin-only: pending manager verification queue (`GET /api/team-manager/pending`). */
export const adminTeamManagerService = {
    getPending: async (): Promise<PendingTeamManagerRow[]> => {
        const res = await axios.get(`${API_URL}/team-manager/pending`, auth());
        return Array.isArray(res.data) ? res.data : [];
    },

    approve: async (row: PendingTeamManagerRow) => {
        const uid = extractUserId(row.userId);
        if (!uid) throw new Error('Missing user id on profile');
        const res = await axios.patch(`${API_URL}/team-manager/${uid}/approve`, {}, auth());
        return res.data;
    },

    reject: async (row: PendingTeamManagerRow) => {
        const uid = extractUserId(row.userId);
        if (!uid) throw new Error('Missing user id on profile');
        const res = await axios.patch(`${API_URL}/team-manager/${uid}/reject`, {}, auth());
        return res.data;
    },
};
