import React, { useEffect, useRef, useState } from 'react';
import {
    Calendar,
    GitBranch,
    Grid2X2,
    Layers,
    LayoutList,
    Loader2,
    MapPin,
    MessageCircle,
    Play,
    Radio,
    Shuffle,
    Users,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import broadcastStagePoster from '../../../assets/image.png';
import { stageService, type Stage, type StageStatus, type StageType } from '../../../services/stageService';
import type { Season } from '../../../services/seasonService';

const BROADCAST_AMBIENT_VIDEO_MP4 =
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

export function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
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

type LiveBroadcastMode = 'live' | 'standby' | 'demo';

/** Broadcast shell: real live (no embed), league standby, or dev/demo preview. */
export function LiveBroadcastPlaceholder({
    broadcastMode = 'live',
    teamA,
    teamB,
    roundLabel,
    accent,
    streamUrl,
    scores,
    footerHint,
}: {
    broadcastMode?: LiveBroadcastMode;
    teamA: string;
    teamB: string;
    roundLabel: string;
    accent: string;
    streamUrl?: string | null;
    /** Omit for 0–0 (e.g. live match before map scores sync). */
    scores?: { a: number; b: number };
    footerHint?: string;
}) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [videoFailed, setVideoFailed] = useState(false);
    /** Standby / demo: show gameplay poster + play first; live: start ambient video immediately. */
    const [ambientStarted, setAmbientStarted] = useState(broadcastMode === 'live');

    useEffect(() => {
        const v = videoRef.current;
        if (!v || videoFailed || !ambientStarted) return;
        v.muted = true;
        const p = v.play();
        if (p && typeof p.catch === 'function') {
            p.catch(() => setVideoFailed(true));
        }
    }, [videoFailed, ambientStarted]);

    const scoreA = scores?.a ?? 0;
    const scoreB = scores?.b ?? 0;
    const mapName = 'Haven';
    const seriesLabel = 'BO3 · Map pick';
    const viewers = '12.4K';

    const chatLines = [
        { user: 'NEXUS', text: 'What a clutch 🔥', tone: 'text-white/55' },
        { user: 'arena_fan', text: 'LETS GOOO', tone: 'text-primary/90' },
        { user: 'MENA_VAL', text: 'This series is insane', tone: 'text-white/45' },
    ];

    const footerBarText =
        footerHint
        ?? (broadcastMode === 'live'
            ? 'Add an HTTPS stream URL on the match to replace this sample loop with your real broadcast.'
            : '');

    return (
        <div className="flex flex-1 flex-col min-h-0 gap-3 lg:flex-row lg:gap-4">
            <div
                className="flex min-h-[320px] min-w-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#09090b] shadow-[0_0_60px_rgba(0,0,0,0.45)]"
                style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 24px 80px -20px ${accent}18` }}
            >
                <div
                    className={cn(
                        'flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r px-4 py-3',
                        (broadcastMode === 'live' || broadcastMode === 'standby') && 'from-red-500/12 via-black/40 to-black/60',
                        broadcastMode === 'demo' && 'from-primary/15 via-black/40 to-black/60',
                    )}
                >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        {(broadcastMode === 'live' || broadcastMode === 'standby') && (
                            <div className="flex items-center gap-2 rounded-lg border border-red-500/35 bg-red-500/15 px-2.5 py-1">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-40" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-red-300">Live</span>
                            </div>
                        )}
                        {broadcastMode === 'demo' && (
                            <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/15 px-2.5 py-1">
                                <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Preview</span>
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="truncate text-[11px] font-black uppercase tracking-tight text-white">
                                {teamA} <span className="text-white/35">vs</span> {teamB}
                            </p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-white/35">{roundLabel}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white/40">
                            <Radio size={11} className="text-primary/80" />
                            Official broadcast
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white/40">
                            <Users size={11} className="shrink-0 opacity-60" />
                            {viewers}
                        </span>
                    </div>
                </div>

                <div className="relative flex min-h-[min(52vh,420px)] flex-1 flex-col">
                    <div className="relative flex min-h-[280px] flex-1 items-stretch justify-center overflow-hidden bg-black">
                        <img src={broadcastStagePoster} alt="" className="absolute inset-0 z-0 h-full w-full object-cover" draggable={false} />
                        {!videoFailed && ambientStarted ? (
                            <video
                                ref={videoRef}
                                className="absolute inset-0 z-[1] h-full w-full object-cover"
                                poster={broadcastStagePoster}
                                autoPlay
                                muted
                                loop
                                playsInline
                                preload="auto"
                                disablePictureInPicture
                                controls={false}
                                aria-hidden
                                onError={() => setVideoFailed(true)}
                            >
                                <source src={BROADCAST_AMBIENT_VIDEO_MP4} type="video/mp4" />
                            </video>
                        ) : null}
                        {(!ambientStarted || videoFailed) && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (videoFailed) setVideoFailed(false);
                                    else setAmbientStarted(true);
                                }}
                                className="absolute left-1/2 top-1/2 z-[20] flex h-[4.5rem] w-[4.5rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_12px_40px_rgba(0,0,0,0.65)] backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
                                aria-label={videoFailed ? 'Retry broadcast preview' : 'Play broadcast preview'}
                            >
                                <Play size={28} className="ml-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" fill="currentColor" strokeWidth={0} />
                            </button>
                        )}

                        <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-black/80 via-black/50 to-black/85" />
                        <div
                            className="pointer-events-none absolute inset-0 z-[3] opacity-[0.05]"
                            style={{
                                backgroundImage: `linear-gradient(${accent}22 1px, transparent 1px), linear-gradient(90deg, ${accent}18 1px, transparent 1px)`,
                                backgroundSize: '28px 28px',
                            }}
                        />
                        <div
                            className="pointer-events-none absolute inset-0 z-[4] opacity-[0.35]"
                            style={{ background: `radial-gradient(ellipse 85% 55% at 50% 18%, ${accent}28, transparent 60%)` }}
                        />
                        <div
                            className="pointer-events-none absolute inset-0 z-[5] opacity-[0.22]"
                            style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.09) 2px, rgba(0,0,0,0.09) 4px)' }}
                        />

                        <div className="relative z-10 flex w-full flex-col items-center justify-center gap-6 px-6 py-10">
                            <div className="flex w-full max-w-3xl flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                                <div className="flex flex-1 flex-col items-center text-center sm:items-end sm:text-right">
                                    <span className="mb-2 max-w-[200px] truncate text-sm font-black uppercase tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">{teamA}</span>
                                    <span className="font-mono text-5xl font-black tabular-nums text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] sm:text-6xl" style={{ textShadow: `0 0 48px ${accent}55` }}>
                                        {scoreA}
                                    </span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    {(broadcastMode === 'live' || broadcastMode === 'standby') && (
                                        <div className="flex items-center gap-2 rounded-lg border border-red-500/45 bg-black/55 px-3 py-1.5 shadow-[0_0_24px_rgba(239,68,68,0.2)] backdrop-blur-md">
                                            <span className="relative flex h-2 w-2">
                                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-50" />
                                                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-red-200">On air</span>
                                        </div>
                                    )}
                                    {broadcastMode === 'demo' && (
                                        <span className="rounded-full border border-primary/45 bg-black/50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-primary backdrop-blur-md">
                                            Preview feed
                                        </span>
                                    )}
                                    <p className="max-w-[200px] text-center text-[9px] font-bold uppercase leading-snug tracking-widest text-white/50">
                                        {broadcastMode === 'demo'
                                            ? 'Sample loop — not your real stream'
                                            : videoFailed
                                              ? 'Video failed to load — check network or add /live-broadcast-loop.mp4'
                                              : 'Sample broadcast loop until your stream is embedded'}
                                    </p>
                                </div>
                                <div className="flex flex-1 flex-col items-center text-center sm:items-start sm:text-left">
                                    <span className="mb-2 max-w-[200px] truncate text-sm font-black uppercase tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">{teamB}</span>
                                    <span className="font-mono text-5xl font-black tabular-nums text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] sm:text-6xl" style={{ textShadow: `0 0 48px ${accent}44` }}>
                                        {scoreB}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-3">
                                <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/50 backdrop-blur-md">
                                    <MapPin size={12} className="text-primary/70" />
                                    {mapName}
                                </span>
                                <span className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/40 backdrop-blur-md">
                                    {seriesLabel}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-black/75 px-4 py-3">
                        {footerBarText ? (
                            <p className="max-w-[min(100%,52rem)] text-[10px] font-bold uppercase leading-relaxed tracking-wide text-white/40">{footerBarText}</p>
                        ) : null}
                        {streamUrl ? (
                            <a href={streamUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-[10px] font-black uppercase tracking-widest text-black transition-opacity hover:opacity-90">
                                <Play size={14} />
                                Open stream
                            </a>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="flex w-full shrink-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0c0c0e] lg:w-[280px]" style={{ boxShadow: `inset 0 1px 0 ${accent}12` }}>
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                    <MessageCircle size={14} className="text-primary/80" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Live chat</span>
                    <span className="ml-auto text-[9px] font-bold uppercase tracking-widest text-white/25">Demo</span>
                </div>
                <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
                    {chatLines.map((line, i) => (
                        <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-primary/80">{line.user}</p>
                            <p className={cn('mt-0.5 text-[11px] font-medium leading-snug', line.tone)}>{line.text}</p>
                        </div>
                    ))}
                </div>
                <div className="border-t border-white/10 p-3">
                    <div className="rounded-xl border border-dashed border-white/15 bg-black/30 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/20">
                        Chat disabled in preview
                    </div>
                </div>
            </div>
        </div>
    );
}

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

export function SeasonCard({
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
            <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left" onClick={handleExpand}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border" style={{ background: `${accent}15`, borderColor: `${accent}30` }}>
                    <Calendar size={16} style={{ color: accent }} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-black text-white text-sm">{season.name}</span>
                        <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border', SEASON_STATUS_STYLE[season.status] ?? SEASON_STATUS_STYLE.FINISHED)}>
                            {season.status}
                        </span>
                    </div>
                    <p className="text-[11px] text-white/30 font-medium">{startFmt} → {endFmt}</p>
                </div>
                <Layers size={13} className="shrink-0 transition-colors" style={{ color: expanded ? accent : 'rgba(255,255,255,0.2)' }} />
            </button>

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
                                        <span className={cn('flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest whitespace-nowrap', STAGE_TYPE_COLOR[stage.stageType] ?? STAGE_TYPE_COLOR.LEAGUE)}>
                                            {STAGE_TYPE_ICON[stage.stageType]}
                                            {stage.name}
                                        </span>
                                        <span className="text-[9px] text-white/20">
                                            {stage.startAt ? new Date(stage.startAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''}
                                        </span>
                                    </div>
                                    {i < (stagePrev as Stage[]).length - 1 && <div className="w-8 h-px bg-white/10 mx-1 -translate-y-3" />}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
