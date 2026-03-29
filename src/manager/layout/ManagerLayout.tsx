import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Trophy,
    Settings,
    LogOut,
    Swords,
    Bell,
    Search,
    ChevronLeft,
    ChevronRight,
    Zap,
    ChevronDown,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface StoredUser { nickname?: string; email?: string; organizationName?: string; role?: string }

const NAV_SECTIONS = [
    {
        label: 'MAIN',
        items: [
            { to: '/manager/dashboard',   icon: LayoutDashboard, label: 'Overview' },
            { to: '/manager/roster',      icon: Users,           label: 'My Roster' },
            { to: '/manager/tournaments', icon: Trophy,          label: 'Leagues' },
            { to: '/manager/scrims',      icon: Swords,          label: 'Scrims' },
        ],
    },
    {
        label: 'ACCOUNT',
        items: [
            { to: '/manager/settings',    icon: Settings,        label: 'Settings' },
        ],
    },
];

const ROUTE_TITLES: Record<string, string> = {
    '/manager/dashboard':   'Overview',
    '/manager/roster':      'My Roster',
    '/manager/tournaments': 'Leagues',
    '/manager/scrims':      'Scrims',
    '/manager/settings':    'Settings',
};

export default function ManagerLayout() {
    const navigate  = useNavigate();
    const location  = useLocation();
    const [collapsed, setCollapsed] = React.useState(false);
    const [userMenuOpen, setUserMenuOpen] = React.useState(false);
    const userMenuRef = React.useRef<HTMLDivElement>(null);

    const user: StoredUser = (() => {
        try { return JSON.parse(localStorage.getItem('user') || '{}'); }
        catch { return {}; }
    })();

    const displayName = user.nickname || user.email?.split('@')[0] || 'Manager';
    const orgName     = user.organizationName || 'My Team';
    const initials    = displayName.slice(0, 2).toUpperCase();
    const pageTitle   = ROUTE_TITLES[location.pathname] ?? 'Dashboard';

    React.useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    return (
        <div className="min-h-screen flex font-sans" style={{ background: '#080809', color: '#e8e8e8' }}>

            {/* ══════════════════ SIDEBAR ══════════════════ */}
            <aside
                className={cn(
                    "fixed top-0 left-0 h-screen z-40 flex flex-col transition-all duration-300 ease-in-out select-none",
                    collapsed ? "w-[72px]" : "w-[240px]"
                )}
                style={{
                    background: 'linear-gradient(180deg, #0d0e10 0%, #0a0b0d 100%)',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                {/* ── Brand ── */}
                <div className="relative flex items-center h-[64px] px-4 shrink-0"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #00ff00 0%, #00cc44 100%)', boxShadow: '0 0 16px rgba(0,255,0,0.35)' }}>
                            <Zap size={16} className="text-black" strokeWidth={2.5} />
                        </div>
                        <div className={cn("transition-all duration-300 overflow-hidden", collapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
                            <p className="text-[13px] font-black tracking-[0.15em] uppercase whitespace-nowrap"
                                style={{ color: '#00ff00', lineHeight: 1 }}>Arena Chain</p>
                            <p className="text-[10px] font-medium tracking-widest whitespace-nowrap"
                                style={{ color: 'rgba(255,255,255,0.3)' }}>Team Manager</p>
                        </div>
                    </div>

                    {/* Collapse toggle */}
                    <button
                        onClick={() => setCollapsed(p => !p)}
                        className={cn(
                            "absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 z-10",
                            "hover:scale-110 active:scale-95"
                        )}
                        style={{ background: '#1a1c20', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
                    >
                        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
                    </button>
                </div>

                {/* ── Navigation ── */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-5 scrollbar-none">
                    {NAV_SECTIONS.map(section => (
                        <div key={section.label}>
                            {!collapsed && (
                                <p className="text-[10px] font-bold tracking-[0.15em] mb-2 px-2"
                                    style={{ color: 'rgba(255,255,255,0.2)' }}>
                                    {section.label}
                                </p>
                            )}
                            <div className="space-y-0.5">
                                {section.items.map(item => (
                                    <NavItem key={item.to} to={item.to} Icon={item.icon} label={item.label} collapsed={collapsed} />
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* ── User Profile Card ── */}
                <div className="shrink-0 p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div
                        className={cn(
                            "flex items-center gap-3 rounded-xl p-2.5 transition-colors duration-200 cursor-pointer",
                            "hover:bg-white/5 active:bg-white/[0.03]"
                        )}
                        onClick={handleLogout}
                        title="Logout"
                    >
                        <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                            style={{
                                background: 'linear-gradient(135deg, rgba(0,255,0,0.2) 0%, rgba(0,200,50,0.1) 100%)',
                                border: '1px solid rgba(0,255,0,0.25)',
                                color: '#00ff00',
                            }}>
                            {initials}
                        </div>
                        <div className={cn("flex-1 min-w-0 transition-all duration-300", collapsed ? "w-0 opacity-0 overflow-hidden" : "opacity-100")}>
                            <p className="text-[13px] font-semibold truncate" style={{ color: '#e8e8e8' }}>{displayName}</p>
                            <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{orgName}</p>
                        </div>
                        {!collapsed && (
                            <LogOut size={14} className="shrink-0 transition-colors" style={{ color: 'rgba(255,80,80,0.7)' }} />
                        )}
                    </div>
                </div>
            </aside>

            {/* ══════════════════ MAIN AREA ══════════════════ */}
            <div className={cn("flex-1 flex flex-col min-h-screen transition-all duration-300", collapsed ? "ml-[72px]" : "ml-[240px]")}>

                {/* ── Top Header ── */}
                <header
                    className="h-[64px] sticky top-0 z-30 flex items-center gap-4 px-6"
                    style={{
                        background: 'rgba(8,8,9,0.85)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    {/* Page title / breadcrumb */}
                    <div className="flex items-center gap-2 mr-4">
                        <span className="text-[11px] font-medium tracking-widest uppercase"
                            style={{ color: 'rgba(255,255,255,0.25)' }}>Manager</span>
                        <span style={{ color: 'rgba(255,255,255,0.15)' }}>/</span>
                        <span className="text-[13px] font-semibold" style={{ color: '#e8e8e8' }}>{pageTitle}</span>
                    </div>

                    {/* Search bar */}
                    <div className="flex-1 max-w-sm">
                        <div className="relative flex items-center group">
                            <Search size={14} className="absolute left-3 pointer-events-none transition-colors"
                                style={{ color: 'rgba(255,255,255,0.25)' }} />
                            <input
                                type="text"
                                placeholder="Search…"
                                className="w-full h-9 pl-9 pr-12 text-sm rounded-xl outline-none transition-all duration-200 placeholder:text-white/20"
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.07)',
                                    color: '#e8e8e8',
                                }}
                                onFocus={e => { e.currentTarget.style.border = '1px solid rgba(0,255,0,0.25)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                                onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                            />
                            <kbd className="absolute right-3 text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                ⌘K
                            </kbd>
                        </div>
                    </div>

                    <div className="flex-1" />

                    {/* Status pill */}
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl"
                        style={{ background: 'rgba(0,255,0,0.06)', border: '1px solid rgba(0,255,0,0.12)' }}>
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00ff00' }} />
                        <span className="text-[11px] font-medium" style={{ color: 'rgba(0,255,0,0.8)' }}>Live</span>
                    </div>

                    {/* Notifications */}
                    <button className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <Bell size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                            style={{ background: '#ff4444', boxShadow: '0 0 6px rgba(255,68,68,0.7)' }} />
                    </button>

                    {/* Divider */}
                    <div className="w-px h-6" style={{ background: 'rgba(255,255,255,0.07)' }} />

                    {/* User menu */}
                    <div className="relative" ref={userMenuRef}>
                        <button
                            onClick={() => setUserMenuOpen(p => !p)}
                            className="flex items-center gap-2.5 h-9 px-2 rounded-xl transition-all duration-200 hover:bg-white/5"
                        >
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(0,255,0,0.2) 0%, rgba(0,200,50,0.1) 100%)',
                                    border: '1px solid rgba(0,255,0,0.3)',
                                    color: '#00ff00',
                                }}>
                                {initials}
                            </div>
                            <div className="hidden sm:flex flex-col items-start">
                                <span className="text-[12px] font-semibold leading-none" style={{ color: '#e8e8e8' }}>{displayName}</span>
                                <span className="text-[10px] leading-none mt-0.5" style={{ color: 'rgba(0,255,0,0.7)' }}>{orgName}</span>
                            </div>
                            <ChevronDown size={12} className={cn("transition-transform duration-200", userMenuOpen && "rotate-180")}
                                style={{ color: 'rgba(255,255,255,0.3)' }} />
                        </button>

                        {/* Dropdown */}
                        {userMenuOpen && (
                            <div className="absolute right-0 top-[calc(100%+8px)] w-44 rounded-xl py-1 z-50"
                                style={{
                                    background: '#12141a',
                                    border: '1px solid rgba(255,255,255,0.09)',
                                    boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                                }}>
                                <button
                                    onClick={() => { navigate('/manager/settings'); setUserMenuOpen(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors hover:bg-white/5"
                                    style={{ color: 'rgba(255,255,255,0.7)' }}
                                >
                                    <Settings size={13} style={{ color: 'rgba(255,255,255,0.4)' }} />
                                    Settings
                                </button>
                                <div className="my-1 mx-2" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors hover:bg-red-500/10"
                                    style={{ color: 'rgba(255,80,80,0.85)' }}
                                >
                                    <LogOut size={13} />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* ── Page Content ── */}
                <main className="flex-1 p-6 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

interface NavItemProps {
    to: string;
    Icon: React.ElementType;
    label: string;
    collapsed: boolean;
}

function NavItem({ to, Icon, label, collapsed }: NavItemProps) {
    return (
        <NavLink
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) => cn(
                "relative flex items-center gap-3 h-9 rounded-xl transition-all duration-200 group overflow-hidden",
                collapsed ? "px-2.5 justify-center" : "px-3",
                isActive
                    ? "text-white"
                    : "text-white/40 hover:text-white/80"
            )}
            style={({ isActive }) => isActive ? {
                background: 'rgba(0,255,0,0.08)',
                boxShadow: 'inset 0 0 0 1px rgba(0,255,0,0.12)',
            } : undefined}
        >
            {({ isActive }) => (
                <>
                    {/* Left accent bar */}
                    {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                            style={{ background: '#00ff00', boxShadow: '0 0 8px rgba(0,255,0,0.6)' }} />
                    )}

                    <Icon
                        size={16}
                        strokeWidth={isActive ? 2.5 : 2}
                        className="shrink-0 transition-colors duration-200 z-10"
                        style={{ color: isActive ? '#00ff00' : undefined }}
                    />

                    <span className={cn(
                        "text-[13px] font-medium whitespace-nowrap transition-all duration-300 z-10",
                        collapsed ? "w-0 opacity-0 overflow-hidden" : "opacity-100"
                    )}>
                        {label}
                    </span>

                    {/* Hover glow */}
                    {!isActive && (
                        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl"
                            style={{ background: 'rgba(255,255,255,0.03)' }} />
                    )}
                </>
            )}
        </NavLink>
    );
}
