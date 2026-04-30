import type { CurrencyPackRow } from '../services/gameToken.service';

/** Same-origin / same-browser as admin — merged into player GET /currency/packs results. */
export const LOCAL_CURRENCY_PACKS_STORAGE_KEY = 'arena-currency-packs-local-v1';
const LEGACY_OFFERS_KEY = 'arena-admin-currency-offers-v1';

export function isLocalCurrencyPackId(id: string): boolean {
    return typeof id === 'string' && id.startsWith('local-');
}

function coercePack(raw: unknown): CurrencyPackRow | null {
    if (!raw || typeof raw !== 'object') return null;
    const o = raw as Record<string, unknown>;
    const id = typeof o.id === 'string' ? o.id.trim() : '';
    const title = typeof o.title === 'string' ? o.title.trim() : '';
    const grant = Number(o.grantWholeTokens);
    const cents = Number(o.priceCents);
    const currency = typeof o.priceCurrency === 'string' && o.priceCurrency.trim() ? o.priceCurrency.trim().toUpperCase() : 'EUR';
    const active = o.active !== false;
    const sortOrder = Number.isFinite(Number(o.sortOrder)) ? Number(o.sortOrder) : 0;
    const description =
        typeof o.description === 'string' && o.description.trim() ? o.description.trim() : null;
    if (!id || !title || !Number.isFinite(grant) || grant <= 0 || !Number.isFinite(cents) || cents < 0) return null;
    return {
        id,
        title,
        description,
        grantWholeTokens: Math.floor(grant),
        priceCents: Math.round(cents),
        priceCurrency: currency.length <= 8 ? currency : currency.slice(0, 8),
        active,
        sortOrder,
    };
}

function migrateLegacyOffersV1(): CurrencyPackRow[] {
    try {
        const raw = localStorage.getItem(LEGACY_OFFERS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return [];
        const out: CurrencyPackRow[] = [];
        let i = 0;
        for (const row of parsed) {
            if (!row || typeof row !== 'object') continue;
            const r = row as Record<string, unknown>;
            const idRaw = typeof r.id === 'string' ? r.id : String(r.id ?? '');
            const label = typeof r.label === 'string' ? r.label.trim() : '';
            const amountTokens = typeof r.amountTokens === 'string' ? r.amountTokens.trim() : '';
            const grant = Math.max(0, Math.floor(Number(amountTokens)) || 0);
            if (!label || grant <= 0) continue;
            const priceNote = typeof r.priceNote === 'string' ? r.priceNote : '';
            const priceCents = parsePriceNoteToCents(priceNote);
            const priceCurrency = parseCurrencyFromPriceNote(priceNote);
            const active = r.active !== false;
            const id = idRaw.startsWith('local-') ? idRaw : `local-${idRaw || `m${i}`}`;
            out.push({
                id,
                title: label,
                description: null,
                grantWholeTokens: grant,
                priceCents,
                priceCurrency,
                active,
                sortOrder: i * 10,
            });
            i += 1;
        }
        return out;
    } catch {
        return [];
    }
}

function parsePriceNoteToCents(note: string): number {
    const normalized = note.replace(',', '.');
    const m = normalized.match(/(\d+(?:\.\d+)?)/);
    if (!m) return 0;
    const n = parseFloat(m[1]!);
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 100);
}

function parseCurrencyFromPriceNote(note: string): string {
    if (/€|eur/i.test(note)) return 'EUR';
    if (/£|gbp/i.test(note)) return 'GBP';
    if (/\$|usd/i.test(note)) return 'USD';
    if (/tnd/i.test(note)) return 'TND';
    return 'EUR';
}

/** Packs edited in Arena Admin → Economy → Currency offers (this browser). */
export function readLocalCurrencyPacks(): CurrencyPackRow[] {
    try {
        const raw = localStorage.getItem(LOCAL_CURRENCY_PACKS_STORAGE_KEY);
        if (!raw) {
            const migrated = migrateLegacyOffersV1();
            if (migrated.length) {
                saveLocalCurrencyPacks(migrated);
                localStorage.removeItem(LEGACY_OFFERS_KEY);
            }
            return migrated;
        }
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return [];
        return parsed.map(coercePack).filter((p): p is CurrencyPackRow => p != null);
    } catch {
        return [];
    }
}

export function saveLocalCurrencyPacks(packs: CurrencyPackRow[]): void {
    localStorage.setItem(LOCAL_CURRENCY_PACKS_STORAGE_KEY, JSON.stringify(packs));
}

export function mergeRemoteAndLocalPacks(remote: CurrencyPackRow[], local: CurrencyPackRow[]): CurrencyPackRow[] {
    const activeRemote = remote.filter((p) => p.active !== false);
    const activeLocal = local.filter((p) => p.active !== false);
    const ids = new Set(activeRemote.map((p) => p.id));
    const out = [...activeRemote];
    for (const p of activeLocal) {
        if (!ids.has(p.id)) {
            out.push(p);
            ids.add(p.id);
        }
    }
    return out.sort((a, b) => (a.sortOrder - b.sortOrder) || (a.grantWholeTokens - b.grantWholeTokens));
}
