import { useState, useEffect } from 'react';
import {
    Users, Trophy, TrendingUp, Calendar, Swords, Clock,
    ChevronRight, PlayCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { leagueService, type League } from '../../services/leagueService';
import { seasonService, type Season } from '../../services/seasonService';
import { matchAdminService, type AdminMatch } from '../../services/matchAdminService';

interface StoredUser { nickname?: string; organizationName?: string }

export default function ManagerDashboard() {
    const navigate = useNavigate();

    const user: StoredUser = (() => {
        try { return JSON.parse(localStorage.getItem('user') || '{}'); }
        catch { return {}; }
    })();

    const [leagues, setLeagues]   = useState<League[]>([]);
    const [seasons, setSeas]      = useState<Season[]>([]);
    const [matches, setMatches]   = useState<AdminMatch[]>([]);
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const lgs = await leagueService.getAllLeagues();
                setLeagues(lgs);
                const allSeasons: Season[] = [];
                for (const l of lgs.slice(0, 3)) {
                    const sns = await seasonService.getByLeague(l._id);
                    allSeasons.push(...sns);
                }
                setSeas(allSeasons);
                if (allSeasons.length) {
                    const ms = await matchAdminService.getBySeason(allSeasons[0]._id);
                    setMatches(ms.slice(0, 5));
                }
            } catch {
                // fail silently — data might not be available yet
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const liveSeasons     = seasons.filter(s => s.status === 'ONGOING');
    const upcomingSeasons = seasons.filter(s => s.status === 'PLANNED');
    const upcomingMatches = matches.filter(m => m.status === 'SCHEDULED' || m.status === 'ONGOING');

    const teamName = (t: unknown) => {
        if (typeof t === 'object' && t !== null && 'name' in t) return (t as { name: string }).name;
        return `…${String(t).slice(-6)}`;
    };

    const fmt = (d: string) => new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

    return (
        <div className="space-y-8">
            {/* Welcome banner */}
            <div className="bg-gradient-to-r from-primary/10 via-surface to-surface border border-white/5 rounded-2xl p-6">
                <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-1">
                    Welcome back, {user.nickname || 'Manager'}
                </h1>
                <p className="text-text-muted text-sm">
                    {user.organizationName ? `Managing ${user.organizationName}` : 'Manage your team, roster, and competitions'}
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon={<Trophy className="w-5 h-5 text-yellow-500" />}
                    label="Total Leagues"
                    value={loading ? '—' : String(leagues.length)}
                    sub="available"
                    onClick={() => navigate('/manager/tournaments')}
                />
                <StatCard
                    icon={<PlayCircle className="w-5 h-5 text-primary" />}
                    label="Live Seasons"
                    value={loading ? '—' : String(liveSeasons.length)}
                    sub="ongoing"
                    onClick={() => navigate('/manager/tournaments')}
                />
                <StatCard
                    icon={<Clock className="w-5 h-5 text-blue-400" />}
                    label="Upcoming"
                    value={loading ? '—' : String(upcomingSeasons.length)}
                    sub="seasons planned"
                    onClick={() => navigate('/manager/tournaments')}
                />
                <StatCard
                    icon={<Swords className="w-5 h-5 text-rose-400" />}
                    label="Next Matches"
                    value={loading ? '—' : String(upcomingMatches.length)}
                    sub="scheduled"
                    onClick={() => navigate('/manager/tournaments')}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Live seasons */}
                <Section
                    title="Live Seasons"
                    icon={<PlayCircle className="w-4 h-4 text-primary" />}
                    onMore={() => navigate('/manager/tournaments')}>
                    {loading ? (
                        <p className="text-text-muted text-sm py-4 text-center">Loading…</p>
                    ) : liveSeasons.length === 0 ? (
                        <EmptyState icon={<Trophy />} msg="No live seasons" />
                    ) : (
                        liveSeasons.slice(0, 4).map(s => (
                            <div key={s._id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                                <div>
                                    <p className="text-white text-sm font-medium">{s.name}</p>
                                    <p className="text-text-muted text-xs flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        Ends {new Date(s.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                    </p>
                                </div>
                                <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-medium">
                                    LIVE
                                </span>
                            </div>
                        ))
                    )}
                </Section>

                {/* Upcoming matches */}
                <Section
                    title="Upcoming Matches"
                    icon={<Swords className="w-4 h-4 text-rose-400" />}
                    onMore={() => navigate('/manager/tournaments')}>
                    {loading ? (
                        <p className="text-text-muted text-sm py-4 text-center">Loading…</p>
                    ) : upcomingMatches.length === 0 ? (
                        <EmptyState icon={<Swords />} msg="No upcoming matches" />
                    ) : (
                        upcomingMatches.map(m => (
                            <div key={m._id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                                <div>
                                    <p className="text-white text-sm font-medium">
                                        {teamName(m.team1Id)} <span className="text-text-muted">vs</span> {teamName(m.team2Id)}
                                    </p>
                                    <p className="text-text-muted text-xs flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />{fmt(m.scheduledStart)}
                                    </p>
                                </div>
                                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${m.status === 'ONGOING'
                                    ? 'bg-primary/10 text-primary border-primary/20'
                                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                    {m.status}
                                </span>
                            </div>
                        ))
                    )}
                </Section>
            </div>

            {/* Quick actions */}
            <div className="bg-surface border border-white/5 rounded-xl p-5">
                <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: 'Manage Roster',    icon: <Users className="w-5 h-5" />,    to: '/manager/roster',       color: 'text-blue-400' },
                        { label: 'View Leagues',     icon: <Trophy className="w-5 h-5" />,   to: '/manager/tournaments',  color: 'text-yellow-500' },
                        { label: 'Schedule Scrim',   icon: <Swords className="w-5 h-5" />,   to: '/manager/scrims',       color: 'text-rose-400' },
                        { label: 'Settings',         icon: <TrendingUp className="w-5 h-5" />, to: '/manager/settings',   color: 'text-text-muted' },
                    ].map(a => (
                        <button key={a.to} onClick={() => navigate(a.to)}
                            className="flex flex-col items-center gap-2 p-4 bg-white/3 border border-white/5 rounded-xl hover:bg-white/5 hover:border-white/10 transition-all group">
                            <span className={a.color}>{a.icon}</span>
                            <span className="text-xs font-medium text-text-muted group-hover:text-white transition-colors text-center">{a.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, sub, onClick }: {
    icon: React.ReactNode; label: string; value: string; sub: string; onClick?: () => void;
}) {
    return (
        <button onClick={onClick}
            className="bg-surface border border-white/5 rounded-xl p-5 text-left hover:border-white/10 hover:bg-white/3 transition-all group w-full">
            <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
                <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-2xl font-black text-white mb-0.5">{value}</div>
            <div className="text-xs text-text-muted font-medium uppercase tracking-wider">{label}</div>
            <div className="text-xs text-text-muted">{sub}</div>
        </button>
    );
}

function Section({ title, icon, children, onMore }: {
    title: string; icon: React.ReactNode; children: React.ReactNode; onMore: () => void;
}) {
    return (
        <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-sm font-bold text-white">{title}</span>
                </div>
                <button onClick={onMore} className="text-xs text-text-muted hover:text-white transition-colors flex items-center gap-1">
                    View all <ChevronRight className="w-3 h-3" />
                </button>
            </div>
            <div className="px-5">{children}</div>
        </div>
    );
}

function EmptyState({ icon, msg }: { icon: React.ReactNode; msg: string }) {
    return (
        <div className="flex flex-col items-center gap-2 py-8 text-text-muted">
            <span className="opacity-30 scale-150">{icon}</span>
            <p className="text-sm mt-2">{msg}</p>
        </div>
    );
}
