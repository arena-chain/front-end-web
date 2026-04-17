import { Award, Lock, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Achievement {
    id: string;
    title: string;
    description: string;
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
    unlockedAt?: string;
    icon: string;
}

const ACHIEVEMENTS: Achievement[] = [
    { id: '1', title: 'First Blood', description: 'Win your first tournament match', rarity: 'Common', unlockedAt: '2026-03-15', icon: '🏆' },
    { id: '2', title: 'Trading Guru', description: 'Reach $10k in trading profit', rarity: 'Rare', unlockedAt: '2026-04-01', icon: '💰' },
    { id: '3', title: 'Arena Master', description: 'Win a Major Tournament', rarity: 'Legendary', icon: '👑' },
    { id: '4', title: 'Social Butterfly', description: 'Make 10 friends in the arena', rarity: 'Common', unlockedAt: '2026-03-20', icon: '🤝' },
    { id: '5', title: 'XP Farmer', description: 'Reach Level 20', rarity: 'Epic', icon: '⚡' },
    { id: '6', title: 'Market Manipulator', description: 'Place 100 orders in a week', rarity: 'Epic', icon: '📈' },
];

export default function AchievementGallery() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {ACHIEVEMENTS.map((achievement) => (
                <div
                    key={achievement.id}
                    className={cn(
                        "relative group p-6 rounded-[2rem] border transition-all duration-500 overflow-hidden",
                        achievement.unlockedAt
                            ? "bg-[#141419] border-white/10 hover:border-[#00ff88]/40"
                            : "bg-[#0a0a0f] border-white/5 opacity-40 grayscale"
                    )}
                >
                    {/* Background glow for unlocked */}
                    {achievement.unlockedAt && (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#00ff88]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 transition-transform duration-500 group-hover:scale-110",
                            achievement.unlockedAt ? "bg-white/5 shadow-[0_0_20px_rgba(0,0,0,0.5)]" : "bg-white/2"
                        )}>
                            {achievement.icon}
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-xs font-black uppercase tracking-widest text-white italic">
                                {achievement.title}
                            </h3>
                            <p className="text-[10px] text-white/40 font-medium leading-tight px-2">
                                {achievement.description}
                            </p>
                        </div>

                        <div className="mt-4 flex flex-col items-center gap-2">
                            <span className={cn(
                                "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter border",
                                achievement.rarity === 'Legendary' ? "border-yellow-500/30 text-yellow-500 bg-yellow-500/5" :
                                    achievement.rarity === 'Epic' ? "border-purple-500/30 text-purple-500 bg-purple-500/5" :
                                        achievement.rarity === 'Rare' ? "border-blue-500/30 text-blue-500 bg-blue-500/5" :
                                            "border-white/10 text-white/40 bg-white/5"
                            )}>
                                {achievement.rarity}
                            </span>

                            {achievement.unlockedAt ? (
                                <div className="flex items-center gap-1.5 text-[9px] font-black text-[#00ff88] uppercase tracking-widest">
                                    <CheckCircle2 size={10} /> Unlocked
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 text-[9px] font-black text-white/20 uppercase tracking-widest">
                                    <Lock size={10} /> Locked
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
