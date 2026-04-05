import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Plus, Search, X, Loader2, Trash2, Upload, Sparkles,
    Shield, Sword, Zap, Heart, Star, Crown, Diamond, Flame,
    Send, BarChart3, Box, Palette, User, SlidersHorizontal,
    RotateCcw, Save, Wand2,
} from 'lucide-react';
import {
    nftCoreService, nftCollectionService, nftAttributeService, nftMintService,
    NFT_CATEGORIES, NFT_RARITIES, RARITY_COLORS, RARITY_GRADIENTS,
    getImageUrl,
    type Nft, type NftCollection, type NftAttribute, type NftCategory, type NftRarity,
} from '../../services/nftAdminService';

// ─── Rarity tailwind helpers ─────────────────────────────────────────────────

const RARITY_TW: Record<NftRarity, { bg: string; border: string; text: string; glow: string }> = {
    COMMON:    { bg: 'bg-gray-500/10', border: 'border-gray-500/20', text: 'text-gray-400', glow: '' },
    UNCOMMON:  { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', glow: 'shadow-[0_0_20px_rgba(76,175,80,0.15)]' },
    RARE:      { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', glow: 'shadow-[0_0_20px_rgba(33,150,243,0.15)]' },
    EPIC:      { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', glow: 'shadow-[0_0_25px_rgba(156,39,176,0.2)]' },
    LEGENDARY: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', glow: 'shadow-[0_0_30px_rgba(255,152,0,0.25)]' },
    MYTHIC:    { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', glow: 'shadow-[0_0_35px_rgba(244,67,54,0.3)]' },
};

const STAT_ICONS: Record<string, React.ReactNode> = {
    Damage: <Sword size={12} />, Defense: <Shield size={12} />, Speed: <Zap size={12} />,
    Health: <Heart size={12} />, 'Critical %': <Star size={12} />, Power: <Flame size={12} />,
    'Fight Power': <Sword size={12} />, Flexibility: <Zap size={12} />, 'Magic Power': <Sparkles size={12} />,
    'Special Ability': <Diamond size={12} />, 'Fight Range': <Crown size={12} />,
    Control: <Shield size={12} />, Stamina: <Heart size={12} />, Endurance: <Shield size={12} />,
};

export default function NftManager() {
    const [searchParams] = useSearchParams();
    const collectionFilter = searchParams.get('collectionId') || '';

    const [nfts, setNfts] = useState<Nft[]>([]);
    const [collections, setCollections] = useState<NftCollection[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState<NftCategory | 'ALL'>('ALL');
    const [filterRarity, setFilterRarity] = useState<NftRarity | 'ALL'>('ALL');
    const [selectedNft, setSelectedNft] = useState<(Nft & { attributes: NftAttribute[] }) | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [activeView, setActiveView] = useState<'studio' | 'inventory'>('studio');

    const load = async () => {
        try {
            setLoading(true);
            const filters: Record<string, string> = {};
            if (filterCat !== 'ALL') filters.category = filterCat;
            if (filterRarity !== 'ALL') filters.rarity = filterRarity;
            if (collectionFilter) filters.collectionId = collectionFilter;
            const [nftData, colData] = await Promise.all([
                nftCoreService.getAll(filters),
                nftCollectionService.getAll(),
            ]);
            setNfts(nftData);
            setCollections(colData);
        } catch (e) {
            console.error('Failed to load NFTs', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [filterCat, filterRarity, collectionFilter]);

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this NFT? Only DRAFT NFTs can be deleted.')) return;
        try {
            await nftCoreService.delete(id);
            setNfts(prev => prev.filter(n => n._id !== id));
            if (selectedNft?._id === id) setSelectedNft(null);
        } catch (e: unknown) {
            alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Delete failed');
        }
    };

    const viewDetail = async (nft: Nft) => {
        try {
            const detail = await nftCoreService.getOne(nft._id);
            setSelectedNft(detail);
        } catch {
            setSelectedNft({ ...nft, attributes: nft.attributes || [] });
        }
    };

    const filtered = nfts.filter(n => {
        if (search && !n.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <Box size={24} className="text-primary" />
                        NFT Avatar Studio
                    </h1>
                    <p className="text-text-muted text-sm mt-1">Import a base avatar, customize traits, and save as draft NFT</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="bg-surface border border-white/10 rounded-xl p-1 flex items-center gap-1">
                        <button
                            onClick={() => setActiveView('studio')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'studio' ? 'bg-primary text-black' : 'text-text-muted hover:text-white'}`}
                        >
                            Avatar Studio
                        </button>
                        <button
                            onClick={() => setActiveView('inventory')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'inventory' ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'}`}
                        >
                            NFT Inventory
                        </button>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-black text-sm font-black uppercase tracking-wider transition-all"
                    >
                        <Plus size={16} /> Create NFT
                    </button>
                </div>
            </div>

            {activeView === 'studio' && (
                <AvatarStudio
                    onDraftCreated={(nft) => {
                        setActiveView('inventory');
                        load();
                        viewDetail(nft);
                    }}
                />
            )}

            {activeView === 'inventory' && (
                <>
                    {/* Filters */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative flex-1 max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input
                                type="text" placeholder="Search NFTs..." value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-surface border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-text-muted/50 focus:border-primary/50 outline-none"
                            />
                        </div>
                        <select
                            value={filterCat}
                            onChange={e => setFilterCat(e.target.value as NftCategory | 'ALL')}
                            className="bg-surface border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                        >
                            <option value="ALL">All Categories</option>
                            {NFT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                        <select
                            value={filterRarity}
                            onChange={e => setFilterRarity(e.target.value as NftRarity | 'ALL')}
                            className="bg-surface border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                        >
                            <option value="ALL">All Rarities</option>
                            {NFT_RARITIES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </div>

                    {/* Main Content: Grid + Detail Panel */}
                    <div className="flex gap-6">
                        {/* Left: NFT Grid */}
                        <div className={`flex-1 ${selectedNft ? 'max-w-[60%]' : ''} transition-all`}>
                            {loading ? (
                                <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-primary" /></div>
                            ) : filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center bg-surface border border-white/5 rounded-2xl">
                                    <Box className="w-12 h-12 text-primary opacity-20 mb-4" />
                                    <p className="text-white font-black text-lg">No NFTs found</p>
                                    <p className="text-text-muted text-sm mt-1">Create your first NFT to get started</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filtered.map(nft => {
                                        const rtw = RARITY_TW[nft.rarity];
                                        return (
                                            <div
                                                key={nft._id}
                                                onClick={() => viewDetail(nft)}
                                                className={`group cursor-pointer border rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 ${rtw.border} bg-[#111214] ${rtw.glow} ${selectedNft?._id === nft._id ? 'ring-2 ring-primary' : ''}`}
                                            >
                                                {/* Image */}
                                                <div className="relative aspect-square bg-gradient-to-br from-black/40 to-black/60 flex items-center justify-center overflow-hidden">
                                                    {nft.imageUrl ? (
                                                        <img
                                                            src={getImageUrl(nft.imageUrl)}
                                                            alt={nft.name}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                            onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${nft.name}`; }}
                                                        />
                                                    ) : (
                                                        <div className="text-4xl opacity-30">🎮</div>
                                                    )}
                                                    {/* Rarity badge */}
                                                    <span
                                                        className="absolute top-3 left-3 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white backdrop-blur-sm"
                                                        style={{ background: RARITY_COLORS[nft.rarity] + '40' }}
                                                    >
                                                        {nft.rarity}
                                                    </span>
                                                    {/* Status */}
                                                    <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${nft.status === 'DRAFT' ? 'bg-yellow-500/20 text-yellow-400' : nft.status === 'MINTED' ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white'}`}>
                                                        {nft.status}
                                                    </span>
                                                    {/* Category */}
                                                    <span className="absolute bottom-2 left-3 px-2 py-0.5 rounded-lg bg-black/50 backdrop-blur-sm text-[8px] font-bold text-white uppercase tracking-widest">
                                                        {nft.category}
                                                    </span>
                                                </div>

                                                {/* Info */}
                                                <div className="p-3 space-y-2">
                                                    <h3 className="text-white font-black text-sm truncate">{nft.name}</h3>
                                                    <div className="flex items-center justify-between text-[10px] text-text-muted font-bold">
                                                        <span>Supply: {nft.supply}/{nft.maxSupply === 0 ? '∞' : nft.maxSupply}</span>
                                                        {nft.isTradeable && <span className="text-primary">Tradeable</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Right: Detail Panel */}
                        {selectedNft && (
                            <NftDetailPanel
                                nft={selectedNft}
                                onClose={() => setSelectedNft(null)}
                                onDelete={() => handleDelete(selectedNft._id)}
                                onRefresh={() => viewDetail(selectedNft)}
                            />
                        )}
                    </div>
                </>
            )}

            {/* Create Modal */}
            {showCreate && (
                <CreateNftModal
                    collections={collections}
                    onClose={() => setShowCreate(false)}
                    onCreated={(nft) => { setShowCreate(false); load(); viewDetail(nft); }}
                />
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AVATAR STUDIO
// ═══════════════════════════════════════════════════════════════════════════════

type AvatarLayerKey = 'base' | 'hair' | 'ears' | 'outfit' | 'accessory';
type AvatarLayer = { file: File | null; preview: string | null };
type AvatarLayers = Record<AvatarLayerKey, AvatarLayer>;
type AvatarView = 'front' | 'side' | 'back';

const LAYER_LABELS: Record<AvatarLayerKey, string> = {
    base: 'Base Body',
    hair: 'Hair Layer',
    ears: 'Ears Layer',
    outfit: 'Outfit Layer',
    accessory: 'Accessory Layer',
};

function AvatarStudio({ onDraftCreated }: { onDraftCreated: (nft: Nft) => void }) {
    const fileRefs = useRef<Record<AvatarLayerKey, HTMLInputElement | null>>({
        base: null,
        hair: null,
        ears: null,
        outfit: null,
        accessory: null,
    });
    const [saving, setSaving] = useState(false);
    const [layers, setLayers] = useState<AvatarLayers>({
        base: { file: null, preview: null },
        hair: { file: null, preview: null },
        ears: { file: null, preview: null },
        outfit: { file: null, preview: null },
        accessory: { file: null, preview: null },
    });
    const [config, setConfig] = useState({
        gender: 'FEMALE',
        view: 'front' as AvatarView,
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
        power: 84,
        agility: 76,
        focus: 88,
    });

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
            power: 84,
            agility: 76,
            focus: 88,
        });
    };

    const score = Math.round((config.power + config.agility + config.focus) / 3);
    const rarity: NftRarity =
        score >= 90 ? 'MYTHIC'
            : score >= 80 ? 'LEGENDARY'
                : score >= 68 ? 'EPIC'
                    : score >= 56 ? 'RARE'
                        : score >= 40 ? 'UNCOMMON'
                            : 'COMMON';
    const generatedName = `${config.gender === 'MALE' ? 'Male' : 'Female'} ${config.outfit} ${config.hairstyle}`;

    const attributes = [
        { traitType: 'Gender', value: config.gender },
        { traitType: 'Body Type', value: config.bodyType },
        { traitType: 'Skin Tone', value: config.skinTone },
        { traitType: 'Face Style', value: config.faceStyle },
        { traitType: 'Hair Style', value: config.hairstyle },
        { traitType: 'Hair Length', value: String(config.hairLength), numericValue: config.hairLength, maxValue: 100 },
        { traitType: 'Hair Color', value: config.hairColor },
        { traitType: 'Ear Type', value: config.earType },
        { traitType: 'Ear Size', value: String(config.earSize), numericValue: config.earSize, maxValue: 100 },
        { traitType: 'Eye Color', value: config.eyeColor },
        { traitType: 'Eyebrow', value: config.eyebrow },
        { traitType: 'Nose', value: config.nose },
        { traitType: 'Mouth', value: config.mouth },
        { traitType: 'Outfit', value: config.outfit },
        { traitType: 'Boots', value: config.boots },
        { traitType: 'Accessory', value: config.accessory },
        { traitType: 'Aura', value: config.aura },
        { traitType: 'Power', value: String(config.power), numericValue: config.power, maxValue: 100 },
        { traitType: 'Agility', value: String(config.agility), numericValue: config.agility, maxValue: 100 },
        { traitType: 'Focus', value: String(config.focus), numericValue: config.focus, maxValue: 100 },
    ];

    const saveAsDraft = async () => {
        try {
            setSaving(true);
            const fd = new FormData();
            fd.append('name', generatedName);
            fd.append('description', `${config.gender} avatar generated from layered base model with editable hair, ears, face, outfit, and accessories.`);
            fd.append('category', 'AVATAR');
            fd.append('rarity', rarity);
            fd.append('tags', JSON.stringify([
                'avatar-studio',
                config.gender.toLowerCase(),
                config.outfit.toLowerCase().replace(/\s+/g, '-'),
                config.hairstyle.toLowerCase().replace(/\s+/g, '-'),
                config.earType.toLowerCase(),
            ]));
            fd.append('isEquippable', 'true');
            fd.append('isTradeable', 'true');
            fd.append('isConsumable', 'false');
            fd.append('maxSupply', '100');

            const primaryFile = layers.base.file || layers.outfit.file || layers.hair.file || layers.ears.file || layers.accessory.file;
            if (primaryFile) fd.append('file', primaryFile);

            const created = await nftCoreService.create(fd);
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
            alert('Avatar draft created.');
        } catch (e: unknown) {
            alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create avatar draft');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-5">
            <div className="bg-[#111214] border border-white/10 rounded-2xl p-5 space-y-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-2">
                        <Wand2 size={15} className="text-primary" />
                        Character Creator
                    </h2>
                    <button
                        onClick={resetStudio}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-white border border-white/10 hover:border-white/20 transition-all"
                    >
                        <RotateCcw size={12} /> Reset
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => setConfig(prev => ({ ...prev, gender: 'MALE' }))}
                        className={`py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${config.gender === 'MALE' ? 'bg-primary text-black border-primary' : 'text-text-muted border-white/10 hover:text-white'}`}
                    >
                        Male
                    </button>
                    <button
                        onClick={() => setConfig(prev => ({ ...prev, gender: 'FEMALE' }))}
                        className={`py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${config.gender === 'FEMALE' ? 'bg-primary text-black border-primary' : 'text-text-muted border-white/10 hover:text-white'}`}
                    >
                        Female
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(['front', 'side', 'back'] as AvatarView[]).map(view => (
                        <button
                            key={view}
                            onClick={() => setConfig(prev => ({ ...prev, view }))}
                            className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${config.view === view ? 'bg-white/15 text-white border-white/20' : 'text-text-muted border-white/10 hover:text-white'}`}
                        >
                            {view} View
                        </button>
                    ))}
                </div>

                <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Layer Uploads</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {(Object.keys(LAYER_LABELS) as AvatarLayerKey[]).map(key => (
                            <div key={key} className="bg-black/25 border border-white/10 rounded-xl p-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{LAYER_LABELS[key]}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <button
                                        onClick={() => fileRefs.current[key]?.click()}
                                        className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        Upload
                                    </button>
                                    <button
                                        onClick={() => clearLayer(key)}
                                        className="px-3 py-2 rounded-lg border border-white/15 text-text-muted hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        Clear
                                    </button>
                                </div>
                                <input
                                    ref={el => { fileRefs.current[key] = el; }}
                                    type="file"
                                    accept="image/*"
                                    onChange={e => pickLayer(key, e)}
                                    className="hidden"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <StudioSelect label="Body Type" icon={<User size={12} />} value={config.bodyType} options={['Athletic', 'Lean', 'Heavy', 'Heroic']} onChange={value => setConfig(prev => ({ ...prev, bodyType: value }))} />
                    <StudioSelect label="Face Style" icon={<User size={12} />} value={config.faceStyle} options={['Sharp', 'Soft', 'Strong', 'Angular']} onChange={value => setConfig(prev => ({ ...prev, faceStyle: value }))} />
                    <StudioSelect label="Hair Style" icon={<Sparkles size={12} />} value={config.hairstyle} options={['Bald', 'Buzz', 'Short', 'Long', 'Braids', 'Mohawk']} onChange={value => setConfig(prev => ({ ...prev, hairstyle: value }))} />
                    <StudioSelect label="Ear Type" icon={<Sparkles size={12} />} value={config.earType} options={['Human', 'Elf', 'Cyber', 'Pointed']} onChange={value => setConfig(prev => ({ ...prev, earType: value }))} />
                    <StudioSelect label="Outfit" icon={<Palette size={12} />} value={config.outfit} options={['Tactical', 'Streetwear', 'Cyber Suit', 'Stealth', 'Battle Armor']} onChange={value => setConfig(prev => ({ ...prev, outfit: value }))} />
                    <StudioSelect label="Accessory" icon={<Sparkles size={12} />} value={config.accessory} options={['Holster', 'Necklace', 'Headset', 'Blade', 'None']} onChange={value => setConfig(prev => ({ ...prev, accessory: value }))} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <ColorPicker label="Skin Tone" value={config.skinTone} onChange={value => setConfig(prev => ({ ...prev, skinTone: value }))} />
                    <ColorPicker label="Hair Color" value={config.hairColor} onChange={value => setConfig(prev => ({ ...prev, hairColor: value }))} />
                    <ColorPicker label="Eye Color" value={config.eyeColor} onChange={value => setConfig(prev => ({ ...prev, eyeColor: value }))} />
                    <StudioSelect label="Aura" icon={<Sparkles size={12} />} value={config.aura} options={['Neon', 'Ice', 'Shadow', 'Fire', 'Gold']} onChange={value => setConfig(prev => ({ ...prev, aura: value }))} />
                </div>

                <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
                        <SlidersHorizontal size={12} />
                        Morph Controls
                    </p>
                    <StudioSlider label="Hair Length" value={config.hairLength} onChange={value => setConfig(prev => ({ ...prev, hairLength: value }))} />
                    <StudioSlider label="Ear Size" value={config.earSize} onChange={value => setConfig(prev => ({ ...prev, earSize: value }))} />
                    <StudioSlider label="Power" value={config.power} onChange={value => setConfig(prev => ({ ...prev, power: value }))} />
                    <StudioSlider label="Agility" value={config.agility} onChange={value => setConfig(prev => ({ ...prev, agility: value }))} />
                    <StudioSlider label="Focus" value={config.focus} onChange={value => setConfig(prev => ({ ...prev, focus: value }))} />
                </div>
            </div>

            <div className="bg-[#111214] border border-white/10 rounded-2xl p-5 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Base Model and Final Look</p>

                <div className="grid grid-cols-3 gap-2">
                    {(['front', 'side', 'back'] as AvatarView[]).map(view => (
                        <AvatarPreviewCard key={view} view={view} config={config} layers={layers} compact />
                    ))}
                </div>

                <AvatarPreviewCard view={config.view} config={config} layers={layers} />

                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black/25 border border-white/10 rounded-xl px-3 py-2">
                        <p className="text-[9px] uppercase tracking-widest text-text-muted font-bold">Generated Name</p>
                        <p className="text-sm text-white font-bold truncate">{generatedName}</p>
                    </div>
                    <div className="bg-black/25 border border-white/10 rounded-xl px-3 py-2">
                        <p className="text-[9px] uppercase tracking-widest text-text-muted font-bold">Auto Rarity</p>
                        <p className="text-sm font-black" style={{ color: RARITY_COLORS[rarity] }}>{rarity}</p>
                    </div>
                </div>

                <button
                    onClick={saveAsDraft}
                    disabled={saving}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary/90 text-black text-sm font-black uppercase tracking-wider disabled:opacity-50 transition-all"
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Saving Draft...' : 'Save Character as NFT'}
                </button>
            </div>
        </div>
    );
}

function AvatarPreviewCard({ view, config, layers, compact = false }: {
    view: AvatarView;
    config: {
        gender: string;
        bodyType: string;
        skinTone: string;
        hairLength: number;
        hairColor: string;
        earSize: number;
        aura: string;
    };
    layers: AvatarLayers;
    compact?: boolean;
}) {
    const auraBg: Record<string, string> = {
        Neon: 'linear-gradient(160deg, #0a1220, #172554 65%, #0e7490)',
        Ice: 'linear-gradient(160deg, #0f172a, #1d4ed8 60%, #bae6fd)',
        Shadow: 'linear-gradient(160deg, #020617, #312e81 55%, #581c87)',
        Fire: 'linear-gradient(160deg, #111827, #9a3412 55%, #dc2626)',
        Gold: 'linear-gradient(160deg, #111827, #78350f 55%, #f59e0b)',
    };
    const bodyScale = config.bodyType === 'Heroic' ? 1.06 : config.bodyType === 'Lean' ? 0.94 : 1;
    const viewTransform = view === 'side' ? 'rotateY(24deg)' : view === 'back' ? 'rotateY(180deg)' : 'none';

    return (
        <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: auraBg[config.aura] || auraBg.Neon }}>
            <div className={`relative ${compact ? 'h-40' : 'h-[430px]'} flex items-center justify-center p-4`} style={{ perspective: '900px' }}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(255,255,255,.25),transparent_65%)]" />

                {!layers.base.preview && (
                    <div
                        className="relative z-10 w-24 h-56 rounded-full border border-white/20"
                        style={{
                            background: `linear-gradient(180deg, ${config.skinTone}ee, ${config.skinTone}aa)`,
                            transform: `${viewTransform} scale(${compact ? 0.65 : bodyScale})`,
                        }}
                    >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border border-white/25" style={{ background: config.skinTone }} />
                    </div>
                )}

                {[layers.base.preview, layers.outfit.preview, layers.hair.preview, layers.ears.preview, layers.accessory.preview].map((src, idx) => src && (
                    <img
                        key={`${idx}-${src}`}
                        src={src}
                        alt=""
                        className="absolute inset-0 w-full h-full object-contain z-10 pointer-events-none"
                        style={{
                            transform: `${viewTransform} scale(${(compact ? 0.7 : bodyScale) + (idx === 2 ? config.hairLength / 500 : idx === 3 ? config.earSize / 700 : 0)})`,
                            filter: idx === 2 ? `drop-shadow(0 0 12px ${config.hairColor})` : undefined,
                        }}
                    />
                ))}

                <span className="absolute top-2 left-2 z-20 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-black/40 text-white">
                    {view}
                </span>
            </div>
        </div>
    );
}

function StudioSelect({ label, icon, value, options, onChange }: {
    label: string;
    icon: React.ReactNode;
    value: string;
    options: string[];
    onChange: (value: string) => void;
}) {
    return (
        <div>
            <label className="block text-[10px] mb-1.5 font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
                {icon}
                {label}
            </label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary/60 outline-none"
            >
                {options.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
        </div>
    );
}

function StudioSlider({ label, value, onChange }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
}) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white font-bold">{label}</span>
                <span className="text-xs text-primary font-black">{value}</span>
            </div>
            <input
                type="range"
                min={0}
                max={100}
                value={value}
                onChange={e => onChange(+e.target.value)}
                className="w-full accent-primary"
            />
        </div>
    );
}

function ColorPicker({ label, value, onChange }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div>
            <label className="block text-[10px] mb-1.5 font-black uppercase tracking-widest text-text-muted">{label}</label>
            <input
                type="color"
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full h-10 bg-black/30 border border-white/10 rounded-xl px-1.5 py-1 cursor-pointer"
            />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NFT DETAIL PANEL — The 3D gaming-style preview
// ═══════════════════════════════════════════════════════════════════════════════

function NftDetailPanel({ nft, onClose, onDelete, onRefresh }: {
    nft: Nft & { attributes: NftAttribute[] };
    onClose: () => void; onDelete: () => void; onRefresh: () => void;
}) {
    const [showAirdrop, setShowAirdrop] = useState(false);
    const [showAddAttr, setShowAddAttr] = useState(false);
    const [mintWallet, setMintWallet] = useState('');
    const [minting, setMinting] = useState(false);

    const collectionName = nft.collectionId
        ? (typeof nft.collectionId === 'string' ? nft.collectionId : nft.collectionId.name)
        : 'None';

    const handleMint = async () => {
        if (!mintWallet.trim()) return;
        try {
            setMinting(true);
            await nftMintService.mint({ nftId: nft._id, walletAddress: mintWallet });
            alert('Minted successfully!');
            setMintWallet('');
            onRefresh();
        } catch (e: unknown) {
            alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Mint failed');
        } finally {
            setMinting(false);
        }
    };

    const removeAttr = async (attrId: string) => {
        try {
            await nftAttributeService.remove(attrId);
            onRefresh();
        } catch (e) {
            console.error('Remove attr failed', e);
        }
    };

    // Stat attributes (have numericValue/maxValue)
    const statAttrs = (nft.attributes || []).filter(a => a.numericValue != null && a.maxValue != null);
    const traitAttrs = (nft.attributes || []).filter(a => a.numericValue == null || a.maxValue == null);

    return (
        <div className="w-[420px] shrink-0 bg-[#111214] border border-white/5 rounded-2xl overflow-hidden flex flex-col max-h-[calc(100vh-220px)] sticky top-24">
            {/* Close */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
                <h3 className="text-white font-black text-sm uppercase tracking-widest">NFT Details</h3>
                <button onClick={onClose} className="text-text-muted hover:text-white transition-colors"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* ═══ Hero Image ═══ */}
                <div className="relative">
                    <div
                        className="aspect-[4/5] flex items-center justify-center overflow-hidden relative"
                        style={{ background: RARITY_GRADIENTS[nft.rarity] }}
                    >
                        {/* Radial glow behind character */}
                        <div
                            className="absolute inset-0"
                            style={{
                                background: `radial-gradient(ellipse at center 60%, ${RARITY_COLORS[nft.rarity]}30 0%, transparent 70%)`,
                            }}
                        />
                        {nft.imageUrl ? (
                            <img
                                src={getImageUrl(nft.imageUrl)}
                                alt={nft.name}
                                className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
                                style={{ filter: `drop-shadow(0 0 30px ${RARITY_COLORS[nft.rarity]}40)` }}
                                onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${nft.name}`; }}
                            />
                        ) : (
                            <div className="relative z-10 text-6xl opacity-30">🎮</div>
                        )}

                        {/* Rarity badge floating */}
                        <div
                            className="absolute top-4 left-4 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md border"
                            style={{ background: RARITY_COLORS[nft.rarity] + '30', borderColor: RARITY_COLORS[nft.rarity] + '50' }}
                        >
                            ✦ {nft.rarity}
                        </div>

                        {/* Status floating */}
                        <div className={`absolute top-4 right-4 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md ${nft.status === 'DRAFT' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-primary/20 text-primary border border-primary/30'}`}>
                            {nft.status}
                        </div>

                        {/* Bottom gradient fade */}
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#111214] to-transparent" />
                    </div>
                </div>

                {/* ═══ Info Section ═══ */}
                <div className="p-5 space-y-5 -mt-8 relative z-10">
                    {/* Name + Category */}
                    <div>
                        <h2 className="text-2xl font-black text-white leading-tight">{nft.name}</h2>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="px-2 py-0.5 rounded-lg bg-white/5 text-[9px] font-black uppercase tracking-widest text-text-muted">{nft.category}</span>
                            {nft.isEquippable && <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-[9px] font-black uppercase text-blue-400">Equippable</span>}
                            {nft.isTradeable && <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-[9px] font-black uppercase text-primary">Tradeable</span>}
                        </div>
                    </div>

                    {/* Description */}
                    {nft.description && (
                        <p className="text-text-muted text-sm leading-relaxed">{nft.description}</p>
                    )}

                    {/* Meta grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <MetaBox label="Collection" value={collectionName} />
                        <MetaBox label="Supply" value={`${nft.supply} / ${nft.maxSupply === 0 ? '∞' : nft.maxSupply}`} />
                        <MetaBox label="Tags" value={nft.tags?.join(', ') || 'None'} />
                        <MetaBox label="Status" value={nft.status} />
                    </div>

                    {/* ═══ STATS (progress bars — like the gaming character image) ═══ */}
                    {statAttrs.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest">Properties</h4>
                            <div className="space-y-2.5">
                                {statAttrs.map(attr => {
                                    const pct = Math.min(100, ((attr.numericValue || 0) / (attr.maxValue || 1)) * 100);
                                    const barColor = pct > 75 ? '#00ff88' : pct > 50 ? '#2196F3' : pct > 25 ? '#FF9800' : '#F44336';
                                    return (
                                        <div key={attr._id} className="group/attr">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-white">
                                                    {STAT_ICONS[attr.traitType] || <BarChart3 size={12} />}
                                                    {attr.traitType}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold" style={{ color: barColor }}>{attr.numericValue}/{attr.maxValue}</span>
                                                    <button
                                                        onClick={() => removeAttr(attr._id)}
                                                        className="opacity-0 group-hover/attr:opacity-100 text-red-400 hover:text-red-300 transition-all"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-700"
                                                    style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${barColor}80, ${barColor})`, boxShadow: `0 0 8px ${barColor}40` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ═══ TRAITS (text values) ═══ */}
                    {traitAttrs.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest">Traits</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {traitAttrs.map(attr => (
                                    <div key={attr._id} className="group/attr bg-white/5 border border-white/5 rounded-xl p-2.5 text-center relative">
                                        <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest">{attr.traitType}</p>
                                        <p className="text-white font-black text-xs mt-0.5">{attr.value}</p>
                                        <button
                                            onClick={() => removeAttr(attr._id)}
                                            className="absolute top-1 right-1 opacity-0 group-hover/attr:opacity-100 text-red-400 hover:text-red-300 transition-all"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add Attribute button */}
                    <button
                        onClick={() => setShowAddAttr(true)}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-white/10 hover:border-white/20 text-text-muted hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                        <Plus size={12} /> Add Attribute
                    </button>

                    {/* ═══ ACTIONS ═══ */}
                    <div className="space-y-3 pt-2 border-t border-white/5">
                        {/* Mint */}
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest">Mint on Blockchain</h4>
                            <div className="flex gap-2">
                                <input
                                    value={mintWallet}
                                    onChange={e => setMintWallet(e.target.value)}
                                    placeholder="0x wallet address..."
                                    className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-primary/50 outline-none"
                                />
                                <button
                                    onClick={handleMint}
                                    disabled={minting || !mintWallet.trim()}
                                    className="px-4 py-2 rounded-xl bg-primary/15 hover:bg-primary/25 border border-primary/20 text-primary text-[10px] font-black uppercase disabled:opacity-40 transition-all"
                                >
                                    {minting ? <Loader2 size={12} className="animate-spin" /> : 'Mint'}
                                </button>
                            </div>
                        </div>

                        {/* Airdrop */}
                        <button
                            onClick={() => setShowAirdrop(true)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            <Send size={12} /> Airdrop to Player
                        </button>

                        {/* Delete */}
                        {nft.status === 'DRAFT' && (
                            <button
                                onClick={onDelete}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                <Trash2 size={12} /> Delete NFT
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Attribute Modal */}
            {showAddAttr && (
                <AddAttributeModal nftId={nft._id} onClose={() => setShowAddAttr(false)} onAdded={() => { setShowAddAttr(false); onRefresh(); }} />
            )}

            {/* Airdrop Modal */}
            {showAirdrop && (
                <AirdropModal nftId={nft._id} onClose={() => setShowAirdrop(false)} onDone={() => { setShowAirdrop(false); onRefresh(); }} />
            )}
        </div>
    );
}

function MetaBox({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5">
            <p className="text-[8px] text-text-muted font-bold uppercase tracking-widest">{label}</p>
            <p className="text-white text-xs font-bold mt-0.5 truncate">{value}</p>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE NFT MODAL — Full form with image upload + live preview
// ═══════════════════════════════════════════════════════════════════════════════

function CreateNftModal({ collections, onClose, onCreated }: {
    collections: NftCollection[]; onClose: () => void; onCreated: (nft: Nft) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        name: '',
        description: '',
        category: 'CHARACTER' as NftCategory,
        rarity: 'EPIC' as NftRarity,
        collectionId: '',
        tags: '',
        isEquippable: true,
        isTradeable: true,
        isConsumable: false,
        maxSupply: 100,
    });

    // Initial attributes to add after creation
    const [attrs, setAttrs] = useState<{ traitType: string; value: string; numericValue?: number; maxValue?: number }[]>([
        { traitType: 'Fight Power', value: '80', numericValue: 80, maxValue: 100 },
        { traitType: 'Flexibility', value: '65', numericValue: 65, maxValue: 100 },
        { traitType: 'Magic Power', value: '90', numericValue: 90, maxValue: 100 },
    ]);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result as string);
        reader.readAsDataURL(f);
    };

    const addAttrRow = () => {
        setAttrs(prev => [...prev, { traitType: '', value: '', numericValue: undefined, maxValue: undefined }]);
    };

    const updateAttr = (idx: number, key: string, val: string | number | undefined) => {
        setAttrs(prev => prev.map((a, i) => i === idx ? { ...a, [key]: val } : a));
    };

    const removeAttrRow = (idx: number) => {
        setAttrs(prev => prev.filter((_, i) => i !== idx));
    };

    const handleCreate = async () => {
        if (!form.name.trim()) return;
        try {
            setSaving(true);
            const fd = new FormData();
            fd.append('name', form.name);
            fd.append('description', form.description);
            fd.append('category', form.category);
            fd.append('rarity', form.rarity);
            if (form.collectionId) fd.append('collectionId', form.collectionId);
            if (form.tags) fd.append('tags', JSON.stringify(form.tags.split(',').map(t => t.trim()).filter(Boolean)));
            fd.append('isEquippable', String(form.isEquippable));
            fd.append('isTradeable', String(form.isTradeable));
            fd.append('isConsumable', String(form.isConsumable));
            fd.append('maxSupply', String(form.maxSupply));
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
        } catch (e: unknown) {
            alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Creation failed');
        } finally {
            setSaving(false);
        }
    };

    const rarityColor = RARITY_COLORS[form.rarity];

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-[#111214] border border-white/10 rounded-2xl w-full max-w-5xl my-8 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                    <h2 className="text-white font-black text-lg uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={20} className="text-primary" />
                        Create Gaming NFT
                    </h2>
                    <button onClick={onClose} className="text-text-muted hover:text-white transition-colors"><X size={22} /></button>
                </div>

                <div className="flex">
                    {/* Left: Form */}
                    <div className="flex-1 p-6 space-y-5 border-r border-white/5 overflow-y-auto max-h-[75vh]">
                        {/* Image Upload */}
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">NFT Image / 3D Render *</label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="relative w-full h-48 border-2 border-dashed border-white/10 hover:border-primary/30 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group"
                            >
                                {preview ? (
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                ) : (
                                    <>
                                        <Upload size={32} className="text-text-muted mb-2" />
                                        <p className="text-text-muted text-xs font-bold">Click to upload image or 3D render</p>
                                        <p className="text-text-muted/50 text-[10px] mt-1">PNG, JPG, GIF, WebP up to 10MB</p>
                                    </>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                            </div>
                        </div>

                        {/* Name + Description */}
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Name *</label>
                                <input
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                                    placeholder="e.g. Shadow Warrior, Dragon Slayer Sword"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary/50 outline-none resize-none h-20"
                                    placeholder="Describe this NFT's lore, abilities, backstory..."
                                />
                            </div>
                        </div>

                        {/* Category + Rarity */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Category</label>
                                <select
                                    value={form.category}
                                    onChange={e => setForm(f => ({ ...f, category: e.target.value as NftCategory }))}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
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
                                            onClick={() => setForm(f => ({ ...f, rarity: r.value }))}
                                            className={`px-2 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${form.rarity === r.value ? 'text-white scale-105' : 'text-text-muted hover:text-white'}`}
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

                        {/* Collection + Supply */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Collection</label>
                                <select
                                    value={form.collectionId}
                                    onChange={e => setForm(f => ({ ...f, collectionId: e.target.value }))}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
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
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                                />
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Tags (comma separated)</label>
                            <input
                                value={form.tags}
                                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                                placeholder="e.g. fire, melee, warrior, season-1"
                            />
                        </div>

                        {/* Toggles */}
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.isEquippable} onChange={e => setForm(f => ({ ...f, isEquippable: e.target.checked }))} className="accent-primary w-4 h-4" />
                                <span className="text-xs text-white font-bold">Equippable</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.isTradeable} onChange={e => setForm(f => ({ ...f, isTradeable: e.target.checked }))} className="accent-primary w-4 h-4" />
                                <span className="text-xs text-white font-bold">Tradeable</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.isConsumable} onChange={e => setForm(f => ({ ...f, isConsumable: e.target.checked }))} className="accent-primary w-4 h-4" />
                                <span className="text-xs text-white font-bold">Consumable</span>
                            </label>
                        </div>

                        {/* ═══ Attributes / Stats Builder ═══ */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest">Attributes & Stats</h4>
                                <button onClick={addAttrRow} className="flex items-center gap-1 text-primary text-[10px] font-black uppercase hover:underline">
                                    <Plus size={12} /> Add
                                </button>
                            </div>
                            {attrs.map((attr, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-white/[0.02] border border-white/5 rounded-xl p-2.5">
                                    <input
                                        value={attr.traitType}
                                        onChange={e => updateAttr(idx, 'traitType', e.target.value)}
                                        placeholder="Trait name"
                                        className="flex-1 bg-transparent text-xs text-white outline-none placeholder-text-muted/30"
                                    />
                                    <input
                                        value={attr.value}
                                        onChange={e => updateAttr(idx, 'value', e.target.value)}
                                        placeholder="Value"
                                        className="w-16 bg-transparent text-xs text-white outline-none placeholder-text-muted/30 text-center"
                                    />
                                    <input
                                        type="number"
                                        value={attr.numericValue ?? ''}
                                        onChange={e => updateAttr(idx, 'numericValue', e.target.value ? +e.target.value : undefined)}
                                        placeholder="Num"
                                        className="w-14 bg-transparent text-xs text-white outline-none placeholder-text-muted/30 text-center"
                                    />
                                    <span className="text-text-muted text-[10px]">/</span>
                                    <input
                                        type="number"
                                        value={attr.maxValue ?? ''}
                                        onChange={e => updateAttr(idx, 'maxValue', e.target.value ? +e.target.value : undefined)}
                                        placeholder="Max"
                                        className="w-14 bg-transparent text-xs text-white outline-none placeholder-text-muted/30 text-center"
                                    />
                                    <button onClick={() => removeAttrRow(idx)} className="text-red-400 hover:text-red-300"><X size={14} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Live Preview Card */}
                    <div className="w-80 shrink-0 p-6 flex flex-col items-center justify-start bg-black/20 overflow-y-auto max-h-[75vh]">
                        <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4 self-start">Live Preview</h4>

                        {/* Preview Card */}
                        <div
                            className="w-full rounded-2xl overflow-hidden border transition-all duration-500"
                            style={{ borderColor: rarityColor + '30', boxShadow: `0 0 40px ${rarityColor}15` }}
                        >
                            {/* Image */}
                            <div
                                className="aspect-[3/4] flex items-center justify-center relative overflow-hidden"
                                style={{ background: RARITY_GRADIENTS[form.rarity] }}
                            >
                                <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center 60%, ${rarityColor}25 0%, transparent 70%)` }} />
                                {preview ? (
                                    <img src={preview} alt="" className="relative z-10 w-full h-full object-contain drop-shadow-2xl" style={{ filter: `drop-shadow(0 0 25px ${rarityColor}30)` }} />
                                ) : (
                                    <div className="relative z-10 text-5xl opacity-20">🎮</div>
                                )}
                                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase text-white backdrop-blur-sm" style={{ background: rarityColor + '40' }}>
                                    ✦ {form.rarity}
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#111214] to-transparent" />
                            </div>

                            {/* Info */}
                            <div className="bg-[#111214] p-4 space-y-3">
                                <div>
                                    <h3 className="text-white font-black text-sm">{form.name || 'NFT Name'}</h3>
                                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{form.category}</span>
                                </div>

                                {/* Preview stats */}
                                {attrs.filter(a => a.numericValue != null && a.maxValue != null && a.traitType).map((attr, idx) => {
                                    const pct = Math.min(100, ((attr.numericValue || 0) / (attr.maxValue || 1)) * 100);
                                    const barColor = pct > 75 ? '#00ff88' : pct > 50 ? '#2196F3' : pct > 25 ? '#FF9800' : '#F44336';
                                    return (
                                        <div key={idx}>
                                            <div className="flex justify-between text-[10px] font-bold mb-0.5">
                                                <span className="text-text-muted">{attr.traitType}</span>
                                                <span style={{ color: barColor }}>{attr.numericValue}/{attr.maxValue}</span>
                                            </div>
                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Preview traits */}
                                {attrs.filter(a => a.numericValue == null && a.traitType).length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {attrs.filter(a => a.numericValue == null && a.traitType).map((attr, idx) => (
                                            <span key={idx} className="px-2 py-0.5 bg-white/5 rounded-lg text-[8px] font-bold text-text-muted">
                                                {attr.traitType}: {attr.value}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-5 border-t border-white/5">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white text-sm font-bold transition-all">Cancel</button>
                    <button
                        onClick={handleCreate}
                        disabled={saving || !form.name.trim()}
                        className="px-8 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-black text-sm font-black uppercase tracking-wider disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                        {saving ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : <><Sparkles size={14} /> Create NFT</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADD ATTRIBUTE MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function AddAttributeModal({ nftId, onClose, onAdded }: { nftId: string; onClose: () => void; onAdded: () => void }) {
    const [form, setForm] = useState({ traitType: '', value: '', numericValue: '', maxValue: '' });
    const [saving, setSaving] = useState(false);

    const handleAdd = async () => {
        if (!form.traitType.trim()) return;
        try {
            setSaving(true);
            await nftAttributeService.add({
                nftId,
                traitType: form.traitType,
                value: form.value,
                displayType: form.numericValue ? 'number' : undefined,
                numericValue: form.numericValue ? +form.numericValue : undefined,
                maxValue: form.maxValue ? +form.maxValue : undefined,
            });
            onAdded();
        } catch (e: unknown) {
            alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Add failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                    <h2 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2"><BarChart3 size={16} className="text-primary" /> Add Attribute</h2>
                    <button onClick={onClose} className="text-text-muted hover:text-white"><X size={18} /></button>
                </div>

                <div className="space-y-3">
                    <input
                        value={form.traitType} onChange={e => setForm(f => ({ ...f, traitType: e.target.value }))}
                        placeholder="Trait name (e.g. Damage, Background)"
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                    />
                    <input
                        value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                        placeholder="Value (e.g. 150 or Fire)"
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="number" value={form.numericValue} onChange={e => setForm(f => ({ ...f, numericValue: e.target.value }))}
                            placeholder="Numeric (optional)"
                            className="bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                        />
                        <input
                            type="number" value={form.maxValue} onChange={e => setForm(f => ({ ...f, maxValue: e.target.value }))}
                            placeholder="Max (optional)"
                            className="bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white text-sm font-bold transition-all">Cancel</button>
                    <button onClick={handleAdd} disabled={saving || !form.traitType.trim()} className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-black text-sm font-black uppercase disabled:opacity-50 transition-all">
                        {saving ? 'Adding…' : 'Add'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AIRDROP MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function AirdropModal({ nftId, onClose, onDone }: { nftId: string; onClose: () => void; onDone: () => void }) {
    const [userId, setUserId] = useState('');
    const [wallet, setWallet] = useState('');
    const [saving, setSaving] = useState(false);

    const handleAirdrop = async () => {
        if (!userId.trim()) return;
        try {
            setSaving(true);
            await nftMintService.airdrop({ nftId, toUserId: userId, walletAddress: wallet || undefined });
            alert('Airdrop successful!');
            onDone();
        } catch (e: unknown) {
            alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Airdrop failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                    <h2 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2"><Send size={16} className="text-blue-400" /> Airdrop NFT</h2>
                    <button onClick={onClose} className="text-text-muted hover:text-white"><X size={18} /></button>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">User ID *</label>
                        <input
                            value={userId} onChange={e => setUserId(e.target.value)}
                            placeholder="Target user ID"
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Wallet Address (optional)</label>
                        <input
                            value={wallet} onChange={e => setWallet(e.target.value)}
                            placeholder="0x..."
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white text-sm font-bold transition-all">Cancel</button>
                    <button onClick={handleAirdrop} disabled={saving || !userId.trim()} className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-500/90 text-white text-sm font-black uppercase disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                        {saving ? 'Sending…' : <><Send size={14} /> Airdrop</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
