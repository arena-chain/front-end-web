import { useState, useEffect, useRef, useCallback, useMemo, type CSSProperties } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import '@google/model-viewer';
import type { ModelViewerElement } from '@google/model-viewer';
import {
    Plus, Search, X, Loader2, Trash2, Upload, Sparkles,
    Shield, Sword, Zap, Heart, Star, Crown, Diamond, Flame,
    Send, BarChart3, Box, Palette, User, SlidersHorizontal,
    RotateCcw, Save, Wand2, ChevronLeft, ChevronRight,
    ScanFace, Shirt, Layers, Swords, Crosshair, Hand,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { getApiBase, resolveUploadsUrl } from '../../lib/apiBase';
import { applyAvatarDynamicConfig, applyWeaponColors, loadOutfitIntoScene, startAvatarPreviewAnimation, type WeaponColors } from '../avatar/modelViewerAvatarBridge';
import {
    AVATAR_LAYER_PRESETS,
    countLayerPresets,
    type AvatarLayerKey,
} from '../avatar/avatarLayerPresetCatalog';
import { OUTFIT_MODEL_CATALOG, resolveOutfitModelUrl } from '../avatar/outfitCatalog';
import { weaponsForGame, type WeaponEntry } from '../avatar/weaponCatalog';
import {
    nftCoreService, nftCollectionService, nftAttributeService, nftMintService,
    NFT_CATEGORIES, NFT_RARITIES, RARITY_COLORS, RARITY_GRADIENTS,
    getImageUrl,
    type Nft, type NftCollection, type NftAttribute, type NftCategory, type NftRarity,
} from '../../services/nftAdminService';

/** Base body GLBs from backend uploads (fallback when no game-specific agent is selected). */
const AVATAR_BODY_GLB = {
    MALE: resolveUploadsUrl('/uploads/inventory/avatar/uploads_files_2569984_BodyMaleTemplate.glb'),
    FEMALE: resolveUploadsUrl('/uploads/inventory/avatar/female_avatar.glb'),
} as const;

function resolveAvatarBodyGlbUrl(gender: string): string {
    return gender === 'MALE' ? AVATAR_BODY_GLB.MALE : AVATAR_BODY_GLB.FEMALE;
}

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

type GameId = 'cs2' | 'valorant' | 'lol' | 'dota2';
type GameItemId = 'agent' | 'weapon' | 'knife' | 'gloves' | 'melee' | 'champion' | 'arcana' | 'hero';
type GameItemDef = { id: GameItemId; label: string; desc: string; icon: LucideIcon; mode: 'avatar' | 'weapon'; };
type GameDef = { label: string; short: string; accent: string; glow: string; icon: LucideIcon; items: GameItemDef[]; };
type AgentModelEntry = { id: string; gameId: GameId; label: string; glbPath: string };

const GAME_DEFS: Record<GameId, GameDef> = {
    cs2: {
        label: 'Counter-Strike 2', short: 'CS2',
        accent: '#F0A500', glow: 'rgba(240,165,0,0.2)',
        icon: Crosshair,
        items: [
            { id: 'agent',  label: 'Agent',  desc: 'Player skin',     icon: User,    mode: 'avatar'  },
            { id: 'weapon', label: 'Weapon', desc: 'Rifle · Pistol',   icon: Swords,  mode: 'weapon'  },
            { id: 'knife',  label: 'Knife',  desc: 'Melee blade',     icon: Sword,   mode: 'weapon'  },
            { id: 'gloves', label: 'Gloves', desc: 'Hand wraps',      icon: Hand,    mode: 'weapon'  },
        ],
    },
    valorant: {
        label: 'Valorant', short: 'VALORANT',
        accent: '#FF4655', glow: 'rgba(255,70,85,0.2)',
        icon: Flame,
        items: [
            { id: 'agent',  label: 'Agent',  desc: 'Playable agent',  icon: User,    mode: 'avatar'  },
            { id: 'weapon', label: 'Weapon', desc: 'Primary · Side',   icon: Swords,  mode: 'weapon'  },
            { id: 'melee',  label: 'Melee',  desc: 'Combat knife',    icon: Sword,   mode: 'weapon'  },
        ],
    },
    lol: {
        label: 'League of Legends', short: 'LoL',
        accent: '#C89B3C', glow: 'rgba(200,155,60,0.2)',
        icon: Crown,
        items: [
            { id: 'champion', label: 'Champion', desc: 'Hero skin',   icon: User,    mode: 'avatar'  },
            { id: 'weapon',   label: 'Weapon',   desc: 'Item · Skin',  icon: Sword,   mode: 'weapon'  },
        ],
    },
    dota2: {
        label: 'Dota 2', short: 'DOTA 2',
        accent: '#BE3D3D', glow: 'rgba(190,61,61,0.2)',
        icon: Swords,
        items: [
            { id: 'hero',   label: 'Hero',   desc: 'Playable hero',   icon: Shield,   mode: 'avatar'  },
            { id: 'weapon', label: 'Weapon', desc: 'Hero weapon',     icon: Sword,    mode: 'weapon'  },
            { id: 'arcana', label: 'Arcana', desc: 'Legendary item',  icon: Sparkles, mode: 'weapon'  },
        ],
    },
};

/** Keep definitions in code, but hide from selector for now. */
const HIDDEN_STUDIO_GAMES: GameId[] = ['cs2', 'dota2'];

const AGENT_MODEL_CATALOG: AgentModelEntry[] = [
    {
        id: 'valorant_omen',
        gameId: 'valorant',
        label: 'Omen',
        glbPath: resolveUploadsUrl('/uploads/inventory/avatar/valorant/Omen.glb'),
    },
    {
        id: 'valorant_jinx',
        gameId: 'valorant',
        label: 'Jinx',
        glbPath: resolveUploadsUrl('/uploads/inventory/avatar/valorant/jinx.glb'),
    },
];

function agentModelsForGame(gameId: GameId): AgentModelEntry[] {
    return AGENT_MODEL_CATALOG.filter((m) => m.gameId === gameId);
}

export default function NftManager() {
    const [searchParams] = useSearchParams();
    const collectionFilter = searchParams.get('collectionId') || '';
    const location = useLocation();

    const [nfts, setNfts] = useState<Nft[]>([]);
    const [collections, setCollections] = useState<NftCollection[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState<NftCategory | 'ALL'>('ALL');
    const [filterRarity, setFilterRarity] = useState<NftRarity | 'ALL'>('ALL');
    const [selectedNft, setSelectedNft] = useState<(Nft & { attributes: NftAttribute[] }) | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [showNewAvatarModal, setShowNewAvatarModal] = useState(false);
    const [newAvatarGender, setNewAvatarGender] = useState<'MALE' | 'FEMALE'>('MALE');
    const [newAvatarRequestId, setNewAvatarRequestId] = useState(0);
    const [openUploadRequestId, setOpenUploadRequestId] = useState(0);
    const [activeView, setActiveView] = useState<'studio' | 'inventory'>(
        location.pathname.includes('nft-inventory') ? 'inventory' : 'studio'
    );
    const [selectedGame, setSelectedGame] = useState<GameId>('valorant');
    const [selectedItemType, setSelectedItemType] = useState<GameItemId>('agent');
    const visibleGameEntries = useMemo(
        () =>
            (Object.entries(GAME_DEFS) as [GameId, GameDef][])
                .filter(([gid]) => !HIDDEN_STUDIO_GAMES.includes(gid)),
        [],
    );
    const studioMode: 'avatar' | 'weapon' =
        GAME_DEFS[selectedGame].items.find(i => i.id === selectedItemType)?.mode ?? 'avatar';

    useEffect(() => {
        if (HIDDEN_STUDIO_GAMES.includes(selectedGame)) {
            const [fallbackGameId, fallbackGame] = visibleGameEntries[0] ?? ['valorant', GAME_DEFS.valorant];
            setSelectedGame(fallbackGameId);
            setSelectedItemType(fallbackGame.items[0].id);
        }
    }, [selectedGame, visibleGameEntries]);

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
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
                {activeView === 'studio' ? (
                    <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                        <div className="w-full sm:w-56">
                            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-text-muted">
                                Game
                            </label>
                            <select
                                value={selectedGame}
                                onChange={(e) => {
                                    const gid = e.target.value as GameId;
                                    const game = GAME_DEFS[gid];
                                    setSelectedGame(gid);
                                    setSelectedItemType(game.items[0].id);
                                }}
                                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-[11px] font-black uppercase tracking-wider text-white outline-none transition-colors focus:border-primary/50"
                            >
                                {visibleGameEntries.map(([gid, game]) => (
                                    <option key={gid} value={gid}>
                                        {game.short}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="w-full sm:w-56">
                            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-text-muted">
                                Type
                            </label>
                            <select
                                value={selectedItemType}
                                onChange={(e) => setSelectedItemType(e.target.value as GameItemId)}
                                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-[11px] font-black uppercase tracking-wider text-white outline-none transition-colors focus:border-primary/50"
                            >
                                {GAME_DEFS[selectedGame].items.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="w-full sm:w-56">
                            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-text-muted">
                                Upload
                            </label>
                            <button
                                type="button"
                                onClick={() => setOpenUploadRequestId((v) => v + 1)}
                                className="flex h-[42px] w-full items-center justify-center rounded-xl border border-white/10 bg-black/30 px-3 text-[11px] font-black uppercase tracking-wider text-white outline-none transition-colors hover:border-primary/50 hover:text-primary"
                            >
                                Upload 3D
                            </button>
                        </div>
                    </div>
                ) : (
                    <div />
                )}
                <div className="flex items-center gap-2 flex-wrap lg:justify-end">
                    <div className="bg-surface border border-white/10 rounded-xl p-1 flex items-center gap-1">
                        <button
                            onClick={() => setActiveView('studio')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'studio' ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'}`}
                        >
                            Studio
                        </button>
                        <button
                            onClick={() => setActiveView('inventory')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'inventory' ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'}`}
                        >
                            NFT Inventory
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            if (activeView === 'studio') {
                                setShowNewAvatarModal(true);
                                return;
                            }
                            setShowCreate(true);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-black text-sm font-black uppercase tracking-wider transition-all"
                    >
                        <Plus size={16} /> {activeView === 'studio' ? 'Create New' : 'Create NFT'}
                    </button>
                </div>
            </div>

            {activeView === 'studio' && (
                <div className="space-y-4">
                    {/* ── Studio ── */}
                    <Studio
                        selectedGame={selectedGame}
                        studioMode={studioMode}
                        selectedItemType={selectedItemType}
                        newAvatarGender={newAvatarGender}
                        newAvatarRequestId={newAvatarRequestId}
                        openUploadRequestId={openUploadRequestId}
                        onDraftCreated={(nft) => {
                            setActiveView('inventory');
                            load();
                            viewDetail(nft);
                        }}
                    />
                </div>
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

            {showNewAvatarModal && (
                <div className="fixed inset-0 z-[120] flex items-start justify-center bg-black/70 px-4 pt-24 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-primary/20 bg-[#0f1115] p-4 shadow-[0_0_40px_rgba(0,255,136,0.2)]">
                        <div className="mb-3 flex items-center justify-between">
                            <p className="text-xs font-black uppercase tracking-widest text-white">Create new avatar</p>
                            <button
                                type="button"
                                onClick={() => setShowNewAvatarModal(false)}
                                className="rounded-md border border-white/10 p-1 text-white/60 transition-colors hover:text-white"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <p className="mb-3 text-[11px] text-white/50">Choose a base body for a fresh project.</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setNewAvatarGender('MALE');
                                    setNewAvatarRequestId((v) => v + 1);
                                    setShowNewAvatarModal(false);
                                }}
                                className="rounded-xl border border-primary bg-primary px-3 py-2 text-xs font-black uppercase tracking-widest text-black"
                            >
                                Male
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setNewAvatarGender('FEMALE');
                                    setNewAvatarRequestId((v) => v + 1);
                                    setShowNewAvatarModal(false);
                                }}
                                className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-white/80 transition-colors hover:border-white/20 hover:text-white"
                            >
                                Female
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AVATAR STUDIO
// ═══════════════════════════════════════════════════════════════════════════════

type AvatarLayer = { file: File | null; preview: string | null };
type AvatarLayers = Record<AvatarLayerKey, AvatarLayer>;
type AvatarView = 'front' | 'side' | 'back';
type CameraPreset = 'front' | 'right' | 'back' | 'left' | 'top' | 'bottom';

const LAYER_LABELS: Record<AvatarLayerKey, string> = {
    base: 'Base Body',
    hair: 'Hair Layer',
    ears: 'Ears Layer',
    outfit: 'Outfit Layer',
    accessory: 'Accessory Layer',
};

/** Single source for Avatar Studio selects — counts drive the sidebar “option” badges */
const STUDIO_OPTIONS = {
    bodyType: ['Athletic', 'Lean', 'Heavy', 'Heroic'],
    faceStyle: ['Sharp', 'Soft', 'Strong', 'Angular'],
    hairstyle: ['Bald', 'Buzz', 'Short', 'Long', 'Braids', 'Mohawk'],
    earType: ['Human', 'Elf', 'Cyber', 'Pointed'],
    outfit: ['Tactical', 'Streetwear', 'Cyber Suit', 'Stealth', 'Battle Armor'],
    accessory: ['Holster', 'Necklace', 'Headset', 'Blade', 'None'],
    aura: ['Neon', 'Ice', 'Shadow', 'Fire', 'Gold'],
    eyebrow: ['Angled', 'Straight', 'Arched', 'Thick'],
    nose: ['Straight', 'Wide', 'Narrow', 'Button'],
    mouth: ['Neutral', 'Smile', 'Grim', 'Fangs'],
    boots: ['Combat', 'Street', 'Tactical', 'Stealth', 'Formal'],
} as const;

type StudioNavId = 'body' | 'colors' | 'face' | 'style' | 'layers' | 'morph';

function studioNavGroups(): { title: string; items: { id: StudioNavId; label: string; icon: LucideIcon; count: number }[] }[] {
    const bodyMeshOptions =
        STUDIO_OPTIONS.bodyType.length + OUTFIT_MODEL_CATALOG.length;
    const faceOptions =
        STUDIO_OPTIONS.faceStyle.length
        + STUDIO_OPTIONS.earType.length
        + STUDIO_OPTIONS.eyebrow.length
        + STUDIO_OPTIONS.nose.length
        + STUDIO_OPTIONS.mouth.length;
    const styleOptions =
        STUDIO_OPTIONS.hairstyle.length
        + STUDIO_OPTIONS.outfit.length
        + STUDIO_OPTIONS.accessory.length
        + STUDIO_OPTIONS.boots.length;
    return [
        {
            title: 'Body',
            items: [{ id: 'body', label: 'Body & mesh', icon: User, count: bodyMeshOptions }],
        },
        {
            title: 'Face',
            items: [
                { id: 'colors', label: 'Colors', icon: Palette, count: 3 + STUDIO_OPTIONS.aura.length },
                { id: 'face', label: 'Face features', icon: ScanFace, count: faceOptions },
            ],
        },
        {
            title: 'Style',
            items: [{ id: 'style', label: 'Outfit & hair', icon: Shirt, count: styleOptions }],
        },
        {
            title: 'Layers',
            items: [{ id: 'layers', label: 'Presets', icon: Layers, count: countLayerPresets() }],
        },
        {
            title: 'Tune',
            items: [{ id: 'morph', label: 'Morph & stats', icon: SlidersHorizontal, count: 5 }],
        },
    ];
}

/** model-viewer orbit: theta phi radius — radius as % of model bounds (higher = farther = full body) */
const AVATAR_CAMERA_ORBIT: Record<AvatarView, string> = {
    front: '0deg 68deg 168%',
    side: '90deg 68deg 168%',
    back: '180deg 68deg 168%',
};

/** Loose framing: dolly close for face/hair, far out for full body; wide phi for top/down angles */
const AVATAR_MIN_CAMERA_ORBIT = 'auto 2deg 6%';
const AVATAR_MAX_CAMERA_ORBIT = 'auto 98deg 2200%';
const AVATAR_MIN_FOV = '4deg';
const AVATAR_MAX_FOV = '95deg';
/** +/- buttons: keep in sync with min/max orbit radius (third component, %) */
const AVATAR_ZOOM_RADIUS_MIN = 6;
const AVATAR_ZOOM_RADIUS_MAX = 2200;

/**
 * One-click framing: orbit alone zooms toward the model’s default pivot (usually ~torso).
 * `target` moves the orbit pivot in **model space (m)** so Head / Body actually frame those regions.
 * Tune Y if a new GLB uses a different origin (feet at Y=0 is assumed).
 */
const AVATAR_FRAME_FOCUS = {
    head:  { orbit: '0deg 82deg 32%',  target: '0m 1.62m 0m' },
    torso: { orbit: '0deg 82deg 78%',  target: '0m 1.05m 0m' },
    full:  { orbit: '0deg 78deg 190%', target: 'auto'         },
} as const;

const CAMERA_PRESET_ORBIT: Record<CameraPreset, string> = {
    front: '0deg 68deg 168%',
    right: '90deg 68deg 168%',
    back: '180deg 68deg 168%',
    left: '270deg 68deg 168%',
    top: '0deg 8deg 210%',
    bottom: '0deg 172deg 210%',
};

function Studio({ onDraftCreated, studioMode, selectedGame, selectedItemType, newAvatarGender, newAvatarRequestId, openUploadRequestId }: {
    onDraftCreated: (nft: Nft) => void;
    studioMode: 'avatar' | 'weapon';
    selectedGame: GameId;
    selectedItemType: GameItemId;
    newAvatarGender: 'MALE' | 'FEMALE';
    newAvatarRequestId: number;
    openUploadRequestId: number;
}) {
    /** User-added weapons per game (session only). */
    const [weaponCatalogExtras, setWeaponCatalogExtras] = useState<Partial<Record<GameId, WeaponEntry[]>>>({});
    const localWeaponCatalog = useMemo(
        () => [...weaponsForGame(selectedGame), ...(weaponCatalogExtras[selectedGame] ?? [])],
        [selectedGame, weaponCatalogExtras],
    );
    const [selectedWeaponId, setSelectedWeaponId] = useState<string>(() => weaponsForGame('cs2')[0]?.id ?? '');
    const [weaponColors, setWeaponColors] = useState<WeaponColors>({
        primary: '#ffffff',
        glow: '#00ff88',
        metalness: 0.7,
        roughness: 0.3,
    });
    const weaponViewerRef = useRef<HTMLElement | null>(null);
    const [weaponNav, setWeaponNav] = useState<'info' | 'materials' | 'attachments'>('materials');
    const [showAddWeapon, setShowAddWeapon] = useState(false);
    const [newWeaponDraft, setNewWeaponDraft] = useState({ label: '', type: 'Assault', glbPath: '' });
    const [weaponInfo, setWeaponInfo] = useState({ name: 'Combat Weapon', type: 'Assault', description: '', tags: '' });
    const [weaponAttachments, setWeaponAttachments] = useState([
        { id: 'scope',     label: 'Scope',          active: false },
        { id: 'silencer',  label: 'Silencer',        active: false },
        { id: 'laser',     label: 'Laser Sight',     active: false },
        { id: 'extmag',    label: 'Ext. Magazine',   active: false },
        { id: 'foregrip',  label: 'Foregrip',        active: false },
        { id: 'stockless', label: 'Stockless Stock', active: false },
    ]);
    const [agentCatalogExtras, setAgentCatalogExtras] = useState<Partial<Record<GameId, AgentModelEntry[]>>>({});
    const localAgentCatalog = useMemo(
        () => [...agentModelsForGame(selectedGame), ...(agentCatalogExtras[selectedGame] ?? [])],
        [selectedGame, agentCatalogExtras],
    );
    const [selectedAgentId, setSelectedAgentId] = useState<string>(() => agentModelsForGame('valorant')[0]?.id ?? '');
    const [modelName, setModelName] = useState('');
    const [modelFile, setModelFile] = useState<File | null>(null);
    const [uploadingModel, setUploadingModel] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [studioConfigCollapsed, setStudioConfigCollapsed] = useState(false);
    const proConfigRailCollapsed = false;
    const [studioNavId, setStudioNavId] = useState<StudioNavId>('body');
    const [layerPresetSlot, setLayerPresetSlot] = useState<AvatarLayerKey>('accessory');
    const [saving, setSaving] = useState(false);
    const [layers, setLayers] = useState<AvatarLayers>({
        base: { file: null, preview: null },
        hair: { file: null, preview: null },
        ears: { file: null, preview: null },
        outfit: { file: null, preview: null },
        accessory: { file: null, preview: null },
    });
    const [config, setConfig] = useState({
        gender: 'MALE',
        view: 'front' as AvatarView,
        bodyType: 'Athletic',
        skinTone: '#ffffff',
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

    const applyLayerPreset = (key: AvatarLayerKey, src: string | null) => {
        setLayers(prev => ({ ...prev, [key]: { file: null, preview: src } }));
    };

    useEffect(() => {
        const list = [...weaponsForGame(selectedGame), ...(weaponCatalogExtras[selectedGame] ?? [])];
        setSelectedWeaponId((prev) => (list.some((w) => w.id === prev) ? prev : list[0]?.id ?? ''));
    }, [selectedGame, weaponCatalogExtras]);
    useEffect(() => {
        const list = agentModelsForGame(selectedGame);
        setSelectedAgentId((prev) => (list.some((m) => m.id === prev) ? prev : list[0]?.id ?? ''));
    }, [selectedGame, agentCatalogExtras]);

    const resetStudio = (gender: 'MALE' | 'FEMALE' = 'MALE') => {
        setLayers({
            base: { file: null, preview: null },
            hair: { file: null, preview: null },
            ears: { file: null, preview: null },
            outfit: { file: null, preview: null },
            accessory: { file: null, preview: null },
        });
        setConfig({
            gender,
            view: 'front',
            bodyType: 'Athletic',
            skinTone: '#ffffff',
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
        setWeaponCatalogExtras({});
        setAgentCatalogExtras({});
        setSelectedWeaponId(weaponsForGame(selectedGame)[0]?.id ?? '');
        setSelectedAgentId(agentModelsForGame(selectedGame)[0]?.id ?? '');
        setWeaponColors({ primary: '#ffffff', glow: '#00ff88', metalness: 0.7, roughness: 0.3 });
        setWeaponNav('materials');
        setShowAddWeapon(false);
        setNewWeaponDraft({ label: '', type: 'Assault', glbPath: '' });
        setWeaponInfo({ name: 'Combat Weapon', type: 'Assault', description: '', tags: '' });
        setWeaponAttachments([
            { id: 'scope',     label: 'Scope',          active: false },
            { id: 'silencer',  label: 'Silencer',        active: false },
            { id: 'laser',     label: 'Laser Sight',     active: false },
            { id: 'extmag',    label: 'Ext. Magazine',   active: false },
            { id: 'foregrip',  label: 'Foregrip',        active: false },
            { id: 'stockless', label: 'Stockless Stock', active: false },
        ]);
    };

    useEffect(() => {
        if (newAvatarRequestId < 1) return;
        resetStudio(newAvatarGender);
    }, [newAvatarGender, newAvatarRequestId]);

    useEffect(() => {
        if (openUploadRequestId < 1) return;
        setShowUploadModal(true);
    }, [openUploadRequestId]);

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
        { traitType: 'Outfit 3D mesh', value: config.outfitModelId },
        { traitType: 'Boots', value: config.boots },
        { traitType: 'Accessory', value: config.accessory },
        { traitType: 'Aura', value: config.aura },
        { traitType: 'Body Size', value: String(config.bodySize), numericValue: config.bodySize, maxValue: 100 },
        { traitType: 'Head Size', value: String(config.headSize), numericValue: config.headSize, maxValue: 100 },
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

    const selectedWeapon = localWeaponCatalog.find(w => w.id === selectedWeaponId) ?? localWeaponCatalog[0];
    const selectedAgentModel = localAgentCatalog.find((m) => m.id === selectedAgentId) ?? localAgentCatalog[0];

    const uploadModelFromStudio = async () => {
        if (!modelFile) return;
        if (!modelName.trim()) {
            alert('Please give the model a name first.');
            return;
        }
        try {
            setUploadingModel(true);
            const fd = new FormData();
            fd.append('file', modelFile);
            fd.append('name', modelName.trim());
            fd.append('gameId', selectedGame);
            fd.append('mode', studioMode);
            fd.append('itemType', selectedItemType);

            const res = await fetch(`${getApiBase()}/game-assets/upload-model`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
                body: fd,
            });
            if (!res.ok) {
                const err = await res.text();
                throw new Error(err || 'Upload failed');
            }
            const data = await res.json() as { urlPath: string; name: string };
            const glbPath = resolveUploadsUrl(data.urlPath);
            const id = `custom_${Date.now()}`;

            if (studioMode === 'weapon') {
                const entry: WeaponEntry = {
                    id,
                    label: modelName.trim(),
                    type: selectedItemType.toUpperCase(),
                    glbPath,
                    gameId: selectedGame,
                };
                setWeaponCatalogExtras((prev) => ({
                    ...prev,
                    [selectedGame]: [...(prev[selectedGame] ?? []), entry],
                }));
                setSelectedWeaponId(id);
            } else {
                const entry: AgentModelEntry = {
                    id,
                    gameId: selectedGame,
                    label: modelName.trim(),
                    glbPath,
                };
                setAgentCatalogExtras((prev) => ({
                    ...prev,
                    [selectedGame]: [...(prev[selectedGame] ?? []), entry],
                }));
                setSelectedAgentId(id);
            }
            setModelName('');
            setModelFile(null);
            setShowUploadModal(false);
            alert('Model uploaded and added to studio.');
        } catch (e: unknown) {
            alert((e as Error)?.message || 'Upload failed');
        } finally {
            setUploadingModel(false);
        }
    };

    // Apply weapon colors live whenever they change
    useEffect(() => {
        if (studioMode !== 'weapon') return;
        const el = weaponViewerRef.current;
        if (!el) return;
        applyWeaponColors(el, weaponColors);
    }, [studioMode, weaponColors]);
    const weaponScore = Math.round(((weaponColors.metalness) + (1 - weaponColors.roughness)) / 2 * 100);
    const weaponRarity: NftRarity =
        weaponScore >= 90 ? 'MYTHIC'
            : weaponScore >= 80 ? 'LEGENDARY'
                : weaponScore >= 68 ? 'EPIC'
                    : weaponScore >= 56 ? 'RARE'
                        : weaponScore >= 40 ? 'UNCOMMON'
                            : 'COMMON';

    return (
        <>
        <div className="flex flex-col gap-5 xl:h-[calc(100vh-9rem)] xl:flex-row xl:gap-0 xl:overflow-hidden xl:rounded-2xl xl:border xl:border-white/10 xl:bg-[#0d0f12]">
            <aside
                className={cn(
                    'shrink-0 overflow-x-hidden border border-white/10 bg-[#111214] transition-[width,opacity] duration-300 ease-out',
                    'rounded-2xl xl:rounded-none xl:border-y-0 xl:border-l-0',
                    studioConfigCollapsed
                        ? 'pointer-events-none w-0 border-r-0 opacity-0'
                        : 'w-[min(100%,30rem)] 2xl:w-[min(36rem,95vw)] border-r border-white/10 opacity-100',
                )}
            >
                <div className="flex h-full max-h-[65vh] min-h-0 flex-col overflow-hidden p-4 sm:p-5 xl:max-h-none xl:h-full xl:w-full">
                    <div className="shrink-0 space-y-6">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="flex min-w-0 items-center gap-2 text-sm font-black uppercase tracking-widest text-white">
                                {studioMode === 'avatar'
                                    ? <><Wand2 size={15} className="shrink-0 text-primary" /><span className="min-w-0 leading-tight">Character creator</span></>
                                    : <><Swords size={15} className="shrink-0 text-primary" /><span className="min-w-0 leading-tight">Weapon studio</span></>}
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={resetStudio}
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-text-muted transition-all hover:border-white/20 hover:text-white"
                                >
                                    <RotateCcw size={12} /> Reset
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStudioConfigCollapsed(true)}
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all hover:border-primary/40 hover:text-primary"
                                >
                                    <ChevronLeft size={12} /> Close
                                </button>
                            </div>
                        </div>

                        {studioMode === 'avatar' && localAgentCatalog.length > 0 && (
                            <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                                    {GAME_DEFS[selectedGame].short} agent model
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {localAgentCatalog.map((agent) => {
                                        const active = selectedAgentId === agent.id;
                                        return (
                                            <button
                                                key={agent.id}
                                                type="button"
                                                onClick={() => setSelectedAgentId(agent.id)}
                                                className={cn(
                                                    'rounded-xl border px-2 py-2 text-[10px] font-black uppercase tracking-widest transition-all',
                                                    active
                                                        ? 'border-primary bg-primary/15 text-primary'
                                                        : 'border-white/10 text-white/60 hover:border-white/20 hover:text-white',
                                                )}
                                            >
                                                {agent.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        
                    </div>

                    {studioMode === 'weapon' && (
                        <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto border-t border-white/5 pt-4">

                            {/* ── Catalog ── */}
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                                        Select Weapon · {GAME_DEFS[selectedGame].short}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddWeapon(v => !v)}
                                        className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-primary transition-colors hover:text-primary/80"
                                    >
                                        {showAddWeapon ? <><X size={10} /> Cancel</> : <><Plus size={10} /> Add</>}
                                    </button>
                                </div>
                                {showAddWeapon && (
                                    <div className="mb-3 space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
                                        <input
                                            placeholder="Weapon name"
                                            value={newWeaponDraft.label}
                                            onChange={e => setNewWeaponDraft(p => ({ ...p, label: e.target.value }))}
                                            className="w-full rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-[11px] text-white outline-none placeholder-white/20 focus:border-primary/50"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <select
                                                value={newWeaponDraft.type}
                                                onChange={e => setNewWeaponDraft(p => ({ ...p, type: e.target.value }))}
                                                className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-[11px] text-white outline-none focus:border-primary/50"
                                            >
                                                {['Assault','Pistol','Sniper','Shotgun','SMG','Melee','Explosive'].map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                            <button
                                                type="button"
                                                disabled={!newWeaponDraft.label.trim() || !newWeaponDraft.glbPath.trim()}
                                                onClick={() => {
                                                    const id = `custom_${Date.now()}`;
                                                    const entry: WeaponEntry = {
                                                        id,
                                                        label: newWeaponDraft.label.trim(),
                                                        type: newWeaponDraft.type,
                                                        glbPath: newWeaponDraft.glbPath.trim(),
                                                        gameId: selectedGame,
                                                    };
                                                    setWeaponCatalogExtras((prev) => ({
                                                        ...prev,
                                                        [selectedGame]: [...(prev[selectedGame] ?? []), entry],
                                                    }));
                                                    setSelectedWeaponId(id);
                                                    setNewWeaponDraft({ label: '', type: 'Assault', glbPath: '' });
                                                    setShowAddWeapon(false);
                                                }}
                                                className="rounded-lg bg-primary px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-black transition-all disabled:opacity-40"
                                            >Add</button>
                                        </div>
                                        <input
                                            placeholder="GLB path / URL (e.g. /models/weapons/my.glb)"
                                            value={newWeaponDraft.glbPath}
                                            onChange={e => setNewWeaponDraft(p => ({ ...p, glbPath: e.target.value }))}
                                            className="w-full rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-[11px] text-white outline-none placeholder-white/20 focus:border-primary/50"
                                        />
                                    </div>
                                )}
                                {localWeaponCatalog.length === 0 ? (
                                    <p className="rounded-xl border border-white/10 bg-black/20 p-4 text-center text-[11px] leading-relaxed text-text-muted">
                                        No weapons for <span className="font-bold text-white/70">{GAME_DEFS[selectedGame].label}</span> yet.
                                        Add a GLB URL with <span className="text-primary">+ Add</span>, or place models under{' '}
                                        <code className="rounded bg-white/10 px-1 text-[10px]">uploads/inventory/weapens/…</code> on the API server.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {localWeaponCatalog.map((w) => {
                                            const active = selectedWeaponId === w.id;
                                            return (
                                                <button key={w.id} type="button" onClick={() => setSelectedWeaponId(w.id)}
                                                    className={cn('relative flex flex-col items-center gap-1 overflow-hidden rounded-xl border p-1.5 pb-2 text-center transition-all', active ? 'border-primary/60 bg-primary/10 shadow-[0_0_10px_rgba(0,255,136,0.15)]' : 'border-white/10 bg-white/5 hover:border-white/25')}
                                                >
                                                    <div className="relative h-28 w-full overflow-hidden rounded-lg bg-black/30">
                                                        <model-viewer
                                                            src={w.glbPath}
                                                            crossOrigin="anonymous"
                                                            reveal="auto"
                                                            camera-orbit="45deg 75deg 120%"
                                                            interaction-prompt="none"
                                                            style={{ width: '100%', height: '100%', backgroundColor: 'transparent', pointerEvents: 'none' } as CSSProperties}
                                                        />
                                                        {active && <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-black text-black">✓</span>}
                                                        {w.id.startsWith('custom_') && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setWeaponCatalogExtras((prev) => ({
                                                                        ...prev,
                                                                        [selectedGame]: (prev[selectedGame] ?? []).filter((x) => x.id !== w.id),
                                                                    }));
                                                                    if (active) {
                                                                        const rest = localWeaponCatalog.filter((x) => x.id !== w.id);
                                                                        setSelectedWeaponId(rest[0]?.id ?? '');
                                                                    }
                                                                }}
                                                                className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500/80 text-white transition-colors hover:bg-red-500"
                                                            >
                                                                <X size={9} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <span className={cn('text-[9px] font-black uppercase tracking-wide', active ? 'text-primary' : 'text-white/50')}>{w.label}</span>
                                                    <span className={cn('text-[8px] uppercase tracking-wide', active ? 'text-primary/70' : 'text-white/25')}>{w.type}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* ── Tab nav ── */}
                            <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-black/20 p-1">
                                {(['info','materials','attachments'] as const).map(tab => (
                                    <button key={tab} type="button" onClick={() => setWeaponNav(tab)}
                                        className={cn('rounded-lg py-1.5 text-[8px] font-black uppercase tracking-widest transition-all', weaponNav === tab ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white')}
                                    >{tab}</button>
                                ))}
                            </div>

                            {/* ── Info ── */}
                            {weaponNav === 'info' && (
                                <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
                                    <div>
                                        <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-text-muted">Name</label>
                                        <input value={weaponInfo.name} onChange={e => setWeaponInfo(p => ({ ...p, name: e.target.value }))}
                                            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none focus:border-primary/50" />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-text-muted">Type</label>
                                        <select value={weaponInfo.type} onChange={e => setWeaponInfo(p => ({ ...p, type: e.target.value }))}
                                            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none focus:border-primary/50">
                                            {['Assault','Pistol','Sniper','Shotgun','SMG','Melee','Explosive'].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-text-muted">Description</label>
                                        <textarea value={weaponInfo.description} onChange={e => setWeaponInfo(p => ({ ...p, description: e.target.value }))}
                                            rows={3} placeholder="Weapon lore, special abilities..."
                                            className="w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none placeholder-white/20 focus:border-primary/50" />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-text-muted">Tags (comma separated)</label>
                                        <input value={weaponInfo.tags} onChange={e => setWeaponInfo(p => ({ ...p, tags: e.target.value }))}
                                            placeholder="fire, legendary, season-1"
                                            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none placeholder-white/20 focus:border-primary/50" />
                                    </div>
                                </div>
                            )}

                            {/* ── Materials ── */}
                            {weaponNav === 'materials' && (
                                <div className="space-y-4 rounded-xl border border-white/10 bg-black/20 p-4">
                                    <ColorPicker label="Primary Tint" value={weaponColors.primary} onChange={v => setWeaponColors(prev => ({ ...prev, primary: v }))} />
                                    <ColorPicker label="Glow / Emission" value={weaponColors.glow} onChange={v => setWeaponColors(prev => ({ ...prev, glow: v }))} />
                                    {(['metalness','roughness'] as const).map(key => (
                                        <div key={key}>
                                            <label className="mb-2 flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
                                                <span>{key}</span>
                                                <span className="font-mono text-white/60">{Math.round(weaponColors[key] * 100)}</span>
                                            </label>
                                            <input type="range" min={0} max={1} step={0.01} value={weaponColors[key]}
                                                onChange={e => setWeaponColors(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                                                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-primary" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ── Attachments ── */}
                            {weaponNav === 'attachments' && (
                                <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Attachments</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {weaponAttachments.map((att, idx) => (
                                            <button key={att.id} type="button"
                                                onClick={() => setWeaponAttachments(prev => prev.map((a, i) => i === idx ? { ...a, active: !a.active } : a))}
                                                className={cn('flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all',
                                                    att.active ? 'border-primary/60 bg-primary/10 text-primary shadow-[0_0_8px_rgba(0,255,136,0.12)]' : 'border-white/10 bg-white/5 text-text-muted hover:border-white/20 hover:text-white')}
                                            >
                                                <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', att.active ? 'bg-primary' : 'bg-white/20')} />
                                                {att.label}
                                            </button>
                                        ))}
                                    </div>
                                    <button type="button"
                                        onClick={() => setWeaponAttachments(prev => [...prev, { id: `att_${Date.now()}`, label: 'Custom', active: false }])}
                                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 py-2 text-[9px] font-black uppercase tracking-widest text-text-muted transition-all hover:border-white/30 hover:text-white"
                                    ><Plus size={10} /> Add Attachment</button>
                                </div>
                            )}
                        </div>
                    )}
                    {studioMode === 'avatar' && <div className="mt-4 flex min-h-0 flex-1 flex-col border-t border-white/5 pt-4">
                        <div className="flex min-h-0 flex-1 gap-2">
                            <nav
                                className={cn(
                                    'shrink-0 overflow-y-auto overflow-x-hidden pr-1 transition-all duration-200',
                                    proConfigRailCollapsed ? 'w-[3.5rem]' : 'w-[7.4rem]',
                                )}
                                aria-label="Avatar studio sections"
                            >
                                {studioNavGroups().map(group => (
                                    <div key={group.title || group.items.map(i => i.id).join('-')} className="mb-2 last:mb-0">
                                        {!proConfigRailCollapsed && group.title ? (
                                            <p className="mb-1.5 px-1 text-[9px] font-black uppercase tracking-widest text-text-muted/80">
                                                {group.title}
                                            </p>
                                        ) : null}
                                        <div className="space-y-0.5">
                                            {group.items.map(item => {
                                                const Icon = item.icon;
                                                const active = studioNavId === item.id;
                                                return (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        onClick={() => setStudioNavId(item.id)}
                                                        title={item.label}
                                                        className={cn(
                                                            'flex w-full items-center rounded-lg transition-colors',
                                                            proConfigRailCollapsed
                                                                ? 'justify-center px-1.5 py-1.5'
                                                                : 'gap-1.5 py-1.5 pl-1.5 pr-1 text-left',
                                                            active
                                                                ? 'border border-primary/45 bg-primary/12 text-white'
                                                                : 'border border-transparent text-text-muted hover:bg-white/[0.04] hover:text-white/90',
                                                        )}
                                                    >
                                                        <span
                                                            className={cn(
                                                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border',
                                                                active
                                                                    ? 'border-primary/45 bg-primary/15 text-primary'
                                                                    : 'border-white/10 bg-black/35 text-text-muted',
                                                            )}
                                                        >
                                                            <Icon size={13} strokeWidth={2} />
                                                        </span>
                                                        {!proConfigRailCollapsed && (
                                                            <span className="min-w-0 flex-1">
                                                                <span className="line-clamp-2 text-[8px] font-bold uppercase leading-tight tracking-wide sm:text-[9px]">
                                                                    {item.label}
                                                                </span>
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </nav>

                            <div className={cn(
                                'min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden border-l border-white/10 pl-3',
                                proConfigRailCollapsed && 'pl-2',
                            )}>
                                {studioNavId === 'body' && (
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Body & mesh</p>
                                        <StudioSelect label="Body Type" icon={<User size={12} />} value={config.bodyType} options={[...STUDIO_OPTIONS.bodyType]} onChange={value => setConfig(prev => ({ ...prev, bodyType: value }))} />
                                        <div className="min-w-0">
                                            <label className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text-muted">
                                                <Shirt size={12} className="shrink-0" />
                                                3D Outfit
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {OUTFIT_MODEL_CATALOG.map(o => {
                                                    const active = config.outfitModelId === o.id;
                                                    return (
                                                        <button
                                                            key={o.id}
                                                            type="button"
                                                            onClick={() => setConfig(prev => ({ ...prev, outfitModelId: o.id }))}
                                                            className={cn(
                                                                'relative flex flex-col items-center gap-1 overflow-hidden rounded-xl border p-1.5 pb-2 text-center transition-all',
                                                                active
                                                                    ? 'border-primary/60 bg-primary/10 shadow-[0_0_10px_rgba(0,255,136,0.15)]'
                                                                    : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/8',
                                                            )}
                                                        >
                                                            {o.glbPath ? (
                                                                <div className="relative h-24 w-full overflow-hidden rounded-lg bg-black/30">
                                                                    <model-viewer
                                                                        src={o.glbPath}
                                                                        reveal="auto"
                                                                        interaction-prompt="none"
                                                                        camera-orbit="0deg 80deg 120%"
                                                                        style={{
                                                                            width: '100%',
                                                                            height: '100%',
                                                                            backgroundColor: 'transparent',
                                                                            pointerEvents: 'none',
                                                                        } as CSSProperties}
                                                                    />
                                                                    {active && (
                                                                        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-black text-black">✓</span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="flex h-24 w-full items-center justify-center rounded-lg bg-black/20">
                                                                    <User size={28} className="text-white/20" />
                                                                </div>
                                                            )}
                                                            <span className={cn(
                                                                'text-[9px] font-black uppercase tracking-wide',
                                                                active ? 'text-primary' : 'text-white/50',
                                                            )}>
                                                                {o.label}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {studioNavId === 'colors' && (
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Colors</p>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-3 sm:gap-y-4">
                                            <ColorPicker label="Skin Tone" value={config.skinTone} onChange={value => setConfig(prev => ({ ...prev, skinTone: value }))} />
                                            <ColorPicker label="Hair Color" value={config.hairColor} onChange={value => setConfig(prev => ({ ...prev, hairColor: value }))} />
                                            <ColorPicker label="Eye Color" value={config.eyeColor} onChange={value => setConfig(prev => ({ ...prev, eyeColor: value }))} />
                                            <StudioSelect label="Aura" icon={<Sparkles size={12} />} value={config.aura} options={[...STUDIO_OPTIONS.aura]} onChange={value => setConfig(prev => ({ ...prev, aura: value }))} />
                                        </div>
                                    </div>
                                )}

                                {studioNavId === 'face' && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Face features</p>
                                        <StudioSelect label="Face Style" icon={<User size={12} />} value={config.faceStyle} options={[...STUDIO_OPTIONS.faceStyle]} onChange={value => setConfig(prev => ({ ...prev, faceStyle: value }))} />
                                        <StudioSelect label="Ear Type" icon={<Sparkles size={12} />} value={config.earType} options={[...STUDIO_OPTIONS.earType]} onChange={value => setConfig(prev => ({ ...prev, earType: value }))} />
                                        <StudioSelect label="Eyebrow" icon={<Sparkles size={12} />} value={config.eyebrow} options={[...STUDIO_OPTIONS.eyebrow]} onChange={value => setConfig(prev => ({ ...prev, eyebrow: value }))} />
                                        <StudioSelect label="Nose" icon={<Sparkles size={12} />} value={config.nose} options={[...STUDIO_OPTIONS.nose]} onChange={value => setConfig(prev => ({ ...prev, nose: value }))} />
                                        <StudioSelect label="Mouth" icon={<Sparkles size={12} />} value={config.mouth} options={[...STUDIO_OPTIONS.mouth]} onChange={value => setConfig(prev => ({ ...prev, mouth: value }))} />
                                    </div>
                                )}

                                {studioNavId === 'style' && (
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Outfit & hair</p>
                                        <div className="grid grid-cols-1 gap-3">
                                            <StudioSelect label="Hair Style" icon={<Sparkles size={12} />} value={config.hairstyle} options={[...STUDIO_OPTIONS.hairstyle]} onChange={value => setConfig(prev => ({ ...prev, hairstyle: value }))} />
                                            <StudioSelect label="Outfit" icon={<Palette size={12} />} value={config.outfit} options={[...STUDIO_OPTIONS.outfit]} onChange={value => setConfig(prev => ({ ...prev, outfit: value }))} />
                                            <StudioSelect label="Accessory" icon={<Sparkles size={12} />} value={config.accessory} options={[...STUDIO_OPTIONS.accessory]} onChange={value => setConfig(prev => ({ ...prev, accessory: value }))} />
                                            <StudioSelect label="Boots" icon={<Sparkles size={12} />} value={config.boots} options={[...STUDIO_OPTIONS.boots]} onChange={value => setConfig(prev => ({ ...prev, boots: value }))} />
                                        </div>
                                        <div className="space-y-4 rounded-xl border border-white/10 bg-black/20 p-4">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Hair & ears</p>
                                            <StudioSlider label="Hair Length" value={config.hairLength} onChange={value => setConfig(prev => ({ ...prev, hairLength: value }))} />
                                            <StudioSlider label="Ear Size" value={config.earSize} onChange={value => setConfig(prev => ({ ...prev, earSize: value }))} />
                                        </div>
                                    </div>
                                )}

                                {studioNavId === 'layers' && (
                                    <div className="flex min-h-0 flex-1 flex-col gap-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Layer presets</p>
                                            <p className="mt-1 text-[9px] leading-snug text-text-muted/80">
                                                Lists are defined in code (<span className="text-white/55">avatarLayerPresetCatalog.ts</span>) with files under{' '}
                                                <span className="text-white/55">public/avatar-presets/</span>. Admins pick only; new assets are shipped by the team.
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(Object.keys(LAYER_LABELS) as AvatarLayerKey[]).map(key => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setLayerPresetSlot(key)}
                                                    className={cn(
                                                        'rounded-lg border px-2 py-1.5 text-[9px] font-black uppercase tracking-wide transition-colors',
                                                        layerPresetSlot === key
                                                            ? 'border-primary bg-primary/15 text-primary'
                                                            : 'border-white/10 text-text-muted hover:border-white/20 hover:text-white',
                                                    )}
                                                >
                                                    {LAYER_LABELS[key].replace(' Layer', '')}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-white/10 bg-black/25 p-2">
                                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                                                {AVATAR_LAYER_PRESETS[layerPresetSlot].map(preset => {
                                                    const active =
                                                        preset.src === null
                                                            ? layers[layerPresetSlot].preview === null
                                                            : layers[layerPresetSlot].preview === preset.src;
                                                    return (
                                                        <button
                                                            key={preset.id}
                                                            type="button"
                                                            onClick={() => applyLayerPreset(layerPresetSlot, preset.src)}
                                                            className={cn(
                                                                'flex aspect-square flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border p-1 text-center transition-colors',
                                                                active
                                                                    ? 'border-primary bg-primary/15 ring-1 ring-primary/40'
                                                                    : 'border-white/10 bg-black/30 hover:border-white/20',
                                                            )}
                                                            title={preset.label}
                                                        >
                                                            {preset.src ? (
                                                                <img
                                                                    src={preset.src}
                                                                    alt=""
                                                                    className="max-h-[70%] max-w-full object-contain"
                                                                />
                                                            ) : (
                                                                <span className="text-[9px] font-black uppercase tracking-wide text-text-muted">None</span>
                                                            )}
                                                            <span className="line-clamp-2 w-full text-[7px] font-bold uppercase leading-tight text-white/70">
                                                                {preset.label}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {studioNavId === 'morph' && (
                                    <div className="space-y-4 rounded-xl border border-white/10 bg-black/20 p-4 sm:p-5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
                                            <SlidersHorizontal size={12} className="shrink-0" />
                                            Morph & stats
                                        </p>
                                        <div className="space-y-4">
                                            <StudioSlider label="Body Size (3D)" value={config.bodySize} onChange={value => setConfig(prev => ({ ...prev, bodySize: value }))} />
                                            <StudioSlider label="Head Size (3D)" value={config.headSize} onChange={value => setConfig(prev => ({ ...prev, headSize: value }))} />
                                            <StudioSlider label="Power" value={config.power} onChange={value => setConfig(prev => ({ ...prev, power: value }))} />
                                            <StudioSlider label="Agility" value={config.agility} onChange={value => setConfig(prev => ({ ...prev, agility: value }))} />
                                            <StudioSlider label="Focus" value={config.focus} onChange={value => setConfig(prev => ({ ...prev, focus: value }))} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    }
                </div>
            </aside>

            <div className="relative flex min-h-[520px] flex-1 min-w-0 flex-col border border-white/10 bg-[#05070a] rounded-2xl xl:min-h-0 xl:rounded-none xl:border-0">
                {studioConfigCollapsed && (
                    <button
                        type="button"
                        aria-expanded={!studioConfigCollapsed}
                        aria-label="Show character settings"
                        onClick={() => setStudioConfigCollapsed(false)}
                        className="absolute left-3 top-3 z-40 inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-black/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary shadow-[0_0_20px_rgba(0,255,136,0.2)] transition-colors hover:bg-black"
                    >
                        <ChevronRight size={12} /> Open creator
                    </button>
                )}

                <div
                    className={cn(
                        'flex min-h-0 flex-1 flex-col gap-3 p-3 pl-4 sm:pl-5 xl:h-full',
                        studioConfigCollapsed && 'gap-2 p-0',
                    )}
                >
                    <div
                        className={cn(
                            'flex shrink-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between',
                            studioConfigCollapsed && 'absolute left-10 right-0 top-0 z-30 flex-row items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-4 py-3 pt-4',
                        )}
                    >
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Live preview</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-white/35">
                            Drag to orbit · right-drag / two-finger pan · scroll to zoom
                        </p>
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col xl:min-h-0">
                        {studioMode === 'avatar' ? (
                            <AvatarPreviewCard
                                view={config.view}
                                config={config}
                                layers={layers}
                                fullBleed={studioConfigCollapsed}
                                baseBodySrc={selectedAgentModel?.glbPath || resolveAvatarBodyGlbUrl(config.gender)}
                                outfitModelUrl={resolveOutfitModelUrl(config.outfitModelId)}
                            />
                        ) : (
                            <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-2xl bg-[#05070a]">
                                {selectedWeapon && (
                                    <model-viewer
                                        key={selectedWeapon.id}
                                        ref={(el: HTMLElement | null) => {
                                            weaponViewerRef.current = el;
                                            if (!el) return;
                                            const handler = () => applyWeaponColors(el, weaponColors);
                                            el.addEventListener('load', handler, { once: true });
                                        }}
                                        src={selectedWeapon.glbPath}
                                        crossOrigin="anonymous"
                                        camera-controls
                                        reveal="auto"
                                        interaction-prompt="none"
                                        camera-orbit="45deg 75deg 120%"
                                        min-field-of-view="10deg"
                                        max-field-of-view="45deg"
                                        environment-image="neutral"
                                        tone-mapping="aces"
                                        shadow-intensity="0.5"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            backgroundColor: '#05070a',
                                            ['--poster-color' as string]: 'transparent',
                                        } as CSSProperties}
                                    />
                                )}
                                <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-xl border border-white/10 bg-black/70 px-3 py-1.5 backdrop-blur-md">
                                    <p className="text-center text-[9px] font-bold uppercase tracking-widest text-white/40">Drag to orbit · Scroll to zoom</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={cn('grid shrink-0 grid-cols-2 gap-2', studioConfigCollapsed && 'px-4 pb-2')}>
                        {studioMode === 'avatar' ? (<>
                            <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Generated Name</p>
                                <p className="truncate text-sm font-bold text-white">{generatedName}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Auto Rarity</p>
                                <p className="text-sm font-black" style={{ color: RARITY_COLORS[rarity] }}>{rarity}</p>
                            </div>
                        </>) : (<>
                            <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Weapon</p>
                                <p className="truncate text-sm font-bold text-white">{selectedWeapon?.label ?? '—'}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Auto Rarity</p>
                                <p className="text-sm font-black" style={{ color: RARITY_COLORS[weaponRarity] }}>{weaponRarity}</p>
                            </div>
                        </>)}
                    </div>

                    <button
                        onClick={saveAsDraft}
                        disabled={saving}
                        className={cn(
                            'inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-black uppercase tracking-wider text-black transition-all hover:bg-primary/90 disabled:opacity-50',
                            studioConfigCollapsed && 'mx-4 mb-4',
                        )}
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : studioMode === 'avatar' ? <Save size={16} /> : <Swords size={16} />}
                        {saving ? 'Saving Draft...' : studioMode === 'avatar' ? 'Save Character as NFT' : 'Save Weapon as NFT'}
                    </button>
                </div>
            </div>
        </div>
        {showUploadModal && (
            <div className="fixed inset-0 z-[120] flex items-start justify-center bg-black/70 px-4 pt-20 backdrop-blur-sm">
                <div className="w-full max-w-xl rounded-2xl border border-primary/20 bg-[#0f1115] p-4 shadow-[0_0_40px_rgba(0,255,136,0.2)]">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                            Upload 3D model (.glb/.gltf)
                        </p>
                        <button
                            type="button"
                            onClick={() => !uploadingModel && setShowUploadModal(false)}
                            className="rounded-md border border-white/10 p-1 text-white/60 transition-colors hover:text-white"
                        >
                            <X size={14} />
                        </button>
                    </div>
                    <p className="mt-1 text-[10px] text-white/40">
                        Game: <span className="text-white/70">{GAME_DEFS[selectedGame].short}</span> · Type:{' '}
                        <span className="text-white/70">{selectedItemType}</span>
                    </p>
                    {modelFile && (
                        <p className="mt-2 truncate rounded-md border border-primary/25 bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                            {modelFile.name}
                        </p>
                    )}
                    <div className="mt-3 space-y-2">
                        <input
                            placeholder="Model name (e.g. Jinx, Reaver Vandal)"
                            value={modelName}
                            onChange={(e) => setModelName(e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-[11px] text-white outline-none placeholder-white/20 focus:border-primary/50"
                        />
                        <input
                            type="file"
                            accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
                            onChange={(e) => setModelFile(e.target.files?.[0] || null)}
                            className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-[11px] text-white file:mr-2 file:rounded file:border-0 file:bg-primary file:px-2 file:py-1 file:text-[10px] file:font-bold file:text-black"
                        />
                        <button
                            type="button"
                            disabled={!modelFile || !modelName.trim() || uploadingModel}
                            onClick={() => void uploadModelFromStudio()}
                            className="w-full rounded-lg bg-primary px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-primary/90 disabled:opacity-40"
                        >
                            {uploadingModel ? 'Uploading...' : 'Upload & add to selector'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}

function AvatarPreviewCard({ view, config, layers, compact = false, fullBleed = false, outfitModelUrl = null, baseBodySrc }: {
    view: AvatarView;
    config: {
        gender: string;
        bodyType: string;
        skinTone: string;
        hairLength: number;
        hairColor: string;
        earSize: number;
        eyeColor: string;
        aura: string;
        bodySize: number;
        headSize: number;
    };
    layers: AvatarLayers;
    compact?: boolean;
    /** Edge-to-edge 3D viewport (e.g. config panel collapsed). */
    fullBleed?: boolean;
    /** Second glTF layer (clothing), same camera as body */
    outfitModelUrl?: string | null;
    /** Optional game-specific base GLB (e.g. Valorant agent Omen). */
    baseBodySrc?: string;
}) {
    const viewerRef = useRef<HTMLElement | null>(null);
    const outfitModelUrlRef = useRef<string | null>(outfitModelUrl ?? null);
    const configRef = useRef(config);
    configRef.current = config;
    const viewRef = useRef(view);
    viewRef.current = view;
    /** True while we set orbit from UI (presets / zoom / frame) — ignore camera-change for preset highlight */
    const programmaticCameraRef = useRef(false);
    const [modelFailed, setModelFailed] = useState(false);
    const [cameraOrbit, setCameraOrbit] = useState<string>(AVATAR_CAMERA_ORBIT[view]);
    const [activePreset, setActivePreset] = useState<CameraPreset | 'free'>(view === 'side' ? 'right' : view);

    /**
     * Push orbit (and optionally camera target) imperatively — avoids React resetting camera on re-renders.
     * @param cameraTarget pass `'auto'` to reset pivot to model-viewer default; omit to leave target unchanged.
     */
    const applyOrbitToViewer = useCallback((orbit: string, jumpToGoal: boolean, cameraTarget?: string) => {
        programmaticCameraRef.current = true;
        setCameraOrbit(orbit);
        const el = viewerRef.current as ModelViewerElement | null;
        if (!el) return;
        if (cameraTarget !== undefined) el.cameraTarget = cameraTarget;
        el.cameraOrbit = orbit;
        if (jumpToGoal) el.jumpCameraToGoal?.();
        window.setTimeout(() => {
            programmaticCameraRef.current = false;
        }, 120);
    }, []);

    const auraBg: Record<string, string> = {
        Neon: 'linear-gradient(160deg, #0a1220, #172554 65%, #0e7490)',
        Ice: 'linear-gradient(160deg, #0f172a, #1d4ed8 60%, #bae6fd)',
        Shadow: 'linear-gradient(160deg, #020617, #312e81 55%, #581c87)',
        Fire: 'linear-gradient(160deg, #111827, #9a3412 55%, #dc2626)',
        Gold: 'linear-gradient(160deg, #111827, #78350f 55%, #f59e0b)',
    };
    const bodyScale = config.bodyType === 'Heroic' ? 1.06 : config.bodyType === 'Lean' ? 0.94 : 1;
    const viewTransform = view === 'side' ? 'rotateY(24deg)' : view === 'back' ? 'rotateY(180deg)' : 'none';
    const resolvedBodySrc = baseBodySrc || resolveAvatarBodyGlbUrl(config.gender);
    useEffect(() => {
        const nextOrbit = AVATAR_CAMERA_ORBIT[view];
        applyOrbitToViewer(nextOrbit, true, 'auto');
        setActivePreset(view === 'side' ? 'right' : view);
    }, [view, applyOrbitToViewer]);

    useEffect(() => {
        if (compact) return;

        setModelFailed(false);
        const el = viewerRef.current;
        if (!el) return;

        const mv = el as ModelViewerElement;

        const onLoad = () => {
            setModelFailed(false);
            void (async () => {
                try {
                    await mv.updateFraming?.();
                } catch {
                    /* ignore framing errors */
                }
                requestAnimationFrame(() => {
                    const orbit = AVATAR_CAMERA_ORBIT[viewRef.current];
                    mv.cameraTarget = 'auto';
                    mv.cameraOrbit = orbit;
                    setCameraOrbit(orbit);
                    const c = configRef.current;
                    void applyAvatarDynamicConfig(el, {
                        skinTone: c.skinTone,
                        hairColor: c.hairColor,
                        eyeColor: c.eyeColor,
                        aura: c.aura,
                        bodyType: c.bodyType,
                        bodySize: c.bodySize,
                        headSize: c.headSize,
                    }).then(() => {
                        startAvatarPreviewAnimation(el);
                        // Re-inject outfit after body reloads (gender switch resets the scene)
                        if (outfitModelUrlRef.current) {
                            loadOutfitIntoScene(el, outfitModelUrlRef.current).catch(console.error);
                        }
                    });
                });
            })();
        };
        const onError = () => {
            setModelFailed(true);
        };

        el.addEventListener('load', onLoad);
        el.addEventListener('error', onError);
        return () => {
            el.removeEventListener('load', onLoad);
            el.removeEventListener('error', onError);
        };
    }, [compact, baseBodySrc]);

    useEffect(() => {
        if (compact) return;
        const el = viewerRef.current as ModelViewerElement | null;
        if (!el) return;
        const onCameraChange = () => {
            const next = el.getCameraOrbit().toString();
            setCameraOrbit(prev => (prev === next ? prev : next));
            if (!programmaticCameraRef.current) setActivePreset('free');
        };
        el.addEventListener('camera-change', onCameraChange);
        return () => el.removeEventListener('camera-change', onCameraChange);
    }, [compact, baseBodySrc]);

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
    }, [
        compact,
        config.skinTone,
        config.hairColor,
        config.eyeColor,
        config.aura,
        config.bodyType,
        config.bodySize,
        config.headSize,
        baseBodySrc,
    ]);

    // Keep ref in sync so onLoad can access the latest outfitModelUrl without stale closure
    useEffect(() => {
        outfitModelUrlRef.current = outfitModelUrl ?? null;
    }, [outfitModelUrl]);

    // When the outfit selection changes, inject the new GLB directly into the body scene
    useEffect(() => {
        if (compact) return;
        const el = viewerRef.current;
        if (!el) return;
        loadOutfitIntoScene(el, outfitModelUrl ?? null).catch(console.error);
    }, [compact, outfitModelUrl]);

    const applyPreset = (preset: CameraPreset) => {
        setActivePreset(preset);
        applyOrbitToViewer(CAMERA_PRESET_ORBIT[preset], true, 'auto');
    };

    const applyFrameFocus = (key: keyof typeof AVATAR_FRAME_FOCUS) => {
        setActivePreset('free');
        const { orbit, target } = AVATAR_FRAME_FOCUS[key];
        const el = viewerRef.current as ModelViewerElement | null;
        if (!el) return;
        el.cameraTarget = target;
        requestAnimationFrame(() => {
            el.cameraOrbit = orbit;
            el.jumpCameraToGoal?.();
        });
    };

    const stepZoom = (direction: 'in' | 'out') => {
        const orbit = cameraOrbit.split(' ');
        if (orbit.length < 3) return;
        const radius = orbit[2];
        if (!radius.endsWith('%')) return;
        const current = Number.parseFloat(radius.replace('%', ''));
        if (!Number.isFinite(current)) return;
        const next = direction === 'in' ? current * 0.88 : current * 1.14;
        const clamped = Math.max(AVATAR_ZOOM_RADIUS_MIN, Math.min(AVATAR_ZOOM_RADIUS_MAX, next));
        orbit[2] = `${clamped.toFixed(1)}%`;
        setActivePreset('free');
        applyOrbitToViewer(orbit.join(' '), true);
    };

    const vignette = 'absolute inset-0 bg-[radial-gradient(ellipse_at_50%_32%,rgba(0,255,136,0.07),transparent_55%)]';

    const layerImages = [layers.base.preview, layers.outfit.preview, layers.hair.preview, layers.ears.preview, layers.accessory.preview].map((src, idx) => src && (
        <img
            key={`${idx}-${src}`}
            src={src}
            alt=""
            className="absolute inset-0 z-[15] h-full w-full object-contain pointer-events-none"
            style={{
                transform: `${viewTransform} scale(${(compact ? 0.7 : bodyScale) + (idx === 2 ? config.hairLength / 500 : idx === 3 ? config.earSize / 700 : 0)})`,
                filter: idx === 2 ? `drop-shadow(0 0 12px ${config.hairColor})` : undefined,
            }}
        />
    ));

    if (compact) {
        return (
            <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: auraBg[config.aura] || auraBg.Neon }}>
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
            style={{ background: auraBg[config.aura] || auraBg.Neon }}
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
                        key={resolvedBodySrc}
                        ref={viewerRef}
                        className="absolute inset-0 h-full w-full"
                    src={resolvedBodySrc}
                        camera-controls
                        autoplay
                        touch-action="none"
                        reveal="auto"
                        interaction-prompt="none"
                        interpolation-decay="24"
                        min-camera-orbit={AVATAR_MIN_CAMERA_ORBIT}
                        max-camera-orbit={AVATAR_MAX_CAMERA_ORBIT}
                        min-field-of-view={AVATAR_MIN_FOV}
                        max-field-of-view={AVATAR_MAX_FOV}
                        orbit-sensitivity="1.2"
                        zoom-sensitivity="1.05"
                        pan-sensitivity="1.15"
                        exposure="1"
                        shadow-intensity="0.45"
                        shadow-softness="0.85"
                        environment-image="neutral"
                        tone-mapping="aces"
                        style={{
                            touchAction: 'none',
                            backgroundColor: '#05070a',
                            ['--poster-color' as string]: 'transparent',
                        }}
                    />
                    {/* Outfit is injected into the body scene via loadOutfitIntoScene — no second model-viewer needed */}
                </div>

                <div className="absolute right-3 top-3 z-30 flex w-[4.5rem] flex-col gap-1 rounded-2xl border border-white/10 bg-black/65 p-2 backdrop-blur-md">
                    {/* ── Frame ── */}
                    <p className="mb-0.5 px-0.5 text-[7px] font-black uppercase tracking-widest text-white/35">Frame</p>
                    {([
                        { key: 'head' as const, label: 'Head' },
                        { key: 'torso' as const, label: 'Body' },
                        { key: 'full' as const, label: 'Full' },
                    ]).map(({ key, label }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => applyFrameFocus(key)}
                            className="w-full rounded-lg border border-white/10 py-1.5 text-[9px] font-black uppercase tracking-wide text-white/60 transition-all hover:border-primary/40 hover:bg-primary/15 hover:text-primary"
                        >
                            {label}
                        </button>
                    ))}

                    {/* ── Zoom ── */}
                    <div className="mt-1 flex gap-1">
                        <button
                            type="button"
                            onClick={() => stepZoom('in')}
                            title="Zoom in"
                            className="flex-1 rounded-lg border border-white/10 py-1.5 text-sm font-bold leading-none text-white/60 transition-all hover:bg-white/10 hover:text-white"
                        >+</button>
                        <button
                            type="button"
                            onClick={() => stepZoom('out')}
                            title="Zoom out"
                            className="flex-1 rounded-lg border border-white/10 py-1.5 text-sm font-bold leading-none text-white/60 transition-all hover:bg-white/10 hover:text-white"
                        >−</button>
                    </div>

                    {/* ── Angle ── */}
                    <p className="mb-0.5 mt-1 px-0.5 text-[7px] font-black uppercase tracking-widest text-white/35">Angle</p>
                    {(['front', 'right', 'back', 'left', 'top', 'bottom'] as CameraPreset[]).map((preset) => (
                        <button
                            key={preset}
                            type="button"
                            onClick={() => applyPreset(preset)}
                            className={cn(
                                'w-full rounded-lg border py-1.5 text-[9px] font-black uppercase tracking-wide transition-all',
                                activePreset === preset
                                    ? 'border-primary/50 bg-primary/20 text-primary'
                                    : 'border-white/10 text-white/55 hover:bg-white/10 hover:text-white',
                            )}
                        >
                            {preset}
                        </button>
                    ))}
                </div>

                {modelFailed && (
                    <span className="absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-lg border border-amber-500/30 bg-black/70 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-amber-200/90">
                        3D model failed to load — check {resolvedBodySrc}
                    </span>
                )}

                {layerImages}

                <span className="absolute left-2 top-2 z-30 rounded-lg bg-black/55 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white">
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
        <div className="min-w-0">
            <label className="mb-2 flex min-w-0 items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text-muted">
                <span className="shrink-0 text-primary/90">{icon}</span>
                <span className="min-w-0 leading-snug">{label}</span>
            </label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="studio-select box-border h-11 w-full min-w-0 max-w-full cursor-pointer rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
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
        <div className="min-w-0">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-text-muted">{label}</label>
            <input
                type="color"
                value={value}
                onChange={e => onChange(e.target.value)}
                className="box-border h-11 w-full min-w-0 cursor-pointer rounded-xl border border-white/10 bg-black/30 px-1 py-1"
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
