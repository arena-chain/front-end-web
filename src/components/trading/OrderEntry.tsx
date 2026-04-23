"use client";

import { useState } from 'react';
import { ArrowUpRight, Loader2, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import type { NftAvatar } from '../../services/nftService';
import { nftService } from '../../services/nftService';

export const OrderEntry = ({ asset }: { asset: NftAvatar | null }) => {
    const [loading, setLoading] = useState(false);

    if (!asset) {
        return <div className="h-full flex items-center justify-center text-white/40 text-xs">Select an NFT to trade</div>;
    }

    const price = asset.listPrice ?? asset.price ?? 0;

    const handleBuy = async () => {
        if (!asset || loading) return;
        setLoading(true);
        try {
            await nftService.buy(asset._id);
            toast.success(`Successfully purchased ${asset.name}!`);
        } catch (err: any) {
            console.error('Buy error:', err);
            toast.error(err?.response?.data?.message || 'Failed to purchase NFT');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col p-4 bg-[#16171D]">
            <div className="flex gap-1 p-1 bg-black/20 rounded-xl mb-6">
                <button
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all bg-[#00ff88] text-black shadow-[0_0_20px_rgba(0,255,136,0.3)]"
                >
                    <ArrowUpRight size={14} /> Buy Now
                </button>
            </div>

            <div className="flex gap-4 mb-6">
                <button
                    className="text-[10px] font-black uppercase tracking-[0.2em] pb-1 border-b-2 text-white border-[#00ff88] transition-all"
                >
                    FIXED PRICE
                </button>
            </div>

            <div className="space-y-4 flex-1">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Price (AC)</label>
                    <div className="relative group">
                        <input
                            type="text"
                            value={price.toString()}
                            disabled
                            className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-[#00ff88] cursor-not-allowed font-mono opacity-80"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#00ff88]/50">AC</span>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Amount</label>
                    <div className="relative group">
                        <input
                            type="number"
                            value="1"
                            disabled
                            className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white cursor-not-allowed font-mono opacity-80"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/20">NFT</span>
                    </div>
                </div>

                <div className="py-2">
                    <p className="text-xs text-white/40 italic">You are buying a 1-of-1 unique asset.</p>
                </div>

                <div className="pt-4 border-t border-white/5 mt-auto">
                    <div className="flex justify-between text-[11px] mb-4">
                        <span className="text-white/30 font-bold uppercase tracking-widest">Total Cost</span>
                        <span className="text-white font-black font-mono">{price} AC</span>
                    </div>

                    <button 
                        onClick={handleBuy}
                        disabled={loading}
                        className={cn(
                            "w-full py-4 rounded-xl flex items-center justify-center gap-2 text-sm font-black uppercase tracking-[0.2em] transition-all transform active:scale-[0.98]",
                            loading ? "bg-[#00ff88]/50 text-black/50 cursor-not-allowed" : "bg-[#00ff88] text-black shadow-[0_10px_30px_rgba(0,255,136,0.2)] hover:shadow-[0_15px_40px_rgba(0,255,136,0.3)]"
                        )}
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />}
                        {loading ? 'Processing...' : `Buy ${asset.name}`}
                    </button>
                </div>
            </div>
        </div>
    );
};
