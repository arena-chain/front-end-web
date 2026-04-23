import { useState, useEffect } from 'react';
import axios from 'axios';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
    History,
    Settings,
    LogOut,
    User,
    Gamepad2,
    Ticket,
    Trophy,
    Award,
    DollarSign,
    ChevronDown,
    Search,
    Crown,
    Store,
    Radio,
    Video,
    Users,
    ChevronLeft,
    ChevronRight,
    Circle,
    UserPlus,
    RefreshCw,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { getApiBase } from '../../lib/apiBase';
import PlayerAmbientBackground from '../components/PlayerAmbientBackground';
import PlayerEnergyStreakOverlay from '../components/PlayerEnergyStreakOverlay';
import { channelService, type ChannelRecord } from '../../services/channel.service';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { friendshipPresenceService, type FriendItem } from '../../services/friendshipPresence.service';
import TopNavbar from '../_componenets/top_navbar';
import SideNavbar from '../_componenets/side_navbar';
import { NotificationProvider } from '../../contexts/NotificationContext';
import NotificationBell from '../../components/ui/NotificationBell';
// ─── Top nav links (shown in the horizontal top bar) ─────────────────────────
const TOP_NAV_LINKS = [
    { to: '/player/channel', label: 'Channel', icon: <Video size={16} /> },
    { to: '/player/go-live', label: 'Go Live', icon: <Radio size={16} /> },
    { to: '/player/all-lives', label: 'Lives', icon: <Users size={16} /> },
    { to: '/player/marketplace', label: 'Marketplace', icon: <Store size={16} /> },
    { to: '/player/trading', label: 'Trading', icon: <Zap size={16} /> },
    { to: '/player/market', label: 'Get Tickets', icon: <DollarSign size={16} /> },
    { to: '/player/rankings', label: 'Rankings', icon: <Crown size={16} /> },
    { to: '/player/news', label: 'News', icon: <Newspaper size={16} /> },
];

// ─── Primary rail: full section = icon + label; compact = icons only ──────────
const PRIMARY_NAV_LINKS: { to: string; label: string; icon: LucideIcon }[] = [
    { to: '/player/dashboard', label: 'Play', icon: Gamepad2 },
    { to: '/player/tournaments', label: 'Tournaments', icon: Trophy },
    { to: '/player/my-tickets', label: 'My Tickets', icon: Ticket },
    { to: '/player/matches', label: 'Match History', icon: History },
    { to: '/player/leagues', label: 'Leagues', icon: Award },
    { to: '/player/rewards', label: 'Rewards', icon: Zap },
    { to: '/player/channel', label: 'Studio & clips', icon: Clapperboard },
    { to: '/player/my-videos', label: 'My videos', icon: Film },
    { to: '/player/highlights', label: 'Highlights', icon: Sparkles },
];

const PRIMARY_NAV_BOTTOM: { to: string; label: string; icon: LucideIcon }[] = [
    { to: '/player/profile', label: 'Profil', icon: User },
    { to: '/player/settings', label: 'Réglages', icon: Settings },
];

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
    /** Full primary rail (labels) vs compact icon-only */
    const [primaryNavExpanded, setPrimaryNavExpanded] = useState(() => {
        try {
            return localStorage.getItem('player_primary_nav_expanded') !== '0';
        } catch {
            return true;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('player_primary_nav_expanded', primaryNavExpanded ? '1' : '0');
        } catch {
            /* ignore */
        }
    }, [primaryNavExpanded]);

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

    const headerRailWidthClass = 'w-[54px]';
    const primaryNavWidthClass = 'w-[54px]';

    return (
        <NotificationProvider>
            <div className="h-screen bg-black p-3 flex overflow-hidden font-sans text-text">
                {/* ═══ Unified Shell ═══ */}
                <div className="flex flex-col flex-1 bg-[#111214] rounded-3xl overflow-hidden">
                    {/* ═══ Full-width Unified Header ═══ */}
                    <header className="h-16 shrink-0 flex items-center z-30 border-b border-white/5 bg-[#060708]">
                        {/* Logo — width matches primary sidebar */}
                        <div
                            className={cn(
                                'h-full flex shrink-0 border-r border-white/5 transition-[width] duration-300 ease-out',
                                primaryNavWidthClass,
                            )}
                        >
                            <div
                                className={cn(
                                    'flex h-full w-full flex-row items-center justify-center',
                                    primaryNavExpanded ? 'gap-2 px-2 sm:px-3' : 'gap-1 px-1',
                                )}
                            >
                                <NavLink to="/player/dashboard" className="shrink-0">
                                    <div
                                        className={cn(
                                            'flex items-center justify-center rounded-xl bg-primary font-black text-black shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all hover:scale-105',
                                            primaryNavExpanded
                                                ? 'h-10 w-10 text-lg'
                                                : 'h-9 w-9 text-base',
                                        )}
                                    >
                                        A
                                    </div>
                                </NavLink>
                                {primaryNavExpanded ? (
                                    <button
                                        type="button"
                                        onClick={() => setPrimaryNavExpanded(false)}
                                        title="Réduire le menu"
                                        aria-label="Réduire le menu"
                                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/50 transition-colors hover:border-primary/35 hover:bg-white/5 hover:text-primary"
                                    >
                                        <X size={14} strokeWidth={2.5} />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setPrimaryNavExpanded(true)}
                                        title="Agrandir le menu"
                                        aria-label="Agrandir le menu"
                                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-primary/30 text-primary transition-colors hover:bg-primary/15"
                                    >
                                        <ChevronRight size={12} strokeWidth={2.5} />
                                    </button>
                                )}
                            </div>
                        </div>
                        {/* Nav links + right controls */}
                        <div className="flex flex-1 items-center justify-between px-8">
                            <div className="flex items-center gap-6">
                                {isSidebarCollapsed && (
                                    <button
                                        onClick={() => setIsSidebarCollapsed(false)}
                                        className="w-9 h-9 rounded-xl border border-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                )}
                                <nav className="flex items-center gap-2">
                                    {TOP_NAV_LINKS.map(link => (
                                        <NavLink
                                            key={link.to}
                                            to={link.to}
                                            className={({ isActive }) => cn(
                                                "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                                                isActive
                                                    ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(0,255,135,0.1)]"
                                                    : "text-white/40 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    {isActive ? <Circle size={4} className="fill-primary animate-pulse" /> : <span className="opacity-40">{link.icon}</span>}
                                                    <span className="hidden xl:inline">{link.label}</span>
                                                </>
                                            )}
                                        </NavLink>
                                    ))}
                                </nav>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="hidden lg:flex items-center relative w-64">
                                    <Search className="absolute left-3 w-4 h-4 text-text-muted" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-primary/40 transition-colors"
                                    />
                                </div>

                                <NotificationBell />
                                <div className="relative">
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="flex items-center gap-3 p-1 rounded-2xl border border-transparent hover:border-white/10 hover:bg-white/5 transition-all"
                                    >
                                        <div className="w-9 h-9 rounded-2xl bg-[#16191d] border border-white/10 flex items-center justify-center p-0.5 overflow-hidden">
                                            <img
                                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                                                alt="Player"
                                                className="w-full h-full rounded-xl object-cover"
                                            />
                                        </div>
                                        <div className="hidden md:flex flex-col items-start">
                                            <span className="text-[11px] font-black text-white leading-none uppercase tracking-tighter italic">Player One</span>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                <span className="text-[9px] text-primary font-black uppercase tracking-widest leading-none">Elite</span>
                                            </div>
                                        </div>
                                        <ChevronDown size={14} className="text-white/20 ml-1 hidden md:block" />
                                    </button>
                                    {isProfileOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                                            <div className="absolute right-0 top-full mt-3 w-60 bg-[#0c0e11] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-3xl animate-in fade-in zoom-in duration-200">
                                                <div className="p-5 border-b border-white/5 bg-white/5">
                                                    <p className="text-sm font-black text-white italic">PLAYER ONE</p>
                                                    <p className="text-[10px] text-white/40 font-bold tracking-wider mt-0.5 uppercase">player.one@arena.com</p>
                                                </div>
                                                <div className="p-2">
                                                    {[
                                                        { to: '/player/profile', label: 'Mon Profil', icon: User },
                                                        { to: '/player/settings', label: 'Paramètres', icon: Settings },
                                                    ].map(item => (
                                                        <button key={item.to} onClick={() => { navigate(item.to); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                                                            <item.icon size={15} className="opacity-40" /> {item.label}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="p-2 border-t border-white/5">
                                                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-red-400 hover:bg-red-400/10 rounded-xl transition-all">
                                                        <LogOut size={15} /> Déconnexion
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* ═══ Body: Sidebars + Content ═══ */}
                    <div className="flex flex-1 overflow-hidden">

                        {/* ═══ Primary sidebar: nav links + footer (expand/collapse labels) ═══ */}
                        <aside
                            className={cn(
                                'relative flex flex-col shrink-0 h-full z-40 bg-[#060708] border-r border-white/[0.06] transition-[width] duration-300 ease-out overflow-hidden shadow-[inset_-1px_0_0_rgba(0,255,136,0.04)]',
                                primaryNavWidthClass,
                            )}
                        >
                            <nav className="flex flex-col gap-0.5 py-3 shrink-0">
                                {PRIMARY_NAV_LINKS.map((link) => (
                                    <PrimaryNavItem key={link.to} {...link} expanded={primaryNavExpanded} />
                                ))}
                            </nav>

                            <div className="flex-1 min-h-0" />

                            <div className="shrink-0 flex flex-col gap-1 pt-2 pb-3 border-t border-white/[0.06] mt-auto">
                                {PRIMARY_NAV_BOTTOM.map((link) => (
                                    <PrimaryNavItem key={link.to} {...link} expanded={primaryNavExpanded} />
                                ))}
                                <div className={cn('my-1 border-t border-white/[0.06]', primaryNavExpanded ? 'mx-3' : 'mx-auto w-6')} />
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    title="Déconnexion"
                                    className={cn(
                                        'flex items-center rounded-xl text-white/25 hover:bg-red-500/10 hover:text-red-400 transition-all',
                                        primaryNavExpanded
                                            ? 'gap-3 px-3 py-2.5 mx-2 text-[11px] font-black uppercase tracking-wider'
                                            : 'justify-center w-11 h-11 mx-auto',
                                    )}
                                >
                                    <LogOut size={20} className="shrink-0" />
                                    {primaryNavExpanded && <span>Déconnexion</span>}
                                </button>
                            </div>
                        </aside>

                {/* ═══ Channels sidebar — toggle stays outside collapsing width so it is always clickable ═══ */}
                <div
                    className={cn(
                        'relative h-full shrink-0 z-30 overflow-visible transition-[width] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none motion-reduce:duration-0',
                        isSidebarCollapsed ? 'w-0' : 'w-[240px]',
                    )}
                >
                    <aside
                        className={cn(
                            'absolute inset-y-0 left-0 flex w-[240px] flex-col border-r border-white/[0.06] bg-[#0a0b0e] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]',
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

                            <button
                                type="button"
                                onClick={() => setIsSidebarCollapsed((v) => !v)}
                                title={isSidebarCollapsed ? 'Afficher chaînes & suivis' : 'Masquer le panneau'}
                                aria-expanded={!isSidebarCollapsed}
                                className={cn(
                                    'absolute z-[60] flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0a0c0f] bg-primary text-black shadow-[0_0_20px_rgba(0,255,136,0.45)] transition-transform duration-200 hover:scale-110 active:scale-95',
                                    'top-[5.25rem]',
                                    isSidebarCollapsed ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2',
                                )}
                            >
                                {isSidebarCollapsed ? <ChevronRight size={15} strokeWidth={2.5} /> : <ChevronLeft size={15} strokeWidth={2.5} />}
                            </button>
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
            </div>
        </div>
    );
}

// ─── Primary nav row (icon + optional label) ─────────────────────────────

function usePlayerNavActive(to: string): boolean {
    const { pathname } = useLocation();
    if (to === '/player/dashboard') {
        return pathname === '/player/dashboard' || pathname === '/player';
    }
    if (to === '/player/highlights') {
        return pathname === '/player/highlights' || /^\/player\/videos\/[^/]+\/highlights$/.test(pathname);
    }
    if (to === '/player/my-videos') {
        return pathname === '/player/my-videos';
    }
    return pathname === to || pathname.startsWith(`${to}/`);
}

function PrimaryNavItem({
    to,
    label,
    icon: Icon,
    expanded,
}: {
    to: string;
    label: string;
    icon: LucideIcon;
    expanded: boolean;
}) {
    const isActive = usePlayerNavActive(to);
    return (
        <NavLink
            to={to}
            title={label}
            className={cn(
                'relative flex items-center overflow-hidden rounded-xl transition-all duration-200',
                expanded ? 'gap-3 px-3 py-2.5 mx-2' : 'mx-auto h-11 w-11 justify-center',
                isActive
                    ? 'border border-primary/25 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent text-primary shadow-[0_0_20px_rgba(0,255,136,0.14)]'
                    : 'border border-transparent text-white/40 hover:bg-white/[0.06] hover:text-white',
            )}
        >
            {isActive && (
                <>
                    <span className="absolute inset-0 rounded-xl bg-primary/[0.06] pointer-events-none" />
                    <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_12px_rgba(0,255,136,0.7)]" />
                </>
            )}
            <Icon size={22} className="relative z-[1] shrink-0" strokeWidth={isActive ? 2.25 : 2} />
            {expanded && (
                <span className="relative z-[1] truncate text-[11px] font-black uppercase tracking-wider">
                    {label}
                </span>
            )}
        </NavLink>
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

