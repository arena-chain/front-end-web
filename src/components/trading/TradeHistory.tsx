"use client";

import { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';

import type { NftAvatar } from '../../services/nftService';

interface TradeHistoryProps {
    asset: NftAvatar | null;
    socket: Socket | null;
}

export const TradeHistory = ({ asset, socket }: TradeHistoryProps) => {
    const [trades, setTrades] = useState<any[]>([]);

    useEffect(() => {
        if (!socket || !asset?._id) return;

        socket.on('newTrade', (trade) => {
            if (trade.assetId === asset._id) {
                setTrades(prev => [trade, ...prev].slice(0, 30));
            }
        });

        return () => {
            socket.off('newTrade');
        };
    }, [asset?._id, socket]);

    // Mock initial trades based on NFT price
    useEffect(() => {
        const basePrice = asset?.listPrice ?? asset?.price ?? 15;
        
        setTrades(Array.from({ length: 20 }, (_, i) => ({
            price: basePrice + (Math.random() - 0.5) * (basePrice * 0.05),
            amount: 1, // NFTs are 1-of-1
            side: Math.random() > 0.5 ? 'BUY' : 'SELL',
            timestamp: new Date(Date.now() - i * 60000).toLocaleTimeString()
        })));
    }, [asset]);

    return (
        <div className="flex flex-col h-full text-[11px] font-medium font-mono">
            <div className="grid grid-cols-3 px-3 py-1.5 text-white/30 uppercase text-[10px] font-bold border-b border-white/5">
                <span>Price</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Time</span>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {trades.map((trade, i) => (
                    <div key={i} className="grid grid-cols-3 px-3 py-1 hover:bg-white/5 transition-colors">
                        <span className={trade.side === 'BUY' ? 'text-[#00FF88]' : 'text-[#FF4D4D]'}>
                            {trade.price.toFixed(2)}
                        </span>
                        <span className="text-right text-white/80">{trade.amount.toFixed(2)}</span>
                        <span className="text-right text-white/40">{trade.timestamp}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
