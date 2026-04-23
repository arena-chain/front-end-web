// No imports needed for NftRarity if unused

export type AvatarLayerKey = 'base' | 'hair' | 'ears' | 'outfit' | 'accessory';
export type AvatarLayer = { file: File | null; preview: string | null };
export type AvatarLayers = Record<AvatarLayerKey, AvatarLayer>;
export type AvatarView = 'front' | 'side' | 'back';
export type CameraPreset = 'front' | 'right' | 'back' | 'left' | 'top' | 'bottom';

export interface AvatarConfig {
    gender: string;
    view: AvatarView;
    bodyType: string;
    skinTone: string;
    faceStyle: string;
    hairstyle: string;
    hairLength: number;
    hairColor: string;
    earType: string;
    earSize: number;
    eyeColor: string;
    eyebrow: string;
    nose: string;
    mouth: string;
    outfit: string;
    boots: string;
    accessory: string;
    aura: string;
    outfitModelId: string;
    bodySize: number;
    headSize: number;
    power: number;
    agility: number;
    focus: number;
}

export const LAYER_LABELS: Record<AvatarLayerKey, string> = {
    base: 'Base Body',
    hair: 'Hair Layer',
    ears: 'Ears Layer',
    outfit: 'Outfit Layer',
    accessory: 'Accessory Layer',
};

export const AVATAR_CAMERA_ORBIT: Record<AvatarView, string> = {
    front: '0deg 68deg 168%',
    side: '90deg 68deg 168%',
    back: '180deg 68deg 168%',
};

export const CAMERA_PRESET_ORBIT: Record<CameraPreset, string> = {
    front: '0deg 68deg 168%',
    right: '90deg 68deg 168%',
    back: '180deg 68deg 168%',
    left: '270deg 68deg 168%',
    top: '0deg 8deg 210%',
    bottom: '0deg 172deg 210%',
};
