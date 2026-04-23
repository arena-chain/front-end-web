import { useState, useEffect } from 'react';
import {
    Zap, Trophy, Target,
    Gift, ArrowRight, CheckCircle2,
    Flame, Award, ChevronRight
} from 'lucide-react';
import rewardsService, { type Mission, type PlayerLevel } from '../../services/rewardsService';
import { cn } from '../../lib/utils';
import AchievementGallery from '../components/rewards/AchievementGallery';

export default function PlayerRewards() {
    const [levelData, setLevelData] = useState<PlayerLevel | null>(null);
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // In a real app, userId would come from auth context
                const userId = localStorage.getItem('userId') || 'current-user';
                const [lvl, missionsRes] = await Promise.all([
                    rewardsService.getPlayerLevel(userId),
                    rewardsService.getActiveMissions()
                ]);
                setLevelData(lvl);
                setMissions(missionsRes.missions);
            } catch (error) {
                console.error('Failed to fetch rewards data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const progress = levelData ? (levelData.currentXP / levelData.xpToNextLevel) * 100 : 0;

    return (
        <div className="flex flex-col gap-6 h-full overflow-y-auto animate-fade-in-up pb-8">

            {/* ── Level Header ─────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-3xl p-8 border border-white/10"
                style={{ background: 'linear-gradient(135deg, #050505 0%, #1a1a00 60%, #050505 100%)' }}>
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, #ffd700 1px, transparent 0)',
                    backgroundSize: '32px 32px'
                }} />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    {/* Big Level Hexagon */}
                    <div className="relative shrink-0">
                        <div className="w-24 h-24 flex items-center justify-center bg-[#ffd700] rounded-[20%] rotate-45 shadow-[0_0_40px_rgba(255,215,0,0.3)]">
                            <span className="text-4xl font-black text-black -rotate-45 italic">{levelData?.level || 1}</span>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-black border border-[#ffd700]/30 rounded-full">
                            <span className="text-[10px] font-black text-[#ffd700] uppercase tracking-tighter">Level</span>
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                            <SparkleIcon color="#ffd700" />
                            <span className="text-[10px] font-black text-[#ffd700] uppercase tracking-[0.2em]">Season Progression</span>
                        </div>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-4 italic">
                            Elite <span className="text-[#ffd700]">Prestige</span>
                        </h1>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-white/40">
                                <span>{levelData?.currentXP || 0} XP</span>
                                <span>{levelData?.xpToNextLevel || 1000} XP to Level {(levelData?.level || 1) + 1}</span>
                            </div>
                            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                                <div className="h-full bg-gradient-to-r from-[#ffd700]/40 to-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.4)] transition-all duration-1000"
                                    style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <StatCard icon={<Flame size={18} />} label="Streak" value="12 Days" color="#f97316" />
                        <StatCard icon={<Trophy size={18} />} label="Total XP" value={(levelData?.totalXP || 0).toLocaleString()} color="#ffd700" />
                    </div>
                </div>
            </div>

            {/* ── Missions & Rewards Grid ───────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

                {/* Active Missions */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <Target className="text-[#ffd700]" size={20} />
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Active Missions</h2>
                        </div>
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Refreshes in 14h</span>
                    </div>

                    <div className="grid gap-3">
                        {loading ? (
                            [1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />)
                        ) : missions.map(mission => (
                            <MissionCard key={mission._id} mission={mission} onClaim={() => rewardsService.claimMissionReward(mission._id)} />
                        ))}
                    </div>
                </div>

                {/* Milestones & Collection */}
                <div className="space-y-6">
                    <div className="rounded-3xl border border-white/10 bg-[#0d0d0d] p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Award className="text-[#ffd700]" size={20} />
                            <h2 className="text-lg font-black text-white uppercase tracking-tighter italic">Milestones</h2>
                        </div>

                        <div className="space-y-4">
                            <MilestoneItem level={5} reward="Exclusive Avatar Border" completed />
                            <MilestoneItem level={10} reward="500 Trading Credits" progress={80} />
                            <MilestoneItem level={15} reward="Rare NFT Chest" progress={30} />
                            <MilestoneItem level={20} reward="Elite Badge" progress={0} />
                        </div>

                        <button className="w-full mt-8 py-3 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] text-white/40 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all">
                            View All Rewards
                        </button>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-[#0d0d0d] p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Gift size={80} />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2 italic">Referral Program</h3>
                        <p className="text-xs text-white/40 mb-4 leading-relaxed">Invite your friends and earn 500 XP for every recruit who reaches level 5.</p>
                        <button className="flex items-center gap-2 text-[10px] font-black text-[#ffd700] uppercase tracking-widest hover:gap-3 transition-all">
                            Get Invite Link <ArrowRight size={12} />
                        </button>
                    </div>
                </div>

            </div>

            {/* ── Achievements Section ────────────────────────────────── */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                    <Award className="text-[#ffd700]" size={24} />
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Achievement <span className="text-[#ffd700]">Gallery</span></h2>
                </div>
                <AchievementGallery />
            </section>
        </div>
    );
}

function SparkleIcon({ color }: { color: string }) {
    return (
        <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
            <div className="w-1.5 h-1.5 rounded-full animate-pulse delay-75" style={{ background: color, opacity: 0.6 }} />
            <div className="w-1.5 h-1.5 rounded-full animate-pulse delay-150" style={{ background: color, opacity: 0.3 }} />
        </div>
    );
}

function StatCard({ icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
    return (
        <div className="flex flex-col items-center justify-center px-5 py-3 rounded-2xl bg-white/5 border border-white/10 min-w-[100px]">
            <span className="mb-1" style={{ color }}>{icon}</span>
            <span className="text-[11px] font-black text-white -mb-0.5">{value}</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-white/20 whitespace-nowrap">{label}</span>
        </div>
    );
}

function MissionCard({ mission, onClaim }: { mission: Mission, onClaim: () => void }) {
    const isCompleted = (mission.userProgress?.current || 0) >= (mission.criteria?.target || 1);
    const [claiming, setClaiming] = useState(false);

    const handleClaim = async () => {
        if (!isCompleted || mission.userProgress?.claimed) return;
        setClaiming(true);
        try {
            await onClaim();
        } catch (e) {
            console.error(e);
        } finally {
            setClaiming(false);
        }
    };

    return (
        <div className={cn(
            "relative overflow-hidden p-5 rounded-2xl border transition-all duration-300",
            mission.userProgress?.claimed ? "bg-white/[0.02] border-white/5 opacity-50" : "bg-[#0d0d0d] border-white/10 hover:border-white/20"
        )}>
            <div className="flex items-center justify-between gap-4">
                <div className="flex gap-4 flex-1">
                    <div className={cn(
                        "w-12 h-12 rounded-xl border flex items-center justify-center shrink-0",
                        isCompleted ? "bg-[#ffd700]/10 border-[#ffd700]/30" : "bg-white/5 border-white/10"
                    )}>
                        <Target size={20} className={isCompleted ? "text-[#ffd700]" : "text-white/20"} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-black text-white italic uppercase">{mission.title}</h3>
                            {mission.userProgress?.claimed && <CheckCircle2 size={12} className="text-[#ffd700]" />}
                        </div>
                        <p className="text-xs text-white/40 font-medium mb-3">{mission.description}</p>

                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className={cn(
                                    "h-full transition-all duration-500",
                                    isCompleted ? "bg-[#ffd700]" : "bg-white/20"
                                )} style={{ width: `${Math.min(100, ((mission.userProgress?.current || 0) / (mission.criteria?.target || 1)) * 100)}%` }} />
                            </div>
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                                {mission.userProgress?.current || 0} / {mission.criteria?.target || 0}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-3 min-w-[100px]">
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5 text-[#ffd700]">
                            <Zap size={10} className="fill-[#ffd700]" />
                            <span className="text-xs font-black">+{mission.rewardAmount} XP</span>
                        </div>
                    </div>

                    {mission.userProgress?.claimed ? (
                        <div className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black text-white/20 uppercase tracking-widest">
                            Claimed
                        </div>
                    ) : (
                        <button
                            onClick={handleClaim}
                            disabled={!isCompleted || claiming}
                            className={cn(
                                "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                isCompleted
                                    ? "bg-[#ffd700] text-black shadow-[0_4px_15px_rgba(255,215,0,0.3)] hover:scale-105 active:scale-95"
                                    : "bg-white/5 text-white/20 border border-white/10 cursor-not-allowed"
                            )}
                        >
                            {claiming ? "Processing..." : isCompleted ? "Claim XP" : "In Progress"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function MilestoneItem({ level, reward, completed, progress = 0 }: { level: number, reward: string, completed?: boolean, progress?: number }) {
    return (
        <div className="group relative">
            <div className="flex items-center gap-4 mb-2">
                <div className={cn(
                    "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors",
                    completed ? "bg-[#ffd700] border-[#ffd700] text-black" : "bg-black border-white/10 text-white/20"
                )}>
                    <span className="text-sm font-black">Lv.{level}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-black truncate", completed ? "text-white" : "text-white/40")}>{reward}</p>
                    {completed && <span className="text-[9px] font-black text-[#ffd700] uppercase tracking-widest">Unlocked</span>}
                </div>
                {completed ? (
                    <CheckCircle2 size={16} className="text-[#ffd700]" />
                ) : (
                    <ChevronRight size={14} className="text-white/10 group-hover:text-white/30 transition-colors" />
                )}
            </div>
            {!completed && progress > 0 && (
                <div className="pl-14 pr-2">
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-white/20" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}
        </div>
    );
}
