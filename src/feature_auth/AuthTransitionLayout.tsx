import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

const variants = {
    enter: (dir: number) =>
        dir === 0 ? { x: 0, opacity: 1 } : { x: dir > 0 ? '-100%' : '100%', opacity: 0.85 },
    center: { x: 0, opacity: 1 },
    exit: (dir: number) =>
        dir === 0 ? { x: 0, opacity: 1 } : { x: dir > 0 ? '100%' : '-100%', opacity: 0.85 },
};

/**
 * Full-viewport slide between /login and /register (LoL ↔ Valorant) while keeping real routes.
 */
export default function AuthTransitionLayout() {
    const location = useLocation();
    const [syncedPath, setSyncedPath] = useState(location.pathname);
    const [slideDir, setSlideDir] = useState(0);

    let customDir = slideDir;
    if (location.pathname !== syncedPath) {
        if (syncedPath === '/login' && location.pathname === '/register') customDir = 1;
        else if (syncedPath === '/register' && location.pathname === '/login') customDir = -1;
        else customDir = 0;
        setSlideDir(customDir);
        setSyncedPath(location.pathname);
    }

    return (
        <div className="relative min-h-dvh min-h-screen w-full overflow-x-hidden bg-zinc-950">
            <AnimatePresence initial={false} mode="popLayout" custom={customDir}>
                <motion.div
                    key={location.pathname}
                    custom={customDir}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 w-full min-h-dvh min-h-screen"
                >
                    <Outlet />
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
