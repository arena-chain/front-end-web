import { useState, useEffect } from 'react';
import { X, Plus, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
    nftCoreService,
    nftAttributeService,
    NFT_CATEGORIES,
    NFT_RARITIES,
    type Nft,
    type NftCollection,
    type NftRarity,
    type NftCategory
} from '../../services/nftAdminService';
import { RARITY_COLORS, RARITY_GRADIENTS } from './NftConstants';

interface CreateNftProps {
    collections: NftCollection[];
    onClose: () => void;
    onCreated: (nft: Nft) => void;
}

export function CreateNftModal({ collections, onClose, onCreated }: CreateNftProps) {
    const [form, setForm] = useState({
        name: '',
        description: '',
        category: 'AVATAR' as NftCategory,
        rarity: 'COMMON' as NftRarity,
        collectionId: '',
        price: 0,
        maxSupply: 100,
        tags: '',
        isEquippable: true,
        isTradeable: true,
        isConsumable: false,
    });
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [attrs, setAttrs] = useState<{ traitType: string; value: string; numericValue?: number; maxValue?: number }[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (collections.length > 0 && !form.collectionId) {
            setForm(f => ({ ...f, collectionId: collections[0]._id }));
        }
    }, [collections]);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result as string);
        reader.readAsDataURL(f);
    };

    const addAttrRow = () => setAttrs(prev => [...prev, { traitType: '', value: '' }]);
    const removeAttrRow = (idx: number) => setAttrs(prev => prev.filter((_, i) => i !== idx));
    const updateAttr = (idx: number, key: string, val: any) => {
        setAttrs(prev => prev.map((a, i) => i === idx ? { ...a, [key]: val } : a));
    };

    const handleCreate = async () => {
        try {
            setSaving(true);
            const fd = new FormData();
            fd.append('name', form.name);
            fd.append('description', form.description);
            fd.append('category', form.category);
            fd.append('rarity', form.rarity);
            fd.append('collectionId', form.collectionId);
            fd.append('price', String(form.price));
            fd.append('maxSupply', String(form.maxSupply));
            fd.append('tags', form.tags);
            fd.append('isEquippable', String(form.isEquippable));
            fd.append('isTradeable', String(form.isTradeable));
            fd.append('isConsumable', String(form.isConsumable));
            if (file) fd.append('file', file);

            const created = await nftCoreService.create(fd);

            // Add attributes
            for (const attr of attrs) {
                if (!attr.traitType.trim()) continue;
                await nftAttributeService.add({
                    nftId: created._id,
                    traitType: attr.traitType,
                    value: attr.value,
                    displayType: attr.numericValue != null ? 'number' : undefined,
                    numericValue: attr.numericValue,
                    maxValue: attr.maxValue,
                });
            }

            onCreated(created);
        } catch (e: any) {
            alert(e.response?.data?.message || 'Creation failed');
        } finally {
            setSaving(false);
        }
    };

    const rarityColor = RARITY_COLORS[form.rarity];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-surface border border-white/10 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary group">
                            <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-wider">Create New NFT</h2>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Deploy a unique digital asset to the blockchain</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-white/5 text-text-muted hover:text-white transition-all"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-hidden flex">
                    {/* Left: Form */}
                    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Asset Name *</label>
                                    <input
                                        value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        placeholder="e.g. Cyber Samurai X-1"
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary/50 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Description</label>
                                    <textarea
                                        value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        placeholder="Lore or technical details..."
                                        rows={3}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary/50 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Category</label>
                                        <select
                                            value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}
                                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary/50 outline-none"
                                        >
                                            {NFT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Rarity</label>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {NFT_RARITIES.map(r => (
                                                <button
                                                    key={r.value}
                                                    type="button"
                                                    onClick={() => setForm(f => ({ ...f, rarity: r.value as NftRarity }))}
                                                    className={cn(
                                                        "px-2 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                                                        form.rarity === r.value ? "text-white scale-105" : "text-text-muted hover:text-white"
                                                    )}
                                                    style={{
                                                        borderColor: form.rarity === r.value ? r.color : 'rgba(255,255,255,0.05)',
                                                        background: form.rarity === r.value ? r.color + '20' : 'transparent',
                                                    }}
                                                >
                                                    {r.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Upload Image</label>
                                    <div
                                        onClick={() => document.getElementById('nft-upload')?.click()}
                                        className="w-full aspect-[2/1] bg-black/30 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/30 hover:bg-white/[0.02] transition-all"
                                    >
                                        {preview ? (
                                            <img src={preview} alt="" className="h-full w-full object-contain p-2" />
                                        ) : (
                                            <>
                                                <Plus size={24} className="text-text-muted" />
                                                <span className="text-[10px] font-bold text-text-muted uppercase">JPG, PNG, GIF (Max 10MB)</span>
                                            </>
                                        )}
                                        <input id="nft-upload" type="file" onChange={handleFile} className="hidden" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* More Form Fields... (Supply, Price, Tags, Toggles, Attributes) */}
                        <div className="grid grid-cols-2 gap-6 border-t border-white/5 pt-8">
                            <div>
                                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Collection</label>
                                <select
                                    value={form.collectionId}
                                    onChange={e => setForm(f => ({ ...f, collectionId: e.target.value }))}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary/50 outline-none"
                                >
                                    <option value="">None</option>
                                    {collections.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Max Supply</label>
                                <input
                                    type="number" min={0} value={form.maxSupply}
                                    onChange={e => setForm(f => ({ ...f, maxSupply: +e.target.value }))}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary/50 outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Tags (comma separated)</label>
                                <input
                                    value={form.tags}
                                    onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary/50 outline-none"
                                    placeholder="e.g. fire, melee, warrior, season-1"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-8 pt-4">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={cn(
                                    "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                                    form.isEquippable ? "bg-primary border-primary" : "border-white/10 group-hover:border-white/20"
                                )}>
                                    <input type="checkbox" checked={form.isEquippable} onChange={e => setForm(f => ({ ...f, isEquippable: e.target.checked }))} className="hidden" />
                                    {form.isEquippable && <Plus size={14} className="text-black" />}
                                </div>
                                <span className="text-xs text-white font-bold">Equippable</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={cn(
                                    "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                                    form.isTradeable ? "bg-primary border-primary" : "border-white/10 group-hover:border-white/20"
                                )}>
                                    <input type="checkbox" checked={form.isTradeable} onChange={e => setForm(f => ({ ...f, isTradeable: e.target.checked }))} className="hidden" />
                                    {form.isTradeable && <Plus size={14} className="text-black" />}
                                </div>
                                <span className="text-xs text-white font-bold">Tradeable</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={cn(
                                    "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                                    form.isConsumable ? "bg-primary border-primary" : "border-white/10 group-hover:border-white/20"
                                )}>
                                    <input type="checkbox" checked={form.isConsumable} onChange={e => setForm(f => ({ ...f, isConsumable: e.target.checked }))} className="hidden" />
                                    {form.isConsumable && <Plus size={14} className="text-black" />}
                                </div>
                                <span className="text-xs text-white font-bold">Consumable</span>
                            </label>
                        </div>

                        {/* Attributes Builder */}
                        <div className="space-y-4 border-t border-white/5 pt-8">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest">Metadata & Stats</h4>
                                <button onClick={addAttrRow} className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase hover:underline">
                                    <Plus size={14} /> Add Property
                                </button>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {attrs.map((attr, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-2xl p-4 group/attr">
                                        <input
                                            value={attr.traitType} onChange={e => updateAttr(idx, 'traitType', e.target.value)}
                                            placeholder="Trait (e.g. Strength)"
                                            className="flex-1 bg-transparent text-xs text-white outline-none"
                                        />
                                        <input
                                            value={attr.value} onChange={e => updateAttr(idx, 'value', e.target.value)}
                                            placeholder="Value"
                                            className="w-20 bg-transparent text-xs text-white outline-none text-center"
                                        />
                                        <div className="flex items-center gap-2 border-l border-white/5 pl-3">
                                            <input
                                                type="number"
                                                value={attr.numericValue ?? ''}
                                                onChange={e => updateAttr(idx, 'numericValue', e.target.value ? +e.target.value : undefined)}
                                                placeholder="Numeric"
                                                className="w-16 bg-transparent text-xs text-white outline-none text-center placeholder:text-white/10"
                                            />
                                            <span className="text-text-muted opacity-20">/</span>
                                            <input
                                                type="number"
                                                value={attr.maxValue ?? ''}
                                                onChange={e => updateAttr(idx, 'maxValue', e.target.value ? +e.target.value : undefined)}
                                                placeholder="Max"
                                                className="w-16 bg-transparent text-xs text-white outline-none text-center placeholder:text-white/10"
                                            />
                                        </div>
                                        <button onClick={() => removeAttrRow(idx)} className="text-red-400/50 hover:text-red-400 transition-colors"><X size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Live Preview */}
                    <div className="w-80 shrink-0 bg-black/40 p-8 border-l border-white/5 overflow-y-auto custom-scrollbar">
                        <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-6">Real-time Preview</h4>

                        <div
                            className="w-full rounded-2xl overflow-hidden border transition-all duration-500"
                            style={{ borderColor: rarityColor + '30', boxShadow: `0 0 40px ${rarityColor}15` }}
                        >
                            <div
                                className="aspect-[3/4] relative flex items-center justify-center overflow-hidden"
                                style={{ background: RARITY_GRADIENTS[form.rarity] }}
                            >
                                <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center 60%, ${rarityColor}25 0%, transparent 70%)` }} />
                                {preview ? (
                                    <img src={preview} alt="" className="relative z-10 w-full h-full object-contain drop-shadow-2xl" />
                                ) : (
                                    <div className="relative z-10 text-5xl opacity-20">🎮</div>
                                )}
                                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase text-white backdrop-blur-sm" style={{ background: rarityColor + '40' }}>
                                    ✦ {form.rarity}
                                </div>
                            </div>
                            <div className="bg-[#111214] p-5 space-y-3">
                                <div>
                                    <h3 className="text-white font-black text-sm truncate">{form.name || 'Untitled Artifact'}</h3>
                                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{form.category}</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {attrs.filter(a => a.traitType).map((a, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-white/5 rounded-lg text-[8px] font-bold text-text-muted">
                                            {a.traitType}: {a.value}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-white/5 bg-white/[0.02]">
                    <button onClick={onClose} className="px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-white text-sm font-bold transition-all">Discard Changes</button>
                    <button
                        onClick={handleCreate}
                        disabled={saving || !form.name.trim()}
                        className="px-10 py-3 rounded-xl bg-primary hover:bg-primary/90 text-black text-sm font-black uppercase tracking-wider disabled:opacity-50 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,136,0.2)]"
                    >
                        {saving ? <><Loader2 size={16} className="animate-spin" /> Minting…</> : <><Sparkles size={16} /> Deploy to Market</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
