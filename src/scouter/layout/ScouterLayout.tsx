import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Star,
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
        <div className="h-screen bg-black p-3 flex overflow-hidden font-sans text-white">
            <div className="flex flex-1 rounded-[22px] overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.45)] ring-1 ring-scout-violet/15 bg-gradient-to-br from-[#0e0f11] via-[#0b0c10] to-[#08090c]">
                <aside className={cn(
                    'flex flex-col shrink-0 h-full z-40 transition-all duration-300 ease-in-out border-r border-white/[0.05] bg-[#0a0b0d]',
                    isSidebarOpen ? 'w-60' : 'w-[68px]'
                )}>
                    <div className={cn(
                        'h-16 flex items-center shrink-0 overflow-hidden',
                        isSidebarOpen ? 'px-5 gap-3' : 'justify-center'
                    )}>
                        <div className="w-8 h-8 shrink-0 rounded-xl bg-primary/20 border border-primary/20 flex items-center justify-center">
                            <Binoculars className="w-4 h-4 text-primary" />
                        </div>
                        {isSidebarOpen && (
                            <div className="overflow-hidden">
                                <p className="text-white font-black text-sm uppercase tracking-widest leading-none">Scout</p>
                                <p className="text-scout-cyan text-[10px] font-bold uppercase tracking-[0.2em] leading-none mt-0.5">Hub</p>
                            </div>
                        )}
                    </div>

                    <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-3 scrollbar-none">
                        {isSidebarOpen ? (
                            <p className="px-3 mb-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-scout-violet/35">
                                Workspace
                            </p>
                        ) : (
                            <div className="mx-auto w-5 h-px bg-white/10 mb-2" />
                        )}
                        <div className="space-y-0.5">
                            <NavItem to="/scouter/dashboard" icon={LayoutDashboard} label="Dashboard" isOpen={isSidebarOpen} />
                            <NavItem to="/scouter/players" icon={Users} label="Players" isOpen={isSidebarOpen} />
                            <NavItem to="/scouter/watchlist" icon={Bookmark} label="Watchlist" isOpen={isSidebarOpen} />
                            <NavItem to="/scouter/reports" icon={FileText} label="Reports" isOpen={isSidebarOpen} />
                            <NavItem to="/scouter/recommendations" icon={Send} label="Recommendations" isOpen={isSidebarOpen} />
                            <NavItem to="/scouter/evaluated" icon={Star} label="My Evaluated" isOpen={isSidebarOpen} />
                        </div>

                        {isSidebarOpen ? (
                            <p className="px-3 mt-5 mb-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-scout-amber/40">
                                Highlights
                            </p>
                        ) : (
                            <div className="mx-auto w-5 h-px bg-white/10 mt-4 mb-2" />
                        )}
                        <div className="space-y-0.5">
                            <NavItem to="/scouter/highlights" icon={Sparkles} label="Highlights" isOpen={isSidebarOpen} />
                        </div>
                    </nav>

                    <div className="shrink-0 border-t border-white/[0.05] p-3 space-y-1">
                        {isSidebarOpen ? (
                            <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/[0.04] border border-white/[0.05]">
                                <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/20 flex items-center justify-center shrink-0">
                                    <Binoculars className="w-4 h-4 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-white text-xs font-bold truncate">{user?.nickname ?? 'Scouter User'}</p>
                                    <p className="text-primary text-[10px] font-bold truncate">Scouter</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center py-1">
                                <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/20 flex items-center justify-center">
                                    <Binoculars className="w-4 h-4 text-primary" />
                                </div>
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            title="Logout"
                            className={cn(
                                'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200',
                                !isSidebarOpen && 'justify-center px-0'
                            )}
                        >
                            <LogOut size={16} className="shrink-0" />
                            {isSidebarOpen && <span className="text-xs font-bold">Logout</span>}
                        </button>
                    </div>
                </aside>

                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="h-16 shrink-0 flex items-center justify-between px-6 z-30 border-b border-white/[0.05] bg-[#0d0e10]">
                        <button
                            onClick={() => setIsSidebarOpen((v) => !v)}
                            className="p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                        >
                            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary/12 to-scout-violet-deep/15 border border-primary/25 shadow-[0_0_16px_rgba(0,255,0,0.1)]">
                                <ScanLine size={14} className="text-primary" />
                                <span className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-primary to-scout-cyan bg-clip-text text-transparent">
                                    Scouter
                                </span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-bold text-white">{user?.nickname ?? 'Scouter User'}</span>
                                <span className="text-[11px] text-scout-cyan/90 font-bold">Scout Team</span>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/20 flex items-center justify-center shadow-[0_0_12px_rgba(57,255,20,0.18)]">
                                <Binoculars className="w-4 h-4 text-primary" />
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 overflow-auto bg-gradient-to-b from-[#07080a] to-[#060708] rounded-tl-[18px] p-6">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
}

interface NavItemProps {
    to: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
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
                    'relative flex items-center gap-3 rounded-xl transition-all duration-200 group overflow-hidden',
                    isOpen ? 'px-3 py-2.5' : 'justify-center p-2.5',
                    isActive
                        ? 'bg-gradient-to-r from-primary/20 via-primary/10 to-transparent text-primary border border-primary/20 shadow-[0_0_14px_rgba(57,255,20,0.1)]'
                        : 'text-white/40 hover:text-white hover:bg-white/[0.05] border border-transparent hover:border-white/10'
                )
            }
        >
            {({ isActive }) => (
                <>
                    <span className={cn(
                        'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-200',
                        isActive ? 'h-5 bg-primary shadow-[0_0_8px_rgba(0,255,136,0.6)]' : 'h-0'
                    )} />
                    <Icon size={17} className="shrink-0" />
                    {isOpen && (
                        <span className="text-[13px] font-semibold whitespace-nowrap leading-none">
                            {label}
                        </span>
                    )}
                    {isActive && (
                        <span className="absolute inset-0 bg-primary/5 rounded-xl pointer-events-none" />
                    )}
                </>
            )}
        </NavLink>
    );
}
