import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Plus, Search, X, Loader2, Trash2, Upload, Sparkles,
    Shield, Sword, Zap, Heart, Star, Crown, Diamond, Flame,
    Send, BarChart3, Box,
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
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Delete failed');
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
                        NFT Manager
                    </h1>
                    <p className="text-text-muted text-sm mt-1">Create, manage and mint gaming NFTs</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-black text-sm font-black uppercase tracking-wider transition-all"
                >
                    <Plus size={16} /> Create NFT
                </button>
            </div>

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
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Mint failed');
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
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Creation failed');
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
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Add failed');
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
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Airdrop failed');
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
