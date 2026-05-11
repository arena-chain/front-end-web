import { io, type Socket } from 'socket.io-client';
import { getApiBase, getBackendOrigin, getSocketIoOrigin } from '../lib/apiBase';
import { authHeaders } from '../lib/session';

const API_URL = getApiBase();
const BACKEND_ORIGIN = getBackendOrigin();
let presenceFriendsRestDisabled = false;

export type FriendStatus = 'online' | 'in_game' | 'in_queue' | 'away' | 'offline';

export type FriendItem = {
    userId: string;
    nickname: string;
    email: string;
    avatar?: string | null;
    status: FriendStatus;
    game?: string;
    details?: string;
};

export type FriendshipRecord = {
    _id: string;
    requesterId: string | { _id?: string };
    recipientId: string | { _id?: string };
    status: string;
    createdAt?: string;
    updatedAt?: string;
};

async function parseJson<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const error = await response.json().catch(() => ({} as { message?: string | string[] }));
        const message = Array.isArray(error.message) ? error.message.join(', ') : error.message;
        throw new Error(message || 'Request failed');
    }
    return response.json() as Promise<T>;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    return parseJson<T>(
        await fetch(`${API_URL}${path}`, {
            ...init,
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders(),
                ...(init?.headers ?? {}),
            },
        }),
    );
}

function safeString(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

/** Handles string ids, Mongo-style `{ $oid }`, and populated `{ _id }` objects from JSON. */
function normalizeUserId(value: unknown): string {
    if (typeof value === 'string' && value) return value;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    if (!value || typeof value !== 'object') return '';
    const o = value as Record<string, unknown>;
    if (typeof o.$oid === 'string') return o.$oid;
    if (o._id !== undefined) return normalizeUserId(o._id);
    return '';
}

function toFriendItem(raw: unknown): FriendItem | null {
    if (!raw || typeof raw !== 'object') return null;
    const obj = raw as Record<string, unknown>;
    const userId =
        normalizeUserId(obj.userId) ||
        normalizeUserId(obj._id) ||
        normalizeUserId(obj.id) ||
        safeString(obj.userId) ||
        safeString(obj._id);
    if (!userId) return null;
    const status = safeString(obj.status) as FriendStatus;
    return {
        userId,
        nickname: safeString(obj.nickname) || 'Player',
        email: safeString(obj.email),
        avatar: safeString(obj.avatar) || null,
        status: status || 'offline',
        game: safeString(obj.game) || undefined,
        details: safeString(obj.details) || undefined,
    };
}

function toFriendFromFriendshipRecord(raw: unknown, currentUserId: string): FriendItem | null {
    if (!raw || typeof raw !== 'object') return null;
    const record = raw as Record<string, unknown>;
    const requester = record.requesterId as Record<string, unknown> | string | undefined;
    const recipient = record.recipientId as Record<string, unknown> | string | undefined;
    const requesterId =
        typeof requester === 'string' ? requester : normalizeUserId(requester) || safeString(requester?._id);
    const recipientId =
        typeof recipient === 'string' ? recipient : normalizeUserId(recipient) || safeString(recipient?._id);
    const friendObj = requesterId === currentUserId ? recipient : requester;
    const fallbackId = requesterId === currentUserId ? recipientId : requesterId;

    if (friendObj && typeof friendObj === 'object') {
        const obj = friendObj as Record<string, unknown>;
        const userId =
            normalizeUserId(obj._id) ||
            normalizeUserId(obj.id) ||
            normalizeUserId(fallbackId) ||
            safeString(fallbackId);
        if (!userId) return null;
        return {
            userId,
            nickname: safeString(obj.nickname) || 'Player',
            email: safeString(obj.email),
            avatar: safeString(obj.avatar) || null,
            status: 'offline',
        };
    }

    if (!fallbackId) return null;
    return {
        userId: fallbackId,
        nickname: fallbackId.slice(-6),
        email: '',
        avatar: null,
        status: 'offline',
    };
}

export const friendshipPresenceService = {
    // Friendship APIs
    sendFriendRequest(requesterId: string, recipientId: string) {
        return request<FriendshipRecord>('/friendship/send-request', {
            method: 'POST',
            body: JSON.stringify({ requesterId, recipientId }),
        });
    },
    acceptFriendRequest(friendshipId: string, userId: string) {
        return request<FriendshipRecord>(`/friendship/accept/${friendshipId}`, {
            method: 'POST',
            body: JSON.stringify({ userId }),
        });
    },
    rejectFriendRequest(friendshipId: string, userId: string) {
        return request<FriendshipRecord>(`/friendship/reject/${friendshipId}`, {
            method: 'POST',
            body: JSON.stringify({ userId }),
        });
    },
    removeFriend(userId: string, friendId: string) {
        return request<{ message: string }>('/friendship/remove', {
            method: 'DELETE',
            body: JSON.stringify({ userId, friendId }),
        });
    },
    blockUser(userId: string, targetId: string) {
        return request<FriendshipRecord>('/friendship/block', {
            method: 'POST',
            body: JSON.stringify({ userId, targetId }),
        });
    },
    unblockUser(userId: string, targetId: string) {
        return request<{ message: string }>('/friendship/unblock', {
            method: 'DELETE',
            body: JSON.stringify({ userId, targetId }),
        });
    },
    getFriends(userId: string) {
        return request<FriendshipRecord[]>(`/friendship/friends/${userId}`);
    },
    getPendingRequests(userId: string) {
        return request<FriendshipRecord[]>(`/friendship/pending-requests/${userId}`);
    },
    getSentRequests(userId: string) {
        return request<FriendshipRecord[]>(`/friendship/sent-requests/${userId}`);
    },
    getBlockedUsers(userId: string) {
        return request<FriendshipRecord[]>(`/friendship/blocked/${userId}`);
    },
    getFriendshipStatus(userId1: string, userId2: string) {
        return request<{ status: string }>(`/friendship/status/${userId1}/${userId2}`);
    },
    areFriends(userId1: string, userId2: string) {
        return request<{ areFriends: boolean }>(`/friendship/are-friends/${userId1}/${userId2}`);
    },

    // Presence APIs
    async getPresenceFriends(userId: string): Promise<FriendItem[]> {
        if (presenceFriendsRestDisabled) {
            const friendships = await this.getFriends(userId).catch(() => []);
            return friendships
                .map((item) => toFriendFromFriendshipRecord(item, userId))
                .filter((f): f is FriendItem => Boolean(f));
        }

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...authHeaders(),
        };
        const rawPresenceUrls = [
            `${API_URL}/presence/friends/${userId}`,
            `${BACKEND_ORIGIN}/api/presence/friends/${userId}`,
            `${BACKEND_ORIGIN}/presence/friends/${userId}`,
        ];
        const presenceUrls = Array.from(new Set(rawPresenceUrls));
        let sawNotFound = false;

        for (const url of presenceUrls) {
            try {
                const response = await fetch(url, { headers });
                if (response.status === 404) {
                    sawNotFound = true;
                    continue;
                }
                const payload = (await parseJson<{ friends?: unknown[] }>(response)) || {};
                const friends = Array.isArray(payload.friends)
                    ? payload.friends.map(toFriendItem).filter((f): f is FriendItem => Boolean(f))
                    : [];
                if (friends.length > 0 || Array.isArray(payload.friends)) {
                    return friends;
                }
            } catch {
                // Try next endpoint variation, then fallback to friendship list.
            }
        }

        if (sawNotFound) {
            // Avoid repeated 404 calls on each refresh/render.
            presenceFriendsRestDisabled = true;
        }

        // Fallback: backend may not expose /presence/friends yet.
        const friendships = await this.getFriends(userId).catch(() => []);
        return friendships
            .map((item) => toFriendFromFriendshipRecord(item, userId))
            .filter((f): f is FriendItem => Boolean(f));
    },
};

export function createPresenceSocket(): Socket {
    const token = localStorage.getItem('token');
    return io(`${getSocketIoOrigin()}/presence`, {
        auth: { token },
        withCredentials: true,
        transports: ['websocket', 'polling'],
    });
}
