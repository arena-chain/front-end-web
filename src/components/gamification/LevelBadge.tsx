import React from 'react';
import { Zap } from 'lucide-react';
import { getTierForLevel, computeXpToNextLevel } from '../../lib/levelingRules';

interface LevelBadgeProps {
    level: number;
    currentXP: number;
    showProgress?: boolean;
    size?: 'sm' | 'md' | 'lg';
    multiplier?: number;
}

const LevelBadge: React.FC<LevelBadgeProps> = ({
    level,
    currentXP,
    showProgress = true,
    size = 'md',
    multiplier = 1.0
}) => {
    const tier = getTierForLevel(level);
    const xpToNext = computeXpToNextLevel(level);
    const progress = (currentXP / xpToNext) * 100;

    const sizeClasses = {
        sm: { container: 'gap-2', badge: 'w-8 h-8 text-[10px]', text: 'text-[10px]', icon: 10 },
        md: { container: 'gap-3', badge: 'w-12 h-12 text-sm', text: 'text-xs', icon: 14 },
        lg: { container: 'gap-4', badge: 'w-20 h-20 text-xl', text: 'text-sm', icon: 20 },
    };

    const currentSize = sizeClasses[size];

    return (
        <div className={`flex flex-col ${currentSize.container}`}>
            <div className="flex items-center gap-3">
                {/* Level Circle */}
                <div
                    className={`relative rounded-xl flex items-center justify-center font-black transition-all duration-500 shadow-lg ${currentSize.badge} ${tier.animated ? 'animate-pulse' : ''}`}
                    style={{
                        background: tier.bg,
                        color: level >= 41 ? '#000' : '#fff',
                        boxShadow: `0 0 20px ${tier.glow}`
                    }}
                >
                    {level}

                    {/* Decorative Border */}
                    <div className="absolute inset-[2px] border border-white/20 rounded-[10px] pointer-events-none" />
                </div>

                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="font-black uppercase tracking-tighter text-white leading-none" style={{ color: tier.color }}>
                            {tier.label}
                        </span>
                        {multiplier > 1 && (
                            <span className="px-1.5 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[8px] font-black flex items-center gap-0.5">
                                <Zap size={8} /> {multiplier}x
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">
                        Rank {level}
                    </span>
                </div>
            </div>

            {showProgress && (
                <div className="space-y-1.5">
                    <div className="flex justify-between items-end">
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Progression</span>
                        <span className="text-[10px] font-black text-white">
                            {currentXP} <span className="text-white/20">/ {xpToNext} XP</span>
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <div
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{
                                width: `${progress}%`,
                                background: tier.bg,
                                boxShadow: `0 0 10px ${tier.glow}`
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default LevelBadge;
