import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Trophy, Users, ArrowLeft, Shield, Share2, Globe, UserPlus } from 'lucide-react';
import { Button } from '../../components/ui/core';
import { toast } from 'sonner';
import { MOCK_TOURNAMENTS } from '../../_public/data/tournamentData';
import tournamentService from '../../services/tournamentService';
import { resolveBackendAssetUrl } from '../../lib/apiBase';
import { placeholderImage } from '../../lib/placeholderImage';
import { cn } from '../../lib/utils';
interface TournamentDisplay {
    _id: string;
    title: string;
    game: string;
    status: string;
    date: string;
    image: string;
    color: string;
    description: string;
    prize: string;
    location: string;
    teams: { id: string; name: string; logo: string }[];
    streamUrl?: string;
    checkAuth?: boolean;
}

type ParticipantRow = {
    id: string;
    displayName: string;
    subtitle?: string;
    avatarUrl?: string;
    /** ISO region / flag hint when API sends it */
    countryCode?: string;
    elo?: number | null;
    level?: number | null;
    tournamentPoints?: number | null;
    kd?: number | null;
    winRate?: number | null;
};

type ClassifiedParticipant = ParticipantRow & {
    rank: number;
    podium: 'gold' | 'silver' | 'bronze' | null;
};

function pickNumeric(...vals: unknown[]): number | null {
    for (const v of vals) {
        if (typeof v === 'number' && Number.isFinite(v)) return v;
        if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
    }
    return null;
}

function seededStats(id: string): { elo: number; level: number; tournamentPoints: number; kd: number; winRate: number } {
    let h = 2166136261;
    for (let i = 0; i < id.length; i++) {
        h ^= id.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    const u = (n: number) => Math.abs(n % 10000);
    const kd = Math.round((1.05 + (u(h) % 75) / 100) * 100) / 100;
    const winRate = 48 + (u(h >> 10) % 28);
    return {
        elo: 1380 + u(h) % 520,
        level: 18 + u(h >> 8) % 72,
        tournamentPoints: 120 + u(h >> 16) % 880,
        kd,
        winRate,
    };
}

function enrichAndRankParticipants(rows: ParticipantRow[]): ClassifiedParticipant[] {
    const enriched = rows.map((r) => {
        const s = seededStats(r.id);
        return {
            ...r,
            elo: r.elo ?? s.elo,
            level: r.level ?? s.level,
            tournamentPoints: r.tournamentPoints ?? s.tournamentPoints,
            kd: r.kd ?? s.kd,
            winRate: r.winRate ?? s.winRate,
        };
    });

    const sorted = [...enriched].sort((a, b) => {
        const pts = (b.tournamentPoints ?? 0) - (a.tournamentPoints ?? 0);
        if (pts !== 0) return pts;
        const eloDiff = (b.elo ?? 0) - (a.elo ?? 0);
        if (eloDiff !== 0) return eloDiff;
        return a.displayName.localeCompare(b.displayName);
    });

    return sorted.map((r, idx) => {
        const rank = idx + 1;
        const podium: ClassifiedParticipant['podium'] =
            rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : null;
        return { ...r, rank, podium };
    });
}

function participantFromUnknown(raw: unknown): ParticipantRow | null {
    if (raw == null) return null;
    if (typeof raw === 'string') {
        const id = raw.trim();
        if (!id) return null;
        return {
            id,
            displayName: `Player_${id.slice(-6)}`,
            subtitle: undefined,
            avatarUrl: undefined,
            elo: undefined,
            level: undefined,
            tournamentPoints: undefined,
            kd: undefined,
            winRate: undefined,
        };
    }
    if (typeof raw !== 'object') return null;
    const o = raw as Record<string, unknown>;

    const nestedUser =
        o.user && typeof o.user === 'object'
            ? (o.user as Record<string, unknown>)
            : o.profile && typeof o.profile === 'object'
              ? (o.profile as Record<string, unknown>)
              : null;

    const rawUserId = o.userId;
    const uidFromRef =
        typeof rawUserId === 'string'
            ? rawUserId
            : rawUserId && typeof rawUserId === 'object'
              ? String((rawUserId as { _id?: string })._id ?? '')
              : '';

    const id = String(uidFromRef || o._id || o.id || nestedUser?._id || nestedUser?.id || '').trim();
    const displayName = String(
        o.username ?? o.name ?? o.displayName ?? nestedUser?.username ?? nestedUser?.name ?? nestedUser?.displayName ?? ''
    ).trim();

    const avatarRaw = o.avatarUrl ?? o.avatar ?? nestedUser?.avatarUrl ?? nestedUser?.avatar;
    let avatarUrl: string | undefined;
    if (typeof avatarRaw === 'string' && avatarRaw) {
        avatarUrl = avatarRaw.startsWith('http') || avatarRaw.startsWith('data:') ? avatarRaw : resolveBackendAssetUrl(avatarRaw);
    }

    let teamSubtitle: string | undefined;
    if (typeof o.teamName === 'string') teamSubtitle = o.teamName;
    if (!teamSubtitle && o.team && typeof o.team === 'object') {
        const tn = (o.team as { name?: string }).name;
        if (tn) teamSubtitle = tn;
    }

    const finalName = displayName || id;
    if (!finalName) return null;
    const finalId = id || finalName;

    const countryRaw = nestedUser?.country ?? o.country;
    const countryCode =
        typeof countryRaw === 'string' && /^[A-Za-z]{2}$/.test(countryRaw) ? countryRaw.toUpperCase() : undefined;

    const elo = pickNumeric(o.elo, o.ELO, o.rating, nestedUser?.elo, nestedUser?.rating);
    const level = pickNumeric(o.level, o.playerLevel, nestedUser?.level);
    const tournamentPoints = pickNumeric(o.tournamentPoints, o.points, o.score, o.tp);
    const kd = pickNumeric(o.kd, o.killDeathRatio, o.kda);
    const winRate = pickNumeric(o.winRate, o.winrate, o.win_pct);

    return {
        id: finalId,
        displayName: finalName,
        subtitle: teamSubtitle,
        avatarUrl,
        countryCode,
        elo: elo ?? undefined,
        level: level ?? undefined,
        tournamentPoints: tournamentPoints ?? undefined,
        kd: kd ?? undefined,
        winRate: winRate ?? undefined,
    };
}

function pushParticipant(rows: ParticipantRow[], seen: Set<string>, raw: unknown): void {
    const row = participantFromUnknown(raw);
    if (!row) return;
    const key = row.id;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push(row);
}

/** Only real people: API participant arrays + users nested under teams — never team entities as rows */
function extractParticipantPlayers(apiData: Record<string, unknown>): ParticipantRow[] {
    const rows: ParticipantRow[] = [];
    const seen = new Set<string>();

    const tryArray = (arr: unknown) => {
        if (!Array.isArray(arr)) return;
        for (const item of arr) pushParticipant(rows, seen, item);
    };

    tryArray(apiData.participants);
    tryArray(apiData.registeredPlayers);
    tryArray(apiData.players);
    tryArray(apiData.registrations);

    const teamsRaw = apiData.teams;
    if (Array.isArray(teamsRaw)) {
        for (const t of teamsRaw) {
            if (!t || typeof t !== 'object') continue;
            const team = t as Record<string, unknown>;
            tryArray(team.players);
            tryArray(team.members);
            tryArray(team.roster);
            tryArray(team.participants);
            const captain = team.captain ?? team.leader;
            if (captain) pushParticipant(rows, seen, captain);
        }
    }

    return rows;
}

export default function PlayerTournamentDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState<TournamentDisplay | null>(null);
    const [participants, setParticipants] = useState<ParticipantRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [participateBusy, setParticipateBusy] = useState(false);

    const leaderboardRows = useMemo(() => enrichAndRankParticipants(participants), [participants]);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (id) fetchTournamentData(id);
    }, [id]);

    const fetchTournamentData = async (tournamentId: string, options?: { skipLoadingOverlay?: boolean }) => {
        const overlay = !options?.skipLoadingOverlay;
        if (overlay) setLoading(true);
        try {
            const apiData = await tournamentService.fetchTournamentById(tournamentId);
            const teams =
                apiData.teams?.length > 0
                    ? apiData.teams.map((t: unknown, i: number) => {
                          if (t && typeof t === 'object') {
                              const o = t as { _id?: string; id?: string; name?: string; logo?: string };
                              const id = String(o._id ?? o.id ?? i);
                              return {
                                  id,
                                  name: o.name?.trim() || `Competitor ${id.slice(-6)}`,
                                  logo: o.logo || '',
                              };
                          }
                          const id = String(t);
                          return { id, name: `Competitor ${id.slice(-6)}`, logo: '' };
                      })
                    : MOCK_TOURNAMENTS[0].teams.map((t) => ({ id: t.id, name: t.name, logo: t.logo }));

            setTournament({
                _id: apiData._id,
                title: apiData.name,
                game: apiData.gameId?.title || 'Unknown Game',
                status: apiData.status,
                date: new Date(apiData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                image: apiData.bannerImageUrl ? resolveBackendAssetUrl(apiData.bannerImageUrl) : placeholderImage(1920, 1080, 'Tournament'),
                color: 'from-[#00ff87] to-[#0099ff]',
                description: apiData.description || 'Engagement protocol details encrypted.',
                prize: `$${apiData.prizePool?.toLocaleString() || '0'}`,
                location: 'GLOBAL_NETWORK',
                teams,
                streamUrl: apiData.streamUrl,
            });
            setParticipants(extractParticipantPlayers(apiData as unknown as Record<string, unknown>));
        } catch {
            setTournament(null);
            setParticipants([]);
        } finally {
            if (overlay) setLoading(false);
        }
    };

    async function handleParticipate() {
        if (!tournament) return;
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Sign in to participate.');
            navigate(`/login?redirect=${encodeURIComponent(`/player/tournaments/${tournament._id}`)}`);
            return;
        }
        setParticipateBusy(true);
        try {
            await tournamentService.participateAsPlayer(tournament._id);
            toast.success('You are registered for this tournament.');
            await fetchTournamentData(tournament._id, { skipLoadingOverlay: true });
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Could not join this tournament.');
        } finally {
            setParticipateBusy(false);
        }
    }

    if (loading)
        return (
            <div className="min-h-screen bg-[#060606] flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-[#00ff87]/20 border-t-[#00ff87] rounded-full animate-spin" />
            </div>
        );

    if (!tournament)
        return (
            <div className="min-h-screen bg-[#060606] flex items-center justify-center text-center">
                <div className="space-y-6">
                    <Shield size={48} className="mx-auto text-white/10" />
                    <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase">PROTOCOL_NOT_FOUND</h2>
                    <Button variant="outline" className="border-white/10 text-white/40 hover:text-white" onClick={() => navigate('/player/tournaments')}>
                        RETURN_TO_LOBBY
                    </Button>
                </div>
            </div>
        );

    return (
        <div className="min-h-screen bg-[#060606] text-white relative overflow-hidden pb-20">
            <div className="relative h-[65vh] min-h-[500px] overflow-hidden">
                <div className="absolute inset-0">
                    <img src={tournament.image} alt={tournament.title} className="w-full h-full object-cover scale-105 brightness-[0.4] contrast-[1.2]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#060606] via-transparent to-black/60" />
                    <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#00ff87]/10 to-transparent opacity-30" />
                </div>

                <div className="max-w-[1400px] mx-auto px-10 h-full relative z-10 flex flex-col justify-end pb-16 space-y-8">
                    <div className="flex items-center gap-4">
                        <Link to="/player/tournaments">
                            <button className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest italic hover:bg-white/10 transition-all">
                                <ArrowLeft size={16} /> RETURN_TO_FLEET
                            </button>
                        </Link>
                        <div className="px-5 py-3 rounded-xl bg-[#00ff87]/10 border border-[#00ff87]/30 backdrop-blur-md flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-[#00ff87] animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#00ff87] italic">ACTIVE_PROTOCOL_ENGAGEMENT</span>
                        </div>
                    </div>

                    <div className="space-y-4 max-w-4xl">
                        <div className="flex gap-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00ff87] italic px-4 py-1.5 rounded-full border border-[#00ff87]/30 bg-[#00ff87]/5">{tournament.game}</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic px-4 py-1.5">{tournament.status}</span>
                        </div>
                        <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter text-white uppercase leading-none drop-shadow-2xl">{tournament.title}</h1>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-10 pt-6">
                        <div className="flex gap-10">
                            <SpecBox label="PRIZE_TOTAL" value={tournament.prize} icon={<Trophy size={16} />} color="#00ff87" />
                            <SpecBox label="SYNC_DATE" value={tournament.date} icon={<Calendar size={16} />} color="#00ccff" />
                            <SpecBox label="SECTOR" value={tournament.location} icon={<Globe size={16} />} color="#ff00ff" />
                        </div>

                        <div className="flex-1" />

                        <div className="flex gap-4 w-full md:w-auto">
                            {tournament.status === 'OPEN_REGISTRATION' && (
                                <button
                                    type="button"
                                    disabled={participateBusy}
                                    className="flex-1 md:flex-none h-18 px-10 rounded-2xl bg-[#00ff87] text-black font-black italic uppercase text-xs tracking-[0.3em] shadow-[0_15px_40px_rgba(0,255,135,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-55 disabled:pointer-events-none disabled:hover:scale-100"
                                    onClick={() => void handleParticipate()}
                                >
                                    <UserPlus size={20} strokeWidth={2.25} /> {participateBusy ? 'JOINING…' : 'PARTICIPATE'}
                                </button>
                            )}
                            <button className="w-18 h-18 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-white transition-all">
                                <Share2 size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-10 py-16 relative z-10">
                <div className="flex flex-col items-center gap-4 text-center mb-12">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00ff87] animate-pulse" />
                    <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase flex items-center justify-center gap-4">
                        <Users size={28} className="text-[#00ff87]" />
                        Participants
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/35 italic">
                        {participants.length} registered {participants.length === 1 ? 'player' : 'players'}
                    </p>
                    {tournament.status === 'OPEN_REGISTRATION' && (
                        <button
                            type="button"
                            disabled={participateBusy}
                            onClick={() => void handleParticipate()}
                            className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl border border-[#00ff87]/35 bg-[#00ff87]/10 px-8 py-3 text-[10px] font-black uppercase tracking-[0.28em] text-[#00ff87] transition hover:bg-[#00ff87]/18 disabled:opacity-50"
                        >
                            <UserPlus size={16} strokeWidth={2.25} />
                            {participateBusy ? 'Joining…' : 'Participate in this tournament'}
                        </button>
                    )}
                </div>

                {participants.length === 0 ? (
                    <div className="rounded-[40px] border border-dashed border-white/10 bg-[#111]/80 py-20 text-center">
                        <Users className="mx-auto mb-4 h-12 w-12 text-white/15" strokeWidth={1.25} />
                        <p className="text-white/45 text-sm font-medium max-w-lg mx-auto leading-relaxed">
                            No players enrolled yet. This list shows individual competitors only — never whole teams. Use Participate when registration is open so your account can appear here.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-700/90 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
                        <table className="w-full min-w-[860px] border-collapse text-left">
                            <thead>
                                <tr className="bg-[#5b9bd5] text-[#0f172a]">
                                    <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wide">Level</th>
                                    <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wide">Rank</th>
                                    <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wide">Player</th>
                                    <th className="px-4 py-3 text-center text-[11px] font-black uppercase tracking-wide">K/D</th>
                                    <th className="px-4 py-3 text-center text-[11px] font-black uppercase tracking-wide">Win rate</th>
                                    <th className="px-4 py-3 text-center text-[11px] font-black uppercase tracking-wide">Elo</th>
                                    <th className="px-4 py-3 text-center text-[11px] font-black uppercase tracking-wide">Tourn pts</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboardRows.map((p, rowIdx) => (
                                    <tr
                                        key={p.id}
                                        className={cn(
                                            'border-b border-slate-800/90 transition-colors hover:bg-white/[0.04]',
                                            rowIdx % 2 === 0 ? 'bg-[#1a2332]' : 'bg-[#151c29]',
                                        )}
                                    >
                                        <td className="px-4 py-3 align-middle tabular-nums text-[13px] font-bold text-white">
                                            {Math.round(p.level ?? 0)}
                                        </td>
                                        <td className="px-4 py-3 align-middle">
                                            <RankPill rank={p.rank} podium={p.podium} />
                                        </td>
                                        <td className="px-4 py-3 align-middle">
                                            <div className="flex min-w-0 items-center gap-3">
                                                {p.countryCode ? (
                                                    <span className="shrink-0 text-lg leading-none" title={p.countryCode}>
                                                        {flagEmoji(p.countryCode)}
                                                    </span>
                                                ) : (
                                                    <span
                                                        className="inline-flex h-7 w-8 shrink-0 items-center justify-center rounded border border-white/10 bg-black/25 text-[11px] font-black text-white/25"
                                                        aria-hidden
                                                    >
                                                        –
                                                    </span>
                                                )}
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/40 ring-1 ring-white/10">
                                                    {p.avatarUrl ? (
                                                        <img src={p.avatarUrl} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Shield className="text-white/20" size={18} strokeWidth={1.5} />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate font-bold leading-tight text-white">{p.displayName}</p>
                                                    {p.subtitle ? (
                                                        <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-white/40">
                                                            {p.subtitle}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center align-middle tabular-nums text-[13px] font-semibold text-white">
                                            {(p.kd ?? 0).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-center align-middle tabular-nums text-[13px] font-semibold text-white">
                                            {Math.round(p.winRate ?? 0)}%
                                        </td>
                                        <td className="px-4 py-3 text-center align-middle tabular-nums text-[13px] font-bold text-[#7dd3fc]">
                                            {Math.round(p.elo ?? 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-center align-middle tabular-nums text-[13px] font-bold text-[#4ade80]">
                                            {Math.round(p.tournamentPoints ?? 0).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function flagEmoji(code: string): string {
    const A = 0x1f1e6;
    const up = code.toUpperCase();
    const pts = [...up].map((c) => A + (c.charCodeAt(0) - 65));
    try {
        return String.fromCodePoint(...pts);
    } catch {
        return '';
    }
}

function RankPill({ rank, podium }: { rank: number; podium: ClassifiedParticipant['podium'] }) {
    const pill =
        podium === 'gold'
            ? 'bg-amber-400 text-slate-900 shadow-[0_0_16px_rgba(251,191,36,0.35)]'
            : podium === 'silver'
              ? 'bg-slate-300 text-slate-900 shadow-[0_0_12px_rgba(226,232,240,0.25)]'
              : podium === 'bronze'
                ? 'bg-amber-800 text-amber-50 shadow-[0_0_12px_rgba(146,64,14,0.35)]'
                : 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.25)]';

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black tabular-nums tracking-tight',
                pill,
            )}
        >
            #{rank}
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-black/25 ring-1 ring-black/10" aria-hidden />
        </span>
    );
}

function SpecBox({ label, value, icon, color }: { label: string; value: string; icon: ReactNode; color: string }) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-2">
                <span className="text-white/20" style={{ color: `${color}40` }}>
                    {icon}
                </span>
                <p className="text-[9px] font-black uppercase tracking-widest text-white/40 italic">{label}</p>
            </div>
            <p className="text-2xl font-black italic tracking-tighter text-white uppercase" style={{ textShadow: `0 0 30px ${color}40` }}>
                {value}
            </p>
        </div>
    );
}
