import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, Trophy, Settings, LogOut, Menu,
    MessageSquare, Gamepad2, Ticket, Handshake,
    Zap, Newspaper, ShieldCheck, Archive, Wand2, Coins,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from '../../components/ui/NotificationBell';

// ─── Nav Structure ────────────────────────────────────────────────────────────

const NAV_GROUPS = [
    {
        label: 'General',
        items: [
            { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
            { to: '/admin/news',      icon: Newspaper,       label: 'News' },
            { to: '/admin/users',     icon: Users,           label: 'Users' },
            { to: '/admin/team-manager-requests', icon: ShieldCheck, label: 'Manager requests' },
        ],
    },
    {
        label: 'Events',
        items: [
            { to: '/admin/leagues',      icon: Trophy,      label: 'League Hub' },
            { to: '/admin/tournaments',  icon: Zap,         label: 'Tournaments' },
            { to: '/admin/tickets',      icon: Ticket,      label: 'Tickets' },
            { to: '/admin/reservations', icon: Ticket,      label: 'Reservations' },
            { to: '/admin/games',        icon: Gamepad2,    label: 'Games Catalog' },
            { to: '/admin/partnerships', icon: Handshake,   label: 'Partnerships' },
            { to: '/admin/channels',     icon: MessageSquare, label: 'Channels' },
        ],
    },
    {
        label: 'Economy',
        items: [{ to: '/admin/currency-offers', icon: Coins, label: 'Currency offers' }],
    },
    {
        label: 'NFT Studio',
        items: [
            { to: '/admin/nft-manager', icon: Wand2, label: 'Studio' },
            { to: '/admin/analytics/tournaments', icon: LayoutDashboard, label: 'Tournament Stats' },
            { to: '/admin/analytics/revenue', icon: Gem, label: 'Revenue & Prizes' },
            { to: '/admin/analytics/engagement', icon: Zap, label: 'Engagement Metrics' },
        ],
    },
    {
        label: 'Inventory',
        items: [
            { to: '/admin/nft-inventory', icon: Archive, label: 'NFT Inventory' },
            { to: '/admin/settings', icon: Settings, label: 'Hub Configuration' },
            { to: '/admin/games', icon: Gamepad2, label: 'Games & Modes' },
            { to: '/admin/settings/api', icon: Box, label: 'API Keys' },
        ],
    },
    {
        label: 'System',
        label: 'Marketplace & NFTs',
        items: [
            { to: '/admin/settings', icon: Settings, label: 'Settings' },
            { to: '/admin/trading', icon: Zap, label: 'Trading Floor' },
            { to: '/admin/nft-manager', icon: Box, label: 'Marketplace Manager' },
            { to: '/admin/nft-avatars', icon: Users, label: 'Avatar Studio' },
            { to: '/admin/nft-collections', icon: Layers, label: 'Collections' },
        ],
    },
];

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AdminLayout() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [isOpen, setIsOpen] = React.useState(true);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="h-screen bg-black p-3 flex overflow-hidden font-sans text-white">
            {/* ══ Unified Shell ══ */}
            <div className="flex flex-1 bg-[#0e0f11] rounded-[22px] overflow-hidden">

                {/* ══ Sidebar ══ */}
                <aside className={cn(
                    "flex flex-col shrink-0 h-full z-40",
                    "transition-all duration-300 ease-in-out",
                    isOpen ? "w-60" : "w-[68px]"
                )}>
                    {/* Logo */}
                    <div className={cn(
                        "h-16 flex items-center shrink-0 overflow-hidden",
                        isOpen ? "px-5 gap-3" : "justify-center"
                    )}>
                        <div className="w-8 h-8 shrink-0 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_16px_rgba(0,255,136,0.35)]">
                            <span className="text-black font-black text-sm">A</span>
                        </div>
                        {isOpen && (
                            <div className="overflow-hidden">
                                <p className="text-white font-black text-sm uppercase tracking-widest leading-none">Arena</p>
                                <p className="text-primary text-[10px] font-bold uppercase tracking-[0.2em] leading-none mt-0.5">Admin</p>
                            </div>
                        )}
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-5 scrollbar-none">
                        {NAV_GROUPS.map(group => (
                            <div key={group.label}>
                                {isOpen ? (
                                    <p className="px-3 mb-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/20">
                                        {group.label}
                                    </p>
                                ) : (
                                    <div className="mx-auto w-5 h-px bg-white/10 mb-2" />
                                )}
                                <div className="space-y-0.5">
                                    {group.items.map(item => (
                                        <NavItem key={item.to} {...item} isOpen={isOpen} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* Bottom: user + logout */}
                    <div className="shrink-0 border-t border-white/[0.05] p-3 space-y-1">
                        {isOpen ? (
                            <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/[0.04] border border-white/[0.05]">
                                <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/20 flex items-center justify-center shrink-0">
                                    <span className="text-primary font-black text-sm">A</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-white text-xs font-bold truncate">Admin User</p>
                                    <p className="text-primary text-[10px] font-bold truncate">Super Admin</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center py-1">
                                <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/20 flex items-center justify-center">
                                    <span className="text-primary font-black text-sm">A</span>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            title="Logout"
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200",
                                !isOpen && "justify-center px-0"
                            )}
                        >
                            <LogOut size={16} className="shrink-0" />
                            {isOpen && <span className="text-xs font-bold">Logout</span>}
                        </button>
                    </div>

                </aside>

                {/* ══ Right: header + content ══ */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Top Header — same bg as sidebar, no border needed */}
                    <header className="h-16 shrink-0 flex items-center justify-between px-6 z-30">
                        <button
                            onClick={() => setIsOpen(v => !v)}
                            className="p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/5 transition-all"
                        >
                            <Menu size={18} />
                        </button>

                        {/* Admin Stats Badges */}
                        <div className="hidden lg:flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff88] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff88]"></span>
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase text-[#00ff88] leading-none mb-0.5">Active</span>
                                    <span className="text-xs font-bold text-white leading-none">0</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-[#3b82f6]"></span>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase text-[#3b82f6] leading-none mb-0.5">Upcoming</span>
                                    <span className="text-xs font-bold text-white leading-none">0</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-[#ff6b35]"></span>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase text-[#ff6b35] leading-none mb-0.5">Pending</span>
                                    <span className="text-xs font-bold text-white leading-none">0</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-[#6b7280]"></span>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase text-[#6b7280] leading-none mb-0.5">Completed</span>
                                    <span className="text-xs font-bold text-white leading-none">0</span>
                                </div>
                            </div>

                            <div className="h-8 w-px bg-white/5 mx-2" />

                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black uppercase text-white/40 leading-none mb-0.5">Total Users</span>
                                <span className="text-xs font-bold text-white leading-none">0</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <NotificationBell />

                            <div className="flex flex-col items-end">
                                <span className="text-sm font-bold text-white">Admin User</span>
                                <span className="text-[11px] text-primary font-bold">Super Admin</span>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/20 flex items-center justify-center">
                                <span className="font-black text-primary text-sm">A</span>
                            </div>
                        </div>
                    </header>

                    {/* Page Content */}
                    <main className="flex-1 overflow-auto bg-[#07080a] rounded-tl-[18px] p-6">
                        <Outlet />
                    </main>
                </div>

            </div>
        </div>
    );
}

// ─── NavItem ──────────────────────────────────────────────────────────────────

interface NavItemProps {
    to: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    isOpen: boolean;
}

function NavItem({ to, icon: Icon, label, isOpen }: NavItemProps) {
    return (
        <NavLink
            to={to}
            title={!isOpen ? label : undefined}
            className={({ isActive }) => cn(
                "relative flex items-center gap-3 rounded-xl transition-all duration-200 group overflow-hidden",
                isOpen ? "px-3 py-2.5" : "justify-center p-2.5",
                isActive
                    ? "bg-primary/10 text-primary"
                    : "text-white/40 hover:text-white hover:bg-white/[0.05]"
            )}
        >
            {({ isActive }) => (
                <>
                    {/* Left accent bar */}
                    <span className={cn(
                        "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-200",
                        isActive ? "h-5 bg-primary shadow-[0_0_8px_rgba(0,255,136,0.6)]" : "h-0"
                    )} />

                    <Icon size={17} className="shrink-0" />

                    {isOpen && (
                        <span className="text-[13px] font-semibold whitespace-nowrap leading-none">
                            {label}
                        </span>
                    )}

                    {/* Active bg glow */}
                    {isActive && (
                        <span className="absolute inset-0 bg-primary/5 rounded-xl pointer-events-none" />
                    )}
                </>
            )}
        </NavLink>
    );
}
