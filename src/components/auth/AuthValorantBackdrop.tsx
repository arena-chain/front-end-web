import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { fetchPlayableValorantAgents, type ValorantAgentLite } from '../../services/valorantAgents.service';
import { cn } from '../../lib/utils';
import valorantLogoCover from '../../assets/valorant_login.png';
import { AUTH_CROSSFADE_SECONDS, AUTH_ZOOM_SECONDS } from './authBackdropTiming';

type AuthValorantBackdropProps = {
    fallbackSrc: string;
    overlayStrength?: number;
    className?: string;
    /** When positive, advance to another random agent every N ms */
    rotateIntervalMs?: number;
    /** Crossfade duration between agents (seconds); defaults to slow cinematic */
    crossfadeSeconds?: number;
    /** Ken Burns zoom duration per agent (seconds); defaults to slow */
    zoomSeconds?: number;
    layout?: 'login' | 'register' | 'showcase';
    showcaseFormOn?: 'left' | 'right';
    hideBrandPlate?: boolean;
};

type AgentLayers = { background: string; fullPortrait: string };

function pickRandomAgent(pool: ValorantAgentLite[], avoidPortrait?: string): ValorantAgentLite {
    if (pool.length === 0) throw new Error('empty pool');
    if (pool.length === 1) return pool[0];
    let a = pool[Math.floor(Math.random() * pool.length)];
    let guard = 0;
    while (a.fullPortrait === avoidPortrait && guard++ < 12) {
        a = pool[Math.floor(Math.random() * pool.length)];
    }
    return a;
}

export default function AuthValorantBackdrop({
    fallbackSrc,
    overlayStrength = 0.45,
    className,
    layout = 'login',
    showcaseFormOn = 'left',
    hideBrandPlate = false,
    rotateIntervalMs,
    crossfadeSeconds = AUTH_CROSSFADE_SECONDS,
    zoomSeconds = AUTH_ZOOM_SECONDS,
}: AuthValorantBackdropProps) {
    const crossfadeTransition = useMemo(
        () => ({
            duration: crossfadeSeconds,
            ease: [0.45, 0, 0.55, 1] as const,
        }),
        [crossfadeSeconds],
    );

    const zoomTransition = useMemo(
        () => ({
            duration: zoomSeconds,
            ease: 'linear' as const,
        }),
        [zoomSeconds],
    );
    const isRegister = layout === 'register';
    const isShowcase = layout === 'showcase';
    const isLogin = layout === 'login';
    const showcaseFormRight = isShowcase && showcaseFormOn === 'right';
    const [layers, setLayers] = useState<AgentLayers | null>(null);
    const agentsRef = useRef<ValorantAgentLite[]>([]);

    useEffect(() => {
        let cancelled = false;
        let timer: ReturnType<typeof setInterval> | undefined;

        fetchPlayableValorantAgents()
            .then((list) => {
                if (cancelled || list.length === 0) return;
                agentsRef.current = list;
                const first = pickRandomAgent(list);
                setLayers({
                    background: first.background || first.fullPortrait,
                    fullPortrait: first.fullPortrait,
                });

                const ms = rotateIntervalMs ?? 0;
                if (ms > 0) {
                    timer = setInterval(() => {
                        setLayers((prev) => {
                            const pool = agentsRef.current;
                            if (!pool.length) return prev;
                            const next = pickRandomAgent(pool, prev?.fullPortrait);
                            return {
                                background: next.background || next.fullPortrait,
                                fullPortrait: next.fullPortrait,
                            };
                        });
                    }, ms);
                }
            })
            .catch(() => {
                if (!cancelled) setLayers(null);
            });
        return () => {
            cancelled = true;
            if (timer) clearInterval(timer);
        };
    }, [rotateIntervalMs]);

    const bgOpacity = isShowcase ? 'opacity-[0.16]' : isLogin ? 'opacity-[0.18]' : 'opacity-[0.4]';

    const portraitClass = cn(
        'pointer-events-none absolute w-auto object-contain',
        isShowcase || isLogin
            ? 'z-[4] drop-shadow-[0_8px_48px_rgba(0,0,0,0.35)]'
            : 'z-[2] drop-shadow-[0_0_60px_rgba(0,0,0,0.85)]',
        isShowcase &&
            'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-center h-[min(92dvh,980px)] max-h-[980px] max-w-[min(96%,560px)] sm:max-w-[min(94%,640px)] lg:max-w-[min(92%,760px)]',
        isRegister &&
            !isShowcase &&
            'bottom-0 left-[-4%] right-auto h-[min(96vh,100%)] max-w-[min(52vw,720px)] object-left object-bottom sm:left-0 lg:max-w-[min(46vw,680px)]',
        !isRegister &&
            !isShowcase &&
            'bottom-0 right-[-4%] left-auto h-[min(96vh,100%)] max-w-[min(72vw,900px)] object-bottom sm:right-0 sm:max-w-[min(58vw,820px)]',
    );

    return (
        <div className={cn('absolute inset-0 z-0 overflow-hidden bg-black', className)}>
            {!hideBrandPlate && (
                <img
                    src={valorantLogoCover}
                    alt=""
                    aria-hidden
                    className={cn(
                        'absolute inset-0 z-0 h-full w-full object-cover object-center scale-105',
                        isShowcase ? 'opacity-[0.26]' : isLogin ? 'opacity-[0.32]' : 'opacity-[0.55]',
                    )}
                />
            )}

            {layers ? (
                <AnimatePresence initial={false} mode="sync">
                    <motion.div
                        key={layers.fullPortrait}
                        className="absolute inset-0 z-[1]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={crossfadeTransition}
                    >
                        <motion.div
                            className="absolute inset-0 origin-center will-change-transform"
                            initial={{ scale: 1 }}
                            animate={{ scale: 1.08 }}
                            transition={zoomTransition}
                        >
                            <img
                                src={layers.background}
                                alt=""
                                aria-hidden
                                className={cn(
                                    'absolute inset-0 z-[1] h-full w-full object-cover object-center',
                                    bgOpacity,
                                )}
                            />
                            <img
                                src={layers.fullPortrait}
                                alt=""
                                aria-hidden
                                className={portraitClass}
                            />
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            ) : (
                <img
                    src={fallbackSrc}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 z-[1] h-full w-full object-cover object-center"
                />
            )}

            <div
                className={cn(
                    'pointer-events-none absolute inset-0 z-[3]',
                    isShowcase &&
                        !showcaseFormRight &&
                        'bg-gradient-to-r from-black/50 via-black/8 to-transparent sm:from-black/40',
                    isShowcase &&
                        showcaseFormRight &&
                        'bg-gradient-to-r from-transparent via-black/8 to-black/[0.38] sm:to-black/32',
                    isRegister &&
                        !isShowcase &&
                        'bg-gradient-to-r from-black via-black/80 to-black/25 sm:via-black/65',
                    isLogin && 'bg-gradient-to-r from-black via-black/52 to-transparent sm:via-black/38',
                    !isRegister && !isShowcase && !isLogin && 'bg-gradient-to-r from-black via-black/75 to-transparent sm:via-black/55',
                )}
                aria-hidden
            />
            <div
                className="pointer-events-none absolute inset-0 z-[3] bg-black"
                style={{
                    opacity: overlayStrength * (isShowcase ? 0.1 : isLogin ? 0.16 : 0.35),
                }}
                aria-hidden
            />
            <div
                className={cn(
                    'pointer-events-none absolute inset-0 z-[3]',
                    isShowcase
                        ? 'bg-gradient-to-t from-black/28 via-transparent to-black/12'
                        : isLogin
                          ? 'bg-gradient-to-t from-black/40 via-transparent to-black/16'
                          : 'bg-gradient-to-t from-black via-transparent to-black/30',
                )}
                aria-hidden
            />
        </div>
    );
}
