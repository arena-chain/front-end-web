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

export function authHeaders() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}
