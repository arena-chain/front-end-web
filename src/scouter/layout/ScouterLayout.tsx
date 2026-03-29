import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Video,
    Star,
    LogOut,
    Menu,
    X,
    Binoculars,
    ScanLine,
    FileText,
    Send,
    Bookmark,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/core';
import { useAuth } from '../../contexts/AuthContext';

const SCOUT_ACCENT = 'text-primary';
const SCOUT_BG = 'bg-primary/10';
const SCOUT_BORDER = 'border-primary/20';

export default function ScouterLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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
        <div className="min-h-screen bg-[#0a0b0d] text-white font-sans">
            {/* Subtle radar / scan gradient background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-[60%] opacity-30" style={{ background: 'radial-gradient(ellipse at center, rgba(0,255,0,0.08) 0%, transparent 70%)' }} />
                <div className="absolute bottom-0 right-0 w-1/2 h-1/2 opacity-30" style={{ background: 'radial-gradient(ellipse at center, rgba(0,255,0,0.06) 0%, transparent 70%)' }} />
            </div>

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed z-40 flex flex-col h-screen transition-all duration-300 border-r border-primary/10 bg-[#0d0e12]/95 backdrop-blur-md',
                    isSidebarOpen ? 'w-64' : 'w-20'
                )}
            >
                <div className={cn('h-16 flex items-center justify-center border-b border-primary/10 relative', SCOUT_BG)}>
                    {isSidebarOpen ? (
                        <div className="flex items-center gap-2">
                            <Binoculars className={cn('w-6 h-6', SCOUT_ACCENT)} />
                            <span className="text-sm font-black uppercase tracking-widest text-primary/90">Scout Hub</span>
                        </div>
                    ) : (
                        <Binoculars className={cn('w-6 h-6', SCOUT_ACCENT)} />
                    )}
                </div>

                <nav className="flex-1 py-6 px-3 space-y-1">
                    <NavItem to="/scouter/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" isOpen={isSidebarOpen} />
                    <NavItem to="/scouter/players" icon={<Users size={20} />} label="Players" isOpen={isSidebarOpen} />
                    <NavItem to="/scouter/watchlist" icon={<Bookmark size={20} />} label="Watchlist" isOpen={isSidebarOpen} />
                    <NavItem to="/scouter/reports" icon={<FileText size={20} />} label="Reports" isOpen={isSidebarOpen} />
                    <NavItem to="/scouter/recommendations" icon={<Send size={20} />} label="Recommendations" isOpen={isSidebarOpen} />
                    <NavItem to="/scouter/evaluated" icon={<Star size={20} />} label="My Evaluated" isOpen={isSidebarOpen} />
                    <NavItem to="/scouter/highlights" icon={<Video size={20} />} label="Videos & Highlights" isOpen={isSidebarOpen} />
                </nav>

                <div className="p-4 border-t border-primary/10">
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className={cn('w-full justify-start text-primary/80 hover:bg-primary/10 hover:text-primary', !isSidebarOpen && 'justify-center px-0')}
                    >
                        <LogOut size={20} className={cn(isSidebarOpen && 'mr-2')} />
                        {isSidebarOpen && 'Logout'}
                    </Button>
                </div>
            </aside>

            <div className={cn('flex-1 flex flex-col min-h-screen transition-all duration-300 relative z-10', isSidebarOpen ? 'ml-64' : 'ml-20')}>
                <header className="h-16 sticky top-0 z-30 bg-[#0d0e12]/80 backdrop-blur-md border-b border-primary/10 flex items-center justify-between px-6">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg text-primary/70 hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                            <ScanLine size={14} className="text-primary" />
                            <span className="text-xs font-bold uppercase tracking-wider text-primary">Scouter</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-white/90">{user?.nickname ?? 'Scouter'}</span>
                            <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                                <Binoculars className="w-4 h-4 text-primary" />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-6 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

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
            className={({ isActive }) =>
                cn(
                    'flex items-center p-3 rounded-lg transition-all duration-200 group relative',
                    isActive ? 'bg-primary/15 text-primary border border-primary/25' : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                )
            }
        >
            <span className="shrink-0">{icon}</span>
            <span className={cn('ml-3 font-medium text-sm whitespace-nowrap transition-all duration-300', !isOpen && 'opacity-0 w-0 overflow-hidden ml-0')}>
                {label}
            </span>
        </NavLink>
    );
}
