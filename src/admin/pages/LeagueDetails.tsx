import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { leagueService, type League, type LeagueParticipant } from '../../services/leagueService';
import { seasonService, type Season } from '../../services/seasonService';
import { Button, Badge } from '../../components/ui/core';
import { ArrowLeft, Trophy, Calendar, Globe, Medal, User, Edit } from 'lucide-react';
import { cn } from '../../lib/utils';
import CreateLeagueModal from '../components/leagues/CreateLeagueModal';

export default function LeagueDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [league, setLeague] = useState<League | null>(null);
    const [standings, setStandings] = useState<LeagueParticipant[]>([]);
    const [activeSeason, setActiveSeason] = useState<Season | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [continentFilter, setContinentFilter] = useState<string>('GLOBAL');

    const CONTINENTS_DATA: Record<string, { label: string }> = {
        GLOBAL: { label: 'GLOBAL' },
        EUROPE: { label: 'EUROPE' },
        AFRICA: { label: 'AFRIQUE' },
        ASIA: { label: 'ASIE' },
        AMERICAS: { label: 'AMÉRIQUES' },
        OCEANIA: { label: 'OCÉANIE' }
    };

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [leagueData, standingsData, seasonsData] = await Promise.all([
                leagueService.getLeagueById(id!),
                leagueService.getLeagueStandings(id!),
                seasonService.getByLeague(id!),
            ]);
            setLeague(leagueData);
            setStandings(standingsData);
            // Pick the ONGOING season, or fall back to the most recent PLANNED one
            const ongoing = seasonsData.find((s: Season) => s.status === 'ONGOING');
            const planned = seasonsData
                .filter((s: Season) => s.status === 'PLANNED')
                .sort((a: Season, b: Season) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
            setActiveSeason(ongoing ?? planned ?? null);
        } catch (error) {
            console.error('Failed to fetch league details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!league) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-white">
                <h2 className="text-2xl font-bold mb-4">League Not Found</h2>
                <Button onClick={() => navigate('/admin/leagues')}>Back to Leagues</Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-8">
            {/* Header area */}
            <div className="bg-[#121212] rounded-xl border border-white/5 p-6">
                <Button variant="ghost" onClick={() => navigate('/admin/leagues')} className="mb-4 pl-0 text-text-muted hover:text-white h-auto p-0 hover:bg-transparent">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Leagues
                </Button>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Badge variant="primary" className="text-[10px] tracking-widest">{league.level}</Badge>
                            {activeSeason && (
                                <Badge variant="secondary" className="text-[10px] tracking-widest">{activeSeason.status}</Badge>
                            )}
                        </div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 leading-none">{league.name}</h1>
                        <div className="flex flex-wrap items-center gap-6 text-text-muted text-sm font-bold">
                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-primary" />
                                <span className="uppercase">{league.regionId}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" />
                                {activeSeason ? (
                                    <span>
                                        <span className="text-white/40 text-xs mr-1">{activeSeason.name} ·</span>
                                        {new Date(activeSeason.startDate).toLocaleDateString()}
                                        {' – '}
                                        {new Date(activeSeason.endDate).toLocaleDateString()}
                                    </span>
                                ) : (
                                    <span className="italic opacity-50">No active season</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={() => setIsEditModalOpen(true)} variant="secondary" className="gap-2 h-10 px-6 uppercase font-bold tracking-widest text-xs">
                            <Edit className="w-4 h-4" /> Edit League
                        </Button>
                    </div>
                </div>
            </div>

            {/* Standings Section */}
            <div className="bg-[#121212] rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-primary" />
                        Standings
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {['GLOBAL', ...Array.from(new Set(standings.map(p =>
                            (typeof p.teamId === 'object' && p.teamId?.region) || p.playerId?.region
                        ).filter(Boolean)))].map(region => (
                            <div
                                key={region as string}
                                onClick={() => setContinentFilter(region as string)}
                                className={cn(
                                    "border px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all duration-300",
                                    continentFilter === region
                                        ? "bg-primary text-black border-primary"
                                        : "bg-white/5 border-white/10 text-text-muted hover:text-white"
                                )}
                            >
                                {region === 'GLOBAL' ? 'GLOBAL' : region}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-8">
                    {standings.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-black uppercase tracking-widest text-[#444] border-b border-white/5">
                                    <th className="pb-4 pl-4 font-black">Rank</th>
                                    <th className="pb-4 font-black">Participant</th>
                                    <th className="pb-4 font-black text-center">Stats</th>
                                    <th className="pb-4 font-black text-right pr-4">Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const filtered = standings.filter(p => {
                                        if (continentFilter === 'GLOBAL') return true;
                                        // Need to check region on team or player
                                        const region = (typeof p.teamId === 'object' && p.teamId?.region) || (p.playerId?.region);
                                        return region === continentFilter;
                                    });

                                    if (filtered.length === 0) {
                                        return (
                                            <tr>
                                                <td colSpan={4} className="py-20 text-center text-text-muted font-bold uppercase tracking-widest text-[10px] opacity-50">
                                                    No participants found for {CONTINENTS_DATA[continentFilter].label}
                                                </td>
                                            </tr>
                                        );
                                    }

                                    return filtered.map((participant, index) => {
                                        const isTeam = !!participant.teamId && typeof participant.teamId === 'object';
                                        const name = isTeam ? (participant.teamId as any).name : (participant.playerId?.nickname || 'Unknown');
                                        const avatar = isTeam ? (participant.teamId as any).logo : (participant.playerId?.avatar || null);
                                        const subText = isTeam ? 'Team' : (participant.playerId?.email || '');

                                        return (
                                            <tr key={participant._id} className="group hover:bg-white/[0.02] transition-colors border-b border-white/[0.03]">
                                                <td className="py-4 pr-4 pl-4 w-16">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black",
                                                        index < 3 ? "bg-white/10 text-white" : "text-[#444]"
                                                    )}>
                                                        {index < 3 ? <Medal className={cn("w-4 h-4", index === 0 ? "text-yellow-400" : index === 1 ? "text-gray-300" : "text-orange-400")} /> : index + 1}
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-surface border border-white/10 flex items-center justify-center overflow-hidden">
                                                            {avatar ? (
                                                                <img src={avatar} className="w-full h-full object-cover" alt={name} />
                                                            ) : (
                                                                isTeam ? <Globe className="w-5 h-5 text-white/50" /> : <User className="w-5 h-5 text-white/50" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white text-sm group-hover:text-primary transition-colors">{name}</p>
                                                            <p className="text-[10px] text-[#444] uppercase font-bold tracking-tight">{subText}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-center">
                                                    <div className="flex items-center justify-center gap-4 text-xs font-bold text-text-muted">
                                                        <span><span className="text-white">{participant.wins}</span> W</span>
                                                        <span><span className="text-white">{participant.draws}</span> D</span>
                                                        <span><span className="text-white">{participant.losses}</span> L</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-right pr-4">
                                                    <span className="text-xl font-black text-white tracking-tighter">{participant.rankPoints || 0}</span>
                                                </td>
                                            </tr>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                            <Trophy className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-20" />
                            <h3 className="text-lg font-bold text-text-muted uppercase tracking-widest">No participants yet</h3>
                        </div>
                    )}
                </div>
            </div>

            <CreateLeagueModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={async (data) => {
                    await leagueService.updateLeague(league._id, data);
                    await fetchData();
                    setIsEditModalOpen(false);
                }}
                league={league}
            />
        </div>
    );
}
