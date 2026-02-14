import { Swords, Eye, MoreVertical, Calendar } from 'lucide-react';
import { Button, Input } from '../../components/ui/core';

export default function Matches() {
    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Live & Recent Matches</h1>
                    <p className="text-text-muted">Monitor ongoing matches and review match history.</p>
                </div>
                <div className="flex gap-2">
                    <Input className="bg-black/20 border-white/5" placeholder="Search Match ID..." />
                </div>
            </div>

            <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/5">
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Match ID</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Game</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Teams / Players</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Status</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Time</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                <td className="p-4 font-mono text-xs text-text-muted">#M-{5000 + i}</td>
                                <td className="p-4">
                                    <span className="text-sm font-bold text-white">Valorant</span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs font-bold">A</div>
                                            <span className="text-sm font-semibold text-white">Team Alpha</span>
                                        </div>
                                        <Swords className="w-4 h-4 text-text-muted" />
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-white">Team Beta</span>
                                            <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-xs font-bold">B</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    {i === 1 ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse">
                                            LIVE
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/5 text-text-muted border border-white/10">
                                            Finished
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-sm text-text-muted flex items-center gap-2">
                                    <Calendar className="w-3 h-3" />
                                    {i === 1 ? 'Running: 14:02' : 'Oct 24, 18:30'}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
