import { useState, useEffect } from 'react';
import {
    Trophy, Calendar, Users, ChevronRight, Globe, RefreshCw,
    Clock, CheckCircle, PlayCircle, Search, Filter,
} from 'lucide-react';
import { leagueService, League } from '../../services/leagueService';
import { seasonService, Season, SeasonStatus } from '../../services/seasonService';

const STATUS_META: Record<SeasonStatus, { label: string; cls: string; icon: React.ReactNode }> = {
    PLANNED:  { label: 'Planned',  cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20',    icon: <Clock className="w-3.5 h-3.5" /> },
    ONGOING:  { label: 'Live',     cls: 'bg-primary/10 text-primary border-primary/20',       icon: <PlayCircle className="w-3.5 h-3.5" /> },
    FINISHED: { label: 'Finished', cls: 'bg-white/5 text-text-muted border-white/10',         icon: <CheckCircle className="w-3.5 h-3.5" /> },
};

interface LeagueWithSeasons extends League { seasons?: Season[] }

export default function ManagerTournaments() {
    const [leagues, setLeagues]   = useState<LeagueWithSeasons[]>([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState('');
    const [filterStatus, setFilterStatus] = useState<SeasonStatus | 'ALL'>('ALL');
    const [expandedLeague, setExpandedLeague] = useState<string | null>(null);

    const load = async () => {
        try {
            setLoading(true);
            const lgs = await leagueService.getAllLeagues();
            const enriched = await Promise.all(
                lgs.map(async (l: League) => {
                    try {
                        const seasons = await seasonService.getByLeague(l._id);
                        return { ...l, seasons };
                    } catch {
                        return { ...l, seasons: [] };
                    }
                })
            );
            setLeagues(enriched);
        } catch {
            // fail silently
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const isOpen = (season: Season) => {
        const now = new Date();
        const deadline = new Date(season.registrationDeadline);
        return season.status === 'PLANNED' && now < deadline;
    };

    const daysUntil = (d: string) => {
        const diff = new Date(d).getTime() - Date.now();
        return Math.max(0, Math.ceil(diff / 86_400_000));
    };

    const visibleLeagues = leagues.filter(l => {
        if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterStatus !== 'ALL') {
            if (!l.seasons?.some(s => s.status === filterStatus)) return false;
        }
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-yellow-500" /> Leagues & Seasons
                    </h1>
                    <p className="text-text-muted text-sm mt-1">Browse open competitions and register your team</p>
                </div>
                <button onClick={load} className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-text-muted hover:text-white transition-colors">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search leagues…"
                        className="w-full pl-9 pr-4 py-2 bg-surface border border-white/10 rounded-xl text-sm text-white placeholder-text-muted focus:outline-none focus:border-primary/50" />
                </div>
                <div className="flex items-center gap-1.5 bg-surface border border-white/10 rounded-xl px-2">
                    <Filter className="w-4 h-4 text-text-muted" />
                    {(['ALL', 'PLANNED', 'ONGOING', 'FINISHED'] as const).map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s
                                ? 'bg-primary/10 text-primary'
                                : 'text-text-muted hover:text-white'}`}>
                            {s === 'ALL' ? 'All' : STATUS_META[s]?.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* League list */}
            {loading ? (
                <div className="text-text-muted text-center py-16">Loading…</div>
            ) : visibleLeagues.length === 0 ? (
                <div className="bg-surface border border-white/5 rounded-xl p-12 text-center text-text-muted">
                    <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No leagues found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {visibleLeagues.map(league => {
                        const open = expandedLeague === league._id;
                        const openSeasons = league.seasons?.filter(isOpen) ?? [];
                        return (
                            <div key={league._id} className="bg-surface border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all">
                                {/* League row */}
                                <button
                                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                                    onClick={() => setExpandedLeague(open ? null : league._id)}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                            <Trophy className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm">{league.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Globe className="w-3 h-3 text-text-muted" />
                                                <span className="text-xs text-text-muted">{league.level} · {league.regionId}</span>
                                                {openSeasons.length > 0 && (
                                                    <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">
                                                        {openSeasons.length} open
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-text-muted">{league.seasons?.length ?? 0} seasons</span>
                                        <ChevronRight className={`w-4 h-4 text-text-muted transition-transform ${open ? 'rotate-90' : ''}`} />
                                    </div>
                                </button>

                                {/* Seasons */}
                                {open && (
                                    <div className="border-t border-white/5 px-5 pb-4 pt-3 space-y-2">
                                        {!league.seasons?.length ? (
                                            <p className="text-text-muted text-sm">No seasons yet</p>
                                        ) : (
                                            league.seasons.map(s => (
                                                <SeasonCard key={s._id} season={s} fmt={fmt} daysUntil={daysUntil} isOpen={isOpen} />
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function SeasonCard({ season: s, fmt, daysUntil, isOpen }: {
    season: Season;
    fmt: (d: string) => string;
    daysUntil: (d: string) => number;
    isOpen: (s: Season) => boolean;
}) {
    const meta        = STATUS_META[s.status];
    const registrable = isOpen(s);
    const days        = daysUntil(s.registrationDeadline);

    return (
        <div className="flex items-center justify-between bg-white/3 border border-white/5 rounded-xl px-4 py-3 hover:border-white/10 transition-all">
            <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white text-sm font-bold">{s.name}</p>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${meta.cls}`}>
                        {meta.icon}{meta.label}
                    </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmt(s.startDate)} → {fmt(s.endDate)}</span>
                    {registrable && (
                        <span className="flex items-center gap-1 text-yellow-400">
                            <Clock className="w-3 h-3" />
                            {days === 0 ? 'Deadline today!' : `${days}d to register`}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                {registrable && (
                    <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-xs font-bold transition-colors"
                        onClick={() => alert(`Registration for "${s.name}" — use the Teams page in Admin or your team registration API.`)}>
                        <Users className="w-3.5 h-3.5" /> Register Team
                    </button>
                )}
            </div>
        </div>
    );
}
