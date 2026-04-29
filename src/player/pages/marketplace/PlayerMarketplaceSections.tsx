import React, { useEffect, useState } from 'react';
import { Clock, Crown, Diamond, Gem, Heart, ShoppingCart, Sparkles, Star, Tag, X } from 'lucide-react';
import { nftService } from '../../../services/nftService';
import type { NftAvatar, NftRarity } from '../../../services/nftService';

export const RARITY_ICON: Record<NftRarity, React.ReactNode> = {
    COMMON: <Star size={12} />,
    RARE: <Sparkles size={12} />,
    EPIC: <Crown size={12} />,
    LEGENDARY: <Diamond size={12} />,
};

export const RARITY_STYLES: Record<
    NftRarity,
    { badge: string; border: string; bg: string; text: string; gradient: string; glow: string }
> = {
    COMMON: {
        badge: 'bg-zinc-500/15 text-zinc-300 border border-zinc-400/30',
        border: 'border-zinc-500/30',
        bg: 'bg-zinc-500/8',
        text: 'text-zinc-300',
        gradient: 'from-zinc-700/35 via-zinc-600/15 to-black',
        glow: '',
    },
    RARE: {
        badge: 'bg-sky-500/15 text-sky-300 border border-sky-400/30',
        border: 'border-sky-500/35',
        bg: 'bg-sky-500/8',
        text: 'text-sky-300',
        gradient: 'from-sky-600/30 via-blue-500/10 to-black',
        glow: 'shadow-[0_0_0_1px_rgba(14,165,233,0.15)]',
    },
    EPIC: {
        badge: 'bg-violet-500/15 text-violet-300 border border-violet-400/30',
        border: 'border-violet-500/35',
        bg: 'bg-violet-500/8',
        text: 'text-violet-300',
        gradient: 'from-violet-600/30 via-fuchsia-500/10 to-black',
        glow: 'shadow-[0_0_0_1px_rgba(139,92,246,0.2)]',
    },
    LEGENDARY: {
        badge: 'bg-primary/15 text-primary border border-primary/35',
        border: 'border-primary/40',
        bg: 'bg-primary/8',
        text: 'text-primary',
        gradient: 'from-primary/30 via-emerald-500/10 to-black',
        glow: 'shadow-[0_0_0_1px_rgba(0,255,136,0.2)]',
    },
};

export const CATEGORIES = [
    { key: 'ALL', label: 'All', icon: <Gem size={14} /> },
    { key: 'LEGENDARY', label: 'Legendary', icon: <Diamond size={14} /> },
    { key: 'EPIC', label: 'Epic', icon: <Crown size={14} /> },
    { key: 'RARE', label: 'Rare', icon: <Sparkles size={14} /> },
    { key: 'COMMON', label: 'Common', icon: <Star size={14} /> },
];

function useCountdown(target: Date): string {
    const [now, setNow] = useState<number | null>(null);
    useEffect(() => {
        const tick = () => setNow(Date.now());
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);
    if (now == null) return '00h : 00m : 00s';
    const diff = target.getTime() - now;
    if (diff <= 0) return '00h : 00m : 00s';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(h).padStart(2, '0')}h : ${String(m).padStart(2, '0')}m : ${String(s).padStart(2, '0')}s`;
}

export function AuctionCard({ nft, expiresAt, onBuy }: { nft: NftAvatar; expiresAt: Date; onBuy: () => void }) {
    const countdown = useCountdown(expiresAt);
    const rs = RARITY_STYLES[nft.rarity];
    const ownerName = nft.ownerId ? (typeof nft.ownerId === 'string' ? `…${nft.ownerId.slice(-6)}` : nft.ownerId.username) : 'Unknown';

    return (
        <div className={`group relative border rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 ${rs.border} bg-[#111214]`}>
            <div className={`relative aspect-[4/3] bg-gradient-to-br ${rs.gradient} p-6 flex items-center justify-center`}>
                <img
                    src={nft.image}
                    alt={nft.name}
                    className="w-3/4 h-3/4 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${nft.name}`; }}
                />
                <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-text-muted hover:text-red-400 hover:border-red-400/30 transition-all">
                    <Heart size={14} />
                </button>
                <span className={`absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest backdrop-blur-sm ${rs.badge}`}>
                    {RARITY_ICON[nft.rarity]} {nft.rarity}
                </span>
            </div>

            <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-[8px] font-black text-white">
                        {ownerName[0]?.toUpperCase()}
                    </div>
                    <div>
                        <p className="text-white font-black text-sm leading-none">{nft.name}</p>
                        <p className="text-text-muted text-[10px]">@{ownerName}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest">Highest bid</p>
                        <div className="flex items-center gap-1 mt-0.5">
                            <Gem size={12} className="text-primary" />
                            <span className="text-primary font-black text-sm">{nft.listPrice ?? nft.price} AC</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest">Remaining time</p>
                        <div className="flex items-center gap-1 mt-0.5">
                            <Clock size={10} className="text-text-muted" />
                            <span className="text-white text-xs font-bold font-mono">{countdown}</span>
                        </div>
                    </div>
                </div>

                <button onClick={onBuy} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-[11px] font-black uppercase tracking-widest transition-all">
                    <ShoppingCart size={13} /> Place Bid
                </button>
            </div>
        </div>
    );
}

export function NftCard({ nft, isMyNft, onBuy, onUnlist, onList }: {
    nft: NftAvatar; isMyNft: boolean;
    onBuy: () => void; onUnlist: () => void; onList: () => void;
}) {
    const rs = RARITY_STYLES[nft.rarity];
    return (
        <div className={`group relative border rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] ${rs.border} bg-[#111214] ${rs.glow}`}>
            <div className={`relative aspect-square bg-gradient-to-br ${rs.gradient} p-6 flex items-center justify-center`}>
                <img
                    src={nft.image}
                    alt={nft.name}
                    className="w-full h-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${nft.name}`; }}
                />
                <span className={`absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest backdrop-blur-sm ${rs.badge}`}>
                    {RARITY_ICON[nft.rarity]} {nft.rarity}
                </span>
                <button className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-text-muted hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">
                    <Heart size={12} />
                </button>
            </div>
            <div className="p-4 space-y-3">
                <div>
                    <h3 className="text-white font-black text-sm">{nft.name}</h3>
                    <p className="text-text-muted text-[11px] mt-0.5 line-clamp-1">{nft.description}</p>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <Gem size={12} className="text-primary" />
                        <span className="text-primary font-black text-sm">{nft.listPrice ?? nft.price} AC</span>
                    </div>
                    {!isMyNft && nft.ownerId && <span className="text-[10px] font-bold text-text-muted">@{typeof nft.ownerId === 'string' ? `…${nft.ownerId.slice(-6)}` : nft.ownerId.username}</span>}
                    {isMyNft && nft.listed && <span className="text-[9px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Listed</span>}
                </div>
                {!isMyNft ? (
                    <button type="button" onClick={onBuy} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-[11px] font-black uppercase tracking-widest transition-all">
                        <ShoppingCart size={13} /> Buy Now
                    </button>
                ) : (
                    <div className="flex gap-2">
                        {nft.listed ? (
                            <button onClick={onUnlist} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest transition-all">
                                <X size={12} /> Unlist
                            </button>
                        ) : (
                            <button onClick={onList} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest transition-all">
                                <Tag size={12} /> List for Sale
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export function ListForSaleModal({ nft, onClose, onListed }: { nft: NftAvatar; onClose: () => void; onListed: (nft: NftAvatar) => void }) {
    const [listPrice, setListPrice] = useState(Math.round(nft.price * 1.2));
    const [saving, setSaving] = useState(false);
    const rs = RARITY_STYLES[nft.rarity];

    const handleList = async () => {
        if (listPrice <= 0) return;
        try {
            setSaving(true);
            const updated = await nftService.listForSale(nft._id, listPrice);
            onListed(updated);
        } catch (e) {
            console.error('List failed', e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-5 shadow-2xl">
                <div className="flex items-center justify-between">
                    <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-2">
                        <Tag size={18} className="text-blue-400" /> List for Sale
                    </h2>
                    <button onClick={onClose} className="text-text-muted hover:text-white transition-colors"><X size={20} /></button>
                </div>
                <div className={`flex items-center gap-4 p-3 rounded-xl border ${rs.border} ${rs.bg}`}>
                    <img src={nft.image} alt={nft.name} className="w-14 h-14 rounded-xl object-contain bg-black/30 p-2" />
                    <div>
                        <p className="text-white font-black text-sm">{nft.name}</p>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${rs.text}`}>{nft.rarity}</span>
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Listing Price (AC)</label>
                    <input
                        type="number"
                        min={1}
                        value={listPrice}
                        onChange={(e) => setListPrice(+e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                    />
                </div>
                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
                    <div>
                        <span className="text-[8px] text-white/30 uppercase font-black tracking-widest block mb-0.5">Floor reference</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xl font-black text-white">{nft.listPrice ?? nft.price}</span>
                            <Gem size={12} className="text-[#00ff87]" />
                        </div>
                    </div>
                    <button onClick={handleList} disabled={saving || listPrice <= 0} className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-500/90 text-white text-sm font-black uppercase tracking-wider disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                        {saving ? 'Listing…' : <><Tag size={14} /> List</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
