import { useEffect, useState } from 'react';

/**
 * Subscribes to a CSS media query (e.g. `(min-width: 768px)`).
 * SSR / first paint: returns `defaultValue` until `window` is available.
 */
export function useMediaQuery(query: string, defaultValue = false): boolean {
    const [matches, setMatches] = useState(() => {
        if (typeof window === 'undefined') return defaultValue;
        return window.matchMedia(query).matches;
    });

    useEffect(() => {
        const mq = window.matchMedia(query);
        const onChange = () => setMatches(mq.matches);
        onChange();
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, [query]);

    return matches;
}
