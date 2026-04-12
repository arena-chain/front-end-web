import { useEffect, useState } from 'react';
import { Sparkles, Trophy, Zap, ChevronRight, Target } from 'lucide-react';
import { LevelService, type LevelProgression } from '../../services/levelService';
import { cn } from '../../lib/utils';

export default function LevelCard() {
    const [progression, setProgression] = useState<LevelProgression | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchLevel = async () => {
        try {
            const data = await LevelService.getMyLevel();
            setProgression(data);
        } catch (error) {
            console.error('Error fetching level:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLevel();
        const interval = setInterval(fetchLevel, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="bg-[#0d0d0d] border border-white/5 rounded-3xl p-6 animate-pulse">
                <div className="flex justify-between mb-6">
                    <div className="h-4 bg-white/5 rounded w-1/3"></div>
                    <div className="h-6 bg-white/5 rounded w-20"></div>
                </div>
                <div className="h-10 bg-white/5 rounded-xl mb-4"></div>
                <div className="h-3 bg-white/5 rounded-full"></div>
            </div>
        );
    }

    if (!progression) return null;

    const remainingXP = progression.xpToNextLevel - progression.currentXP;

    return (
        <div className="relative group overflow-hidden bg-[#0d0d0d] border border-white/5 rounded-3xl p-6 transition-all duration-300 hover:border-primary/20 hover:shadow-[0_0_30px_rgba(0,255,136,0.05)]">
            {/* Background Light Effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10 shadow-[0_0_15px_rgba(0,255,136,0.1)] group-hover:scale-110 transition-transform duration-300">
                            <Sparkles className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Progression Joueur</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black text-white italic">NIVEAU</span>
                                <span className="text-3xl font-black text-primary leading-none tracking-tighter">
                                    {progression.level}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 border border-white/10 rounded-full text-[11px] font-black text-white/90">
                            <Trophy className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/10" />
                            PRO
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5 text-primary italic" />
                                <span className="text-xs font-black text-white/80 uppercase tracking-widest">XP Actuelle</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-black text-white leading-none">
                                    {progression.currentXP.toLocaleString()}
                                </span>
                                <span className="text-sm font-bold text-text-muted/60">
                                    / {progression.xpToNextLevel.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                                {Math.floor(progression.progressPct)}% Terminé
                            </span>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-text-muted/40 italic">
                                <span>-{remainingXP.toLocaleString()} XP avant niv. {progression.level + 1}</span>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Progress Bar */}
                    <div className="relative h-4 w-full bg-black/60 rounded-full p-1 border border-white/5 shadow-inner">
                        <div
                            className="h-full bg-gradient-to-r from-primary via-emerald-400 to-primary/80 rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(0,255,136,0.3)] relative overflow-hidden"
                            style={{ width: `${progression.progressPct}%` }}
                        >
                            {/* Animated Inner Shine */}
                            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:200%_100%] animate-[shimmer_2s_infinite]" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 flex flex-col gap-1 group/stat hover:bg-white/[0.04] transition-colors">
                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest leading-none">Total Cumulé</span>
                            <div className="flex items-center gap-2">
                                <Target className="w-3 h-3 text-text-muted/50" />
                                <span className="text-sm font-black text-white/90">{progression.totalXP.toLocaleString()} XP</span>
                            </div>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 flex flex-col gap-1 group/stat hover:bg-white/[0.04] transition-colors">
                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest leading-none">Status Récit</span>
                            <div className="flex items-center gap-2">
                                <ChevronRight className="w-3 h-3 text-primary" />
                                <span className="text-sm font-black text-white/90">Actif 🔥</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
