import { useState, useEffect } from 'react';
import { User, Edit2, Share2, Trophy, Target, Sparkles, RefreshCw, Upload, Shield, Zap, Globe, Cpu } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface UserProfile {
    _id: string;
    nickname: string;
    email: string;
    region?: string;
    avatar?: string;
    role: string;
}

const REGIONS = [
    { code: 'EUROPE', name: 'Europe // EU' },
    { code: 'AFRICA', name: 'Africa // AF' },
    { code: 'ASIA', name: 'Asia // AS' },
    { code: 'AMERICAS', name: 'Americas // NA' },
    { code: 'OCEANIA', name: 'Oceania // OC' }
];

const TABS = [
    { id: 'resume', label: 'OPERATOR_SUMMARY' },
    { id: 'matches', label: 'COMBAT_LOGS' },
    { id: 'stats', label: 'CORE_STATISTICS' },
    { id: 'vault', label: 'DIGITAL_VAULT' },
];

export default function PlayerProfile() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('resume');
    const [nickname, setNickname] = useState('');
    const [region, setRegion] = useState('EUROPE');
    const [avatar, setAvatar] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(response.data);
            setNickname(response.data.nickname);
            setRegion(response.data.region || 'EUROPE');
            setAvatar(response.data.avatar || '');
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_URL}/auth/profile`, {
                nickname,
                region,
                avatar
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEditing(false);
            fetchProfile();
            toast.success('Protocol Sync Complete');
        } catch (error: any) {
            console.error('Error updating profile:', error);
            toast.error('Sync Interrupted');
        }
    };

    const generateRandomAvatar = () => {
        const styles = ['bottts-neutral', 'avataaars-neutral', 'pixel-art-neutral', 'lorelei-neutral'];
        const randomStyle = styles[Math.floor(Math.random() * styles.length)];
        const randomSeed = Math.random().toString(36).substring(7);
        const newAvatar = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}`;
        setAvatar(newAvatar);
        toast.info('Neural Signature Regenerated');
    };

    if (loading) return (
        <div className="min-h-screen bg-[#060606] flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-[#00ff87]/20 border-t-[#00ff87] rounded-full animate-spin" />
        </div>
    );

    const regionData = REGIONS.find(r => r.code === region);

    return (
        <div className="min-h-screen bg-[#060606] text-white relative overflow-hidden p-8 lg:p-10">
            {/* Hex background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45v-30z' fill-rule='evenodd' stroke='%23fff' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
                    backgroundSize: '40px' 
                 }} 
            />

            <div className="max-w-[1400px] mx-auto space-y-12 relative z-10">
                {/* ── Header ────────────────────────────────────────── */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 font-black text-[#00ff87] text-[10px] tracking-[0.4em] italic uppercase">
                            <Shield size={12} className="animate-pulse" />
                            Security Clearance: Level 4
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white leading-none">
                            OPERATOR <span className="text-[#00ff87]">PROFILE</span>
                        </h1>
                        <p className="text-white/25 font-black uppercase tracking-[0.35em] text-[10px]">
                            Biometric Signature Validated // Protocol Version 2026.4
                        </p>
                    </div>
                </div>

                {/* ── Layout Grid ─────────────────────────────────── */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                    
                    {/* LEFT: Operator Dossier Card */}
                    <div className="xl:col-span-4 lg:col-span-5">
                        <div className="bg-[#111] border border-white/10 rounded-[48px] p-10 space-y-8 sticky top-10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden">
                            {/* Decorative Glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff87]/10 blur-[80px] -mr-16 -mt-16 rounded-full" />
                            
                            <div className="relative z-10 flex flex-col items-center gap-8">
                                {/* Avatar Core */}
                                <div className="relative group">
                                    <div className="w-48 h-48 rounded-full bg-gradient-to-br from-[#00ff87]/20 to-transparent p-1.5 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                                        <div className="w-full h-full rounded-full bg-black border-2 border-white/5 overflow-hidden flex items-center justify-center relative">
                                            {avatar ? (
                                                <img src={avatar} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Avatar" />
                                            ) : (
                                                <User className="w-20 h-20 text-white/10" />
                                            )}
                                            
                                            {editing && (
                                                <div 
                                                    onClick={generateRandomAvatar}
                                                    className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer gap-2"
                                                >
                                                    <RefreshCw size={24} className="text-[#00ff87]" />
                                                    <span className="text-[9px] font-black uppercase text-white/60">Generate Neural Sig</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Role Badge */}
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black border border-white/10 shadow-xl">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-[#00ff87] italic">{profile?.role || 'OPERATOR'}</span>
                                    </div>
                                </div>

                                <div className="text-center space-y-3 w-full">
                                    {editing ? (
                                        <input
                                            value={nickname}
                                            onChange={(e) => setNickname(e.target.value)}
                                            className="w-full bg-white/5 border border-[#00ff87]/30 rounded-xl py-3 px-4 text-center text-xl font-black italic tracking-tighter text-white focus:outline-none focus:border-[#00ff87]"
                                        />
                                    ) : (
                                        <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase">{profile?.nickname}</h2>
                                    )}
                                    
                                    <div className="flex items-center justify-center gap-2 text-white/30 text-[10px] font-black uppercase tracking-widest italic">
                                        <Globe size={12} className="text-[#00ff87]" />
                                        {editing ? (
                                            <select 
                                                value={region} 
                                                onChange={e => setRegion(e.target.value)}
                                                className="bg-transparent border-none focus:ring-0 text-white/50 cursor-pointer"
                                            >
                                                {REGIONS.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}
                                            </select>
                                        ) : (
                                            regionData?.name || 'SYNCING...'
                                        )}
                                    </div>
                                </div>

                                {/* Operator Specs */}
                                <div className="grid grid-cols-2 gap-4 w-full pt-6 border-t border-white/5">
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest italic">Experience</p>
                                        <p className="text-xl font-black italic tracking-tighter text-white">LVL 42</p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest italic">Legacy Date</p>
                                        <p className="text-xl font-black italic tracking-tighter text-white">JAN 2026</p>
                                    </div>
                                </div>

                                {/* Action Matrix */}
                                <div className="w-full pt-4 flex gap-4">
                                    {editing ? (
                                        <>
                                            <button 
                                                onClick={handleSave} 
                                                className="flex-1 h-14 bg-[#00ff87] text-black rounded-2xl font-black italic uppercase text-[10px] tracking-widest shadow-[0_10px_30px_rgba(0,255,135,0.2)] hover:scale-105 active:scale-95 transition-all"
                                            >
                                                COMMIT_SYNC
                                            </button>
                                            <button 
                                                onClick={() => { setEditing(false); fetchProfile(); }}
                                                className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-white hover:text-red-500 transition-all"
                                            >
                                                <X size={20} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={() => setEditing(true)} 
                                                className="flex-1 h-14 bg-white/5 border border-white/10 rounded-2xl font-black italic uppercase text-[10px] tracking-widest text-[#00ff87] hover:bg-[#00ff87]/10 transition-all flex items-center justify-center gap-3"
                                            >
                                                <Edit2 size={14} /> MODIFY_DEXTERITY
                                            </button>
                                            <button className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-white/40 hover:text-white transition-all">
                                                <Share2 size={18} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: System Visuals & Data */}
                    <div className="xl:col-span-8 lg:col-span-7 space-y-10">
                        {/* Sub-Navigation */}
                        <div className="flex items-center gap-2 bg-[#111] border border-white/5 rounded-[24px] p-2 shadow-inner w-fit">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all relative overflow-hidden",
                                        activeTab === tab.id ? "bg-white/10 text-[#00ff87] shadow-xl" : "text-white/20 hover:text-white"
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Content Pane */}
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {activeTab === 'resume' && (
                                <div className="space-y-10">
                                    {/* Performance Cores */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <PerformanceCard 
                                            icon={<Trophy size={24} className="text-[#00ff87]" />} 
                                            label="COMBAT_SUCCESS_RATE" 
                                            value="74.2%" 
                                            sub="Rank: Elite Tier" 
                                        />
                                        <PerformanceCard 
                                            icon={<Target size={24} className="text-[#ff00ff]" />} 
                                            label="TOTAL_ENGAGEMENTS" 
                                            value="842" 
                                            sub="Global Percentile: Top 3%" 
                                        />
                                    </div>

                                    {/* System Status Container */}
                                    <div className="p-10 bg-white/[0.02] border border-white/[0.05] rounded-[48px] space-y-8">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-black italic tracking-widest uppercase flex items-center gap-3">
                                                <Cpu size={20} className="text-[#00ff87]" /> NEURAL_ACTIVITY_FEED
                                            </h3>
                                            <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Status: Syncing...</div>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            <ActivityRow title="Tier 1 Major Participation" status="Verified" time="2 hours ago" />
                                            <ActivityRow title="Market Acquisition: Void Reaper" status="Success" time="1 day ago" />
                                            <ActivityRow title="League Placement Finalized" status="Diamond III" time="3 days ago" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'matches' && (
                                <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[48px] text-white/10 opacity-40">
                                    <Zap size={48} className="mb-4" />
                                    <p className="text-xl font-black italic tracking-widest uppercase">No Recent Engagements Logged</p>
                                </div>
                            )}

                            {activeTab === 'vault' && (
                                <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[48px] text-white/10 opacity-40">
                                    <Shield size={48} className="mb-4" />
                                    <p className="text-xl font-black italic tracking-widest uppercase">Vault Empty // Seek Assets</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PerformanceCard({ icon, label, value, sub }: { icon: React.ReactNode, label: string, value: string, sub: string }) {
    return (
        <div className="bg-[#111] border border-white/10 rounded-[40px] p-8 flex items-center gap-8 group hover:border-[#00ff87]/30 transition-all">
            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-black transition-all">
                {icon}
            </div>
            <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/20 italic">{label}</p>
                <p className="text-4xl font-black italic tracking-tighter text-white">{value}</p>
                <p className="text-[10px] font-bold text-[#00ff87]/60 italic">{sub}</p>
            </div>
        </div>
    );
}

function ActivityRow({ title, status, time }: { title: string, status: string, time: string }) {
    return (
        <div className="flex items-center justify-between py-4 border-b border-white/[0.03] group hover:bg-white/[0.01] px-4 -mx-4 rounded-xl transition-all">
            <div className="flex items-center gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00ff87] group-hover:scale-150 transition-transform" />
                <div>
                    <p className="text-sm font-black italic tracking-tight text-white/80">{title}</p>
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{time}</p>
                </div>
            </div>
            <span className="text-[9px] font-black italic uppercase text-[#00ff87] bg-[#00ff87]/5 px-2 py-1 rounded border border-[#00ff87]/10">
                {status}
            </span>
        </div>
    );
}
