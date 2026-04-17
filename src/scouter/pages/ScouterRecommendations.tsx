import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, Building2, Calendar, ArrowRight } from 'lucide-react';
import {
    scoutingService,
    type PlayerRecommendation,
    RecommendationStatus,
} from '../../services/scoutingService';

const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function getScouterId(): string | null {
    try {
        const raw = localStorage.getItem('user');
        const user = raw ? JSON.parse(raw) : null;
        return user?.id ?? user?._id ?? null;
    } catch {
        return null;
    }
}

const statusColors: Record<RecommendationStatus, string> = {
    PENDING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    ACCEPTED: 'bg-primary/20 text-primary border-primary/30',
    REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
};

function playerName(r: PlayerRecommendation) {
    const p = r.playerId;
    if (typeof p === 'object' && p) {
        if ('nickname' in p) return (p as { nickname?: string }).nickname ?? 'Player';
        if ('userId' in p && typeof (p as { userId?: unknown }).userId === 'object') {
            const u = (p as { userId?: { nickname?: string } }).userId;
            return u?.nickname ?? 'Player';
        }
    }
    return 'Player';
}

function orgName(r: PlayerRecommendation) {
    const o = r.organizationId;
    if (typeof o === 'object' && o && 'name' in o) return (o as { name?: string }).name ?? 'Organization';
    return 'Organization';
}

function playerId(r: PlayerRecommendation) {
    const p = r.playerId;
    if (typeof p === 'object' && p) {
        // Preferred: direct user id
        if ('_id' in p && typeof (p as { _id?: unknown })._id === 'string') {
            return (p as { _id: string })._id;
        }
        // Some APIs populate player profile shape: { userId: "..." } or { userId: { _id: "..." } }
        if ('userId' in p) {
            const u = (p as { userId?: unknown }).userId;
            if (typeof u === 'string') return u;
            if (u && typeof u === 'object' && '_id' in u && typeof (u as { _id?: unknown })._id === 'string') {
                return (u as { _id: string })._id;
            }
        }
        if ('id' in p && typeof (p as { id?: unknown }).id === 'string') {
            return (p as { id: string }).id;
        }
    }
    return typeof p === 'string' ? p : '';
}

export default function ScouterRecommendations() {
    const scouterId = getScouterId();
    const [recommendations, setRecommendations] = useState<PlayerRecommendation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!scouterId) return;
        setLoading(true);
        scoutingService
            .listRecommendationsByScouter(scouterId)
            .then(setRecommendations)
            .catch(() => setRecommendations([]))
            .finally(() => setLoading(false));
    }, [scouterId]);

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div>
                <div className="flex items-center gap-2 text-primary/80 text-xs font-bold uppercase tracking-widest mb-2">
                    <Send size={14} /> Recommendations
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">My recommendations</h1>
                <p className="text-white/50 text-sm mt-1">
                    Players you have recommended to teams or academies. Create recommendations from a player profile.
                </p>
            </div>

            <div className="rounded-2xl border border-primary/10 bg-white/[0.02] overflow-hidden">
                {loading ? (
                    <div className="py-24 text-center text-primary/70">Loading recommendations…</div>
                ) : recommendations.length === 0 ? (
                    <div className="py-24 text-center">
                        <Send className="w-14 h-14 text-primary/40 mx-auto mb-4" />
                        <p className="text-white/80 font-semibold">No recommendations yet</p>
                        <p className="text-white/40 text-sm mt-1 max-w-sm mx-auto">
                            Open a player profile and click &quot;Recommend to team&quot; to send a formal recommendation to an organization.
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
                        {recommendations.map((r) => (
                            <div
                                key={r._id}
                                className="flex flex-wrap items-center gap-4 px-6 py-4 hover:bg-white/[0.02]"
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white">{playerName(r)}</p>
                                    <p className="text-sm text-white/50">
                                        → {orgName(r)} · {r.recommendationLevel.replace(/_/g, ' ')}
                                    </p>
                                    {r.message && (
                                        <p className="text-xs text-white/40 mt-1 line-clamp-2">{r.message}</p>
                                    )}
                                </div>
                                <span
                                    className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase border ${statusColors[r.status]}`}
                                >
                                    {r.status}
                                </span>
                                <div className="text-xs text-white/50 flex items-center gap-1">
                                    <Calendar size={14} /> {fmtDate(r.createdAt)}
                                </div>
                                {playerId(r) ? (
                                    <Link
                                        to={`/scouter/players/${playerId(r)}`}
                                        className="inline-flex items-center gap-1 text-primary font-bold text-sm hover:underline"
                                    >
                                        View profile <ArrowRight size={14} />
                                    </Link>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-white/40 font-bold text-sm" title="Player id missing in recommendation payload">
                                        View profile unavailable
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
