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
export type TeamMediaRow = { _id?: string; title: string; url?: string; thumbnail?: string };
export type TeamTrophyRow = { _id?: string; title: string; season?: string; position?: string; year?: string };

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
    videos?: TeamMediaRow[];
    highlights?: TeamMediaRow[];
    trophies?: TeamTrophyRow[];
} | null> {
    if (!teamId?.trim()) return null;
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const readAsTeam = (raw: unknown): Record<string, unknown> | null => {
        if (!raw || typeof raw !== 'object') return null;
        const obj = raw as Record<string, unknown>;
        if (obj.data && typeof obj.data === 'object') return obj.data as Record<string, unknown>;
        if (obj.team && typeof obj.team === 'object') return obj.team as Record<string, unknown>;
        return obj;
    };
    const mapMedia = (raw: unknown): TeamMediaRow[] => {
        if (!Array.isArray(raw)) return [];
        return raw
            .filter((x) => x && typeof x === 'object')
            .map((x) => {
                const row = x as Record<string, unknown>;
                return {
                    _id: row._id != null ? String(row._id) : undefined,
                    title: row.title != null ? String(row.title) : 'Untitled',
                    url: row.url != null ? String(row.url) : undefined,
                    thumbnail: row.thumbnail != null ? String(row.thumbnail) : undefined,
                };
            });
    };
    const mapTrophies = (raw: unknown): TeamTrophyRow[] => {
        if (!Array.isArray(raw)) return [];
        return raw
            .filter((x) => x && typeof x === 'object')
            .map((x) => {
                const row = x as Record<string, unknown>;
                return {
                    _id: row._id != null ? String(row._id) : undefined,
                    title: row.title != null ? String(row.title) : 'Trophy',
                    season: row.season != null ? String(row.season) : undefined,
                    position: row.position != null ? String(row.position) : undefined,
                    year: row.year != null ? String(row.year) : undefined,
                };
            });
    };
    const fromRecord = (t: Record<string, unknown>) => {
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
            videos: mapMedia(t.videos),
            highlights: mapMedia(t.highlights),
            trophies: mapTrophies(t.trophies),
        };
    };

    const res = await fetch(`${getApiBase()}/teams/${encodeURIComponent(teamId.trim())}`, { headers });
    if (!res.ok) {
        const list = await fetchPublicTeams().catch(() => [] as TeamListItem[]);
        const fallback = list.find((t) => t._id === teamId.trim());
        return fallback
            ? {
                _id: fallback._id,
                name: fallback.name,
                logo: fallback.logo,
                description: fallback.description,
                isVerified: fallback.isVerified,
                members: [],
                videos: [],
                highlights: [],
                trophies: [],
            }
            : null;
    }
    const t = readAsTeam(await res.json());
    if (!t) return null;
    return fromRecord(t);
}
