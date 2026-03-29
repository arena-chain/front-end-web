import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Trophy } from 'lucide-react';
import { leagueService, type League } from '../../services/leagueService';
import { seasonService, type Season } from '../../services/seasonService';

type Featured = { league: League; season: Season };

function pickFeatured(leagues: League[], seasonLists: Season[][]): Featured | null {
    const pairs: Featured[] = [];
    leagues.forEach((league, i) => {
        const seasons = seasonLists[i] ?? [];
        for (const season of seasons) pairs.push({ league, season });
    });
    const now = Date.now();
    const ongoing = pairs.filter(p => p.season.status === 'ONGOING');
    if (ongoing.length) {
        ongoing.sort((a, b) => new Date(a.season.endDate).getTime() - new Date(b.season.endDate).getTime());
        return ongoing[0];
    }
    const planned = pairs.filter(p => p.season.status === 'PLANNED');
    const future = planned.filter(p => new Date(p.season.startDate).getTime() > now);
    const pool = future.length ? future : planned;
    if (pool.length) {
        pool.sort((a, b) => new Date(a.season.startDate).getTime() - new Date(b.season.startDate).getTime());
        return pool[0];
    }
    return null;
}

function formatCountdown(ms: number): string {
    if (ms <= 0) return '00:00:00';
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (d > 0) return `${d}d ${pad(h)}:${pad(m)}:${pad(sec)}`;
    return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

const MAX_LEAGUES = 12;

function EmblemFace({
    children,
    z,
    shine,
    flip,
}: {
    children: React.ReactNode;
    z: number;
    shine: boolean;
    flip?: boolean;
}) {
    return (
        <div
            className="absolute inset-0 flex items-center justify-center rounded-2xl overflow-hidden"
            style={{
                transform: flip ? `rotateY(180deg) translateZ(${z}px)` : `translateZ(${z}px)`,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.5) 100%)',
                border: '1px solid rgba(0,255,0,0.28)',
                boxShadow: `
                    0 0 0 1px rgba(0,0,0,0.6),
                    0 20px 50px rgba(0,0,0,0.65),
                    0 0 60px rgba(0,255,0,0.12),
                    inset 0 1px 0 rgba(255,255,255,0.12)
                `,
            }}
        >
            {shine && (
                <div
                    className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl"
                    style={{ opacity: 0.35 }}
                >
                    <div
                        className="absolute inset-0"
                        style={{
                            width: '40%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                            animation: 'league-shine 4.5s ease-in-out infinite',
                        }}
                    />
                </div>
            )}
            {children}
        </div>
    );
}

export function HeroLeagueSpotlight() {
    const [featured, setFeatured] = useState<Featured | null>(null);
    const [fetchDone, setFetchDone] = useState(false);
    const [reveal, setReveal] = useState(false);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const leagues = await leagueService.getAllLeagues();
                const slice = leagues.slice(0, MAX_LEAGUES);
                const seasonLists = await Promise.all(
                    slice.map(l => seasonService.getByLeague(l._id).catch(() => [] as Season[])),
                );
                if (cancelled) return;
                setFeatured(pickFeatured(slice, seasonLists));
            } catch {
                if (!cancelled) setFeatured(null);
            } finally {
                if (!cancelled) setFetchDone(true);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!fetchDone) return;
        const id = window.setTimeout(() => setReveal(true), 520);
        return () => clearTimeout(id);
    }, [fetchDone]);

    useEffect(() => {
        const id = window.setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(id);
    }, []);

    const timer = useMemo(() => {
        void tick;
        if (!featured) return { label: '', value: '', sub: '' as string | null };
        const { season } = featured;
        const now = Date.now();
        if (season.status === 'ONGOING') {
            const end = new Date(season.endDate).getTime();
            const left = end - now;
            return {
                label: 'Season ends in',
                value: formatCountdown(left),
                sub: left <= 0 ? 'Final stretch' : null,
            };
        }
        if (season.status === 'PLANNED') {
            const start = new Date(season.startDate).getTime();
            const left = start - now;
            return {
                label: left > 0 ? 'Starts in' : 'Opening',
                value: left > 0 ? formatCountdown(left) : formatCountdown(0),
                sub: left <= 0 ? new Date(season.startDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : null,
            };
        }
        return { label: featured.season.name, value: '', sub: null };
    }, [featured, tick]);

    const hubHref = featured
        ? `/leagues/${featured.league._id}/seasons/${featured.season._id}`
        : '/leagues';

    const showLogoSpin = reveal && fetchDone;

    return (
        <div className="flex flex-col items-center mb-10">
            <style>{`
                @keyframes hero-league-reveal {
                    0% {
                        opacity: 0;
                        transform: perspective(900px) translateY(28px) scale(0.72) rotateX(18deg);
                        filter: blur(14px);
                    }
                    55% {
                        filter: blur(0);
                    }
                    100% {
                        opacity: 1;
                        transform: perspective(900px) translateY(0) scale(1) rotateX(0deg);
                        filter: blur(0);
                    }
                }
                @keyframes league-emblem-y-spin {
                    from { transform: rotateY(0deg); }
                    to { transform: rotateY(360deg); }
                }
                @keyframes league-orbit-glow {
                    0%, 100% { opacity: 0.45; transform: scale(1); }
                    50% { opacity: 0.85; transform: scale(1.06); }
                }
                @keyframes league-shine {
                    0% { transform: translateX(-120%) skewX(-12deg); }
                    100% { transform: translateX(220%) skewX(-12deg); }
                }
                @keyframes league-dashed-orbit {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>

            <div
                className="relative flex flex-col items-center"
                style={{
                    opacity: reveal ? 1 : 0,
                    animation: reveal ? 'hero-league-reveal 1.15s cubic-bezier(0.22, 1, 0.36, 1) forwards' : 'none',
                    pointerEvents: reveal ? 'auto' : 'none',
                }}
            >
                {/* Ambient rings */}
                <div
                    className="absolute pointer-events-none rounded-full"
                    style={{
                        width: 200,
                        height: 200,
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'radial-gradient(circle, rgba(0,255,0,0.14) 0%, transparent 68%)',
                        filter: 'blur(16px)',
                        animation: showLogoSpin ? 'league-orbit-glow 3.2s ease-in-out infinite' : 'none',
                    }}
                />
                <div
                    className="absolute pointer-events-none rounded-full"
                    style={{
                        width: 168,
                        height: 168,
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        border: '1px solid rgba(0,255,0,0.12)',
                        boxShadow: '0 0 40px rgba(0,255,0,0.06), inset 0 0 30px rgba(0,255,0,0.04)',
                    }}
                />
                <div
                    className="absolute pointer-events-none rounded-full"
                    style={{
                        width: 186,
                        height: 186,
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    <div
                        className="w-full h-full rounded-full"
                        style={{
                            border: '1px dashed rgba(0,255,0,0.08)',
                            animation: showLogoSpin ? 'league-dashed-orbit 24s linear infinite' : 'none',
                        }}
                    />
                </div>

                {/* 3D stage */}
                <div
                    className="relative mb-5 mx-auto"
                    style={{
                        width: 104,
                        height: 104,
                        perspective: 920,
                        perspectiveOrigin: '50% 42%',
                    }}
                >
                    <div
                        className="relative w-full h-full"
                        style={{
                            transformStyle: 'preserve-3d',
                            animation: showLogoSpin ? 'league-emblem-y-spin 22s linear infinite' : 'none',
                            willChange: 'transform',
                        }}
                    >
                        {featured?.league.logoUrl ? (
                            <>
                                <EmblemFace z={14} shine={showLogoSpin}>
                                    <img
                                        src={featured.league.logoUrl}
                                        alt=""
                                        className="relative z-[1] w-[72px] h-[72px] object-contain"
                                        style={{ filter: 'drop-shadow(0 0 12px rgba(0,255,0,0.35))' }}
                                        draggable={false}
                                    />
                                </EmblemFace>
                                <EmblemFace z={14} shine={false} flip>
                                    <img
                                        src={featured.league.logoUrl}
                                        alt=""
                                        className="relative z-[1] w-[72px] h-[72px] object-contain"
                                        style={{ filter: 'drop-shadow(0 0 12px rgba(0,255,0,0.35))' }}
                                        draggable={false}
                                    />
                                </EmblemFace>
                            </>
                        ) : (
                            <>
                                <EmblemFace z={14} shine={showLogoSpin}>
                                    <Trophy
                                        className="relative z-[1] w-12 h-12"
                                        style={{ color: '#00ff00', filter: 'drop-shadow(0 0 14px rgba(0,255,0,0.5))' }}
                                        strokeWidth={1.75}
                                    />
                                </EmblemFace>
                                <EmblemFace z={14} shine={false} flip>
                                    <Trophy
                                        className="relative z-[1] w-12 h-12"
                                        style={{ color: '#00ff00', filter: 'drop-shadow(0 0 14px rgba(0,255,0,0.5))' }}
                                        strokeWidth={1.75}
                                    />
                                </EmblemFace>
                            </>
                        )}
                    </div>
                </div>

                {/* League / season copy */}
                <div className="text-center max-w-md px-4">
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3"
                        style={{
                            background: 'rgba(0,255,0,0.06)',
                            border: '1px solid rgba(0,255,0,0.18)',
                        }}
                    >
                        <span className="relative flex h-1.5 w-1.5">
                            <span
                                className="absolute inline-flex h-full w-full rounded-full opacity-75"
                                style={{ background: '#00ff00', animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite' }}
                            />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#00ff00]" />
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.28em]" style={{ color: '#00ff00' }}>
                            {featured?.season.status === 'ONGOING'
                                ? 'Live league'
                                : featured?.season.status === 'PLANNED'
                                    ? 'Upcoming'
                                    : 'Arena leagues'}
                        </span>
                    </div>

                    <Link
                        to={hubHref}
                        className="group block"
                        style={{ textDecoration: 'none' }}
                    >
                        <h2
                            className="text-sm md:text-base font-black uppercase tracking-tight text-white mb-1 transition-colors group-hover:text-[#00ff00]"
                            style={{ textShadow: '0 0 40px rgba(0,255,0,0.15)' }}
                        >
                            {featured ? featured.league.name : 'Arena Chain Leagues'}
                        </h2>
                        {featured && (
                            <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                {featured.season.name}
                            </p>
                        )}
                    </Link>

                    {/* Timer strip */}
                    <div
                        className="mx-auto rounded-xl px-4 py-3 max-w-xs"
                        style={{
                            background: 'rgba(0,0,0,0.45)',
                            border: '1px solid rgba(0,255,0,0.15)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
                        }}
                    >
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <Clock size={12} style={{ color: 'rgba(0,255,0,0.65)' }} />
                            <span className="text-[9px] font-black uppercase tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                {featured ? timer.label : 'Explore schedules'}
                            </span>
                        </div>
                        <div
                            className="font-black tabular-nums tracking-wider text-center"
                            style={{
                                fontSize: 'clamp(1.15rem, 3.5vw, 1.35rem)',
                                color: '#00ff00',
                                textShadow: '0 0 24px rgba(0,255,0,0.35)',
                            }}
                        >
                            {featured ? timer.value : '—'}
                        </div>
                        {timer.sub && (
                            <p className="text-[10px] font-semibold text-center mt-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                {timer.sub}
                            </p>
                        )}
                        {!featured && fetchDone && (
                            <p className="text-[10px] font-semibold text-center mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                <Link to="/leagues" className="underline-offset-2 hover:underline" style={{ color: 'rgba(0,255,0,0.75)' }}>
                                    View all leagues
                                </Link>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
