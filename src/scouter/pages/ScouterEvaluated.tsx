import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Users } from 'lucide-react';

export default function ScouterEvaluated() {
    const [list] = useState<Array<{ _id: string; name: string }>>([]);

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <Star className="w-8 h-8 text-primary" />
                    My evaluated list
                </h1>
                <p className="text-white/50 text-sm mt-1">Players you have added to your evaluated list (PATCH /scouter/:scouterId/scouted/:playerProfileId).</p>
            </div>

            {list.length === 0 ? (
                <div className="rounded-2xl border border-primary/10 bg-primary/5 p-12 text-center">
                    <Star className="w-14 h-14 text-primary/50 mx-auto mb-4" />
                    <p className="text-white/70 font-semibold">No players in your list yet</p>
                    <p className="text-white/40 text-sm mt-2">Open a player profile and click &quot;Add to evaluated list&quot; to add them here.</p>
                    <Link to="/scouter/players" className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-primary/20 border border-primary/30 text-primary font-bold text-sm hover:bg-primary/30 transition-colors">
                        <Users size={16} /> Browse players
                    </Link>
                </div>
            ) : (
                <div className="grid gap-3">
                    {list.map((p) => (
                        <Link
                            key={p._id}
                            to={`/scouter/players/${p._id}`}
                            className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-primary/10 hover:border-primary/25 transition-all"
                        >
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">{p.name.charAt(0)}</div>
                            <span className="font-semibold text-white">{p.name}</span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
