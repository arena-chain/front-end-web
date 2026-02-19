import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Trophy,
    Swords,
    Settings,
    LogOut,
    Menu,
    X,
    MessageSquare,
    Gamepad2,
    Ticket,
    ChevronDown,
    ChevronRight,
    Zap,
    BookOpen,
    Calendar,
    Flag,
    List,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/core';

export default function AdminLayout() {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const handleLogout = () => {
        // In a real app, clear tokens/state here
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-background text-text flex font-sans">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed bg-surface/80 backdrop-blur-md border-r border-white/5 h-screen z-40 transition-all duration-300 flex flex-col",
                    isSidebarOpen ? "w-64" : "w-20"
                )}
            >
                {/* Logo Area */}
                <div className="h-16 flex items-center justify-center border-b border-white/5 relative">
                    {isSidebarOpen ? (
                        <h1 className="text-xl font-black uppercase tracking-widest text-primary animate-fade-in-up">
                            Arena Admin
                        </h1>
                    ) : (
                        <span className="text-xl font-black text-primary">A</span>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                    <NavItem to="/admin/dashboard" icon={<LayoutDashboard size={20} />} label="Overview" isOpen={isSidebarOpen} />
                    <NavItem to="/admin/users" icon={<Users size={20} />} label="Users" isOpen={isSidebarOpen} />
                    <LeaguesMenu isOpen={isSidebarOpen} />
                    <NavItem to="/admin/tournaments" icon={<Trophy size={20} />} label="Tournaments" isOpen={isSidebarOpen} />
                    <NavItem to="/admin/tickets" icon={<Ticket size={20} />} label="Tickets" isOpen={isSidebarOpen} />
                    <NavItem to="/admin/reservations" icon={<Ticket size={20} />} label="Reservations" isOpen={isSidebarOpen} />
                    <NavItem to="/admin/games" icon={<Gamepad2 size={20} />} label="Games Catalog" isOpen={isSidebarOpen} />
                    <NavItem to="/admin/matches" icon={<Swords size={20} />} label="Matches" isOpen={isSidebarOpen} />
                    <NavItem to="/admin/channels" icon={<MessageSquare size={20} />} label="Channels" isOpen={isSidebarOpen} />
                    <NavItem to="/admin/settings" icon={<Settings size={20} />} label="Settings" isOpen={isSidebarOpen} />
                </nav>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-white/5">
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className={cn("w-full justify-start text-red-500 hover:bg-red-500/10 hover:text-red-500", !isSidebarOpen && "justify-center px-0")}
                    >
                        <LogOut size={20} className={cn(isSidebarOpen && "mr-2")} />
                        {isSidebarOpen && "Logout"}
                    </Button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className={cn("flex-1 flex flex-col min-h-screen transition-all duration-300", isSidebarOpen ? "ml-64" : "ml-20")}>
                {/* Top Header */}
                <header className="h-16 sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 hover:bg-white/5 rounded-lg text-text-muted hover:text-white transition-colors"
                    >
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-bold text-white">Admin User</span>
                            <span className="text-xs text-primary">Super Admin</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-surface border border-white/10 flex items-center justify-center">
                            <span className="font-bold text-primary">A</span>
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

// ─── League Hub Accordion ─────────────────────────────────────────────────────

const LEAGUE_SUB_ITEMS = [
    { to: '/admin/leagues/workflow', icon: <Zap size={15} />, label: 'Workflow' },
    { to: '/admin/leagues/list',     icon: <List size={15} />, label: 'Leagues' },
    { to: '/admin/leagues/seasons',  icon: <Calendar size={15} />, label: 'Seasons' },
    { to: '/admin/leagues/rules',    icon: <BookOpen size={15} />, label: 'Rules' },
    { to: '/admin/leagues/rounds',   icon: <Flag size={15} />, label: 'Rounds' },
    { to: '/admin/leagues/matches',  icon: <Swords size={15} />, label: 'Matches' },
    { to: '/admin/leagues/teams',    icon: <Users size={15} />, label: 'Teams' },
];

function LeaguesMenu({ isOpen }: { isOpen: boolean }) {
    const location = useLocation();
    const isLeagueRoute = location.pathname.startsWith('/admin/leagues');
    const [expanded, setExpanded] = React.useState(isLeagueRoute);

    React.useEffect(() => {
        if (isLeagueRoute) setExpanded(true);
    }, [isLeagueRoute]);

    return (
        <div>
            {/* Parent button */}
            <button
                onClick={() => setExpanded(v => !v)}
                className={cn(
                    'w-full flex items-center p-3 rounded-lg transition-all duration-200 group relative overflow-hidden',
                    isLeagueRoute
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-text-muted hover:text-white hover:bg-white/5'
                )}
            >
                <span className={cn('z-10 transition-transform duration-200 shrink-0', isLeagueRoute && 'scale-110')}>
                    <Trophy size={20} />
                </span>
                {isOpen && (
                    <>
                        <span className="ml-3 font-medium text-sm flex-1 text-left whitespace-nowrap z-10">
                            League Hub
                        </span>
                        <span className="z-10 ml-1 text-text-muted">
                            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                    </>
                )}
                {isLeagueRoute && <div className="absolute inset-0 bg-primary/5 blur-md" />}
            </button>

            {/* Sub-items */}
            {expanded && (
                <div className={cn('mt-1 space-y-0.5', isOpen ? 'pl-4' : 'pl-0')}>
                    {LEAGUE_SUB_ITEMS.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => cn(
                                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                                isActive
                                    ? 'bg-primary/15 text-primary border border-primary/15'
                                    : 'text-text-muted hover:text-white hover:bg-white/5',
                                !isOpen && 'justify-center px-2'
                            )}
                            title={!isOpen ? item.label : undefined}
                        >
                            <span className="shrink-0">{item.icon}</span>
                            {isOpen && <span className="whitespace-nowrap">{item.label}</span>}
                        </NavLink>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Generic NavItem ──────────────────────────────────────────────────────────

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
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-text-muted hover:text-white hover:bg-white/5"
            )}
        >
            {({ isActive }) => (
                <>
                    <span className={cn("z-10 transition-transform duration-200", isActive && "scale-110")}>
                        {icon}
                    </span>

                    <span className={cn(
                        "ml-3 font-medium text-sm whitespace-nowrap transition-all duration-300 z-10",
                        !isOpen && "opacity-0 w-0 overflow-hidden ml-0"
                    )}>
                        {label}
                    </span>

                    {/* Active Glow Effect */}
                    {isActive && (
                        <div className="absolute inset-0 bg-primary/5 blur-md" />
                    )}
                </>
            )}
        </NavLink>
    );
}
