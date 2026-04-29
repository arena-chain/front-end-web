import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Crown, Loader2, Medal, PlayCircle, Shield, Sparkles, Users, Flag, UserPlus2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchTeamDetailForRoster } from '../../services/teamsPublic.service';
import { teamManagerService } from '../../services/teamManagerService';

type TeamDetail = Awaited<ReturnType<typeof fetchTeamDetailForRoster>>;

export default function TeamProfilePage() {
    const { teamId } = useParams<{ teamId: string }>();
    const navigate = useNavigate();
    const [team, setTeam] = useState<TeamDetail>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!teamId) {
                setTeam(null);
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const data = await fetchTeamDetailForRoster(teamId);
                if (!cancelled) setTeam(data);
            } catch {
                if (!cancelled) setTeam(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [teamId]);

    const members = useMemo(() => team?.members ?? [], [team]);
    const videos = useMemo(() => team?.videos ?? [], [team]);
    const highlights = useMemo(() => team?.highlights ?? [], [team]);
    const trophies = useMemo(() => team?.trophies ?? [], [team]);
    const [submittingJoin, setSubmittingJoin] = useState(false);

    const submitJoinRequest = () => {
        if (!teamId || !team) return;
        setSubmittingJoin(true);
        void teamManagerService.requestJoinOrganization(teamId)
            .then(() => {
                toast.success('Join request sent to team manager.');
            })
            .catch((e: unknown) => {
                const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
                toast.error(msg || 'Could not send join request.');
            })
            .finally(() => {
                setSubmittingJoin(false);
            });
    };

    if (loading) {
        return (
            <div className="flex min-h-[260px] items-center justify-center rounded-3xl border border-white/10 bg-[#0a0d12]">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
        );
    }

    if (!team) {
        return (
            <div className="space-y-4">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-xs font-black uppercase tracking-widest text-white/70 hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </button>
                <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-3xl border border-white/10 bg-[#0a0d12] text-white/35">
                    <Shield className="h-8 w-8" />
                    <p className="text-xs font-black uppercase tracking-widest">Team not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 pb-8">
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-xs font-black uppercase tracking-widest text-white/70 hover:text-white"
            >
                <ArrowLeft className="h-4 w-4" />
                Back
            </button>

            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0d12] p-5 md:p-6">
                <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: 'radial-gradient(80% 70% at 0% 0%, rgba(0,255,136,0.18) 0%, rgba(0,0,0,0) 58%)' }} />
                <div className="pointer-events-none absolute inset-0 opacity-20" style={{ background: 'linear-gradient(120deg, rgba(22,26,36,0.9) 0%, rgba(11,14,20,0.7) 40%, rgba(8,10,14,0.96) 100%)' }} />

                <div className="relative grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-4">
                        <div className="flex items-start gap-5">
                            <div className="relative shrink-0">
                                <div className="pointer-events-none absolute -inset-4 rounded-[32px] bg-primary/30 blur-2xl" />
                                <div className="relative flex h-44 w-44 items-center justify-center overflow-hidden rounded-[34px] border border-primary/40 bg-[#07110d] p-3 shadow-[0_0_66px_rgba(0,255,136,0.38)]">
                                    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-black/35">
                                        {team.logo ? (
                                            <img src={team.logo} alt={team.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <Shield className="h-8 w-8 text-primary/80" />
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="truncate text-3xl font-black uppercase tracking-tight text-white">{team.name}</h1>
                                    {team.isVerified && (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Verified
                                        </span>
                                    )}
                                </div>
                                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/45">{team.description || 'No team description yet.'}</p>
                                <div className="mt-5">
                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                        <StatPill icon={<Users className="h-3.5 w-3.5 text-primary" />} label="Members" value={String(members.length)} />
                                        <StatPill icon={<PlayCircle className="h-3.5 w-3.5 text-primary" />} label="Videos" value={String(videos.length)} />
                                        <StatPill icon={<Sparkles className="h-3.5 w-3.5 text-primary" />} label="Highlights" value={String(highlights.length)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Recruitment Hub</p>
                        <p className="mt-2 text-sm font-semibold text-white/85">Want to join this organization?</p>
                        <p className="mt-1 text-xs leading-relaxed text-white/45">
                            Submit your interest and get contacted by this team manager when openings are available.
                        </p>
                        <button
                            type="button"
                            onClick={submitJoinRequest}
                            disabled={submittingJoin}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/35 bg-primary/10 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/15"
                        >
                            <UserPlus2 className="h-4 w-4" />
                            {submittingJoin ? 'Sending...' : 'Join Our Organization'}
                        </button>
                    </div>
                </div>
            </div>

            <SectionCard title="Trophies" icon={<Medal className="h-4 w-4 text-primary" />}>
                {trophies.length === 0 ? (
                    <EmptyState text="No trophies yet." />
                ) : (
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                        {trophies.map((t) => (
                            <div key={t._id || `${t.title}-${t.year || ''}`} className="rounded-xl border border-white/10 bg-black/35 px-3 py-2.5">
                                <div className="flex items-center gap-2">
                                    <Medal className="h-4 w-4 text-yellow-400" />
                                    <p className="truncate text-sm font-bold text-white">{t.title}</p>
                                </div>
                                <p className="mt-1 text-xs text-white/45">
                                    {[t.position, t.season, t.year].filter(Boolean).join(' • ') || 'Achievement'}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </SectionCard>

            <SectionCard title="Roster" icon={<Users className="h-4 w-4 text-primary" />}>
                {members.length === 0 ? (
                    <EmptyState text="No roster members found." />
                ) : (
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {members.map((m) => (
                            <div key={m._id || `${m.nickname}-${m.email}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/35 px-3 py-2.5">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#101722]">
                                    {m.avatar ? (
                                        <img src={m.avatar} alt={m.nickname} className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-sm font-black text-primary">{m.nickname.slice(0, 1).toUpperCase()}</span>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-white">{m.nickname}</p>
                                    <p className="truncate text-xs text-white/40">{m.email}</p>
                                </div>
                                <div className="ml-auto">
                                    <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
                                        <Flag className="h-3 w-3" />
                                        Active
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </SectionCard>

            <SectionCard title="Videos" icon={<PlayCircle className="h-4 w-4 text-primary" />}>
                {videos.length === 0 ? (
                    <EmptyState text="No videos yet." />
                ) : (
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                        {videos.map((v) => (
                            <a
                                key={v._id || `${v.title}-${v.url || ''}`}
                                href={v.url || '#'}
                                target={v.url ? '_blank' : undefined}
                                rel={v.url ? 'noreferrer' : undefined}
                                className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 hover:border-primary/30"
                            >
                                <div className="flex h-10 w-16 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#101722]">
                                    {v.thumbnail ? <img src={v.thumbnail} alt={v.title} className="h-full w-full object-cover" /> : <PlayCircle className="h-4 w-4 text-primary/70" />}
                                </div>
                                <p className="truncate text-sm font-semibold text-white/85">{v.title}</p>
                            </a>
                        ))}
                    </div>
                )}
            </SectionCard>

            <SectionCard title="Highlights" icon={<Sparkles className="h-4 w-4 text-primary" />}>
                {highlights.length === 0 ? (
                    <EmptyState text="No highlights yet." />
                ) : (
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                        {highlights.map((h) => (
                            <a
                                key={h._id || `${h.title}-${h.url || ''}`}
                                href={h.url || '#'}
                                target={h.url ? '_blank' : undefined}
                                rel={h.url ? 'noreferrer' : undefined}
                                className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 hover:border-primary/30"
                            >
                                <div className="flex h-10 w-16 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#101722]">
                                    {h.thumbnail ? <img src={h.thumbnail} alt={h.title} className="h-full w-full object-cover" /> : <Sparkles className="h-4 w-4 text-primary/70" />}
                                </div>
                                <p className="truncate text-sm font-semibold text-white/85">{h.title}</p>
                            </a>
                        ))}
                    </div>
                )}
            </SectionCard>

            <div className="rounded-3xl border border-white/10 bg-[#0a0d12] p-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">Organization Overview</p>
                <p className="mt-2 text-sm text-white/45">
                    Powered by Arena Chain team profiles.
                </p>
            </div>
        </div>
    );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="rounded-3xl border border-white/10 bg-[#0a0d12] p-4">
            <h2 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/60">
                {icon}
                {title}
            </h2>
            {children}
        </div>
    );
}

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="rounded-xl border border-white/10 bg-black/35 px-2.5 py-2">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white/45">
                {icon}
                {label}
            </div>
            <p className="mt-1 text-sm font-black text-white">{value}</p>
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="rounded-xl border border-dashed border-white/10 bg-black/25 px-4 py-7 text-center">
            <Crown className="mx-auto h-5 w-5 text-white/25" />
            <p className="mt-2 text-sm text-white/35">{text}</p>
        </div>
    );
}
