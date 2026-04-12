import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { fetchAllLolChampionSplashes, type LolChampionSplash } from '../../services/lolChampions.service';
import { AUTH_CROSSFADE_SECONDS, AUTH_SLIDE_INTERVAL_MS, AUTH_ZOOM_SECONDS } from './authBackdropTiming';

type AuthLeagueBackdropProps = {
    fallbackSrc: string;
    className?: string;
    objectFocus?: 'left' | 'right' | 'center';
    /** Time between slide changes; `0` = one random splash only */
    rotateIntervalMs?: number;
};

function pickRandomSplash(pool: LolChampionSplash[], avoidUrl?: string): LolChampionSplash {
    if (pool.length === 0) throw new Error('empty pool');
    if (pool.length === 1) return pool[0];
    let next = pool[Math.floor(Math.random() * pool.length)];
    let guard = 0;
    while (next.splashUrl === avoidUrl && guard++ < 12) {
        next = pool[Math.floor(Math.random() * pool.length)];
    }
    return next;
}

const crossfadeTransition = {
    duration: AUTH_CROSSFADE_SECONDS,
    ease: [0.45, 0, 0.55, 1] as const,
};

const zoomTransition = {
    duration: AUTH_ZOOM_SECONDS,
    ease: 'linear' as const,
};

/**
 * LoL splashes: long crossfade + slow zoom, then next champion after `rotateIntervalMs`.
 */
export default function AuthLeagueBackdrop({
    fallbackSrc,
    className,
    objectFocus = 'right',
    rotateIntervalMs = AUTH_SLIDE_INTERVAL_MS,
}: AuthLeagueBackdropProps) {
    const [splash, setSplash] = useState<{ url: string; name: string } | null>(null);
    const poolRef = useRef<LolChampionSplash[]>([]);

    useEffect(() => {
        let cancelled = false;
        let timer: ReturnType<typeof setInterval> | undefined;

        fetchAllLolChampionSplashes()
            .then((list) => {
                if (cancelled || !list?.length) return;
                poolRef.current = list;
                const first = pickRandomSplash(list);
                setSplash({ url: first.splashUrl, name: first.name });

                if (rotateIntervalMs > 0) {
                    timer = setInterval(() => {
                        setSplash((prev) => {
                            const pool = poolRef.current;
                            if (!pool.length) return prev;
                            const next = pickRandomSplash(pool, prev?.url);
                            return { url: next.splashUrl, name: next.name };
                        });
                    }, rotateIntervalMs);
                }
            })
            .catch(() => {});

        return () => {
            cancelled = true;
            if (timer) clearInterval(timer);
        };
    }, [rotateIntervalMs]);

    const src = splash?.url ?? fallbackSrc;
    const label = splash?.name ? `${splash.name} splash art` : 'League of Legends artwork';
    const slideKey = splash ? splash.url : `fallback:${fallbackSrc}`;

    const objectPositionClass =
        objectFocus === 'left'
            ? 'object-left'
            : objectFocus === 'center'
              ? 'object-center'
              : 'object-[right_38%]';

    return (
        <div className={cn('absolute inset-0 z-0 overflow-hidden bg-zinc-900', className)}>
            <AnimatePresence initial={false} mode="sync">
                <motion.div
                    key={slideKey}
                    className="pointer-events-none absolute inset-0 z-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={crossfadeTransition}
                >
                    <motion.div
                        className="absolute inset-0 origin-center"
                        initial={{ scale: 1 }}
                        animate={{ scale: 1.1 }}
                        transition={zoomTransition}
                    >
                        <img
                            src={src}
                            alt=""
                            aria-hidden
                            onError={() => {
                                setSplash((prev) => (prev ? null : prev));
                            }}
                            className={cn(
                                'absolute inset-0 h-full w-full min-h-full min-w-full object-cover will-change-transform',
                                objectPositionClass,
                            )}
                        />
                    </motion.div>
                </motion.div>
            </AnimatePresence>
            <span className="sr-only">{label}</span>
        </div>
    );
}
