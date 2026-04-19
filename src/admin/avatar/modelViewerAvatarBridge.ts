/**
 * Applies Avatar Studio UI state to the live <model-viewer> / Three.js scene.
 *
 * The bundled `BodyMaleTemplate.glb` has no morph targets — only materials `body` & `head`
 * and two meshes `Body_low` / `Body_high`. True game-style hair/outfits need either
 * extra glTF meshes (skinned to the same skeleton) or blend shapes in the asset.
 */
import { $scene } from '@google/model-viewer/lib/model-viewer-base.js';
import type { ModelScene } from '@google/model-viewer/lib/three-components/ModelScene.js';
import type { RGB } from '@google/model-viewer/lib/three-components/gltf-instance/gltf-2.0.js';
import type { Material, Mesh, Object3D } from 'three';

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

function useHighPolyBody(bodyType: string): boolean {
    return bodyType === 'Heroic' || bodyType === 'Heavy';
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
    return mats.some((m: Material) => m && 'name' in m && (m as { name?: string }).name === 'head');
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

    const model = mv.model;
    if (model) {
        const bodyMat = model.getMaterialByName('body');
        const headMat = model.getMaterialByName('head');
        await bodyMat?.ensureLoaded();
        await headMat?.ensureLoaded();

        bodyMat?.pbrMetallicRoughness.setBaseColorFactor(cfg.skinTone);
        const headFace = rgb01ToHex(mixHexRgb01(cfg.skinTone, cfg.eyeColor, 0.14));
        const headWithHair = rgb01ToHex(mixHexRgb01(headFace, cfg.hairColor, 0.08));
        headMat?.pbrMetallicRoughness.setBaseColorFactor(headWithHair);

        const em = AURA_EMISSIVE[cfg.aura] ?? AURA_EMISSIVE.Neon;
        const dim: RGB = [em[0] * 0.35, em[1] * 0.35, em[2] * 0.35];
        bodyMat?.setEmissiveFactor(dim);
        headMat?.setEmissiveFactor([dim[0] * 0.75, dim[1] * 0.75, dim[2] * 0.75]);
    }

    const scene = getModelScene(el);
    if (!scene?.target) return;

    const highPoly = useHighPolyBody(cfg.bodyType);
    scene.target.traverse((obj: Object3D) => {
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

    scene.target.traverse((obj: Object3D) => {
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
