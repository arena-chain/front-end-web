import { useState, useEffect } from 'react';
import { Plus, Trophy, Search, Loader2, Award, Users, Globe, Calendar, User, Edit2, Trash2 } from 'lucide-react';
import { Button, Input } from '../../components/ui/core';
import { leagueService, type League, LeagueLevel, LeagueStatus } from '../../services/leagueService';
import CreateLeagueModal from '../components/leagues/CreateLeagueModal';
import { cn } from '../../lib/utils';

export default function AdminLeagues() {
    const [leagues, setLeagues] = useState<League[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingLeague, setEditingLeague] = useState<League | null>(null);
    const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
    const [levelFilter, setLevelFilter] = useState<LeagueLevel | 'all'>('all');

    // Standings state
    const [standings, setStandings] = useState<any[]>([]);
    const [standingsLoading, setStandingsLoading] = useState(false);

    useEffect(() => {
        fetchLeagues();
    }, []);

    useEffect(() => {
        if (selectedLeague) {
            fetchStandings(selectedLeague._id);
        }
    }, [selectedLeague]);

    const fetchLeagues = async () => {
        setLoading(true);
        try {
            const data = await leagueService.getAllLeagues();
            setLeagues(data);
            if (data.length > 0 && !selectedLeague) {
                setSelectedLeague(data[0]);
            }
        } catch (error) {
            console.error('Failed to fetch leagues:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStandings = async (leagueId: string) => {
        setStandingsLoading(true);
        try {
            const data = await leagueService.getLeagueStandings(leagueId);
            setStandings(data);
        } catch (error) {
            console.error('Failed to fetch standings:', error);
        } finally {
            setStandingsLoading(false);
        }
    };

    const handleCreateLeague = async (data: any) => {
        try {
            if (editingLeague) {
                await leagueService.updateLeague(editingLeague._id, data);
                alert('League updated successfully!');
                const refreshed = await leagueService.getAllLeagues();
                setLeagues(refreshed);
                const found = refreshed.find((l: League) => l._id === editingLeague._id);
                if (found) setSelectedLeague(found);
            } else {
                await leagueService.createLeague(data);
                alert('League created successfully!');
                await fetchLeagues();
            }
            setIsCreateModalOpen(false);
            setEditingLeague(null);
        } catch (error: any) {
            console.error('Failed to save league:', error);
            throw error;
        }
    };

    const handleEditLeague = () => {
        if (!selectedLeague) return;
        setEditingLeague(selectedLeague);
        setIsCreateModalOpen(true);
    };

    const handleDeleteLeague = async () => {
        if (!selectedLeague) return;
        if (!confirm(`Are you sure you want to delete "${selectedLeague.name}"? This will remove all participants as well.`)) return;
        try {
            await leagueService.deleteLeague(selectedLeague._id);
            setSelectedLeague(null);
            setStandings([]);
            await fetchLeagues();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDistributeRewards = async () => {
        if (!selectedLeague) return;
        if (!confirm('Are you sure you want to distribute rewards for this league? This will credit points to all winners.')) return;
        try {
            await leagueService.distributeRewards(selectedLeague._id);
            alert('Rewards distributed successfully!');
            fetchLeagues();
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Distribution failed';
            alert('Error: ' + msg);
        }
    };

    const filteredLeagues = leagues.filter((l: League) => {
        const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLevel = levelFilter === 'all' || l.level === levelFilter;
        return matchesSearch && matchesLevel;
    });

    const levelColors: Record<string, string> = {
        INTERNATIONAL: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        CONTINENTAL: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        NATIONAL: 'bg-green-500/10 text-green-400 border-green-500/20',
        REGIONAL: 'bg-white/5 text-text-muted border-white/10',
    };


    return (
        <div className="flex flex-col h-full animate-fade-in-up gap-0">
            {/* Top header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-1">Leagues</h1>
                    <p className="text-text-muted text-sm">Manage your leagues, standings, and rewards distribution.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {selectedLeague?.status === LeagueStatus.FINISHED && !selectedLeague?.rewardsDistributed && (
                        <Button
                            size="sm"
                            className="gap-2 bg-orange-500 hover:bg-orange-600 text-black font-black uppercase tracking-widest text-[11px]"
                            onClick={handleDistributeRewards}
                        >
                            <Award className="w-4 h-4" />
                            Distribute Rewards
                        </Button>
                    )}
                    {selectedLeague && (
                        <>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="gap-2 font-bold uppercase tracking-widest text-[11px]"
                                onClick={handleEditLeague}
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                                Edit League
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2 font-bold uppercase tracking-widest text-[11px] text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                onClick={handleDeleteLeague}
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                            </Button>
                        </>
                    )}
                    <Button className="gap-2" onClick={() => { setEditingLeague(null); setIsCreateModalOpen(true); }}>
                        <Plus className="w-4 h-4" />
                        Create League
                    </Button>
                </div>
            </div>

            {/* Main split layout */}
            <div className="flex gap-4 flex-1 min-h-0" style={{ height: 'calc(100vh - 220px)' }}>
                {/* Left sidebar: League list */}
                <div className="w-72 flex-shrink-0 flex flex-col gap-3 overflow-hidden">
                    {/* Search + filter */}
                    <div className="flex flex-col gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <Input
                                placeholder="Search leagues..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 text-sm h-9"
                            />
                        </div>
                        <select
                            value={levelFilter}
                            onChange={(e) => setLevelFilter(e.target.value as any)}
                            className="bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary w-full"
                        >
                            <option value="all">All Levels</option>
                            {Object.values(LeagueLevel).map((lvl) => (
                                <option key={lvl} value={lvl}>{lvl}</option>
                            ))}
                        </select>
                    </div>

                    {/* League items */}
                    <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                            </div>
                        ) : filteredLeagues.length === 0 ? (
                            <div className="text-center py-10 text-text-muted text-xs uppercase font-bold tracking-widest opacity-50">
                                No leagues found
                            </div>
                        ) : filteredLeagues.map((league) => (
                            <button
                                key={league._id}
                                onClick={() => setSelectedLeague(league)}
                                className={cn(
                                    "w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 group",
                                    selectedLeague?._id === league._id
                                        ? "bg-primary/10 border-primary/40"
                                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                                )}
                            >
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className={cn(
                                        "font-black text-sm uppercase tracking-tight truncate",
                                        selectedLeague?._id === league._id ? "text-primary" : "text-white group-hover:text-primary transition-colors"
                                    )}>
                                        {league.name}
                                    </span>
                                    <span className={cn(
                                        "text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border flex-shrink-0",
                                        levelColors[league.level] || 'bg-white/5 text-text-muted border-white/10'
                                    )}>
                                        {league.level}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-bold text-text-muted uppercase">
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {league.format}
                                    </span>
                                    <span className={cn(
                                        league.status === LeagueStatus.ONGOING ? 'text-green-500' :
                                            league.status === LeagueStatus.REGISTRATION ? 'text-blue-500' : 'text-text-muted'
                                    )}>
                                        {league.status}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Standings panel */}
                <div className="flex-1 bg-[#0f0f0f] border border-white/5 rounded-xl overflow-hidden flex flex-col min-w-0">
                    {!selectedLeague ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
                            <Trophy className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm font-bold uppercase tracking-widest opacity-50">Select a league to view standings</p>
                        </div>
                    ) : (
                        <>
                            {/* Panel header */}
                            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex flex-col gap-3">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                            {selectedLeague.name}
                                            <span className={cn(
                                                "text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest border",
                                                levelColors[selectedLeague.level] || 'bg-white/5 text-text-muted border-white/10'
                                            )}>
                                                {selectedLeague.level}
                                            </span>
                                        </h2>
                                        <div className="flex items-center gap-4 mt-1 text-[11px] font-bold text-text-muted uppercase">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {selectedLeague.format}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(selectedLeague.startDate).toLocaleDateString()} – {new Date(selectedLeague.endDate).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Globe className="w-3 h-3" />
                                                {selectedLeague.regionId || 'Global'}
                                            </span>
                                            <span className={cn(
                                                selectedLeague.status === LeagueStatus.ONGOING ? 'text-green-500' :
                                                    selectedLeague.status === LeagueStatus.REGISTRATION ? 'text-blue-500' : 'text-text-muted'
                                            )}>
                                                {selectedLeague.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-text-muted text-[11px] font-bold">
                                        <div className="bg-primary/10 border border-primary/20 text-primary px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">
                                            {selectedLeague.maxTeams} Teams Max
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Standings table */}
                            <div className="flex-1 overflow-y-auto">
                                {standingsLoading ? (
                                    <div className="flex justify-center py-20">
                                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                    </div>
                                ) : (
                                    <div className="p-4 space-y-1.5">
                                        {/* Column headers */}
                                        <div className="grid grid-cols-[48px_1fr_56px_56px_56px_56px_64px] items-center px-4 pb-2 gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted text-center">#</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Team / Player</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted text-center">MP</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-green-500/70 text-center">W</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500/70 text-center">D</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-red-500/70 text-center">L</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/80 text-center">PTS</span>
                                        </div>

                                        {standings.length > 0 ? standings.map((participant, index) => {
                                            const isTeam = !!participant.teamId && typeof participant.teamId === 'object';
                                            const name = isTeam
                                                ? (participant.teamId as any).name
                                                : (participant.playerId?.nickname || 'Unknown');
                                            const avatar = isTeam
                                                ? (participant.teamId as any).logo
                                                : (participant.playerId?.avatar || null);
                                            const subText = isTeam ? 'Team' : (participant.playerId?.email || '');

                                            const mp = participant.matchesPlayed ?? 0;
                                            const wins = participant.wins ?? 0;
                                            const draws = participant.draws ?? 0;
                                            const losses = participant.losses ?? 0;
                                            const pts = participant.rankPoints ?? participant.points ?? 0;

                                            const positionStyle =
                                                index === 0 ? { border: 'border-yellow-500/40', bg: 'bg-yellow-500/5', badge: 'bg-yellow-500 text-black', glow: 'shadow-[0_0_12px_rgba(234,179,8,0.15)]', avatar: 'border-yellow-500/30 bg-yellow-500/10', pts: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20' } :
                                                index === 1 ? { border: 'border-slate-400/40', bg: 'bg-slate-400/5', badge: 'bg-slate-400 text-black', glow: 'shadow-[0_0_12px_rgba(148,163,184,0.1)]', avatar: 'border-slate-400/30 bg-slate-400/10', pts: 'bg-slate-400/10 text-slate-300 border border-slate-400/20' } :
                                                index === 2 ? { border: 'border-orange-600/40', bg: 'bg-orange-600/5', badge: 'bg-orange-600 text-white', glow: 'shadow-[0_0_12px_rgba(234,88,12,0.1)]', avatar: 'border-orange-600/30 bg-orange-600/10', pts: 'bg-orange-600/10 text-orange-400 border border-orange-600/20' } :
                                                { border: 'border-white/5', bg: '', badge: 'bg-white/10 text-text-muted', glow: '', avatar: 'border-white/10 bg-white/5', pts: 'bg-primary/10 text-primary border border-primary/20' };

                                            return (
                                                <div
                                                    key={participant._id}
                                                    className={cn(
                                                        "grid grid-cols-[48px_1fr_56px_56px_56px_56px_64px] items-center px-4 py-3 rounded-xl border transition-all duration-200 gap-2 group hover:bg-white/[0.03] hover:border-white/10",
                                                        positionStyle.border, positionStyle.bg, positionStyle.glow
                                                    )}
                                                >
                                                    <div className="flex justify-center">
                                                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black", positionStyle.badge)}>
                                                            {index + 1}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 border", positionStyle.avatar)}>
                                                            {avatar ? <img src={avatar} className="w-full h-full object-cover" alt={name} /> : isTeam ? <Globe className="w-4 h-4 text-white/40" /> : <User className="w-4 h-4 text-white/40" />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-black text-white text-sm truncate group-hover:text-primary transition-colors">{name}</p>
                                                            <p className="text-[10px] text-text-muted uppercase font-bold tracking-tight truncate">{subText}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-center"><span className="text-sm font-bold text-text-muted">{mp}</span></div>
                                                    <div className="text-center"><span className={cn("text-sm font-black", wins > 0 ? "text-green-400" : "text-text-muted")}>{wins}</span></div>
                                                    <div className="text-center"><span className={cn("text-sm font-black", draws > 0 ? "text-yellow-400" : "text-text-muted")}>{draws}</span></div>
                                                    <div className="text-center"><span className={cn("text-sm font-black", losses > 0 ? "text-red-400" : "text-text-muted")}>{losses}</span></div>
                                                    <div className="text-center">
                                                        <div className={cn("inline-flex items-center justify-center min-w-[42px] px-2.5 py-1 rounded-lg font-black text-sm", positionStyle.pts)}>{pts}</div>
                                                    </div>
                                                </div>
                                            );
                                        }) : Array.from({ length: selectedLeague.maxTeams || 8 }).map((_, index) => {
                                            const skeletonStyle =
                                                index === 0 ? { border: 'border-yellow-500/20', bg: 'bg-yellow-500/[0.03]', badge: 'bg-yellow-500/20 text-yellow-500/40' } :
                                                index === 1 ? { border: 'border-slate-400/20', bg: 'bg-slate-400/[0.03]', badge: 'bg-slate-400/20 text-slate-400/40' } :
                                                index === 2 ? { border: 'border-orange-600/20', bg: 'bg-orange-600/[0.03]', badge: 'bg-orange-600/20 text-orange-600/40' } :
                                                { border: 'border-white/[0.04]', bg: '', badge: 'bg-white/5 text-white/10' };

                                            return (
                                                <div
                                                    key={index}
                                                    className={cn(
                                                        "grid grid-cols-[48px_1fr_56px_56px_56px_56px_64px] items-center px-4 py-3 rounded-xl border gap-2",
                                                        skeletonStyle.border, skeletonStyle.bg
                                                    )}
                                                >
                                                    {/* Position */}
                                                    <div className="flex justify-center">
                                                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black", skeletonStyle.badge)}>
                                                            {index + 1}
                                                        </div>
                                                    </div>
                                                    {/* Name skeleton */}
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex-shrink-0" />
                                                        <div className="space-y-1.5 min-w-0 flex-1">
                                                            <div className="h-3 rounded bg-white/[0.06] w-28" />
                                                            <div className="h-2 rounded bg-white/[0.04] w-16" />
                                                        </div>
                                                    </div>
                                                    {/* Stats skeletons */}
                                                    {[...Array(4)].map((__, i) => (
                                                        <div key={i} className="flex justify-center">
                                                            <div className="h-4 w-5 rounded bg-white/[0.04]" />
                                                        </div>
                                                    ))}
                                                    {/* PTS skeleton */}
                                                    <div className="flex justify-center">
                                                        <div className="h-6 w-10 rounded-lg bg-white/[0.04]" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <CreateLeagueModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setEditingLeague(null);
                }}
                onSubmit={handleCreateLeague}
                league={editingLeague || undefined}
            />
        </div>
    );
}
