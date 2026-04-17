import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
    ArrowLeft,
    History,
    Video,
    Star,
    Trophy,
    MapPin,
    BarChart3,
    ExternalLink,
    Radio,
    Users,
    Target,
    TrendingUp,
    FileText,
    Plus,
    Send,
    Bookmark,
    BookmarkCheck,
    Sparkles,
    Play,
} from 'lucide-react';
import { scouterService, type ScoutedPlayerProfile, type PlayerMatchSummary } from '../../services/scouterService';
import { getDemoProfile, type PlayerHighlight, type StreamerInfo } from '../data/staticPlayerProfile';
import type { LeaderboardEntry } from '../../services/scouterService';
import {
    scoutingService,
    type ScoutingReport,
    type PlayerProspectStatus,
    type PlayerRecommendation,
    ProspectLevel,
    ProspectPriority,
    RecommendationLevel,
} from '../../services/scoutingService';
import { Modal, Button, Input } from '../../components/ui/core';
import { videoService, type VideoRecord } from '../../services/video.service';
import { highlightService, type HighlightRecord } from '../../services/highlight.service';
import { resolveBackendAssetUrl } from '../../lib/apiBase';
import { highlightCreatorLabel, highlightCreatorUserId, rankHighlightsByEngagement } from '../lib/scouterHighlightUtils';
import { MediaEngagementStrip } from '../../components/highlights/MediaEngagementStrip';
import { ScouterHighlightDetailModal } from '../components/ScouterHighlightDetailModal';

/** Minimal profile when API returns 404 so scouter can still use reports/prospect/recommendations */
function minimalProfile(playerUserId: string): ScoutedPlayerProfile {
    return {
        _id: playerUserId,
        userId: { _id: playerUserId, nickname: 'Unknown Player', email: '' },
        elo: 0,
        rank: 'Unranked',
        region: '—',
        isPro: false,
    };
}

const fmtDate = (d: string) =>
    d
        ? new Date(d).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
        : '—';

export default function ScouterPlayerProfile() {
    const { playerUserId } = useParams<{ playerUserId: string }>();
    const location = useLocation();
    const [profile, setProfile] = useState<ScoutedPlayerProfile | null>(null);
    const [matches, setMatches] = useState<PlayerMatchSummary[]>([]);
    const [highlights, setHighlights] = useState<PlayerHighlight[]>([]);
    const [playerHighlightClips, setPlayerHighlightClips] = useState<HighlightRecord[]>([]);
    const [clipsLoading, setClipsLoading] = useState(false);
    const [activeClipId, setActiveClipId] = useState<string | null>(null);
    const [playerVideos, setPlayerVideos] = useState<VideoRecord[]>([]);
    const [previewVideo, setPreviewVideo] = useState<{ title: string; description?: string; url: string } | null>(null);
    const [streamer, setStreamer] = useState<StreamerInfo | null>(null);
    const [team, setTeam] = useState<LeaderboardEntry['team']>(undefined);
    const [stats, setStats] = useState<{ killsPerRound: number; deathPerRound: number; winRate: number; headshotPct: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [isDemo, setIsDemo] = useState(false);
    const [reports, setReports] = useState<ScoutingReport[]>([]);
    const [prospect, setProspect] = useState<PlayerProspectStatus | null>(null);
    const [recommendations, setRecommendations] = useState<PlayerRecommendation[]>([]);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [recommendModalOpen, setRecommendModalOpen] = useState(false);
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const [prospectSaving, setProspectSaving] = useState(false);
    const [recommendSubmitting, setRecommendSubmitting] = useState(false);
    const [reportForm, setReportForm] = useState({ rating: 85, strengths: '', weaknesses: '', notes: '', recommendedRole: '' });
    const [prospectForm, setProspectForm] = useState<{ prospectLevel: ProspectLevel; priority: ProspectPriority }>({ prospectLevel: ProspectLevel.UNKNOWN, priority: ProspectPriority.MEDIUM });
    const [recommendForm, setRecommendForm] = useState<{ organizationId: string; recommendationLevel: RecommendationLevel; message: string }>({ organizationId: '', recommendationLevel: RecommendationLevel.STRONGLY_RECOMMEND, message: '' });
    const [inWatchlist, setInWatchlist] = useState(false);
    const [watchlistLoading, setWatchlistLoading] = useState(false);
    const [watchlistUpdating, setWatchlistUpdating] = useState(false);
    const [profileFromApi, setProfileFromApi] = useState(true);

    // Fetch profile + matches from API; fallback to demo or minimal so page stays usable
    useEffect(() => {
        if (!playerUserId) return;
        setLoading(true);
        setProfileFromApi(true);
        Promise.all([scouterService.getPlayerProfile(playerUserId), scouterService.getPlayerMatches(playerUserId)])
            .then(([p, m]) => {
                setProfile(p);
                setMatches(Array.isArray(m) ? m : []);
                setHighlights([]);
                setStreamer(null);
                setTeam(undefined);
                setStats(p?.stats && typeof p.stats === 'object' && 'killsPerRound' in p.stats
                    ? {
                        killsPerRound: Number((p.stats as { killsPerRound?: number }).killsPerRound) || 0,
                        deathPerRound: Number((p.stats as { deathPerRound?: number }).deathPerRound) || 0,
                        winRate: Number((p.stats as { winRate?: number }).winRate) || 0,
                        headshotPct: Number((p.stats as { headshotPct?: number }).headshotPct) || 0,
                    }
                    : null);
                setIsDemo(false);
            })
            .catch(() => {
                const demo = getDemoProfile(playerUserId);
                if (demo) {
                    setProfile(demo.profile);
                    setMatches(demo.matches);
                    setHighlights(demo.highlights);
                    setStreamer(demo.streamer);
                    setTeam(demo.team);
                    setStats(demo.stats);
                    setIsDemo(true);
                    setProfileFromApi(false);
                } else {
                    setProfile(minimalProfile(playerUserId));
                    setMatches([]);
                    setHighlights([]);
                    setStreamer(null);
                    setTeam(undefined);
                    setStats(null);
                    setIsDemo(false);
                    setProfileFromApi(false);
                }
            })
            .finally(() => setLoading(false));
    }, [playerUserId]);

    // Scouting data: reports, prospect, recommendations (always by playerUserId)
    useEffect(() => {
        if (!playerUserId) return;
        scoutingService.listReportsByPlayer(playerUserId).then(setReports).catch(() => setReports([]));
        scoutingService.getProspectByPlayer(playerUserId).then(setProspect).catch(() => setProspect(null));
        scoutingService.listRecommendationsByPlayer(playerUserId).then(setRecommendations).catch(() => setRecommendations([]));
    }, [playerUserId]);

    // Player uploaded videos (from /video)
    useEffect(() => {
        if (!playerUserId) return;
        videoService
            .list({ uploader: playerUserId })
            .then((list) => setPlayerVideos(Array.isArray(list) ? list : []))
            .catch(() => setPlayerVideos([]));
    }, [playerUserId]);

    // This player's highlight clips: public pool + per-uploaded-video (deduped), ranked by reactions
    useEffect(() => {
        if (!playerUserId || isDemo) {
            setPlayerHighlightClips([]);
            setClipsLoading(false);
            return;
        }
        let cancelled = false;
        setClipsLoading(true);
        (async () => {
            try {
                const publicList = await highlightService.listPublic();
                const fromPublic = publicList.filter((h) => highlightCreatorUserId(h.creator) === playerUserId);
                const videoLists = await Promise.all(
                    playerVideos.map((v) =>
                        highlightService.listByVideo(v._id, false).catch(() => [] as HighlightRecord[]),
                    ),
                );
                const fromVideos = videoLists
                    .flat()
                    .filter((h) => highlightCreatorUserId(h.creator) === playerUserId);
                const byId = new Map<string, HighlightRecord>();
                [...fromPublic, ...fromVideos].forEach((h) => byId.set(h._id, h));
                const merged = await rankHighlightsByEngagement(Array.from(byId.values()));
                if (!cancelled) setPlayerHighlightClips(merged);
            } catch {
                if (!cancelled) setPlayerHighlightClips([]);
            } finally {
                if (!cancelled) setClipsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [playerUserId, isDemo, playerVideos]);

    // Watchlist check (SCOUTING_FULL_GUIDE)
    useEffect(() => {
        let scouterId: string | null = null;
        try {
            const raw = localStorage.getItem('user');
            const user = raw ? JSON.parse(raw) : null;
            scouterId = user?.id ?? user?._id ?? null;
        } catch {
            /* ignore */
        }
        if (!scouterId || !playerUserId) return;
        setWatchlistLoading(true);
        scoutingService
            .checkWatchlist(scouterId, playerUserId)
            .then(setInWatchlist)
            .catch(() => setInWatchlist(false))
            .finally(() => setWatchlistLoading(false));
    }, [playerUserId]);

    // When navigating from watchlist "Report" link (#reports), scroll to reports section
    useEffect(() => {
        if (location.hash === '#reports') {
            const el = document.getElementById('reports');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [location.hash, loading]);

    useEffect(() => {
        setActiveClipId(null);
    }, [playerUserId]);

    useEffect(() => {
        if (prospect) {
            setProspectForm({ prospectLevel: prospect.prospectLevel, priority: prospect.priority });
        } else {
            setProspectForm({ prospectLevel: ProspectLevel.UNKNOWN, priority: ProspectPriority.MEDIUM });
        }
    }, [prospect]);

    const getScouterId = () => {
        try {
            const raw = localStorage.getItem('user');
            const user = raw ? JSON.parse(raw) : null;
            return user?.id ?? user?._id ?? null;
        } catch {
            return null;
        }
    };

    const handleAddToEvaluated = () => {
        const scouterId = getScouterId();
        if (!scouterId || !profile?._id) return;
        setAdding(true);
        scouterService
            .addToEvaluated(scouterId, profile._id)
            .then(() => { })
            .catch(() => { })
            .finally(() => setAdding(false));
    };

    const handleAddToWatchlist = () => {
        const scouterId = getScouterId();
        if (!scouterId || !playerUserId || watchlistUpdating) return;
        setWatchlistUpdating(true);
        scoutingService
            .addToWatchlist({ scouterId, playerId: playerUserId })
            .then(() => setInWatchlist(true))
            .catch(() => { })
            .finally(() => setWatchlistUpdating(false));
    };

    const handleRemoveFromWatchlist = () => {
        const scouterId = getScouterId();
        if (!scouterId || !playerUserId || watchlistUpdating) return;
        setWatchlistUpdating(true);
        scoutingService
            .removeFromWatchlist(scouterId, playerUserId)
            .then(() => setInWatchlist(false))
            .catch(() => { })
            .finally(() => setWatchlistUpdating(false));
    };

    const handleCreateReport = (e: React.FormEvent) => {
        e.preventDefault();
        const scouterId = getScouterId();
        if (!scouterId || !playerUserId) return;
        setReportSubmitting(true);
        scoutingService
            .createReport({
                scouterId,
                playerId: playerUserId,
                rating: reportForm.rating,
                strengths: reportForm.strengths || undefined,
                weaknesses: reportForm.weaknesses || undefined,
                notes: reportForm.notes || undefined,
                recommendedRole: reportForm.recommendedRole || undefined,
            })
            .then(() => {
                setReportModalOpen(false);
                setReportForm({ rating: 85, strengths: '', weaknesses: '', notes: '', recommendedRole: '' });
                scoutingService.listReportsByPlayer(playerUserId).then(setReports).catch(() => { });
            })
            .finally(() => setReportSubmitting(false));
    };

    const handleSaveProspect = () => {
        if (!playerUserId) return;
        setProspectSaving(true);
        scoutingService
            .upsertProspect({
                playerId: playerUserId,
                prospectLevel: prospectForm.prospectLevel,
                priority: prospectForm.priority,
            })
            .then((data) => {
                setProspect(data);
            })
            .catch(() => { })
            .finally(() => setProspectSaving(false));
    };

    const handleCreateRecommendation = (e: React.FormEvent) => {
        e.preventDefault();
        const scouterId = getScouterId();
        if (!scouterId || !playerUserId || !recommendForm.organizationId.trim()) return;
        setRecommendSubmitting(true);
        scoutingService
            .createRecommendation({
                scouterId,
                playerId: playerUserId,
                organizationId: recommendForm.organizationId.trim(),
                recommendationLevel: recommendForm.recommendationLevel,
                message: recommendForm.message || undefined,
            })
            .then(() => {
                setRecommendModalOpen(false);
                setRecommendForm({ organizationId: '', recommendationLevel: RecommendationLevel.STRONGLY_RECOMMEND, message: '' });
                scoutingService.listRecommendationsByPlayer(playerUserId).then(setRecommendations).catch(() => { });
            })
            .finally(() => setRecommendSubmitting(false));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-primary">Loading profile…</div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-20">
                <p className="text-white/60">Player not found.</p>
                <Link
                    to="/scouter/players"
                    className="mt-4 inline-flex items-center gap-2 text-primary hover:underline text-sm font-bold"
                >
                    <ArrowLeft size={16} /> Back to players
                </Link>
            </div>
        );
    }

    const name =
        typeof profile.userId === 'object' && profile.userId !== null && 'nickname' in profile.userId
            ? (profile.userId as { nickname: string }).nickname
            : (profile as { nickname?: string }).nickname ?? 'Player';
    const email =
        typeof profile.userId === 'object' && profile.userId !== null && 'email' in profile.userId
            ? (profile.userId as { email: string }).email
            : undefined;

    return (
        <div className="space-y-8 animate-fade-in-up">
            <Link
                to="/scouter/players"
                className="inline-flex items-center gap-2 text-white/60 hover:text-primary text-sm font-bold transition-colors"
            >
                <ArrowLeft size={16} /> Back to players
            </Link>

            {/* Hero – avatar, name, team, rank, region, pro badge, CTA */}
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex items-center gap-6 flex-wrap min-w-0">
                        <div className="w-28 h-28 rounded-2xl bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-primary font-black text-5xl shrink-0">
                            {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                <h1 className="text-3xl font-black text-white tracking-tight leading-none pb-0.5">{name}</h1>
                                {profile.isPro && (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-violet-500/25 border border-violet-400/50 text-violet-200 text-[11px] font-black uppercase tracking-wider leading-none shrink-0">
                                        Pro
                                    </span>
                                )}
                            </div>
                            {email && <p className="text-white/50 text-sm mt-1">{email}</p>}
                            {team && (
                                <div className="flex items-center gap-2 mt-3">
                                    {team.logo ? (
                                        <img
                                            src={team.logo}
                                            alt=""
                                            className="w-8 h-8 rounded-lg object-contain bg-white/5 border border-white/10"
                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
                                            <Users className="w-4 h-4 text-white/50" />
                                        </div>
                                    )}
                                    <span className="text-white/80 font-semibold text-sm">{team.name ?? '—'}</span>
                                </div>
                            )}
                            <div className="flex flex-wrap gap-4 mt-3 text-sm">
                                <span className="flex items-center gap-1.5 text-primary font-bold">
                                    <Trophy size={14} /> {profile.elo ?? '—'} Elo
                                </span>
                                <span className="flex items-center gap-1.5 text-white/70">
                                    Rank: {profile.rank ?? '—'}
                                </span>
                                <span className="flex items-center gap-1.5 text-white/70">
                                    <MapPin size={14} /> {profile.region ?? '—'}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-4">
                                {!watchlistLoading && (
                                    inWatchlist ? (
                                        <button
                                            onClick={handleRemoveFromWatchlist}
                                            disabled={watchlistUpdating}
                                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/20 border border-primary/30 text-primary font-bold text-sm hover:bg-primary/30 transition-colors disabled:opacity-50"
                                        >
                                            <BookmarkCheck size={16} /> {watchlistUpdating ? 'Removing…' : 'In watchlist'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleAddToWatchlist}
                                            disabled={watchlistUpdating}
                                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm hover:bg-white/15 disabled:opacity-50"
                                        >
                                            <Bookmark size={16} /> {watchlistUpdating ? 'Adding…' : 'Add to watchlist'}
                                        </button>
                                    )
                                )}
                                <button
                                    onClick={handleAddToEvaluated}
                                    disabled={adding}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/20 border border-primary/30 text-primary font-bold text-sm hover:bg-primary/30 transition-colors disabled:opacity-50"
                                >
                                    <Star size={16} /> {adding ? 'Adding…' : 'Add to evaluated list'}
                                </button>
                                <button
                                    onClick={() => setReportModalOpen(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm hover:bg-white/15"
                                >
                                    <FileText size={16} /> New report
                                </button>
                                <button
                                    onClick={() => setRecommendModalOpen(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm hover:bg-white/15"
                                >
                                    <Send size={16} /> Recommend to team
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {!profileFromApi && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90">
                    Profile data may be limited or from demo. Reports, prospect status, and recommendations are loaded from the scouting API.
                </div>
            )}

            {/* Scouting reports */}
            <section id="reports" className="rounded-2xl border border-primary/10 bg-white/[0.02] overflow-hidden scroll-mt-6">
                <div className="px-6 py-4 border-b border-primary/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-primary/90">Reports</h2>
                    </div>
                    <button
                        onClick={() => setReportModalOpen(true)}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                        <Plus size={14} /> New report
                    </button>
                </div>
                <div className="divide-y divide-white/5">
                    {reports.length === 0 ? (
                        <div className="px-6 py-8 text-center text-white/40 text-sm">No reports yet. Click &quot;New report&quot; to add an evaluation.</div>
                    ) : (
                        reports.map((r) => (
                            <div key={r._id} className="px-6 py-4">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-primary font-bold">{r.rating}/100</span>
                                    {r.recommendedRole && (
                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-primary/20 text-primary">{r.recommendedRole}</span>
                                    )}
                                </div>
                                {r.strengths && <p className="text-sm text-white/70 mt-1"><span className="text-white/50">Strengths:</span> {r.strengths}</p>}
                                {r.weaknesses && <p className="text-sm text-white/70 mt-0.5"><span className="text-white/50">Weaknesses:</span> {r.weaknesses}</p>}
                                {r.notes && <p className="text-xs text-white/40 mt-1">{r.notes}</p>}
                                <p className="text-[10px] text-white/30 mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Prospect status */}
            <section className="rounded-2xl border border-primary/10 bg-white/[0.02] overflow-hidden">
                <div className="px-6 py-4 border-b border-primary/10 flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-primary/90">Prospect status</h2>
                </div>
                <div className="p-6 flex flex-wrap items-end gap-4">
                    <div>
                        <label className="block text-xs font-bold text-white/60 mb-1">Level</label>
                        <select
                            value={prospectForm.prospectLevel}
                            onChange={(e) => setProspectForm((f) => ({ ...f, prospectLevel: e.target.value as ProspectLevel }))}
                            className="px-4 py-2.5 rounded-xl bg-white/5 border border-primary/20 text-white text-sm min-w-[180px]"
                        >
                            {Object.values(ProspectLevel).map((l) => (
                                <option key={l} value={l}>{l.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-white/60 mb-1">Priority</label>
                        <select
                            value={prospectForm.priority}
                            onChange={(e) => setProspectForm((f) => ({ ...f, priority: e.target.value as ProspectPriority }))}
                            className="px-4 py-2.5 rounded-xl bg-white/5 border border-primary/20 text-white text-sm min-w-[120px]"
                        >
                            {Object.values(ProspectPriority).map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                    <Button
                        onClick={handleSaveProspect}
                        disabled={prospectSaving}
                        className="bg-primary text-black hover:bg-primary/90 font-bold"
                    >
                        {prospectSaving ? 'Saving…' : 'Save status'}
                    </Button>
                    {prospect && (
                        <span className="text-xs text-white/40">Last updated: {new Date(prospect.lastUpdated).toLocaleDateString()}</span>
                    )}
                </div>
            </section>

            {/* Recommendations for this player */}
            {recommendations.length > 0 && (
                <section className="rounded-2xl border border-primary/10 bg-white/[0.02] overflow-hidden">
                    <div className="px-6 py-4 border-b border-primary/10 flex items-center gap-2">
                        <Send className="w-5 h-5 text-primary" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-primary/90">Recommendations sent</h2>
                    </div>
                    <div className="divide-y divide-white/5">
                        {recommendations.map((rec) => (
                            <div key={rec._id} className="px-6 py-3 flex flex-wrap items-center justify-between gap-2">
                                <span className="text-white/80 text-sm">
                                    {typeof rec.organizationId === 'object' && rec.organizationId && 'name' in rec.organizationId
                                        ? (rec.organizationId as { name?: string }).name
                                        : 'Organization'}{' '}
                                    · {rec.recommendationLevel.replace(/_/g, ' ')}
                                </span>
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${rec.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' : rec.status === 'ACCEPTED' ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-400'}`}>
                                    {rec.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Stats – from API (profile.stats) or demo; match count always from fetched matches */}
            {(stats || matches.length > 0) && (
                <section className="rounded-2xl border border-primary/10 bg-white/[0.02] overflow-hidden">
                    <div className="px-6 py-4 border-b border-primary/10 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-primary/90">Performance & activity</h2>
                    </div>
                    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {matches.length > 0 && (
                            <StatCard label="Matches" value={matches.length} icon={<History className="w-4 h-4" />} />
                        )}
                        {stats && (
                            <>
                                <StatCard label="K/R" value={stats.killsPerRound} icon={<Target className="w-4 h-4" />} />
                                <StatCard label="D/R" value={stats.deathPerRound} icon={<TrendingUp className="w-4 h-4" />} />
                                <StatCard label="Win %" value={`${stats.winRate}%`} icon={<Trophy className="w-4 h-4" />} />
                                <StatCard label="HS %" value={`${stats.headshotPct}%`} icon={<Target className="w-4 h-4" />} />
                            </>
                        )}
                    </div>
                </section>
            )}

            {/* Rank card */}
            <section className="rounded-2xl border border-primary/10 bg-white/[0.02] overflow-hidden">
                <div className="px-6 py-4 border-b border-primary/10 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-primary/90">Current rank</h2>
                </div>
                <div className="p-6 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                        <Trophy className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-primary">{profile.rank ?? 'Unranked'}</p>
                        <p className="text-white/50 text-sm mt-0.5">Elo: {profile.elo ?? '—'}</p>
                    </div>
                </div>
            </section>

            {/* Last matches */}
            <section className="rounded-2xl border border-primary/10 bg-white/[0.02] overflow-hidden">
                <div className="px-6 py-4 border-b border-primary/10 flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-primary/90">Last matches</h2>
                </div>
                <div className="divide-y divide-white/5">
                    {matches.length === 0 ? (
                        <div className="px-6 py-12 text-center text-white/40 text-sm">No match history yet.</div>
                    ) : (
                        matches.map((m) => (
                            <div
                                key={m._id}
                                className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 hover:bg-white/[0.02]"
                            >
                                <div>
                                    <p className="text-white font-medium">
                                        Round{' '}
                                        {typeof m.roundId === 'object' && m.roundId && 'roundNumber' in m.roundId
                                            ? (m.roundId as { roundNumber: number }).roundNumber
                                            : '—'}
                                    </p>
                                    <p className="text-xs text-white/50">{fmtDate(m.scheduledStart)}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {m.team1GamesWon != null && m.team2GamesWon != null && (
                                        <span className="text-primary font-bold tabular-nums">
                                            {m.team1GamesWon} – {m.team2GamesWon}
                                        </span>
                                    )}
                                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-white/10 text-white/70">
                                        {m.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Videos & highlights */}
            <section className="rounded-2xl border border-primary/10 bg-white/[0.02] overflow-hidden">
                <div className="px-6 py-4 border-b border-primary/10 flex items-center gap-2">
                    <Video className="w-5 h-5 text-primary" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-primary/90">Videos & highlights</h2>
                </div>
                <div className="p-6 space-y-8">
                    {playerVideos.length === 0 &&
                        playerHighlightClips.length === 0 &&
                        !clipsLoading &&
                        (!isDemo || highlights.length === 0) ? (
                        <p className="text-white/40 text-sm text-center py-8">
                            No VODs or highlight clips linked yet. Connect your CDN or YouTube to show highlights here.
                        </p>
                    ) : (
                        <>
                            {playerVideos.length > 0 && (
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/45 mb-3">
                                        Videos
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {playerVideos.map((v) => (
                                            <button
                                                key={v._id}
                                                type="button"
                                                onClick={() =>
                                                    setPreviewVideo({
                                                        title: v.title,
                                                        description: v.description,
                                                        url: resolveBackendAssetUrl(v.url),
                                                    })
                                                }
                                                className="group block text-left rounded-xl border border-white/10 bg-white/5 overflow-hidden hover:border-primary/30 hover:bg-primary/5 transition-all"
                                            >
                                                <video
                                                    src={resolveBackendAssetUrl(v.url)}
                                                    className="w-full aspect-video object-cover bg-black"
                                                    preload="metadata"
                                                />
                                                <div className="p-3">
                                                    <p className="text-white font-semibold text-sm truncate">{v.title}</p>
                                                    {v.description && (
                                                        <p className="text-white/40 text-xs mt-0.5 line-clamp-2">
                                                            {v.description}
                                                        </p>
                                                    )}
                                                    <div className="mt-2 flex items-center justify-between">
                                                        <p className="text-white/40 text-xs">
                                                            {new Date(v.createdAt).toLocaleDateString()}
                                                        </p>
                                                        <span className="text-primary text-xs font-bold">Open</span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!isDemo && (clipsLoading || playerHighlightClips.length > 0) && (
                                <div>
                                    <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-scout-amber shrink-0" />
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/45">
                                                Highlight clips
                                            </h3>
                                        </div>
                                        <p className="text-[10px] text-white/35 max-w-md text-right">
                                            Likes, comments, saves on each card. Open for full viewer — use arrows to move
                                            through all clips.
                                        </p>
                                    </div>
                                    {clipsLoading ? (
                                        <div className="flex gap-6 overflow-hidden pb-2 sm:gap-7">
                                            {[1, 2, 3].map((i) => (
                                                <div
                                                    key={i}
                                                    className="shrink-0 w-[200px] sm:w-[220px] aspect-[9/16] rounded-2xl bg-white/5 animate-pulse border border-white/5"
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="relative flex gap-6 overflow-x-auto pb-3 scroll-smooth snap-x snap-mandatory sm:gap-7 [-ms-overflow-style:none] [scrollbar-width:thin] [scrollbar-color:rgba(34,211,238,0.35)_transparent] [-webkit-overflow-scrolling:touch]">
                                            {playerHighlightClips.map((h) => (
                                                <button
                                                    key={h._id}
                                                    type="button"
                                                    onClick={() => setActiveClipId(h._id)}
                                                    className="group/card shrink-0 w-[200px] sm:w-[220px] snap-start text-left rounded-2xl border border-white/10 bg-black/50 overflow-hidden hover:border-primary/45 hover:shadow-[0_0_28px_rgba(0,255,135,0.14)] transition-all duration-300"
                                                >
                                                    <div className="relative aspect-[9/16] w-full bg-black">
                                                        {h.clipUrl ? (
                                                            <video
                                                                src={resolveBackendAssetUrl(h.clipUrl)}
                                                                className="h-full w-full object-cover opacity-92 transition-opacity group-hover/card:opacity-100"
                                                                muted
                                                                playsInline
                                                                preload="metadata"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-scout-violet-deep/50 to-black">
                                                                <Sparkles className="h-10 w-10 text-primary/40" />
                                                            </div>
                                                        )}
                                                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover/card:opacity-100">
                                                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-black shadow-lg shadow-primary/40">
                                                                <Play size={22} className="ml-0.5" fill="currentColor" />
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2 p-3">
                                                        <p className="line-clamp-2 text-xs font-bold leading-tight text-white">
                                                            {h.title}
                                                        </p>
                                                        <p className="line-clamp-1 text-[9px] font-bold uppercase tracking-wider text-white/35">
                                                            {highlightCreatorLabel(h.creator)}
                                                        </p>
                                                        <div className="flex flex-wrap items-center justify-end gap-1">
                                                            <MediaEngagementStrip kind="highlight" id={h._id} />
                                                        </div>
                                                        {h.description?.trim() ? (
                                                            <p className="line-clamp-3 border-t border-white/[0.06] pt-2 text-left text-[10px] leading-snug text-white/50">
                                                                {h.description.trim()}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {isDemo && highlights.length > 0 && (
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/45 mb-3">
                                        Demo highlights
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {highlights.map((h) => (
                                            <a
                                                key={h.id}
                                                href={h.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group block rounded-xl border border-white/10 bg-white/5 overflow-hidden hover:border-primary/30 hover:bg-primary/5 transition-all"
                                            >
                                                <div className="aspect-video bg-white/5 relative">
                                                    <img
                                                        src={h.thumbnailUrl}
                                                        alt=""
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                    />
                                                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-bold text-white">
                                                        {h.duration ?? '—'}
                                                    </span>
                                                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-primary/90 text-[10px] font-bold text-black uppercase">
                                                        {h.type}
                                                    </span>
                                                </div>
                                                <div className="p-3">
                                                    <p className="text-white font-semibold text-sm truncate">{h.title}</p>
                                                    {h.date && (
                                                        <p className="text-white/40 text-xs mt-0.5">{h.date}</p>
                                                    )}
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* Streamer – channel link */}
            {streamer && (
                <section className="rounded-2xl border border-primary/10 bg-white/[0.02] overflow-hidden">
                    <div className="px-6 py-4 border-b border-primary/10 flex items-center gap-2">
                        <Radio className="w-5 h-5 text-primary" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-primary/90">Streamer</h2>
                        {streamer.isLive && (
                            <span className="ml-2 px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold uppercase flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> Live
                            </span>
                        )}
                    </div>
                    <div className="p-6 flex flex-wrap items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                            <Radio className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                            <p className="text-white font-bold capitalize">{streamer.platform}</p>
                            <p className="text-white/60 text-sm">{streamer.channelName}</p>
                            {streamer.followers && (
                                <p className="text-white/40 text-xs mt-0.5">{streamer.followers} followers</p>
                            )}
                        </div>
                        <a
                            href={streamer.channelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/20 border border-primary/30 text-primary font-bold text-sm hover:bg-primary/30 transition-colors"
                        >
                            <ExternalLink size={14} /> Open channel
                        </a>
                    </div>
                </section>
            )}

            {isDemo && (
                <p className="text-center text-white/30 text-xs">
                    Showing demo data for this player. Connect the scouter API for live profile, matches, and videos.
                </p>
            )}

            {/* New report modal */}
            <Modal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} title="New report">
                <form onSubmit={handleCreateReport} className="space-y-4 px-6 pb-6">
                    <p className="text-white/60 text-sm">Add an evaluation for this player (rating 0–100, strengths, weaknesses, recommended role).</p>
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-1">Rating (0–100)</label>
                        <input
                            type="number"
                            min={0}
                            max={100}
                            value={reportForm.rating}
                            onChange={(e) => setReportForm((f) => ({ ...f, rating: Number(e.target.value) || 0 }))}
                            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-primary/20 text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-1">Strengths</label>
                        <Input
                            value={reportForm.strengths}
                            onChange={(e) => setReportForm((f) => ({ ...f, strengths: e.target.value }))}
                            placeholder="Strong aim, good positioning"
                            className="rounded-xl bg-white/5 border border-primary/20"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-1">Weaknesses</label>
                        <Input
                            value={reportForm.weaknesses}
                            onChange={(e) => setReportForm((f) => ({ ...f, weaknesses: e.target.value }))}
                            placeholder="Needs work on communication"
                            className="rounded-xl bg-white/5 border border-primary/20"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-1">Recommended role</label>
                        <Input
                            value={reportForm.recommendedRole}
                            onChange={(e) => setReportForm((f) => ({ ...f, recommendedRole: e.target.value }))}
                            placeholder="e.g. Duelist, Support, Controller"
                            className="rounded-xl bg-white/5 border border-primary/20"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-1">Notes</label>
                        <Input
                            value={reportForm.notes}
                            onChange={(e) => setReportForm((f) => ({ ...f, notes: e.target.value }))}
                            placeholder="Promising for tier 2"
                            className="rounded-xl bg-white/5 border border-primary/20"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={() => setReportModalOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={reportSubmitting} className="bg-primary text-black hover:bg-primary/90">
                            {reportSubmitting ? 'Saving…' : 'Create report'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={Boolean(previewVideo)} onClose={() => setPreviewVideo(null)} size="xl">
                {previewVideo && (
                    <div className="p-5 space-y-3">
                        <div>
                            <h3 className="text-lg font-bold text-white">{previewVideo.title}</h3>
                            {previewVideo.description && (
                                <p className="text-sm text-white/60 mt-1">{previewVideo.description}</p>
                            )}
                        </div>
                        <video
                            src={previewVideo.url}
                            className="w-full max-h-[70vh] rounded-xl bg-black"
                            controls
                            autoPlay
                        />
                    </div>
                )}
            </Modal>

            <ScouterHighlightDetailModal
                highlights={playerHighlightClips}
                activeHighlightId={activeClipId}
                onClose={() => setActiveClipId(null)}
                onNavigate={setActiveClipId}
            />

            {/* Recommend to team modal */}
            <Modal isOpen={recommendModalOpen} onClose={() => setRecommendModalOpen(false)} title="Recommend to team">
                <form onSubmit={handleCreateRecommendation} className="space-y-4 px-6 pb-6">
                    <p className="text-white/60 text-sm">Send a formal recommendation to a team or academy. They can accept or reject.</p>
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-1">Organization ID (team or academy)</label>
                        <Input
                            value={recommendForm.organizationId}
                            onChange={(e) => setRecommendForm((f) => ({ ...f, organizationId: e.target.value }))}
                            placeholder="MongoDB ObjectId of the organization"
                            required
                            className="rounded-xl bg-white/5 border border-primary/20"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-1">Recommendation level</label>
                        <select
                            value={recommendForm.recommendationLevel}
                            onChange={(e) => setRecommendForm((f) => ({ ...f, recommendationLevel: e.target.value as RecommendationLevel }))}
                            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-primary/20 text-white text-sm"
                        >
                            {Object.values(RecommendationLevel).map((l) => (
                                <option key={l} value={l}>{l.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-1">Message (optional)</label>
                        <Input
                            value={recommendForm.message}
                            onChange={(e) => setRecommendForm((f) => ({ ...f, message: e.target.value }))}
                            placeholder="Strong performance in recent matches."
                            className="rounded-xl bg-white/5 border border-primary/20"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={() => setRecommendModalOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={recommendSubmitting} className="bg-primary text-black hover:bg-primary/90">
                            {recommendSubmitting ? 'Sending…' : 'Send recommendation'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

function StatCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: number | string;
    icon: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">{label}</p>
                <p className="text-xl font-black text-white tabular-nums">{value}</p>
            </div>
        </div>
    );
}
