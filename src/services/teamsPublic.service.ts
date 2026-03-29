import { getApiBase } from '../lib/apiBase';

/** Public team row from GET /api/teams (no auth required on backend). */
export interface TeamListItem {
    _id: string;
    name: string;
    logo?: string;
    description?: string;
    isVerified?: boolean;
}

export async function fetchPublicTeams(): Promise<TeamListItem[]> {
    const res = await fetch(`${getApiBase()}/teams`);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = (err as { message?: unknown }).message;
        throw new Error(typeof msg === 'string' ? msg : 'Could not load teams');
    }
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((t) => {
        const row = t as Record<string, unknown>;
        const id = row._id != null ? String(row._id) : '';
        return {
            _id: id,
            name: row.name != null ? String(row.name) : 'Unnamed team',
            logo: row.logo != null ? String(row.logo) : undefined,
            description: row.description != null ? String(row.description) : undefined,
            isVerified: Boolean(row.isVerified),
        };
    });
}

/** Roster-shaped members from GET /api/teams/:id (populate shape varies). */
export type RosterMemberRow = { _id: string; nickname: string; email: string; avatar?: string };

/**
 * Public team detail (used when /team-manager/me/team fails but we still know `teamId`, e.g. stale JWT).
 */
export async function fetchTeamDetailForRoster(teamId: string): Promise<{
    _id: string;
    name: string;
    logo?: string;
    description?: string;
    type?: string;
    isVerified?: boolean;
    members: RosterMemberRow[];
} | null> {
    if (!teamId?.trim()) return null;
    const res = await fetch(`${getApiBase()}/teams/${encodeURIComponent(teamId.trim())}`);
    if (!res.ok) return null;
    const t = (await res.json()) as Record<string, unknown>;
    const id = t._id != null ? String(t._id) : '';
    const members: RosterMemberRow[] = [];
    const rawList = t.members;
    if (Array.isArray(rawList)) {
        for (const raw of rawList) {
            if (!raw || typeof raw !== 'object') continue;
            const m = raw as Record<string, unknown>;
            if (m.nickname != null && m.email != null) {
                members.push({
                    _id: String(m._id ?? ''),
                    nickname: String(m.nickname),
                    email: String(m.email),
                    avatar: m.avatar != null ? String(m.avatar) : undefined,
                });
                continue;
            }
            const uid = m.userId;
            if (uid != null && typeof uid === 'object') {
                const u = uid as Record<string, unknown>;
                if (u.nickname != null) {
                    members.push({
                        _id: String(u._id ?? m._id ?? ''),
                        nickname: String(u.nickname),
                        email: String(u.email ?? ''),
                        avatar: u.avatar != null ? String(u.avatar) : undefined,
                    });
                }
            }
        }
    }
    return {
        _id: id,
        name: t.name != null ? String(t.name) : 'Team',
        logo: t.logo != null ? String(t.logo) : undefined,
        description: t.description != null ? String(t.description) : undefined,
        type: t.type != null ? String(t.type) : undefined,
        isVerified: Boolean(t.isVerified),
        members,
    };
}
