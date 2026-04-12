/**
 * Applies Avatar Studio UI state to the live <model-viewer> / Three.js scene.
 *
 * **Eye color:** Tries PBR materials named `eyes` / `iris` / `cornea` etc., then traverses the
 * scene for meshes/materials whose names suggest eyes (skips `eyebrow`). If nothing matches,
 * eye color is blended into the shared `head` material so the face still reacts live (weaker
 * fidelity until the GLB exposes separate eye materials).
 *
 * **Animations:** Call `startAvatarPreviewAnimation()` after `load` — plays an embedded clip if the
 * GLB includes animations (idle/stand/breathe names preferred). No clips = no motion.
 *
 * **Morphs / blend shapes:** Not driven here; the bundled `BodyMaleTemplate.glb` has no morph targets.
 * Rich facial expression needs blend shapes or bones in the asset.
 */
import { $scene } from '@google/model-viewer/lib/model-viewer-base.js';
import type { ModelScene } from '@google/model-viewer/lib/three-components/ModelScene.js';
import type { RGB } from '@google/model-viewer/lib/three-components/gltf-instance/gltf-2.0.js';
import { Color } from 'three';
import type { Group, Mesh, MeshStandardMaterial, Object3D } from 'three';

export type AvatarDynamicUiConfig = {
    skinTone: string;
    hairColor: string;
    eyeColor: string;
    aura: string;
    bodyType: string;
    /** 0–100 → uniform body scale around the model root */
    bodySize: number;
    /** 0–100 → local scale on the `head` material mesh under Body_low */
    headSize: number;
};

const AURA_EMISSIVE: Record<string, RGB> = {
    Neon: [0.12, 0.55, 0.28],
    Ice: [0.15, 0.35, 0.75],
    Shadow: [0.22, 0.08, 0.35],
    Fire: [0.65, 0.18, 0.06],
    Gold: [0.55, 0.38, 0.08],
};

function hexToRgb01(hex: string): RGB {
    const h = hex.replace('#', '').trim();
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const n = Number.parseInt(full, 16);
    if (!Number.isFinite(n) || full.length !== 6) return [0.85, 0.65, 0.52];
    return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function mixHexRgb01(a: string, b: string, t: number): RGB {
    const A = hexToRgb01(a);
    const B = hexToRgb01(b);
    const u = Math.max(0, Math.min(1, t));
    return [
        A[0] + (B[0] - A[0]) * u,
        A[1] + (B[1] - A[1]) * u,
        A[2] + (B[2] - A[2]) * u,
    ];
}

function rgb01ToHex([r, g, b]: RGB): string {
    const to = (x: number) =>
        Math.max(0, Math.min(255, Math.round(x * 255)))
            .toString(16)
            .padStart(2, '0');
    return `#${to(r)}${to(g)}${to(b)}`;
}

function bodyTypeMultiplier(bodyType: string): number {
    if (bodyType === 'Heroic') return 1.06;
    if (bodyType === 'Lean') return 0.94;
    if (bodyType === 'Heavy') return 1.04;
    return 1;
}

function useHighPolyBody(_bodyType: string): boolean {
    // Always use Body_high when present so muscle definition (abs, etc.) shows for every preset;
    // Body_low is a smooth LOD only.
    return true;
}

function map01toScale(v: number, min: number, max: number): number {
    const t = Math.max(0, Math.min(100, v)) / 100;
    return min + (max - min) * t;
}

function getModelScene(el: HTMLElement): ModelScene | undefined {
    const bag = el as unknown as Record<symbol, unknown>;
    return bag[$scene] as ModelScene | undefined;
}

function isMeshObject(obj: Object3D): obj is Mesh {
    return (obj as Mesh).isMesh === true;
}

function isHeadMaterialMesh(mesh: Mesh): boolean {
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    return mats.some(m => m && 'name' in m && (m as { name?: string }).name === 'head');
}

function isStdMaterial(m: unknown): m is MeshStandardMaterial {
    if (!m || typeof m !== 'object') return false;
    const mat = m as MeshStandardMaterial & { isMeshPhysicalMaterial?: boolean };
    return Boolean(mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial);
}

const EYE_MATERIAL_NAMES = ['eyes', 'Eyes', 'eye', 'Eye', 'iris', 'Iris', 'cornea', 'Cornea', 'pupil', 'Pupil'] as const;

/** Tint meshes/materials that look like eyes (not eyebrows). */
function tintSceneGraphEyes(scene: ModelScene | undefined, eyeHex: string): boolean {
    if (!scene?.target) return false;
    const col = new Color(eyeHex);
    let touched = false;
    scene.target.traverse(obj => {
        if (!isMeshObject(obj)) return;
        const meshName = obj.name.toLowerCase();
        if (meshName.includes('eyebrow') || meshName.includes('brow') || meshName.includes('lash')) return;

        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const raw of mats) {
            if (!isStdMaterial(raw)) continue;
            const matName = (raw.name || '').toLowerCase();
            const eyeMesh =
                meshName.includes('eye')
                || meshName.includes('iris')
                || meshName.includes('cornea')
                || meshName.includes('pupil');
            const eyeMat =
                matName.includes('eye')
                || matName.includes('iris')
                || matName.includes('cornea')
                || matName.includes('pupil');
            if (!eyeMesh && !eyeMat) continue;
            if (matName.includes('brow') || matName.includes('lash')) continue;

            raw.color.copy(col);
            raw.emissive.copy(col).multiplyScalar(0.14);
            raw.needsUpdate = true;
            touched = true;
        }
    });
    return touched;
}

/**
 * Tints every mesh material in a model-viewer element with a base hex color.
 * Only applied to materials that have NO texture map — textured outfits render with their own colors.
 */
export function tintOutfitModel(el: HTMLElement, hexColor: string): void {
    const scene = getModelScene(el);
    if (!scene?.target) return;
    const col = new Color(hexColor);
    scene.target.traverse((obj: Object3D) => {
        if (!isMeshObject(obj)) return;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
            if (!isStdMaterial(m)) continue;
            if (m.map) continue; // already has a diffuse texture — leave it as-is
            m.color.copy(col);
            m.roughness = 0.7;
            m.metalness = 0.1;
            m.needsUpdate = true;
        }
    });
    scene.queueRender();
}

const OUTFIT_NODE_NAME = '__avatar_outfit__';

/**
 * Loads a GLB outfit file via GLTFLoader and injects it directly into the body
 * model-viewer's Three.js scene.  Both meshes share the same coordinate system
 * so the outfit aligns with the body without any camera-sync trickery.
 *
 * Pass `outfitUrl = null` to remove the current outfit.
 */
export async function loadOutfitIntoScene(
    bodyEl: HTMLElement,
    outfitUrl: string | null,
): Promise<void> {
    const scene = getModelScene(bodyEl);
    if (!scene?.target) return;

    // Remove previously loaded outfit
    const existing = scene.target.getObjectByName(OUTFIT_NODE_NAME);
    if (existing) scene.target.remove(existing);

    if (!outfitUrl) {
        scene.queueRender();
        return;
    }

    // Dynamically import GLTFLoader so it doesn't bloat the initial bundle
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js') as any;
    const loader = new GLTFLoader();

    await new Promise<void>((resolve, reject) => {
        loader.load(
            outfitUrl,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (gltf: any) => {
                const outfitGroup = gltf.scene as Group;
                outfitGroup.name = OUTFIT_NODE_NAME;

                // Tint untextured meshes so they're visible; keep textured ones as-is
                const fallbackColor = new Color('#4a5568');
                outfitGroup.traverse((obj: Object3D) => {
                    if (!isMeshObject(obj)) return;
                    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
                    for (const m of mats) {
                        if (!isStdMaterial(m)) continue;
                        if (m.map) continue;
                        m.color.copy(fallbackColor);
                        m.roughness = 0.65;
                        m.metalness = 0.15;
                        m.needsUpdate = true;
                    }
                });

                scene.target.add(outfitGroup);
                scene.queueRender();
                resolve();
            },
            undefined,
            reject,
        );
    });
}

export type WeaponColors = {
    /** Multiplied with the base texture / color of every material (hex string, e.g. '#ff4444') */
    primary: string;
    /** Additive emissive glow color applied to every material */
    glow: string;
    /** 0–1 metalness override */
    metalness: number;
    /** 0–1 roughness override */
    roughness: number;
};

/**
 * Applies live color overrides to every mesh in a weapon model-viewer element.
 *  - `primary`  → MeshStandardMaterial.color  (multiplied with texture if present)
 *  - `glow`     → MeshStandardMaterial.emissive (at reduced intensity so it doesn't wash out)
 *  - `metalness` / `roughness` → physical surface properties
 */
export function applyWeaponColors(el: HTMLElement, colors: WeaponColors): void {
    const scene = getModelScene(el);
    if (!scene?.target) return;
    const primary = new Color(colors.primary);
    const glow = new Color(colors.glow);
    scene.target.traverse((obj: Object3D) => {
        if (!isMeshObject(obj)) return;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
            if (!isStdMaterial(m)) continue;
            m.color.copy(primary);
            m.emissive.copy(glow).multiplyScalar(0.25);
            m.metalness = colors.metalness;
            m.roughness = colors.roughness;
            m.needsUpdate = true;
        }
    });
    scene.queueRender();
}

/**
 * Plays the best-matching embedded animation (idle / stand / breathe), or the first clip.
 * No-op when the GLB has no animations.
 */
export function startAvatarPreviewAnimation(el: HTMLElement): void {
    const mv = el as HTMLElement & {
        availableAnimations?: ReadonlyArray<string>;
        animationName?: string | null;
        autoplay?: boolean;
        play?: () => void;
    };
    const names = mv.availableAnimations;
    if (!names?.length) return;
    const pick =
        names.find(n => /idle|breath|breathe|stand|wait|loop|walk|default/i.test(n))
        ?? names[0];
    mv.animationName = pick;
    mv.autoplay = true;
    try {
        mv.play?.();
    } catch {
        /* model-viewer play can throw if mixer not ready */
    }
}

/**
 * Push config into PBR materials (public model-viewer API) and Three transforms (scene graph).
 */
export async function applyAvatarDynamicConfig(el: HTMLElement, cfg: AvatarDynamicUiConfig): Promise<void> {
    const mv = el as HTMLElement & {
        model?: {
            getMaterialByName(name: string): null | {
                ensureLoaded(): Promise<void>;
                pbrMetallicRoughness: { setBaseColorFactor(c: string | RGB): void };
                setEmissiveFactor(rgb: RGB | string): void;
            };
        };
        updateFraming?: () => Promise<void>;
    };

    const scene = getModelScene(el);

    const model = mv.model;
    let eyesTintedViaPbr = false;
    if (model) {
        const bodyMat = model.getMaterialByName('body');
        const headMat = model.getMaterialByName('head');
        await bodyMat?.ensureLoaded();
        await headMat?.ensureLoaded();

        bodyMat?.pbrMetallicRoughness.setBaseColorFactor(cfg.skinTone);

        for (const name of EYE_MATERIAL_NAMES) {
            const eyeMat = model.getMaterialByName(name);
            if (!eyeMat) continue;
            await eyeMat.ensureLoaded();
            eyeMat.pbrMetallicRoughness.setBaseColorFactor(cfg.eyeColor);
            eyesTintedViaPbr = true;
        }

        const eyesTintedViaScene = tintSceneGraphEyes(scene, cfg.eyeColor);
        const eyesResolved = eyesTintedViaPbr || eyesTintedViaScene;

        const headFace = eyesResolved
            ? rgb01ToHex(mixHexRgb01(cfg.skinTone, cfg.hairColor, 0.1))
            : rgb01ToHex(mixHexRgb01(mixHexRgb01(cfg.skinTone, cfg.eyeColor, 0.42), cfg.hairColor, 0.08));
        headMat?.pbrMetallicRoughness.setBaseColorFactor(headFace);

        const em = AURA_EMISSIVE[cfg.aura] ?? AURA_EMISSIVE.Neon;
        const dim: RGB = [em[0] * 0.35, em[1] * 0.35, em[2] * 0.35];
        bodyMat?.setEmissiveFactor(dim);
        headMat?.setEmissiveFactor([dim[0] * 0.75, dim[1] * 0.75, dim[2] * 0.75]);
    } else if (scene) {
        tintSceneGraphEyes(scene, cfg.eyeColor);
    }

    if (!scene?.target) return;

    const highPoly = useHighPolyBody(cfg.bodyType);
    scene.target.traverse(obj => {
        if (obj.name === 'Body_low') obj.visible = !highPoly;
        if (obj.name === 'Body_high') obj.visible = highPoly;
    });

    const uniform =
        bodyTypeMultiplier(cfg.bodyType) * map01toScale(cfg.bodySize, 0.9, 1.12);
    const headScalar = map01toScale(cfg.headSize, 0.88, 1.14);

    const { target } = scene;
    if (target.children.length > 0) {
        const root = target.children[0];
        root.scale.setScalar(uniform);
    }

    scene.target.traverse(obj => {
        if (isMeshObject(obj) && isHeadMaterialMesh(obj)) {
            obj.scale.setScalar(headScalar);
        }
    });

    scene.queueRender();
    try {
        await mv.updateFraming?.();
    } catch {
        /* framing is best-effort after live edits */
    }
}
