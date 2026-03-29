import { Navigate, useLocation } from 'react-router-dom';
import type { User } from '../../models/auth.models';
import { useAuth } from '../../contexts/AuthContext';
import { normalizeRole } from '../../lib/parseAuthUser';
import { getStoredUserNormalized } from '../../lib/session';

const DEV_BYPASS_TOKEN = 'bypass_token_dev_only';

type Role = User['role'];

function routeForRole(role: Role): string {
    switch (role) {
        case 'admin':
            return '/admin/dashboard';
        case 'team_manager':
            return '/manager/dashboard';
        case 'referee':
            return '/referee/dashboard';
        case 'scouter':
            return '/scouter/dashboard';
        default:
            return '/player/dashboard';
    }
}

/**
 * Requires a valid session and one of `allow` roles (normalized).
 * Dev bypass user (static admin) is allowed when `allow` includes `admin`.
 */
export default function RequireRole({
    allow,
    children,
}: {
    allow: Role[];
    children: React.ReactNode;
}) {
    const { user } = useAuth();
    const location = useLocation();

    const token = localStorage.getItem('token');
    const raw = user ?? getStoredUserNormalized();

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (token === DEV_BYPASS_TOKEN) {
        const ok = allow.includes('admin') && raw?.role === 'admin';
        if (ok) return <>{children}</>;
        return <Navigate to="/login" replace />;
    }

    if (!raw?.role) {
        return <Navigate to="/login" replace />;
    }

    const role = normalizeRole(raw.role);
    if (!allow.includes(role)) {
        return <Navigate to={routeForRole(role)} replace />;
    }

    return <>{children}</>;
}
