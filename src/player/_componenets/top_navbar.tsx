import { NavLink } from 'react-router-dom';
import { Bell, Building2, ChevronDown, Circle, Crown, DollarSign, LogOut, Newspaper, Radio, Search, Store, User, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import PlayerGameTokenBalance from '../components/PlayerGameTokenBalance';
import appLogo from '../../assets/logo.png';

const TOP_NAV_LINKS = [
    { to: '/player/go-live', label: 'Go Live', icon: <Radio size={16} /> },
    { to: '/player/all-lives', label: 'Lives', icon: <Users size={16} /> },
    { to: '/player/marketplace', label: 'Marketplace', icon: <Store size={16} /> },
    { to: '/player/clubs', label: 'Clubs', icon: <Building2 size={16} /> },
    { to: '/player/market', label: 'Get Tickets', icon: <DollarSign size={16} /> },
    { to: '/player/rankings', label: 'Rankings', icon: <Crown size={16} /> },
    { to: '/player/news', label: 'News', icon: <Newspaper size={16} /> },
];

type TopNavbarProps = {
    headerRailWidthClass: string;
    isProfileOpen: boolean;
    onToggleProfile: () => void;
    onCloseProfile: () => void;
    onGoProfile: () => void;
    onLogout: () => void;
};

export default function TopNavbar({
    headerRailWidthClass,
    isProfileOpen,
    onToggleProfile,
    onCloseProfile,
    onGoProfile,
    onLogout,
}: TopNavbarProps) {
    return (
        <header className="h-[72px] shrink-0 flex items-center z-30 bg-transparent">
            <div
                className={cn(
                    'h-full flex shrink-0 transition-[width] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none motion-reduce:duration-0',
                    headerRailWidthClass,
                )}
            >
                <div className="flex h-full w-full flex-row items-center justify-center gap-1 px-1">
                    <NavLink to="/player/dashboard" className="shrink-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl transition-all hover:scale-105">
                            <img
                                src={appLogo}
                                alt="Arena Chain"
                                className="h-12 w-12 rounded-xl object-cover"
                                loading="eager"
                                decoding="async"
                            />
                        </div>
                    </NavLink>
                </div>
            </div>

            <div className="flex flex-1 items-center justify-between px-6 xl:px-8">
                <div className="flex items-center gap-4">
                    <nav className="flex items-center gap-1.5">
                        {TOP_NAV_LINKS.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                className={({ isActive }) =>
                                    cn(
                                        'group flex items-center gap-2.5 rounded-xl border px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 backdrop-blur-xl',
                                        isActive
                                            ? 'border-primary/30 bg-primary/[0.11] text-primary shadow-[0_0_18px_rgba(0,255,135,0.14)]'
                                            : 'border-white/12 bg-white/[0.03] text-white/40 hover:bg-white/[0.06] hover:text-white/80',
                                    )
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive ? (
                                            <Circle size={5} className="fill-primary animate-pulse" />
                                        ) : (
                                            <span className="opacity-45 transition-opacity group-hover:opacity-80">{link.icon}</span>
                                        )}
                                        <span className="hidden leading-none xl:inline">{link.label}</span>
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative hidden w-64 items-center rounded-2xl border border-white/12 bg-white/[0.03] px-1.5 backdrop-blur-xl lg:flex">
                        <Search className="absolute left-4 h-4 w-4 text-white/35" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="h-10 w-full rounded-xl bg-transparent py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/25 focus:outline-none"
                        />
                    </div>

                    <PlayerGameTokenBalance className="hidden sm:flex" />

                    <button className="relative rounded-xl border border-white/12 bg-white/[0.03] p-2.5 text-white/45 backdrop-blur-xl transition-all hover:border-white/25 hover:bg-white/[0.08] hover:text-white">
                        <Bell size={18} />
                        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
                    </button>

                    <div className="relative">
                        <button
                            onClick={onToggleProfile}
                            className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.03] p-1.5 backdrop-blur-xl transition-all hover:border-white/25 hover:bg-white/[0.08]"
                        >
                            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#16191d] p-0.5">
                                <img
                                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                                    alt="Player"
                                    className="h-full w-full rounded-xl object-cover"
                                />
                            </div>
                            <div className="hidden flex-col items-start md:flex">
                                <span className="text-[11px] font-black uppercase leading-none tracking-tighter text-white italic">Player One</span>
                                <div className="mt-1 flex items-center gap-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    <span className="text-[9px] font-black uppercase tracking-widest leading-none text-primary">Elite</span>
                                </div>
                            </div>
                            <ChevronDown size={14} className="ml-1 hidden text-white/20 md:block" />
                        </button>

                        {isProfileOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={onCloseProfile} />
                                <div className="absolute right-0 top-full z-50 mt-3 w-60 animate-in zoom-in rounded-2xl border border-white/10 bg-[#0c0e11] shadow-2xl duration-200 fade-in backdrop-blur-3xl overflow-hidden">
                                    <div className="border-b border-white/5 bg-white/5 p-5">
                                        <p className="text-sm font-black italic text-white">PLAYER ONE</p>
                                        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-white/40">player.one@arena.com</p>
                                    </div>
                                    <div className="p-2">
                                        <button
                                            type="button"
                                            onClick={onGoProfile}
                                            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest text-white/40 transition-all hover:bg-white/5 hover:text-white"
                                        >
                                            <User size={15} className="opacity-40" /> Mon Profil
                                        </button>
                                    </div>
                                    <div className="border-t border-white/5 p-2">
                                        <button
                                            onClick={onLogout}
                                            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest text-red-400 transition-all hover:bg-red-400/10"
                                        >
                                            <LogOut size={15} /> Déconnexion
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
