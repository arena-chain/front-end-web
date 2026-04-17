"use client";

import { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';

interface OrderBookProps {
    assetId: string;
    socket: Socket | null;
}

export const OrderBook = ({ assetId, socket }: OrderBookProps) => {
    const [bids, setBids] = useState<any[]>([]);
    const [asks, setAsks] = useState<any[]>([]);

    useEffect(() => {
        if (!socket) return;

        socket.emit('subscribeAsset', assetId);

        socket.on('orderBookUpdate', (data) => {
            if (data.assetId === assetId) {
                setBids(data.bids.slice(0, 15));
                setAsks(data.asks.slice(0, 15).reverse());
            }
        });

        return () => {
            socket.off('orderBookUpdate');
        };
    }, [assetId, socket]);

    // Mock data if no socket
    useEffect(() => {
        if (!socket) {
            setAsks(Array.from({ length: 10 }, (_, i) => ({ price: 15.6 + (i * 0.1), amount: Math.random() * 100, total: 0 })));
            setBids(Array.from({ length: 10 }, (_, i) => ({ price: 15.4 - (i * 0.1), amount: Math.random() * 100, total: 0 })));
        }
    }, [socket]);

    return (
        <div className="flex flex-col h-full text-[11px] font-medium font-mono">
            <div className="grid grid-cols-3 px-3 py-1.5 text-white/30 uppercase text-[10px] font-bold border-b border-white/5">
                <span>Price</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Total</span>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Asks (Sells) */}
                <div className="flex flex-col-reverse justify-end">
                    {asks.map((ask, i) => (
                        <div key={i} className="grid grid-cols-3 px-3 py-0.5 hover:bg-white/5 relative group">
                            <div className="absolute inset-y-0 right-0 bg-[#FF4D4D]/5 transition-all duration-300" style={{ width: `${(ask.amount / 100) * 100}%` }} />
                            <span className="text-[#FF4D4D] z-10">{ask.price.toFixed(2)}</span>
                            <span className="text-right text-white/60 z-10">{ask.amount.toFixed(2)}</span>
                            <span className="text-right text-white/40 z-10">{(ask.price * ask.amount).toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                {/* Current Spread */}
                <div className="px-3 py-2 border-y border-white/5 bg-white/5 flex items-center justify-between">
                    <span className="text-sm font-bold text-[#00ff88]">15.50</span>
                    <span className="text-white/40 text-[10px]">$15.50</span>
                </div>

                {/* Bids (Buys) */}
                <div className="flex flex-col">
                    {bids.map((bid, i) => (
                        <div key={i} className="grid grid-cols-3 px-3 py-0.5 hover:bg-white/5 relative">
                            <div className="absolute inset-y-0 right-0 bg-[#00FF88]/5 transition-all duration-300" style={{ width: `${(bid.amount / 100) * 100}%` }} />
                            <span className="text-[#00FF88] z-10">{bid.price.toFixed(2)}</span>
                            <span className="text-right text-white/60 z-10">{bid.amount.toFixed(2)}</span>
                            <span className="text-right text-white/40 z-10">{(bid.price * bid.amount).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
