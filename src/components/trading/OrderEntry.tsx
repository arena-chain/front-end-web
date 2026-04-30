"use client";

import { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

export const OrderEntry = ({ assetId }: { assetId: string }) => {
    const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
    const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');
    const [price, setPrice] = useState('15.50');
    const [amount, setAmount] = useState('');

    return (
        <div className="h-full flex flex-col p-4 bg-[#16171D]">
            <div className="flex gap-1 p-1 bg-black/20 rounded-xl mb-6">
                <button
                    onClick={() => setSide('BUY')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                        side === 'BUY' ? "bg-[#00ff88] text-black shadow-[0_0_20px_rgba(0,255,136,0.3)]" : "text-white/40 hover:text-white"
                    )}
                >
                    <ArrowUpRight size={14} /> Buy
                </button>
                <button
                    onClick={() => setSide('SELL')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                        side === 'SELL' ? "bg-[#FF4D4D] text-white shadow-[0_0_20px_rgba(255,77,77,0.3)]" : "text-white/40 hover:text-white"
                    )}
                >
                    <ArrowDownLeft size={14} /> Sell
                </button>
            </div>

            <div className="flex gap-4 mb-6">
                {['LIMIT', 'MARKET'].map(type => (
                    <button
                        key={type}
                        onClick={() => setOrderType(type as any)}
                        className={cn(
                            "text-[10px] font-black uppercase tracking-[0.2em] pb-1 border-b-2 transition-all",
                            orderType === type ? "text-white border-[#00ff88]" : "text-white/20 border-transparent hover:text-white/40"
                        )}
                    >
                        {type}
                    </button>
                ))}
            </div>

            <div className="space-y-4 flex-1">
                {orderType === 'LIMIT' && (
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Price (AC)</label>
                        <div className="relative group">
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#00ff88]/40 transition-all font-mono"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/20">AC</span>
                        </div>
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Amount</label>
                    <div className="relative group">
                        <input
                            type="number"
                            value={amount}
                            placeholder="0.00"
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#00ff88]/40 transition-all font-mono"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/20">{assetId}</span>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-2 py-2">
                    {[25, 50, 75, 100].map(pct => (
                        <button key={pct} className="py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black text-white/40 transition-colors">
                            {pct}%
                        </button>
                    ))}
                </div>

                <div className="pt-4 border-t border-white/5 mt-auto">
                    <div className="flex justify-between text-[11px] mb-4">
                        <span className="text-white/30 font-bold uppercase tracking-widest">Total</span>
                        <span className="text-white font-black font-mono">{(parseFloat(price || '0') * parseFloat(amount || '0')).toFixed(2)} AC</span>
                    </div>

                    <button className={cn(
                        "w-full py-4 rounded-xl text-sm font-black uppercase tracking-[0.2em] transition-all transform active:scale-[0.98]",
                        side === 'BUY'
                            ? "bg-[#00ff88] text-black shadow-[0_10px_30px_rgba(0,255,136,0.2)] hover:shadow-[0_15px_40px_rgba(0,255,136,0.3)]"
                            : "bg-[#FF4D4D] text-white shadow-[0_10px_30px_rgba(255,77,77,0.2)] hover:shadow-[0_15px_40px_rgba(255,77,77,0.3)]"
                    )}>
                        {side} {assetId}
                    </button>
                </div>
            </div>
        </div>
    );
};
