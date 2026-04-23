import { useState, useEffect } from 'react';
import { 
    Diamond, Search, Filter, Grid, List, 
    MoreVertical, ExternalLink, Tag, Shield, 
    Zap, Trophy, Clock, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { nftService, type NftAvatar } from '../../services/nftService';
import { toast } from 'sonner';

const RARITY_COLORS: Record<string, string> = {
    COMMON: '#94a3b8',
    UNCOMMON: '#4ade80',
    RARE: '#60a5fa',
    EPIC: '#c084fc',
    LEGENDARY: '#fbbf24',
    MYTHIC: '#f87171',
};

export default function PlayerInventory() {
    const [nfts, setNfts] = useState<NftAvatar[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [rarityFilter, setRarityFilter] = useState<'ALL' | string>('ALL');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        loadNfts();
    }, []);

    const loadNfts = async () => {
        setLoading(true);
        try {
            const data = await nftService.getMyNfts();
            setNfts(data);
        } catch (error) {
            console.error('Error loading inventory:', error);
            toast.error('Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    const filteredNfts = nfts.filter(nft => {
        const matchesSearch = nft.name.toLowerCase().includes(search.toLowerCase());
        const matchesRarity = rarityFilter === 'ALL' || nft.rarity === rarityFilter;
        return matchesSearch && matchesRarity;
    });

    const handleListForSale = async (nftId: string) => {
        const priceStr = prompt('Enter listing price (AC):');
        if (!priceStr) return;
        const price = parseFloat(priceStr);
        if (isNaN(price) || price <= 0) {
            toast.error('Invalid price');
            return;
        }

        try {
            await nftService.listForSale(nftId, price);
            toast.success('NFT listed for sale!');
            loadNfts();
        } catch (error) {
            toast.error('Failed to list NFT');
        }
    };

    const handleUnlist = async (nftId: string) => {
        try {
            await nftService.unlist(nftId);
            toast.success('NFT unlisted');
            loadNfts();
        } catch (error) {
            toast.error('Failed to unlist NFT');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                            <Diamond className="text-primary w-8 h-8" />
                        </div>
                        MY INVENTORY
                    </h1>
                    <p className="text-text-muted mt-2 font-medium">Manage your digital assets and collection</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-surface border border-white/5 p-1.5 rounded-2xl flex gap-1">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "p-2.5 rounded-xl transition-all",
                                viewMode === 'grid' ? "bg-white/10 text-white shadow-lg" : "text-white/20 hover:text-white/40"
                            )}
                        >
                            <Grid size={18} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "p-2.5 rounded-xl transition-all",
                                viewMode === 'list' ? "bg-white/10 text-white shadow-lg" : "text-white/20 hover:text-white/40"
                            )}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-surface/50 border border-white/5 p-4 rounded-3xl backdrop-blur-xl flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input 
                        type="text"
                        placeholder="Search by name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:border-primary/50 outline-none transition-all font-medium"
                    />
                </div>

                <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                    <Filter size={16} className="text-white/20 mr-2 shrink-0" />
                    {['ALL', 'COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'].map(rarity => (
                        <button
                            key={rarity}
                            onClick={() => setRarityFilter(rarity)}
                            className={cn(
                                "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                                rarityFilter === rarity 
                                    ? "bg-white/10 border-white/20 text-white" 
                                    : "border-transparent text-white/30 hover:text-white/60"
                            )}
                        >
                            {rarity}
                        </button>
                    ))}
                </div>
            </div>

            {/* Inventory Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="aspect-[4/5] bg-surface border border-white/5 rounded-3xl animate-pulse" />
                    ))}
                </div>
            ) : filteredNfts.length > 0 ? (
                <div className={cn(
                    viewMode === 'grid' 
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        : "flex flex-col gap-3"
                )}>
                    {filteredNfts.map(nft => (
                        <InventoryCard 
                            key={nft._id} 
                            nft={nft} 
                            viewMode={viewMode}
                            onList={() => handleListForSale(nft._id)}
                            onUnlist={() => handleUnlist(nft._id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 bg-black/20 rounded-[40px] border border-dashed border-white/10">
                    <div className="p-6 bg-white/5 rounded-full mb-6">
                        <AlertCircle size={48} className="text-white/10" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-wider">No assets found</h3>
                    <p className="text-text-muted mt-2 font-medium">Try adjusting your filters or search terms</p>
                </div>
            )}
        </div>
    );
}

function InventoryCard({ nft, viewMode, onList, onUnlist }: { 
    nft: NftAvatar; 
    viewMode: 'grid' | 'list';
    onList: () => void;
    onUnlist: () => void;
}) {
    const isListed = nft.listed;
    // status and other fields might be available if we use a more complete type
    // for now we use what nftService provides

    if (viewMode === 'list') {
        return (
            <div className="bg-surface/30 border border-white/5 p-4 rounded-2xl hover:border-white/10 transition-all flex items-center gap-6 group">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/40 shrink-0">
                    <img src={nft.image} alt={nft.name} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1 min-w-0">
                    <h3 className="font-black text-white text-base truncate">{nft.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: RARITY_COLORS[nft.rarity] }}>
                            {nft.rarity}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                            AVATAR
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-8 px-6">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-0.5">Status</p>
                        <p className={cn(
                            "text-xs font-black uppercase tracking-widest",
                            isListed ? "text-[#ffaa00]" : "text-primary"
                        )}>
                            {isListed ? 'LISTED' : 'OWNED'}
                        </p>
                    </div>
                    {isListed && (
                        <div className="text-right">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-0.5">Price</p>
                            <p className="text-sm font-black text-white">{nft.listPrice} AC</p>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {isListed ? (
                        <button 
                            onClick={onUnlist}
                            className="px-4 py-2 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                        >
                            Unlist
                        </button>
                    ) : (
                        <button 
                            onClick={onList}
                            className="px-4 py-2 rounded-xl bg-primary text-black hover:bg-primary/90 transition-all text-[10px] font-black uppercase tracking-widest"
                        >
                            Sell
                        </button>
                    )}
                    <button className="p-2 text-white/20 hover:text-white transition-all">
                        <MoreVertical size={18} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface/30 border border-white/5 rounded-[32px] overflow-hidden group hover:border-primary/40 transition-all duration-500 flex flex-col shadow-2xl hover:shadow-primary/5">
            <div className="aspect-[4/5] relative overflow-hidden bg-black/40">
                <img 
                    src={nft.image} 
                    alt={nft.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                
                {/* Rarity Tag */}
                <div className="absolute top-4 left-4">
                    <span 
                        className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-md shadow-lg"
                        style={{ backgroundColor: `${RARITY_COLORS[nft.rarity]}20`, color: RARITY_COLORS[nft.rarity] }}
                    >
                        {nft.rarity}
                    </span>
                </div>

                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                    <div className={cn(
                        "p-2 rounded-xl border backdrop-blur-md shadow-lg transition-colors",
                        isListed ? "bg-[#ffaa00]/10 border-[#ffaa00]/20 text-[#ffaa00]" : "bg-primary/10 border-primary/20 text-primary"
                    )}>
                        {isListed ? <Tag size={16} /> : <Shield size={16} />}
                    </div>
                </div>

                {/* Info Overlay */}
                <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight truncate group-hover:text-primary transition-colors">{nft.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="flex -space-x-2">
                            <div className="w-5 h-5 rounded-full border border-black bg-white/10 flex items-center justify-center">
                                <Zap size={10} className="text-primary fill-primary" />
                            </div>
                        </div>
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Level 12 Warrior</span>
                    </div>
                </div>
            </div>

            <div className="p-6 bg-black/20 flex-1 flex flex-col">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Status</p>
                        <p className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            isListed ? "text-[#ffaa00]" : "text-primary"
                        )}>
                            {isListed ? 'Listed' : 'Inventory'}
                        </p>
                    </div>
                    {isListed ? (
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Price</p>
                            <p className="text-sm font-black text-white italic">{nft.listPrice} AC</p>
                        </div>
                    ) : (
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-center">
                             <CheckCircle2 size={16} className="text-primary/40" />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-auto">
                    {isListed ? (
                        <button 
                            onClick={onUnlist}
                            className="col-span-2 py-3 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95"
                        >
                            Cancel Listing
                        </button>
                    ) : (
                        <button 
                            onClick={onList}
                            className="col-span-2 py-3 rounded-2xl bg-primary text-black font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary/90 transition-all shadow-lg active:scale-95 shadow-primary/20"
                        >
                            List for Sale
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
