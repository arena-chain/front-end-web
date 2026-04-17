"use client";

import { useState, useEffect } from 'react';
import { TradingChart } from './TradingChart';
import { OrderBook } from './OrderBook';
import { TradeHistory } from './TradeHistory';
import { OrderEntry } from './OrderEntry';
import { AssetInfo } from './AssetInfo';
import { Search, Bell, User as UserIcon, Wallet } from 'lucide-react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

import tradingService, { type TradingAsset } from '../../services/tradingService';

export const TradingTerminal = () => {
    const [assets, setAssets] = useState<TradingAsset[]>([]);
    const [selectedAssetId, setSelectedAssetId] = useState<string>('');
    const [selectedAsset, setSelectedAsset] = useState<TradingAsset | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const data = await tradingService.getAssets();
                setAssets(data);
                if (data.length > 0) {
                    setSelectedAssetId(data[0]._id);
                    setSelectedAsset(data[0]);
                }
            } catch (err) {
                console.error('Failed to fetch trading assets:', err);
            }
        };
        fetchAssets();
    }, []);

    useEffect(() => {
        if (!selectedAssetId) return;
        const asset = assets.find(a => a._id === selectedAssetId);
        if (asset) setSelectedAsset(asset);
    }, [selectedAssetId, assets]);

    useEffect(() => {
        const newSocket = io('http://localhost:3000/trading');
        setSocket(newSocket);

        newSocket.on('priceUpdate', (data) => {
            if (data.assetId === selectedAssetId) {
                // Update selected asset price locally if needed, 
                // but usually the sub-components handle this.
            }
        });

        return () => {
            newSocket.disconnect();
        };
    }, [selectedAssetId]);

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] bg-[#0D0E12] text-white overflow-hidden rounded-2xl border border-white/5">
            {/* Top Navbar */}
            <header className="h-14 border-b border-white/5 bg-[#16171D] px-4 flex items-center justify-between z-50">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#00ff88] rounded flex items-center justify-center font-black italic text-black">A</div>
                        <span className="font-black uppercase tracking-tighter text-xl">Arena <span className="text-[#00ff88] italic">Trading</span></span>
                    </div>

                    <div className="h-8 w-px bg-white/10 mx-2" />

                    <div className="flex items-center gap-4">
                        <select
                            value={selectedAssetId}
                            onChange={(e) => setSelectedAssetId(e.target.value)}
                            className="bg-transparent border-none text-white font-bold outline-none cursor-pointer"
                        >
                            {assets.map(a => (
                                <option key={a._id} value={a._id} className="bg-[#16171D]">{a.symbol}/AC</option>
                            ))}
                        </select>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold">{selectedAsset?.symbol}/AC</span>
                            <span className="text-xs text-[#00ff88]">{selectedAsset?.name}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-[#00ff88]">{selectedAsset?.lastPrice.toFixed(2)}</span>
                            <span className="text-xs text-white/40">${selectedAsset?.lastPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-white/40 uppercase">24h Change</span>
                                <span className={`text-xs font-bold ${(selectedAsset?.priceChange24h ?? 0) >= 0 ? 'text-[#00ff88]' : 'text-[#ff4444]'}`}>
                                    {(selectedAsset?.priceChange24h ?? 0) >= 0 ? '+' : ''}{selectedAsset?.priceChange24h}%
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-white/40 uppercase">24h High</span>
                                <span className="text-xs font-bold">{(selectedAsset?.lastPrice ?? 0) * 1.05}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-white/40 uppercase">24h Low</span>
                                <span className="text-xs font-bold">{(selectedAsset?.lastPrice ?? 0) * 0.95}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-white/40 uppercase">24h Volume</span>
                                <span className="text-xs font-bold">{selectedAsset?.volume24h.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                        <Search size={20} />
                    </button>
                    <button className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                        <Bell size={20} />
                    </button>
                    <div className="h-8 w-px bg-white/10 mx-2" />
                    <div className="flex items-center gap-2 bg-[#00ff88]/10 border border-[#00ff88]/20 px-3 py-1.5 rounded-lg">
                        <Wallet size={16} className="text-[#00ff88]" />
                        <span className="text-sm font-bold">12,450.00 AC</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                        <UserIcon size={18} className="text-white/40" />
                    </div>
                </div>
            </header>

            {/* Main Terminal Grid */}
            <main className="flex-1 grid grid-cols-[1fr,300px,300px] grid-rows-[1fr,250px] overflow-hidden p-0.5 gap-0.5 bg-black/40">

                {/* Chart Section */}
                <section className="col-span-1 row-span-1 bg-[#16171D] border border-white/5 rounded overflow-hidden flex flex-col">
                    <div className="flex-1">
                        <TradingChart assetId={selectedAssetId} />
                    </div>
                </section>

                {/* Order Book */}
                <section className="col-span-1 row-span-2 bg-[#16171D] border border-white/5 rounded flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">Order Book</h3>
                    </div>
                    <div className="flex-1">
                        <OrderBook assetId={selectedAssetId} socket={socket} />
                    </div>
                </section>

                {/* Trade History */}
                <section className="col-span-1 row-span-1 bg-[#16171D] border border-white/5 rounded flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-white/5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">Market Trades</h3>
                    </div>
                    <div className="flex-1">
                        <TradeHistory assetId={selectedAssetId} socket={socket} />
                    </div>
                </section>

                {/* Assets & Info */}
                <section className="col-start-3 row-start-2 bg-[#16171D] border border-white/5 rounded overflow-hidden flex flex-col">
                    <div className="p-3 border-b border-white/5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">Asset Info</h3>
                    </div>
                    <div className="flex-1">
                        <AssetInfo assetId={selectedAssetId} />
                    </div>
                </section>

                {/* Order Entry */}
                <section className="col-start-1 row-start-2 bg-[#16171D] border border-white/5 rounded overflow-hidden">
                    <div className="h-full">
                        <OrderEntry assetId={selectedAssetId} />
                    </div>
                </section>

            </main>

            {/* Bottom Status Bar */}
            <footer className="h-8 border-t border-white/5 bg-[#16171D] px-4 flex items-center justify-between text-[10px] text-white/40 font-medium tracking-wide italic">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 uppercase tracking-wider font-bold">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
                        <span>API Connection: Operational</span>
                    </div>
                    <div className="flex items-center gap-1.5 uppercase tracking-wider font-bold">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
                        <span>Market Data: Live</span>
                    </div>
                </div>
                <div className="flex items-center gap-4 uppercase tracking-wider font-bold">
                    <span>Server Time: {new Date().toLocaleTimeString()}</span>
                    <span>Version: 1.0.4-PRO</span>
                </div>
            </footer>
        </div>
    );
};
