import React, { useState, useEffect } from 'react';
import PlayerLeagueWikiPage from './PlayerLeagueWikiPage';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Trophy, Users, Globe, Calendar, Loader2,
    User, Crown, Star, ChevronRight,
    TrendingUp, Shield,
    Video, Play, Layers,
    Lock, BookOpen,
    LayoutList, GitBranch, Shuffle, Grid2X2,
} from 'lucide-react';
import { leagueService, type League, type LeagueParticipant } from '../../services/leagueService';
import { seasonService, type Season } from '../../services/seasonService';
import { stageService, type Stage, type StageType, type StageStatus } from '../../services/stageService';
import {
    getMatchesBySeason,
    getAdminStandings,
    type AdminMatch,
    type StandingEntry,
} from '../../services/adminLeagueService';
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
interface DisplayMatch {
    id: string;
    teamA: string; teamB: string;
    scoreA?: number; scoreB?: number;
    date: Date;
    status: MatchStatus;
    round: string;
    streamUrl?: string;
}

function adminMatchToDisplay(m: AdminMatch): DisplayMatch {
    const t1 = typeof m.team1Id === 'object' && m.team1Id?.name ? m.team1Id.name : 'TBD';
    const t2 = typeof m.team2Id === 'object' && m.team2Id?.name ? m.team2Id.name : 'TBD';
    const date = new Date(m.scheduledStart);
    let status: MatchStatus;
    if (m.status === 'ONGOING') status = 'LIVE';
    else if (m.status === 'COMPLETED' || m.status === 'FORFEIT') status = 'FINISHED';
    else status = 'UPCOMING';
    const round =
        typeof m.roundId === 'object' && m.roundId?.roundNumber != null
            ? `Round ${m.roundId.roundNumber}`
            : 'Match';
    const done = m.status === 'COMPLETED' || m.status === 'FORFEIT';
    return {
        id: m._id,
        teamA: t1,
        teamB: t2,
        scoreA: done ? m.team1GamesWon : undefined,
        scoreB: done ? m.team2GamesWon : undefined,
        date,
        status,
        round,
        streamUrl: m.streamUrl,
    };
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

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PlayerLeagues() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [leagues, setLeagues] = useState<LeagueFull[]>([]);
    const [selectedLeague, setSelectedLeague] = useState<LeagueFull | null>(null);
    const [standings, setStandings] = useState<LeagueParticipant[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [standingsLoading, setStandingsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'live' | 'standings' | 'seasons' | 'wiki'>('live');

    // Seasons + stages state
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [seasonsLoading, setSeasonsLoading] = useState(false);
    const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
    const [stageCache, setStageCache] = useState<Record<string, Stage[] | 'loading'>>({});

    const [matches, setMatches] = useState<DisplayMatch[]>([]);
    const [matchesLoading, setMatchesLoading] = useState(false);
    const [seasonStandings, setSeasonStandings] = useState<StandingEntry[]>([]);


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
        setSeasons([]);
        setStageCache({});
        leagueService.getLeagueStandings(selectedLeague._id)
            .then(setStandings)
            .catch(console.error)
            .finally(() => setStandingsLoading(false));
        // load seasons for Seasons tab
        setSeasonsLoading(true);
        seasonService.getByLeague(selectedLeague._id)
            .then(setSeasons)
            .catch(console.error)
            .finally(() => setSeasonsLoading(false));
    }, [selectedLeague]);

    useEffect(() => {
        if (seasons.length === 0) {
            setSelectedSeasonId(null);
            return;
        }
        setSelectedSeasonId((prev) => {
            if (prev && seasons.some((s) => s._id === prev)) return prev;
            const ongoing = seasons.find((s) => s.status === 'ONGOING');
            return (ongoing ?? seasons[0])._id;
        });
    }, [seasons]);

    useEffect(() => {
        if (!selectedSeasonId) {
            setMatches([]);
            setSeasonStandings([]);
            return;
        }
        let cancelled = false;
        (async () => {
            setMatchesLoading(true);
            try {
                const [m, st] = await Promise.all([
                    getMatchesBySeason(selectedSeasonId),
                    getAdminStandings(selectedSeasonId),
                ]);
                if (cancelled) return;
                setMatches(m.map(adminMatchToDisplay));
                setSeasonStandings(Array.isArray(st) ? st : []);
            } catch (e) {
                console.error(e);
                if (!cancelled) {
                    setMatches([]);
                    setSeasonStandings([]);
                }
            } finally {
                if (!cancelled) setMatchesLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [selectedSeasonId]);

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
                        <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-4 w-full">
                            <div className="flex items-start gap-4 min-w-0 flex-1">
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
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white/45">
                                            <Lock size={10} className="shrink-0 opacity-70" />
                                            Browse only
                                        </span>
                                        {seasons.length > 0 && (
                                            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/35">
                                                Season
                                                <select
                                                    value={selectedSeasonId ?? ''}
                                                    onChange={(e) => setSelectedSeasonId(e.target.value || null)}
                                                    className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/40 max-w-[200px]"
                                                >
                                                    {seasons.map((s) => (
                                                        <option key={s._id} value={s._id}>
                                                            {s.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                        )}
                                        <StatPill icon={<Users size={11} />} label="Format" value={(selectedLeague as LeagueFull).format ?? '—'} />
                                        <StatPill icon={<Shield size={11} />} label="Max Teams" value={`${(selectedLeague as LeagueFull).maxTeams ?? '—'}`} />
                                        <StatPill icon={<Calendar size={11} />} label="Dates" value={`${(selectedLeague as LeagueFull).startDate ? new Date((selectedLeague as LeagueFull).startDate!).toLocaleDateString() : '—'} – ${(selectedLeague as LeagueFull).endDate ? new Date((selectedLeague as LeagueFull).endDate!).toLocaleDateString() : '—'}`} />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                                {matches.filter(m => m.status === 'LIVE').length > 0 && (
                                    <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest"
                                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}>
                                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                        {matches.filter(m => m.status === 'LIVE').length} Live
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tab bar */}
                    <div className="flex gap-1 p-1 rounded-2xl shrink-0 self-start pb-0 overflow-x-auto" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {[
                            { key: 'live', label: 'Live Stream', icon: <Video size={13} /> },
                            { key: 'standings', label: 'Standings', icon: <TrendingUp size={13} /> },
                            { key: 'seasons', label: 'Seasons', icon: <Layers size={13} /> },
                            { key: 'wiki', label: 'Tournament Wiki', icon: <BookOpen size={13} /> },
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
                            {matchesLoading ? (
                                <div className="flex flex-1 items-center justify-center rounded-3xl border border-white/10 bg-[#09090b]">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                </div>
                            ) : (() => {
                                const live = matches.find((m) => m.status === 'LIVE');
                                const stream = live?.streamUrl?.trim();
                                const canEmbed = stream && /^https:\/\//i.test(stream);
                                if (canEmbed) {
                                    return (
                                        <div className="flex-1 flex flex-col min-h-0 rounded-3xl overflow-hidden border border-white/10 bg-black">
                                            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-red-500/10">
                                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Live</span>
                                                <span className="text-xs font-bold text-white/80 truncate">
                                                    {live!.teamA} vs {live!.teamB}
                                                </span>
                                            </div>
                                            <iframe
                                                title="Live stream"
                                                src={stream}
                                                className="w-full flex-1 min-h-[320px] border-0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                    );
                                }
                                return (
                                    <div className="flex-1 rounded-3xl overflow-hidden relative flex flex-col items-center justify-center gap-4 p-8 text-center border border-white/10" style={{ background: '#09090b' }}>
                                        <Video className="w-14 h-14 text-white/15" />
                                        <div>
                                            <h3 className="text-lg font-black uppercase tracking-tight text-white mb-1">No official stream</h3>
                                            <p className="text-sm text-white/35 max-w-md">
                                                {live && stream
                                                    ? 'Open the stream in a new tab — embedding is only available for HTTPS URLs.'
                                                    : selectedSeasonId
                                                      ? 'There is no match marked live with a stream link for this season. Check the calendar for upcoming games.'
                                                      : 'Select a league with seasons to see scheduled broadcasts.'}
                                            </p>
                                        </div>
                                        {live && stream && (
                                            <a
                                                href={stream}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-black uppercase tracking-widest text-black"
                                            >
                                                <Play size={14} />
                                                Open stream
                                            </a>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* ── STANDINGS tab ──────────────────────────────── */}
                    {activeTab === 'standings' && (
                        <div className="flex-1 bg-[#0f0f10] border border-white/[0.07] rounded-3xl overflow-hidden flex flex-col min-h-0">
                            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <TrendingUp size={15} style={{ color: lc.accent }} />
                                    <span className="font-black text-sm uppercase tracking-widest text-white">Standings</span>
                                    {seasonStandings.length > 0 ? (
                                        <span className="text-[10px] font-black bg-white/5 border border-white/10 text-text-muted px-2 py-0.5 rounded-full uppercase tracking-widest">
                                            {seasonStandings.length} teams · season table
                                        </span>
                                    ) : standings.length > 0 ? (
                                        <span className="text-[10px] font-black bg-white/5 border border-white/10 text-text-muted px-2 py-0.5 rounded-full uppercase tracking-widest">
                                            {standings.length} registrations
                                        </span>
                                    ) : null}
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
                                {standingsLoading || (selectedSeasonId && matchesLoading && seasonStandings.length === 0) ? (
                                    <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-primary animate-spin" /></div>
                                ) : seasonStandings.length > 0 ? [...seasonStandings].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0)).map((row, i) => {
                                    const tid = row.teamId;
                                    const isObj = tid && typeof tid === 'object';
                                    const name = isObj ? (tid as { name?: string }).name ?? 'Team' : 'Team';
                                    const logo = isObj ? (tid as { logo?: string }).logo : undefined;
                                    const ps = positionStyles[i] ?? defaultPS;
                                    const pos = row.rank > 0 ? row.rank : i + 1;
                                    return (
                                        <div key={row._id} className={cn('grid grid-cols-[44px_1fr_52px_52px_52px_52px_68px] gap-2 items-center px-4 py-3.5 rounded-2xl border transition-all duration-200', ps.border, ps.bg)}>
                                            <div className="flex justify-center">
                                                <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0', ps.badge)}>
                                                    {pos === 1 ? <Crown size={13} /> : pos}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center overflow-hidden shrink-0', ps.avatar)}>
                                                    {logo ? <img src={logo} className="w-full h-full object-cover" alt="" /> : <Globe size={15} className="text-white/40" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-white text-sm truncate">{name}</p>
                                                    <p className="text-[10px] text-white/30 uppercase font-bold tracking-tight">Season roster</p>
                                                </div>
                                            </div>
                                            <div className="text-center"><span className="text-sm font-bold text-white/40">{row.played ?? 0}</span></div>
                                            <div className="text-center"><span className={cn('text-sm font-black', (row.wins ?? 0) > 0 ? 'text-green-400' : 'text-white/25')}>{row.wins ?? 0}</span></div>
                                            <div className="text-center"><span className={cn('text-sm font-black', (row.draws ?? 0) > 0 ? 'text-yellow-400' : 'text-white/25')}>{row.draws ?? 0}</span></div>
                                            <div className="text-center"><span className={cn('text-sm font-black', (row.losses ?? 0) > 0 ? 'text-red-400' : 'text-white/25')}>{row.losses ?? 0}</span></div>
                                            <div className="flex justify-center">
                                                <div className={cn('min-w-[44px] px-2.5 py-1.5 rounded-xl font-black text-sm text-center border', ps.pts)}>{row.points ?? 0}</div>
                                            </div>
                                        </div>
                                    );
                                }) : standings.length > 0 ? standings.map((p, i) => {
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

                    {/* ── TOURNAMENT WIKI tab ────────────────────────── */}
                    {activeTab === 'wiki' && (
                        <div className="flex-1 min-h-0 overflow-hidden">
                            <PlayerLeagueWikiPage embeddedLeagueId={selectedLeague._id} />
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
