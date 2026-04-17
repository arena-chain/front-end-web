/** Community Valorant API — https://valorant-api.com/ */

const VALORANT_AGENTS_URL = 'https://valorant-api.com/v1/agents';

export type ValorantAgentLite = {
    uuid: string;
    displayName: string;
    background: string;
    displayIcon: string;
    fullPortrait: string;
    roleName?: string;
};

type ApiAgent = {
    uuid: string;
    displayName: string;
    background: string | null;
    displayIcon: string | null;
    fullPortrait: string | null;
    isPlayableCharacter?: boolean;
    role?: { displayName: string };
};

export async function fetchPlayableValorantAgents(): Promise<ValorantAgentLite[]> {
    const r = await fetch(VALORANT_AGENTS_URL);
    if (!r.ok) throw new Error(`Valorant API ${r.status}`);
    const json = (await r.json()) as { status: number; data?: ApiAgent[] };
    const data = json.data ?? [];
    return data
        .filter(
            (a) =>
                a.isPlayableCharacter === true &&
                typeof a.fullPortrait === 'string' &&
                a.fullPortrait.length > 0,
        )
        .map((a) => ({
            uuid: a.uuid,
            displayName: a.displayName,
            background: (typeof a.background === 'string' && a.background) || '',
            displayIcon: (typeof a.displayIcon === 'string' && a.displayIcon) || '',
            fullPortrait: a.fullPortrait as string,
            roleName: a.role?.displayName,
        }))
        .sort((x, y) => x.displayName.localeCompare(y.displayName));
}
