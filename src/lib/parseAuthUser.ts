import type { TeamManagerProfile, User, UserProfile } from '../models/auth.models';

function asRecord(v: unknown): Record<string, unknown> | null {
    return v !== null && typeof v === 'object' ? (v as Record<string, unknown>) : null;
}

/** Backend uses `team_manager`; some clients send `team-manager`. */
export function normalizeRole(raw: unknown): User['role'] {
    let s = 'player';
    if (Array.isArray(raw) && raw.length > 0) {
        s = String(raw[0]);
    } else if (typeof raw === 'string' && raw.length > 0) {
        s = raw;
    }
    s = s.toLowerCase().replace(/-/g, '_');
    if (s === 'teammanager') s = 'team_manager';
    const allowed: User['role'][] = ['player', 'admin', 'team_manager', 'referee', 'scouter'];
    return (allowed.includes(s as User['role']) ? s : 'player') as User['role'];
}

function parseTeamRef(team: unknown): { teamId?: string; teamName?: string } {
    const o = asRecord(team);
    if (!o) return {};
    const id = o['_id'] ?? o['id'];
    const teamId = id != null ? String(id) : undefined;
    const teamName = o['name'] != null ? String(o['name']) : undefined;
    return { teamId, teamName };
}

export function parseTeamManagerProfile(json: unknown): TeamManagerProfile | undefined {
    const j = asRecord(json);
    if (!j) return undefined;

    let userId = '';
    const uid = j['userId'];
    if (uid != null && typeof uid === 'object') {
        const u = asRecord(uid);
        userId = u != null && u['_id'] != null ? String(u['_id']) : '';
    } else if (uid != null) {
        userId = String(uid);
    }

    const { teamId, teamName } = parseTeamRef(j['team']);

    return {
        organizationName: j['organizationName'] != null ? String(j['organizationName']) : undefined,
        firstName: j['firstName'] != null ? String(j['firstName']) : undefined,
        lastName: j['lastName'] != null ? String(j['lastName']) : undefined,
        cin: j['cin'] != null ? String(j['cin']) : undefined,
        age: typeof j['age'] === 'number' ? j['age'] : undefined,
        gender: j['gender'] != null ? String(j['gender']) : undefined,
        description: j['description'] != null ? String(j['description']) : undefined,
        phoneNumber: j['phoneNumber'] != null ? String(j['phoneNumber']) : undefined,
        teamId,
        teamName,
        status: j['status'] != null ? String(j['status']) : 'pending',
        userId,
        isVerified: Boolean(j['isVerified']),
    };
}

/**
 * Aligns API payloads with the Flutter `User.fromJson` behavior:
 * `roles[]` vs `role`, `profiles.player` / `profiles.team_manager`, populated refs.
 */
export function normalizeAuthUser(raw: unknown): User {
    const r = asRecord(raw) ?? {};

    const role = normalizeRole(r['roles'] ?? r['role']);

    let profileData: unknown = r['profile'];
    const profiles = asRecord(r['profiles']);
    if (profiles) {
        if (role === 'team_manager' && profiles['team_manager'] != null) {
            profileData = profiles['team_manager'];
        } else if (role === 'player' && profiles['player'] != null) {
            profileData = profiles['player'];
        }
    }

    let teamManagerProfile: TeamManagerProfile | undefined;
    let playerProfile: UserProfile | undefined;

    if (role === 'team_manager' && profileData != null) {
        teamManagerProfile = parseTeamManagerProfile(profileData);
    } else if (role === 'player' && profileData != null) {
        const p = asRecord(profileData);
        playerProfile = p
            ? {
                  isPro: Boolean(p['isPro']),
                  isVerified: Boolean(p['isVerified']),
                  elo: typeof p['elo'] === 'number' ? p['elo'] : undefined,
                  rank: p['rank'] != null ? String(p['rank']) : undefined,
                  ...p,
              }
            : { isPro: false, isVerified: false };
    }

    const id = String(r['id'] ?? r['_id'] ?? '');

    return {
        id,
        email: String(r['email'] ?? ''),
        nickname: String(r['nickname'] ?? 'Recruit'),
        role,
        isEmailVerified: Boolean(r['isEmailVerified']),
        avatar: r['avatar'] != null ? String(r['avatar']) : undefined,
        country: r['country'] != null ? String(r['country']) : undefined,
        profile: playerProfile,
        teamManagerProfile,
    };
}

/** Same idea as Flutter `User.teamId` getter. */
export function getTeamId(user: User | null | undefined): string {
    if (!user) return '';
    return user.teamManagerProfile?.teamId ?? '';
}
