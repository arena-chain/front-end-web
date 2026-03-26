import { useState, useEffect } from 'react';
import {
    Users, Trophy, Swords, Calendar,
    ChevronRight, PlayCircle, Clock,
    Shield, Settings,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { leagueService, type League } from '../../services/leagueService';
import { seasonService, type Season } from '../../services/seasonService';
import { matchAdminService, type AdminMatch } from '../../services/matchAdminService';

interface StoredUser { nickname?: string; organizationName?: string; avatar?: string }
interface RosterMember { nickname: string; role: string; status: string; avatar?: string }

export default function ManagerDashboard() {
    const navigate = useNavigate();

    const user: StoredUser = (() => {
        try { return JSON.parse(localStorage.getItem('user') || '{}'); }
        catch { return {}; }
    })();

    const userId = (() => {
        try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return u.id || u._id || ''; }
        catch { return ''; }
    })();

    const localRoster: RosterMember[] = (() => {
        try { return JSON.parse(localStorage.getItem(`team_roster_${userId}`) || '[]'); }
        catch { return []; }
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
                // fail silently
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const liveSeasons     = seasons.filter(s => s.status === 'ONGOING');
    const upcomingSeasons = seasons.filter(s => s.status === 'PLANNED');
    const upcomingMatches = matches.filter(m => m.status === 'SCHEDULED' || m.status === 'ONGOING');
    const activeRoster    = localRoster.filter(p => p.status === 'ACTIVE');

    const orgName  = user.organizationName || user.nickname || 'My Team';
    const initials = orgName.slice(0, 2).toUpperCase();

    const teamName = (t: unknown) => {
        if (typeof t === 'object' && t !== null && 'name' in t) return (t as { name: string }).name;
        return `…${String(t).slice(-6)}`;
    };
    const fmt = (d: string) => new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

    const ROLE_COLORS: Record<string, string> = {
        IGL: '#00ff00', AWP: '#ff4444', Entry: '#ff8c00', Support: '#3b9eff',
        Rifler: '#a78bfa', Coach: '#fbbf24', Analyst: '#6ee7b7',
    };

    return (
        <div className="space-y-6">

            {/* ══ TEAM IDENTITY HERO ══ */}
            <div className="relative overflow-hidden rounded-2xl" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #111 50%, #0a0a0a 100%)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {/* Glow */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 80% at 15% 50%, rgba(0,255,0,0.06) 0%, transparent 70%)' }} />
                <div className="absolute right-0 top-0 bottom-0 w-64 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,0,0.03))' }} />

                <div className="relative flex items-center gap-6 p-6 md:p-8">
                    {/* Team crest */}
                    <div className="shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black"
                        style={{ background: 'rgba(0,255,0,0.1)', border: '2px solid rgba(0,255,0,0.25)', color: '#00ff00' }}>
                        {user.avatar
                            ? <img src={user.avatar} className="w-full h-full rounded-2xl object-cover" alt="" />
                            : initials
                        }
                    </div>

                    {/* Identity */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,255,0,0.12)', color: '#00ff00', border: '1px solid rgba(0,255,0,0.2)' }}>ESPORTS ORG</span>
                            {liveSeasons.length > 0 && (
                                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,50,50,0.12)', color: '#ff4444', border: '1px solid rgba(255,50,50,0.2)' }}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    COMPETING
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white leading-none">
                            {orgName}
                        </h1>
                        <p className="text-sm mt-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            {user.nickname && user.organizationName ? `Managed by ${user.nickname}` : 'Configure your org name in Settings'}
                        </p>
                    </div>

                    {/* Mini stats */}
                    <div className="hidden md:flex items-center gap-6 pr-2">
                        {[
                            { v: String(activeRoster.length), l: 'Players' },
                            { v: String(liveSeasons.length), l: 'Active Seasons' },
                            { v: String(upcomingMatches.length), l: 'Matches' },
                        ].map((s, i) => (
                            <div key={i} className="text-center">
                                <div className="text-2xl font-black text-white" style={{ textShadow: '0 0 20px rgba(0,255,0,0.3)' }}>{s.v}</div>
                                <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>{s.l}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ══ STAT STRIP ══ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { icon: <Trophy className="w-4 h-4" style={{ color: '#fbbf24' }} />, label: 'Leagues',        value: loading ? '…' : String(leagues.length),          accent: '#fbbf24', to: '/manager/tournaments' },
                    { icon: <PlayCircle className="w-4 h-4" style={{ color: '#00ff00' }} />, label: 'Live Seasons',  value: loading ? '…' : String(liveSeasons.length),      accent: '#00ff00', to: '/manager/tournaments' },
                    { icon: <Clock className="w-4 h-4" style={{ color: '#3b9eff' }} />,  label: 'Upcoming',      value: loading ? '…' : String(upcomingSeasons.length),  accent: '#3b9eff', to: '/manager/tournaments' },
                    { icon: <Swords className="w-4 h-4" style={{ color: '#ff4444' }} />, label: 'Scheduled',     value: loading ? '…' : String(upcomingMatches.length),  accent: '#ff4444', to: '/manager/scrims' },
                ].map(s => (
                    <button key={s.label} onClick={() => navigate(s.to)}
                        className="group relative overflow-hidden rounded-xl p-4 text-left transition-all"
                        style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = `${s.accent}30`)}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}>
                        <div className="absolute top-0 left-0 w-0.5 h-full rounded-full" style={{ background: s.accent, opacity: 0.6 }} />
                        <div className="pl-2">
                            <div className="flex items-center justify-between mb-2">
                                <div className="p-1.5 rounded-lg" style={{ background: `${s.accent}15` }}>{s.icon}</div>
                                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: s.accent }} />
                            </div>
                            <div className="text-2xl font-black text-white mb-0.5">{s.value}</div>
                            <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
                        </div>
                    </button>
                ))}
            </div>

            {/* ══ MAIN GRID ══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Live Seasons — spans 2 cols */}
                <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="flex items-center gap-2">
                            <PlayCircle className="w-4 h-4" style={{ color: '#00ff00' }} />
                            <span className="text-sm font-bold text-white">Active Competitions</span>
                        </div>
                        <button onClick={() => navigate('/manager/tournaments')} className="text-[11px] font-bold flex items-center gap-1 transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#00ff00')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>View all <ChevronRight className="w-3 h-3" /></button>
                    </div>
                    <div className="p-4 space-y-2">
                        {loading ? (
                            <div className="py-8 text-center text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>Loading competitions…</div>
                        ) : liveSeasons.length === 0 && upcomingSeasons.length === 0 ? (
                            <div className="py-10 flex flex-col items-center gap-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                <Trophy className="w-8 h-8 opacity-30" />
                                <p className="text-sm">No active competitions — register your team in a league</p>
                                <button onClick={() => navigate('/manager/tournaments')}
                                    className="mt-1 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                                    style={{ background: 'rgba(0,255,0,0.08)', color: '#00ff00', border: '1px solid rgba(0,255,0,0.15)' }}>
                                    Browse Leagues
                                </button>
                            </div>
                        ) : (
                            [...liveSeasons, ...upcomingSeasons].slice(0, 5).map(s => (
                                <div key={s._id} className="flex items-center justify-between px-4 py-3 rounded-xl transition-colors"
                                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.status === 'ONGOING' ? 'rgba(0,255,0,0.1)' : 'rgba(59,158,255,0.1)' }}>
                                            {s.status === 'ONGOING'
                                                ? <PlayCircle className="w-4 h-4" style={{ color: '#00ff00' }} />
                                                : <Clock className="w-4 h-4" style={{ color: '#3b9eff' }} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{s.name}</p>
                                            <p className="text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                                <Calendar className="w-3 h-3" />
                                                {s.status === 'ONGOING'
                                                    ? `Ends ${new Date(s.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
                                                    : `Starts ${new Date(s.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full"
                                        style={s.status === 'ONGOING'
                                            ? { background: 'rgba(0,255,0,0.1)', color: '#00ff00', border: '1px solid rgba(0,255,0,0.2)' }
                                            : { background: 'rgba(59,158,255,0.1)', color: '#3b9eff', border: '1px solid rgba(59,158,255,0.2)' }}>
                                        {s.status === 'ONGOING' ? '🔴 LIVE' : 'UPCOMING'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Roster Snapshot */}
                <div className="rounded-xl overflow-hidden" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" style={{ color: '#3b9eff' }} />
                            <span className="text-sm font-bold text-white">Roster</span>
                            {activeRoster.length > 0 && (
                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(0,255,0,0.1)', color: '#00ff00' }}>{activeRoster.length}</span>
                            )}
                        </div>
                        <button onClick={() => navigate('/manager/roster')} className="text-[11px] font-bold flex items-center gap-1 transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#00ff00')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>Manage <ChevronRight className="w-3 h-3" /></button>
                    </div>
                    <div className="p-4">
                        {activeRoster.length === 0 ? (
                            <div className="py-8 flex flex-col items-center gap-3 text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                <Shield className="w-7 h-7 opacity-30" />
                                <p className="text-xs">No players yet — invite your squad</p>
                                <button onClick={() => navigate('/manager/roster')}
                                    className="text-xs font-bold px-3 py-1.5 rounded-lg"
                                    style={{ background: 'rgba(59,158,255,0.08)', color: '#3b9eff', border: '1px solid rgba(59,158,255,0.15)' }}>
                                    + Invite Players
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {activeRoster.slice(0, 6).map((p, i) => (
                                    <div key={i} className="flex items-center gap-3 py-2">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                                            style={{ background: `${ROLE_COLORS[p.role] || '#888'}18`, color: ROLE_COLORS[p.role] || '#888', border: `1px solid ${ROLE_COLORS[p.role] || '#888'}30` }}>
                                            {p.avatar ? <img src={p.avatar} className="w-full h-full rounded-lg object-cover" alt="" /> : p.nickname.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{p.nickname}</p>
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
                                            style={{ background: `${ROLE_COLORS[p.role] || '#888'}18`, color: ROLE_COLORS[p.role] || '#888' }}>
                                            {p.role}
                                        </span>
                                    </div>
                                ))}
                                {activeRoster.length > 6 && (
                                    <p className="text-xs text-center pt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>+{activeRoster.length - 6} more</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ══ MATCH CENTER ══ */}
            <div className="rounded-xl overflow-hidden" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-2">
                        <Swords className="w-4 h-4" style={{ color: '#ff4444' }} />
                        <span className="text-sm font-bold text-white">Match Center</span>
                    </div>
                    <button onClick={() => navigate('/manager/scrims')} className="text-[11px] font-bold flex items-center gap-1 transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#ff4444')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>All matches <ChevronRight className="w-3 h-3" /></button>
                </div>
                {loading ? (
                    <div className="py-10 text-center text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>Loading matches…</div>
                ) : upcomingMatches.length === 0 ? (
                    <div className="py-10 flex flex-col items-center gap-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
                        <Swords className="w-8 h-8 opacity-30" />
                        <p className="text-sm">No scheduled matches — join a season to start competing</p>
                    </div>
                ) : (
                    <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                        {upcomingMatches.map(m => (
                            <div key={m._id} className="flex items-center gap-4 px-5 py-4">
                                {/* Status indicator */}
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: m.status === 'ONGOING' ? '#00ff00' : '#3b9eff', boxShadow: `0 0 6px ${m.status === 'ONGOING' ? '#00ff00' : '#3b9eff'}` }} />
                                {/* VS layout */}
                                <div className="flex-1 flex items-center gap-3">
                                    <span className="font-bold text-sm text-white truncate">{teamName(m.team1Id)}</span>
                                    <span className="text-xs font-black px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>VS</span>
                                    <span className="font-bold text-sm text-white truncate">{teamName(m.team2Id)}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Calendar className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
                                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{fmt(m.scheduledStart)}</span>
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full"
                                        style={m.status === 'ONGOING'
                                            ? { background: 'rgba(0,255,0,0.1)', color: '#00ff00', border: '1px solid rgba(0,255,0,0.2)' }
                                            : { background: 'rgba(59,158,255,0.1)', color: '#3b9eff', border: '1px solid rgba(59,158,255,0.2)' }}>
                                        {m.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ══ QUICK ACTIONS ══ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Manage Roster',  icon: <Users className="w-5 h-5" />,       to: '/manager/roster',      accent: '#3b9eff',  desc: 'Players & invites' },
                    { label: 'Leagues',        icon: <Trophy className="w-5 h-5" />,      to: '/manager/tournaments', accent: '#fbbf24',  desc: 'Browse & register' },
                    { label: 'Scrims',         icon: <Swords className="w-5 h-5" />,      to: '/manager/scrims',      accent: '#ff4444',  desc: 'Schedule practice' },
                    { label: 'Settings',       icon: <Settings className="w-5 h-5" />,    to: '/manager/settings',    accent: '#a78bfa',  desc: 'Profile & org' },
                ].map(a => (
                    <button key={a.to} onClick={() => navigate(a.to)}
                        className="group flex items-center gap-3 p-4 rounded-xl text-left transition-all"
                        style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = `${a.accent}30`; e.currentTarget.style.background = `${a.accent}08`; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = '#0d0d0d'; }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${a.accent}15`, color: a.accent }}>
                            {a.icon}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">{a.label}</p>
                            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{a.desc}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: a.accent }} />
                    </button>
                ))}
            </div>

        </div>
    );
}

// ── tiny helpers still referenced by import (kept for no breaking changes) ──
export function EmptyDashState() { return null; }
export function DashSection() { return null; }
