/** Global NestJS prefix is `api` (see backend main.ts). */
export function getApiBase(): string {
    const raw = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
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
 * Nest serves GLBs at `/inventory-files/...` (not under `/api`).
 * In Vite dev, use a same-origin path so `vite.config.ts` can proxy to the API
 * — `<model-viewer>` often fails on cross-origin GLB loads without CORS tweaks.
 */
export function resolveInventoryFilesUrl(relativePath: string): string {
    const clean = relativePath.replace(/^\//, '');
    const path = `/inventory-files/${clean}`;
    if (import.meta.env.DEV) {
        return path;
    }
    return resolveBackendAssetUrl(path);
}

/** Same-origin `/uploads/...` in dev (proxy), full URL in production. */
export function resolveUploadsUrl(path: string): string {
    if (path.startsWith('http')) return path;
    const p = path.startsWith('/') ? path : `/${path}`;
    if (import.meta.env.DEV && p.startsWith('/uploads')) {
        return p;
    }
    return resolveBackendAssetUrl(p);
}
