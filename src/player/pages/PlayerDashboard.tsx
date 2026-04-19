import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { createPortal } from 'react-dom';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
    Swords, Clock, Trophy, Zap, Target,
    ChevronRight, Flame, Star, Activity,
    Users, Crown,
    Globe, Search, X, Smartphone, Monitor, ArrowRight, ShieldCheck, Cpu
} from 'lucide-react';
import { PerformanceChart } from '../components/PerformanceChart';
import { getApiBase } from '../../lib/apiBase';
import { cn } from '../../lib/utils';

// ─── Rank config ─────────────────────────────────────────────────────────────
const RANK_CONFIG: Record<string, { emoji: string; color: string; min: number; max: number; next: string }> = {
    Radiant:  { emoji: '👑', color: '#ffd700', min: 4000, max: 5000, next: '' },
    Immortal: { emoji: '💀', color: '#ff4655', min: 3500, max: 4000, next: 'Radiant' },
    Diamond:  { emoji: '💎', color: '#a855f7', min: 2500, max: 3500, next: 'Immortal' },
    Platinum: { emoji: '🔷', color: '#3b82f6', min: 2000, max: 2500, next: 'Diamond' },
    Gold:     { emoji: '🥇', color: '#f59e0b', min: 1500, max: 2000, next: 'Platinum' },
    Silver:   { emoji: '🥈', color: '#94a3b8', min: 1000, max: 1500, next: 'Gold' },
    Bronze:   { emoji: '🥉', color: '#b45309', min:  500, max: 1000, next: 'Silver' },
};

interface PlayerStats {
    elo: number;
    rank: string;
    stats?: { winRate?: number; killsPerRound?: number; deathPerRound?: number };
}
interface RecentMatch {
    id: string;
    result: 'W' | 'L';
    map: string;
    score: string;
    ago: string;
}
interface OnlinePlayer {
    id: string;
    name: string;
    avatar: string;
    rank: string;
    rankEmoji: string;
    status: 'online' | 'in-game';
    game?: string;
    region: string;
    elo: number;
}

type AppModalType = 'match' | 'scrims' | null;

export default function PlayerDashboard() {
    const navigate = useNavigate();
    const outletCtx = useOutletContext<{ profile?: { _id?: string } | null } | null>();
    const [appModal, setAppModal] = useState<AppModalType>(null);
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);
    const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            setStatsLoading(true);
            const token = localStorage.getItem('token');
            const API = getApiBase();
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            try {
                const [meRes, profileRes, allPlayersRes, usersRes, channelsRes] = await Promise.allSettled([
                    axios.get(`${API}/player/me`, { headers }),
                    axios.get(`${API}/auth/profile`, { headers }),
                    axios.get(`${API}/player`, { headers }),
                    axios.get(`${API}/users`, { headers }),
                    axios.get(`${API}/channel`),
                ]);

                const me = meRes.status === 'fulfilled' ? meRes.value.data : null;
                const myUser = profileRes.status === 'fulfilled' ? profileRes.value.data : null;
                const allPlayers = allPlayersRes.status === 'fulfilled' && Array.isArray(allPlayersRes.value.data) ? allPlayersRes.value.data : [];
                const allUsers = usersRes.status === 'fulfilled' && Array.isArray(usersRes.value.data) ? usersRes.value.data : [];
                const allChannels = channelsRes.status === 'fulfilled' && Array.isArray(channelsRes.value.data) ? channelsRes.value.data : [];

                setPlayerStats({
                    elo: me?.elo ?? 2854, // Mock if 0
                    rank: me?.rank ?? 'Diamond',
                    stats: me?.stats ?? { winRate: 64, killsPerRound: 18, deathPerRound: 12 },
                });

                const myUserId = myUser?._id || outletCtx?.profile?._id;
                
                // MOCK MATCHES FOR HIGH FIDELITY
                setRecentMatches([
                    { id: '1', result: 'W', map: 'HAVEN', score: '13 – 9', ago: '2h ago' },
                    { id: '2', result: 'L', map: 'ASCENT', score: '11 – 13', ago: '5h ago' },
                    { id: '3', result: 'W', map: 'BIND', score: '13 – 5', ago: '1d ago' },
                ]);

                const mappedOnline: OnlinePlayer[] = allUsers
                    .filter((u: any) => u?.role === 'player' && u?._id !== myUserId)
                    .slice(0, 30)
                    .map((u: any) => ({
                        id: String(u._id),
                        name: u.nickname || 'Operator',
                        avatar: u.avatar || u.nickname,
                        rank: 'Diamond',
                        rankEmoji: '💎',
                        status: Math.random() > 0.7 ? 'in-game' : 'online',
                        game: 'VALORANT',
                        region: u.region || 'EU',
                        elo: 2854,
                    }));
                setOnlinePlayers(mappedOnline.length > 0 ? mappedOnline : []);
            } catch {
                // Fail graceful
            } finally {
                setStatsLoading(false);
            }
        };
        fetchStats();
    }, [outletCtx?.profile?._id]);

    const chartData = [
        { label: 'JAN', valorant: 2400, lol: 1800 },
        { label: 'FEB', valorant: 2800, lol: 2100 },
        { label: 'MAR', valorant: 2600, lol: 2400 },
        { label: 'APR', valorant: 3200, lol: 2200 },
        { label: 'MAY', valorant: 2854, lol: 2600 },
    ];

    return (
        <div className="flex gap-8 h-full animate-fade-in-up overflow-hidden p-6 lg:p-0">
            {appModal && <AppRequiredModal type={appModal} onClose={() => setAppModal(null)} />}

            {/* ── Main content ─────────────────────────────────────────── */}
            <div className="flex flex-col gap-8 flex-1 min-w-0 overflow-y-auto pr-2 custom-scrollbar">

                {/* ── Hero Banner ──────────────────────────────────────────── */}
                <div className="relative overflow-hidden rounded-[40px] border border-white/10 shrink-0 bg-[#060606] shadow-2xl">
                    <div className="absolute inset-0 bg-[#00ff87]/5 blur-[120px] -mr-40 -mt-40 rounded-full" />
                    
                    {/* Hex grid */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                         style={{ 
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45v-30z' fill-rule='evenodd' stroke='%23fff' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
                            backgroundSize: '40px' 
                         }} 
                    />

                    <div className="relative p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="px-3 py-1 rounded-sm bg-[#00ff87]/10 border border-[#00ff87]/20 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ff87] animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#00ff87] italic">System Online</span>
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Protocol Node: 0xF4...A2</span>
                            </div>
                            
                            <div className="space-y-2">
                                <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white leading-tight uppercase">
                                    READY TO <span className="text-[#00ff87] drop-shadow-[0_0_40px_rgba(0,255,135,0.4)]">DOMINATE?</span>
                                </h1>
                                <p className="text-sm text-white/30 font-bold uppercase tracking-widest leading-relaxed max-w-lg italic">
                                    Initiate matchmaking protocol and claim your legacy on the global decentralized ledger.
                                </p>
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <button
                                    onClick={() => setAppModal('match')}
                                    className="h-16 px-10 rounded-2xl bg-[#00ff87] text-black font-black italic uppercase text-xs tracking-[0.3em] shadow-[0_15px_40px_rgba(0,255,135,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                                >
                                    <Swords size={18} /> INITIALIZE MATCH
                                </button>
                                <button
                                    onClick={() => setAppModal('scrims')}
                                    className="h-16 px-8 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-black italic uppercase text-xs tracking-widest hover:bg-white/10 hover:text-white transition-all"
                                >
                                    SCRIM_SCHEDULER
                                </button>
                            </div>
                        </div>

                        {/* Rank card - high fid */}
                        <div className="bg-[#111] border border-[#a855f7]/30 rounded-[32px] p-10 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-20 h-20 bg-[#a855f7]/10 blur-[50px] rounded-full" />
                           
                           <div className="text-6xl mb-4 drop-shadow-[0_10px_30px_rgba(168,85,247,0.5)] group-hover:scale-110 transition-transform duration-500">
                               💎
                           </div>
                           <h3 className="text-3xl font-black italic tracking-tighter text-white uppercase">DIAMOND III</h3>
                           <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a855f7] mt-1 italic">2,854 ELO // SYNCED</div>
                           
                           <div className="w-48 h-2 bg-white/5 rounded-full mt-6 overflow-hidden">
                               <div className="h-full bg-gradient-to-r from-[#a855f7]/50 to-[#a855f7] rounded-full" style={{ width: '74%' }} />
                           </div>
                           <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mt-2">146 ELO TO IMMORTAL CLEARANCE</p>
                        </div>
                    </div>
                </div>

                {/* ── Core Stat HUD ────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
                    <ProtocolHudStat icon={<Target size={20} className="text-[#00ff87]" />} label="SUCCESS_RATE" value="64.2%" sub="GLOBAL_PERCENTILE 04" color="#00ff87" />
                    <ProtocolHudStat icon={<Flame size={20} className="text-[#f97316]" />} label="LIVE_OPERATORS" value="1,842" sub="CONCURRENT_THREADS" color="#f97316" />
                    <ProtocolHudStat icon={<Activity size={20} className="text-[#a855f7]" />} label="PRECISION_KDR" value="1.54" sub="NEURAL_SYNC_COEF" color="#a855f7" />
                    <ProtocolHudStat icon={<Zap size={20} className="text-[#3b82f6]" />} label="ENGAGEMENTS" value="128" sub="SEASONAL_DEPLOYMENTS" color="#3b82f6" />
                </div>

                {/* ── Secondary Grid ────────────────────────────────────────── */}
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8 flex-1 min-h-0">
                    
                    {/* Visual Performance Matrix */}
                    <div className="bg-[#111] border border-white/5 rounded-[40px] p-10 space-y-8 shadow-xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black italic tracking-widest uppercase flex items-center gap-3">
                                <Cpu size={20} className="text-[#00ff87]" /> PERFORMANCE_MATRIX
                            </h3>
                            <div className="flex items-center gap-4">
                                <button className="text-[9px] font-black uppercase tracking-widest text-[#00ff87]">LIVE_FEED</button>
                                <button className="text-[9px] font-black uppercase tracking-widest text-white/20">HISTORICAL</button>
                            </div>
                        </div>
                        <div className="h-64">
                            <PerformanceChart data={chartData} />
                        </div>
                    </div>

                    {/* Right column: Recent Logs & Action List */}
                    <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                        
                        {/* COMBAT LOGS */}
                        <div className="bg-[#111] border border-white/5 rounded-[32px] overflow-hidden shadow-xl">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Swords size={16} className="text-[#00ff87]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest italic">RECENT_COMBAT_LOGS</span>
                                </div>
                                <button onClick={() => navigate('/player/matches')} className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-[#00ff87] transition-all">VIEW_FULL_RECORD</button>
                            </div>
                            <div className="p-2">
                                {recentMatches.map((m) => (
                                    <div key={m.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/[0.02] transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl border flex items-center justify-center text-[10px] font-black italic",
                                                m.result === 'W' ? "bg-[#00ff87]/5 border-[#00ff87]/20 text-[#00ff87]" : "bg-red-500/5 border-red-500/20 text-red-500"
                                            )}>
                                                {m.result}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black italic uppercase text-white group-hover:text-[#00ff87] transition-colors">{m.map}</p>
                                                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic">{m.score}</p>
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">{m.ago}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* QUICK ACCESS GRID */}
                        <div className="grid grid-cols-2 gap-4">
                            <QuickNavCard icon={<Trophy size={18} />} label="LEAGUES" color="#a855f7" onClick={() => navigate('/player/leagues')} />
                            <QuickNavCard icon={<Users size={18} />} label="TOURNEYS" color="#3b82f6" onClick={() => navigate('/player/tournaments')} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Offline/Online Panel */}
            <OnlinePanel players={onlinePlayers} />
        </div>
    );
}

function ProtocolHudStat({ icon, label, value, sub, color }: any) {
    return (
        <div className="bg-[#111] border border-white/5 rounded-[32px] p-7 space-y-4 hover:border-white/15 transition-all shadow-xl group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 blur-[40px] opacity-10 rounded-full" style={{ background: color }} />
            <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                    {icon}
                </div>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 italic">{label}</span>
            </div>
            <div>
                <p className="text-3xl font-black italic tracking-tighter text-white" style={{ textShadow: `0 0 30px ${color}30` }}>{value}</p>
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-1 italic">{sub}</p>
            </div>
        </div>
    );
}

function QuickNavCard({ icon, label, color, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className="bg-[#111] border border-white/5 p-6 rounded-[28px] flex flex-col items-center gap-3 hover:border-white/10 transition-all group shadow-lg"
        >
            <div className="p-3 rounded-xl bg-white/5 text-white/20 group-hover:text-white group-hover:bg-white/10 transition-all" style={{ color: `${color}80` }}>
                {icon}
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 group-hover:text-white transition-all italic">{label}</span>
        </button>
    );
}

// ─── Online Players Panel (right) ────────────────────────────────────────────
function OnlinePanel({ players }: { players: OnlinePlayer[] }) {
    const [search, setSearch] = useState('');
    const visible = players.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="w-72 shrink-0 flex flex-col gap-6 h-full overflow-hidden hidden xl:flex">
            <div className="bg-[#111] border border-white/5 rounded-[40px] flex-1 flex flex-col overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Globe size={18} className="text-[#00ff87]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">OPERATORS</span>
                        </div>
                        <span className="text-[9px] font-black bg-[#00ff87]/10 text-[#00ff87] px-2 py-1 rounded border border-[#00ff87]/20">{players.length}</span>
                    </div>
                    
                    <div className="relative">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                        <input 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="ENCRYPTED_ID..." 
                            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-10 pr-4 text-[10px] font-black tracking-widest text-white placeholder:text-white/10 focus:outline-none focus:border-[#00ff87]/20 transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {visible.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/[0.02] transition-all group cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                                        <img src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${p.name}`} className="w-full h-full object-cover" />
                                    </div>
                                    <span className={cn(
                                        "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#111]",
                                        p.status === 'in-game' ? "bg-[#a855f7]" : "bg-[#00ff87]"
                                    )} />
                                </div>
                                <div>
                                    <p className="text-xs font-black italic tracking-tight text-white/80 group-hover:text-[#00ff87] transition-colors">{p.name}</p>
                                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{p.status === 'in-game' ? 'DEPLOYED' : 'READY'}</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-black text-white/10 italic">#{p.elo}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── App Required Modal ───────────────────────────────────────────────────────
function AppRequiredModal({ type, onClose }: { type: 'match' | 'scrims'; onClose: () => void }) {
    const isScrims = type === 'scrims';

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl" onClick={onClose}>
            <div className="relative w-full max-w-lg bg-[#060606] border border-white/10 rounded-[48px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]" onClick={e => e.stopPropagation()}>
                <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45v-30z' fill-rule='evenodd' stroke='%23fff' stroke-width='1' fill='none'/%3E%3C/svg%3E")`, backgroundSize: '40px' }} />
                
                <button onClick={onClose} className="absolute top-8 right-8 text-white/20 hover:text-white transition-all"><X size={24} /></button>

                <div className="p-12 text-center space-y-8">
                    <div className="flex justify-center">
                        <div className="w-24 h-24 rounded-[32px] bg-[#00ff87]/5 border border-[#00ff87]/20 flex items-center justify-center shadow-[0_0_50px_rgba(0,255,135,0.1)]">
                            {isScrims ? <Clock size={40} className="text-[#00ff87]" /> : <Swords size={40} className="text-[#00ff87]" />}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00ff87] italic">Protocol Upgrade Required</p>
                        <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase">{isScrims ? "SCRIM_V2 ACCESS" : "MATCHMAKING_v4"}</h2>
                        <p className="text-sm text-white/30 font-bold uppercase tracking-widest leading-relaxed">
                            {isScrims 
                                ? "Advanced team coordination and competitive planning are restricted to the ArenaChain native desktop and mobile environments." 
                                : "Low-latency real-time matchmaking requires a direct neural link via the ArenaChain mobile or desktop application."}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pb-4">
                        <AppCard icon={<Smartphone size={24} />} title="MOBILE" desc="iOS / ANDROID" />
                        <AppCard icon={<Monitor size={24} />} title="DESKTOP" desc="WIN / MACOS" />
                    </div>

                    <button onClick={onClose} className="w-full h-20 bg-white/5 border border-white/10 rounded-3xl font-black italic uppercase text-xs tracking-[0.3em] hover:bg-white/10 transition-all text-white/40 hover:text-white">
                        REVERT_TO_DASHBOARD
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

function AppCard({ icon, title, desc }: any) {
    return (
        <div className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl space-y-4 group hover:border-[#00ff87]/30 transition-all cursor-pointer">
            <div className="text-white/20 group-hover:text-[#00ff87] transition-colors">{icon}</div>
            <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-white group-hover:text-white transition-all italic">{title}</p>
                <p className="text-[8px] font-bold text-white/10 uppercase tracking-widest">{desc}</p>
            </div>
        </div>
    );
}
