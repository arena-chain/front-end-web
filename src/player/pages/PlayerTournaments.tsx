import { useState, useEffect } from 'react';
import { Search, Calendar, Trophy, Users, Video, Zap, ChevronRight, Shield, Clock, Cpu } from 'lucide-react';
import type { Tournament } from '../../models/tournament';
import tournamentService from '../../services/tournamentService';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { resolveBackendAssetUrl } from '../../lib/apiBase';
import { motion } from 'framer-motion';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS: Record<string, { label: string; color: string; glow: string }> = {
    ONGOING:           { label: 'LIVE_FEED', color: '#ff00ff', glow: 'rgba(255,0,255,0.2)' },
    OPEN_REGISTRATION: { label: 'REGISTERING', color: '#00ff87', glow: 'rgba(0,255,135,0.2)' },
    UPCOMING:          { label: 'PENDING_START', color: '#00ccff', glow: 'rgba(0,204,255,0.2)' },
    COMPLETED:         { label: 'LOGGED_HISTORY', color: '#777', glow: 'rgba(255,255,255,0.05)' },
};

const STATUS_TABS = [
    { value: 'all',               label: 'ALL_PROTOCOLS', icon: <Shield size={12} /> },
    { value: 'ONGOING',           label: 'LIVE',         icon: <Video size={12} />  },
    { value: 'OPEN_REGISTRATION', label: 'OPEN',         icon: <Zap size={12} />    },
    { value: 'UPCOMING',          label: 'UPCOMING',     icon: <Clock size={12} />  },
    { value: 'COMPLETED',         label: 'ENDED',        icon: <Trophy size={12} /> },
];

export default function PlayerTournaments() {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        tournamentService.fetchTournaments()
            .then(data => setTournaments(data.filter((t: Tournament) => t.status !== 'DRAFT')))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filtered = tournaments.filter(t => {
        const gameTitle = typeof t.gameId === 'object' ? (t.gameId as any)?.title ?? '' : '';
        const matchSearch  = t.name.toLowerCase().includes(search.toLowerCase()) || gameTitle.toLowerCase().includes(search.toLowerCase());
        const matchStatus  = statusFilter === 'all' || t.status === statusFilter;
        return matchSearch && matchStatus;
    });

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
                            <Cpu size={12} className="animate-pulse" />
                            Engagement Protocol: Sector 7
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white leading-none">
                            GLOBAL <span className="text-[#00ff87]">LEAGUES</span>
                        </h1>
                        <p className="text-white/25 font-black uppercase tracking-[0.35em] text-[10px]">
                            Verified Tournament Nodes // Real-time Ledger Distribution
                        </p>
                    </div>

                    <div className="relative w-full lg:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#00ff87] transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="LOOK_UP_PROTOCOL..." 
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-[10px] font-black tracking-widest focus:outline-none focus:border-[#00ff87]/40 text-white placeholder:text-white/20 transition-all shadow-inner"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* ── Tabs ─────────────────────────────────────────────── */}
                <div className="flex items-center gap-3 bg-[#111] border border-white/5 rounded-[24px] p-2 overflow-x-auto no-scrollbar">
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setStatusFilter(tab.value)}
                            className={cn(
                                "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all flex items-center gap-2",
                                statusFilter === tab.value ? "bg-white/10 text-[#00ff87] shadow-xl" : "text-white/30 hover:text-white"
                            )}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── Main Grid ────────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-[400px] bg-white/[0.02] border border-white/5 rounded-[40px] animate-pulse" />
                        ))
                    ) : filtered.length === 0 ? (
                        <div className="col-span-full py-40 border-2 border-dashed border-white/5 rounded-[48px] flex flex-col items-center justify-center text-white/10 opacity-40">
                            <Trophy size={64} className="mb-4" />
                            <p className="text-xl font-black italic tracking-widest uppercase">No Active Protocols Detected</p>
                        </div>
                    ) : (
                        filtered.map((t, idx) => (
                            <TournamentProtocolCard key={t._id} tournament={t} index={idx} onClick={() => navigate(`/player/tournaments/${t._id}`)} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function TournamentProtocolCard({ tournament, index, onClick }: { tournament: Tournament, index: number, onClick: () => void }) {
    const sc = STATUS[tournament.status] || STATUS.UPCOMING;
    const game = typeof tournament.gameId === 'object' ? (tournament.gameId as any)?.title : 'GLOBAL_TITLE';
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={onClick}
            className="group relative bg-[#111] border border-white/5 rounded-[48px] overflow-hidden flex flex-col cursor-pointer hover:border-white/15 transition-all shadow-2xl h-[420px]"
        >
            <div className="h-48 relative overflow-hidden shrink-0">
                <img 
                    src={tournament.bannerImageUrl ? resolveBackendAssetUrl(tournament.bannerImageUrl) : 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80'} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 brightness-75 group-hover:brightness-90"
                    alt="Tournament"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-black/40" />
                
                <div className="absolute top-6 left-6 flex gap-3">
                    <div className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 backdrop-blur-md">
                        <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: sc.color }}>{sc.label}</p>
                    </div>
                </div>

                <div className="absolute bottom-6 left-6">
                    <div className="px-3 py-1 rounded-sm bg-white/10 text-[7px] font-black uppercase tracking-[0.2em] text-white/60">
                        PROTO_SERIES // {game}
                    </div>
                </div>
            </div>

            <div className="flex-1 p-8 flex flex-col justify-between">
                <div className="space-y-4">
                    <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white group-hover:text-[#00ff87] transition-all line-clamp-2 leading-tight">
                        {tournament.name}
                    </h3>
                    
                    <div className="flex gap-6 items-center">
                        <div className="flex items-center gap-2">
                            <Trophy size={14} className="text-[#00ff87]" />
                            <span className="text-xl font-black italic text-white tracking-tighter">${tournament.prizePool?.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users size={14} className="text-white/20" />
                            <span className="text-[10px] font-black italic text-white/40 tracking-widest uppercase">{tournament.currentTeams || 0} / {tournament.maxTeams} CORE_LINKS</span>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-white/[0.03] flex items-center justify-between">
                    <div>
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1 italic">Initiation Date</p>
                        <p className="text-xs font-black italic tracking-tight text-white/60 uppercase">
                            {new Date(tournament.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                    
                    <button className="h-12 px-6 rounded-2xl bg-white/5 border border-white/10 text-white font-black italic uppercase text-[9px] tracking-widest group-hover:bg-[#00ff87] group-hover:text-black group-hover:border-none transition-all">
                        SELECT_NODE
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
