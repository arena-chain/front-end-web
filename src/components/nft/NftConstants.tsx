import React from 'react';
import { Sword, Shield, Zap, Heart, Star, Flame, Sparkles, Diamond, Crown } from 'lucide-react';
import type { NftRarity } from '../../services/nftAdminService';

export const RARITY_COLORS: Record<NftRarity, string> = {
    COMMON: '#9CA3AF',    // gray-400
    UNCOMMON: '#4CAF50',  // green-500
    RARE: '#2196F3',      // blue-500
    EPIC: '#9C27B0',      // purple-500
    LEGENDARY: '#FF9800', // orange-500
    MYTHIC: '#F44336',    // red-500
};

export const RARITY_GRADIENTS: Record<NftRarity, string> = {
    COMMON: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
    UNCOMMON: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
    RARE: 'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)',
    EPIC: 'linear-gradient(135deg, #4c1d95 0%, #2e1065 100%)',
    LEGENDARY: 'linear-gradient(135deg, #78350f 0%, #451a03 100%)',
    MYTHIC: 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)',
};

export const STAT_ICONS: Record<string, React.ReactNode> = {
    Damage: <Sword size={12} />,
    Defense: <Shield size={12} />,
    Speed: <Zap size={12} />,
    Health: <Heart size={12} />,
    'Critical %': <Star size={12} />,
    Power: <Flame size={12} />,
    'Fight Power': <Sword size={12} />,
    Flexibility: <Zap size={12} />,
    'Magic Power': <Sparkles size={12} />,
    'Special Ability': <Diamond size={12} />,
    'Fight Range': <Crown size={12} />,
    Control: <Shield size={12} />,
    Stamina: <Heart size={12} />,
    Endurance: <Shield size={12} />,
};

export const RARITY_STYLES: Record<string, { bg: string; border: string; text: string; glow: string; badge: string; gradient: string }> = {
    COMMON: { bg: 'bg-zinc-500/10', border: 'border-zinc-500/20', text: 'text-zinc-400', glow: '', badge: 'bg-zinc-500/20 text-zinc-400', gradient: 'from-zinc-600/20 to-zinc-800/20' },
    UNCOMMON: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', glow: '', badge: 'bg-emerald-500/20 text-emerald-400', gradient: 'from-emerald-600/20 to-emerald-800/20' },
    RARE: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]', badge: 'bg-blue-500/20 text-blue-400', gradient: 'from-blue-600/20 to-blue-900/20' },
    EPIC: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400', glow: 'shadow-[0_0_20px_rgba(139,92,246,0.2)]', badge: 'bg-violet-500/20 text-violet-400', gradient: 'from-violet-600/20 to-violet-900/20' },
    LEGENDARY: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', glow: 'shadow-[0_0_25px_rgba(245,158,11,0.25)]', badge: 'bg-amber-500/20 text-amber-400', gradient: 'from-amber-500/20 to-orange-900/20' },
    MYTHIC: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', glow: 'shadow-[0_0_30px_rgba(239,68,68,0.3)]', badge: 'bg-red-500/20 text-red-400', gradient: 'from-red-600/20 to-red-900/20' },
};

export const RARITY_ICON: Record<string, React.ReactNode> = {
    COMMON: <Star size={12} />,
    UNCOMMON: <Sparkles size={12} />,
    RARE: <Sparkles size={12} />,
    EPIC: <Crown size={12} />,
    LEGENDARY: <Diamond size={12} />,
    MYTHIC: <Sparkles size={12} className="animate-pulse" />,
};
