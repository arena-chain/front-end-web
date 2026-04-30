import React, { useState, useEffect } from 'react';
import { Trophy, RefreshCw } from 'lucide-react';
import type { Tournament } from '../../../models/tournament';
import { bracketService } from '../../../services/bracketService';
import type { Bracket, BracketSlot } from '../../../services/bracketService';
import BracketNode from './BracketNode';
import type { BracketNodeProps } from './BracketNode';
import BracketConnector from './BracketConnector';
import { Button } from '../../../components/ui/core';

interface TournamentBracketProps {
    tournament: Tournament;
    isAdmin?: boolean;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({ tournament, isAdmin = true }) => {
    const [bracket, setBracket] = useState<Bracket | null>(null);
    const [loading, setLoading] = useState(true);
    const [zoom, setZoom] = useState(1);

    // Layout constants
    const MATCH_WIDTH = 256;
    const MATCH_HEIGHT = 100;
    const ROUND_SPACING = 120;
    const MATCH_VERTICAL_SPACING = 40;

    type TeamRef = BracketSlot['team1Id'];
    const teamFromRef = (team: TeamRef): BracketNodeProps['team1'] | undefined => {
        if (!team) return undefined;
        if (typeof team === 'object') {
            return { name: team.name, logo: team.logo };
        }
        return { name: `Team ${team.slice(-4)}` };
    };

    const championName = (champion: Bracket['championId']): string => {
        if (!champion) return 'TBD';
        return typeof champion === 'object' ? champion.name : champion;
    };

    useEffect(() => {
        fetchBracket();
    }, [tournament._id]);

    const fetchBracket = async () => {
        setLoading(true);
        try {
            // NOTE: In the current service, brackets are fetched by seasonId.
            // If the tournament has its own ID, we use that or fallback.
            const data = await bracketService.getBySeason(tournament._id);
            setBracket(data);
        } catch (error) {
            console.error('Error fetching bracket:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleForceWin = async (slotId: string, teamId: string) => {
        if (!isAdmin) return;
        // Mocking the force win call as it might be a specific endpoint
        alert(`Force winning Team ${teamId} for slot ${slotId}`);
        // In reality: await matchService.forceWin(slotId, teamId);
        fetchBracket();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <RefreshCw className="w-12 h-12 text-[#00ff88] animate-spin mb-4" />
                <p className="text-white/40 font-black uppercase tracking-widest text-xs">Generating Visual Tree...</p>
            </div>
        );
    }

    if (!bracket || !bracket.slots.length) {
        return (
            <div className="text-center py-20 bg-[#141419] border border-white/5 rounded-3xl">
                <Trophy className="w-20 h-20 text-white/10 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Bracket Not Generated</h3>
                <p className="text-white/40 max-w-xs mx-auto text-sm">Teams are still registering. The bracket will be visible once the tournament starts.</p>
                {isAdmin && (
                    <Button
                        className="mt-8 bg-[#00ff88] text-black font-black"
                        onClick={() => alert('Generate Bracket triggered')}
                    >
                        GENERATE NOW
                    </Button>
                )}
            </div>
        );
    }

    // Group slots by round and section (Upper/Lower/Final)
    const grandFinalSlot: BracketSlot | null = bracket.slots.find((slot) => slot.slotId === 'GF') ?? null;

    const upperRounds = bracket.slots
        .filter((slot) => slot.slotId !== 'GF' && !slot.slotId.startsWith('LB'))
        .reduce<Record<number, BracketSlot[]>>((acc, slot) => {
            if (!acc[slot.roundNumber]) acc[slot.roundNumber] = [];
            acc[slot.roundNumber].push(slot);
            return acc;
        }, {});

    const lowerRounds = bracket.slots
        .filter((slot) => slot.slotId.startsWith('LB'))
        .reduce<Record<number, BracketSlot[]>>((acc, slot) => {
            if (!acc[slot.roundNumber]) acc[slot.roundNumber] = [];
            acc[slot.roundNumber].push(slot);
            return acc;
        }, {});

    const maxUpperRound = Math.max(...Object.keys(upperRounds).map(Number), 0);
    const maxLowerRound = Math.max(...Object.keys(lowerRounds).map(Number), 0);
    const upperRoundEntries: Array<[string, BracketSlot[]]> = Object.entries(upperRounds);
    const lowerRoundEntries: Array<[string, BracketSlot[]]> = Object.entries(lowerRounds);

    return (
        <div className="relative w-full bg-[#0a0a0f] rounded-3xl overflow-hidden border border-white/5 min-h-[600px]">
            {/* Header / Legend */}
            <div className="absolute top-6 left-6 z-20 flex items-center gap-4">
                <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#00ff88]" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Completed</span>
                    </div>
                    <div className="flex items-center gap-2 border-l border-white/10 pl-3">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Live</span>
                    </div>
                    {bracket.format === 'DOUBLE_ELIMINATION' && (
                        <div className="flex items-center gap-2 border-l border-white/10 pl-3">
                            <span className="text-[10px] font-black text-[#00ff88] uppercase tracking-widest italic">Double Elimination</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Interactive Area */}
            <div
                className="relative p-20 overflow-auto scrollbar-hide select-none"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
            >
                <div className="flex flex-col gap-20 min-w-max relative">
                    {/* Upper Bracket Section */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xs font-black text-white/20 uppercase tracking-[0.3em] pl-4">Upper Bracket</h3>
                        <div className="flex gap-x-[120px] items-center relative">
                            {/* SVG Layer for Connectors */}
                            <svg className="absolute inset-0 pointer-events-none w-full h-full z-0 opacity-20">
                                {bracket.slots.map(slot => {
                                    if (!slot.nextSlotId) return null;
                                    const nextSlot = bracket.slots.find(s => s.slotId === slot.nextSlotId);
                                    if (!nextSlot) return null;

                                    // Basic connector logic - needs more refinement for mixed UB/LB/GF
                                    const isLB = slot.slotId.startsWith('LB');
                                    const isNextLB = nextSlot.slotId.startsWith('LB');
                                    if (isLB !== isNextLB && nextSlot.slotId !== 'GF') return null;

                                    const roundIdx = slot.roundNumber - (isLB ? maxUpperRound + 1 : 1);
                                    const nextRoundIdx = nextSlot.slotId === 'GF' ? (isLB ? maxLowerRound + 1 : maxUpperRound + 1) : (nextSlot.roundNumber - (isLB ? maxUpperRound + 1 : 1));

                                    const startX = roundIdx * (MATCH_WIDTH + ROUND_SPACING) + MATCH_WIDTH;
                                    const endX = nextRoundIdx * (MATCH_WIDTH + ROUND_SPACING);
                                    const startY = (slot.position - 0.5) * (MATCH_HEIGHT + MATCH_VERTICAL_SPACING) * Math.pow(2, roundIdx) + 50;
                                    const endY = (nextSlot.position - 0.5) * (MATCH_HEIGHT + MATCH_VERTICAL_SPACING) * Math.pow(2, nextRoundIdx) + 50;

                                    return (
                                        <BracketConnector
                                            key={`conn-${slot.slotId}`}
                                            startX={startX}
                                            startY={startY}
                                            endX={endX}
                                            endY={endY}
                                        />
                                    );
                                })}
                            </svg>

                            {upperRoundEntries.sort(([a], [b]) => Number(a) - Number(b)).map(([roundNum, slots]) => (
                                <div key={roundNum} className="flex flex-col gap-y-10 justify-around py-10" style={{ height: (MATCH_HEIGHT + MATCH_VERTICAL_SPACING) * Math.pow(2, maxUpperRound - 1) }}>
                                    <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4 text-center">Round {roundNum}</h4>
                                    {slots.sort((a, b) => a.position - b.position).map(slot => (
                                        <div key={slot.slotId} className="relative z-10">
                                            <BracketNode
                                                matchId={slot.slotId}
                                                roundNumber={slot.roundNumber}
                                                matchStatus={slot.status}
                                                team1={teamFromRef(slot.team1Id)}
                                                team2={teamFromRef(slot.team2Id)}
                                                onClick={isAdmin ? () => handleForceWin(slot.slotId, '1') : undefined}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ))}

                            {grandFinalSlot !== null ? (
                                <div className="flex flex-col items-center justify-center pl-20 border-l border-white/5">
                                    <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-8">Grand Final</div>
                                    <BracketNode
                                        matchId={grandFinalSlot.slotId}
                                        roundNumber={grandFinalSlot.roundNumber}
                                        matchStatus={grandFinalSlot.status}
                                        team1={teamFromRef(grandFinalSlot.team1Id)}
                                        team2={teamFromRef(grandFinalSlot.team2Id)}
                                        onClick={isAdmin ? () => handleForceWin(grandFinalSlot.slotId, '1') : undefined}
                                    />
                                </div>
                            ) : null}

                            {/* Winner / Champion */}
                            <div className="flex flex-col items-center justify-center pl-20">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-[#00ff88]/20 blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative w-40 h-40 rounded-full bg-gradient-to-b from-[#141419] to-black border-2 border-[#00ff88]/30 flex flex-col items-center justify-center p-6 text-center">
                                        <Trophy className="w-12 h-12 text-[#00ff88] mb-3 drop-shadow-[0_0_10px_rgba(0,255,136,0.5)]" />
                                        <span className="text-[10px] font-black text-[#00ff88] uppercase tracking-[0.2em] mb-1">Champion</span>
                                        <span className="text-sm font-black text-white uppercase">{championName(bracket.championId)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lower Bracket Section */}
                    {Object.keys(lowerRounds).length > 0 && (
                        <div className="flex flex-col gap-4 mt-20 border-t border-white/5 pt-20">
                            <h3 className="text-xs font-black text-white/20 uppercase tracking-[0.3em] pl-4">Lower Bracket</h3>
                            <div className="flex gap-x-[120px] items-center relative">
                                {lowerRoundEntries.sort(([a], [b]) => Number(a) - Number(b)).map(([roundNum, slots]) => (
                                    <div key={roundNum} className="flex flex-col gap-y-10 justify-around py-10">
                                        <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4 text-center">LB Round {Number(roundNum) - maxUpperRound}</h4>
                                        {slots.sort((a, b) => a.position - b.position).map(slot => (
                                            <div key={slot.slotId} className="relative z-10">
                                                <BracketNode
                                                    matchId={slot.slotId}
                                                    roundNumber={slot.roundNumber}
                                                    matchStatus={slot.status}
                                                    team1={teamFromRef(slot.team1Id)}
                                                    team2={teamFromRef(slot.team2Id)}
                                                    onClick={isAdmin ? () => handleForceWin(slot.slotId, '1') : undefined}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Controls Bar */}
            <div className="absolute bottom-6 right-6 z-20 flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))} className="bg-black/40 border border-white/10 hover:bg-black text-white">-</Button>
                <div className="bg-black/40 border border-white/10 px-3 flex items-center text-[10px] font-black text-white uppercase">{Math.round(zoom * 100)}%</div>
                <Button variant="ghost" size="sm" onClick={() => setZoom(prev => Math.min(2, prev + 0.1))} className="bg-black/40 border border-white/10 hover:bg-black text-white">+</Button>
                <Button variant="ghost" size="sm" onClick={fetchBracket} className="bg-black/40 border border-white/10 hover:bg-[#00ff88] hover:text-black transition-all"><RefreshCw size={14} /></Button>
            </div>
        </div>
    );
};

export default TournamentBracket;
