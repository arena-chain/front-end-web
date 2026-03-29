import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Trophy, Users, Globe, Calendar, Loader2,
    User, Swords, Crown, Star, ChevronRight,
    TrendingUp, Clock, Shield,
    ChevronLeft, Video, Play, Eye, Layers,
    LayoutList, GitBranch, Shuffle, Grid2X2,
} from 'lucide-react';
import { leagueService, type League, type LeagueParticipant } from '../../services/leagueService';
import { seasonService, type Season } from '../../services/seasonService';
import { stageService, type Stage, type StageType, type StageStatus } from '../../services/stageService';
import { cn } from '../../lib/utils';


// ─── Types ────────────────────────────────────────────────────────────────────

/** The API returns these extra fields even though the base League type doesn't declare them */
type LeagueFull = League & {
    startDate?: string;
    endDate?: string;
    status?: string;
    format?: string;
    maxTeams?: number;
};

type MatchStatus = 'LIVE' | 'UPCOMING' | 'FINISHED';
interface MockMatch {
    id: string;
    teamA: string; teamB: string;
    scoreA?: number; scoreB?: number;
    date: Date;
    status: MatchStatus;
    round: string;
}

// ─── Generate mock matches from league date range ─────────────────────────────

function generateMatches(league: LeagueFull): MockMatch[] {
    const names = ['ShadowBlade', 'NeonPhoenix', 'VoidHunter', 'CyberWolf',
        'IronFalcon', 'StormRider', 'GhostSniper', 'BlazeRunner'];
    const start = new Date(league.startDate || Date.now());
    const end = new Date(league.endDate || Date.now());
    const now = new Date();
    const span = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000));
    const matches: MockMatch[] = [];
    const rounds = ['Round of 16', 'Quarterfinals', 'Semifinals', 'Grand Final'];

    for (let i = 0; i < 12; i++) {
        const dayOffset = Math.floor((i / 12) * span);
        const matchDate = new Date(start);
        matchDate.setDate(start.getDate() + dayOffset);
        matchDate.setHours(14 + (i % 4) * 2, i % 2 === 0 ? 0 : 30, 0, 0);

        const diffMs = matchDate.getTime() - now.getTime();
        const status: MatchStatus =
            Math.abs(diffMs) < 90 * 60 * 1000 ? 'LIVE' :
                diffMs < 0 ? 'FINISHED' : 'UPCOMING';

        matches.push({
            id: `${league._id}-m${i}`,
            teamA: names[i % names.length],
            teamB: names[(i + 3) % names.length],
            scoreA: status === 'FINISHED' ? Math.floor(Math.random() * 10) + 5 : undefined,
            scoreB: status === 'FINISHED' ? Math.floor(Math.random() * 10) + 3 : undefined,
            date: matchDate,
            status,
            round: rounds[Math.min(Math.floor(i / 3), rounds.length - 1)],
        });
    }
    return matches;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const levelColors: Record<string, { pill: string; glow: string; accent: string }> = {
    INTERNATIONAL: { pill: 'bg-purple-500/15 text-purple-300 border-purple-500/30', glow: 'shadow-[0_0_40px_rgba(168,85,247,0.12)]', accent: '#a855f7' },
    CONTINENTAL: { pill: 'bg-blue-500/15 text-blue-300 border-blue-500/30', glow: 'shadow-[0_0_40px_rgba(59,130,246,0.12)]', accent: '#3b82f6' },
    NATIONAL: { pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', glow: 'shadow-[0_0_40px_rgba(16,185,129,0.12)]', accent: '#10b981' },
    REGIONAL: { pill: 'bg-orange-500/15 text-orange-300 border-orange-500/30', glow: 'shadow-[0_0_40px_rgba(249,115,22,0.12)]', accent: '#f97316' },
};
const statusConfig: Record<string, { label: string; dot: string; text: string }> = {
    REGISTRATION: { label: 'Registration Open', dot: 'bg-blue-400', text: 'text-blue-400' },
    ONGOING: { label: 'Live', dot: 'bg-green-400 animate-pulse', text: 'text-green-400' },
    FINISHED: { label: 'Finished', dot: 'bg-white/30', text: 'text-white/40' },
};
const positionStyles = [
    { border: 'border-yellow-500/35', bg: 'bg-gradient-to-r from-yellow-500/8 to-transparent', badge: 'bg-yellow-500 text-black shadow-[0_0_12px_rgba(234,179,8,0.4)]', avatar: 'border-yellow-500/40 bg-yellow-500/10', pts: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' },
    { border: 'border-slate-400/35', bg: 'bg-gradient-to-r from-slate-400/8 to-transparent', badge: 'bg-slate-300 text-black shadow-[0_0_10px_rgba(203,213,225,0.3)]', avatar: 'border-slate-400/40 bg-slate-400/10', pts: 'bg-slate-400/10 text-slate-300 border-slate-400/25' },
    { border: 'border-orange-600/35', bg: 'bg-gradient-to-r from-orange-600/8 to-transparent', badge: 'bg-orange-600 text-white shadow-[0_0_10px_rgba(234,88,12,0.3)]', avatar: 'border-orange-600/40 bg-orange-600/10', pts: 'bg-orange-600/10 text-orange-400 border-orange-600/25' },
];
const defaultPS = { border: 'border-white/[0.05]', bg: '', badge: 'bg-white/8 text-white/40', avatar: 'border-white/10 bg-white/5', pts: 'bg-primary/10 text-primary border-primary/20' };

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PlayerLeagues() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [leagues, setLeagues] = useState<LeagueFull[]>([]);
    const [selectedLeague, setSelectedLeague] = useState<LeagueFull | null>(null);
    const [standings, setStandings] = useState<LeagueParticipant[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [standingsLoading, setStandingsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'live' | 'standings' | 'calendar' | 'seasons'>('live');

    // Seasons + stages state
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [seasonsLoading, setSeasonsLoading] = useState(false);
    const [stageCache, setStageCache] = useState<Record<string, Stage[] | 'loading'>>({});

    // Calendar state
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [selectedMatch, setSelectedMatch] = useState<MockMatch | null>(null);

    useEffect(() => {
        leagueService.getAllLeagues()
            .then((data: LeagueFull[]) => {
                setLeagues(data);
                const target = id ? data.find((l: LeagueFull) => l._id === id) : data[0];
                if (target) setSelectedLeague(target);
            })
            .catch(console.error)
            .finally(() => setPageLoading(false));
    }, []);

    useEffect(() => {
        if (!id || leagues.length === 0) return;
        const found = leagues.find(l => l._id === id);
        if (found) setSelectedLeague(found);
    }, [id, leagues]);

    useEffect(() => {
        if (!selectedLeague) return;
        setStandingsLoading(true);
        setStandings([]);
        setSelectedDay(null);
        setSelectedMatch(null);
        setSeasons([]);
        setStageCache({});
        leagueService.getLeagueStandings(selectedLeague._id)
            .then(setStandings)
            .catch(console.error)
            .finally(() => setStandingsLoading(false));
        // set calendar to league start month
        setCalendarDate(new Date((selectedLeague as LeagueFull).startDate || Date.now()));
        // load seasons for Seasons tab
        setSeasonsLoading(true);
        seasonService.getByLeague(selectedLeague._id)
            .then(setSeasons)
            .catch(console.error)
            .finally(() => setSeasonsLoading(false));
    }, [selectedLeague]);

    const matches = useMemo(() => selectedLeague ? generateMatches(selectedLeague) : [], [selectedLeague]);

    const lc = selectedLeague ? (levelColors[selectedLeague.level] ?? levelColors.REGIONAL) : levelColors.REGIONAL;
    const sc = selectedLeague ? (statusConfig[(selectedLeague as LeagueFull).status ?? ''] ?? statusConfig.FINISHED) : statusConfig.FINISHED;

    if (pageLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
    if (leagues.length === 0) return <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40"><Trophy className="w-16 h-16" /><p className="text-sm font-black uppercase tracking-widest">No leagues available</p></div>;

    return (
        <div className="flex gap-5 h-full min-h-0 animate-fade-in-up">

            {/* ── Left panel ─────────────────────────────────────────── */}
            <div className="w-64 shrink-0 flex flex-col gap-3 overflow-hidden">
                <div className="flex items-center gap-2 px-1">
                    <Trophy className="w-4 h-4 text-primary" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-text-muted">All Leagues</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                    {leagues.map(league => {
                        const lci = levelColors[league.level] ?? levelColors.REGIONAL;
                        const sci = statusConfig[(league as LeagueFull).status ?? ''] ?? statusConfig.FINISHED;
                        const isSelected = selectedLeague?._id === league._id;
                        return (
                            <button key={league._id} onClick={() => navigate(`/player/leagues/${league._id}`)}
                                className={cn("w-full text-left px-4 py-3.5 rounded-2xl border transition-all duration-200 group",
                                    isSelected ? `border-white/15 bg-white/[0.05] ${lci.glow}` : "border-white/[0.05] hover:bg-white/[0.03] hover:border-white/10"
                                )}>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <span className={cn("font-black text-sm uppercase tracking-tight leading-tight", isSelected ? "text-white" : "text-white/70 group-hover:text-white transition-colors")}>{league.name}</span>
                                    <ChevronRight size={14} className={cn("mt-0.5 shrink-0 transition-all", isSelected ? "text-primary opacity-100" : "text-white/20 opacity-0 group-hover:opacity-100")} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest", lci.pill)}>{league.level}</span>
                                    <span className="flex items-center gap-1">
                                        <span className={cn("w-1.5 h-1.5 rounded-full", sci.dot)} />
                                        <span className={cn("text-[9px] font-bold uppercase tracking-widest", sci.text)}>{sci.label}</span>
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Right panel ────────────────────────────────────────── */}
            {selectedLeague ? (
                <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden">

                    {/* Hero header */}
                    <div className={cn("relative overflow-hidden rounded-3xl border border-white/10 p-6", lc.glow)} style={{ background: '#0f0f10' }}>
                        <div className="absolute inset-0 opacity-[0.04]" style={{ background: `radial-gradient(ellipse at top left, ${lc.accent} 0%, transparent 60%)` }} />
                        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center border shrink-0 bg-white/5 border-white/10" style={{ boxShadow: `0 0 20px ${lc.accent}22` }}>
                                    <Trophy className="w-7 h-7" style={{ color: lc.accent }} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                        <h1 className="text-2xl font-black uppercase tracking-tighter text-white leading-none">{selectedLeague.name}</h1>
                                        <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-widest", lc.pill)}>{selectedLeague.level}</span>
                                    </div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                                            <span className={cn("w-2 h-2 rounded-full", sc.dot)} />
                                            <span className={cn("text-[10px] font-black uppercase tracking-widest", sc.text)}>{sc.label}</span>
                                        </div>
                                        <StatPill icon={<Users size={11} />} label="Format" value={(selectedLeague as LeagueFull).format ?? '—'} />
                                        <StatPill icon={<Shield size={11} />} label="Max Teams" value={`${(selectedLeague as LeagueFull).maxTeams ?? '—'}`} />
                                        <StatPill icon={<Calendar size={11} />} label="Dates" value={`${(selectedLeague as LeagueFull).startDate ? new Date((selectedLeague as LeagueFull).startDate!).toLocaleDateString() : '—'} – ${(selectedLeague as LeagueFull).endDate ? new Date((selectedLeague as LeagueFull).endDate!).toLocaleDateString() : '—'}`} />
                                    </div>
                                </div>
                            </div>
                            {/* Live match count */}
                            {matches.filter(m => m.status === 'LIVE').length > 0 && (
                                <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest"
                                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}>
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    {matches.filter(m => m.status === 'LIVE').length} Match{matches.filter(m => m.status === 'LIVE').length > 1 ? 'es' : ''} Live
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tab bar */}
                    <div className="flex gap-1 p-1 rounded-2xl shrink-0 self-start pb-0 overflow-x-auto" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {[
                            { key: 'live', label: 'Live Stream', icon: <Video size={13} /> },
                            { key: 'standings', label: 'Standings', icon: <TrendingUp size={13} /> },
                            { key: 'seasons', label: 'Seasons', icon: <Layers size={13} /> },
                            { key: 'calendar', label: 'Calendar', icon: <Calendar size={13} /> },
                        ].map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200"
                                style={{
                                    background: activeTab === tab.key ? lc.accent : 'transparent',
                                    color: activeTab === tab.key ? '#000' : 'rgba(255,255,255,0.35)',
                                    boxShadow: activeTab === tab.key ? `0 0 14px ${lc.accent}50` : 'none',
                                }}>
                                {tab.icon}{tab.label}
                            </button>
                        ))}
                    </div>

                    {/* ── SEASONS tab ──────────────────────────────── */}
                    {activeTab === 'seasons' && (
                        <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto">
                            {/* Header */}
                            <div className="flex items-center gap-3 px-1 shrink-0">
                                <Layers size={14} style={{ color: lc.accent }} />
                                <span className="font-black text-sm uppercase tracking-widest text-white">Seasons & Stages</span>
                                {seasons.length > 0 && <span className="text-[10px] font-black bg-white/5 border border-white/10 text-text-muted px-2 py-0.5 rounded-full uppercase tracking-widest">{seasons.length} season{seasons.length !== 1 ? 's' : ''}</span>}
                            </div>

                            {seasonsLoading ? (
                                <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-primary animate-spin" /></div>
                            ) : seasons.length === 0 ? (
                                <div className="flex flex-col items-center justify-center flex-1 gap-3" style={{ color: 'rgba(255,255,255,0.15)' }}>
                                    <Calendar size={36} />
                                    <p className="text-xs font-black uppercase tracking-widest">No seasons yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4 pb-2">
                                    {seasons.map(season => (
                                        <SeasonCard
                                            key={season._id}
                                            season={season}
                                            accent={lc.accent}
                                            stageCache={stageCache}
                                            setStageCache={setStageCache}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── LIVE STREAM tab ────────────────────────────── */}
                    {activeTab === 'live' && (
                        <div className="flex-1 flex flex-col min-h-0 animate-fade-in-up gap-4">
                            <div className="flex-1 rounded-3xl overflow-hidden relative group" style={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.1)' }}>
                                {/* Fake Video Player */}
                                <div className="absolute inset-0 bg-black/60 z-10 hidden group-hover:flex items-center justify-center transition-all backdrop-blur-sm cursor-pointer">
                                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 border border-red-500/30">
                                        <Play className="w-8 h-8 ml-1" />
                                    </div>
                                </div>
                                <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop"
                                    alt="Live Stream Thumbnail"
                                    className="w-full h-full object-cover opacity-80" />

                                {/* Live Badge Overlay */}
                                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-widest bg-red-500/90 text-white shadow-lg backdrop-blur-md">
                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                    LIVE
                                </div>

                                {/* Viewer Count */}
                                <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-black/50 text-white backdrop-blur-md border border-white/10">
                                    <Eye size={12} className="text-red-400" />
                                    24,591
                                </div>

                                {/* Bottom Info Bar */}
                                <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/90 to-transparent z-20 p-4 flex items-end justify-between">
                                    <div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">VCT EMEA STAGE 1 - WEEK 2</h3>
                                        <p className="text-sm font-medium text-white/60">Fnatic vs Karmine Corp • BO3</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors border border-white/10 backdrop-blur-md">
                                            Chat
                                        </button>
                                        <button className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition-colors shadow-lg">
                                            Follow Channel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STANDINGS tab ──────────────────────────────── */}
                    {activeTab === 'standings' && (
                        <div className="flex-1 bg-[#0f0f10] border border-white/[0.07] rounded-3xl overflow-hidden flex flex-col min-h-0">
                            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <TrendingUp size={15} style={{ color: lc.accent }} />
                                    <span className="font-black text-sm uppercase tracking-widest text-white">Standings</span>
                                    {standings.length > 0 && <span className="text-[10px] font-black bg-white/5 border border-white/10 text-text-muted px-2 py-0.5 rounded-full uppercase tracking-widest">{standings.length} participants</span>}
                                </div>
                            </div>
                            <div className="px-6 py-3 border-b border-white/[0.04] shrink-0">
                                <div className="grid grid-cols-[44px_1fr_52px_52px_52px_52px_68px] gap-2 items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/25 text-center">#</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/25">Team / Player</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/25 text-center">MP</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-green-500/50 text-center">W</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500/50 text-center">D</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-red-500/50 text-center">L</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-center" style={{ color: `${lc.accent}90` }}>PTS</span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
                                {standingsLoading ? (
                                    <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-primary animate-spin" /></div>
                                ) : standings.length > 0 ? standings.map((p, i) => {
                                    const isTeam = !!p.teamId && typeof p.teamId === 'object';
                                    const name = isTeam ? (p.teamId as any).name : (p.playerId?.nickname || 'Unknown');
                                    const avatar = isTeam ? (p.teamId as any).logo : (p.playerId?.avatar || null);
                                    const sub = isTeam ? 'Team' : (p.playerId?.email || '');
                                    const ps = positionStyles[i] ?? defaultPS;
                                    return (
                                        <div key={p._id} className={cn("grid grid-cols-[44px_1fr_52px_52px_52px_52px_68px] gap-2 items-center px-4 py-3.5 rounded-2xl border transition-all duration-200 group hover:border-white/10 hover:bg-white/[0.03]", ps.border, ps.bg)}>
                                            <div className="flex justify-center">
                                                <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0", ps.badge)}>
                                                    {i === 0 ? <Crown size={13} /> : i + 1}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center overflow-hidden shrink-0", ps.avatar)}>
                                                    {avatar ? <img src={avatar} className="w-full h-full object-cover" alt={name} /> : isTeam ? <Globe size={15} className="text-white/40" /> : <User size={15} className="text-white/40" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-white text-sm truncate group-hover:text-primary transition-colors">{name}</p>
                                                    <p className="text-[10px] text-white/30 uppercase font-bold tracking-tight truncate">{sub}</p>
                                                </div>
                                                {i < 3 && <Star size={11} className="shrink-0 ml-auto" style={{ color: i === 0 ? '#eab308' : i === 1 ? '#94a3b8' : '#ea580c' }} fill="currentColor" />}
                                            </div>
                                            <div className="text-center"><span className="text-sm font-bold text-white/40">{p.matchesPlayed ?? 0}</span></div>
                                            <div className="text-center"><span className={cn("text-sm font-black", (p.wins ?? 0) > 0 ? "text-green-400" : "text-white/25")}>{p.wins ?? 0}</span></div>
                                            <div className="text-center"><span className={cn("text-sm font-black", (p.draws ?? 0) > 0 ? "text-yellow-400" : "text-white/25")}>{p.draws ?? 0}</span></div>
                                            <div className="text-center"><span className={cn("text-sm font-black", (p.losses ?? 0) > 0 ? "text-red-400" : "text-white/25")}>{p.losses ?? 0}</span></div>
                                            <div className="flex justify-center">
                                                <div className={cn("min-w-[44px] px-2.5 py-1.5 rounded-xl font-black text-sm text-center border", ps.pts)}>{p.rankPoints ?? 0}</div>
                                            </div>
                                        </div>
                                    );
                                }) : Array.from({ length: (selectedLeague as LeagueFull).maxTeams || 8 }).map((_, i) => {
                                    const ps = positionStyles[i] ?? defaultPS;
                                    return (
                                        <div key={i} className={cn("grid grid-cols-[44px_1fr_52px_52px_52px_52px_68px] gap-2 items-center px-4 py-3.5 rounded-2xl border", i === 0 ? 'border-yellow-500/15 bg-yellow-500/[0.02]' : i === 1 ? 'border-slate-400/15' : i === 2 ? 'border-orange-600/15' : 'border-white/[0.04]')}>
                                            <div className="flex justify-center"><div className={cn("w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-black opacity-30", ps.badge)}>{i === 0 ? <Crown size={13} /> : i + 1}</div></div>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] shrink-0" />
                                                <div className="space-y-2 flex-1"><div className="h-2.5 bg-white/[0.06] rounded-lg w-32" /><div className="h-1.5 bg-white/[0.04] rounded-lg w-20" /></div>
                                            </div>
                                            {[...Array(4)].map((__, j) => <div key={j} className="flex justify-center"><div className="w-5 h-4 bg-white/[0.04] rounded" /></div>)}
                                            <div className="flex justify-center"><div className="w-10 h-7 bg-white/[0.04] rounded-xl" /></div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── CALENDAR tab ───────────────────────────────── */}
                    {activeTab === 'calendar' && (
                        <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
                            {/* Calendar grid */}
                            <div className="flex flex-col rounded-3xl overflow-hidden min-h-0" style={{ background: '#0f0f10', border: '1px solid rgba(255,255,255,0.07)', width: 340, flexShrink: 0 }}>
                                {/* Month nav */}
                                <div className="px-5 py-4 flex items-center justify-between border-b border-white/[0.06] shrink-0">
                                    <button onClick={() => setCalendarDate(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n; })}
                                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-white/5 text-white/40 hover:text-white">
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="font-black text-sm uppercase tracking-widest text-white">
                                        {MONTH_NAMES[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                                    </span>
                                    <button onClick={() => setCalendarDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n; })}
                                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-white/5 text-white/40 hover:text-white">
                                        <ChevronRight size={16} />
                                    </button>
                                </div>

                                {/* Day labels */}
                                <div className="grid grid-cols-7 px-3 pt-3 pb-1 shrink-0">
                                    {DAY_LABELS.map(d => (
                                        <div key={d} className="text-center text-[9px] font-black uppercase tracking-widest py-1" style={{ color: 'rgba(255,255,255,0.2)' }}>{d}</div>
                                    ))}
                                </div>

                                {/* Days grid */}
                                <CalendarGrid
                                    year={calendarDate.getFullYear()}
                                    month={calendarDate.getMonth()}
                                    matches={matches}
                                    selectedDay={selectedDay}
                                    onSelectDay={setSelectedDay}
                                    accent={lc.accent}
                                />

                                {/* Legend */}
                                <div className="px-5 py-4 border-t border-white/[0.05] flex items-center gap-4 shrink-0">
                                    {[
                                        { color: '#ef4444', label: 'Live' },
                                        { color: lc.accent, label: 'Upcoming' },
                                        { color: 'rgba(255,255,255,0.2)', label: 'Finished' },
                                    ].map(l => (
                                        <div key={l.label} className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>{l.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Match list */}
                            <div className="flex-1 flex flex-col rounded-3xl overflow-hidden min-h-0" style={{ background: '#0f0f10', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-3">
                                        <Swords size={15} style={{ color: lc.accent }} />
                                        <span className="font-black text-sm uppercase tracking-widest text-white">
                                            {selectedDay
                                                ? `${selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`
                                                : 'All Matches'}
                                        </span>
                                    </div>
                                    {selectedDay && (
                                        <button className="text-[10px] font-black uppercase tracking-widest transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.3)' }} onClick={() => setSelectedDay(null)}>
                                            Clear
                                        </button>
                                    )}
                                </div>

                                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                                    {(() => {
                                        const shown = selectedDay
                                            ? matches.filter(m => m.date.toDateString() === selectedDay.toDateString())
                                            : matches;

                                        if (shown.length === 0) return (
                                            <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: 'rgba(255,255,255,0.15)' }}>
                                                <Calendar size={36} />
                                                <p className="text-xs font-black uppercase tracking-widest">No matches {selectedDay ? 'on this day' : 'found'}</p>
                                            </div>
                                        );

                                        return shown.map(m => (
                                            <MatchCard key={m.id} match={m} accent={lc.accent}
                                                selected={selectedMatch?.id === m.id}
                                                onClick={() => setSelectedMatch(selectedMatch?.id === m.id ? null : m)} />
                                        ));
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/20">
                    <Trophy className="w-12 h-12" />
                    <p className="text-xs font-black uppercase tracking-widest">Select a league</p>
                </div>
            )}
        </div>
    );
}

// ─── Calendar Grid ────────────────────────────────────────────────────────────

function CalendarGrid({ year, month, matches, selectedDay, onSelectDay, accent }: {
    year: number; month: number; matches: MockMatch[];
    selectedDay: Date | null; onSelectDay: (d: Date) => void; accent: string;
}) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    while (cells.length % 7 !== 0) cells.push(null);

    const matchesOnDay = (day: number) => matches.filter(m =>
        m.date.getFullYear() === year && m.date.getMonth() === month && m.date.getDate() === day
    );

    return (
        <div className="grid grid-cols-7 gap-0.5 px-3 pb-3 flex-1">
            {cells.map((day, idx) => {
                if (!day) return <div key={idx} />;
                const dayMatches = matchesOnDay(day);
                const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                const isSelected = selectedDay?.getDate() === day && selectedDay?.getMonth() === month && selectedDay?.getFullYear() === year;
                const hasLive = dayMatches.some(m => m.status === 'LIVE');
                const hasUpcoming = dayMatches.some(m => m.status === 'UPCOMING');
                const hasFinished = dayMatches.some(m => m.status === 'FINISHED');

                return (
                    <button key={idx} onClick={() => onSelectDay(new Date(year, month, day))}
                        className="relative flex flex-col items-center justify-center rounded-xl transition-all duration-150 aspect-square"
                        style={{
                            background: isSelected ? accent : isToday ? 'rgba(255,255,255,0.07)' : 'transparent',
                            border: isSelected ? `1px solid ${accent}` : isToday ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
                        }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? 'rgba(255,255,255,0.07)' : 'transparent'; }}
                    >
                        <span className="text-[11px] font-black" style={{ color: isSelected ? '#000' : isToday ? '#fff' : 'rgba(255,255,255,0.5)' }}>{day}</span>
                        {dayMatches.length > 0 && (
                            <div className="flex gap-0.5 mt-0.5">
                                {hasLive && <span className="w-1 h-1 rounded-full" style={{ background: '#ef4444' }} />}
                                {hasUpcoming && <span className="w-1 h-1 rounded-full" style={{ background: accent }} />}
                                {hasFinished && <span className="w-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />}
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

// ─── Match Card ───────────────────────────────────────────────────────────────

function MatchCard({ match, accent, selected, onClick }: { match: MockMatch; accent: string; selected: boolean; onClick: () => void }) {
    const isLive = match.status === 'LIVE';
    const isFinished = match.status === 'FINISHED';

    return (
        <div onClick={onClick}
            className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-200"
            style={{
                background: selected ? (isLive ? 'rgba(239,68,68,0.08)' : `${accent}10`) : 'rgba(255,255,255,0.02)',
                border: selected
                    ? `1px solid ${isLive ? 'rgba(239,68,68,0.35)' : `${accent}40`}`
                    : '1px solid rgba(255,255,255,0.05)',
                boxShadow: selected && isLive ? '0 0 20px rgba(239,68,68,0.1)' : 'none',
            }}>
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04]">
                <div className="flex items-center gap-2">
                    {isLive ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />LIVE
                        </span>
                    ) : isFinished ? (
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>Finished</span>
                    ) : (
                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest" style={{ color: accent }}>
                            <Clock size={10} />{match.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>{match.round}</span>
                    <span className="text-[9px] text-white/20 font-bold">{match.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
            </div>

            {/* Teams vs */}
            <div className="px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                    {/* Team A */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-black text-white">{match.teamA.slice(0, 2).toUpperCase()}</span>
                        </div>
                        <span className="font-black text-sm text-white truncate">{match.teamA}</span>
                    </div>

                    {/* Score / VS */}
                    <div className="shrink-0 flex flex-col items-center">
                        {isFinished && match.scoreA !== undefined ? (
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black" style={{ color: (match.scoreA ?? 0) > (match.scoreB ?? 0) ? '#00ff00' : 'rgba(255,255,255,0.6)' }}>{match.scoreA}</span>
                                <span className="text-sm font-bold text-white/20">:</span>
                                <span className="text-xl font-black" style={{ color: (match.scoreB ?? 0) > (match.scoreA ?? 0) ? '#00ff00' : 'rgba(255,255,255,0.6)' }}>{match.scoreB}</span>
                            </div>
                        ) : isLive ? (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-xs font-black text-red-400">LIVE</span>
                            </div>
                        ) : (
                            <span className="text-xs font-black text-white/20 uppercase tracking-widest">VS</span>
                        )}
                    </div>

                    {/* Team B */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
                        <span className="font-black text-sm text-white truncate text-right">{match.teamB}</span>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-white/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-black text-white">{match.teamB.slice(0, 2).toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions (expanded) */}
            {selected && (
                <div className="px-4 pb-4 flex gap-2">
                    {isLive && (
                        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                            style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.25)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}>
                            <Video size={13} /> Watch Live
                        </button>
                    )}
                    <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}>
                        <Eye size={13} /> Match Details
                    </button>
                    {!isFinished && !isLive && (
                        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                            style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}30` }}
                            onMouseEnter={e => (e.currentTarget.style.background = `${accent}25`)}
                            onMouseLeave={e => (e.currentTarget.style.background = `${accent}15`)}>
                            <Play size={13} /> Set Reminder
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-1.5">
            <span className="text-white/40">{icon}</span>
            <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-white/30 leading-none mb-0.5">{label}</p>
                <p className="text-[11px] font-black text-white uppercase tracking-tight leading-none">{value}</p>
            </div>
        </div>
    );
}

// ─── Season Card (Seasons tab) ────────────────────────────────────────────────

const STAGE_TYPE_COLOR: Record<StageType, string> = {
    LEAGUE: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    BRACKET: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    SWISS: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    GROUPS: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
};

const STAGE_TYPE_ICON: Record<StageType, React.ReactNode> = {
    LEAGUE: <LayoutList size={10} />,
    BRACKET: <GitBranch size={10} />,
    SWISS: <Shuffle size={10} />,
    GROUPS: <Grid2X2 size={10} />,
};

const STAGE_STATUS_DOT: Record<StageStatus, string> = {
    DRAFT: 'bg-white/30',
    SCHEDULED: 'bg-yellow-400',
    LIVE: 'bg-green-400 animate-pulse',
    COMPLETED: 'bg-green-700',
};

const SEASON_STATUS_STYLE: Record<string, string> = {
    PLANNED: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
    ONGOING: 'text-green-400 bg-green-500/10 border-green-500/20',
    FINISHED: 'text-white/30 bg-white/5 border-white/10',
};

function SeasonCard({
    season, accent, stageCache, setStageCache,
}: {
    season: Season;
    accent: string;
    stageCache: Record<string, Stage[] | 'loading'>;
    setStageCache: React.Dispatch<React.SetStateAction<Record<string, Stage[] | 'loading'>>>;
}) {
    const [expanded, setExpanded] = useState(false);

    const handleExpand = async () => {
        const next = !expanded;
        setExpanded(next);
        if (!next || stageCache[season._id]) return;
        setStageCache(prev => ({ ...prev, [season._id]: 'loading' }));
        try {
            const data = await stageService.getBySeason(season._id);
            setStageCache(prev => ({ ...prev, [season._id]: data }));
        } catch {
            setStageCache(prev => ({ ...prev, [season._id]: [] }));
        }
    };

    const stagePrev = stageCache[season._id];
    const startFmt = season.startDate
        ? new Date(season.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';
    const endFmt = season.endDate
        ? new Date(season.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';

    return (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#0f0f10', border: '1px solid rgba(255,255,255,0.07)' }}>
            {/* Season header — click to expand stages */}
            <button
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left"
                onClick={handleExpand}
            >
                <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                    style={{ background: `${accent}15`, borderColor: `${accent}30` }}
                >
                    <Calendar size={16} style={{ color: accent }} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-black text-white text-sm">{season.name}</span>
                        <span className={cn(
                            'text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border',
                            SEASON_STATUS_STYLE[season.status] ?? SEASON_STATUS_STYLE.FINISHED
                        )}>
                            {season.status}
                        </span>
                    </div>
                    <p className="text-[11px] text-white/30 font-medium">{startFmt} → {endFmt}</p>
                </div>
                <Layers
                    size={13}
                    className="shrink-0 transition-colors"
                    style={{ color: expanded ? accent : 'rgba(255,255,255,0.2)' }}
                />
            </button>

            {/* Stage timeline */}
            {expanded && (
                <div className="px-5 pb-4 pt-2 border-t border-white/[0.05]">
                    {stagePrev === 'loading' ? (
                        <div className="flex items-center gap-2 py-2">
                            <Loader2 size={13} className="animate-spin" style={{ color: accent }} />
                            <span className="text-[11px] text-white/30">Loading stages…</span>
                        </div>
                    ) : !stagePrev || stagePrev.length === 0 ? (
                        <p className="text-[11px] text-white/20 py-2">No stages defined for this season yet.</p>
                    ) : (
                        <div className="flex items-start gap-0 overflow-x-auto py-2 scrollbar-none">
                            {(stagePrev as Stage[]).map((stage, i) => (
                                <div key={stage._id} className="flex items-center gap-0 shrink-0">
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className={cn('w-2.5 h-2.5 rounded-full', STAGE_STATUS_DOT[stage.status] ?? 'bg-white/20')} />
                                        <span className={cn(
                                            'flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest whitespace-nowrap',
                                            STAGE_TYPE_COLOR[stage.stageType] ?? STAGE_TYPE_COLOR.LEAGUE
                                        )}>
                                            {STAGE_TYPE_ICON[stage.stageType]}
                                            {stage.name}
                                        </span>
                                        <span className="text-[9px] text-white/20">
                                            {stage.startAt
                                                ? new Date(stage.startAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                                                : ''}
                                        </span>
                                    </div>
                                    {i < (stagePrev as Stage[]).length - 1 && (
                                        <div className="w-8 h-px bg-white/10 mx-1 -translate-y-3" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
