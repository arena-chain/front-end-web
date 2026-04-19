import { useState, useEffect } from 'react';
import {
    Store, Gem, ShoppingCart, Tag, X, Search, Heart,
    Sparkles, Crown, Star, Diamond, ArrowUpDown,
    ChevronLeft, ChevronRight, Clock, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { nftService } from '../../services/nftService';
import type { NftAvatar, NftRarity } from '../../services/nftService';
import { cn } from '../../lib/utils';

// ─── Theme config ────────────────────────────────────────────────────────────
const RARITY_THEMES: Record<NftRarity, { accent: string; glow: string; badge: string; gradient: string }> = {
    COMMON:    { accent: '#71717a', glow: 'rgba(113,113,122,0.1)', badge: 'bg-zinc-500/10 text-zinc-400', gradient: 'from-zinc-900 via-zinc-900 to-zinc-800' },
    RARE:      { accent: '#3b82f6', glow: 'rgba(59,130,246,0.15)', badge: 'bg-blue-500/10 text-blue-400', gradient: 'from-blue-900/40 via-zinc-900 to-zinc-900' },
    EPIC:      { accent: '#8b5cf6', glow: 'rgba(139,92,246,0.2)', badge: 'bg-violet-500/10 text-violet-400', gradient: 'from-violet-900/40 via-zinc-900 to-zinc-900' },
    LEGENDARY: { accent: '#f59e0b', glow: 'rgba(245,158,11,0.25)', badge: 'bg-amber-500/10 text-amber-400', gradient: 'from-amber-900/40 via-zinc-900 to-zinc-900' },
};

const CATEGORIES = [
    { key: 'ALL', label: 'ALL_PROTOCOLS', icon: <Gem size={14} /> },
    { key: 'LEGENDARY', label: 'LEGENDARY', icon: <Diamond size={14} /> },
    { key: 'EPIC', label: 'EPIC', icon: <Crown size={14} /> },
    { key: 'RARE', label: 'RARE', icon: <Sparkles size={14} /> },
    { key: 'COMMON', label: 'COMMON', icon: <Star size={14} /> },
];

function useCountdown(target: Date): string {
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);
    const diff = target.getTime() - now;
    if (diff <= 0) return '00:00:00';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Demo Data ───────────────────────────────────────────────────────────────
const DEMO_MARKETPLACE: NftAvatar[] = [
    { _id: 'm1', name: 'VOID REAPER // PROTOCOL_01', image: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=shadow', description: 'Void-integrated combat chassis', rarity: 'LEGENDARY', price: 500, listed: true, listPrice: 650, ownerId: { _id: 'o1', username: 'ShadowBlade' }, createdAt: new Date().toISOString() },
    { _id: 'm2', name: 'NEON NINJA // SYNC_99', image: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=cyber', description: 'Hyper-speed infiltration unit', rarity: 'EPIC', price: 300, listed: true, listPrice: 380, ownerId: { _id: 'o2', username: 'NeonPhoenix' }, createdAt: new Date().toISOString() },
    { _id: 'm3', name: 'CYBER CORE // AX-04', image: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=neon', description: 'Advanced sentient data host', rarity: 'RARE', price: 150, listed: true, listPrice: 200, ownerId: { _id: 'o3', username: 'VoidHunter' }, createdAt: new Date().toISOString() },
    { _id: 'm4', name: 'IRON SENTINEL // GUARD', image: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=iron', description: 'Indestructible defensive frame', rarity: 'COMMON', price: 50, listed: true, listPrice: 75, ownerId: { _id: 'o4', username: 'CyberWolf' }, createdAt: new Date().toISOString() },
];

export default function PlayerMarketplace() {
    const [tab, setTab] = useState<'marketplace' | 'my-nfts'>('marketplace');
    const [marketplace, setMarketplace] = useState<NftAvatar[]>([]);
    const [myNfts, setMyNfts] = useState<NftAvatar[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRarity, setFilterRarity] = useState<NftRarity | 'ALL'>('ALL');
    const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'rarity'>('price-asc');
    const [showBuyConfirm, setShowBuyConfirm] = useState<NftAvatar | null>(null);
    const [showListModal, setShowListModal] = useState<NftAvatar | null>(null);
    const [buying, setBuying] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            const [mkt, my] = await Promise.all([
                nftService.getMarketplace().catch(() => DEMO_MARKETPLACE),
                nftService.getMyNfts().catch(() => []),
            ]);
            setMarketplace(mkt.length > 0 ? mkt : DEMO_MARKETPLACE);
            setMyNfts(my);
        } catch {
            setMarketplace(DEMO_MARKETPLACE);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

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

    const filtered = (tab === 'marketplace' ? marketplace : myNfts)
        .filter(n => {
            if (filterRarity !== 'ALL' && n.rarity !== filterRarity) return false;
            if (search && !n.name.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'price-asc') return (a.listPrice ?? a.price) - (b.listPrice ?? b.price);
            if (sortBy === 'price-desc') return (b.listPrice ?? b.price) - (a.listPrice ?? a.price);
            const RARITY_ORDER: Record<NftRarity, number> = { COMMON: 0, RARE: 1, EPIC: 2, LEGENDARY: 3 };
            return RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity];
        });

    return (
        <div className="min-h-screen bg-[#060606] text-white relative overflow-hidden p-8 lg:p-10">
            {/* Hex background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45v-30z' fill-rule='evenodd' stroke='%23fff' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
                    backgroundSize: '40px' 
                 }} 
            />

            <div className="max-w-[1400px] mx-auto space-y-12 relative z-10">
                {/* ── Header ────────────────────────────────────────── */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 font-black text-[#00ff87] text-[10px] tracking-[0.4em] italic uppercase">
                            <span className="w-2 h-2 rounded-full bg-[#00ff87] animate-pulse" />
                            Exchange Node: Active
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white leading-none">
                            ASSET <span className="text-[#00ff87]">MARKET</span>
                        </h1>
                        <p className="text-white/25 font-black uppercase tracking-[0.35em] text-[10px]">
                            Peer-to-Peer Protocol // Integrated Ledger Exchange
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                        <div className="relative w-full sm:w-80 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#00ff87] transition-colors" size={16} />
                            <input 
                                type="text" 
                                placeholder="ENCRYPTED SEARCH..." 
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-[10px] font-black tracking-widest focus:outline-none focus:border-[#00ff87]/40 text-white placeholder:text-white/20 transition-all"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-6 py-4">
                            <Gem size={16} className="text-[#00ff87]" />
                            <span className="text-white font-black italic tracking-tighter">2,500</span>
                            <span className="text-white/20 text-[8px] font-black uppercase tracking-widest ml-1">CREDITS</span>
                        </div>
                    </div>
                </div>

                {/* ── Featured & Tabs ─────────────────────────────── */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-2 bg-[#111] border border-white/5 rounded-2xl p-1.5 shadow-inner">
                            <button
                                onClick={() => setTab('marketplace')}
                                className={cn(
                                    "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all",
                                    tab === 'marketplace' ? "bg-white/10 text-white shadow-xl" : "text-white/30 hover:text-white"
                                )}
                            >
                                GLOBAL_LISTINGS
                            </button>
                            <button
                                onClick={() => setTab('my-nfts')}
                                className={cn(
                                    "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all",
                                    tab === 'my-nfts' ? "bg-white/10 text-white shadow-xl" : "text-white/30 hover:text-white"
                                )}
                            >
                                PERSONAL_VAULT
                            </button>
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.key}
                                    onClick={() => setFilterRarity(cat.key as NftRarity | 'ALL')}
                                    className={cn(
                                        "px-4 py-2 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all",
                                        filterRarity === cat.key 
                                        ? "bg-[#00ff87]/10 text-[#00ff87] border-[#00ff87]/30" 
                                        : "bg-white/5 border-white/10 text-white/30"
                                    )}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Auction High-Fidelity Section */}
                    {tab === 'marketplace' && filterRarity === 'ALL' && !search && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                           {marketplace.slice(0, 3).map((nft, i) => (
                               <AuctionProtocolCard 
                                    key={nft._id} 
                                    nft={nft} 
                                    index={i} 
                                    expiresAt={new Date(Date.now() + (i + 1) * 3600000)}
                                    onBuy={() => setShowBuyConfirm(nft)}
                                />
                           ))}
                        </div>
                    )}

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {loading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="h-96 bg-white/[0.02] border border-white/5 rounded-3xl animate-pulse" />
                            ))
                        ) : filtered.length === 0 ? (
                            <div className="col-span-full py-40 bg-white/[0.01] border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center text-white/10">
                                <Zap size={48} className="mb-4 opacity-10" />
                                <p className="text-xl font-black italic tracking-widest">NO ASSETS DETECTED</p>
                            </div>
                        ) : (
                            filtered.map((nft, idx) => (
                                <ProtocolNftCard 
                                    key={nft._id} 
                                    nft={nft} 
                                    index={idx}
                                    onBuy={() => setShowBuyConfirm(nft)}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Confirm - Premium Style */}
            {showBuyConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#111] border border-white/10 rounded-[40px] w-full max-w-lg overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]"
                    >
                        <div className="p-10 space-y-8">
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">AUTHORIZE ACQUISITION</h2>
                                    <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">Verifying Protocol Clearances...</p>
                                </div>
                                <button onClick={() => setShowBuyConfirm(null)} className="text-white/20 hover:text-white transition-colors"><X size={24} /></button>
                            </div>

                            <div className="flex gap-8 items-center bg-white/5 p-6 rounded-3xl border border-white/10">
                                <div className="w-24 h-24 bg-black/40 rounded-2xl flex items-center justify-center p-2 border border-white/5 shadow-inner">
                                    <img src={showBuyConfirm.image} alt="NFT" className="w-full h-full object-contain" />
                                </div>
                                <div className="space-y-2">
                                    <div className="px-3 py-1 rounded-sm bg-white/10 text-[8px] font-black uppercase tracking-widest w-fit" style={{ color: RARITY_THEMES[showBuyConfirm.rarity].accent }}>
                                        {showBuyConfirm.rarity}_PROTOCOL
                                    </div>
                                    <h3 className="text-2xl font-black italic tracking-tighter text-white uppercase">{showBuyConfirm.name}</h3>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#00ff87]">TRANSACTION_AMOUNT</span>
                                    <span className="text-4xl font-black italic tracking-tighter text-white">
                                        {showBuyConfirm.listPrice ?? showBuyConfirm.price} <span className="text-sm font-black text-white/20 uppercase tracking-widest ml-1">Credits</span>
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleBuy(showBuyConfirm)}
                                disabled={buying}
                                className="w-full h-20 bg-[#00ff87] text-black rounded-3xl font-black italic uppercase text-xs tracking-[0.3em] shadow-[0_15px_40px_rgba(0,255,135,0.2)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {buying ? "CONFIRMING_LEDGER..." : "AUTHORIZE TRANSFER"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

// ─── Auction Card Component ───────────────────────────────────────────────
function AuctionProtocolCard({ nft, index, expiresAt, onBuy }: { nft: NftAvatar; index: number; expiresAt: Date; onBuy: () => void }) {
    const countdown = useCountdown(expiresAt);
    const theme = RARITY_THEMES[nft.rarity];

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="h-[460px] bg-[#111] border border-white/[0.06] rounded-[40px] overflow-hidden flex flex-col hover:border-white/15 transition-all group group/card relative"
            style={{ boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 20px ${theme.glow}` }}
        >
            <div className="h-56 relative bg-gradient-to-br from-[#0c0c0c] to-black flex items-center justify-center p-8">
                {/* Glow behind image */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 opacity-20 bg-gradient-to-t from-black to-transparent" style={{ background: theme.accent }} />
                
                <img src={nft.image} className="w-full h-full object-contain drop-shadow-2xl group-hover/card:scale-110 transition-transform duration-1000 z-10" alt="Asset" />
                
                <div className="absolute top-6 left-6 px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 backdrop-blur-md z-20">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em]" style={{ color: theme.accent }}>{nft.rarity}</p>
                </div>
                
                <div className="absolute top-6 right-6 px-3 py-1.5 rounded-lg bg-[#00ff87]/10 border border-[#00ff87]/20 backdrop-blur-md z-20 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00ff87] animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#00ff87]">LIVE_AUCTION</span>
                </div>
            </div>

            <div className="flex-1 p-8 flex flex-col justify-between">
                <div className="space-y-2">
                    <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white line-clamp-1">{nft.name}</h3>
                    <p className="text-white/20 text-[9px] font-black uppercase tracking-widest">Protocol Series // Vault v2.0</p>
                </div>

                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1 italic">Highest Bid</p>
                        <div className="flex items-center gap-2 text-white">
                            <span className="text-3xl font-black italic tracking-tighter">{nft.listPrice ?? nft.price}</span>
                            <Gem size={16} className="text-[#00ff87]" />
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1 italic">Closing In</p>
                        <p className="text-xl font-black italic tracking-tighter text-white/80 font-mono underline decoration-[#00ff87]/40 decoration-2 underline-offset-4">{countdown}</p>
                    </div>
                </div>

                <button 
                    onClick={onBuy}
                    className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase tracking-[0.2em] italic text-[10px] transition-all group-hover:bg-[#00ff87] group-hover:text-black group-hover:border-none shadow-xl"
                >
                    INITIATE BID REQUEST
                </button>
            </div>
        </motion.div>
    );
}

// ─── Standard NFT Card Component ──────────────────────────────────────────
function ProtocolNftCard({ nft, index, onBuy }: { nft: NftAvatar; index: number; onBuy: () => void }) {
    const theme = RARITY_THEMES[nft.rarity];

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (index % 8) * 0.05 }}
            className="group relative h-[420px] bg-[#111] border border-white/[0.05] rounded-[32px] overflow-hidden hover:border-white/15 transition-all duration-500 shadow-2xl flex flex-col"
        >
            <div className="absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-10 rounded-full" style={{ background: theme.accent }} />
            
            <div className={`h-52 shrink-0 bg-gradient-to-br ${theme.gradient} p-8 flex items-center justify-center relative overflow-hidden`}>
                <img src={nft.image} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-1000 drop-shadow-2xl z-10" alt="Asset" />
                <div className="absolute top-4 left-4 z-20 flex gap-2">
                    <div className="bg-black/60 border border-white/10 px-2 py-0.5 rounded-[4px] text-[7px] font-black uppercase tracking-widest" style={{ color: theme.accent }}>
                        {nft.rarity}
                    </div>
                </div>
                <button className="absolute top-4 right-4 z-20 text-white/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                    <Heart size={16} />
                </button>
            </div>

            <div className="p-6 flex flex-col flex-1 justify-between">
                <div className="space-y-4">
                    <h3 className="text-lg font-black italic tracking-tighter uppercase text-white group-hover:text-[#00ff87] transition-all line-clamp-2 leading-tight">
                        {nft.name}
                    </h3>
                    <p className="text-[10px] font-bold text-white/30 italic uppercase line-clamp-2">
                        {nft.description || "Experimental protocol asset for deep-space combat synchronization."}
                    </p>
                </div>

                <div className="pt-6 border-t border-white/[0.03] flex items-center justify-between">
                    <div>
                        <span className="text-[8px] text-white/20 uppercase font-black tracking-widest block mb-0.5 italic">Protocol Valuation</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-2xl font-black italic tracking-tighter text-white">{nft.listPrice ?? nft.price}</span>
                            <Gem size={12} className="text-[#00ff87]" />
                        </div>
                    </div>
                    
                    <button 
                        onClick={onBuy}
                        className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center transition-all duration-300 group-hover:bg-[#00ff87] active:scale-95"
                    >
                        <ShoppingCart size={16} className="text-white group-hover:text-black transition-colors" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
