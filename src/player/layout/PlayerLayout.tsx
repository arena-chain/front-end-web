import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    History,
    Settings,
    LogOut,
    Menu,
    X,
    User,
    Gamepad2,
    Ticket,
    Trophy,
    DollarSign,
    Bell,
    ChevronDown,
    Search,
    Loader2,
    Crown,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/core';
import { leagueService, type League } from '../../services/leagueService';

export default function PlayerLayout() {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 1024);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    return (
        <div className="h-screen bg-black p-4 flex gap-4 overflow-hidden font-sans text-text">
            {/* Left Sidebar */}
            <aside
                className={cn(
                    "relative flex flex-col shrink-0 h-full bg-[#1A1D21] border border-white/5 rounded-[32px] overflow-hidden transition-all duration-300 z-40",
                    isSidebarOpen ? "w-64" : "w-20"
                )}
            >
                {/* Logo Area */}
                <div className="h-24 flex items-center justify-center relative shrink-0">
                    {isSidebarOpen ? (
                        <div className="flex items-center gap-2 animate-fade-in-up">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-black font-black">A</div>
                            <h1 className="text-xl font-black uppercase tracking-widest text-white">ARENA</h1>
                        </div>
                    ) : (
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-black font-black text-xl shadow-[0_0_15px_rgba(0,255,136,0.5)]">
                            A
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                    <NavItem to="/player/dashboard" icon={<Gamepad2 size={20} />} label="Play" isOpen={isSidebarOpen} />
                    <NavItem to="/player/tournaments" icon={<Trophy size={20} />} label="Tournaments" isOpen={isSidebarOpen} />
                    <LeaguesDropdown isOpen={isSidebarOpen} />
                    <NavItem to="/player/market" icon={<DollarSign size={20} />} label="Get Tickets" isOpen={isSidebarOpen} />
                    <NavItem to="/player/my-tickets" icon={<Ticket size={20} />} label="My Tickets" isOpen={isSidebarOpen} />
                    <NavItem to="/player/matches" icon={<History size={20} />} label="Match History" isOpen={isSidebarOpen} />
                    <NavItem to="/player/rankings" icon={<Crown size={20} />} label="Rankings" isOpen={isSidebarOpen} />

                    <div className="my-3 border-t border-white/5 mx-2" />

                    <NavItem to="/player/profile" icon={<User size={20} />} label="Profile" isOpen={isSidebarOpen} />
                    <NavItem to="/player/settings" icon={<Settings size={20} />} label="Settings" isOpen={isSidebarOpen} />
                </nav>

                {/* Bottom Actions */}
                <div className="p-4 mt-auto">
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className={cn("w-full justify-start text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors rounded-xl", !isSidebarOpen && "justify-center px-0")}
                    >
                        <LogOut size={20} className={cn(isSidebarOpen && "mr-3")} />
                        {isSidebarOpen && <span className="font-medium">Logout</span>}
                    </Button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full bg-[#1A1D21] border border-white/5 rounded-[32px] overflow-hidden relative">
                {/* Top Header */}
                <header className="h-20 shrink-0 sticky top-0 z-30 bg-[#1A1D21]/80 backdrop-blur-md flex items-center justify-between px-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleSidebar}
                            className="p-2 hover:bg-white/5 rounded-xl text-text-muted hover:text-white transition-colors lg:hidden"
                        >
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>

                        <div className="hidden md:flex items-center relative w-96">
                            <Search className="absolute left-4 w-4 h-4 text-text-muted" />
                            <input
                                type="text"
                                placeholder="Search everything..."
                                className="w-full bg-black/20 border border-white/5 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative p-2.5 rounded-full hover:bg-white/5 text-text-muted hover:text-white transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-3 p-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/5 transition-all"
                            >
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-emerald-600 p-[2px]">
                                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                                        <img
                                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                                            alt="Player"
                                            className="w-full h-full rounded-full"
                                        />
                                    </div>
                                </div>
                                <div className="hidden md:flex flex-col items-start mr-2">
                                    <span className="text-sm font-bold text-white leading-none">Player One</span>
                                    <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-bold mt-1">PRO</span>
                                </div>
                                <ChevronDown size={14} className="text-text-muted hidden md:block" />
                            </button>

                            {isProfileOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-[#1A1D21] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                                        <div className="p-4 border-b border-white/5">
                                            <p className="text-sm font-bold text-white">Player One</p>
                                            <p className="text-xs text-text-muted">player.one@arena.com</p>
                                        </div>
                                        <div className="p-2">
                                            <button onClick={() => navigate('/player/profile')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                                <User size={16} /> Profile
                                            </button>
                                            <button onClick={() => navigate('/player/settings')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                                <Settings size={16} /> Settings
                                            </button>
                                        </div>
                                        <div className="p-2 border-t border-white/5">
                                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                                <LogOut size={16} /> Logout
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

// ─── Leagues Dropdown ────────────────────────────────────────────────────────

function LeaguesDropdown({ isOpen }: { isOpen: boolean }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [expanded, setExpanded] = useState(false);
    const [leagues, setLeagues] = useState<League[]>([]);
    const [loading, setLoading] = useState(false);
    const isLeaguesActive = pathname.startsWith('/player/leagues');

    useEffect(() => {
        if (expanded && leagues.length === 0) {
            setLoading(true);
            leagueService.getAllLeagues()
                .then(setLeagues)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [expanded]);

    const levelColor = (level: string): { hex: string; glow: string } => {
        switch (level) {
            case 'INTERNATIONAL': return { hex: '#9333ea', glow: '0 0 14px rgba(147,51,234,0.6)' };
            case 'CONTINENTAL': return { hex: '#2563eb', glow: '0 0 14px rgba(37,99,235,0.6)' };
            case 'NATIONAL': return { hex: '#059669', glow: '0 0 14px rgba(5,150,105,0.6)' };
            default: return { hex: '#ea580c', glow: '0 0 14px rgba(234,88,12,0.6)' };
        }
    };



    // auto-expand when navigating directly to a league URL
    useEffect(() => {
        if (isLeaguesActive) setExpanded(true);
    }, [isLeaguesActive]);

    if (!isOpen) {
        return (
            <button
                onClick={() => navigate('/player/leagues')}
                className={cn(
                    "w-full flex items-center justify-center p-3 rounded-lg transition-all duration-200",
                    isLeaguesActive
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-text-muted hover:text-white hover:bg-white/5"
                )}
                title="Leagues"
            >
                <Trophy size={20} />
            </button>
        );
    }

    return (
        <div>
            <button
                onClick={() => setExpanded(!expanded)}
                className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 group",
                    isLeaguesActive
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-text-muted hover:text-white hover:bg-white/5"
                )}
            >
                <div className="flex items-center gap-3">
                    <Trophy size={20} className="shrink-0" />
                    <span className="font-bold text-sm">Leagues</span>
                </div>
                <ChevronDown
                    size={14}
                    className={cn("transition-transform duration-200 shrink-0", expanded && "rotate-180")}
                />
            </button>

            {expanded && (
                <div className="mt-2 space-y-1.5">
                    {loading ? (
                        <div className="flex justify-center py-3">
                            <Loader2 size={14} className="text-primary animate-spin" />
                        </div>
                    ) : leagues.length === 0 ? (
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest px-2 py-2 opacity-50">No leagues</p>
                    ) : leagues.map((league) => {
                        const lc = levelColor(league.level);
                        const isActive = pathname === `/player/leagues/${league._id}`;
                        return (
                            <button
                                key={league._id}
                                onClick={() => navigate(`/player/leagues/${league._id}`)}
                                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 text-white"
                                style={{
                                    backgroundColor: lc.hex,
                                    opacity: isActive ? 1 : 0.75,
                                    boxShadow: isActive ? lc.glow : 'none',
                                    outline: isActive ? '2px solid rgba(255,255,255,0.25)' : 'none',
                                    outlineOffset: '1px',
                                }}
                                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.opacity = '0.75'; }}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <Trophy size={12} className="shrink-0" />
                                    <span className="truncate">{league.name}</span>
                                </div>
                                <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-white/20 border border-white/30" />
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── NavItem ─────────────────────────────────────────────────────────────────

interface NavItemProps {
    to: string;
    icon: React.ReactNode;
    label: string;
    isOpen: boolean;
}

function NavItem({ to, icon, label, isOpen }: NavItemProps) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => cn(
                "flex items-center p-3 rounded-lg transition-all duration-200 group relative overflow-hidden",
                isActive
                    ? "bg-primary/10 text-primary border-primary/20 border"
                    : "text-text-muted hover:text-white hover:bg-white/5"
            )}
        >
            {({ isActive }) => (
                <>
                    <span className={cn("z-10 transition-transform duration-200 shrink-0", isActive && "scale-110")}>
                        {icon}
                    </span>
                    <span className={cn(
                        "ml-3 font-bold text-sm whitespace-nowrap transition-all duration-300 z-10",
                        !isOpen && "opacity-0 w-0 overflow-hidden ml-0"
                    )}>
                        {label}
                    </span>
                    {isActive && <div className="absolute inset-0 bg-primary/5 blur-md" />}
                </>
            )}
        </NavLink>
    );
}
