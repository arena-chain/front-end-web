/**
 * Selectable 3D outfits for Avatar Studio (glTF/GLB only — <model-viewer> does not load .obj).
 *
 * Add more files under `public/models/outfits/*.glb` and append entries here.
 * `outfit_default.glb` was generated from `src/assets/uploads_files_4054159_1/mesh/1.obj`
 * (textures were not in that folder; drop 1_Diffuse.tga etc. next to the .obj and re-run
 * `npx obj2gltf -i .../1.obj -o public/models/outfits/outfit_default.glb` to bake them in).
 */
const BASE = import.meta.env.BASE_URL;

export type OutfitCatalogEntry = {
    id: string;
    label: string;
    /** Relative to Vite base, or null = no extra mesh */
    glbPath: string | null;
};

export const OUTFIT_MODEL_CATALOG: OutfitCatalogEntry[] = [
    { id: 'none', label: 'None (body only)', glbPath: null },
    { id: 'outfit_default', label: 'Imported outfit (OBJ export)', glbPath: `${BASE}models/outfits/outfit_default.glb` },
];

export function resolveOutfitModelUrl(id: string): string | null {
    return OUTFIT_MODEL_CATALOG.find((e) => e.id === id)?.glbPath ?? null;
}
