import React from 'react';
import type { Tournament } from '../../../models/tournament';
import { TournamentFormat, PhaseStatus } from '../../../models/tournament';
import { Trophy, Award, Medal } from 'lucide-react';

interface TournamentBracketProps {
    tournament: Tournament;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({ tournament }) => {
    const renderSingleEliminationBracket = () => {
        const rounds = ['Quarterfinals', 'Semifinals', 'Finals'];

        return (
            <div className="space-y-8">
                <div className="flex gap-8 overflow-x-auto pb-4">
                    {rounds.map((round, roundIndex) => (
                        <div key={round} className="flex-shrink-0 space-y-4">
                            <h4 className="text-sm font-bold text-text-muted uppercase mb-4">{round}</h4>
                            <div className="space-y-6">
                                {Array.from({ length: Math.pow(2, rounds.length - roundIndex - 1) }).map((_, matchIndex) => (
                                    <div
                                        key={matchIndex}
                                        className="bg-surface border border-white/10 rounded-lg p-4 w-64 hover:border-primary/30 transition-colors"
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                                                <span className="text-sm text-white">Team {matchIndex * 2 + 1}</span>
                                                <span className="text-sm font-bold text-primary">0</span>
                                            </div>
                                            <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                                                <span className="text-sm text-white">Team {matchIndex * 2 + 2}</span>
                                                <span className="text-sm font-bold text-text-muted">0</span>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-xs text-text-muted text-center">
                                            Match {matchIndex + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Winner Display */}
                    <div className="flex-shrink-0">
                        <h4 className="text-sm font-bold text-text-muted uppercase mb-4">Champion</h4>
                        <div className="bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/40 rounded-lg p-6 w-64 text-center">
                            <Trophy className="w-12 h-12 text-primary mx-auto mb-3" />
                            <p className="text-lg font-bold text-white mb-1">TBD</p>
                            <p className="text-xs text-primary">Tournament Winner</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderDoubleEliminationBracket = () => {
        return (
            <div className="space-y-8">
                {/* Winners Bracket */}
                <div>
                    <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        Winners Bracket
                    </h3>
                    <div className="bg-white/5 rounded-lg p-6">
                        {renderSingleEliminationBracket()}
                    </div>
                </div>

                {/* Losers Bracket */}
                <div>
                    <h3 className="text-lg font-bold text-yellow-500 mb-4 flex items-center gap-2">
                        <Medal className="w-5 h-5" />
                        Losers Bracket
                    </h3>
                    <div className="bg-white/5 rounded-lg p-6">
                        {renderSingleEliminationBracket()}
                    </div>
                </div>

                {/* Grand Finals */}
                <div>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Grand Finals
                    </h3>
                    <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-lg p-6">
                        <div className="max-w-md mx-auto">
                            <div className="bg-surface border border-white/10 rounded-lg p-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-3 bg-primary/10 rounded border border-primary/20">
                                        <span className="text-sm font-bold text-white">Winners Bracket Champion</span>
                                        <span className="text-sm font-bold text-primary">0</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded border border-yellow-500/20">
                                        <span className="text-sm font-bold text-white">Losers Bracket Champion</span>
                                        <span className="text-sm font-bold text-yellow-500">0</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderSwissBracket = () => {
        return (
            <div className="space-y-4">
                <p className="text-text-muted text-sm">Swiss format - All teams play each other in rounds</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <div
                            key={index}
                            className="bg-surface border border-white/10 rounded-lg p-4 hover:border-primary/30 transition-colors"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-text-muted">Round {Math.floor(index / 4) + 1} - Match {(index % 4) + 1}</span>
                                <span className="text-xs text-primary">Upcoming</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                                    <span className="text-sm text-white">Team {index * 2 + 1}</span>
                                    <span className="text-sm font-bold text-text-muted">0</span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                                    <span className="text-sm text-white">Team {index * 2 + 2}</span>
                                    <span className="text-sm font-bold text-text-muted">0</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderBracket = () => {
        switch (tournament.format) {
            case TournamentFormat.SINGLE_ELIMINATION:
                return renderSingleEliminationBracket();
            case TournamentFormat.DOUBLE_ELIMINATION:
                return renderDoubleEliminationBracket();
            case TournamentFormat.SWISS:
            case TournamentFormat.ROUND_ROBIN:
                return renderSwissBracket();
            default:
                return (
                    <div className="text-center text-text-muted py-12">
                        <p>Bracket visualization for this format coming soon</p>
                    </div>
                );
        }
    };

    return (
        <div className="p-6">
            {/* Phase Tabs */}
            {tournament.phases.length > 0 && (
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                    {tournament.phases.map((phase) => (
                        <button
                            key={phase.name}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${phase.status === PhaseStatus.ONGOING
                                ? 'bg-primary text-black'
                                : phase.status === PhaseStatus.COMPLETED
                                    ? 'bg-white/10 text-text-muted'
                                    : 'bg-white/5 text-white hover:bg-white/10'
                                }`}
                        >
                            {phase.name.replace('_', ' ')}
                            {phase.status === PhaseStatus.ONGOING && (
                                <span className="ml-2 inline-block w-2 h-2 bg-black rounded-full animate-pulse" />
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Bracket Visualization */}
            {renderBracket()}

            {/* Empty State */}
            {tournament.currentTeams === 0 && (
                <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">No Teams Registered Yet</h3>
                    <p className="text-text-muted">The bracket will be generated once teams start registering</p>
                </div>
            )}
        </div>
    );
};

export default TournamentBracket;
