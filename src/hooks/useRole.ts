import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Role helpers aligned with the platform spec (lowercase `team_manager`, etc.).
 */
export function useRole() {
    const { user } = useAuth();
    const role = user?.role?.toLowerCase() ?? '';

    return useMemo(
        () => ({
            role,
            isAdmin: role === 'admin',
            isManager: role === 'team_manager',
            isPlayer: role === 'player',
            isReferee: role === 'referee',
            isScouter: role === 'scouter',
        }),
        [role]
    );
}
