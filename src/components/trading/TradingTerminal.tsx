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

import { nftService, type NftAvatar } from '../../services/nftService';

export const TradingTerminal = () => {
    const [assets, setAssets] = useState<NftAvatar[]>([]);
    const [selectedAssetId, setSelectedAssetId] = useState<string>('');
    const [selectedAsset, setSelectedAsset] = useState<NftAvatar | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const data = await nftService.getMarketplace();
                // Only show listed NFTs in the trading terminal
                const listed = Array.isArray(data) ? data.filter(n => n.listed) : [];
                setAssets(listed);
                if (listed.length > 0) {
                    setSelectedAssetId(listed[0]._id);
                    setSelectedAsset(listed[0]);
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
        <div className="flex flex-col min-h-[calc(100vh-120px)] bg-[#0D0E12] text-white rounded-2xl border border-white/5 overflow-y-auto">
            {/* Top Navbar */}
            <header className="h-16 shrink-0 border-b border-white/5 bg-[#16171D] px-4 flex items-center justify-between z-50 sticky top-0">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#00ff88] rounded flex items-center justify-center font-black italic text-black">A</div>
                        <span className="font-black uppercase tracking-tighter text-xl">Arena <span className="text-[#00ff88] italic">Trading</span></span>
                    </div>

                    <div className="h-8 w-px bg-white/10 mx-2" />

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 bg-[#0D0E12] border border-white/10 px-3 py-1.5 rounded-lg hover:border-[#00ff88]/50 transition-all min-w-[200px]"
                            >
                                {selectedAsset ? (
                                    <>
                                        <div className="w-6 h-6 rounded bg-black/50 overflow-hidden shrink-0">
                                            <img src={selectedAsset.image} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex flex-col items-start flex-1 min-w-0">
                                            <span className="font-bold text-sm truncate w-full text-left">{selectedAsset.name}</span>
                                            <span className="text-[9px] text-[#00ff88] uppercase tracking-widest">{selectedAsset.rarity}</span>
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-white/40 text-sm py-1">Select NFT...</span>
                                )}
                            </button>

                            {isDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                                    <div className="absolute top-full mt-2 left-0 w-[300px] max-h-[400px] overflow-y-auto bg-[#16171D] border border-white/10 rounded-xl shadow-2xl z-50 p-2 flex flex-col gap-1 custom-scrollbar">
                                        {assets.length === 0 ? (
                                            <div className="p-4 text-center text-white/40 text-xs">No NFTs listed on marketplace</div>
                                        ) : assets.map(a => (
                                            <button
                                                key={a._id}
                                                onClick={() => {
                                                    setSelectedAssetId(a._id);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`flex items-center gap-3 p-2 rounded-lg transition-all ${selectedAssetId === a._id ? 'bg-[#00ff88]/10 border border-[#00ff88]/30' : 'hover:bg-white/5 border border-transparent'}`}
                                            >
                                                <div className="w-10 h-10 rounded bg-black/50 overflow-hidden shrink-0">
                                                    <img src={a.image} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex flex-col items-start min-w-0 flex-1">
                                                    <span className="font-bold text-sm text-white truncate w-full text-left">{a.name}</span>
                                                    <span className="text-[10px] text-[#00ff88] uppercase tracking-widest">{a.rarity}</span>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="text-sm font-black text-white">{a.listPrice ?? a.price ?? 0} AC</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="hidden lg:flex items-center gap-4">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-[#00ff88]">{selectedAsset?.listPrice ?? selectedAsset?.price ?? 0} AC</span>
                                <span className="text-xs text-white/40">~${((selectedAsset?.listPrice ?? selectedAsset?.price ?? 0) * 0.05).toFixed(2)}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-white/40 uppercase">24h Change</span>
                                <span className="text-xs font-bold text-[#00ff88]">+{((selectedAsset?.listPrice ?? 0) * 0.03).toFixed(2)}%</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-white/40 uppercase">24h High</span>
                                <span className="text-xs font-bold">{((selectedAsset?.listPrice ?? selectedAsset?.price ?? 0) * 1.05).toFixed(0)}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-white/40 uppercase">24h Low</span>
                                <span className="text-xs font-bold">{((selectedAsset?.listPrice ?? selectedAsset?.price ?? 0) * 0.95).toFixed(0)}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-white/40 uppercase">Type</span>
                                <span className="text-xs font-bold text-white">Avatar NFT</span>
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
            <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr,300px,300px] grid-rows-[auto,auto,auto] lg:grid-rows-[minmax(400px,1fr),250px] p-0.5 gap-0.5 bg-black/40 min-h-[700px]">

                {/* Chart Section */}
                <section className="col-span-1 lg:col-span-1 row-span-1 bg-[#16171D] border border-white/5 rounded overflow-hidden flex flex-col min-h-[300px]">
                    <div className="flex-1">
                        <TradingChart asset={selectedAsset} />
                    </div>
                </section>

                {/* Order Book */}
                <section className="col-span-1 lg:col-span-1 row-span-1 lg:row-span-2 bg-[#16171D] border border-white/5 rounded flex flex-col overflow-hidden min-h-[300px]">
                    <div className="p-3 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">Order Book</h3>
                    </div>
                    <div className="flex-1">
                        <OrderBook asset={selectedAsset} socket={socket} />
                    </div>
                </section>

                {/* Trade History */}
                <section className="col-span-1 lg:col-span-1 row-span-1 bg-[#16171D] border border-white/5 rounded flex flex-col overflow-hidden min-h-[250px]">
                    <div className="p-3 border-b border-white/5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">Market Trades</h3>
                    </div>
                    <div className="flex-1">
                        <TradeHistory asset={selectedAsset} socket={socket} />
                    </div>
                </section>

                {/* Assets & Info */}
                <section className="col-span-1 lg:col-start-3 lg:row-start-2 bg-[#16171D] border border-white/5 rounded overflow-hidden flex flex-col min-h-[250px]">
                    <div className="p-3 border-b border-white/5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">Asset Info</h3>
                    </div>
                    <div className="flex-1">
                        <AssetInfo asset={selectedAsset} />
                    </div>
                </section>

                {/* Order Entry */}
                <section className="col-span-1 lg:col-start-1 lg:row-start-2 bg-[#16171D] border border-white/5 rounded overflow-hidden min-h-[250px]">
                    <div className="h-full">
                        <OrderEntry asset={selectedAsset} />
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
