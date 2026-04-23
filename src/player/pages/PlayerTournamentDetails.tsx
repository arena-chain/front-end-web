import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Trophy, Users, ArrowLeft, Shield, Ticket, Share2, Play, Cpu, Zap, Globe } from 'lucide-react';
import { Button } from '../../components/ui/core';
import { MOCK_TOURNAMENTS } from '../../_public/data/tournamentData';
import tournamentService from '../../services/tournamentService';
import { resolveBackendAssetUrl } from '../../lib/apiBase';
import { placeholderImage } from '../../lib/placeholderImage';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface TournamentDisplay {
    _id: string;
    title: string;
    game: string;
    status: string;
    date: string;
    image: string;
    color: string;
    description: string;
    prize: string;
    location: string;
    teams: { id: string; name: string; logo: string }[];
    bracket: any[];
    streamUrl?: string;
    checkAuth?: boolean;
}

export default function PlayerTournamentDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState<TournamentDisplay | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (id) fetchTournamentData(id);
    }, [id]);

    const fetchTournamentData = async (tournamentId: string) => {
        setLoading(true);
        try {
            const apiData = await tournamentService.fetchTournamentById(tournamentId);
            setTournament({
                _id: apiData._id,
                title: apiData.name,
                game: apiData.gameId?.title || 'Unknown Game',
                status: apiData.status,
                date: new Date(apiData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                image: apiData.bannerImageUrl ? resolveBackendAssetUrl(apiData.bannerImageUrl) : placeholderImage(1920, 1080, 'Tournament'),
                color: 'from-[#00ff87] to-[#0099ff]',
                description: apiData.description || 'Engagement protocol details encrypted.',
                prize: `$${apiData.prizePool?.toLocaleString() || '0'}`,
                location: 'GLOBAL_NETWORK',
                teams: apiData.teams?.length > 0 ? apiData.teams.map((t: any) => ({
                    id: t._id || t,
                    name: t.name || 'Operator',
                    logo: t.logo || ''
                })) : MOCK_TOURNAMENTS[0].teams,
                bracket: MOCK_TOURNAMENTS[0].bracket as any[],
                streamUrl: apiData.streamUrl,
            });
        } catch {
            setTournament(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#060606] flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-[#00ff87]/20 border-t-[#00ff87] rounded-full animate-spin" />
        </div>
    );

    if (!tournament) return (
        <div className="min-h-screen bg-[#060606] flex items-center justify-center text-center">
            <div className="space-y-6">
                <Shield size={48} className="mx-auto text-white/10" />
                <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase">PROTOCOL_NOT_FOUND</h2>
                <Button variant="outline" className="border-white/10 text-white/40 hover:text-white" onClick={() => navigate('/player/tournaments')}>
                    RETURN_TO_LOBBY
                </Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#060606] text-white relative overflow-hidden pb-20">
            {/* 1. Hero / Headset Interface */}
            <div className="relative h-[65vh] min-h-[500px] overflow-hidden">
                <div className="absolute inset-0">
                    <img src={tournament.image} alt={tournament.title} className="w-full h-full object-cover scale-105 brightness-[0.4] contrast-[1.2]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#060606] via-transparent to-black/60" />
                    <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#00ff87]/10 to-transparent opacity-30" />
                </div>

                <div className="max-w-[1400px] mx-auto px-10 h-full relative z-10 flex flex-col justify-end pb-16 space-y-8">
                    <div className="flex items-center gap-4">
                        <Link to="/player/tournaments">
                            <button className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest italic hover:bg-white/10 transition-all">
                                <ArrowLeft size={16} /> RETURN_TO_FLEET
                            </button>
                        </Link>
                        <div className="px-5 py-3 rounded-xl bg-[#00ff87]/10 border border-[#00ff87]/30 backdrop-blur-md flex items-center gap-3">
                           <span className="w-2 h-2 rounded-full bg-[#00ff87] animate-pulse" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-[#00ff87] italic">ACTIVE_PROTOCOL_ENGAGEMENT</span>
                        </div>
                    </div>

                    <div className="space-y-4 max-w-4xl">
                        <div className="flex gap-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00ff87] italic px-4 py-1.5 rounded-full border border-[#00ff87]/30 bg-[#00ff87]/5">{tournament.game}</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic px-4 py-1.5">{tournament.status}</span>
                        </div>
                        <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter text-white uppercase leading-none drop-shadow-2xl">
                            {tournament.title}
                        </h1>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-10 pt-6">
                        <div className="flex gap-10">
                            <SpecBox label="PRIZE_TOTAL" value={tournament.prize} icon={<Trophy size={16} />} color="#00ff87" />
                            <SpecBox label="SYNC_DATE" value={tournament.date} icon={<Calendar size={16} />} color="#00ccff" />
                            <SpecBox label="SECTOR" value={tournament.location} icon={<Globe size={16} />} color="#ff00ff" />
                        </div>
                        
                        <div className="flex-1" />

                        <div className="flex gap-4 w-full md:w-auto">
                            {tournament.status === 'OPEN_REGISTRATION' && (
                                <button className="flex-1 md:flex-none h-18 px-10 rounded-2xl bg-[#00ff87] text-black font-black italic uppercase text-xs tracking-[0.3em] shadow-[0_15px_40px_rgba(0,255,135,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3" onClick={() => navigate(`/player/tournaments/${tournament._id}/tickets`)}>
                                    <Ticket size={20} /> ENLIST_NOW
                                </button>
                            )}
                            <button className="h-18 px-8 rounded-2xl bg-red-600 text-white font-black italic uppercase text-xs tracking-widest shadow-[0_15px_40px_rgba(220,38,38,0.3)] hover:scale-105 transition-all flex items-center gap-3" onClick={() => window.open(tournament.streamUrl || 'https://twitch.tv', '_blank')}>
                                <Play size={20} className="fill-current" /> WATCH_VIRTUAL
                            </button>
                            <button className="w-18 h-18 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-white transition-all">
                                <Share2 size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-10 py-20 space-y-32 relative z-10">
                
                {/* 2. Core Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <StatusMetric label="COMBATANTS" value={tournament.teams.length.toString()} sub="Verified Links" icon={<Users className="text-[#00ff87]" />} />
                    <StatusMetric label="SYSTEM_LOAD" value="84%" sub="Active Threads" icon={<Cpu className="text-[#ff00ff]" />} />
                    <StatusMetric label="PRIZE_ALLOC" value="DECENTR" sub="Smart Contract" icon={<Shield className="text-[#00ccff]" />} />
                    <StatusMetric label="REGION_GATE" value="GLOBAL" sub="Any-Node Access" icon={<Globe className="text-white/20" />} />
                </div>

                {/* 3. Bracket Section */}
                <div className="space-y-12">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00ff87] animate-pulse" />
                        <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase">ELIMINATION_MATRIX</h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">Live Ledger Propagation</p>
                    </div>

                    <div className="overflow-x-auto no-scrollbar pb-10 flex justify-center">
                        <div className="min-w-[1000px] p-10 bg-[#111] border border-white/5 rounded-[48px] shadow-inner relative overflow-hidden">
                            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45v-30z' fill-rule='evenodd' stroke='%23fff' stroke-width='1' fill='none'/%3E%3C/svg%3E")`, backgroundSize: '20px' }} />
                            
                            <div className="flex justify-between items-stretch gap-12 relative z-10">
                                <BracketColumn title="QUARTER_FINALS" matches={tournament.bracket.filter(m => m.round === 'Quarterfinals')} />
                                <BracketColumn title="SEMI_FINALS" matches={tournament.bracket.filter(m => m.round === 'Semifinals')} />
                                <BracketColumn title="GRAND_MASTERS" matches={tournament.bracket.filter(m => m.round === 'Finals')} featured />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Participating Groups */}
                <div className="space-y-12">
                     <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase text-center flex items-center justify-center gap-6">
                        <Zap size={32} className="text-[#00ff87]" /> OPERATOR_GROUPS
                     </h2>
                     <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {tournament.teams.map((t, idx) => (
                            <motion.div 
                                key={t.id} 
                                initial={{ opacity: 0, scale: 0.9 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                transition={{ delay: idx * 0.05 }}
                                className="bg-[#111] border border-white/5 p-8 rounded-[32px] flex flex-col items-center gap-5 hover:border-[#00ff87]/30 hover:bg-[#111]/80 transition-all group"
                            >
                                <div className="w-20 h-20 rounded-full bg-black/40 border border-white/5 p-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    {t.logo ? <img src={t.logo} className="max-w-full max-h-full object-contain" /> : <Shield className="text-white/10" size={32} />}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/50 text-center line-clamp-1 italic group-hover:text-white transition-colors">{t.name}</span>
                            </motion.div>
                        ))}
                     </div>
                </div>
            </div>
        </div>
    );
}

function SpecBox({ label, value, icon, color }: any) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-2">
                <span className="text-white/20" style={{ color: `${color}40` }}>{icon}</span>
                <p className="text-[9px] font-black uppercase tracking-widest text-white/40 italic">{label}</p>
            </div>
            <p className="text-2xl font-black italic tracking-tighter text-white uppercase" style={{ textShadow: `0 0 30px ${color}40` }}>{value}</p>
        </div>
    );
}

function StatusMetric({ label, value, sub, icon }: any) {
    return (
        <div className="bg-[#111] border border-white/5 p-8 rounded-[40px] space-y-4 hover:border-white/15 transition-all shadow-xl">
            <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">{icon}</div>
                <span className="text-[8px] font-black uppercase tracking-widest text-white/20 italic">{label}</span>
            </div>
            <div>
                <p className="text-4xl font-black italic tracking-tighter text-white">{value}</p>
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-1 italic">{sub}</p>
            </div>
        </div>
    );
}

function BracketColumn({ title, matches, featured }: any) {
    return (
        <div className={cn("flex flex-col gap-10", featured ? "justify-center" : "justify-between")}>
            <div className="text-center">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 italic">{title}</h4>
            </div>
            <div className="space-y-10">
                {matches.map((m: any) => (
                    <div key={m.id} className={cn(
                        "w-64 bg-black border border-white/5 p-4 rounded-2xl space-y-3 relative group hover:border-[#00ff87]/30 transition-all",
                        featured && "scale-125 border-[#00ff87]/20 shadow-[0_0_50px_rgba(0,255,135,0.1)]"
                    )}>
                        <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-white/20 pb-2 border-b border-white/5">
                            <span>{m.date}</span>
                            <span>{m.time}</span>
                        </div>
                        <div className="space-y-2">
                            <MatchRow team={m.team1} score={m.score1} winner={m.winner?.id === m.team1?.id} />
                            <MatchRow team={m.team2} score={m.score2} winner={m.winner?.id === m.team2?.id} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function MatchRow({ team, score, winner }: any) {
    return (
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center p-1">
                    {team?.logo ? <img src={team.logo} className="w-full h-full object-contain" /> : <Shield size={10} className="text-white/10" />}
                </div>
                <span className={cn("text-[10px] font-black uppercase italic truncate max-w-[120px]", winner ? "text-[#00ff87]" : "text-white/30")}>
                    {team?.name || 'TBD_OPERATOR'}
                </span>
            </div>
            <span className={cn("text-[11px] font-black italic", winner ? "text-[#00ff87]" : "text-white/10")}>{score ?? '-'}</span>
        </div>
    );
}
