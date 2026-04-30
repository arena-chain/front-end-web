import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Loader2, RefreshCw, Calendar, Play, CheckSquare,
    Clock, ChevronRight, LayoutGrid, AlignLeft,
    Zap, Trophy, Flag, AlertTriangle,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { leagueService, type League } from '../../../services/leagueService';
import { seasonService, type Season } from '../../../services/seasonService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtShort = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—';

const daysUntil = (d: string) =>
    Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);

const daysSince = (d: string) =>
    Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);

const totalDays = (s: string, e: string) =>
    Math.max(1, Math.ceil((new Date(e).getTime() - new Date(s).getTime()) / 86_400_000));

const progress = (s: Season) => {
    if (s.status === 'PLANNED')  return 0;
    if (s.status === 'FINISHED') return 100;
    const pct = (daysSince(s.startDate) / totalDays(s.startDate, s.endDate)) * 100;
    return Math.min(100, Math.max(0, pct));
};

const regDeadlinePassed = (s: Season) =>
    s.registrationDeadline && new Date(s.registrationDeadline) < new Date();

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS = {
    ONGOING:  { label: 'Live',      color: 'text-green-400',  bg: 'bg-green-500/15', border: 'border-green-500/25', bar: '#22c55e', glow: 'rgba(34,197,94,0.4)',  icon: <Play size={12} /> },
    PLANNED:  { label: 'Upcoming',  color: 'text-blue-400',   bg: 'bg-blue-500/15',  border: 'border-blue-500/25',  bar: '#3b82f6', glow: 'rgba(59,130,246,0.3)', icon: <Clock size={12} /> },
    FINISHED: { label: 'Finished',  color: 'text-white/40',   bg: 'bg-white/5',      border: 'border-white/10',     bar: '#6b7280', glow: 'rgba(107,114,128,0.2)', icon: <CheckSquare size={12} /> },
};

// ─── Enriched season ──────────────────────────────────────────────────────────

interface EnrichedSeason extends Season {
    leagueName: string;
    leagueLevel: string;
    pct: number;
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ pct, status, animated }: { pct: number; status: string; animated?: boolean }) {
    const cfg = STATUS[status as keyof typeof STATUS] ?? STATUS.PLANNED;
    return (
        <div className="relative h-2 bg-white/8 rounded-full overflow-hidden">
            <div
                className={cn('h-full rounded-full transition-all duration-1000', animated && status === 'ONGOING' && 'relative overflow-hidden')}
                style={{ width: `${pct}%`, background: cfg.bar, boxShadow: `0 0 8px ${cfg.glow}` }}
            >
                {animated && status === 'ONGOING' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        style={{ animation: 'shimmer 2s infinite', backgroundSize: '200% 100%' }} />
                )}
            </div>
            {/* Milestone markers at 25%, 50%, 75% */}
            {[25, 50, 75].map(m => (
                <div key={m} className="absolute top-0 bottom-0 w-px bg-white/10" style={{ left: `${m}%` }} />
            ))}
        </div>
    );
}

// ─── Season card ─────────────────────────────────────────────────────────────

function SeasonCard({ s, onGoTo }: { s: EnrichedSeason; onGoTo: () => void }) {
    const cfg = STATUS[s.status] ?? STATUS.PLANNED;
    const pct = s.pct;
    const regPassed = regDeadlinePassed(s);

    return (
        <div className={cn(
            'rounded-2xl border p-4 transition-all hover:border-white/20 group',
            'bg-surface/60', cfg.border,
        )}
            style={s.status === 'ONGOING' ? { boxShadow: `0 0 24px -8px ${cfg.glow}` } : undefined}
        >
            {/* Top row */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={cn('flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border', cfg.bg, cfg.border, cfg.color)}>
                            {cfg.icon} {cfg.label}
                        </span>
                        <span className="text-[9px] text-text-muted uppercase tracking-widest font-semibold">
                            {s.leagueLevel}
                        </span>
                    </div>
                    <p className="text-white font-bold text-sm leading-tight truncate">{s.name}</p>
                    <p className="text-text-muted text-[10px] flex items-center gap-1 mt-0.5">
                        <Trophy size={9} className="text-primary/60" />
                        {s.leagueName}
                    </p>
                </div>

                <button onClick={onGoTo}
                    className="shrink-0 p-1.5 rounded-lg border border-white/10 hover:bg-white/8 text-text-muted hover:text-white transition-all opacity-0 group-hover:opacity-100">
                    <ChevronRight size={14} />
                </button>
            </div>

            {/* Progress bar */}
            <div className="mb-2">
                <div className="flex justify-between text-[10px] text-text-muted mb-1.5">
                    <span>{fmtShort(s.startDate)}</span>
                    <span className={cn('font-bold', cfg.color)}>{Math.round(pct)}%</span>
                    <span>{fmtShort(s.endDate)}</span>
                </div>
                <ProgressBar pct={pct} status={s.status} animated />
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[10px] text-text-muted">
                {s.status === 'ONGOING' && (
                    <span className="text-green-400 font-bold flex items-center gap-1">
                        <Flag size={9} />
                        {Math.max(0, daysUntil(s.endDate))}d remaining
                    </span>
                )}
                {s.status === 'PLANNED' && (
                    <span className="text-blue-400 font-bold flex items-center gap-1">
                        <Clock size={9} />
                        Starts in {Math.max(0, daysUntil(s.startDate))}d
                    </span>
                )}
                {s.status === 'FINISHED' && (
                    <span className="flex items-center gap-1">
                        <CheckSquare size={9} />
                        Ended {daysSince(s.endDate)}d ago
                    </span>
                )}
                {s.registrationDeadline && s.status === 'PLANNED' && (
                    <span className={cn('flex items-center gap-1', regPassed ? 'text-red-400' : 'text-amber-400')}>
                        <AlertTriangle size={9} />
                        Reg. deadline {regPassed ? 'passed' : `in ${daysUntil(s.registrationDeadline)}d`}
                    </span>
                )}
                <span className="ml-auto">{fmt(s.startDate)} → {fmt(s.endDate)}</span>
            </div>
        </div>
    );
}

// ─── Gantt timeline ───────────────────────────────────────────────────────────

function GanttTimeline({ seasons }: { seasons: EnrichedSeason[] }) {
    if (!seasons.length) return null;

    const allDates = seasons.flatMap(s => [new Date(s.startDate), new Date(s.endDate)]);
    const minTs = Math.min(...allDates.map(d => d.getTime()));
    const maxTs = Math.max(...allDates.map(d => d.getTime()));
    // Add 5% padding on each side
    const span = maxTs - minTs;
    const padded = span * 0.05;
    const tMin = minTs - padded;
    const tMax = maxTs + padded;
    const totalSpan = tMax - tMin;

    const toLeft  = (d: string) => ((new Date(d).getTime() - tMin) / totalSpan) * 100;
    const toWidth = (s: string, e: string) =>
        Math.max(1.5, ((new Date(e).getTime() - new Date(s).getTime()) / totalSpan) * 100);

    // Build month markers
    const months: { label: string; left: number }[] = [];
    const cursor = new Date(tMin);
    cursor.setDate(1);
    while (cursor.getTime() < tMax) {
        const left = ((cursor.getTime() - tMin) / totalSpan) * 100;
        if (left >= 0 && left <= 100) {
            months.push({ label: cursor.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }), left });
        }
        cursor.setMonth(cursor.getMonth() + 1);
    }

    // Today marker
    const todayLeft = ((Date.now() - tMin) / totalSpan) * 100;

    return (
        <div className="rounded-2xl border border-white/8 bg-surface/60 p-5 overflow-x-auto">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4">Timeline</p>

            {/* Month axis */}
            <div className="relative h-5 mb-1">
                {months.map(m => (
                    <div key={m.label + m.left} className="absolute text-[9px] text-white/25 uppercase tracking-widest -translate-x-1/2"
                        style={{ left: `${m.left}%` }}>
                        {m.label}
                    </div>
                ))}
            </div>

            {/* Grid lines + rows */}
            <div className="relative" style={{ minWidth: 600 }}>
                {/* Vertical grid */}
                {months.map(m => (
                    <div key={m.label + m.left + 'g'} className="absolute top-0 bottom-0 w-px bg-white/5"
                        style={{ left: `${m.left}%` }} />
                ))}

                {/* Today line */}
                {todayLeft >= 0 && todayLeft <= 100 && (
                    <div className="absolute top-0 bottom-0 w-px bg-green-500/60 z-10"
                        style={{ left: `${todayLeft}%` }}>
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] font-black text-green-400 whitespace-nowrap">TODAY</div>
                    </div>
                )}

                {/* Season rows */}
                <div className="space-y-2 pt-3">
                    {seasons.map(s => {
                        const cfg = STATUS[s.status] ?? STATUS.PLANNED;
                        const left  = toLeft(s.startDate);
                        const width = toWidth(s.startDate, s.endDate);
                        return (
                            <div key={s._id} className="relative h-8 flex items-center">
                                {/* League label */}
                                <div className="absolute right-[calc(100%+8px)] text-right w-32 hidden xl:block">
                                    <p className="text-[9px] text-text-muted truncate">{s.leagueName}</p>
                                    <p className="text-[9px] text-white/50 truncate">{s.name}</p>
                                </div>

                                {/* Bar */}
                                <div className="absolute h-6 rounded-full flex items-center overflow-hidden group/bar cursor-default transition-all hover:h-7"
                                    style={{
                                        left: `${left}%`,
                                        width: `${width}%`,
                                        background: cfg.bar,
                                        opacity: s.status === 'FINISHED' ? 0.4 : 0.85,
                                        boxShadow: s.status === 'ONGOING' ? `0 0 12px -2px ${cfg.glow}` : undefined,
                                        minWidth: 40,
                                    }}>
                                    {/* Progress fill overlay */}
                                    {s.status === 'ONGOING' && (
                                        <div className="absolute inset-0 bg-black/30 rounded-full"
                                            style={{ left: `${s.pct}%` }} />
                                    )}
                                    <span className="px-2 text-[9px] font-black text-white/90 truncate z-10 relative">
                                        {s.name}
                                    </span>
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/90 border border-white/15 rounded-xl p-2 text-[9px] text-white whitespace-nowrap opacity-0 group-hover/bar:opacity-100 transition-opacity z-20 pointer-events-none shadow-2xl">
                                        <p className="font-black text-[10px] mb-0.5">{s.name}</p>
                                        <p className="text-text-muted">{s.leagueName}</p>
                                        <p className="mt-1">{fmt(s.startDate)} → {fmt(s.endDate)}</p>
                                        <p className={cn('mt-0.5 font-bold', cfg.color)}>{cfg.label} · {Math.round(s.pct)}%</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProgressionPage() {
    const navigate = useNavigate();
    const [seasons, setSeasons] = useState<EnrichedSeason[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'board' | 'timeline'>('board');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONGOING' | 'PLANNED' | 'FINISHED'>('ALL');

    const load = async () => {
        setLoading(true);
        try {
            const leagues: League[] = await leagueService.getAllLeagues();
            const allSeasons: EnrichedSeason[] = [];
            await Promise.all(
                leagues.map(async (l) => {
                    try {
                        const sns: Season[] = await seasonService.getByLeague(l._id);
                        sns.forEach(s => allSeasons.push({
                            ...s,
                            leagueName: l.name,
                            leagueLevel: l.level,
                            pct: progress(s),
                        }));
                    } catch { /* skip leagues with no seasons */ }
                })
            );
            // Sort: ONGOING first, then PLANNED by start, then FINISHED by end desc
            allSeasons.sort((a, b) => {
                const order = { ONGOING: 0, PLANNED: 1, FINISHED: 2 };
                if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
                if (a.status === 'PLANNED')  return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
                if (a.status === 'FINISHED') return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
                return 0;
            });
            setSeasons(allSeasons);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const filtered = statusFilter === 'ALL' ? seasons : seasons.filter(s => s.status === statusFilter);

    const live      = seasons.filter(s => s.status === 'ONGOING');
    const upcoming  = seasons.filter(s => s.status === 'PLANNED');
    const finished  = seasons.filter(s => s.status === 'FINISHED');

    return (
        <div className="space-y-6 max-w-5xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                        <span>League Hub</span><ChevronRight size={12} />
                        <span className="text-white font-semibold">Progression</span>
                    </div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <Zap size={24} className="text-green-400" />
                        Season Progression
                    </h1>
                    <p className="text-text-muted text-sm mt-1">
                        Live and upcoming seasons across all leagues — running in parallel.
                    </p>
                </div>
                <button onClick={load} className="p-2 rounded-xl border border-white/10 hover:bg-white/5 text-text-muted hover:text-white transition-all shrink-0">
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Live Now', val: live.length, color: 'text-green-400', border: 'border-green-500/20', bg: 'bg-green-500/8', dot: 'bg-green-400 animate-ping' },
                    { label: 'Upcoming', val: upcoming.length, color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/8', dot: 'bg-blue-400' },
                    { label: 'Finished', val: finished.length, color: 'text-white/40', border: 'border-white/10', bg: 'bg-white/3', dot: 'bg-white/20' },
                ].map(s => (
                    <div key={s.label} className={cn('rounded-2xl border p-4 flex items-center gap-4', s.border, s.bg)}>
                        <div className="relative shrink-0">
                            <div className={cn('w-3 h-3 rounded-full', s.dot)} />
                            {s.dot.includes('ping') && <div className={cn('absolute inset-0 rounded-full opacity-60', s.dot.replace('animate-ping',''))} />}
                        </div>
                        <div>
                            <p className={cn('text-2xl font-black', s.color)}>{s.val}</p>
                            <p className="text-text-muted text-[10px] uppercase tracking-widest">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* View toggle + filter */}
            <div className="flex items-center gap-3 flex-wrap">
                {/* Status filter */}
                <div className="flex items-center bg-surface border border-white/8 rounded-xl p-1 gap-1">
                    {(['ALL', 'ONGOING', 'PLANNED', 'FINISHED'] as const).map(f => (
                        <button key={f} onClick={() => setStatusFilter(f)}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                                statusFilter === f
                                    ? 'bg-white/10 text-white'
                                    : 'text-text-muted hover:text-white',
                            )}>
                            {f === 'ALL' ? 'All' : STATUS[f as keyof typeof STATUS].label}
                            {f !== 'ALL' && (
                                <span className="ml-1.5 text-[9px] opacity-60">
                                    {f === 'ONGOING' ? live.length : f === 'PLANNED' ? upcoming.length : finished.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="ml-auto flex items-center bg-surface border border-white/8 rounded-xl p-1 gap-1">
                    {([
                        { id: 'board', icon: <LayoutGrid size={14} /> },
                        { id: 'timeline', icon: <AlignLeft size={14} /> },
                    ] as const).map(v => (
                        <button key={v.id} onClick={() => setView(v.id)}
                            className={cn(
                                'p-2 rounded-lg transition-all',
                                view === v.id ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white',
                            )}>
                            {v.icon}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 size={32} className="animate-spin text-green-400" />
                </div>
            ) : seasons.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Calendar size={44} className="text-text-muted mb-4 opacity-40" />
                    <p className="text-text-muted font-semibold text-lg">No seasons created yet</p>
                    <p className="text-text-muted text-sm mt-1 mb-5">Create leagues and seasons first to see their progression here.</p>
                    <button onClick={() => navigate('/admin/leagues/seasons')}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-black bg-green-400 hover:bg-green-300 transition-all">
                        <Calendar size={16} /> Go to Seasons
                    </button>
                </div>
            ) : view === 'timeline' ? (
                <GanttTimeline seasons={filtered} />
            ) : (
                <div className="space-y-6">

                    {/* Live now */}
                    {(statusFilter === 'ALL' || statusFilter === 'ONGOING') && live.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="relative">
                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-ping absolute" />
                                    <div className="w-2 h-2 rounded-full bg-green-400" />
                                </div>
                                <h2 className="text-sm font-black text-green-400 uppercase tracking-widest">
                                    Live Now — {live.length} season{live.length > 1 ? 's' : ''} running
                                    {live.length > 1 && <span className="text-green-400/60 ml-2 font-normal normal-case">in parallel</span>}
                                </h2>
                            </div>
                            <div className="grid md:grid-cols-2 gap-3">
                                {live.map(s => (
                                    <SeasonCard key={s._id} s={s} onGoTo={() => navigate('/admin/leagues/seasons')} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Parallel running notice */}
                    {statusFilter === 'ALL' && live.length > 1 && (
                        <div className="flex items-start gap-3 bg-green-500/8 border border-green-500/20 rounded-2xl px-4 py-3 text-sm text-green-300">
                            <Zap size={16} className="shrink-0 mt-0.5" />
                            <span>
                                <strong>{live.length} seasons</strong> are currently running in parallel across different leagues.
                                Standings are updated independently per season.
                            </span>
                        </div>
                    )}

                    {/* Upcoming */}
                    {(statusFilter === 'ALL' || statusFilter === 'PLANNED') && upcoming.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <Clock size={14} className="text-blue-400" />
                                <h2 className="text-sm font-black text-blue-400 uppercase tracking-widest">
                                    Upcoming — {upcoming.length} scheduled
                                </h2>
                            </div>
                            <div className="grid md:grid-cols-2 gap-3">
                                {upcoming.map(s => (
                                    <SeasonCard key={s._id} s={s} onGoTo={() => navigate('/admin/leagues/seasons')} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Finished */}
                    {(statusFilter === 'ALL' || statusFilter === 'FINISHED') && finished.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <CheckSquare size={14} className="text-white/40" />
                                <h2 className="text-sm font-black text-white/40 uppercase tracking-widest">
                                    Completed — {finished.length}
                                </h2>
                            </div>
                            <div className="grid md:grid-cols-2 gap-3 opacity-60 hover:opacity-100 transition-opacity">
                                {finished.map(s => (
                                    <SeasonCard key={s._id} s={s} onGoTo={() => navigate('/admin/leagues/seasons')} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}
