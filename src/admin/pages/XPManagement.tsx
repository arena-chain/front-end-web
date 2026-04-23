import React, { useState, useEffect } from 'react';
import {
    Zap, Search, ChevronRight, Filter,
    TrendingUp, ShieldCheck
} from 'lucide-react';
import { Button, Input } from '../../components/ui/core';
import { UserService } from '../../services/userService';
import type { User } from '../../services/userService';
import xpService from '../../services/xp.service';
import type { PlayerLevel } from '../../services/xp.service';
import LevelBadge from '../../components/gamification/LevelBadge';

const XPManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [playerLevels, setPlayerLevels] = useState<Record<string, PlayerLevel>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [globalMultiplier, setGlobalMultiplier] = useState(1.0);
    const [showGrantModal, setShowGrantModal] = useState<{ isOpen: boolean; userId: string; nickname: string }>({
        isOpen: false,
        userId: '',
        nickname: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const allUsers = await UserService.getAllUsers();
            setUsers(allUsers.filter(u => u.role === 'player'));

            // In a real app, you'd batch this or the backend would join it
            // For MVP, we'll fetch level data for the visible players
            const levels: Record<string, PlayerLevel> = {};
            // Just for demo, only fetch first 20 to avoid rate limits/performance issues
            const playersToFetch = allUsers.filter(u => u.role === 'player').slice(0, 20);

            for (const user of playersToFetch) {
                try {
                    const levelData = await xpService.getPlayerLevel(user._id);
                    levels[user._id] = levelData;
                } catch (e) {
                    // Fallback for users with no level data yet
                    levels[user._id] = {
                        userId: user._id,
                        level: 1,
                        currentXP: 0,
                        totalXP: 0,
                        xpToNextLevel: 1000
                    };
                }
            }
            setPlayerLevels(levels);
        } catch (error) {
            console.error('Error fetching users or levels:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGrantXP = async (amount: number, reason: string) => {
        if (!showGrantModal.userId) return;
        try {
            await xpService.grantXP(showGrantModal.userId, amount, reason);
            setShowGrantModal({ isOpen: false, userId: '', nickname: '' });
            fetchData(); // Refresh
        } catch (error) {
            alert('Failed to grant XP');
        }
    };

    const handleSetBoost = async () => {
        try {
            const expiry = new Date();
            expiry.setHours(expiry.getHours() + 24); // 24h boost
            await xpService.createBoost(globalMultiplier, expiry, 'Global Event');
            alert('Global boost activated!');
        } catch (error) {
            alert('Failed to set boost');
        }
    };

    const filteredUsers = users.filter(u =>
        u.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 relative overflow-hidden bg-[#141419] border border-white/5 rounded-3xl p-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00ff88]/5 to-transparent pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-2 italic">Gamification Engine</h1>
                            <p className="text-text-muted max-w-lg">Manage player levels, distribute manual XP rewards, and configure global experience multipliers.</p>
                        </div>
                        <div className="bg-black/40 border border-[#00ff88]/20 rounded-2xl p-4 flex flex-col items-center min-w-[140px]">
                            <span className="text-[10px] font-black text-[#00ff88] uppercase tracking-widest mb-1">Active Multiplier</span>
                            <span className="text-3xl font-black text-white italic">1.2x</span>
                        </div>
                    </div>
                </div>

                <div className="bg-[#141419] border border-white/5 rounded-3xl p-6 flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-4">
                        <TrendingUp className="text-[#00ff88] w-5 h-5" />
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Configure Global Boost</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <input
                                type="range" min="1" max="5" step="0.1"
                                value={globalMultiplier}
                                onChange={(e) => setGlobalMultiplier(parseFloat(e.target.value))}
                                className="flex-1 accent-[#00ff88]"
                            />
                            <span className="text-xl font-black text-white w-12 text-center">{globalMultiplier}x</span>
                        </div>
                        <Button
                            className="w-full bg-[#00ff88] text-black font-black hover:bg-[#00ff88]/90"
                            onClick={handleSetBoost}
                        >
                            ACTIVATE BOOST
                        </Button>
                    </div>
                </div>
            </div>

            {/* User List Controls */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-[#141419] p-4 rounded-3xl border border-white/5">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <Input
                        placeholder="Search players by nickname or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 bg-black/30 border-white/5 h-12 rounded-xl"
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" className="gap-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl font-black uppercase tracking-widest text-xs">
                        <Filter className="w-4 h-4" /> Filters
                    </Button>
                    <Button variant="ghost" className="gap-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl font-black uppercase tracking-widest text-xs">
                        <ShieldCheck className="w-4 h-4" /> Reset All
                    </Button>
                </div>
            </div>

            {/* User Table */}
            <div className="bg-[#141419] border border-white/5 rounded-3xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            <th className="p-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Player</th>
                            <th className="p-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Status / Region</th>
                            <th className="p-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Progression & Level</th>
                            <th className="p-6 text-[10px] font-black text-white/40 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            [1, 2, 3, 4, 5].map(i => (
                                <tr key={i} className="animate-pulse border-b border-white/5">
                                    <td colSpan={4} className="p-10"><div className="h-4 bg-white/5 rounded w-full" /></td>
                                </tr>
                            ))
                        ) : filteredUsers.map(user => (
                            <tr key={user._id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors group">
                                <td className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00ff88]/20 to-transparent border border-white/5 flex items-center justify-center font-black text-white">
                                            {user.nickname[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-sm font-black text-white mb-0.5">{user.nickname}</div>
                                            <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-[#00ff88]' : 'bg-red-500'}`} />
                                            <span className="text-[10px] font-black text-white uppercase">{user.isActive ? 'Active' : 'Banned'}</span>
                                        </div>
                                        <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{user.region || 'Europe'}</div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <LevelBadge
                                        level={playerLevels[user._id]?.level || 1}
                                        currentXP={playerLevels[user._id]?.currentXP || 0}
                                        size="sm"
                                    />
                                </td>
                                <td className="p-6 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-10 w-10 p-0 rounded-xl bg-white/5 hover:bg-[#00ff88] hover:text-black transition-all"
                                            onClick={() => setShowGrantModal({ isOpen: true, userId: user._id, nickname: user.nickname })}
                                        >
                                            <Zap size={16} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-10 w-10 p-0 rounded-xl bg-white/5 hover:bg-white/10"
                                        >
                                            <ChevronRight size={16} />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Grant XP Modal */}
            {showGrantModal.isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowGrantModal({ ...showGrantModal, isOpen: false })} />
                    <div className="relative w-full max-w-md bg-[#0a0a0f] border border-white/10 rounded-3xl p-8 shadow-2xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-[#00ff88]/10 flex items-center justify-center border border-[#00ff88]/20">
                                <Zap className="text-[#00ff88]" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Grant XP Reward</h3>
                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Rewarding: {showGrantModal.nickname}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-[#00ff88] uppercase tracking-widest mb-2">XP Amount</label>
                                <Input
                                    type="number" step="100"
                                    placeholder="500"
                                    id="grant-xp-amount"
                                    className="h-14 bg-black/40 border-white/5 text-xl font-black text-white rounded-xl text-center"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-[#00ff88] uppercase tracking-widest mb-2">Reason (Internal Note)</label>
                                <Input
                                    placeholder="Community contribution, bug bounty..."
                                    id="grant-xp-reason"
                                    className="h-14 bg-black/40 border-white/5 text-sm font-bold text-white rounded-xl"
                                />
                            </div>
                            <Button
                                className="w-full h-14 bg-[#00ff88] text-black font-black hover:bg-[#00ff88]/90 rounded-2xl shadow-[0_0_20px_rgba(0,255,136,0.3)]"
                                onClick={() => {
                                    const amt = (document.getElementById('grant-xp-amount') as HTMLInputElement).value;
                                    const reas = (document.getElementById('grant-xp-reason') as HTMLInputElement).value;
                                    handleGrantXP(parseInt(amt), reas);
                                }}
                            >
                                CONFIRM REWARD
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default XPManagement;
