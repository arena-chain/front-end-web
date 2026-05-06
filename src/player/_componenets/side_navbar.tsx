import { NavLink, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Award, Clapperboard, Film, Gamepad2, History, LogOut, PlaySquare, Sparkles, Ticket, Trophy, Users, Wallet } from 'lucide-react';
import { cn } from '../../lib/utils';

const PRIMARY_NAV_LINKS: { to: string; label: string; icon: LucideIcon }[] = [
    { to: '/player/dashboard', label: 'Play', icon: Gamepad2 },
    { to: '/player/friends', label: 'Friends', icon: Users },
    { to: '/player/tournaments', label: 'Tournaments', icon: Trophy },
    { to: '/player/tickets', label: 'My Tickets', icon: Ticket },
    { to: '/player/matches', label: 'Match History', icon: History },
    { to: '/player/leagues', label: 'Leagues', icon: Award },
    { to: '/player/channel', label: 'Studio & clips', icon: Clapperboard },
    { to: '/player/my-videos', label: 'My videos', icon: Film },
    { to: '/player/reels', label: 'Reels', icon: PlaySquare },
    { to: '/player/highlights', label: 'Highlights', icon: Sparkles },
];

function usePlayerNavActive(to: string): boolean {
    const { pathname } = useLocation();
    if (to === '/player/dashboard') {
        return pathname === '/player/dashboard' || pathname === '/player';
    }
    if (to === '/player/highlights') {
        return pathname === '/player/highlights' || /^\/player\/videos\/[^/]+\/highlights$/.test(pathname);
    }
    if (to === '/player/my-videos') {
        return pathname === '/player/my-videos';
    }
    if (to === '/player/reels') {
        return pathname === '/player/reels';
    }
    return pathname === to || pathname.startsWith(`${to}/`);
}

function SideNavItem({ to, label, icon: Icon }: { to: string; label: string; icon: LucideIcon }) {
    const isActive = usePlayerNavActive(to);
    return (
        <NavLink
            to={to}
            title={label}
            className={cn(
                'relative flex items-center overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]',
                'mx-auto h-11 w-11 justify-center',
                isActive ? 'text-primary' : 'text-white/45 hover:text-white',
            )}
        >
            {isActive && (
                <span className="absolute left-[5px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_10px_rgba(0,255,136,0.7)]" />
            )}
            <Icon size={22} className="relative z-[1] shrink-0" strokeWidth={isActive ? 2.25 : 2} />
        </NavLink>
    );
}

type SideNavbarProps = {
    widthClass: string;
    onLogout: () => void;
};

export default function SideNavbar({ widthClass, onLogout }: SideNavbarProps) {
    return (
        <aside
            className={cn(
                'relative z-50 flex h-full w-[54px] min-w-[54px] shrink-0 flex-col overflow-visible pointer-events-auto transition-[width] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)]',
                widthClass || 'w-[54px]',
            )}
        >
            <div className="flex h-full flex-col items-center py-3">
                <div className="flex flex-1 items-center justify-center">
                    <div className="flex w-[54px] flex-col items-center gap-2 rounded-[18px] border border-white/15 bg-white/[0.06] py-3 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(255,255,255,0.05)]">
                        {PRIMARY_NAV_LINKS.map((link) => (
                            <SideNavItem key={link.to} {...link} />
                        ))}
                    </div>
                </div>
                <div className="mb-8 flex w-[54px] flex-col items-center justify-center gap-2 rounded-[18px] border border-white/15 bg-white/[0.06] py-3 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(255,255,255,0.05)]">
                    <NavLink
                        to="/player/wallet"
                        title="Portefeuille & historique"
                        aria-label="Portefeuille Vex"
                        className={({ isActive }) =>
                            cn(
                                'relative mx-auto flex h-10 w-10 items-center justify-center overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]',
                                isActive ? 'text-primary' : 'text-white/45 hover:text-white',
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <span className="absolute left-[5px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_12px_rgba(0,255,136,0.7)]" />
                                )}
                                <Wallet size={22} className="relative z-[1] shrink-0" strokeWidth={isActive ? 2.25 : 2} />
                            </>
                        )}
                    </NavLink>
                    <div className="my-1 h-px w-6 bg-white/[0.09]" />
                    <button
                        type="button"
                        onClick={onLogout}
                        title="Déconnexion"
                        className="mx-auto flex h-10 w-10 items-center justify-center text-white/30 transition-all hover:text-red-400"
                    >
                        <LogOut size={20} className="shrink-0" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
