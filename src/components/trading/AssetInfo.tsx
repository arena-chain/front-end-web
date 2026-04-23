import { User, Shield, Zap, Trophy } from 'lucide-react';
import type { NftAvatar } from '../../services/nftService';

const RARITY_TEXT: Record<string, string> = {
    COMMON: 'text-gray-400',
    UNCOMMON: 'text-green-400',
    RARE: 'text-blue-400',
    EPIC: 'text-purple-400',
    LEGENDARY: 'text-yellow-400',
    MYTHIC: 'text-red-400',
};

const RARITY_BORDER: Record<string, string> = {
    COMMON: 'border-gray-500/30',
    UNCOMMON: 'border-green-500/40',
    RARE: 'border-blue-500/40',
    EPIC: 'border-purple-500/40',
    LEGENDARY: 'border-yellow-500/40',
    MYTHIC: 'border-red-500/40',
};

export const AssetInfo = ({ asset }: { asset: NftAvatar | null }) => {
    if (!asset) {
        return (
            <div className="flex items-center justify-center h-full text-white/40 text-xs">
                Select an NFT to view details
            </div>
        );
    }

    const textColor = RARITY_TEXT[asset.rarity] || 'text-gray-400';
    const borderColor = RARITY_BORDER[asset.rarity] || 'border-white/10';

    // Try to get attribute values from the NFT object (flexible schema)
    const attrs = (asset as any).attributes ?? [];
    const getAttr = (name: string) => attrs.find((a: any) => (a.trait_type || a.traitType || '').toLowerCase() === name.toLowerCase())?.value;

    return (
        <div className="p-4 space-y-6 overflow-y-auto h-full">
            <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center overflow-hidden bg-black/40 ${borderColor}`}>
                    <img
                        src={asset.image || "https://api.dicebear.com/7.x/bottts/svg"}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div>
                    <h4 className="font-black text-lg text-white">{asset.name}</h4>
                    <p className={`text-xs font-bold uppercase tracking-widest ${textColor}`}>{asset.rarity}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <Trophy size={12} className="text-[#00ff88]" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Power</span>
                    </div>
                    <div className="text-sm font-black text-white">{getAttr('power') || '--'}</div>
                </div>
                <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <Shield size={12} className="text-[#00ff88]" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Defense</span>
                    </div>
                    <div className="text-sm font-black text-white">{getAttr('defense') || '--'}</div>
                </div>
                <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <Zap size={12} className="text-[#00ff88]" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Speed</span>
                    </div>
                    <div className="text-sm font-black text-white">{getAttr('speed') || '--'}</div>
                </div>
                <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <User size={12} className="text-[#00ff88]" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Creator</span>
                    </div>
                    <div className="text-sm font-black text-white truncate">
                        {typeof (asset as any).creatorId === 'object'
                            ? (asset as any).creatorId?.nickname || (asset as any).creatorId?.username || 'Unknown'
                            : (asset as any).creatorId ? `...${(asset as any).creatorId.slice(-4)}` : 'Unknown'}
                    </div>
                </div>
                <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <User size={12} className="text-[#00ff88]" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Owner</span>
                    </div>
                    <div className="text-sm font-black text-white truncate">
                        {typeof (asset as any).ownerId === 'object'
                            ? (asset as any).ownerId?.nickname || (asset as any).ownerId?.username || 'Unknown'
                            : (asset as any).ownerId ? `...${(asset as any).ownerId.slice(-4)}` : 'Unknown'}
                    </div>
                </div>
            </div>

            {attrs.length > 0 && (
                <div className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Attributes</h5>
                    <div className="space-y-2">
                        {attrs.map((stat: any, i: number) => (
                            <div key={i} className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold uppercase">
                                    <span className="text-white/40">{stat.trait_type || stat.traitType}</span>
                                    <span className="text-white">{stat.value}/100</span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88]`} style={{ width: `${Math.min(100, Number(stat.value) || 0)}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
