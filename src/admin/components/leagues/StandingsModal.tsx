import { useState, useEffect } from 'react';
import { Modal, Badge } from '../../../components/ui/core';
import { leagueService, type LeagueParticipant } from '../../../services/leagueService';
import { Trophy, Loader2, Medal, User, X, Globe } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface StandingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    leagueId: string | null;
    leagueName: string | null;
}

export default function StandingsModal({ isOpen, onClose, leagueId, leagueName }: StandingsModalProps) {
    const [standings, setStandings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
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
        if (isOpen && leagueId) {
            fetchStandings();
        }
    }, [isOpen, leagueId]);

    const fetchStandings = async () => {
        setLoading(true);
        try {
            const data = await leagueService.getLeagueStandings(leagueId!);
            setStandings(data);
        } catch (error) {
            console.error('Failed to fetch standings:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Medal className="text-yellow-400 w-5 h-5" />;
            case 1: return <Medal className="text-gray-300 w-5 h-5" />;
            case 2: return <Medal className="text-orange-400 w-5 h-5" />;
            default: return <span className="text-text-muted font-bold text-sm w-5 text-center">{index + 1}</span>;
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${leagueName} - Standings`}
            size="xl"
            hideDefaultHeader={true}
        >
            <div className="bg-[#0b0b0b] flex flex-col h-full max-h-[85vh] overflow-hidden">
                {/* Header sync with Player view */}
                <div className="bg-[#121212] px-8 py-4 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center cursor-pointer hover:bg-white/20" onClick={onClose}>
                            <X className="w-4 h-4 text-white/50" />
                        </div>
                        <span className="text-white font-black text-xs uppercase tracking-tighter">{leagueName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                            <Trophy className="w-4 h-4 text-primary" />
                        </div>
                    </div>
                </div>

                <div className="px-8 pt-8 pb-4">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            {leagueName} - Leaderboard
                            <span className="text-[10px] text-text-muted font-bold tracking-widest bg-white/5 px-2 py-0.5 rounded">ADMIN VIEW</span>
                        </h2>
                        <div className="flex flex-col gap-4 items-end">
                            {/* Continent Level */}
                            <div className="flex flex-wrap gap-2">
                                {Object.keys(CONTINENTS_DATA).map(key => (
                                    <div
                                        key={key}
                                        onClick={() => {
                                            setContinentFilter(key);
                                        }}
                                        className={cn(
                                            "border px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-2 cursor-pointer transition-all duration-300",
                                            continentFilter === key
                                                ? "bg-primary text-black border-primary"
                                                : "bg-white/5 border-white/10 text-text-muted hover:text-white"
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

                <div className="flex-1 overflow-y-auto px-8 pb-8">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : standings.length > 0 ? (
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
                                {(() => {
                                    const filtered = standings.filter(p => {
                                        const playerRegion = p.playerId?.region;

                                        // 1. Filter by continent (region)
                                        if (continentFilter !== 'GLOBAL') {
                                            return playerRegion === continentFilter;
                                        }

                                        return true;
                                    });

                                    if (filtered.length === 0) {
                                        const currentContinentLabel = CONTINENTS_DATA[continentFilter]?.label;

                                        return (
                                            <tr>
                                                <td colSpan={4} className="py-20 text-center text-text-muted font-bold uppercase tracking-widest text-[10px] opacity-50">
                                                    {`Aucun joueur trouvé pour la région ${currentContinentLabel}`}
                                                </td>
                                            </tr>
                                        );
                                    }
                                    return filtered.map((player, index) => (
                                        <tr key={player._id} className="group hover:bg-white/[0.02] transition-colors border-b border-white/[0.03]">
                                            <td className="py-6 pr-4">
                                                <span className="text-white font-black text-sm pl-4">{index + 1}</span>
                                            </td>
                                            <td className="py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center overflow-hidden ring-1 ring-white/5 bg-surface relative">
                                                        {player.playerId?.avatar ? (
                                                            <img src={player.playerId.avatar} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <User className="w-5 h-5 text-white/50" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white text-sm group-hover:text-primary transition-colors">{player.playerId.nickname}</p>
                                                        <p className="text-[10px] text-[#444] uppercase font-bold tracking-tight">{player.playerId.email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-6 text-center">
                                                <div className="inline-flex items-center gap-2 bg-[#121212] border border-white/10 pl-1 pr-3 py-1 rounded-full ring-1 ring-white/5">
                                                    <div className={cn(
                                                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black",
                                                        index < 3 ? "bg-orange-500 text-black shadow-[0_0_10px_rgba(255,165,0,0.3)]" : "bg-white/10 text-white"
                                                    )}>
                                                        #{index + 1}
                                                    </div>
                                                    <div className="w-4 h-4 bg-orange-500/20 rounded-full flex items-center justify-center">
                                                        <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 text-right pr-4">
                                                <span className="text-lg font-black text-white tracking-tighter">{player.rankPoints}</span>
                                            </td>
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10 mx-4">
                            <Trophy className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-20" />
                            <h3 className="text-lg font-bold text-text-muted uppercase tracking-widest">No participants yet</h3>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
