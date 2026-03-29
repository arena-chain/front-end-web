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
