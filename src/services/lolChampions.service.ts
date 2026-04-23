/**
 * League of Legends Data Dragon — champion list + splash art URLs.
 * @see https://developer.riotgames.com/docs/lol#data-dragon
 */

const VERSIONS_URL = 'https://ddragon.leagueoflegends.com/api/versions.json';

const FETCH_TIMEOUT_MS = 12_000;

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
        return await fetch(url, { signal: ctrl.signal });
    } finally {
        clearTimeout(t);
    }
}

export type LolChampionSplash = {
    id: string;
    name: string;
    splashUrl: string;
};

type ChampionJsonEntry = {
    id: string;
    name: string;
    key: string;
};

/** Latest patch + champion.json once; map every champion to default splash (`_0`). */
export async function fetchAllLolChampionSplashes(): Promise<LolChampionSplash[] | null> {
    const versionsRes = await fetchWithTimeout(VERSIONS_URL, FETCH_TIMEOUT_MS);
    if (!versionsRes.ok) return null;
    const versions = (await versionsRes.json()) as string[];
    const version = versions[0];
    if (!version) return null;

    const champRes = await fetchWithTimeout(
        `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
        FETCH_TIMEOUT_MS,
    );
    if (!champRes.ok) return null;

    const json = (await champRes.json()) as { data?: Record<string, ChampionJsonEntry> };
    const data = json.data;
    if (!data) return null;

    const list = Object.values(data).filter((c) => c?.id && c?.name);
    if (list.length === 0) return null;

    return list.map((c) => ({
        id: c.id,
        name: c.name,
        splashUrl: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${c.id}_0.jpg`,
    }));
}

/** Resolves latest patch, loads champion.json, returns one random splash (`_0`). */
export async function fetchRandomLolChampionSplash(): Promise<LolChampionSplash | null> {
    const all = await fetchAllLolChampionSplashes();
    if (!all?.length) return null;
    return all[Math.floor(Math.random() * all.length)];
}
