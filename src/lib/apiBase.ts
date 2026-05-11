/** Global NestJS prefix is `api` (see backend main.ts). */
export function getApiBase(): string {
    const raw =
        import.meta.env.VITE_API_URL ||
        (import.meta.env.DEV ? '/api' : 'http://localhost:3000/api');
    return raw.replace(/\/$/, '');
}

/** Origin for paths outside `/api` (e.g. `/uploads` from ServeStaticModule). */
export function getBackendOrigin(): string {
    const base = getApiBase();
    return base.endsWith('/api') ? base.slice(0, -4) : base;
}

/**
 * Socket.IO server origin. In Vite dev with relative `/api`, use the page origin so
 * `/socket.io` is proxied (see `vite.config.ts`); otherwise use the API origin.
 */
export function getSocketIoOrigin(): string {
    const base = getApiBase();
    if (import.meta.env.DEV && base === '/api') {
        return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    }
    const trimmed = getBackendOrigin().replace(/\/$/, '');
    if (trimmed) return trimmed;
    return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
}

/** Full URL for backend static paths such as `/uploads/...`. */
export function resolveBackendAssetUrl(path: string): string {
    if (path.startsWith('http')) return path;
    const origin = getBackendOrigin().replace(/\/$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${origin}${p}`;
}

/**
 * `/uploads/...` URLs — in Vite dev, keep the path so the dev server proxy can reach the API.
 * Accepts absolute URLs (e.g. stored `http://localhost:3000/uploads/...`) and normalizes to `/uploads/...`
 * in development so requests hit the same-origin proxy instead of a mismatched host/port.
 */
export function resolveUploadsUrl(pathOrUrl: string): string {
    const raw = pathOrUrl.trim();
    if (!raw) return raw;

    let pathname = raw;
    if (raw.startsWith('http')) {
        try {
            const u = new URL(raw);
            pathname = `${u.pathname}${u.search}`;
        } catch {
            return raw;
        }
    }

    const p = pathname.startsWith('/') ? pathname : `/${pathname}`;
    if (p.startsWith('/uploads')) {
        if (import.meta.env.DEV) return p;
        return resolveBackendAssetUrl(p);
    }

    if (raw.startsWith('http')) return raw;
    return resolveBackendAssetUrl(p);
}

/**
 * Key after `/inventory-files/` — dev uses the proxied path; prod uses full backend URL.
 */
export function resolveInventoryFilesUrl(relativePath: string): string {
    const key = relativePath.replace(/^\//, '');
    const path = `/inventory-files/${key}`;
    if (import.meta.env.DEV) {
        return path;
    }
    return resolveBackendAssetUrl(path);
}
