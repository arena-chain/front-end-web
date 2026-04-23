import { videoService, type VideoRecord } from './video.service';
import { highlightService, type HighlightRecord } from './highlight.service';
import { scouterService, type ScoutedPlayerProfile } from './scouterService';
import { UserService, type User } from './userService';

/**
 * Load several Arena datasets in parallel. Each slice is optional; failures are isolated
 * (you still get other slices). Use this when a screen needs “whatever the current user
 * is allowed to see” — e.g. videos for a given uploader, public highlight clips, the scout
 * player pool, or users filtered by role (admin `GET /users` + client filter).
 *
 * Examples:
 * - Another player’s channel-style videos: `{ videos: { uploader: playerUserId, channelPublic: true } }`
 * - Public highlight catalog: `{ publicHighlights: true }`
 * - Scout dashboard pool (JWT must be scouter): `{ scouterPlayers: true }`
 * - All scouter accounts (admin token): `{ users: { roles: ['scouter'] } }`
 */
export interface ArenaResourceRequest {
    videos?: { uploader?: string; game?: string; channelPublic?: boolean };
    publicHighlights?: true;
    scouterPlayers?: true;
    users?: { roles?: string[] };
}

export interface ArenaResourceBundle {
    videos?: VideoRecord[];
    publicHighlights?: HighlightRecord[];
    scouterPlayers?: ScoutedPlayerProfile[];
    users?: User[];
    /** Per-slice error messages; missing key means that slice was not requested or succeeded */
    errors: Partial<Record<keyof ArenaResourceRequest, string>>;
}

function markError(
    errors: ArenaResourceBundle['errors'],
    key: keyof ArenaResourceRequest,
    err: unknown,
) {
    errors[key] = err instanceof Error ? err.message : 'Request failed';
}

export async function loadArenaResources(req: ArenaResourceRequest): Promise<ArenaResourceBundle> {
    const errors: ArenaResourceBundle['errors'] = {};
    const bundle: ArenaResourceBundle = { errors };

    const jobs: Promise<void>[] = [];

    if (req.videos !== undefined) {
        jobs.push(
            videoService
                .list(req.videos)
                .then((rows) => {
                    bundle.videos = rows;
                })
                .catch((e) => {
                    markError(errors, 'videos', e);
                    bundle.videos = [];
                }),
        );
    }

    if (req.publicHighlights) {
        jobs.push(
            highlightService
                .listPublic()
                .then((rows) => {
                    bundle.publicHighlights = rows;
                })
                .catch((e) => {
                    markError(errors, 'publicHighlights', e);
                    bundle.publicHighlights = [];
                }),
        );
    }

    if (req.scouterPlayers) {
        jobs.push(
            scouterService
                .getPlayers()
                .then((rows) => {
                    bundle.scouterPlayers = rows;
                })
                .catch((e) => {
                    markError(errors, 'scouterPlayers', e);
                    bundle.scouterPlayers = [];
                }),
        );
    }

    if (req.users !== undefined) {
        jobs.push(
            UserService.getAllUsers()
                .then((all) => {
                    const roles = req.users?.roles;
                    bundle.users = roles?.length ? all.filter((u) => roles.includes(u.role)) : all;
                })
                .catch((e) => {
                    markError(errors, 'users', e);
                    bundle.users = [];
                }),
        );
    }

    await Promise.all(jobs);
    return bundle;
}

/** Convenience: users with role `scouter` (needs permission to call `GET /users`). */
export async function listScouterUsers(): Promise<User[]> {
    const { users = [], errors } = await loadArenaResources({ users: { roles: ['scouter'] } });
    if (errors.users) throw new Error(errors.users);
    return users;
}
