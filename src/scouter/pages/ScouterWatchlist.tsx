import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, User, FileText, ArrowRight, Trash2 } from 'lucide-react';
import { scoutingService, type WatchlistEntry } from '../../services/scoutingService';

function getScouterId(): string | null {
    try {
        const raw = localStorage.getItem('user');
        const user = raw ? JSON.parse(raw) : null;
        return user?.id ?? user?._id ?? null;
    } catch {
        return null;
    }
}

function playerName(e: WatchlistEntry): string {
    const p = e.playerId;
    if (typeof p === 'object' && p && 'nickname' in p) return (p as { nickname?: string }).nickname ?? 'Player';
    return 'Player';
}

function playerId(e: WatchlistEntry): string {
    const p = e.playerId;
    if (typeof p === 'object' && p && '_id' in p) return (p as { _id: string })._id;
    return typeof p === 'string' ? p : '';
}

export default function ScouterWatchlist() {
    const scouterId = getScouterId();
    const [entries, setEntries] = useState<WatchlistEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState<string | null>(null);

    const load = () => {
        if (!scouterId) return;
        setLoading(true);
        scoutingService
            .listWatchlistByScouter(scouterId)
            .then(setEntries)
            .catch(() => setEntries([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, [scouterId]);

    const handleRemove = (playerIdVal: string) => {
        if (!scouterId || !playerIdVal) return;
        setRemovingId(playerIdVal);
        scoutingService
            .removeFromWatchlist(scouterId, playerIdVal)
            .then(load)
            .catch(() => {})
            .finally(() => setRemovingId(null));
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div>
                <div className="flex items-center gap-2 text-primary/80 text-xs font-bold uppercase tracking-widest mb-2">
                    <Bookmark size={14} /> Watchlist
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">My watchlist</h1>
                <p className="text-white/50 text-sm mt-1">
                    Players you are tracking. Remove or open profile to add reports and recommendations.
                </p>
            </div>

            <div className="rounded-2xl border border-primary/10 bg-white/[0.02] overflow-hidden">
                {loading ? (
                    <div className="py-24 text-center text-primary/70">Loading watchlist…</div>
                ) : entries.length === 0 ? (
                    <div className="py-24 text-center">
                        <Bookmark className="w-14 h-14 text-primary/40 mx-auto mb-4" />
                        <p className="text-white/80 font-semibold">Watchlist is empty</p>
                        <p className="text-white/40 text-sm mt-1 max-w-sm mx-auto">
                            Add players from the Rankings or Player profile with &quot;Add to watchlist&quot;.
                        </p>
                        <Link
                            to="/scouter/players"
                            className="mt-4 inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline"
                        >
                            Browse players <ArrowRight size={14} />
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {entries.map((e) => (
                            <div
                                key={e._id}
                                className="flex flex-wrap items-center gap-4 px-6 py-4 hover:bg-white/[0.02]"
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                                    <User className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white">{playerName(e)}</p>
                                    {e.notes && <p className="text-sm text-white/50 truncate">{e.notes}</p>}
                                    <p className="text-xs text-primary/70 mt-0.5">{e.priority}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link
                                        to={`/scouter/players/${playerId(e)}`}
                                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-primary/20 border border-primary/30 text-primary font-bold text-sm hover:bg-primary/30"
                                    >
                                        <ArrowRight size={14} /> Profile
                                    </Link>
                                    <Link
                                        to={`/scouter/reports?playerId=${playerId(e)}`}
                                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm hover:bg-white/15"
                                    >
                                        <FileText size={14} /> Report
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => handleRemove(playerId(e))}
                                        disabled={removingId === playerId(e)}
                                        className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                                        title="Remove from watchlist"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
