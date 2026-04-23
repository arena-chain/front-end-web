import { useState, useRef } from 'react';
import {
    RotateCcw, Wand2, Palette, User, Sparkles, SlidersHorizontal,
    ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import {
    nftCoreService,
    nftAttributeService
} from '../../services/nftAdminService';
import { resolveOutfitModelUrl } from '../../admin/avatar/outfitCatalog';
import {
    type AvatarLayerKey,
    type AvatarLayers,
    type AvatarView,
    type AvatarConfig,
    LAYER_LABELS
} from './AvatarStudioTypes';
import { StudioSelect, StudioSlider } from './AvatarStudioHelpers';
import { AvatarPreviewCard } from './AvatarPreviewCard';
import type { NftRarity, Nft } from '../../services/nftAdminService';

export function AvatarStudio({ onDraftCreated }: { onDraftCreated: (nft: Nft) => void }) {
    const [studioConfigCollapsed, setStudioConfigCollapsed] = useState(false);
    const fileRefs = useRef<Record<AvatarLayerKey, HTMLInputElement | null>>({
        base: null, hair: null, ears: null, outfit: null, accessory: null,
    });
    const [saving, setSaving] = useState(false);
    const [layers, setLayers] = useState<AvatarLayers>({
        base: { file: null, preview: null },
        hair: { file: null, preview: null },
        ears: { file: null, preview: null },
        outfit: { file: null, preview: null },
        accessory: { file: null, preview: null },
    });
    const [config, setConfig] = useState<AvatarConfig>({
        gender: 'FEMALE',
        view: 'front',
        bodyType: 'Athletic',
        skinTone: '#d1a07d',
        faceStyle: 'Sharp',
        hairstyle: 'Long',
        hairLength: 74,
        hairColor: '#111827',
        earType: 'Human',
        earSize: 58,
        eyeColor: '#60a5fa',
        eyebrow: 'Angled',
        nose: 'Straight',
        mouth: 'Neutral',
        outfit: 'Tactical',
        boots: 'Combat',
        accessory: 'Holster',
        aura: 'Neon',
        outfitModelId: 'none',
        bodySize: 52,
        headSize: 50,
        power: 84,
        agility: 76,
        focus: 88,
    });
    const [nftName, setNftName] = useState('');

    const pickLayer = (key: AvatarLayerKey, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setLayers(prev => ({
                ...prev,
                [key]: { file, preview: reader.result as string },
            }));
        };
        reader.readAsDataURL(file);
    };

    const clearLayer = (key: AvatarLayerKey) => {
        setLayers(prev => ({ ...prev, [key]: { file: null, preview: null } }));
        if (fileRefs.current[key]) fileRefs.current[key]!.value = '';
    };

    const resetStudio = () => {
        setLayers({
            base: { file: null, preview: null },
            hair: { file: null, preview: null },
            ears: { file: null, preview: null },
            outfit: { file: null, preview: null },
            accessory: { file: null, preview: null },
        });
        setConfig({
            gender: 'FEMALE',
            view: 'front',
            bodyType: 'Athletic',
            skinTone: '#d1a07d',
            faceStyle: 'Sharp',
            hairstyle: 'Long',
            hairLength: 74,
            hairColor: '#111827',
            earType: 'Human',
            earSize: 58,
            eyeColor: '#60a5fa',
            eyebrow: 'Angled',
            nose: 'Straight',
            mouth: 'Neutral',
            outfit: 'Tactical',
            boots: 'Combat',
            accessory: 'Holster',
            aura: 'Neon',
            outfitModelId: 'none',
            bodySize: 52,
            headSize: 50,
            power: 84,
            agility: 76,
            focus: 88,
        });
        setNftName('');
    };

    const score = Math.round((config.power + config.agility + config.focus) / 3);
    const rarity: NftRarity =
        score >= 90 ? 'MYTHIC'
            : score >= 80 ? 'LEGENDARY'
                : score >= 68 ? 'EPIC'
                    : score >= 56 ? 'RARE'
                        : score >= 40 ? 'UNCOMMON'
                            : 'COMMON';
    const defaultName = `${config.gender === 'MALE' ? 'Male' : 'Female'} ${config.outfit} ${config.hairstyle}`;
    const finalName = nftName.trim() || defaultName;

    const saveAsDraft = async () => {
        try {
            setSaving(true);
            const fd = new FormData();
            fd.append('name', finalName);
            fd.append('description', `${config.gender} avatar generated in Arena Studio.`);
            fd.append('category', 'AVATAR');
            fd.append('rarity', rarity);
            fd.append('isEquippable', 'true');
            fd.append('isTradeable', 'true');
            fd.append('maxSupply', '100');

            const primaryFile = layers.base.file || layers.outfit.file || layers.hair.file || layers.ears.file || layers.accessory.file;
            if (primaryFile) fd.append('file', primaryFile);

            const created = await nftCoreService.create(fd);

            const attributes = [
                { traitType: 'Gender', value: config.gender },
                { traitType: 'Power', value: String(config.power), numericValue: config.power, maxValue: 100 },
                { traitType: 'Agility', value: String(config.agility), numericValue: config.agility, maxValue: 100 },
                { traitType: 'Focus', value: String(config.focus), numericValue: config.focus, maxValue: 100 },
                { traitType: 'Skin Tone', value: config.skinTone },
                { traitType: 'Aura', value: config.aura },
            ];

            for (const attr of attributes) {
                await nftAttributeService.add({
                    nftId: created._id,
                    traitType: attr.traitType,
                    value: attr.value,
                    displayType: attr.numericValue != null ? 'number' : undefined,
                    numericValue: attr.numericValue,
                    maxValue: attr.maxValue,
                });
            }
            onDraftCreated(created);
            toast.success('NFT Draft Submitted!', {
                description: 'Your creation is now pending administrative approval.',
            });
            resetStudio();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to create avatar draft');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-5 xl:h-[calc(100vh-12rem)] xl:flex-row xl:gap-0 xl:overflow-hidden xl:rounded-2xl xl:border xl:border-white/10 xl:bg-[#0d0f12]">
            <aside className={cn(
                'shrink-0 overflow-x-hidden border border-white/10 bg-[#111214] transition-[width,opacity] duration-300 ease-out rounded-2xl xl:rounded-none xl:border-y-0 xl:border-l-0',
                studioConfigCollapsed ? 'xl:pointer-events-none xl:w-0 xl:border-r-0 xl:opacity-0' : 'xl:w-[min(100%,22rem)] 2xl:w-96 xl:border-r xl:border-white/10 xl:opacity-100'
            )}>
                <div className="h-full max-h-[65vh] min-w-0 space-y-6 overflow-y-auto overflow-x-hidden p-4 sm:p-5 xl:max-h-none xl:h-full xl:w-full">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="flex min-w-0 items-center gap-2 text-sm font-black uppercase tracking-widest text-white">
                            <Wand2 size={15} className="shrink-0 text-primary" />
                            <span className="min-w-0 leading-tight">Character creator</span>
                        </h2>
                        <button onClick={resetStudio} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-white transition-all">
                            <RotateCcw size={12} /> Reset
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setConfig(prev => ({ ...prev, gender: 'MALE' }))} className={cn('min-h-11 rounded-xl px-2 py-2.5 text-xs font-black uppercase tracking-widest border transition-all', config.gender === 'MALE' ? 'bg-primary text-black border-primary' : 'text-text-muted border-white/10 hover:text-white')}>Male</button>
                        <button onClick={() => setConfig(prev => ({ ...prev, gender: 'FEMALE' }))} className={cn('min-h-11 rounded-xl px-2 py-2.5 text-xs font-black uppercase tracking-widest border transition-all', config.gender === 'FEMALE' ? 'bg-primary text-black border-primary' : 'text-text-muted border-white/10 hover:text-white')}>Female</button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {(['front', 'side', 'back'] as AvatarView[]).map(v => (
                            <button key={v} onClick={() => setConfig(prev => ({ ...prev, view: v }))} className={cn('flex min-h-12 items-center justify-center rounded-xl px-1 py-2 text-center text-[9px] font-black uppercase border transition-all', config.view === v ? 'bg-white/15 text-white border-white/20' : 'text-text-muted border-white/10 hover:text-white')}>
                                {v} view
                            </button>
                        ))}
                    </div>

                    <div className="space-y-3 border-t border-white/5 pt-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Layer uploads</p>
                        <div className="grid grid-cols-1 gap-3">
                            {(Object.keys(LAYER_LABELS) as AvatarLayerKey[]).map(key => (
                                <div key={key} className="min-w-0 rounded-xl border border-white/10 bg-black/25 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{LAYER_LABELS[key]}</p>
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        <button onClick={() => fileRefs.current[key]?.click()} className="min-h-10 w-full rounded-lg bg-white/10 px-2 py-2.5 text-[10px] font-black uppercase text-white hover:bg-white/15">Upload</button>
                                        <button onClick={() => clearLayer(key)} className="min-h-10 w-full rounded-lg border border-white/15 px-2 py-2.5 text-[10px] font-black uppercase text-text-muted hover:text-white">Clear</button>
                                    </div>
                                    <input ref={el => { fileRefs.current[key] = el; }} type="file" accept="image/*" onChange={e => pickLayer(key, e)} className="hidden" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 border-t border-white/5 pt-5">
                        <StudioSelect label="Body Type" icon={<User size={12} />} value={config.bodyType} options={['Athletic', 'Lean', 'Heavy', 'Heroic']} onChange={v => setConfig(prev => ({ ...prev, bodyType: v }))} />
                        <StudioSelect label="Face Style" icon={<User size={12} />} value={config.faceStyle} options={['Sharp', 'Soft', 'Strong', 'Angular']} onChange={v => setConfig(prev => ({ ...prev, faceStyle: v }))} />
                        <StudioSelect label="Hair Style" icon={<Sparkles size={12} />} value={config.hairstyle} options={['Bald', 'Buzz', 'Short', 'Long', 'Braids', 'Mohawk']} onChange={v => setConfig(prev => ({ ...prev, hairstyle: v }))} />
                        <StudioSelect label="Ear Type" icon={<Sparkles size={12} />} value={config.earType} options={['Human', 'Elf', 'Cyber', 'Pointed']} onChange={v => setConfig(prev => ({ ...prev, earType: v }))} />
                        <StudioSelect label="Outfit" icon={<Palette size={12} />} value={config.outfit} options={['Tactical', 'Streetwear', 'Cyber Suit', 'Stealth', 'Battle Armor']} onChange={v => setConfig(prev => ({ ...prev, outfit: v }))} />
                    </div>

                    <div className="space-y-4 rounded-xl border border-white/10 bg-black/20 p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5"><SlidersHorizontal size={12} /> Morph controls</p>
                        <div className="space-y-4">
                            <StudioSlider label="Power" value={config.power} onChange={v => setConfig(prev => ({ ...prev, power: v }))} />
                            <StudioSlider label="Agility" value={config.agility} onChange={v => setConfig(prev => ({ ...prev, agility: v }))} />
                            <StudioSlider label="Focus" value={config.focus} onChange={v => setConfig(prev => ({ ...prev, focus: v }))} />
                        </div>
                    </div>
                </div>
            </aside>

            <div className="relative flex min-h-[520px] flex-1 min-w-0 flex-col border border-white/10 bg-[#05070a] rounded-2xl xl:rounded-none xl:border-0">
                <button onClick={() => setStudioConfigCollapsed(c => !c)} className="absolute left-0 top-1/2 z-40 flex h-24 w-8 -translate-y-1/2 items-center justify-center rounded-r-lg border border-l-0 border-white/20 bg-black/90 text-white/90 shadow-2xl hover:text-primary transition-colors">
                    {studioConfigCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>

                <div className={cn('flex flex-1 flex-col p-3', studioConfigCollapsed && 'xl:p-0')}>
                    <AvatarPreviewCard view={config.view} config={config} layers={layers} fullBleed={studioConfigCollapsed} outfitModelUrl={resolveOutfitModelUrl(config.outfitModelId)} />
                    <div className="mt-4 flex items-center justify-between gap-4 p-4 border-t border-white/5">
                    <div className="flex-1 flex flex-col gap-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1 block italic">NFT Designation</label>
                        <div className="relative group/input">
                            <input 
                                type="text" 
                                value={nftName}
                                onChange={(e) => setNftName(e.target.value)}
                                placeholder={defaultName}
                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white w-full max-w-md focus:border-primary/50 focus:bg-white/[0.08] outline-none transition-all font-black uppercase tracking-tight placeholder:text-white/20"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-focus-within/input:opacity-100 transition-opacity">
                                <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest">Custom Name</span>
                            </div>
                        </div>
                    </div>
                        <button onClick={saveAsDraft} disabled={saving} className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-black font-black uppercase tracking-wider hover:bg-primary/90 disabled:opacity-50 transition-all">
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            {saving ? 'Creating Draft...' : 'Save as Draft'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
