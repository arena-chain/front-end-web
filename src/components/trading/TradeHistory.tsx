"use client";

import { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';

interface TradeHistoryProps {
    assetId: string;
    socket: Socket | null;
}

export const TradeHistory = ({ assetId, socket }: TradeHistoryProps) => {
    const [trades, setTrades] = useState<any[]>([]);

    useEffect(() => {
        if (!socket) return;

        socket.on('newTrade', (trade) => {
            if (trade.assetId === assetId) {
                setTrades(prev => [trade, ...prev].slice(0, 30));
            }
        });

        return () => {
            socket.off('newTrade');
        };
    }, [assetId, socket]);

    // Mock initial trades
    useEffect(() => {
        if (!socket) {
            setTrades(Array.from({ length: 20 }, (_, i) => ({
                price: 15.5 + (Math.random() - 0.5),
                amount: Math.random() * 50,
                side: Math.random() > 0.5 ? 'BUY' : 'SELL',
                timestamp: new Date(Date.now() - i * 60000).toLocaleTimeString()
            })));
        }
    }, [socket]);

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
