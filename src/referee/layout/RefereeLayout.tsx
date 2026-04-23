import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Swords,
    FileText,
    Users,
    Settings,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/core';
import { useAuth } from '../../contexts/AuthContext';

export default function RefereeLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const handleLogout = () => {
        logout();
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
                            Arena Referee
                        </h1>
                    ) : (
                        <span className="text-xl font-black text-primary">R</span>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-2">
                    <NavItem to="/referee/dashboard" icon={<LayoutDashboard size={20} />} label="Overview" isOpen={isSidebarOpen} />
                    <NavItem to="/referee/matches" icon={<Swords size={20} />} label="Active Matches" isOpen={isSidebarOpen} />
                    <NavItem to="/referee/reports" icon={<FileText size={20} />} label="Reports" isOpen={isSidebarOpen} />
                    <NavItem to="/referee/players" icon={<Users size={20} />} label="Player Lookup" isOpen={isSidebarOpen} />
                    <NavItem to="/referee/settings" icon={<Settings size={20} />} label="Settings" isOpen={isSidebarOpen} />
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
                            <span className="text-sm font-bold text-white">Referee Official</span>
                            <span className="text-xs text-primary">Head Referee</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-surface border border-white/10 flex items-center justify-center">
                            <span className="font-bold text-primary">R</span>
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
