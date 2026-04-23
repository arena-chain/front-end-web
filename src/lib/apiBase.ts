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

/** Full URL for backend static paths such as `/uploads/...`. */
export function resolveBackendAssetUrl(path: string): string {
    if (path.startsWith('http')) return path;
    const origin = getBackendOrigin().replace(/\/$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${origin}${p}`;
}

/**
 * `/uploads/...` URLs — in Vite dev, keep the path so the dev server proxy can reach the API.
 * In production, resolve to the backend origin (same as {@link resolveBackendAssetUrl}).
 */
export function resolveUploadsUrl(path: string): string {
    const p = path.startsWith('/') ? path : `/${path}`;
    if (import.meta.env.DEV && p.startsWith('/uploads')) {
        return p;
    }
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
