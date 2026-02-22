import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import {
    Trophy, Calendar, BookOpen, Flag, Swords, Users, GitBranch,
    DollarSign, ClockAlert, ShieldAlert, Plus, ChevronDown, Loader2, CheckSquare, AlertTriangle,
    Star, Globe,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { LeagueHubProvider, useLeagueHub } from './LeagueHubContext';
import { leagueService } from '../../../services/leagueService';

// ─── Tab definition ───────────────────────────────────────────────────────────

const TABS = [
    { to: 'seasons', label: 'Seasons', icon: <Calendar size={14} />, color: 'text-amber-400' },
    { to: 'rules', label: 'Rules', icon: <BookOpen size={14} />, color: 'text-blue-400' },
    { to: 'rounds', label: 'Rounds', icon: <Flag size={14} />, color: 'text-orange-400' },
    { to: 'matches', label: 'Matches', icon: <Swords size={14} />, color: 'text-rose-400' },
    { to: 'teams', label: 'Teams', icon: <Users size={14} />, color: 'text-cyan-400' },
    { to: 'brackets', label: 'Brackets', icon: <GitBranch size={14} />, color: 'text-violet-400' },
    { to: 'prize-pools', label: 'Prize Pools', icon: <DollarSign size={14} />, color: 'text-yellow-400' },
    { to: 'check-ins', label: 'Check-Ins', icon: <ClockAlert size={14} />, color: 'text-teal-400' },
    { to: 'disputes', label: 'Disputes', icon: <ShieldAlert size={14} />, color: 'text-red-400' },
];

const LEVEL_COLORS: Record<string, string> = {
    INTERNATIONAL: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    CONTINENTAL: 'text-blue-400   border-blue-500/30   bg-blue-500/10',
    NATIONAL: 'text-green-400  border-green-500/30  bg-green-500/10',
    REGIONAL: 'text-gray-400   border-gray-500/30   bg-gray-500/10',
};

// ─── Toast ────────────────────────────────────────────────────────────────────

function HubToast() {
    const { toast } = useLeagueHub();
    if (!toast) return null;
    return (
        <div className={cn(
            'fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl border',
            toast.type === 'ok'
                ? 'bg-green-500/15 border-green-500/30 text-green-300'
                : 'bg-red-500/15 border-red-500/30 text-red-300'
        )}>
            {toast.type === 'ok' ? <CheckSquare size={15} /> : <AlertTriangle size={15} />}
            {toast.msg}
        </div>
    );
}

// ─── Inner layout (consumes context) ─────────────────────────────────────────

function HubInner() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {
        leagues, leaguesLoading,
        selectedLeague, setSelectedLeague,
        seasons, seasonsLoading,
        selectedSeason, setSelectedSeason,
        refetchLeagues,
    } = useLeagueHub();

    // Sync URL :id param → selectedLeague
    useEffect(() => {
        if (!id || leaguesLoading) return;
        const found = leagues.find(l => l._id === id);
        if (found) {
            setSelectedLeague(found);
        } else {
            // Fetch directly by id if not in list yet
            leagueService.getLeagueById(id)
                .then(l => { setSelectedLeague(l); refetchLeagues(); })
                .catch(() => navigate('/admin/leagues'));
        }
    }, [id, leagues, leaguesLoading]);

    const lc = selectedLeague ? (LEVEL_COLORS[selectedLeague.level] || LEVEL_COLORS.REGIONAL) : '';

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* ── League Header ──────────────────────────────────────────── */}
            <div className="shrink-0 px-6 pt-5 pb-0">
                <div className="flex items-center gap-4 mb-4">
                    {/* Back to list */}
                    <button
                        onClick={() => navigate('/admin/leagues')}
                        className="flex items-center gap-1.5 text-text-muted hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
                    >
                        <Trophy size={13} />
                        All Leagues
                    </button>
                    <span className="text-white/15">/</span>

                    {leaguesLoading ? (
                        <Loader2 size={14} className="animate-spin text-text-muted" />
                    ) : (
                        <div className="flex items-center gap-3 min-w-0">
                            {selectedLeague && (
                                <>
                                    <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border', lc)}>
                                        {selectedLeague.level}
                                    </span>
                                    <h1 className="text-white font-black text-lg uppercase tracking-tight truncate">
                                        {selectedLeague.name}
                                    </h1>
                                    {selectedLeague.regionId && (
                                        <span className="flex items-center gap-1 text-text-muted text-[10px] font-bold uppercase">
                                            <Globe size={9} /> {selectedLeague.regionId}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Season selector */}
                    <div className="ml-auto flex items-center gap-3 shrink-0">
                        {seasonsLoading ? (
                            <Loader2 size={13} className="animate-spin text-text-muted" />
                        ) : seasons.length > 0 ? (
                            <div className="relative">
                                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                <select
                                    value={selectedSeason?._id || ''}
                                    onChange={e => {
                                        const s = seasons.find(s => s._id === e.target.value) || null;
                                        setSelectedSeason(s);
                                    }}
                                    className="bg-surface border border-white/10 rounded-xl pr-8 pl-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 appearance-none cursor-pointer min-w-[160px]"
                                >
                                    <option value="">— Season —</option>
                                    {seasons.map(s => (
                                        <option key={s._id} value={s._id}>
                                            {s.name} [{s.status}]
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <span className="text-text-muted text-xs">No seasons</span>
                        )}

                        {selectedSeason && (
                            <span className="flex items-center gap-1.5 text-[10px] font-black text-primary border border-primary/25 bg-primary/8 px-3 py-1.5 rounded-full uppercase tracking-widest">
                                <Star size={9} /> {selectedSeason.name}
                            </span>
                        )}

                        <button
                            onClick={() => navigate('/admin/leagues')}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90 transition-all"
                        >
                            <Plus size={12} /> New League
                        </button>
                    </div>
                </div>

                {/* ── Tab bar ─────────────────────────────────────────────── */}
                <div className="flex items-center gap-0.5 border-b border-white/5 overflow-x-auto scrollbar-none pb-0">
                    {TABS.map(tab => (
                        <NavLink
                            key={tab.to}
                            to={tab.to}
                            className={({ isActive }) => cn(
                                'flex items-center gap-1.5 px-3.5 py-2.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 -mb-px',
                                isActive
                                    ? `text-white border-primary`
                                    : 'text-text-muted hover:text-white border-transparent hover:border-white/20'
                            )}
                        >
                            <span className={cn('transition-colors', 'group-[.active]:text-primary')}>
                                {tab.icon}
                            </span>
                            {tab.label}
                        </NavLink>
                    ))}
                </div>
            </div>

            {/* ── Page content ──────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
                <Outlet />
            </div>

            <HubToast />
        </div>
    );
}

// ─── Public export — wraps provider ──────────────────────────────────────────

export default function LeagueHubLayout() {
    return (
        <LeagueHubProvider>
            <HubInner />
        </LeagueHubProvider>
    );
}
