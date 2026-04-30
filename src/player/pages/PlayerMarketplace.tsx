import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Store, Gem, ShoppingCart, Search, ArrowUpDown, Clock, X,
    ChevronLeft, ChevronRight, Package,
} from 'lucide-react';
import { nftService } from '../../services/nftService';
import type { NftAvatar, NftRarity, NftTransaction } from '../../services/nftService';
import {
    AuctionCard,
    CATEGORIES,
    ListForSaleModal,
    NftCard,
    RARITY_ICON,
    RARITY_STYLES,
} from './marketplace/PlayerMarketplaceSections';

// ─── Demo Data ───────────────────────────────────────────────────────────────

const DEMO_MARKETPLACE: NftAvatar[] = [
    { _id: 'm1', name: 'Shadow Reaper', image: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=shadow', description: 'A dark warrior from the void', rarity: 'LEGENDARY', price: 500, listed: true, listPrice: 650, ownerId: { _id: 'o1', username: 'ShadowBlade' }, createdAt: new Date().toISOString() },
    { _id: 'm2', name: 'Cyber Samurai', image: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=cyber', description: 'Futuristic blade master', rarity: 'EPIC', price: 300, listed: true, listPrice: 380, ownerId: { _id: 'o2', username: 'NeonPhoenix' }, createdAt: new Date().toISOString() },
    { _id: 'm3', name: 'Neon Fox', image: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=neon', description: 'Fast and cunning digital fox', rarity: 'RARE', price: 150, listed: true, listPrice: 200, ownerId: { _id: 'o3', username: ' verhind' }, createdAt: new Date().toISOString() },
    { _id: 'm4', name: 'Iron Guard', image: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=iron', description: 'Unbreakable protector', rarity: 'COMMON', price: 50, listed: true, listPrice: 75, ownerId: { _id: 'o4', username: 'CyberWolf' }, createdAt: new Date().toISOString() },
    { _id: 'm5', name: 'Phoenix Wing', image: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=phoenix', description: 'Rises from the ashes', rarity: 'LEGENDARY', price: 750, listed: true, listPrice: 900, ownerId: { _id: 'o5', username: 'StormRider' }, createdAt: new Date().toISOString() },
    { _id: 'm6', name: 'Frost Mage', image: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=frost', description: 'Master of ice magic', rarity: 'EPIC', price: 280, listed: true, listPrice: 340, ownerId: { _id: 'o6', username: 'GhostSniper' }, createdAt: new Date().toISOString() },
    { _id: 'm7', name: 'Void Walker', image: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=void', description: 'Traverses between dimensions', rarity: 'RARE', price: 180, listed: true, listPrice: 220, ownerId: { _id: 'o7', username: 'PixelKnight' }, createdAt: new Date().toISOString() },
    { _id: 'm8', name: 'Thunder Lord', image: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=thunder', description: 'Commands the storms', rarity: 'EPIC', price: 320, listed: true, listPrice: 400, ownerId: { _id: 'o8', username: 'ArcaneWitch' }, createdAt: new Date().toISOString() },
];

const DEMO_MY_NFTS: NftAvatar[] = [
    { _id: 'my1', name: 'Blade Dancer', image: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=blade', description: 'Swift dual-wielding assassin', rarity: 'EPIC', price: 250, listed: false, createdAt: new Date().toISOString() },
    { _id: 'my2', name: 'Crystal Golem', image: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=crystal', description: 'Ancient magical construct', rarity: 'RARE', price: 120, listed: true, listPrice: 180, createdAt: new Date().toISOString() },
];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PlayerMarketplace() {
    const [tab, setTab] = useState<'marketplace' | 'my-nfts'>('marketplace');
    const [marketplace, setMarketplace] = useState<NftAvatar[]>([]);
    const [featured, setFeatured] = useState<NftAvatar[]>([]);
    const [myNfts, setMyNfts] = useState<NftAvatar[]>([]);
    const [history, setHistory] = useState<NftTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRarity, setFilterRarity] = useState<NftRarity | 'ALL'>('ALL');
    const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'rarity'>('price-asc');
    const [showBuyConfirm, setShowBuyConfirm] = useState<NftAvatar | null>(null);
    const [showListModal, setShowListModal] = useState<NftAvatar | null>(null);
    const [buying, setBuying] = useState(false);
    const [auctionPage, setAuctionPage] = useState(0);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [mkt, my, hist] = await Promise.all([
                nftService.getMarketplace().catch(() => [] as NftAvatar[]),
                nftService.getMyNfts().catch(() => [] as NftAvatar[]),
                nftService.getHistory(15).catch(() => [] as NftTransaction[]),
            ]);
            const listings = mkt.length > 0 ? mkt : DEMO_MARKETPLACE;
            setMarketplace(listings);
            setFeatured(listings.filter((n) => n.rarity === 'LEGENDARY' || n.rarity === 'EPIC').slice(0, 8));
            setMyNfts(my.length > 0 ? my : DEMO_MY_NFTS);
            setHistory(hist);
        } catch {
            setMarketplace(DEMO_MARKETPLACE);
            setFeatured(
                DEMO_MARKETPLACE.filter((n) => n.rarity === 'LEGENDARY' || n.rarity === 'EPIC').slice(0, 8),
            );
            setMyNfts(DEMO_MY_NFTS);
            setHistory([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData, tab]);

    const handleBuy = async (nft: NftAvatar) => {
        try {
            setBuying(true);
            const bought = await nftService.buy(nft._id);
            setMarketplace(prev => prev.filter(n => n._id !== nft._id));
            setMyNfts(prev => [bought, ...prev]);
            setShowBuyConfirm(null);
        } catch (e) {
            console.error('Buy failed', e);
        } finally {
            setBuying(false);
        }
    };

    const handleUnlist = async (nft: NftAvatar) => {
        try {
            const updated = await nftService.unlist(nft._id);
            setMyNfts(prev => prev.map(n => n._id === nft._id ? updated : n));
        } catch (e) {
            console.error('Unlist failed', e);
        }
    };

    const RARITY_ORDER: Record<NftRarity, number> = { COMMON: 0, RARE: 1, EPIC: 2, LEGENDARY: 3 };

    const items = tab === 'marketplace' ? marketplace : myNfts;
    const filtered = items
        .filter(n => {
            if (filterRarity !== 'ALL' && n.rarity !== filterRarity) return false;
            if (search && !n.name.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'price-asc') return (a.listPrice ?? a.price) - (b.listPrice ?? b.price);
            if (sortBy === 'price-desc') return (b.listPrice ?? b.price) - (a.listPrice ?? a.price);
            return RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity];
        });

    // Featured Hero logic
    const heroItem = featured.length > 0 ? featured[0] : (marketplace.length > 0 ? marketplace[0] : DEMO_MARKETPLACE[0]);

    // Live auctions: top items with simulated expiry
    const liveItems = marketplace.filter(i => i.rarity === 'LEGENDARY' || i.rarity === 'EPIC');
    const liveAuctions = liveItems.length > 0 ? liveItems.slice(0, 6) : marketplace.slice(0, 6);
    const auctionPageSize = 3;
    const pagedAuctions = liveAuctions.slice(auctionPage * auctionPageSize, (auctionPage + 1) * auctionPageSize);
    const totalAuctionPages = Math.ceil(liveAuctions.length / auctionPageSize);

    return (
        <div className="space-y-8">
            {/* ═══ HERO BANNER ═══ */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-900/40 via-primary/10 to-blue-900/40 border border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,255,136,0.08),transparent_60%)]" />
                <div className="relative flex items-center gap-8 p-8 md:p-10">
                    {/* Left: Featured NFT image */}
                    <div className="hidden md:flex shrink-0 w-48 h-48 rounded-2xl bg-black/30 border border-white/10 p-4 items-center justify-center relative">
                        <img
                            src={heroItem.image}
                            alt={heroItem.name}
                            className="w-full h-full object-contain drop-shadow-2xl"
                            loading="lazy"
                            onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${heroItem.name}`; }}
                        />
                        <span className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${RARITY_STYLES[heroItem.rarity].badge}`}>
                            {RARITY_ICON[heroItem.rarity]} {heroItem.rarity}
                        </span>
                    </div>

                    {/* Right: Text */}
                    <div className="flex-1 space-y-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
                                Discover, Collect<br />and Sell Your <span className="text-primary">NFTs</span>
                            </h1>
                            <p className="text-text-muted text-sm mt-2 max-w-md">
                                Arena Chain Marketplace brings players and collectors together on a single platform. Trade unique gaming avatars.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <button
                                onClick={() => { setTab('marketplace'); setFilterRarity('ALL'); }}
                                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-black text-sm font-black uppercase tracking-wider transition-all"
                            >
                                Discover Now
                            </button>
                            <button
                                onClick={() => setTab('my-nfts')}
                                className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold transition-all"
                            >
                                My Collection
                                PERSONAL_VAULT
                            </button>
                            <Link
                                to="/player/inventory"
                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-primary/30 bg-primary/10 text-primary text-sm font-black uppercase tracking-wider transition-all hover:bg-primary/15"
                            >
                                <Package size={16} />
                                Inventory
                            </Link>
                            <div className="ml-auto hidden sm:flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5">
                                <Gem size={14} className="text-primary" />
                                <span className="text-white font-black text-sm">2,500</span>
                                <span className="text-text-muted text-[10px] font-bold uppercase">AC</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ CATEGORY PILLS ═══ */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.key}
                        onClick={() => setFilterRarity(cat.key as NftRarity | 'ALL')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-bold whitespace-nowrap transition-all duration-200 ${filterRarity === cat.key
                            ? 'bg-primary/15 text-primary border-primary/30 shadow-[0_0_12px_rgba(0,255,136,0.1)]'
                            : 'bg-surface border-white/10 text-text-muted hover:text-white hover:border-white/20'
                            }`}
                    >
                        {cat.icon} {cat.label}
                    </button>
                ))}
            </div>

            {/* ═══ LIVE AUCTIONS SECTION ═══ */}
            {tab === 'marketplace' && liveAuctions.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-black text-white">Live Auctions</h2>
                            <span className="text-text-muted text-sm font-bold">{liveAuctions.length} items</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setAuctionPage(Math.max(0, auctionPage - 1))}
                                disabled={auctionPage === 0}
                                className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-text-muted hover:text-white hover:border-white/20 disabled:opacity-30 transition-all"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setAuctionPage(Math.min(totalAuctionPages - 1, auctionPage + 1))}
                                disabled={auctionPage >= totalAuctionPages - 1}
                                className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-text-muted hover:text-white hover:border-white/20 disabled:opacity-30 transition-all"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {pagedAuctions.map((nft, i) => (
                            <AuctionCard
                                key={nft._id}
                                nft={nft}
                                expiresAt={new Date(Date.now() + (i + 1) * 5400000 + 3600000)}
                                onBuy={() => setShowBuyConfirm(nft)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ═══ TABS ═══ */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-1 bg-[#0d0d0d] border border-white/5 rounded-xl p-1">
                    <button
                        onClick={() => setTab('marketplace')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${tab === 'marketplace' ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'}`}
                    >
                        <Store size={14} /> Marketplace
                    </button>
                    <button
                        onClick={() => setTab('my-nfts')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${tab === 'my-nfts' ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'}`}
                    >
                        <Gem size={14} /> My NFTs
                        {myNfts.length > 0 && <span className="ml-1 bg-primary/20 text-primary px-1.5 py-0.5 rounded text-[9px] font-black">{myNfts.length}</span>}
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search NFTs..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-56 bg-surface border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-text-muted/50 focus:border-primary/50 outline-none"
                        />
                    </div>
                    <button
                        onClick={() => setSortBy(s => s === 'price-asc' ? 'price-desc' : s === 'price-desc' ? 'rarity' : 'price-asc')}
                        className="flex items-center gap-1.5 px-3 py-2.5 bg-surface border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-white transition-all"
                    >
                        <ArrowUpDown size={12} />
                        {sortBy === 'price-asc' ? 'Price ↑' : sortBy === 'price-desc' ? 'Price ↓' : 'Rarity'}
                    </button>
                </div>
            </div>

            {/* ═══ NFT GRID ═══ */}
            {loading ? (
                <div className="text-primary text-sm font-bold text-center py-16 animate-pulse">Loading NFTs…</div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-surface border border-white/5 rounded-2xl">
                    <Store className="w-12 h-12 text-primary opacity-20 mb-4" />
                    <p className="text-white font-black text-lg uppercase tracking-widest mb-1">
                        {tab === 'marketplace' ? 'No listings found' : 'No NFTs in your collection'}
                    </p>
                    <p className="text-text-muted text-sm">
                        {tab === 'marketplace' ? 'Check back later or adjust filters' : 'Buy NFTs from the marketplace to start collecting'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map(nft => (
                        <NftCard
                            key={nft._id}
                            nft={nft}
                            isMyNft={tab === 'my-nfts'}
                            onBuy={() => setShowBuyConfirm(nft)}
                            onUnlist={() => handleUnlist(nft)}
                            onList={() => setShowListModal(nft)}
                        />
                    ))}
                </div>
            )}

            {/* ═══ ACTIVITY FEED SECTION ═══ */}
            {history.length > 0 && (
                <div className="mt-12 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-wider">Recent Activity</h2>
                            <p className="text-text-muted text-xs">Latest marketplace transactions and events</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {history.map((tx) => (
                            <div key={tx._id} className="flex items-center gap-4 p-4 rounded-2xl bg-surface border border-white/5 hover:border-white/10 transition-all group">
                                <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 p-2 shrink-0">
                                    <img
                                        src={tx.nftItemId?.nftId?.imageUrl}
                                        alt=""
                                        className="w-full h-full object-contain"
                                        onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${tx.nftItemId?.nftId?.name}`; }}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${tx.type === 'SALE' ? 'bg-green-500/20 text-green-400' :
                                            tx.type === 'LIST' ? 'bg-blue-500/20 text-blue-400' :
                                                tx.type === 'UNLIST' ? 'bg-zinc-500/20 text-zinc-400' :
                                                    'bg-primary/20 text-primary'
                                            }`}>
                                            {tx.type}
                                        </span>
                                        <span className="text-text-muted text-[10px]">{new Date(tx.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className="text-white text-sm font-bold truncate mt-1">
                                        <span className="text-primary">{tx.fromUserId?.username || 'System'}</span>
                                        {tx.type === 'SALE' ? ' sold ' : tx.type === 'LIST' ? ' listed ' : ' updated '}
                                        <span className="text-white">{tx.nftItemId?.nftId?.name || 'NFT'}</span>
                                        {tx.toUserId && <> to <span className="text-primary">{tx.toUserId.username}</span></>}
                                    </p>
                                </div>
                                {tx.price > 0 && (
                                    <div className="text-right">
                                        <div className="flex items-center gap-1.5 justify-end">
                                            <Gem size={12} className="text-primary" />
                                            <span className="text-primary font-black text-sm">{tx.price} AC</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Buy Confirm Modal */}
            {showBuyConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-5 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-2">
                                <ShoppingCart size={18} className="text-primary" /> Confirm Purchase
                            </h2>
                            <button onClick={() => setShowBuyConfirm(null)} className="text-text-muted hover:text-white transition-colors"><X size={20} /></button>
                        </div>

                        <div className={`flex items-center gap-4 p-3 rounded-xl border ${RARITY_STYLES[showBuyConfirm.rarity].border} ${RARITY_STYLES[showBuyConfirm.rarity].bg}`}>
                            <img src={showBuyConfirm.image} alt={showBuyConfirm.name} className="w-16 h-16 rounded-xl object-contain bg-black/30 p-2" />
                            <div>
                                <p className="text-white font-black text-sm">{showBuyConfirm.name}</p>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${RARITY_STYLES[showBuyConfirm.rarity].text}`}>{showBuyConfirm.rarity}</span>
                            </div>
                        </div>

                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
                            <span className="text-text-muted text-xs font-bold">Total Price</span>
                            <div className="flex items-center gap-1.5">
                                <Gem size={14} className="text-primary" />
                                <span className="text-primary font-black text-lg">{showBuyConfirm.listPrice ?? showBuyConfirm.price} AC</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowBuyConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white text-sm font-bold transition-all">Cancel</button>
                            <button
                                onClick={() => handleBuy(showBuyConfirm)}
                                disabled={buying}
                                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-black text-sm font-black uppercase tracking-wider disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {buying ? 'Buying…' : <><ShoppingCart size={14} /> Buy</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* List for Sale Modal */}
            {showListModal && <ListForSaleModal nft={showListModal} onClose={() => setShowListModal(null)} onListed={(updated) => { setMyNfts(prev => prev.map(n => n._id === updated._id ? updated : n)); setShowListModal(null); }} />}
        </div>
    );
}
