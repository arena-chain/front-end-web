import type { StreamRecord } from '../services/stream.service';

export type LiveSortMode = 'date-desc' | 'date-asc' | 'category-asc' | 'category-desc';

/** Première étiquette = catégorie affichée (ex. Gaming, IRL). */
export function getStreamCategory(stream: StreamRecord): string {
    const t = stream.tags?.find((tag) => tag.trim().length > 0);
    return t?.trim() || 'Général';
}

export function streamStartedMs(stream: StreamRecord): number {
    const raw = stream.startedAt || stream.createdAt;
    if (!raw) {
        return 0;
    }
    const ms = new Date(raw).getTime();
    return Number.isNaN(ms) ? 0 : ms;
}

export function sortLiveStreams(streams: StreamRecord[], mode: LiveSortMode): StreamRecord[] {
    const out = [...streams];
    switch (mode) {
        case 'date-desc':
            return out.sort((a, b) => streamStartedMs(b) - streamStartedMs(a));
        case 'date-asc':
            return out.sort((a, b) => streamStartedMs(a) - streamStartedMs(b));
        case 'category-asc':
            return out.sort((a, b) =>
                getStreamCategory(a).localeCompare(getStreamCategory(b), 'fr', { sensitivity: 'base' }),
            );
        case 'category-desc':
            return out.sort((a, b) =>
                getStreamCategory(b).localeCompare(getStreamCategory(a), 'fr', { sensitivity: 'base' }),
            );
        default:
            return out;
    }
}

export function uniqueStreamCategories(streams: StreamRecord[]): string[] {
    const set = new Set(streams.map(getStreamCategory));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
}

export function streamerIdFromStream(stream: StreamRecord): string {
    const s = stream.streamerId as unknown;
    if (typeof s === 'string') {
        return s;
    }
    if (s && typeof s === 'object' && '_id' in s) {
        return String((s as { _id: string })._id);
    }
    return '';
}

export function streamerDisplayName(stream: StreamRecord): string {
    const s = stream.streamerId as unknown;
    if (s && typeof s === 'object') {
        const nick = (s as { nickname?: string }).nickname;
        if (nick) {
            return nick;
        }
        const email = (s as { email?: string }).email;
        if (email) {
            return email.split('@')[0] || email;
        }
    }
    return 'Streamer';
}

export function channelIdFromStream(stream: StreamRecord): string {
    const c = stream.channelId as unknown;
    if (typeof c === 'string') {
        return c;
    }
    if (c && typeof c === 'object' && '_id' in c) {
        return String((c as { _id: string })._id);
    }
    return '';
}

export function channelAvatarFromStream(stream: StreamRecord): string | undefined {
    const c = stream.channelId as unknown;
    if (c && typeof c === 'object' && 'avatarUrl' in c) {
        const u = (c as { avatarUrl?: string }).avatarUrl;
        return u || undefined;
    }
    return undefined;
}

export function channelNameFromStream(stream: StreamRecord): string {
    const c = stream.channelId as unknown;
    if (c && typeof c === 'object' && 'name' in c) {
        return String((c as { name?: string }).name || 'Chaîne');
    }
    return 'Chaîne';
}
