import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    History,
    Settings,
    LogOut,
    User,
    Gamepad2,
    Ticket,
    Trophy,
    DollarSign,
    Bell,
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
    Newspaper,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { channelService, type ChannelRecord } from '../../services/channel.service';


// ─── Top nav links (shown in the horizontal top bar) ─────────────────────────
const TOP_NAV_LINKS = [
    { to: '/player/channel', label: 'Channel', icon: <Video size={16} /> },
    { to: '/player/go-live', label: 'Go Live', icon: <Radio size={16} /> },
    { to: '/player/all-lives', label: 'Lives', icon: <Users size={16} /> },
    { to: '/player/marketplace', label: 'Marketplace', icon: <Store size={16} /> },
    { to: '/player/market', label: 'Get Tickets', icon: <DollarSign size={16} /> },
    { to: '/player/rankings', label: 'Rankings', icon: <Crown size={16} /> },
    { to: '/player/news', label: 'News', icon: <Newspaper size={16} /> },
];

// ─── Side nav links (icon-only slim sidebar) ─────────────────────────────────
const SIDE_NAV_LINKS = [
    { to: '/player/dashboard', icon: <Gamepad2 size={22} />, tooltip: 'Play' },
    { to: '/player/tournaments', icon: <Trophy size={22} />, tooltip: 'Tournaments' },
    { to: '/player/my-tickets', icon: <Ticket size={22} />, tooltip: 'My Tickets' },
    { to: '/player/matches', icon: <History size={22} />, tooltip: 'Match History' },
];

const SIDE_NAV_BOTTOM = [
    { to: '/player/profile', icon: <User size={22} />, tooltip: 'Profile' },
    { to: '/player/settings', icon: <Settings size={22} />, tooltip: 'Settings' },
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
    const navigate = useNavigate();
    const location = useLocation();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [profile, setProfile] = useState<PlayerProfileData | null>(null);
    const [channels, setChannels] = useState<ChannelRecord[]>([]);
    const [loadingChannels, setLoadingChannels] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
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
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    React.useEffect(() => {
        void loadSidebarChannels();
    }, []);

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

    return (
        <div className="h-screen bg-black p-3 flex overflow-hidden font-sans text-text">
            {/* ═══ Unified Shell ═══ */}
            <div className="flex flex-1 bg-[#111214] rounded-3xl overflow-hidden">
                {/* ═══ Left Icon Sidebar (Slim) ═══ */}
                <aside className="relative flex flex-col shrink-0 w-[68px] h-full z-40 bg-[#060708] border-r border-white/5">
                    {/* Logo */}
                    <div className="h-16 flex items-center justify-center shrink-0">
                        <NavLink to="/player/dashboard">
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-black font-black text-lg shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:scale-105 transition-all">
                                A
                            </div>
                        </NavLink>
                    </div>

                {/* Main nav icons */}
                <nav className="flex-1 flex flex-col items-center gap-1 py-4">
                    {SIDE_NAV_LINKS.map(link => (
                        <SideIcon key={link.to} {...link} />
                    ))}
                    <LeaguesIcon />
                </nav>

                    {/* Bottom icons */}
                    <div className="flex flex-col items-center gap-2 pb-4">
                        {SIDE_NAV_BOTTOM.map(link => (
                            <SideIcon key={link.to} {...link} />
                        ))}
                        <div className="my-1 w-6 border-t border-white/5" />
                        <button
                            onClick={handleLogout}
                            title="Logout"
                            className="w-11 h-11 flex items-center justify-center rounded-xl text-white/20 hover:bg-red-500/10 hover:text-red-400 transition-all"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </aside>

                {/* ═══ Kick-style Category/Following Sidebar ═══ */}
                <aside className={cn(
                    "relative flex flex-col shrink-0 bg-[#0f1115] border-r border-white/5 transition-all duration-500 ease-in-out z-30 group/sidebar",
                    isSidebarCollapsed ? "w-0 opacity-0 invisible" : "w-[240px] opacity-100"
                )}>
                    {/* Collapse Toggle */}
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="absolute -right-3 top-20 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-black shadow-lg z-50 hover:scale-110 transition-transform"
                    >
                        {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>

                    <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-6 px-4 space-y-8">
                        {/* Suivis Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 italic">Suivis</span>
                                <div className="w-1 h-1 rounded-full bg-primary/40 animate-pulse" />
                            </div>
                            <div className="space-y-1">
                                {loadingChannels ? (
                                    <div className="space-y-4 px-2">
                                        {[1, 2, 3].map(i => <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse" />)}
                                    </div>
                                ) : (
                                    channels.slice(0, 4).map(ch => (
                                        <ChannelSidebarItem key={ch._id} channel={ch} />
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Recommandées Section */}
                        <div className="space-y-4">
                            <div className="px-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 italic">Recommandées</span>
                            </div>
                            <div className="space-y-1">
                                {channels.slice(4).map(ch => (
                                    <ChannelSidebarItem key={ch._id} channel={ch} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Footer */}
                    <div className={cn(
                        "p-4 border-t border-white/5 bg-black/20",
                        isSidebarCollapsed && "hidden"
                    )}>
                        <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 italic">Vérifié par Arena</p>
                            <p className="text-[11px] text-white/40 leading-relaxed font-medium">Découvrez les meilleurs talents du studio.</p>
                        </div>
                    </div>
                </aside>

                {/* ═══ Right: Top bar + Content ═══ */}
                <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#060708]">
                    {/* ── Top Navbar ── */}
                    <header className="h-16 shrink-0 flex items-center justify-between px-8 z-30 border-b border-white/5 backdrop-blur-md bg-[#0a0c0f]/80">
                        <div className="flex items-center gap-6">
                            {isSidebarCollapsed && (
                                <button
                                    onClick={() => setIsSidebarCollapsed(false)}
                                    className="w-9 h-9 rounded-xl border border-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            )}
                            {/* Left: Top nav links */}
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

                    {/* Right: Search + Bell + Profile */}
                    <div className="flex items-center gap-4">
                        <div className="hidden lg:flex items-center relative w-64">
                            <Search className="absolute left-3 w-4 h-4 text-text-muted" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-primary/40 transition-colors"
                            />
                        </div>

                        <button className="relative p-2 rounded-xl hover:bg-white/5 text-text-muted hover:text-white transition-colors">
                            <Bell size={18} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                        </button>

                            {/* Profile */}
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
                    </header>

                    {/* ── Page Content ── */}
                    <main className="flex-1 overflow-auto bg-[#0a0c0f] scrollbar-hide">
                        <div className={cn(
                            "transition-all duration-500",
                            location.pathname.startsWith('/watch/') ? "p-0" : "p-8"
                        )}>
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

// ─── Sidebar Icon Button ─────────────────────────────────────────────────────

function SideIcon({ to, icon, tooltip }: { to: string; icon: React.ReactNode; tooltip: string }) {
    return (
        <NavLink
            to={to}
            title={tooltip}
            className={({ isActive }) => cn(
                "relative w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200 group",
                isActive
                    ? "bg-primary/15 text-primary shadow-[0_0_12px_rgba(0,255,136,0.15)]"
                    : "text-text-muted hover:text-white hover:bg-white/5"
            )}
        >
            {({ isActive }) => (
                <>
                    {icon}
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />}
                    {/* Tooltip */}
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#1a1d21] border border-white/10 rounded-lg text-[11px] font-bold text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                        {tooltip}
                    </div>
                </>
            )}
        </NavLink>
    );
}

// ─── Leagues Icon (icon-only sidebar) ────────────────────────────────────────

function LeaguesIcon() {
    const { pathname } = useLocation();
    const isActive = pathname.startsWith('/player/leagues');

    return (
        <NavLink
            to="/player/leagues"
            title="Leagues"
            className={cn(
                "relative w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200 group",
                isActive
                    ? "bg-primary/15 text-primary shadow-[0_0_12px_rgba(0,255,136,0.15)]"
                    : "text-text-muted hover:text-white hover:bg-white/5"
            )}
        >
            <Trophy size={22} />
            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />}
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#1a1d21] border border-white/10 rounded-lg text-[11px] font-bold text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                Leagues
            </div>
        </NavLink>
    );
}
