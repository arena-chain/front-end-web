import React, { useState } from 'react';
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
} from 'lucide-react';
import { cn } from '../../lib/utils';

// ─── Top nav links (shown in the horizontal top bar) ─────────────────────────
const TOP_NAV_LINKS = [
    { to: '/player/marketplace', label: 'Marketplace', icon: <Store size={16} /> },
    { to: '/player/market', label: 'Get Tickets', icon: <DollarSign size={16} /> },
    { to: '/player/rankings', label: 'Rankings', icon: <Crown size={16} /> },
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

export default function PlayerLayout() {
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    return (
        <div className="h-screen bg-black p-3 flex overflow-hidden font-sans text-text">
            {/* ═══ Unified Shell ═══ */}
            <div className="flex flex-1 bg-[#111214] rounded-[24px] overflow-hidden">
            {/* ═══ Left Icon Sidebar ═══ */}
            <aside className="relative flex flex-col shrink-0 w-[72px] h-full z-40">
                {/* Logo */}
                <div className="h-16 flex items-center justify-center shrink-0">
                    <NavLink to="/player/dashboard">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-black font-black text-lg shadow-[0_0_20px_rgba(0,255,136,0.4)] hover:shadow-[0_0_25px_rgba(0,255,136,0.6)] transition-shadow">
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
                <div className="flex flex-col items-center gap-1 pb-3">
                    {SIDE_NAV_BOTTOM.map(link => (
                        <SideIcon key={link.to} {...link} />
                    ))}
                    <div className="my-1 w-6 border-t border-white/10" />
                    <button
                        onClick={handleLogout}
                        title="Logout"
                        className="w-11 h-11 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </aside>

            {/* ═══ Right: Top bar + Content ═══ */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* ── Top Navbar ── */}
                <header className="h-16 shrink-0 flex items-center justify-between px-6 z-30">
                    {/* Left: Top nav links */}
                    <nav className="flex items-center gap-1">
                        {TOP_NAV_LINKS.map(link => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                className={({ isActive }) => cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200",
                                    isActive
                                        ? "bg-primary/10 text-primary border border-primary/20"
                                        : "text-text-muted hover:text-white hover:bg-white/5"
                                )}
                            >
                                {link.icon}
                                <span className="hidden sm:inline">{link.label}</span>
                            </NavLink>
                        ))}
                    </nav>

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
                                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-emerald-600 p-[2px]">
                                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                                        <img
                                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                                            alt="Player"
                                            className="w-full h-full rounded-full"
                                        />
                                    </div>
                                </div>
                                <div className="hidden md:flex flex-col items-start">
                                    <span className="text-xs font-bold text-white leading-none">Player One</span>
                                    <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-bold mt-0.5">PRO</span>
                                </div>
                                <ChevronDown size={12} className="text-text-muted hidden md:block" />
                            </button>

                            {isProfileOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-52 bg-[#1A1D21] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                                        <div className="p-3 border-b border-white/5">
                                            <p className="text-sm font-bold text-white">Player One</p>
                                            <p className="text-[11px] text-text-muted">player.one@arena.com</p>
                                        </div>
                                        <div className="p-1.5">
                                            <button onClick={() => { navigate('/player/profile'); setIsProfileOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                                <User size={15} /> Profile
                                            </button>
                                            <button onClick={() => { navigate('/player/settings'); setIsProfileOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                                <Settings size={15} /> Settings
                                            </button>
                                        </div>
                                        <div className="p-1.5 border-t border-white/5">
                                            <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                                <LogOut size={15} /> Logout
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* ── Page Content ── */}
                <main className="flex-1 overflow-auto bg-[#0a0b0d] rounded-tl-[20px]">
                    <div className="p-6">
                        <Outlet />
                    </div>
                </main>
            </div>
            </div>
        </div>
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
