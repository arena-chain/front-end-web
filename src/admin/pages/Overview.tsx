import { useEffect, useState } from 'react';
import {
    Users, Trophy, Newspaper, Tv2,
    TrendingUp, Shield, Zap,
    Crown, Star, UserCheck, Clock,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { UserService, type User } from '../../services/userService';
import tournamentService from '../../services/tournamentService';
import { newsService } from '../../services/newsService';
import { channelService } from '../../services/channel.service';

interface DashboardStats {
    totalUsers: number;
    activeUsers: number;
    totalTournaments: number;
    activeTournaments: number;
    totalNews: number;
    totalChannels: number;
    recentUsers: User[];
    roleBreakdown: { role: string; count: number; color: string; icon: React.ReactNode }[];
}

const ROLE_META: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    player:      { color: 'text-primary',    bg: 'bg-primary',    icon: <Zap size={12} /> },
    admin:       { color: 'text-red-400',    bg: 'bg-red-400',    icon: <Shield size={12} /> },
    team_manager:{ color: 'text-yellow-400', bg: 'bg-yellow-400', icon: <Crown size={12} /> },
    referee:     { color: 'text-blue-400',   bg: 'bg-blue-400',   icon: <UserCheck size={12} /> },
    scouter:     { color: 'text-purple-400', bg: 'bg-purple-400', icon: <Star size={12} /> },
};

function getRoleMeta(role: string) {
    return ROLE_META[role?.toLowerCase()] ?? { color: 'text-white/40', bg: 'bg-white/40', icon: <Users size={12} /> };
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const [users, tournaments, channels] = await Promise.allSettled([
                UserService.getAllUsers(),
                tournamentService.fetchTournaments(),
                channelService.getAllChannels(),
            ]);

            let newsTotal = 0;
            try {
                const newsRes = await newsService.getNews({ limit: 1 });
                newsTotal = newsRes.total ?? 0;
            } catch { /* graceful */ }

            const userList: User[] = users.status === 'fulfilled' ? users.value : [];
            const tournamentList = tournaments.status === 'fulfilled' ? tournaments.value : [];
            const channelList = channels.status === 'fulfilled' ? channels.value : [];

            const roleCounts: Record<string, number> = {};
            for (const u of userList) {
                const r = u.role?.toLowerCase() ?? 'unknown';
                roleCounts[r] = (roleCounts[r] ?? 0) + 1;
            }

            const roleBreakdown = Object.entries(roleCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([role, count]) => ({
                    role,
                    count,
                    color: getRoleMeta(role).color,
                    icon: getRoleMeta(role).icon,
                }));

            const recentUsers = [...userList]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 6);

            setStats({
                totalUsers: userList.length,
                activeUsers: userList.filter(u => u.isActive).length,
                totalTournaments: tournamentList.length,
                activeTournaments: tournamentList.filter((t: any) =>
                    ['ongoing', 'active', 'in_progress', 'live'].includes(t.status?.toLowerCase())
                ).length,
                totalNews: newsTotal,
                totalChannels: channelList.length,
                recentUsers,
                roleBreakdown,
            });
            setLastUpdated(new Date());
        } catch (e) {
            console.error('Dashboard load error:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    return (
        <div className="space-y-8 animate-fade-in-up">

            {/* ── Stat Cards ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-32 rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse" />
                    ))
                ) : (
                    <>
                        <StatCard
                            title="Total Users"
                            value={stats?.totalUsers ?? 0}
                            sub={`${stats?.activeUsers ?? 0} active`}
                            icon={<Users size={20} />}
                            accent="from-primary/20 to-primary/5"
                            iconColor="text-primary"
                            glowColor="rgba(57,255,20,0.08)"
                        />
                        <StatCard
                            title="Tournaments"
                            value={stats?.totalTournaments ?? 0}
                            sub={`${stats?.activeTournaments ?? 0} live now`}
                            icon={<Trophy size={20} />}
                            accent="from-yellow-500/20 to-yellow-500/5"
                            iconColor="text-yellow-400"
                            glowColor="rgba(234,179,8,0.08)"
                        />
                        <StatCard
                            title="News Articles"
                            value={stats?.totalNews ?? 0}
                            sub="published"
                            icon={<Newspaper size={20} />}
                            accent="from-blue-500/20 to-blue-500/5"
                            iconColor="text-blue-400"
                            glowColor="rgba(59,130,246,0.08)"
                        />
                        <StatCard
                            title="Channels"
                            value={stats?.totalChannels ?? 0}
                            sub="user-created"
                            icon={<Tv2 size={20} />}
                            accent="from-purple-500/20 to-purple-500/5"
                            iconColor="text-purple-400"
                            glowColor="rgba(168,85,247,0.08)"
                        />
                    </>
                )}
            </div>

            {/* ── Middle Row ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Role Breakdown */}
                <div className="lg:col-span-2 bg-surface border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-white font-black uppercase tracking-tight">User Role Breakdown</h3>
                            <p className="text-xs text-text-muted mt-0.5">Distribution across platform roles</p>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20">
                            <TrendingUp size={12} className="text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                                {stats?.totalUsers ?? '—'} total
                            </span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-8 rounded-lg bg-white/[0.03] animate-pulse" />
                            ))}
                        </div>
                    ) : stats?.roleBreakdown.length ? (
                        <div className="space-y-4">
                            {stats.roleBreakdown.map(({ role, count, color, icon }) => {
                                const pct = stats.totalUsers > 0 ? Math.round((count / stats.totalUsers) * 100) : 0;
                                const meta = getRoleMeta(role);
                                return (
                                    <div key={role}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className={cn('flex items-center justify-center w-5 h-5 rounded-md', meta.bg + '/20', color)}>
                                                    {icon}
                                                </span>
                                                <span className="text-xs font-black uppercase tracking-widest text-white/70">
                                                    {role.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={cn('text-xs font-black', color)}>{count}</span>
                                                <span className="text-[10px] text-white/20 font-bold">{pct}%</span>
                                            </div>
                                        </div>
                                        <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                                            <div
                                                className={cn('h-full rounded-full transition-all duration-700', meta.bg)}
                                                style={{ width: `${pct}%`, opacity: 0.7 }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-32 text-text-muted text-sm">
                            No user data available
                        </div>
                    )}
                </div>

                {/* Recent Registrations */}
                <div className="bg-surface border border-white/5 rounded-2xl p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-white font-black uppercase tracking-tight">Recent Signups</h3>
                        <Clock size={14} className="text-text-muted" />
                    </div>

                    {loading ? (
                        <div className="space-y-3 flex-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-12 rounded-xl bg-white/[0.03] animate-pulse" />
                            ))}
                        </div>
                    ) : stats?.recentUsers.length ? (
                        <div className="space-y-2 flex-1">
                            {stats.recentUsers.map((u) => {
                                const meta = getRoleMeta(u.role);
                                const initials = (u.nickname ?? u.email ?? '?').slice(0, 2).toUpperCase();
                                return (
                                    <div key={u._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors group">
                                        <div className={cn(
                                            'w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black flex-shrink-0 border',
                                            meta.bg + '/10', meta.color, 'border-' + meta.bg.replace('bg-', '') + '/20'
                                        )}>
                                            {initials}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs font-bold text-white truncate">
                                                {u.nickname ?? u.email}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className={cn('text-[9px] font-black uppercase tracking-widest', meta.color)}>
                                                    {u.role?.replace('_', ' ')}
                                                </span>
                                                <span className="text-[9px] text-white/20">·</span>
                                                <span className="text-[9px] text-white/30">{timeAgo(u.createdAt)}</span>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            'w-1.5 h-1.5 rounded-full flex-shrink-0',
                                            u.isActive ? 'bg-green-400' : 'bg-white/10'
                                        )} />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center flex-1 text-text-muted text-sm">
                            No users found
                        </div>
                    )}

                    {lastUpdated && (
                        <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mt-4 pt-3 border-t border-white/5">
                            Updated {timeAgo(lastUpdated.toISOString())}
                        </p>
                    )}
                </div>
            </div>

            {/* ── Quick Links ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                    { label: 'Users',       icon: <Users size={18} />,       href: '/admin/users',        color: 'text-primary',    ring: 'hover:border-primary/30' },
                    { label: 'Tournaments', icon: <Trophy size={18} />,      href: '/admin/tournaments',  color: 'text-yellow-400', ring: 'hover:border-yellow-500/30' },
                    { label: 'News',        icon: <Newspaper size={18} />,   href: '/admin/news',         color: 'text-blue-400',   ring: 'hover:border-blue-500/30' },
                    { label: 'Channels',    icon: <Tv2 size={18} />,         href: '/admin/channels',     color: 'text-purple-400', ring: 'hover:border-purple-500/30' },
                    { label: 'NFT Studio',  icon: <Star size={18} />,        href: '/admin/nft-manager',  color: 'text-amber-400',  ring: 'hover:border-amber-500/30' },
                    { label: 'Settings',    icon: <Shield size={18} />,      href: '/admin/settings',     color: 'text-white/40',   ring: 'hover:border-white/20' },
                ].map(({ label, icon, href, color, ring }) => (
                    <a
                        key={label}
                        href={href}
                        className={cn(
                            'flex flex-col items-center justify-center gap-2 py-5 rounded-2xl bg-surface border border-white/5 transition-all duration-200 group',
                            ring
                        )}
                    >
                        <span className={cn('transition-transform duration-200 group-hover:scale-110', color)}>{icon}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/50 group-hover:text-white/80 transition-colors">
                            {label}
                        </span>
                    </a>
                ))}
            </div>
        </div>
    );
}

function StatCard({ title, value, sub, icon, accent, iconColor, glowColor }: {
    title: string;
    value: number;
    sub: string;
    icon: React.ReactNode;
    accent: string;
    iconColor: string;
    glowColor: string;
}) {
    return (
        <div
            className="relative bg-surface border border-white/5 rounded-2xl p-5 overflow-hidden hover:border-white/10 transition-all duration-300 group"
            style={{ '--glow': glowColor } as React.CSSProperties}
        >
            <div className={cn('absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none', accent)} />
            <div className="relative">
                <div className="flex items-start justify-between mb-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{title}</p>
                    <span className={cn('p-2 rounded-xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform', iconColor)}>
                        {icon}
                    </span>
                </div>
                <div className="text-4xl font-black text-white tracking-tighter leading-none tabular-nums">
                    {value.toLocaleString()}
                </div>
                <p className="text-xs text-white/30 font-bold mt-1.5">{sub}</p>
            </div>
        </div>
    );
}
