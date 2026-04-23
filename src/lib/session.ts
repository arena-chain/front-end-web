import type { User } from '../models/auth.models';
import { normalizeAuthUser } from './parseAuthUser';

export interface StoredUser {
    id?: string;
    email?: string;
    nickname?: string;
    role?: string;
}

export function getToken() {
    return localStorage.getItem('token');
}

export function getStoredUser(): StoredUser | null {
    const raw = localStorage.getItem('user');

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as StoredUser;
    } catch {
        return null;
    }
}

/** Same normalization as Flutter `User.fromJson` for guards and teamId. */
export function getStoredUserNormalized(): User | null {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
        return normalizeAuthUser(JSON.parse(raw) as unknown);
    } catch {
        return null;
    }
}

export function getRefreshToken() {
    return localStorage.getItem('refreshToken');
}

export function authHeaders() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}
