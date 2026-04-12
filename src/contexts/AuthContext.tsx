import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { User } from '../models/auth.models';
import { AuthService } from '../services/auth.service';
import { normalizeAuthUser } from '../lib/parseAuthUser';

type AuthCtx = {
    user: User | null;
    setUser: (u: User | null) => void;
    refreshProfile: () => Promise<User | null>;
    hydrateFromStorage: () => void;
    logout: () => void;
};

const AuthContext = createContext<AuthCtx | null>(null);

function readUserFromStorage(): User | null {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
        return normalizeAuthUser(JSON.parse(raw) as unknown);
    } catch {
        return null;
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUserState] = useState<User | null>(() => readUserFromStorage());

    const setUser = useCallback((u: User | null) => {
        setUserState(u);
        if (u) localStorage.setItem('user', JSON.stringify(u));
        else localStorage.removeItem('user');
    }, []);

    const hydrateFromStorage = useCallback(() => {
        setUserState(readUserFromStorage());
    }, []);

    const refreshProfile = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token || token === 'bypass_token_dev_only') {
            hydrateFromStorage();
            return readUserFromStorage();
        }
        try {
            const u = await AuthService.fetchProfile();
            setUserState(u);
            return u;
        } catch {
            return readUserFromStorage();
        }
    }, [hydrateFromStorage]);

    const logout = useCallback(() => {
        AuthService.logout();
        setUserState(null);
    }, []);

    const value = useMemo(
        () => ({ user, setUser, refreshProfile, hydrateFromStorage, logout }),
        [user, setUser, refreshProfile, hydrateFromStorage, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
