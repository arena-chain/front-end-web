import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Trophy, Users, ArrowLeft, Shield, Share2, Play, Zap, Info, LockKeyhole, Clock, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/core';
import { cn } from '../../lib/utils';
import tournamentService from '../../services/tournamentService';
import { resolveBackendAssetUrl } from '../../lib/apiBase';
import TournamentBracket from '../../admin/components/tournaments/TournamentBracket';
import LevelBadge from '../../components/gamification/LevelBadge';

export default function PlayerTournamentDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (id) {
            fetchTournamentData(id);
        }
    }, [id]);

    const fetchTournamentData = async (tournamentId: string) => {
        setLoading(true);
        try {
            const data = await tournamentService.fetchTournamentById(tournamentId);
            setTournament(data);
        } catch (error) {
            console.error('Failed to fetch tournament', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-grow flex items-center justify-center h-screen bg-[#0a0a0f]">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#00ff88]"></div>
                    <Trophy className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#00ff88]/20" size={24} />
                </div>
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="flex-grow flex items-center justify-center h-screen bg-[#0a0a0f]">
                <div className="text-center">
                    <Trophy className="mx-auto text-white/5 mb-6" size={80} />
                    <h2 className="text-3xl font-black mb-4 text-white uppercase tracking-tighter">Tournament Not Found</h2>
                    <Button variant="outline" onClick={() => navigate('/player/tournaments')} className="border-white/10 hover:bg-white/5">
                        Back to Arena
                    </Button>
                </div>
            </div>
        );
    }

    const isLive = tournament.status === 'ONGOING';
    const bannerUrl = tournament.bannerImageUrl ? resolveBackendAssetUrl(tournament.bannerImageUrl) : null;

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col pb-20">
            {/* BLOCKED Banner */}
            {tournament.status === 'BLOCKED' && (
                <div className="w-full bg-red-600 border-b-2 border-red-800 py-4 px-6 flex items-center justify-center gap-3 sticky top-0 z-50 shadow-[0_4px_30px_rgba(220,38,38,0.4)]">
                    <LockKeyhole className="w-5 h-5 text-white shrink-0" />
                    <p className="text-white font-black uppercase tracking-wider text-sm text-center">
                        This tournament has been <span className="underline">suspended by an administrator</span>. Registration and participation are currently unavailable.
                    </p>
                    <LockKeyhole className="w-5 h-5 text-white shrink-0" />
                </div>
            )}
            {/* PENDING APPROVAL Banner */}
            {tournament.status === 'PENDING_APPROVAL' && (
                <div className="w-full bg-amber-500 border-b-2 border-amber-600 py-4 px-6 flex items-center justify-center gap-3 sticky top-0 z-50">
                    <Clock className="w-5 h-5 text-white shrink-0" />
                    <p className="text-white font-black uppercase tracking-wider text-sm text-center">
                        This tournament is <span className="underline">awaiting administrative approval</span>. Registration will open once validated.
                    </p>
                    <Clock className="w-5 h-5 text-white shrink-0" />
                </div>
            )}
            {/* REJECTED Banner */}
            {tournament.status === 'REJECTED' && (
                <div className="w-full bg-red-600 border-b-2 border-red-800 py-4 px-6 flex items-center justify-center gap-3 sticky top-0 z-50">
                    <XCircle className="w-5 h-5 text-white shrink-0" />
                    <p className="text-white font-black uppercase tracking-wider text-sm text-center">
                        This tournament request has been <span className="underline">rejected</span> by the administration.
                    </p>
                    <XCircle className="w-5 h-5 text-white shrink-0" />
                </div>
            )}
            {/* ── Hero section ───────────────────────────────────────────── */}
            <div className="relative h-[65vh] min-h-[500px] overflow-hidden">
                {/* Background Banner */}
                <div className="absolute inset-0">
                    {bannerUrl ? (
                        <img src={bannerUrl} alt={tournament.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#141419] to-[#0a0a0f]" />
                    )}
                    {/* Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/60 to-transparent" />
                    <div className="absolute inset-0 bg-[#00ff88]/5 mix-blend-overlay" />
                </div>

                <div className="container mx-auto px-8 relative h-full flex flex-col justify-end pb-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                        <div className="max-w-4xl animate-fade-in-up">
                            <Link to="/player/tournaments" className="inline-flex items-center gap-2 mb-8 text-white/40 hover:text-[#00ff88] transition-colors font-black uppercase tracking-widest text-[10px]">
                                <ArrowLeft size={14} /> Back to Arena
                            </Link>

                            <div className="flex flex-wrap gap-3 mb-6">
                                <span className="px-4 py-1.5 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] text-[10px] font-black uppercase tracking-widest">
                                    {tournament.gameId?.title || 'ESPORTS'}
                                </span>
                                <span className={cn(
                                    "px-4 py-1.5 rounded-full backdrop-blur-md border text-[10px] font-black uppercase tracking-widest",
                                    isLive ? "bg-red-500/10 border-red-500/20 text-red-500" :
                                        tournament.status === 'PENDING_APPROVAL' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                                            tournament.status === 'REJECTED' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                                                "bg-white/5 border-white/10 text-white/40"
                                )}>
                                    {tournament.status.replace('_', ' ')}
                                </span>
                            </div>

                            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-6 leading-none text-white drop-shadow-2xl">
                                {tournament.name}
                            </h1>

                            <div className="flex flex-wrap gap-8 text-white/60">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                        <Trophy className="text-[#00ff88]" size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Prize Pool</p>
                                        <p className="text-lg font-black text-white">${tournament.prizePool?.toLocaleString() || '0'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                        <Calendar className="text-[#00ff88]" size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Event Date</p>
                                        <p className="text-lg font-black text-white">
                                            {new Date(tournament.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                        <Users className="text-[#00ff88]" size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Participants</p>
                                        <p className="text-lg font-black text-white">{tournament.currentTeams || 0} / {tournament.maxTeams} Teams</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Player Console */}
                        <div className="w-full md:w-80 shrink-0 animate-fade-in-up delay-100">
                            <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl">
                                <div className="flex items-center justify-between mb-6">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Your Status</p>
                                    <LevelBadge level={15} currentXP={750} size="sm" />
                                </div>
                                <div className="space-y-3">
                                    {tournament.status === 'OPEN_REGISTRATION' && (
                                        <Button className="w-full py-6 rounded-2xl bg-[#00ff88] text-black hover:bg-[#00ff88]/90 font-black uppercase tracking-widest text-xs shadow-[0_0_30px_rgba(0,255,136,0.3)]">
                                            <Zap size={16} className="mr-2 fill-current" /> Join Tournament
                                        </Button>
                                    )}
                                    {(tournament.status === 'BLOCKED' || tournament.status === 'REJECTED') && (
                                        <div className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-black uppercase tracking-widest text-[10px]">
                                            <LockKeyhole size={14} /> Access Restricted
                                        </div>
                                    )}
                                    {tournament.status === 'PENDING_APPROVAL' && (
                                        <div className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 font-black uppercase tracking-widest text-[10px]">
                                            <Clock size={14} /> Under Review
                                        </div>
                                    )}
                                    {isLive && (
                                        <Button className="w-full py-6 rounded-2xl bg-red-500 text-white hover:bg-red-600 font-black uppercase tracking-widest text-xs">
                                            <Play size={16} className="mr-2 fill-current" /> Watch Broadcast
                                        </Button>
                                    )}
                                    <Button variant="outline" className="w-full py-6 rounded-2xl border-white/10 text-white/60 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-xs">
                                        <Share2 size={16} className="mr-2" /> Share Event
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Content Grid ───────────────────────────────────────────── */}
            <div className="container mx-auto px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Feed */}
                    <div className="lg:col-span-2 space-y-16">
                        {/* Tournament Bracket */}
                        <section>
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Visual <span className="text-[#00ff88]">Bracket</span></h2>
                                <div className="flex items-center gap-2 text-white/20 text-[10px] font-black uppercase tracking-widest">
                                    <Info size={14} /> Interactive Tree
                                </div>
                            </div>
                            <div className="rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
                                <TournamentBracket tournament={tournament} isAdmin={false} />
                            </div>
                        </section>

                        {/* Participating Teams */}
                        <section>
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-8">Elite <span className="text-[#00ff88]">Participants</span></h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {tournament.teams?.map((team: any) => (
                                    <div key={team._id} className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-[#00ff88]/30 transition-all text-center group">
                                        <div className="relative w-16 h-16 mx-auto mb-4">
                                            <div className="absolute inset-0 bg-[#00ff88]/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="relative w-full h-full rounded-full bg-black/40 border border-white/10 p-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                {team.logo ? (
                                                    <img src={team.logo} alt={team.name} className="max-w-full max-h-full object-contain" />
                                                ) : (
                                                    <Shield size={24} className="text-white/20" />
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm font-black text-white uppercase tracking-tight truncate">{team.name}</p>
                                        <p className="text-[10px] font-bold text-white/20 mt-1 uppercase tracking-widest">Seed #{team.seed || '?'}</p>
                                    </div>
                                ))}
                                {(!tournament.teams || tournament.teams.length === 0) && (
                                    <div className="col-span-full py-12 rounded-3xl border border-dashed border-white/10 text-center">
                                        <Users className="mx-auto text-white/10 mb-4" size={40} />
                                        <p className="text-white/30 font-bold uppercase tracking-widest text-xs">Waiting for participants to join...</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar Information */}
                    <div className="space-y-8">
                        {/* Rules & Info */}
                        <div className="p-8 rounded-[2.5rem] bg-[#141419] border border-white/5">
                            <h3 className="text-xl font-black uppercase tracking-tighter text-white mb-6">Tournament <span className="text-[#00ff88]">Rules</span></h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Format</p>
                                    <p className="text-sm font-bold text-white/80">{tournament.format?.replace('_', ' ') || 'Single Elimination'}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Description</p>
                                    <p className="text-sm text-white/40 leading-relaxed font-medium">
                                        {tournament.description || 'No specific rules provided for this tournament.'}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Support</p>
                                    <button className="text-xs font-black text-[#00ff88] uppercase tracking-widest hover:underline">
                                        Contact Admin
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity / Shoutouts (MOCKED) */}
                        <div className="p-8 rounded-[2.5rem] bg-[#141419] border border-white/5">
                            <h3 className="text-xl font-black uppercase tracking-tighter text-white mb-6">Arena <span className="text-[#00ff88]">Feed</span></h3>
                            <div className="space-y-6">
                                {[
                                    { user: 'Kaelith', action: 'joined the arena', time: '12m ago' },
                                    { user: 'NexusPro', action: 'secured seed #4', time: '45m ago' },
                                    { user: 'EliteBot', action: 'updated rules', time: '2h ago' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] text-white/60 truncate">
                                                <span className="font-bold text-white">{item.user}</span> {item.action}
                                            </p>
                                            <p className="text-[9px] text-white/20 uppercase tracking-widest font-black">{item.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

