import { useState, useEffect } from 'react';
import { User, Trophy, PlayCircle, BarChart3, Loader2 } from 'lucide-react';
import tradingService, { type TradingAsset } from '../../services/tradingService';

export const AssetInfo = ({ assetId }: { assetId: string }) => {
    const [asset, setAsset] = useState<TradingAsset | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!assetId) return;
            setLoading(true);
            try {
                const data = await tradingService.getAssetDetails(assetId);
                setAsset(data.asset);
            } catch (err) {
                console.error('Failed to fetch asset details:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [assetId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-[#00ff88]" />
            </div>
        );
    }

    if (!asset) return null;

    return (
        <div className="p-4 space-y-6">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center overflow-hidden">
                    <img
                        src={asset.imageUrl || "https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_1280.png"}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div>
                    <h4 className="font-black text-lg text-white">{asset.symbol}</h4>
                    <p className="text-xs text-[#00ff88] font-bold uppercase tracking-widest">{asset.name}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <Trophy size={12} className="text-[#00ff88]" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Win Rate</span>
                    </div>
                    <div className="text-sm font-black text-white">{asset.stats?.winRate || '--'}%</div>
                </div>
                <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <PlayCircle size={12} className="text-[#00ff88]" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Matches</span>
                    </div>
                    <div className="text-sm font-black text-white">{asset.stats?.matchesPlayed?.toLocaleString() || '--'}</div>
                </div>
                <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <BarChart3 size={12} className="text-[#00ff88]" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Ranking</span>
                    </div>
                    <div className="text-sm font-black text-white">#{asset.stats?.ranking || '--'}</div>
                </div>
                <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <User size={12} className="text-[#00ff88]" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Type</span>
                    </div>
                    <div className="text-sm font-black text-white">{asset.type.replace('_', ' ')}</div>
                </div>
            </div>

            <div className="space-y-3">
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Performance Index</h5>
                <div className="space-y-2">
                    {[
                        { label: 'Aim', value: 95 },
                        { label: 'Game Sense', value: 88 },
                        { label: 'Clutch Power', value: 72 },
                    ].map(stat => (
                        <div key={stat.label} className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold uppercase">
                                <span className="text-white/40">{stat.label}</span>
                                <span className="text-white">{stat.value}%</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-[#00ff88] rounded-full shadow-[0_0_8px_#00ff88]" style={{ width: `${stat.value}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
