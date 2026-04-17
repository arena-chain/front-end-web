import { useState, useEffect } from 'react';
import { Search, Calendar, Trophy, Users, Video, Zap, Clock, Shield, Plus, LockKeyhole, XCircle } from 'lucide-react';
import type { Tournament } from '../../models/tournament';
import tournamentService from '../../services/tournamentService';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/core';
import { resolveBackendAssetUrl } from '../../lib/apiBase';
import LevelBadge from '../../components/gamification/LevelBadge';
import PlayerCreateTournamentModal from '../components/PlayerCreateTournamentModal';
import { toast } from 'sonner';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; color: string; bg: string; border: string; dot?: boolean }> = {
    ONGOING: { label: 'LIVE', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', dot: true },
    OPEN_REGISTRATION: { label: 'REGISTERING', color: '#00ff88', bg: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.25)' },
    UPCOMING: { label: 'UPCOMING', color: '#00ff88', bg: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.25)' },
    COMPLETED: { label: 'ENDED', color: '#ffffff33', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
    BLOCKED: { label: 'SUSPENDED', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', dot: true },
    PENDING_APPROVAL: { label: 'PENDING', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
    REJECTED: { label: 'REJECTED', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
};

const STATUS_TABS = [
    { value: 'all', label: 'All', icon: <Shield size={12} /> },
    { value: 'PENDING_APPROVAL', label: 'Pending', icon: <Clock size={12} /> },
    { value: 'ONGOING', label: 'Live', icon: <Video size={12} /> },
    { value: 'OPEN_REGISTRATION', label: 'Open', icon: <Zap size={12} /> },
    { value: 'UPCOMING', label: 'Upcoming', icon: <Clock size={12} /> },
    { value: 'COMPLETED', label: 'Ended', icon: <Trophy size={12} /> },
];

export default function PlayerTournaments() {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        tournamentService.fetchTournaments()
            .then(data => setTournaments(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleCreateTournament = async (data: any) => {
        try {
            await tournamentService.createTournament(data);
            toast.success('TOURNAMENT DEPLOYED', {
                description: 'Your event has been initialized across all nodes.',
            });
            setIsCreateModalOpen(false);
            // Refresh list
            const updated = await tournamentService.fetchTournaments();
            setTournaments(updated);
        } catch (error) {
            toast.error('DEPLOYMENT FAILED', {
                description: 'Strategic error during initialization.',
            });
        }
    };

    const filtered = tournaments.filter(t => {
        const gameTitle = typeof t.gameId === 'object' ? (t.gameId as any)?.title ?? '' : '';
        const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || gameTitle.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || t.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const liveCount = tournaments.filter(t => t.status === 'ONGOING').length;
    const openCount = tournaments.filter(t => t.status === 'OPEN_REGISTRATION').length;

    return (
        <div className="flex flex-col gap-6 h-full overflow-y-auto animate-fade-in-up p-4">

            {/* ── Hero header ───────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-[2rem] shrink-0"
                style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #141419 100%)', border: '1px solid rgba(255,255,255,0.05)' }}>
                {/* Neon Glow */}
                <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-[120px] pointer-events-none bg-[#00ff88]/5" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full blur-[120px] pointer-events-none bg-red-500/5" />

                <div className="relative px-8 py-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-4">
                            {liveCount > 0 && (
                                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    {liveCount} LIVE EVENTS
                                </span>
                            )}
                            {openCount > 0 && (
                                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88]">
                                    <Zap size={10} className="fill-current" />
                                    {openCount} OPEN REGISTRATIONS
                                </span>
                            )}
                        </div>
                        <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-none mb-3">
                            Arena <span className="text-[#00ff88]">Tournaments</span>
                        </h1>
                        <p className="text-sm text-white/30 font-medium max-w-xl mb-6">
                            The ultimate battleground for elite creators. Compete in community tournaments,
                            rank up your global level, and secure exclusive block-chain backed rewards.
                        </p>
                    </div>

                    {/* Stats & Level */}
                    <div className="flex flex-col items-end gap-6">
                        <div className="flex items-center gap-6">
                            <div className="flex gap-4">
                                {[
                                    { label: 'Tournaments', value: tournaments.length, color: '#white' },
                                    { label: 'Wins', value: '12', color: '#00ff88' },
                                ].map(s => (
                                    <div key={s.label} className="flex flex-col items-center justify-center min-w-[100px] px-5 py-4 rounded-2xl bg-white/5 border border-white/10">
                                        <span className="text-2xl font-black leading-none" style={{ color: s.color }}>{s.value}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest mt-1.5 text-white/30">{s.label}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="h-20 w-px bg-white/10 hidden md:block" />
                            <div className="hidden md:block">
                                <LevelBadge level={15} currentXP={750} size="lg" />
                            </div>
                        </div>

                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="h-12 px-8 bg-white/5 border border-white/10 text-white/60 font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#00ff88] hover:text-black hover:border-transparent transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)] group"
                        >
                            <Plus size={16} className="mr-3 group-hover:rotate-90 transition-transform duration-500" />
                            Organize Tournament
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── Filter bar ────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                {/* Search */}
                <div className="relative flex-1 group">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#00ff88] transition-colors" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search tournament, game or creator..."
                        className="w-full rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white placeholder-white/20 outline-none transition-all duration-300 bg-[#141419] border border-white/5 focus:border-[#00ff88]/50 focus:shadow-[0_0_30px_rgba(0,255,136,0.05)]"
                    />
                </div>

                {/* Status tabs */}
                <div className="flex gap-1.5 p-1.5 rounded-2xl shrink-0 bg-[#141419] border border-white/5">
                    {STATUS_TABS.map(tab => {
                        const sc = STATUS[tab.value];
                        const active = statusFilter === tab.value;
                        return (
                            <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                                    active ? "bg-white/10 text-white shadow-lg" : "text-white/30 hover:text-white hover:bg-white/5"
                                )}
                                style={{
                                    border: active ? `1px solid ${sc?.border ?? 'rgba(255,255,255,0.1)'}` : '1px solid transparent',
                                    color: active ? (sc?.color ?? '#ffffff') : 'undefined'
                                }}>
                                {tab.icon}
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Grid ──────────────────────────────────────────────────── */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="rounded-[2rem] overflow-hidden animate-pulse bg-[#141419] border border-white/5" style={{ height: 350 }}>
                            <div className="h-48 bg-white/5" />
                            <div className="p-6 space-y-4">
                                <div className="h-4 rounded bg-white/10 w-24" />
                                <div className="h-6 rounded bg-white/10 w-48" />
                                <div className="h-4 rounded bg-white/5 w-40" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
                    {filtered.map((t) => (
                        <TournamentCard
                            key={t._id}
                            tournament={t}
                            onClick={() => navigate(`/player/tournaments/${t._id}`)}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 rounded-[3rem] border border-dashed border-white/10 bg-[#0a0a0f]">
                    <Trophy size={64} className="text-white/10 mb-6" />
                    <div className="text-center">
                        <p className="text-lg font-black uppercase tracking-widest text-white/40">No Tournaments Recieved</p>
                        <p className="text-sm text-white/20 mt-2">Adjust your filters to see more glory</p>
                    </div>
                </div>
            )}

            <PlayerCreateTournamentModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateTournament}
            />
        </div>
    );
}

// ─── Tournament Card ──────────────────────────────────────────────────────────

function TournamentCard({ tournament, onClick }: { tournament: Tournament; onClick: () => void }) {
    const [hovered, setHovered] = useState(false);

    const imgUrl = (() => {
        const url = tournament.bannerImageUrl;
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return resolveBackendAssetUrl(url);
    })();

    const gameTitle = typeof tournament.gameId === 'object' ? (tournament.gameId as any)?.title ?? 'ESPORTS' : 'ESPORTS';
    const sc = STATUS[tournament.status] ?? STATUS.UPCOMING;
    const fill = tournament.maxTeams > 0 ? (tournament.currentTeams / tournament.maxTeams) * 100 : 0;
    const isLive = tournament.status === 'ONGOING';

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: '#141419',
                border: `1px solid ${hovered ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.05)'}`,
                boxShadow: hovered ? '0 0 40px rgba(0,255,136,0.05)' : 'none',
                transform: hovered ? 'translateY(-4px)' : 'none',
            }}
        >
            {/* Banner */}
            <div className="relative h-48 overflow-hidden">
                {imgUrl ? (
                    <img src={imgUrl} alt={tournament.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1a1a24] to-[#0a0a0f] flex items-center justify-center">
                        <Trophy size={64} className="text-white/5" />
                    </div>
                )}

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#141419] via-transparent to-transparent opacity-80" />

                {/* Status Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest transition-colors"
                    style={{ background: sc.bg, color: sc.color }}>
                    {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                    {sc.label}
                </div>

                {/* Game / Mode Badge */}
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-xl backdrop-blur-md bg-black/40 border border-white/10 text-[10px] font-black text-white/60 uppercase tracking-widest">
                    {gameTitle}
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-6">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-4 leading-tight group-hover:text-[#00ff88] transition-colors">
                    {tournament.name}
                </h3>

                {/* Metadata */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-white/40">
                        <Calendar size={14} className="text-[#00ff88]" />
                        <span>{new Date(tournament.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-white/10" />
                    <div className="flex items-center gap-2 text-xs font-bold text-white/40">
                        <Users size={14} className="text-[#00ff88]" />
                        <span>{tournament.currentTeams} / {tournament.maxTeams} TEAMS</span>
                    </div>
                </div>

                {/* Progress */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">REGISTRATION FILL</span>
                        <span className="text-[10px] font-black text-[#00ff88]">{Math.round(fill)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#00ff88] to-[#00ff88]/50 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(0,255,136,0.3)]"
                            style={{ width: `${fill}%` }}
                        />
                    </div>
                </div>

                {/* Action */}
                <button
                    className={cn(
                        "mt-auto w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                        tournament.status === 'BLOCKED' || tournament.status === 'REJECTED' || tournament.status === 'PENDING_APPROVAL'
                            ? "bg-red-500/10 text-red-500 border border-red-500/20 cursor-not-allowed"
                            : isLive
                                ? "bg-red-500 text-white hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                                : "bg-white/5 text-white/60 hover:bg-[#00ff88] hover:text-black border border-white/5 hover:border-transparent"
                    )}
                    disabled={tournament.status === 'BLOCKED' || tournament.status === 'REJECTED' || tournament.status === 'PENDING_APPROVAL'}
                >
                    {tournament.status === 'BLOCKED' ? (
                        <><LockKeyhole size={14} /> TOURNAMENT SUSPENDED</>
                    ) : tournament.status === 'REJECTED' ? (
                        <><XCircle size={14} /> TOURNAMENT REJECTED</>
                    ) : tournament.status === 'PENDING_APPROVAL' ? (
                        <><Clock size={14} /> AWAITING APPROVAL</>
                    ) : isLive ? (
                        <><Video size={14} /> WATCH LIVE BROADCAST</>
                    ) : (
                        tournament.status === 'OPEN_REGISTRATION' ? <><Zap size={14} className="fill-current" /> JOIN TOURNAMENT</> : <>VIEW EVENT DETAILS</>
                    )}
                </button>
            </div>
        </div>
    );
}
