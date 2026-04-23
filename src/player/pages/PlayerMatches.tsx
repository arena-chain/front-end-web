import { Calendar, Eye } from 'lucide-react';
import { Button } from '../../components/ui/core';

export default function PlayerMatches() {
    return (
        <div className="space-y-6 animate-fade-in-up">
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Match History</h1>
                <p className="text-text-muted">Review your past performance and match details.</p>
            </div>

            <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/5">
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Result</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Score</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Mode</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Date</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted text-right">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                <td className="p-4">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${i % 2 === 0
                                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                                        }`}>
                                        {i % 2 === 0 ? 'VICTORY' : 'DEFEAT'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className="text-sm font-bold text-white">13 - {i % 2 === 0 ? '9' : '11'}</span>
                                </td>
                                <td className="p-4">
                                    <span className="text-sm text-text-muted">Ranked 5v5</span>
                                </td>
                                <td className="p-4 text-sm text-text-muted flex items-center gap-2">
                                    <Calendar className="w-3 h-3" />
                                    Oct {24 - i}, 2026
                                </td>
                                <td className="p-4 text-right">
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
