/** Slot keys — keep in sync with `AvatarLayers` / Avatar Studio */
export type AvatarLayerKey = 'base' | 'hair' | 'ears' | 'outfit' | 'accessory';

/**
 * Curated 2D overlay presets for Avatar Studio (composited in the live preview).
 *
 * **Who adds items?** Developers / art pipeline — not the admin user. Drop PNG/WebP files
 * (transparent background) under `public/avatar-presets/<slot>/` and register rows here.
 *
 * **Where do clothes, glasses, etc. come from?**
 * - **Your team:** export sprites or render stills from Blender/Unity, host under `public/`.
 * - **Marketplaces:** buy asset packs (often FBX/OBJ) → convert to PNG overlays or GLB;
 *   for full 3D clothing prefer `outfitCatalog.ts` + `public/models/outfits/*.glb`.
 * - **Free packs:** e.g. Kenney, Quaternius (check each pack’s license).
 * - **Later:** replace or merge this static list with rows from your API / CMS if admins
 *   should manage metadata while files stay on CDN.
 *
 * Admin UI only **selects** `id` / `src`; it does not upload files.
 */
const BASE = import.meta.env.BASE_URL;

export type AvatarLayerPreset = {
    id: string;
    label: string;
    /** Public URL (Vite base + path), or null = “no overlay” for this slot */
    src: string | null;
};

export const AVATAR_LAYER_PRESETS: Record<AvatarLayerKey, AvatarLayerPreset[]> = {
    base: [
        { id: 'none', label: 'None', src: null },
        // Example (uncomment when file exists):
        // { id: 'body_paint_01', label: 'Body paint 01', src: `${BASE}avatar-presets/base/body_paint_01.png` },
    ],
    hair: [
        { id: 'none', label: 'None', src: null },
    ],
    ears: [
        { id: 'none', label: 'None', src: null },
    ],
    outfit: [
        { id: 'none', label: 'None', src: null },
    ],
    accessory: [
        { id: 'none', label: 'None', src: null },
        // Example glasses slot — add real files under public/avatar-presets/accessory/
        // { id: 'glasses_aviator', label: 'Aviator', src: `${BASE}avatar-presets/accessory/glasses_aviator.png` },
    ],
};

export function countLayerPresets(): number {
    return (Object.keys(AVATAR_LAYER_PRESETS) as AvatarLayerKey[]).reduce(
        (sum, key) => sum + AVATAR_LAYER_PRESETS[key].length,
        0,
    );
}
