import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    LogOut,
    Menu,
    X,
    Binoculars,
    ScanLine,
    FileText,
    Send,
    Bookmark,
    Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

export default function ScouterLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const user = (() => {
        try {
            const raw = localStorage.getItem('user');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    })();

    return (
        <div className="h-screen bg-[#020203] p-2 sm:p-3 flex overflow-hidden font-sans text-white selection:bg-primary/30 selection:text-black">
            <div className="flex flex-1 rounded-2xl sm:rounded-[22px] overflow-hidden shadow-[0_0_0_1px_rgba(34,211,238,0.1),0_24px_80px_rgba(0,0,0,0.72)] bg-gradient-to-br from-[#0a0c14] via-[#060708] to-[#030305]">
                <aside
                    className={cn(
                        'relative flex flex-col shrink-0 h-full z-40 transition-all duration-300 ease-out overflow-hidden',
                        'bg-gradient-to-b from-[#0b0e18] via-[#070910] to-[#050508]',
                        'rounded-l-2xl sm:rounded-l-[20px] rounded-r-3xl',
                        'shadow-[8px_0_40px_-8px_rgba(0,0,0,0.65)]',
                        isSidebarOpen ? 'w-60' : 'w-[72px]'
                    )}
                >
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_0%_0%,rgba(0,255,100,0.07),transparent_55%)]" />
                    <div className={cn('relative flex items-center shrink-0 overflow-hidden pt-4 pb-3', isSidebarOpen ? 'px-4 gap-3' : 'flex-col justify-center px-2 gap-2')}>
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-primary/25 blur-[1px]" />
                        <div className="relative h-10 w-10 shrink-0 flex items-center justify-center">
                            <div className="absolute inset-0 rotate-45 rounded-lg border border-primary/45 bg-black/60 shadow-[0_0_18px_rgba(0,255,100,0.22)]" />
                            <Binoculars className="relative w-[18px] h-[18px] text-primary drop-shadow-[0_0_6px_rgba(0,255,100,0.8)]" />
                        </div>
                        {isSidebarOpen && (
                            <div className="overflow-hidden min-w-0">
                                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/90 leading-none">
                                    Scout<span className="text-primary">Hub</span>
                                </p>
                                <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-scout-cyan/70 mt-1.5 leading-none">
                                    Tactical
                                </p>
                            </div>
                        )}
                    </div>

                    <nav className="relative flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-4 scrollbar-none">
                        <NavSectionLabel isOpen={isSidebarOpen} accent="violet">
                            Workspace
                        </NavSectionLabel>
                        <div className="space-y-1">
                            <NavItem to="/scouter/dashboard" icon={LayoutDashboard} label="Dashboard" isOpen={isSidebarOpen} />
                            <NavItem to="/scouter/players" icon={Users} label="Players" isOpen={isSidebarOpen} />
                            <NavItem to="/scouter/watchlist" icon={Bookmark} label="Watchlist" isOpen={isSidebarOpen} />
                            <NavItem to="/scouter/reports" icon={FileText} label="Reports" isOpen={isSidebarOpen} />
                            <NavItem to="/scouter/recommendations" icon={Send} label="Recommendations" isOpen={isSidebarOpen} />
                        </div>

                        <NavSectionLabel isOpen={isSidebarOpen} accent="amber">
                            Highlights
                        </NavSectionLabel>
                        <div className="space-y-1">
                            <NavItem to="/scouter/highlights" icon={Sparkles} label="Highlights" isOpen={isSidebarOpen} />
                        </div>
                    </nav>

                    <div className="relative shrink-0 mx-2 mb-2 mt-1 rounded-2xl bg-black/25 p-2.5 space-y-1.5 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_-12px_32px_-8px_rgba(0,0,0,0.5)]">
                        {isSidebarOpen ? (
                            <div className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-2xl bg-white/[0.04] border border-cyan-500/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                <div className="relative h-9 w-9 shrink-0 flex items-center justify-center">
                                    <div className="absolute inset-0.5 rotate-45 rounded-md border border-primary/30 bg-primary/10" />
                                    <Binoculars className="relative w-4 h-4 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-white text-xs font-black truncate tracking-tight">{user?.nickname ?? 'Scouter'}</p>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-scout-cyan/80 truncate">Rank · Scout</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center py-1">
                                <div className="relative h-9 w-9 flex items-center justify-center">
                                    <div className="absolute inset-0 rotate-45 rounded-md border border-primary/35 bg-black/50 shadow-[0_0_14px_rgba(0,255,100,0.2)]" />
                                    <Binoculars className="relative w-4 h-4 text-primary" />
                                </div>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={handleLogout}
                            title="Logout"
                            className={cn(
                                'w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-2xl text-red-400/85 hover:text-red-300 font-black text-[11px] uppercase tracking-wider',
                                'border border-red-500/18 bg-red-500/[0.07] hover:bg-red-500/15 hover:border-red-400/30 hover:shadow-[0_0_20px_rgba(248,113,113,0.14)] transition-all duration-200',
                                !isSidebarOpen && 'justify-center px-0'
                            )}
                        >
                            <LogOut size={15} className="shrink-0" />
                            {isSidebarOpen && <span>Disconnect</span>}
                        </button>
                    </div>
                </aside>

                <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                    <header className="relative h-[60px] shrink-0 flex items-center justify-between px-4 sm:px-6 z-30 mx-2 mt-2 rounded-2xl bg-[#07080f]/92 backdrop-blur-md shadow-[0_12px_40px_-8px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                type="button"
                                onClick={() => setIsSidebarOpen((v) => !v)}
                                className="relative p-2.5 rounded-full text-white/70 hover:text-primary bg-black/35 border border-white/10 hover:border-primary/35 hover:shadow-[0_0_24px_rgba(0,255,100,0.14)] transition-all duration-200"
                                aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                            >
                                {isSidebarOpen ? <X size={18} strokeWidth={2.25} /> : <Menu size={18} strokeWidth={2.25} />}
                            </button>
                            <div className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/25">
                                <span className="text-primary/80">●</span>
                                <span className="truncate">Ops deck</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className="hidden sm:flex items-center gap-2 pl-2.5 pr-3.5 py-2 rounded-full bg-gradient-to-r from-primary/[0.14] via-cyan-500/12 to-violet-600/10 border border-primary/22 shadow-[0_0_22px_rgba(0,255,100,0.1)]">
                                <ScanLine size={14} className="text-primary shrink-0 animate-pulse" />
                                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] text-primary drop-shadow-[0_0_8px_rgba(0,255,100,0.5)]">
                                    Live scout
                                </span>
                            </div>
                            <div className="flex flex-col items-end min-w-0 pr-1">
                                <span className="text-sm font-black text-white truncate max-w-[140px] sm:max-w-[200px] tracking-tight">
                                    {user?.nickname ?? 'Operator'}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-scout-cyan/75 truncate">
                                    Squad link
                                </span>
                            </div>
                            <div className="relative h-10 w-10 shrink-0 flex items-center justify-center">
                                <div className="absolute inset-0 rotate-45 rounded-lg border border-cyan-400/30 bg-gradient-to-br from-primary/15 to-transparent shadow-[0_0_16px_rgba(34,211,238,0.2)]" />
                                <Binoculars className="relative w-[17px] h-[17px] text-primary" />
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 overflow-auto bg-gradient-to-b from-[#05060a] via-[#040508] to-[#020203] sm:rounded-tl-[20px] p-4 sm:p-6">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
}

function NavSectionLabel({
    children,
    isOpen,
    accent,
}: {
    children: React.ReactNode;
    isOpen: boolean;
    accent: 'violet' | 'amber';
}) {
    if (!isOpen) {
        return (
            <div className="flex justify-center py-2">
                <span
                    className={cn(
                        'h-2 w-2 rounded-full',
                        accent === 'violet' ? 'bg-scout-violet/35 shadow-[0_0_10px_rgba(167,139,250,0.35)]' : 'bg-scout-amber/35 shadow-[0_0_10px_rgba(251,191,36,0.25)]'
                    )}
                />
            </div>
        );
    }
    const pill =
        accent === 'violet'
            ? 'border-scout-violet/25 bg-scout-violet/[0.12] text-scout-violet/90 shadow-[0_0_20px_-4px_rgba(167,139,250,0.25)]'
            : 'border-scout-amber/25 bg-scout-amber/[0.1] text-scout-amber/90 shadow-[0_0_20px_-4px_rgba(251,191,36,0.2)]';
    return (
        <div className="px-2 pt-1">
            <span
                className={cn(
                    'inline-flex w-full justify-center rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.22em]',
                    pill
                )}
            >
                {children}
            </span>
        </div>
    );
}

interface NavItemProps {
    to: string;
    icon: LucideIcon;
    label: string;
    isOpen: boolean;
}

function NavItem({ to, icon, label, isOpen }: NavItemProps) {
    const Icon = icon;
    return (
        <NavLink
            to={to}
            title={!isOpen ? label : undefined}
            className={({ isActive }) =>
                cn(
                    'relative flex items-center gap-3 overflow-hidden transition-all duration-200',
                    'group',
                    isOpen ? 'pl-4 pr-3 py-2.5 rounded-2xl' : 'justify-center p-2.5 rounded-2xl',
                    isActive
                        ? 'text-primary bg-gradient-to-r from-primary/[0.16] via-cyan-500/[0.08] to-primary/[0.04] border border-primary/28 shadow-[0_0_24px_rgba(0,255,100,0.14),inset_0_1px_0_rgba(255,255,255,0.07)]'
                        : 'text-white/45 border border-transparent hover:text-white hover:bg-white/[0.05] hover:border-cyan-500/12 hover:rounded-2xl'
                )
            }
        >
            {({ isActive }) => (
                <>
                    <span
                        className={cn(
                            'absolute left-2 top-1/2 -translate-y-1/2 w-1.5 rounded-full transition-all duration-200',
                            isActive ? 'h-[58%] bg-primary shadow-[0_0_14px_rgba(0,255,100,0.85)]' : 'h-0 group-hover:h-[36%] group-hover:bg-primary/45'
                        )}
                    />
                    <Icon size={17} className={cn('shrink-0 relative z-[1]', isActive && 'drop-shadow-[0_0_6px_rgba(0,255,100,0.55)]')} strokeWidth={isActive ? 2.25 : 2} />
                    {isOpen && (
                        <span className="relative z-[1] text-[12px] font-black uppercase tracking-wide whitespace-nowrap leading-none">
                            {label}
                        </span>
                    )}
                </>
            )}
        </NavLink>
    );
}
