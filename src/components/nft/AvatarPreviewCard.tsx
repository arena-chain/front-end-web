import { useState, useEffect, useRef, type CSSProperties } from 'react';
import type { ModelViewerElement } from '@google/model-viewer';
import { Plus, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { applyAvatarDynamicConfig } from '../../admin/avatar/modelViewerAvatarBridge';
import {
    type AvatarView,
    type AvatarLayers,
    type AvatarConfig,
    AVATAR_CAMERA_ORBIT,
} from './AvatarStudioTypes';

const AVATAR_GLB_URL = `${import.meta.env.BASE_URL}models/BodyMaleTemplate.glb`;

export function AvatarPreviewCard({ view, config, layers, compact = false, fullBleed = false, outfitModelUrl = null }: {
    view: AvatarView;
    config: Partial<AvatarConfig>;
    layers: AvatarLayers;
    compact?: boolean;
    fullBleed?: boolean;
    outfitModelUrl?: string | null;
}) {
    const viewerRef = useRef<HTMLElement | null>(null);
    const outfitViewerRef = useRef<HTMLElement | null>(null);
    const configRef = useRef(config);
    configRef.current = config;
    const [cameraOrbit, setCameraOrbit] = useState<string>(AVATAR_CAMERA_ORBIT[view]);

    const auraBg: Record<string, string> = {
        Neon: 'linear-gradient(160deg, #0a1220, #172554 65%, #0e7490)',
        Ice: 'linear-gradient(160deg, #0f172a, #1d4ed8 60%, #bae6fd)',
        Shadow: 'linear-gradient(160deg, #020617, #312e81 55%, #581c87)',
        Fire: 'linear-gradient(160deg, #111827, #9a3412 55%, #dc2626)',
        Gold: 'linear-gradient(160deg, #111827, #78350f 55%, #f59e0b)',
    };

    const bodyScale = config.bodyType === 'Heroic' ? 1.06 : config.bodyType === 'Lean' ? 0.94 : 1;
    const viewTransform = view === 'side' ? 'rotateY(24deg)' : view === 'back' ? 'rotateY(180deg)' : 'none';

    useEffect(() => {
        const nextOrbit = AVATAR_CAMERA_ORBIT[view];
        setCameraOrbit(nextOrbit);
    }, [view]);

    useEffect(() => {
        if (compact) return;
        const el = viewerRef.current;
        if (!el) return;

        const mv = el as unknown as {
            updateFraming?: () => Promise<void>;
            cameraOrbit?: string;
        };

        const onLoad = () => {
            void (async () => {
                try {
                    await mv.updateFraming?.();
                    mv.cameraOrbit = cameraOrbit;
                } catch { /* ignore */ }
                requestAnimationFrame(() => {
                    mv.cameraOrbit = cameraOrbit;
                    const c = configRef.current;
                    void applyAvatarDynamicConfig(el, {
                        skinTone: c.skinTone,
                        hairColor: c.hairColor,
                        eyeColor: c.eyeColor,
                        aura: c.aura,
                        bodyType: c.bodyType,
                        bodySize: c.bodySize,
                        headSize: c.headSize,
                    });
                });
            })();
        };
        const onError = () => { /* model failed to load */ };

        el.addEventListener('load', onLoad);
        el.addEventListener('error', onError);
        return () => {
            el.removeEventListener('load', onLoad);
            el.removeEventListener('error', onError);
        };
    }, [compact, cameraOrbit]);

    useEffect(() => {
        if (compact) return;
        const el = viewerRef.current;
        if (!el) return;
        void applyAvatarDynamicConfig(el, {
            skinTone: config.skinTone,
            hairColor: config.hairColor,
            eyeColor: config.eyeColor,
            aura: config.aura,
            bodyType: config.bodyType,
            bodySize: config.bodySize,
            headSize: config.headSize,
        });
    }, [compact, config.skinTone, config.hairColor, config.eyeColor, config.aura, config.bodyType, config.bodySize, config.headSize]);

    useEffect(() => {
        if (compact || !outfitModelUrl) return;
        const body = viewerRef.current as ModelViewerElement | null;
        const outfit = outfitViewerRef.current as ModelViewerElement | null;
        if (!body || !outfit) return;

        const sync = () => {
            outfit.cameraOrbit = body.getCameraOrbit().toString();
            outfit.cameraTarget = body.getCameraTarget().toString();
            outfit.fieldOfView = `${body.getFieldOfView()}deg`;
        };

        const onOutfitLoad = () => {
            void outfit.updateFraming().then(sync).catch(() => { sync(); });
        };

        body.addEventListener('camera-change', sync);
        outfit.addEventListener('load', onOutfitLoad);
        sync();
        return () => {
            body.removeEventListener('camera-change', sync);
            outfit.removeEventListener('load', onOutfitLoad);
        };
    }, [compact, outfitModelUrl]);

    const stepZoom = (direction: 'in' | 'out') => {
        const orbit = cameraOrbit.split(' ');
        if (orbit.length < 3) return;
        const radius = orbit[2];
        if (!radius.endsWith('%')) return;
        const current = Number.parseFloat(radius.replace('%', ''));
        if (!Number.isFinite(current)) return;
        const next = direction === 'in' ? current * 0.9 : current * 1.12;
        const clamped = Math.max(70, Math.min(340, next));
        orbit[2] = `${clamped.toFixed(1)}%`;
        setCameraOrbit(orbit.join(' '));
    };

    const vignette = 'absolute inset-0 bg-[radial-gradient(ellipse_at_50%_32%,rgba(0,255,136,0.07),transparent_55%)]';

    const layerImages = [layers.base.preview, layers.outfit.preview, layers.hair.preview, layers.ears.preview, layers.accessory.preview].map((src, idx) => src && (
        <img
            key={`${idx}-${src}`}
            src={src}
            alt=""
            className="absolute inset-0 z-[15] h-full w-full object-contain pointer-events-none"
            style={{
                transform: `${viewTransform} scale(${(compact ? 0.7 : bodyScale) + (idx === 2 ? (config.hairLength || 0) / 500 : idx === 3 ? (config.earSize || 0) / 700 : 0)})`,
                filter: idx === 2 ? `drop-shadow(0 0 12px ${config.hairColor})` : undefined,
            }}
        />
    ));

    if (compact) {
        return (
            <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: auraBg[config.aura || 'Neon'] }}>
                <div className="relative flex h-40 items-center justify-center p-3" style={{ perspective: '900px' }}>
                    <div className={`${vignette} pointer-events-none`} />
                    <div
                        className="relative z-10 w-[4.5rem] h-[7rem] rounded-full border border-white/25"
                        style={{
                            background: `linear-gradient(180deg, ${config.skinTone}ee, ${config.skinTone}aa)`,
                            transform: `${viewTransform} scale(0.62)`,
                            boxShadow: '0 0 24px rgba(0,255,136,0.12)',
                        }}
                    >
                        <div className="absolute -top-6 left-1/2 h-10 w-10 -translate-x-1/2 rounded-full border border-white/30" style={{ background: config.skinTone }} />
                    </div>
                    {layerImages}
                    <span className="absolute left-2 top-2 z-20 rounded-lg bg-black/55 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-white">
                        {view}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'flex h-full min-h-0 flex-col overflow-hidden',
                fullBleed ? 'rounded-none border-0 xl:min-h-0 xl:flex-1' : 'rounded-xl border border-white/10 xl:rounded-lg',
            )}
            style={{ background: auraBg[config.aura || 'Neon'] }}
        >
            <div
                className={cn(
                    'relative flex min-h-[280px] flex-1 items-stretch justify-center',
                    fullBleed ? 'min-h-0 p-0' : 'p-1 sm:p-3',
                )}
                style={{ perspective: '900px' }}
            >
                <div className="absolute inset-0 bg-[#05070a]" />
                <div className={`${vignette} pointer-events-none z-[1]`} />

                <div className="relative z-10 h-full min-h-[240px] w-full">
                    <model-viewer
                        ref={viewerRef}
                        className="absolute inset-0 h-full w-full"
                        src={AVATAR_GLB_URL}
                        camera-controls
                        touch-action="none"
                        reveal="auto"
                        interaction-prompt="none"
                        interpolation-decay="120"
                        camera-orbit={cameraOrbit}
                        min-camera-orbit="auto 22deg 72%"
                        max-camera-orbit="auto 175deg 340%"
                        min-field-of-view="18deg"
                        max-field-of-view="48deg"
                        zoom-sensitivity="0.35"
                        exposure="1"
                        shadow-intensity="0.45"
                        shadow-softness="0.85"
                        environment-image="neutral"
                        tone-mapping="aces"
                        style={{
                            touchAction: 'none',
                            backgroundColor: '#05070a',
                            ...({ '--poster-color': 'transparent' } as CSSProperties),
                        } as any}
                    />
                    {outfitModelUrl ? (
                        <model-viewer
                            ref={outfitViewerRef}
                            className="pointer-events-none absolute inset-0 z-[11] h-full w-full"
                            src={outfitModelUrl}
                            reveal="auto"
                            interaction-prompt="none"
                            interpolation-decay="120"
                            camera-orbit={cameraOrbit}
                            min-camera-orbit="auto 22deg 72%"
                            max-camera-orbit="auto 175deg 340%"
                            min-field-of-view="18deg"
                            max-field-of-view="48deg"
                            zoom-sensitivity="0.35"
                            exposure="1"
                            shadow-intensity="0"
                            environment-image="neutral"
                            tone-mapping="aces"
                            style={{
                                touchAction: 'none',
                                backgroundColor: 'transparent',
                                ...({ '--poster-color': 'transparent' } as CSSProperties),
                            } as any}
                        />
                    ) : null}
                    {layerImages}
                </div>

                <div className="absolute right-3 top-3 z-30 flex flex-col gap-2 rounded-xl border border-white/10 bg-black/45 p-2 backdrop-blur-sm">
                    <div className="grid grid-cols-2 gap-1">
                        <button
                            type="button"
                            onClick={() => stepZoom('in')}
                            className="h-7 w-7 rounded-lg border border-white/15 text-white/80 hover:bg-white/10 hover:text-white"
                        >
                            <Plus size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={() => stepZoom('out')}
                            className="h-7 w-7 rounded-lg border border-white/15 text-white/80 hover:bg-white/10 hover:text-white"
                        >
                            <Minus size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
