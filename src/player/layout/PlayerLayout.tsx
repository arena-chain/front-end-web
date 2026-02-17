import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
    Users
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/core';

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
                            <h1 className="text-xl font-black uppercase tracking-widest text-white">
                                ARENA
                            </h1>
                        </div>
                    ) : (
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-black font-black text-xl shadow-[0_0_15px_rgba(0,255,136,0.5)]">
                            A
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-2 overflow-y-auto custom-scrollbar">
                    <NavItem to="/player/dashboard" icon={<Gamepad2 size={20} />} label="Play" isOpen={isSidebarOpen} />
                    <NavItem to="/player/tournaments" icon={<Trophy size={20} />} label="Tournaments" isOpen={isSidebarOpen} />
                    <NavItem to="/player/market" icon={<DollarSign size={20} />} label="Get Tickets" isOpen={isSidebarOpen} />
                    <NavItem to="/player/my-tickets" icon={<Ticket size={20} />} label="My Tickets" isOpen={isSidebarOpen} />
                    <NavItem to="/player/matches" icon={<History size={20} />} label="Match History" isOpen={isSidebarOpen} />

                    <div className="my-4 border-t border-white/5 mx-2" />

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

                        {/* Search Bar */}
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
                        {/* Notification Bell */}
                        <button className="relative p-2.5 rounded-full hover:bg-white/5 text-text-muted hover:text-white transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
                        </button>

                        {/* Profile Dropdown */}
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
                                    <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-bold mt-1">
                                        PRO
                                    </span>
                                </div>
                                <ChevronDown size={14} className="text-text-muted hidden md:block" />
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsProfileOpen(false)}
                                    />
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-[#1A1D21] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
                <main className="flex-1 p-8 overflow-y-auto scroll-smooth scrollbar-none">
                    <Outlet />
                </main>
            </div>

            {/* Right Sidebar (Social) */}
            <aside className="shrink-0 w-80 h-full bg-[#1A1D21] border border-white/5 rounded-[32px] hidden xl:flex flex-col py-6 overflow-hidden">
                {/* Header */}
                <div className="px-6 mb-6 flex items-center justify-between shrink-0">
                    <h3 className="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        Social
                    </h3>
                    <div className="flex gap-1">
                        <button className="p-1.5 hover:bg-white/5 rounded-lg text-text-muted hover:text-white transition-colors">
                            <Search className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 hover:bg-white/5 rounded-lg text-text-muted hover:text-white transition-colors">
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Status Filter Tabs (Mock) */}
                <div className="px-6 mb-4 flex gap-2 shrink-0">
                    <button className="text-xs font-bold text-white bg-white/10 px-3 py-1 rounded-full">All</button>
                    <button className="text-xs font-bold text-text-muted hover:text-white hover:bg-white/5 px-3 py-1 rounded-full transition-colors">Online</button>
                    <button className="text-xs font-bold text-text-muted hover:text-white hover:bg-white/5 px-3 py-1 rounded-full transition-colors">In-Game</button>
                </div>

                {/* Friend List */}
                <div className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar">
                    <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 mt-2 px-2">Online — {MOCK_FRIENDS.filter(f => f.status !== 'offline').length}</div>
                    {MOCK_FRIENDS.filter(f => f.status !== 'offline').map((friend) => (
                        <FriendItem key={friend.id} friend={friend} />
                    ))}

                    <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 mt-6 px-2">Offline — {MOCK_FRIENDS.filter(f => f.status === 'offline').length}</div>
                    {MOCK_FRIENDS.filter(f => f.status === 'offline').map((friend) => (
                        <FriendItem key={friend.id} friend={friend} />
                    ))}
                </div>

                {/* Bottom - Quick Action */}
                <div className="p-4 mt-auto shrink-0">
                    <div
                        onClick={() => navigate('/player/subscription')}
                        className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 relative overflow-hidden group cursor-pointer hover:border-primary/40 transition-all"
                    >
                        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/20 rounded-full blur-[30px] -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-primary mb-1">ARENA PLUS</p>
                                <p className="text-white font-bold text-sm">Upgrade to Pro</p>
                            </div>
                            <div className="w-8 h-8 bg-black/40 rounded-lg flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <Trophy className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
}

function FriendItem({ friend }: { friend: typeof MOCK_FRIENDS[0] }) {
    const isOnline = friend.status === 'online';
    const isInGame = friend.status === 'in-game';

    return (
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors">
            <div className="relative">
                <div className={cn(
                    "w-10 h-10 rounded-full bg-surface border-2 transition-all p-0.5",
                    isInGame ? "border-primary" : "border-transparent group-hover:border-white/10"
                )}>
                    <img src={friend.avatar} alt={friend.name} className="w-full h-full rounded-full" />
                </div>
                <div className={cn(
                    "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1A1D21]",
                    isOnline ? "bg-green-500" :
                        isInGame ? "bg-primary" : "bg-gray-500"
                )} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                    <p className="text-sm font-bold text-white truncate">{friend.name}</p>
                </div>
                <p className={cn(
                    "text-xs truncate",
                    isInGame ? "text-primary" : "text-text-muted"
                )}>
                    {isInGame ? 'Playing Valorant' : isOnline ? 'Online' : 'Offline'}
                </p>
            </div>

            {/* Invite Button (Visible on Hover) */}
            {(isOnline || isInGame) && (
                <button className="p-1.5 rounded bg-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-black">
                    <Gamepad2 className="w-3.5 h-3.5" />
                </button>
            )}
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
                "flex items-center p-3 rounded-xl transition-all duration-200 group relative overflow-hidden mb-1",
                isActive
                    ? "bg-primary text-black shadow-[0_0_20px_rgba(0,255,136,0.2)]"
                    : "text-text-muted hover:text-white hover:bg-white/5"
            )}
        >
            {({ isActive }) => (
                <>
                    <span className={cn("z-10 transition-transform duration-200 block", isActive ? "scale-100" : "group-hover:scale-110")}>
                        {/* Clone icon to apply specific active classes */}
                        {React.cloneElement(icon as React.ReactElement<{ size?: number | string; strokeWidth?: number | string; className?: string }>, {
                            size: 22,
                            strokeWidth: isActive ? 2.5 : 2
                        })}
                    </span>

                    <span className={cn(
                        "ml-3 font-bold text-sm whitespace-nowrap transition-all duration-300 z-10",
                        !isOpen && "opacity-0 w-0 overflow-hidden ml-0"
                    )}>
                        {label}
                    </span>
                </>
            )}
        </NavLink>
    );
}

// Mock Data for Social Sidebar
const MOCK_FRIENDS = [
    { id: 1, name: 'Soudemy', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Soudemy', status: 'online' },
    { id: 2, name: 'Kratos', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kratos', status: 'in-game' },
    { id: 3, name: 'Deep Walker', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Deep', status: 'online' },
    { id: 4, name: 'Jane Doe', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane', status: 'offline' },
    { id: 5, name: 'Alex Smith', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', status: 'in-game' },
    { id: 6, name: 'John Wick', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John', status: 'online' },
    { id: 7, name: 'Sarah Connor', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', status: 'offline' },
    { id: 8, name: 'Neo', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Neo', status: 'in-game' },
];
