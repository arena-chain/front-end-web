import { Swords, Eye } from 'lucide-react';
import { Button } from '../../components/ui/core';

export default function RefereeDashboard() {
    return (
        <div className="space-y-6 animate-fade-in-up">
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-6">Live Match Feed</h1>

            <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-surface border border-white/5 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-6">
                            <span className="text-xs font-bold text-red-500 animate-pulse bg-red-500/10 px-2 py-1 rounded">LIVE</span>
                            <div>
                                <h3 className="text-lg font-bold text-white">Team Alpha vs Team Beta</h3>
                                <p className="text-sm text-text-muted">Valorant • Ranked • Map 2</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" size="sm">
                                <Swords className="w-4 h-4 mr-2" />
                                Pause Match
                            </Button>
                            <Button size="sm">
                                <Eye className="w-4 h-4 mr-2" />
                                Spectate
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
