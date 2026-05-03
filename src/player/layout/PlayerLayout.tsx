import { useState, useEffect } from 'react';
import axios from 'axios';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    ChevronLeft,
    ChevronRight,
    Circle,
    UserPlus,
    RefreshCw,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { getApiBase } from '../../lib/apiBase';
import PlayerAmbientBackground from '../components/PlayerAmbientBackground';
import { channelService, type ChannelRecord } from '../../services/channel.service';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { friendshipPresenceService, type FriendItem } from '../../services/friendshipPresence.service';
import TopNavbar from '../_componenets/top_navbar';
import SideNavbar from '../_componenets/side_navbar';

interface PlayerProfileData {
    _id?: string;
    id?: string;
    nickname?: string;
    email?: string;
    avatar?: string;
    role?: string;
}

export default function PlayerLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [profile, setProfile] = useState<PlayerProfileData | null>(null);
    const [channels, setChannels] = useState<ChannelRecord[]>([]);
    const [loadingChannels, setLoadingChannels] = useState(false);
    const [friends, setFriends] = useState<FriendItem[]>([]);
    const [loadingFriends, setLoadingFriends] = useState(false);
    const [friendRecipientId, setFriendRecipientId] = useState('');
    const [addingFriend, setAddingFriend] = useState(false);
    const [friendsSearch, setFriendsSearch] = useState('');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        try {
            return localStorage.getItem('player_channels_sidebar_collapsed') === '1';
        } catch {
            return false;
        }
    });
    useEffect(() => {
        try {
            localStorage.setItem('player_channels_sidebar_collapsed', isSidebarCollapsed ? '1' : '0');
        } catch {
            /* ignore */
        }
    }, [isSidebarCollapsed]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const API_URL = getApiBase();
                const res = await axios.get(`${API_URL}/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProfile(res.data);
            } catch (error) {
                console.error('Failed to fetch profile in layout:', error);
            }
        };
        fetchProfile();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    useEffect(() => {
        void loadSidebarChannels();
    }, []);

    useEffect(() => {
        const myId = profile?._id || profile?.id;
        if (!myId) {
            setFriends([]);
            return;
        }
        void loadFriends(String(myId));
    }, [profile?._id, profile?.id]);

    async function loadSidebarChannels() {
        setLoadingChannels(true);
        try {
            // In a real app, we'd have a separate "Following" endpoint
            const all = await channelService.getAllChannels();
            setChannels(all.slice(0, 12)); // Just a mix for the MVP
        } catch (error) {
            console.error('Failed to load sidebar channels', error);
        } finally {
            setLoadingChannels(false);
        }
    }

    async function loadFriends(userIdOverride?: string) {
        const myId = userIdOverride || profile?._id || profile?.id;
        if (!myId) {
            setFriends([]);
            return;
        }
        setLoadingFriends(true);
        try {
            const list = await friendshipPresenceService.getPresenceFriends(String(myId));
            setFriends(Array.isArray(list) ? list : []);
        } catch (error) {
            setFriends([]);
            const message = error instanceof Error ? error.message : 'Failed to load friends';
            toast.error(message);
        } finally {
            setLoadingFriends(false);
        }
    }

    async function addFriend() {
        const requesterId = profile?._id || profile?.id;
        const recipientId = friendRecipientId.trim();
        if (!requesterId) {
            toast.error('Profile not ready yet');
            return;
        }
        if (!recipientId) {
            toast.error('Enter recipient user ID');
            return;
        }
        if (recipientId === requesterId) {
            toast.error('You cannot add yourself');
            return;
        }

        setAddingFriend(true);
        try {
            await friendshipPresenceService.sendFriendRequest(String(requesterId), recipientId);
            setFriendRecipientId('');
            toast.success('Friend request sent');
            await loadFriends(String(requesterId));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Could not send friend request';
            toast.error(message);
        } finally {
            setAddingFriend(false);
        }
    }

    const primaryNavWidthClass = 'w-[54px]';
    const isFullBleedRoute = location.pathname.startsWith('/player/reels');

    if (isFullBleedRoute) {
        return (
            <div className="h-screen w-screen overflow-hidden bg-black font-sans text-text">
                <Outlet context={{ profile }} />
            </div>
        );
    }

    return (
            <div className="h-screen bg-black p-3 flex overflow-hidden font-sans text-text">
                {/* ═══ Unified Shell ═══ */}
                <div className="relative flex flex-col flex-1 bg-transparent rounded-3xl overflow-hidden">
                    <PlayerAmbientBackground />
                    <TopNavbar
                        headerRailWidthClass={primaryNavWidthClass}
                        isProfileOpen={isProfileOpen}
                        onToggleProfile={() => setIsProfileOpen((v) => !v)}
                        onCloseProfile={() => setIsProfileOpen(false)}
                        onGoProfile={() => {
                            navigate('/player/profile');
                            setIsProfileOpen(false);
                        }}
                        onLogout={handleLogout}
                    />

                    {/* ═══ Body: Sidebars + Content ═══ */}
                    <div className="relative flex flex-1 overflow-hidden">
                        {/* ═══ Primary sidebar: nav links + footer (expand/collapse labels) ═══ */}
                        <div className="relative z-40">
                            <SideNavbar widthClass={primaryNavWidthClass} onLogout={handleLogout} />
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsSidebarCollapsed((v) => !v)}
                            title={isSidebarCollapsed ? 'Afficher chaînes & suivis' : 'Masquer le panneau'}
                            aria-expanded={!isSidebarCollapsed}
                            className="absolute z-[80] top-[6.2rem] left-[54px] -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-primary text-black shadow-[0_0_12px_rgba(0,255,136,0.25)] transition-all duration-200 hover:scale-105 hover:shadow-[0_0_16px_rgba(0,255,136,0.32)] active:scale-95"
                        >
                            {isSidebarCollapsed ? <ChevronRight size={13} strokeWidth={2.5} /> : <ChevronLeft size={13} strokeWidth={2.5} />}
                        </button>

                {/* ═══ Channels sidebar — toggle stays outside collapsing width so it is always clickable ═══ */}
                <div
                    className={cn(
                        'relative h-full shrink-0 z-50 overflow-visible transition-[width] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none motion-reduce:duration-0',
                        isSidebarCollapsed ? 'w-0' : 'w-[240px]',
                    )}
                >
                    <aside
                        className={cn(
                            'absolute inset-y-0 left-0 flex w-[240px] flex-col border-r border-white/[0.06] bg-[#0a0b0e]/88 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-sm',
                            'transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none motion-reduce:duration-0',
                            isSidebarCollapsed
                                ? 'pointer-events-none -translate-x-[calc(100%-0.5rem)] opacity-0'
                                : 'translate-x-0 opacity-100',
                        )}
                        aria-hidden={isSidebarCollapsed}
                    >
                        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-6 px-4 space-y-8">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 italic">
                                        Suivis
                                    </span>
                                    <div className="h-1 w-1 rounded-full bg-primary/50 animate-pulse shadow-[0_0_8px_rgba(0,255,136,0.6)]" />
                                </div>
                                <div className="space-y-1">
                                    {loadingChannels ? (
                                        <div className="space-y-4 px-2">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="h-10 rounded-xl bg-white/5 animate-pulse" />
                                            ))}
                                        </div>
                                    ) : (
                                        channels.slice(0, 4).map((ch) => <ChannelSidebarItem key={ch._id} channel={ch} />)
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="px-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 italic">
                                        Recommandées
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {channels.slice(4).map((ch) => (
                                        <ChannelSidebarItem key={ch._id} channel={ch} />
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 italic">
                                        Friends
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => void loadFriends()}
                                        className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/40 hover:text-white hover:border-white/20 transition-colors"
                                        title="Refresh friends"
                                        disabled={loadingFriends}
                                    >
                                        <RefreshCw size={12} className={cn(loadingFriends && 'animate-spin')} />
                                    </button>
                                </div>

                                <div className="space-y-2 px-2">
                                    <div className="relative">
                                        <input
                                            value={friendRecipientId}
                                            onChange={(event) => setFriendRecipientId(event.target.value)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') {
                                                    event.preventDefault();
                                                    void addFriend();
                                                }
                                            }}
                                            placeholder="Recipient user ID"
                                            className="h-9 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 pr-9 text-[11px] font-semibold text-white placeholder:text-white/20 outline-none focus:border-primary/35"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => void addFriend()}
                                            disabled={addingFriend}
                                            title="Send friend request"
                                            className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
                                        >
                                            <UserPlus size={12} />
                                        </button>
                                    </div>

                                    <input
                                        value={friendsSearch}
                                        onChange={(event) => setFriendsSearch(event.target.value)}
                                        placeholder="Search friend..."
                                        className="h-8 w-full rounded-xl border border-white/8 bg-black/25 px-3 text-[11px] font-semibold text-white placeholder:text-white/20 outline-none focus:border-primary/25"
                                    />
                                </div>

                                <div className="space-y-1 px-1">
                                    {loadingFriends ? (
                                        <div className="space-y-2 px-1">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="h-10 rounded-xl bg-white/5 animate-pulse" />
                                            ))}
                                        </div>
                                    ) : friends.length === 0 ? (
                                        <p className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-white/25">
                                            No friends yet
                                        </p>
                                    ) : (
                                        friends
                                            .filter((f) => {
                                                const q = friendsSearch.trim().toLowerCase();
                                                if (!q) return true;
                                                return (
                                                    f.nickname.toLowerCase().includes(q) ||
                                                    f.email.toLowerCase().includes(q) ||
                                                    f.userId.toLowerCase().includes(q)
                                                );
                                            })
                                            .slice(0, 12)
                                            .map((friend) => (
                                                <div
                                                    key={friend.userId}
                                                    className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-2 py-2"
                                                >
                                                    <div className="relative shrink-0">
                                                        <img
                                                            src={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.nickname || friend.userId}`}
                                                            alt={friend.nickname}
                                                            className="h-8 w-8 rounded-lg border border-white/10 bg-black object-cover"
                                                        />
                                                        <span
                                                            className={cn(
                                                                'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0a0b0e]',
                                                                friend.status === 'offline'
                                                                    ? 'bg-white/30'
                                                                    : friend.status === 'in_game'
                                                                        ? 'bg-purple-400'
                                                                        : friend.status === 'in_queue'
                                                                            ? 'bg-amber-400'
                                                                            : friend.status === 'away'
                                                                                ? 'bg-orange-400'
                                                                                : 'bg-primary',
                                                            )}
                                                        />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-[11px] font-black uppercase tracking-tight text-white/85">
                                                            {friend.nickname || 'Player'}
                                                        </p>
                                                        <p className="truncate text-[9px] font-bold uppercase tracking-widest text-white/30">
                                                            {friend.status === 'in_game'
                                                                ? `In game${friend.game ? ` · ${friend.game}` : ''}`
                                                                : friend.status.replace('_', ' ')}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                    )}
                                </div>
                            </div>
                        </div>

                                <div
                                    className={cn(
                                        'border-t border-white/[0.06] bg-black/25 p-4',
                                        isSidebarCollapsed && 'hidden',
                                    )}
                                >
                                    <div className="rounded-2xl border border-primary/15 bg-primary/[0.06] p-4 shadow-[0_0_24px_rgba(0,255,136,0.06)]">
                                        <p className="mb-1 text-[10px] font-black uppercase italic tracking-widest text-primary">
                                            Vérifié par Arena
                                        </p>
                                        <p className="text-[11px] font-medium leading-relaxed text-white/45">
                                            Découvrez les meilleurs talents du studio.
                                        </p>
                                    </div>
                                </div>
                            </aside>

                        </div>

                    {/* ═══ Main Content ═══ */}
                        <main className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-transparent">
                        <div
                            className={cn(
                                'relative z-10 transition-all duration-500',
                                location.pathname.startsWith('/watch/') ||
                                    location.pathname === '/player/channel' ||
                                    location.pathname.startsWith('/player/channel/')
                                    ? 'p-0'
                                    : 'p-8',
                            )}
                        >
                            <Outlet context={{ profile }} />
                        </div>
                        </main>
                    </div>
                </div>
            </div>
    );
}

// ─── Channel Sidebar Item ──────────────────────────────────────────────

function ChannelSidebarItem({ channel }: { channel: ChannelRecord }) {
    const isLive = channel.isActive; // In a real app check isLive
    const [viewers] = useState(() => Math.floor(Math.random() * 1000) + 100); // Simulated viewers, stable on mount

    return (
        <NavLink
            to={`/watch/${channel._id}`}
            className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 group/item",
                isActive ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-white/5"
            )}
        >
            <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-2xl bg-[#16191d] border border-white/5 flex items-center justify-center p-0.5 overflow-hidden group-hover/item:border-primary/30 transition-colors">
                    <img
                        src={channel.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${channel.name}`}
                        alt=""
                        className="w-full h-full rounded-xl object-cover"
                    />
                </div>
                {isLive && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-[#0f1115] shadow-[0_0_8px_rgba(0,255,135,0.8)]" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-black text-white/80 truncate uppercase tracking-tighter italic group-hover/item:text-primary transition-colors">{channel.name}</p>
                    {isLive && (
                        <div className="flex items-center gap-1 shrink-0">
                            <Circle size={4} className="fill-primary" />
                            <span className="text-[10px] font-black text-primary italic">{viewers > 1000 ? (viewers / 1000).toFixed(1) + 'k' : viewers}</span>
                        </div>
                    )}
                </div>
                <p className="text-[10px] font-bold text-white/20 truncate uppercase tracking-widest leading-none mt-0.5">
                    {channel.categories?.[0] || "Discussion"}
                </p>
            </div>
        </NavLink>
    );
}

