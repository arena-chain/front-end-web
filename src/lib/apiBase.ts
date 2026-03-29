/** Global NestJS prefix is `api` (see backend main.ts). */
export function getApiBase(): string {
    const raw = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    return raw.replace(/\/$/, '');
}
