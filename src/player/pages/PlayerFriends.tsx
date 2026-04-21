import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Check, Clock3, Search, Send, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/core';
import {
    friendshipPresenceService,
    type FriendItem,
    type FriendshipRecord,
} from '../../services/friendshipPresence.service';
import { UserService, type User } from '../../services/userService';
import { cn } from '../../lib/utils';

type PlayerOutletContext = { profile?: { _id?: string; id?: string } | null } | null;

function extractId(ref: string | { _id?: string } | undefined): string {
    if (!ref) return '';
    return typeof ref === 'string' ? ref : ref._id || '';
}

function extractUserPreview(ref: string | { _id?: string; nickname?: string; email?: string } | undefined): {
    id: string;
    nickname: string;
    email: string;
} {
    if (!ref) return { id: '', nickname: '', email: '' };
    if (typeof ref === 'string') return { id: ref, nickname: '', email: '' };
    return {
        id: ref._id || '',
        nickname: ref.nickname || '',
        email: ref.email || '',
    };
}

function statusLabel(status: FriendItem['status']): string {
    if (status === 'in_game') return 'In game';
    if (status === 'in_queue') return 'In queue';
    if (status === 'away') return 'Away';
    if (status === 'offline') return 'Offline';
    return 'Online';
}

function statusDotClass(status: FriendItem['status']): string {
    if (status === 'offline') return 'bg-white/35';
    if (status === 'in_game') return 'bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.6)]';
    if (status === 'in_queue') return 'bg-amber-400';
    if (status === 'away') return 'bg-orange-400';
    return 'bg-primary shadow-[0_0_10px_rgba(0,255,136,0.55)]';
}

export default function PlayerFriends() {
    const outletCtx = useOutletContext<PlayerOutletContext>();
    const currentUserId = outletCtx?.profile?._id || outletCtx?.profile?.id || '';

    const [friends, setFriends] = useState<FriendItem[]>([]);
    const [pendingRequests, setPendingRequests] = useState<FriendshipRecord[]>([]);
    const [sentRequests, setSentRequests] = useState<FriendshipRecord[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    /** One field: filter your squad + discover players to add */
    const [query, setQuery] = useState('');
    const [requestTab, setRequestTab] = useState<'pending' | 'sent'>('pending');
    const [busyId, setBusyId] = useState<string | null>(null);
    const [confirmRemoveFriend, setConfirmRemoveFriend] = useState<FriendItem | null>(null);

    async function loadAll(userId: string) {
        if (!userId) return;
        try {
            const [friendsList, pending, sent] = await Promise.all([
                friendshipPresenceService.getPresenceFriends(userId),
                friendshipPresenceService.getPendingRequests(userId),
                friendshipPresenceService.getSentRequests(userId),
            ]);
            setFriends(Array.isArray(friendsList) ? friendsList : []);
            setPendingRequests(Array.isArray(pending) ? pending : []);
            setSentRequests(Array.isArray(sent) ? sent : []);
            const users = await UserService.getAllUsers().catch(() => []);
            setAllUsers(Array.isArray(users) ? users : []);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to load friends data');
        }
    }

    useEffect(() => {
        if (!currentUserId) return;
        const t = window.setTimeout(() => {
            void loadAll(currentUserId);
        }, 0);
        return () => window.clearTimeout(t);
    }, [currentUserId]);

    const filteredFriends = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return friends;
        return friends.filter((f) => {
            return (
                f.nickname.toLowerCase().includes(q) ||
                f.email.toLowerCase().includes(q) ||
                f.userId.toLowerCase().includes(q)
            );
        });
    }, [friends, query]);

    const userSearchResults = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return [] as User[];

        const friendIds = new Set(friends.map((f) => f.userId));
        const pendingRequesterIds = new Set(pendingRequests.map((r) => extractId(r.requesterId)));
        const sentRecipientIds = new Set(sentRequests.map((r) => extractId(r.recipientId)));

        return allUsers
            .filter((u) => u._id !== currentUserId)
            .filter((u) => !friendIds.has(u._id))
            .filter((u) => !pendingRequesterIds.has(u._id))
            .filter((u) => !sentRecipientIds.has(u._id))
            .filter((u) => {
                const nickname = (u.nickname || '').toLowerCase();
                const email = (u.email || '').toLowerCase();
                return nickname.includes(q) || email.includes(q);
            })
            .slice(0, 8);
    }, [allUsers, currentUserId, friends, pendingRequests, sentRequests, query]);

    const totalActiveFriends = useMemo(
        () => friends.filter((f) => f.status !== 'offline').length,
        [friends],
    );

    function displayUserLabel(ref: string | { _id?: string; nickname?: string; email?: string } | undefined): string {
        const preview = extractUserPreview(ref);
        if (preview.nickname) return preview.nickname;
        const byId = preview.id ? allUsers.find((u) => u._id === preview.id) : null;
        if (byId?.nickname) return byId.nickname;
        if (preview.email) return preview.email;
        if (byId?.email) return byId.email;
        return preview.id || 'Unknown user';
    }

    async function onSendRequest(targetUserId: string) {
        if (!currentUserId) {
            toast.error('User profile not loaded');
            return;
        }
        if (targetUserId === currentUserId) {
            toast.error('You cannot add yourself');
            return;
        }
        setBusyId('send');
        try {
            await friendshipPresenceService.sendFriendRequest(currentUserId, targetUserId);
            setQuery('');
            toast.success('Friend request sent');
            await loadAll(currentUserId);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not send request');
        } finally {
            setBusyId(null);
        }
    }

    async function onAccept(friendshipId: string) {
        if (!currentUserId) return;
        setBusyId(friendshipId);
        try {
            await friendshipPresenceService.acceptFriendRequest(friendshipId, currentUserId);
            toast.success('Friend request accepted');
            await loadAll(currentUserId);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not accept request');
        } finally {
            setBusyId(null);
        }
    }

    async function onReject(friendshipId: string) {
        if (!currentUserId) return;
        setBusyId(friendshipId);
        try {
            await friendshipPresenceService.rejectFriendRequest(friendshipId, currentUserId);
            toast.success('Friend request rejected');
            await loadAll(currentUserId);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not reject request');
        } finally {
            setBusyId(null);
        }
    }

    async function onRemove(friendId: string) {
        if (!currentUserId) return;
        setBusyId(`remove-${friendId}`);
        try {
            await friendshipPresenceService.removeFriend(currentUserId, friendId);
            toast.success('Friend removed');
            await loadAll(currentUserId);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not remove friend');
        } finally {
            setBusyId(null);
        }
    }

    async function onConfirmRemove() {
        if (!confirmRemoveFriend) return;
        await onRemove(confirmRemoveFriend.userId);
        setConfirmRemoveFriend(null);
    }

    const showAddStrip = query.trim().length > 0 && userSearchResults.length > 0;

    return (
        <div className="mx-auto max-w-[1400px] animate-fade-in-up space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-[#141820] p-5 shadow-xl shadow-black/40 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="mb-1 text-[10px] font-black uppercase tracking-[0.22em] text-primary/80">Social</p>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Friends</h1>
                    <p className="mt-2 max-w-lg text-sm text-text-muted">
                        Your squad in the center. Pending and sent invites on the right. Use the search below to filter friends or find players to add.
                    </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2">
                        <p className="text-lg font-black text-white">{friends.length}</p>
                        <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Friends</p>
                    </div>
                    <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2">
                        <p className="text-lg font-black text-primary">{totalActiveFriends}</p>
                        <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Online</p>
                    </div>
                    <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2">
                        <p className="text-lg font-black text-amber-300">{pendingRequests.length}</p>
                        <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Pending</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
                {/* —— Center: squad list —— */}
                <div className="space-y-4 lg:col-span-8">
                    <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#141820] shadow-xl shadow-black/40">
                        <div className="border-b border-zinc-800 bg-zinc-900 px-5 py-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-primary" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-200">Your squad</p>
                                    <span className="rounded-full border border-zinc-700 bg-zinc-950 px-2 py-0.5 text-[10px] font-black text-zinc-400">
                                        {filteredFriends.length}
                                    </span>
                                </div>
                            </div>
                            <div className="relative mt-3">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                                <input
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            event.preventDefault();
                                            if (userSearchResults[0]) {
                                                void onSendRequest(userSearchResults[0]._id);
                                            }
                                        }
                                    }}
                                    placeholder="Filter friends or find players by nickname / email…"
                                    className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 pl-10 pr-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                                />
                            </div>
                        </div>

                        {showAddStrip && (
                            <div className="border-b border-zinc-800 bg-[#0f1a14] px-4 py-3">
                                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-primary">Players you can add</p>
                                <div className="flex flex-wrap gap-2">
                                    {userSearchResults.map((user) => (
                                        <div
                                            key={user._id}
                                            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 py-1.5 pl-1.5 pr-2 shadow-md shadow-black/30"
                                        >
                                            <img
                                                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.nickname || user._id}`}
                                                alt=""
                                                className="h-8 w-8 rounded-lg border border-zinc-700 object-cover"
                                            />
                                            <div className="min-w-0 max-w-[140px]">
                                                <p className="truncate text-xs font-bold text-white">{user.nickname || 'User'}</p>
                                            </div>
                                            <Button
                                                className="h-7 shrink-0 px-2 text-[10px]"
                                                disabled={!currentUserId || busyId === 'send'}
                                                onClick={() => void onSendRequest(user._id)}
                                            >
                                                Add
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="divide-y divide-zinc-800">
                            {filteredFriends.length === 0 ? (
                                <p className="px-5 py-14 text-center text-sm text-zinc-500">
                                    {query.trim() ? 'No friends match this search.' : 'No friends yet. Search above to find players.'}
                                </p>
                            ) : (
                                filteredFriends.map((friend, index) => (
                                    <div
                                        key={friend.userId}
                                        className="group flex items-stretch gap-0 transition-colors hover:bg-zinc-900/60"
                                    >
                                        <div className="flex w-11 shrink-0 items-center justify-center border-r border-zinc-800 bg-zinc-950 font-mono text-[11px] font-black text-zinc-600">
                                            {index + 1}
                                        </div>
                                        <div
                                            className={cn(
                                                'w-1 shrink-0 self-stretch',
                                                friend.status !== 'offline' ? 'bg-primary' : 'bg-zinc-700',
                                            )}
                                        />
                                        <div className="flex min-w-0 flex-1 items-center gap-4 px-4 py-4">
                                            <div className="relative shrink-0">
                                                <img
                                                    src={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.nickname || friend.userId}`}
                                                    alt=""
                                                    className="h-12 w-12 rounded-xl border border-zinc-700 object-cover"
                                                />
                                                <span
                                                    className={cn(
                                                        'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#141820]',
                                                        statusDotClass(friend.status),
                                                    )}
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-black uppercase tracking-tight text-white">{friend.nickname || 'Player'}</p>
                                                <p className="truncate text-xs text-zinc-500">{friend.email || friend.userId}</p>
                                                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                                    {statusLabel(friend.status)}
                                                    {friend.status === 'in_game' && friend.game ? ` · ${friend.game}` : ''}
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                className="shrink-0 border-red-500/30 text-red-300 hover:bg-red-500/10"
                                                disabled={busyId === `remove-${friend.userId}`}
                                                onClick={() => setConfirmRemoveFriend(friend)}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                {/* —— Side: requests (balanced tabs) —— */}
                <aside className="lg:col-span-4">
                    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#141820] shadow-xl shadow-black/40">
                        <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Invites</p>
                            <p className="text-sm font-black uppercase tracking-tight text-white">Requests</p>
                        </div>
                        <div className="grid grid-cols-2 gap-0 border-b border-zinc-800 bg-zinc-950">
                            <button
                                type="button"
                                onClick={() => setRequestTab('pending')}
                                className={cn(
                                    'flex items-center justify-center gap-2 py-3.5 text-[10px] font-black uppercase tracking-widest transition-colors',
                                    requestTab === 'pending'
                                        ? 'bg-zinc-900 text-primary'
                                        : 'text-zinc-500 hover:bg-zinc-900/80 hover:text-zinc-300',
                                )}
                            >
                                <Clock3 className="h-3.5 w-3.5" />
                                Pending
                                <span className="rounded-full border border-zinc-700 bg-zinc-950 px-1.5 py-0.5 text-[9px] text-zinc-300">
                                    {pendingRequests.length}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRequestTab('sent')}
                                className={cn(
                                    'flex items-center justify-center gap-2 border-l border-zinc-800 py-3.5 text-[10px] font-black uppercase tracking-widest transition-colors',
                                    requestTab === 'sent'
                                        ? 'bg-zinc-900 text-primary'
                                        : 'text-zinc-500 hover:bg-zinc-900/80 hover:text-zinc-300',
                                )}
                            >
                                <Send className="h-3.5 w-3.5" />
                                Sent
                                <span className="rounded-full border border-zinc-700 bg-zinc-950 px-1.5 py-0.5 text-[9px] text-zinc-300">
                                    {sentRequests.length}
                                </span>
                            </button>
                        </div>
                        <div className="max-h-[min(70vh,36rem)] space-y-2 overflow-y-auto bg-[#141820] p-4">
                            {requestTab === 'pending' ? (
                                pendingRequests.length === 0 ? (
                                    <p className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950 px-3 py-8 text-center text-xs text-zinc-500">
                                        No pending requests.
                                    </p>
                                ) : (
                                    pendingRequests.map((request) => {
                                        const requesterLabel = displayUserLabel(
                                            request.requesterId as string | { _id?: string; nickname?: string; email?: string } | undefined,
                                        );
                                        return (
                                            <div key={request._id} className="rounded-xl border border-zinc-700 bg-zinc-900 p-3 shadow-md shadow-black/25">
                                                <p className="truncate text-sm font-bold text-white">{requesterLabel}</p>
                                                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300/80">Wants to connect</p>
                                                <div className="mt-3 flex gap-2">
                                                    <Button
                                                        className="h-8 flex-1 gap-1 text-[11px]"
                                                        disabled={busyId === request._id}
                                                        onClick={() => void onAccept(request._id)}
                                                    >
                                                        <Check size={12} />
                                                        Accept
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="h-8 flex-1 gap-1 border-red-500/30 text-[11px] text-red-300 hover:bg-red-500/10"
                                                        disabled={busyId === request._id}
                                                        onClick={() => void onReject(request._id)}
                                                    >
                                                        <X size={12} />
                                                        Reject
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            ) : sentRequests.length === 0 ? (
                                <p className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950 px-3 py-8 text-center text-xs text-zinc-500">
                                    No sent requests.
                                </p>
                            ) : (
                                sentRequests.map((request) => {
                                    const recipientLabel = displayUserLabel(
                                        request.recipientId as string | { _id?: string; nickname?: string; email?: string } | undefined,
                                    );
                                    return (
                                        <div key={request._id} className="rounded-xl border border-zinc-700 bg-zinc-900 p-3 shadow-md shadow-black/25">
                                            <p className="truncate text-sm font-bold text-white">{recipientLabel}</p>
                                            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white/40">Waiting for response</p>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </aside>
            </div>

            {confirmRemoveFriend && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Close confirmation"
                        className="absolute inset-0 bg-black/80"
                        onClick={() => setConfirmRemoveFriend(null)}
                    />
                    <div className="relative z-[1] w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl shadow-black/50">
                        <h3 className="text-lg font-black text-white">Remove friend?</h3>
                        <p className="mt-2 text-sm text-zinc-400">
                            Are you sure you want to remove{' '}
                            <span className="font-bold text-white">{confirmRemoveFriend.nickname || 'this friend'}</span> from your list?
                        </p>
                        <div className="mt-5 flex items-center justify-end gap-2">
                            <Button
                                variant="outline"
                                className="border-zinc-600 bg-zinc-950"
                                onClick={() => setConfirmRemoveFriend(null)}
                                disabled={busyId === `remove-${confirmRemoveFriend.userId}`}
                            >
                                No
                            </Button>
                            <Button
                                className="bg-red-500 text-white hover:bg-red-600"
                                onClick={() => void onConfirmRemove()}
                                disabled={busyId === `remove-${confirmRemoveFriend.userId}`}
                            >
                                Yes, remove
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
