import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/core';
import { Trophy, Users, Globe, Calendar, Loader2, X, History as HistoryIcon, Clock } from 'lucide-react';
import { leagueService, type League, type LeagueParticipant } from '../../services/leagueService';
import { cn } from '../../lib/utils';

export default function PlayerLeagues() {
    const [activeTab, setActiveTab] = useState<'all' | 'schedule' | 'history'>('all');
    const [leagues, setLeagues] = useState<League[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLeague, setSelectedLeague] = useState<{ id: string, name: string } | null>(null);
    const [standings, setStandings] = useState<LeagueParticipant[]>([]);
    const [standingsLoading, setStandingsLoading] = useState(false);
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
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'all') {
                const data = await leagueService.getAllLeagues();
                setLeagues(data);
            } else {
                const data = await leagueService.getMyLeagues();
                if (activeTab === 'schedule') {
                    setLeagues(data.filter((l: League) => l.status !== 'FINISHED'));
                } else {
                    setLeagues(data.filter((l: League) => l.status === 'FINISHED'));
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (id: string) => {
        try {
            await leagueService.registerForLeague(id);
            alert('Successfully registered for the league!');
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to register');
        }
    };

    const fetchStandings = async (id: string, name: string) => {
        setSelectedLeague({ id, name });
        setStandingsLoading(true);
        try {
            const data = await leagueService.getLeagueStandings(id);
            setStandings(data);
        } catch (err) {
            console.error(err);
        } finally {
            setStandingsLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white">Official Leagues</h1>
                    <p className="text-text-muted uppercase tracking-widest text-xs font-bold mt-2">Platform Controlled Ranking Seasons</p>
                </div>

                <div className="flex bg-surface/50 p-1 rounded-xl border border-white/5">
                    <TabButton
                        active={activeTab === 'all'}
                        onClick={() => setActiveTab('all')}
                        icon={<Globe size={14} />}
                        label="All Leagues"
                    />
                    <TabButton
                        active={activeTab === 'schedule'}
                        onClick={() => setActiveTab('schedule')}
                        icon={<Clock size={14} />}
                        label="My Schedule"
                    />
                    <TabButton
                        active={activeTab === 'history'}
                        onClick={() => setActiveTab('history')}
                        icon={<HistoryIcon size={14} />}
                        label="History"
                    />
                </div>
            </header>

            {loading ? (
                <div className="flex h-[40vh] items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            ) : leagues.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-30 grayscale bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <Trophy className="w-16 h-16" />
                    <p className="text-sm font-black uppercase tracking-widest text-center">
                        {activeTab === 'all' ? 'No active leagues found' :
                            activeTab === 'schedule' ? 'You haven\'t joined any active leagues yet' :
                                'No league history available'}
                    </p>
                    {activeTab !== 'all' && (
                        <Button size="sm" variant="outline" onClick={() => setActiveTab('all')}>Browse Leagues</Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {leagues.map((league) => (
                        <div key={league._id} className="bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden group hover:border-primary/50 transition-all duration-300">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <span className="bg-primary/20 text-primary text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-widest border border-primary/30">
                                        {league.tier}
                                    </span>
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-widest",
                                        league.status === 'ONGOING' ? 'text-green-500' :
                                            league.status === 'UPCOMING' ? 'text-blue-500' : 'text-text-muted'
                                    )}>
                                        {league.status}
                                    </span>
                                </div>

                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-6 group-hover:text-primary transition-colors leading-none">
                                    {league.name}
                                </h3>

                                <div className="flex flex-col gap-4 mb-8">
                                    <div className="flex items-center gap-3 text-xs text-text-muted font-bold tracking-tight">
                                        <Globe className="w-4 h-4 text-primary/80" />
                                        <span className="uppercase">{league.regionFilter}: {league.regionValue || 'Global'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-text-muted font-bold tracking-tight">
                                        <Users className="w-4 h-4 text-blue-400/80" />
                                        <span className="uppercase">{league.mode}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-text-muted font-bold tracking-tight">
                                        <Calendar className="w-4 h-4 text-orange-400/80" />
                                        <span>{new Date(league.startDate).toLocaleDateString()} - {new Date(league.endDate).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    {activeTab === 'all' && (
                                        <Button
                                            size="lg"
                                            className="flex-[2] bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-widest rounded-lg shadow-[0_0_20px_rgba(0,255,0,0.2)]"
                                            onClick={() => handleJoin(league._id)}
                                            disabled={league.status !== 'UPCOMING'}
                                        >
                                            {league.status === 'ONGOING' ? 'Enter' : 'Register'}
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className={cn(
                                            "flex-1 gap-2 border-primary/50 text-primary hover:bg-primary/10 font-bold uppercase tracking-widest rounded-lg",
                                            activeTab !== 'all' && "w-full"
                                        )}
                                        onClick={() => fetchStandings(league._id, league.name)}
                                    >
                                        <Trophy className="w-4 h-4" />
                                        Ranking
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Standings Modal / Leaderboard View */}
            {selectedLeague && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-8 bg-black/95 backdrop-blur-md overflow-hidden">
                    <div className="bg-[#0b0b0b] w-full max-w-6xl h-full md:h-auto md:max-h-[90vh] flex flex-col shadow-2xl animate-scale-in border border-white/5 rounded-none md:rounded-3xl overflow-hidden">

                        {/* Mock Top bar from image */}
                        <div className="bg-[#121212] px-8 py-4 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center cursor-pointer hover:bg-white/20" onClick={() => setSelectedLeague(null)}>
                                    <X className="w-4 h-4 text-white/50" />
                                </div>
                                <span className="text-white font-black text-xs uppercase tracking-tighter">{selectedLeague?.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                                    <Trophy className="w-4 h-4 text-primary" />
                                </div>
                            </div>
                        </div>

                        {/* Breadcrumbs / Title */}
                        <div className="px-8 pt-8">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                    {selectedLeague?.name}
                                </h2>
                                <div className="flex flex-col gap-4">
                                    {/* Continent Level */}
                                    <div className="flex flex-wrap gap-2">
                                        {Object.keys(CONTINENTS_DATA).map(key => (
                                            <div
                                                key={key}
                                                onClick={() => {
                                                    setContinentFilter(key);
                                                }}
                                                className={cn(
                                                    "border px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-2 cursor-pointer transition-all duration-300",
                                                    continentFilter === key
                                                        ? "bg-primary text-black border-primary shadow-[0_4px_12px_rgba(0,255,0,0.2)]"
                                                        : "bg-white/5 border-white/10 text-text-muted hover:text-white hover:bg-white/10"
                                                )}
                                            >
                                                {CONTINENTS_DATA[key].label}
                                                {key === 'GLOBAL' && <Globe className="w-3.5 h-3.5" />}
                                            </div>
                                        ))}
                                    </div>


                                </div>
                            </div>
                        </div>



                        {/* Leaderboard Table */}
                        <div className="flex-1 overflow-y-auto px-8 pb-8">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[10px] font-black uppercase tracking-widest text-[#444] border-b border-white/5">
                                        <th className="pb-4 font-black">Classement</th>
                                        <th className="pb-4 font-black">Joueur</th>

                                        <th className="pb-4 font-black text-center">Niveau de compétence</th>
                                        <th className="pb-4 font-black text-right pr-4">ELO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {standingsLoading ? (
                                        <tr>
                                            <td colSpan={4} className="py-20 text-center">
                                                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                                            </td>
                                        </tr>
                                    ) : standings.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-20 text-center text-text-muted font-bold uppercase tracking-widest text-xs">
                                                Aucun participant trouvé
                                            </td>
                                        </tr>
                                    ) : (
                                        (() => {
                                            const filtered = standings.filter(s => {
                                                const region = s.playerId?.region;
                                                // If GLOBAL, show all
                                                if (continentFilter === 'GLOBAL') return true;
                                                // If just a continent is chosen, show only players from that continent
                                                return region === continentFilter;
                                            });

                                            if (filtered.length === 0) {
                                                const label = CONTINENTS_DATA[continentFilter]?.label || continentFilter;
                                                return (
                                                    <tr>
                                                        <td colSpan={4} className="py-20 text-center text-text-muted font-bold uppercase tracking-widest text-[10px] opacity-50">
                                                            {`Aucun joueur trouvé pour la région ${label}`}
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                            return filtered.map((s, i) => (
                                                <tr key={s._id} className="group hover:bg-white/[0.02] transition-all border-b border-white/[0.03]">
                                                    <td className="py-6 pr-4">
                                                        <span className="text-white font-black text-sm pl-4">{i + 1}</span>
                                                    </td>
                                                    <td className="py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center overflow-hidden ring-1 ring-white/5 bg-surface relative">
                                                                {s.playerId?.avatar ? (
                                                                    <img src={s.playerId.avatar} className="w-full h-full object-cover" alt="" />
                                                                ) : (
                                                                    <Users className="w-6 h-6 text-white/50" />
                                                                )}
                                                            </div>
                                                            <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{s.playerId?.nickname || 'Player'}</span>
                                                        </div>
                                                    </td>

                                                    <td className="py-6 text-center">
                                                        <div className="inline-flex items-center gap-2 bg-[#121212] border border-white/10 pl-1 pr-3 py-1 rounded-full ring-1 ring-white/5">
                                                            <div className={cn(
                                                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black",
                                                                i < 3 ? "bg-orange-500 text-black shadow-[0_0_10px_rgba(255,165,0,0.3)]" : "bg-white/10 text-white"
                                                            )}>
                                                                #{i + 1}
                                                            </div>
                                                            <div className="w-4 h-4 bg-orange-500/20 rounded-full flex items-center justify-center">
                                                                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-6 text-right pr-4">
                                                        <span className="text-lg font-black text-white tracking-tighter">{s.rankPoints}</span>
                                                    </td>
                                                </tr>
                                            ));
                                        })()
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                active ? "bg-primary text-black shadow-lg" : "text-text-muted hover:text-white"
            )}
        >
            {icon}
            {label}
        </button>
    );
}
