import React from 'react';

export interface BracketNodeProps {
    team1?: { name: string; logo?: string; score?: number };
    team2?: { name: string; logo?: string; score?: number };
    matchStatus: 'PENDING' | 'READY' | 'COMPLETED' | 'BYE';
    isWinner?: boolean;
    onClick?: () => void;
    matchId?: string;
    roundNumber: number;
}

const BracketNode: React.FC<BracketNodeProps> = ({
    team1,
    team2,
    matchStatus,
    onClick,
    roundNumber
}) => {
    const isBye = matchStatus === 'BYE';

    return (
        <div
            onClick={onClick}
            className={`relative w-64 bg-[#141419] border border-white/10 rounded-xl overflow-hidden shadow-lg transition-all duration-300 ${onClick ? 'cursor-pointer hover:border-[#00ff88]/50 hover:scale-[1.02]' : ''}`}
        >
            {/* Round Indicator */}
            <div className="absolute top-0 right-0 px-2 py-0.5 bg-white/5 border-l border-b border-white/5 rounded-bl-lg">
                <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">R{roundNumber}</span>
            </div>

            <div className="flex flex-col">
                {/* Team 1 */}
                <div className={`flex items-center justify-between p-3 border-b border-white/5 ${team1?.score && team1.score > (team2?.score || 0) ? 'bg-[#00ff88]/5' : ''}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden">
                            {team1?.logo ? <img src={team1.logo} alt="" className="w-full h-full object-cover" /> : <div className="text-[10px] font-black">{team1?.name?.[0] || '?'}</div>}
                        </div>
                        <span className={`text-[11px] font-black uppercase tracking-tighter truncate max-w-[120px] ${team1 ? 'text-white' : 'text-white/20'}`}>
                            {team1?.name || (isBye ? 'BYE' : 'TBD')}
                        </span>
                    </div>
                    {team1 && <span className="text-sm font-black text-[#00ff88]">{team1.score ?? 0}</span>}
                </div>

                {/* Team 2 */}
                <div className={`flex items-center justify-between p-3 ${team2?.score && team2.score > (team1?.score || 0) ? 'bg-[#00ff88]/5' : ''}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden">
                            {team2?.logo ? <img src={team2.logo} alt="" className="w-full h-full object-cover" /> : <div className="text-[10px] font-black">{team2?.name?.[0] || '?'}</div>}
                        </div>
                        <span className={`text-[11px] font-black uppercase tracking-tighter truncate max-w-[120px] ${team2 ? 'text-white' : 'text-white/20'}`}>
                            {team2?.name || (isBye ? '-' : 'TBD')}
                        </span>
                    </div>
                    {team2 && <span className="text-sm font-black text-[#00ff88]">{team2.score ?? 0}</span>}
                </div>
            </div>

            {/* Status Bar */}
            <div className={`h-1 w-full ${matchStatus === 'COMPLETED' ? 'bg-[#00ff88]' :
                matchStatus === 'READY' ? 'bg-yellow-500' :
                    'bg-white/5'
                }`} />
        </div>
    );
};

export default BracketNode;
