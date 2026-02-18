import { useState, useEffect } from 'react';
import { Search, Calendar, Trophy, Users, Video, Zap, ChevronRight, Shield, Clock } from 'lucide-react';
import type { Tournament } from '../../models/tournament';
import tournamentService from '../../services/tournamentService';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; color: string; bg: string; border: string; dot?: boolean }> = {
    ONGOING:           { label: 'LIVE',         color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   dot: true },
    OPEN_REGISTRATION: { label: 'REGISTERING',  color: '#00ff00', bg: 'rgba(0,255,0,0.1)',      border: 'rgba(0,255,0,0.25)'         },
    UPCOMING:          { label: 'UPCOMING',     color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.25)'      },
    COMPLETED:         { label: 'ENDED',        color: '#ffffff33', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)'    },
};

const STATUS_TABS = [
    { value: 'all',               label: 'All',          icon: <Shield size={12} /> },
    { value: 'ONGOING',           label: 'Live',         icon: <Video size={12} />  },
    { value: 'OPEN_REGISTRATION', label: 'Open',         icon: <Zap size={12} />    },
    { value: 'UPCOMING',          label: 'Upcoming',     icon: <Clock size={12} />  },
    { value: 'COMPLETED',         label: 'Ended',        icon: <Trophy size={12} /> },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PlayerTournaments() {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        tournamentService.fetchTournaments()
            .then(data => setTournaments(data.filter((t: Tournament) => t.status !== 'DRAFT')))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filtered = tournaments.filter(t => {
        const gameTitle = typeof t.gameId === 'object' ? (t.gameId as any)?.title ?? '' : '';
        const matchSearch  = t.name.toLowerCase().includes(search.toLowerCase()) || gameTitle.toLowerCase().includes(search.toLowerCase());
        const matchStatus  = statusFilter === 'all' || t.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const liveCount = tournaments.filter(t => t.status === 'ONGOING').length;
    const openCount = tournaments.filter(t => t.status === 'OPEN_REGISTRATION').length;

    return (
        <div className="flex flex-col gap-5 h-full overflow-y-auto animate-fade-in-up">

            {/* ── Hero header ───────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-3xl shrink-0"
                style={{ background: 'linear-gradient(135deg, #050505 0%, #0a0d1a 60%, #050505 100%)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {/* Grid pattern */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.035]" style={{
                    backgroundImage: 'linear-gradient(rgba(59,130,246,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.6) 1px, transparent 1px)',
                    backgroundSize: '36px 36px',
                }} />
                <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full blur-[100px] pointer-events-none" style={{ background: 'rgba(59,130,246,0.07)' }} />

                <div className="relative px-7 py-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            {liveCount > 0 && (
                                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full"
                                    style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    {liveCount} Live now
                                </span>
                            )}
                            {openCount > 0 && (
                                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full"
                                    style={{ color: '#00ff00', background: 'rgba(0,255,0,0.08)', border: '1px solid rgba(0,255,0,0.2)' }}>
                                    <Zap size={10} />
                                    {openCount} Open
                                </span>
                            )}
                        </div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-white leading-none">
                            Tournaments
                        </h1>
                        <p className="text-sm text-white/35 font-medium mt-2">
                            Compete, climb the bracket, and claim your prize.
                        </p>
                    </div>

                    {/* Quick stats */}
                    <div className="flex gap-3 shrink-0">
                        {[
                            { label: 'Total',    value: tournaments.length,  color: '#3b82f6' },
                            { label: 'Live',     value: liveCount,           color: '#ef4444' },
                            { label: 'Open',     value: openCount,           color: '#00ff00' },
                        ].map(s => (
                            <div key={s.label} className="flex flex-col items-center justify-center px-4 py-3 rounded-2xl"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <span className="text-2xl font-black leading-none" style={{ color: s.color }}>{s.value}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Filter bar ────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                {/* Search */}
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.25)' }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search tournaments or games…"
                        className="w-full rounded-2xl pl-9 pr-4 py-3 text-sm font-medium text-white placeholder-white/20 outline-none transition-colors"
                        style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)' }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
                    />
                </div>

                {/* Status tabs */}
                <div className="flex gap-1.5 p-1.5 rounded-2xl shrink-0" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {STATUS_TABS.map(tab => {
                        const sc = STATUS[tab.value];
                        const active = statusFilter === tab.value;
                        return (
                            <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200"
                                style={{
                                    background: active ? (sc?.bg ?? 'rgba(255,255,255,0.08)') : 'transparent',
                                    color: active ? (sc?.color ?? '#ffffff') : 'rgba(255,255,255,0.3)',
                                    border: active ? `1px solid ${sc?.border ?? 'rgba(255,255,255,0.15)'}` : '1px solid transparent',
                                }}>
                                {tab.icon}
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Grid ──────────────────────────────────────────────────── */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="rounded-3xl overflow-hidden animate-pulse" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.05)', height: 320 }}>
                            <div className="h-48" style={{ background: 'rgba(255,255,255,0.03)' }} />
                            <div className="p-5 space-y-3">
                                <div className="h-3 rounded-lg w-20" style={{ background: 'rgba(255,255,255,0.05)' }} />
                                <div className="h-4 rounded-lg w-40" style={{ background: 'rgba(255,255,255,0.07)' }} />
                                <div className="h-3 rounded-lg w-32" style={{ background: 'rgba(255,255,255,0.04)' }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
                    {filtered.map((t, i) => (
                        <TournamentCard key={t._id} tournament={t} featured={i === 0 && statusFilter === 'all' && !search}
                            onClick={() => navigate(`/player/tournaments/${t._id}`)} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 gap-4" style={{ color: 'rgba(255,255,255,0.15)' }}>
                    <Trophy size={48} />
                    <div className="text-center">
                        <p className="text-sm font-black uppercase tracking-widest">No tournaments found</p>
                        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.1)' }}>Try changing your filters</p>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Tournament Card ──────────────────────────────────────────────────────────

function TournamentCard({ tournament, onClick, featured }: { tournament: Tournament; onClick: () => void; featured?: boolean }) {
    const [hovered, setHovered] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const imgUrl = (() => {
        const url = tournament.bannerImageUrl;
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${API_URL}/${url.startsWith('/') ? url.slice(1) : url}`;
    })();

    const gameTitle = typeof tournament.gameId === 'object' ? (tournament.gameId as any)?.title ?? 'Game' : 'Game';
    const sc = STATUS[tournament.status] ?? STATUS.UPCOMING;
    const fill = tournament.maxTeams > 0 ? (tournament.currentTeams / tournament.maxTeams) * 100 : 0;
    const isLive = tournament.status === 'ONGOING';

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={cn("relative rounded-3xl overflow-hidden cursor-pointer flex flex-col transition-all duration-300", featured && "md:col-span-2 xl:col-span-1")}
            style={{
                background: '#0d0d0d',
                border: `1px solid ${hovered ? (isLive ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.14)') : 'rgba(255,255,255,0.07)'}`,
                boxShadow: hovered ? (isLive ? '0 0 30px rgba(239,68,68,0.1)' : '0 0 30px rgba(255,255,255,0.04)') : 'none',
                transform: hovered ? 'translateY(-2px)' : 'none',
            }}
        >
            {/* Banner */}
            <div className="relative overflow-hidden" style={{ height: 180 }}>
                {imgUrl ? (
                    <img src={imgUrl} alt={tournament.name}
                        className="w-full h-full object-cover transition-transform duration-700"
                        style={{ transform: hovered ? 'scale(1.06)' : 'scale(1)' }} />
                ) : (
                    /* Gradient placeholder */
                    <div className="w-full h-full" style={{
                        background: isLive
                            ? 'linear-gradient(135deg, #1a0505 0%, #2d0808 50%, #1a0505 100%)'
                            : 'linear-gradient(135deg, #050a1a 0%, #0a1030 50%, #050a1a 100%)',
                    }}>
                        <div className="w-full h-full flex items-center justify-center opacity-10">
                            <Trophy size={64} style={{ color: isLive ? '#ef4444' : '#3b82f6' }} />
                        </div>
                    </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0" style={{
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(13,13,13,0.7) 70%, #0d0d0d 100%)',
                }} />

                {/* Top badges */}
                <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                    {/* Status */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-sm"
                        style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color }}>
                        {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />}
                        {sc.label}
                    </div>

                    {/* Game tag */}
                    <div className="px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-sm"
                        style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                        {gameTitle}
                    </div>
                </div>

                {/* Bottom-left: format badge */}
                {tournament.format && (
                    <div className="absolute bottom-3 left-3">
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg"
                            style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            {tournament.format.replace(/_/g, ' ')}
                        </span>
                    </div>
                )}
            </div>

            {/* Card body */}
            <div className="flex flex-col flex-1 p-5">
                <h3 className="text-base font-black text-white uppercase tracking-tight mb-3 leading-tight transition-colors"
                    style={{ color: hovered ? '#ffffff' : 'rgba(255,255,255,0.9)' }}>
                    {tournament.name}
                </h3>

                {/* Stats row */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        <Calendar size={11} />
                        <span>{new Date(tournament.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.12)' }}>·</span>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        <Users size={11} />
                        <span>{tournament.currentTeams} / {tournament.maxTeams} teams</span>
                    </div>
                </div>

                {/* Teams fill bar */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>
                            Registration
                        </span>
                        <span className="text-[9px] font-black" style={{ color: fill >= 80 ? '#ef4444' : 'rgba(255,255,255,0.25)' }}>
                            {Math.round(fill)}%
                        </span>
                    </div>
                    <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${fill}%`,
                                background: fill >= 80
                                    ? 'linear-gradient(90deg, #ef4444, #f97316)'
                                    : isLive
                                        ? '#ef4444'
                                        : 'linear-gradient(90deg, #3b82f6, #00ff00)',
                                boxShadow: fill > 0 ? `0 0 8px ${isLive ? 'rgba(239,68,68,0.5)' : 'rgba(59,130,246,0.4)'}` : 'none',
                            }} />
                    </div>
                </div>

                {/* CTA */}
                <button
                    className="mt-auto w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-200"
                    style={{
                        background: isLive
                            ? hovered ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)'
                            : tournament.status === 'OPEN_REGISTRATION'
                                ? hovered ? 'rgba(0,255,0,0.15)' : 'rgba(0,255,0,0.08)'
                                : 'rgba(255,255,255,0.04)',
                        border: isLive
                            ? '1px solid rgba(239,68,68,0.3)'
                            : tournament.status === 'OPEN_REGISTRATION'
                                ? '1px solid rgba(0,255,0,0.2)'
                                : '1px solid rgba(255,255,255,0.07)',
                        color: isLive ? '#ef4444' : tournament.status === 'OPEN_REGISTRATION' ? '#00ff00' : 'rgba(255,255,255,0.4)',
                    }}
                >
                    {isLive ? (
                        <><Video size={12} /> Watch Live</>
                    ) : tournament.status === 'OPEN_REGISTRATION' ? (
                        <><Zap size={12} /> Register Now</>
                    ) : (
                        <>View Details <ChevronRight size={12} /></>
                    )}
                </button>
            </div>
        </div>
    );
}
