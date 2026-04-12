/**
 * Selectable 3D weapons for the Weapon Studio tab.
 *
 * GLBs are expected under **`uploads/inventory/`** on the Nest server (served at
 * `/uploads/inventory/...`). In Vite dev, `/uploads` is proxied to the API.
 */
import { resolveUploadsUrl } from '../../lib/apiBase';

/** Must match `GameId` in `NftManager.tsx`. */
export type WeaponGameId = 'cs2' | 'valorant' | 'lol' | 'dota2';

export type WeaponEntry = {
    id: string;
    label: string;
    type: string;
    glbPath: string;
    gameId: WeaponGameId;
};

/** Path inside `uploads/inventory/` (no leading slash). */
const inv = (relative: string) =>
    resolveUploadsUrl(`/uploads/inventory/${relative.replace(/^\//, '')}`);

export const WEAPON_CATALOG: WeaponEntry[] = [
    {
        id: 'valorant_vandal',
        label: 'Vandal',
        type: 'Rifle',
        gameId: 'valorant',
        glbPath: inv('weapens/valorant/vandel.glb'),
    },
    {
        id: 'cs2_ak47',
        label: 'AK-47',
        type: 'Assault',
        gameId: 'cs2',
        glbPath: inv('weapens/cs2/ak-47-based.glb'),
    },
];

export function weaponsForGame(gameId: WeaponGameId): WeaponEntry[] {
    return WEAPON_CATALOG.filter((w) => w.gameId === gameId);
}
