import { useEffect, useMemo, useState } from 'react';
import { Building2, CheckCircle2, Loader2, Search, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchPublicTeams, type TeamListItem } from '../../services/teamsPublic.service';

export default function PlayerClubs() {
    const navigate = useNavigate();
    const [clubs, setClubs] = useState<TeamListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await fetchPublicTeams();
                if (!cancelled) setClubs(data);
            } catch {
                if (!cancelled) setClubs([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return clubs;
        return clubs.filter((club) =>
            club.name.toLowerCase().includes(q) ||
            (club.description || '').toLowerCase().includes(q),
        );
    }, [clubs, query]);

    return (
        <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-[#0a0d12] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl border border-primary/25 bg-primary/10 p-2.5">
                            <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black uppercase tracking-tight text-white">Clubs & Organizations</h1>
                            <p className="text-xs font-semibold text-white/35">Explore all registered clubs.</p>
                        </div>
                    </div>
                    <div className="relative w-full max-w-xs">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search clubs..."
                            className="h-10 w-full rounded-xl border border-white/10 bg-black/40 pl-9 pr-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-primary/30"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-white/10 bg-[#0a0d12]">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 rounded-3xl border border-white/10 bg-[#0a0d12] text-white/35">
                    <Shield className="h-8 w-8" />
                    <p className="text-xs font-black uppercase tracking-widest">No clubs found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((club) => (
                        <button
                            type="button"
                            key={club._id}
                            onClick={() => navigate(`/player/clubs/${club._id}`)}
                            className="w-full rounded-2xl border border-white/10 bg-[#0b0f16] p-4 text-left transition-colors hover:border-primary/30"
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/40">
                                    {club.logo ? (
                                        <img src={club.logo} alt={club.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <Shield className="h-5 w-5 text-primary/60" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-black text-white">{club.name}</p>
                                    {club.description ? (
                                        <p className="mt-1 line-clamp-2 text-xs text-white/45">{club.description}</p>
                                    ) : (
                                        <p className="mt-1 text-xs text-white/30">No description provided.</p>
                                    )}
                                </div>
                            </div>
                            <div className="mt-3">
                                {club.isVerified ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Verified
                                    </span>
                                ) : (
                                    <span className="inline-flex rounded-full border border-white/15 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-white/40">
                                        Unverified
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
