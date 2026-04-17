import { useState, useEffect, useRef } from 'react';
import {
    Users, UserPlus, X, Check, AlertCircle,
    Shield, Pencil, Trash2, Search, RefreshCw, Settings,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { teamManagerService, type TeamMember, type PlayerSearchResult } from '../../services/teamManagerService';
import { AuthService } from '../../services/auth.service';

// ── Types ──────────────────────────────────────────────────────────────────────

type PlayerStatus = 'ACTIVE' | 'BENCHED' | 'TRIAL' | 'INACTIVE';
type PlayerRole   = 'IGL' | 'AWP' | 'Entry' | 'Rifler' | 'Support' | 'Coach' | 'Analyst' | 'Flex';

interface TeamPlayer {
    id:        string;
    nickname:  string;
    playerId?: string;       // backend player ID if known
    email?:    string;
    role:      PlayerRole;
    status:    PlayerStatus;
    joinedAt:  string;
    avatar?:   string;
    number?:   number;
}

interface Toast { msg: string; ok: boolean }

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLES: PlayerRole[] = ['IGL', 'AWP', 'Entry', 'Rifler', 'Support', 'Coach', 'Analyst', 'Flex'];

const ROLE_META: Record<PlayerRole, { color: string; label: string }> = {
    IGL:     { color: '#00ff00', label: 'In-Game Leader'  },
    AWP:     { color: '#ff4444', label: 'AWP Sniper'      },
    Entry:   { color: '#ff8c00', label: 'Entry Fragger'   },
    Rifler:  { color: '#a78bfa', label: 'Rifler'          },
    Support: { color: '#3b9eff', label: 'Support'         },
    Coach:   { color: '#fbbf24', label: 'Coach'           },
    Analyst: { color: '#6ee7b7', label: 'Analyst'         },
    Flex:    { color: '#f472b6', label: 'Flex Player'     },
};

const STATUS_META: Record<PlayerStatus, { color: string; bg: string; border: string }> = {
    ACTIVE:   { color: '#00ff00', bg: 'rgba(0,255,0,0.1)',     border: 'rgba(0,255,0,0.2)'    },
    BENCHED:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)' },
    TRIAL:    { color: '#3b9eff', bg: 'rgba(59,158,255,0.1)',  border: 'rgba(59,158,255,0.2)' },
    INACTIVE: { color: '#666',    bg: 'rgba(100,100,100,0.1)', border: 'rgba(100,100,100,0.2)'},
};

// ── Local meta helpers ─────────────────────────────────────────────────────────

type RoleMeta = { role: PlayerRole; status: PlayerStatus; number?: number };

function loadMeta(uid: string): Record<string, RoleMeta> {
    try { return JSON.parse(localStorage.getItem(`roster_meta_${uid}`) || '{}'); }
    catch { return {}; }
}
function saveMeta(uid: string, m: Record<string, RoleMeta>) {
    localStorage.setItem(`roster_meta_${uid}`, JSON.stringify(m));
}

// Merge backend member + local meta into display player
function toPlayer(m: TeamMember, meta: RoleMeta | undefined): TeamPlayer {
    return {
        id:       m._id,
        nickname: m.nickname,
        avatar:   m.avatar,
        playerId: m._id,
        email:    m.email,
        role:     meta?.role   ?? 'Rifler',
        status:   meta?.status ?? 'ACTIVE',
        number:   meta?.number,
        joinedAt: new Date().toISOString(),
    };
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ManagerRoster() {
    const navigate = useNavigate();
    const userId = (() => {
        try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return u.id || u._id || 'default'; }
        catch { return 'default'; }
    })();

    const [members,    setMembers]    = useState<TeamMember[]>([]);
    const [meta,       setMetaState]  = useState<Record<string, RoleMeta>>(() => loadMeta(userId));
    const [teamExists, setTeamExists] = useState<boolean | null>(null); // null = loading
    const [teamName,    setTeamName]   = useState<string | null>(null);
    const [managerStatus, setManagerStatus] = useState<string | null>(null);
    const [loading,    setLoading]    = useState(true);
    const [tab,        setTab]        = useState<PlayerStatus | 'ALL'>('ALL');
    const [toast,      setToast]      = useState<Toast | null>(null);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [editPlayer, setEditPlayer] = useState<TeamPlayer | null>(null);
    const [search,     setSearch]     = useState('');

    const notify = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };

    // ── Load team + members ──────────────────────────────────────────────────
    const loadTeam = () => {
        setLoading(true);
        void (async () => {
            try {
                await AuthService.fetchProfile();
            } catch {
                /* still try roster with existing session */
            }
            try {
                const t = await teamManagerService.getMyTeam();
                if (!t) {
                    setTeamExists(false);
                    setMembers([]);
                    setTeamName(null);
                    setManagerStatus(null);
                } else {
                    setTeamExists(true);
                    setMembers(t.members ?? []);
                    setTeamName(t.name ?? null);
                    setManagerStatus(t.managerStatus ?? null);
                }
            } catch {
                setTeamExists(false);
                setMembers([]);
                setTeamName(null);
                setManagerStatus(null);
            } finally {
                setLoading(false);
            }
        })();
    };
    useEffect(loadTeam, []);

    // ── Meta helpers ─────────────────────────────────────────────────────────
    const updateMeta = (id: string, patch: Partial<RoleMeta>) => {
        const existing = meta[id] ?? { role: 'Rifler' as PlayerRole, status: 'ACTIVE' as PlayerStatus };
        const next = { ...meta, [id]: { ...existing, ...patch } };
        setMetaState(next);
        saveMeta(userId, next);
    };

    // ── Remove player ─────────────────────────────────────────────────────────
    const removePlayer = async (playerUserId: string, nickname: string) => {
        try {
            await teamManagerService.removePlayer(playerUserId);
            setMembers(prev => prev.filter(m => m._id !== playerUserId));
            notify(`${nickname} removed from roster`);
        } catch { notify('Failed to remove player', false); }
    };

    // ── Edit local metadata ───────────────────────────────────────────────────
    const handleEdit = (updated: TeamPlayer) => {
        updateMeta(updated.id, { role: updated.role, status: updated.status, number: updated.number });
        setEditPlayer(null);
        notify('Player updated');
    };

    // ── Build display list ────────────────────────────────────────────────────
    const roster: TeamPlayer[] = members.map(m => toPlayer(m, meta[m._id]));

    const filtered = roster.filter(p => {
        const matchTab    = tab === 'ALL' || p.status === tab;
        const matchSearch = !search || p.nickname.toLowerCase().includes(search.toLowerCase());
        return matchTab && matchSearch;
    });

    const counts: Record<string, number> = {
        ALL:      roster.length,
        ACTIVE:   roster.filter(p => p.status === 'ACTIVE').length,
        BENCHED:  roster.filter(p => p.status === 'BENCHED').length,
        TRIAL:    roster.filter(p => p.status === 'TRIAL').length,
        INACTIVE: roster.filter(p => p.status === 'INACTIVE').length,
    };

    const canInvite = managerStatus === 'approved';
    const isRejected = managerStatus === 'rejected';
    const pendingApproval = managerStatus === 'pending';

    // ── No-team guard (only when API has no team / profile — not when you already picked a team at registration)
    if (teamExists === false && !loading) {
        return (
            <div className="flex flex-col items-center gap-5 py-24 rounded-2xl"
                style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Shield className="w-12 h-12 opacity-20 text-white" />
                <div className="text-center max-w-md">
                    <p className="text-white font-bold">Could not load your team</p>
                    <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        If you registered as a manager for an existing team, ensure your email is verified and your session is up to date.
                        You can also create a new team in Settings if your org allows it.
                    </p>
                </div>
                <button type="button" onClick={() => navigate('/manager/settings')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
                    style={{ background: '#00ff00', color: '#000' }}>
                    <Settings className="w-4 h-4" /> Team settings
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium border backdrop-blur-sm
                    ${toast.ok ? 'bg-emerald-900/90 text-emerald-200 border-emerald-500/30' : 'bg-red-900/90 text-red-200 border-red-500/30'}`}>
                    {toast.ok ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {toast.msg}
                </div>
            )}

            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                        <Users className="w-6 h-6" style={{ color: '#3b9eff' }} />
                        {teamName ? teamName : 'Team Roster'}
                        {loading && <RefreshCw className="w-4 h-4 animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />}
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {teamName && <span className="text-white/80 font-semibold mr-2">Roster</span>}
                        {counts.ACTIVE} active · {counts.TRIAL} on trial · {counts.BENCHED} benched
                        {pendingApproval && (
                            <span className="ml-2 text-amber-400/90 text-xs font-bold uppercase tracking-wide"> · Awaiting admin approval</span>
                        )}
                    </p>
                </div>
                <button type="button" onClick={() => !isRejected && setInviteOpen(true)}
                    disabled={isRejected}
                    title={isRejected ? 'Application rejected — recruiting disabled' : (canInvite ? 'Search and invite players' : 'Browse players (invites unlock after admin approval)')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{ background: isRejected ? 'rgba(255,255,255,0.15)' : '#00ff00', color: isRejected ? 'rgba(255,255,255,0.6)' : '#000' }}>
                    <UserPlus className="w-4 h-4" /> {canInvite ? 'Invite Player' : 'Find players'}
                </button>
            </div>

            {pendingApproval && (
                <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', color: 'rgba(253,230,138,0.95)' }}>
                    Your manager request is <strong>pending</strong>. Open <strong>Find players</strong> to search the roster pool; <strong>Invite</strong> stays off until an admin approves you under Manager requests.
                </div>
            )}

            {managerStatus === 'rejected' && (
                <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: 'rgba(254,202,202,0.95)' }}>
                    Your manager application was <strong>rejected</strong>. Recruiting is disabled. Contact support or register again if appropriate.
                </div>
            )}

            {/* ── Search + Tabs ── */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.25)' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search roster…"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white outline-none"
                        style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
                <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: '#0d0d0d' }}>
                    {(['ALL', 'ACTIVE', 'BENCHED', 'TRIAL', 'INACTIVE'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className="px-3 py-2.5 text-[11px] font-black uppercase tracking-wider transition-all"
                            style={tab === t ? { background: 'rgba(0,255,0,0.12)', color: '#00ff00' } : { color: 'rgba(255,255,255,0.3)' }}>
                            {t}{counts[t] > 0 && <span className="ml-1 opacity-60">{counts[t]}</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Player Grid ── */}
            {loading ? (
                <div className="py-20 flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    <RefreshCw className="w-6 h-6 animate-spin mr-3" /> Loading roster…
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-20 rounded-2xl"
                    style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Shield className="w-10 h-10 opacity-20 text-white" />
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {roster.length === 0 ? 'No players yet — invite your squad to get started' : 'No players in this category'}
                    </p>
                    {roster.length === 0 && !isRejected && (
                        <button type="button" onClick={() => setInviteOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
                            style={{ background: 'rgba(0,255,0,0.08)', color: '#00ff00', border: '1px solid rgba(0,255,0,0.15)' }}>
                            <UserPlus className="w-4 h-4" /> {canInvite ? 'Invite first player' : 'Find players'}
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filtered.map(p => (
                        <PlayerCard key={p.id} player={p}
                            onEdit={() => setEditPlayer(p)}
                            onRemove={() => removePlayer(p.id, p.nickname)}
                            onStatusChange={s => updateMeta(p.id, { status: s })} />
                    ))}
                </div>
            )}

            {inviteOpen && (
                <InviteModal
                    onClose={() => setInviteOpen(false)}
                    existingIds={members.map(m => m._id)}
                    canInvite={canInvite}
                    onInvited={m => {
                        setMembers(prev => [...prev, m]);
                        setInviteOpen(false);
                        notify(`${m.nickname} added to roster`);
                    }}
                    notify={notify}
                />
            )}
            {editPlayer && <EditModal player={editPlayer} onClose={() => setEditPlayer(null)} onSave={handleEdit} />}
        </div>
    );
}

// ── Player Card ────────────────────────────────────────────────────────────────

function PlayerCard({ player: p, onEdit, onRemove, onStatusChange }: {
    player: TeamPlayer;
    onEdit: () => void;
    onRemove: () => void;
    onStatusChange: (s: PlayerStatus) => void;
}) {
    const rm = ROLE_META[p.role];
    const sm = STATUS_META[p.status];
    const initials = p.nickname.slice(0, 2).toUpperCase();

    return (
        <div className="group relative rounded-2xl overflow-hidden transition-all duration-200"
            style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = `${rm.color}30`)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}>

            {/* Color accent bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${rm.color}, transparent)` }} />

            <div className="p-4">
                <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-base shrink-0"
                        style={{ background: `${rm.color}18`, color: rm.color, border: `1px solid ${rm.color}30` }}>
                        {p.avatar ? <img src={p.avatar} className="w-full h-full rounded-xl object-cover" alt="" /> : initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="text-white font-black text-sm truncate">{p.nickname}</p>
                            {p.number !== undefined && (
                                <span className="text-[10px] font-black" style={{ color: 'rgba(255,255,255,0.25)' }}>#{p.number}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded"
                                style={{ background: `${rm.color}18`, color: rm.color }}>
                                {p.role}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                style={{ background: sm.bg, color: sm.color, border: `1px solid ${sm.border}` }}>
                                {p.status}
                            </span>
                        </div>
                        {p.playerId && (
                            <p className="text-[10px] mt-1 font-mono truncate" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                ID: {p.playerId.slice(-12)}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={onEdit} className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
                            style={{ color: 'rgba(255,255,255,0.4)' }}>
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={onRemove} className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                            style={{ color: 'rgba(255,100,100,0.5)' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#ff4444')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,100,100,0.5)')}>
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Quick status switcher */}
                <div className="flex items-center gap-1.5 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {(['ACTIVE', 'BENCHED', 'TRIAL'] as PlayerStatus[]).map(s => (
                        <button key={s} onClick={() => onStatusChange(s)}
                            className="flex-1 text-[9px] font-black uppercase py-1 rounded-lg transition-all"
                            style={p.status === s
                                ? { background: STATUS_META[s].bg, color: STATUS_META[s].color, border: `1px solid ${STATUS_META[s].border}` }
                                : { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.2)' }}>
                            {s}
                        </button>
                    ))}
                    <p className="text-[9px] ml-auto shrink-0" style={{ color: 'rgba(255,255,255,0.15)' }}>
                        {new Date(p.joinedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ── Invite Modal (real player search) ─────────────────────────────────────────

function InviteModal({ onClose, existingIds, canInvite, onInvited, notify }: {
    onClose:   () => void;
    existingIds: string[];
    /** Server allows POST invite (manager approved). */
    canInvite: boolean;
    onInvited: (m: TeamMember) => void;
    notify:    (msg: string, ok?: boolean) => void;
}) {
    const [query,    setQuery]    = useState('');
    const [results,  setResults]  = useState<PlayerSearchResult[]>([]);
    const [searching,setSearching]= useState(false);
    const [inviting, setInviting] = useState<string | null>(null);
    const [error,    setError]    = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const doSearch = (q: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setSearching(true); setError('');
            try { setResults(await teamManagerService.searchPlayers(q || undefined)); }
            catch { setError('Search failed — check that you are logged in as a team manager'); setResults([]); }
            finally { setSearching(false); }
        }, 400);
    };

    useEffect(() => { doSearch(query); }, [query]);

    const handleInvite = async (r: PlayerSearchResult) => {
        if (!canInvite) {
            notify('Wait for an admin to approve your manager application before sending invites.', false);
            return;
        }
        setInviting(r.userId._id);
        try {
            await teamManagerService.invitePlayer(r.userId._id);
            onInvited({ _id: r.userId._id, nickname: r.userId.nickname, avatar: r.userId.avatar, email: r.userId.email });
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invite failed';
            notify(msg, false);
        } finally { setInviting(null); }
    };

    const already = (id: string) => existingIds.includes(id);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-lg mx-4 rounded-2xl shadow-2xl overflow-hidden" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div>
                        <h2 className="text-white font-black text-base">{canInvite ? 'Invite player' : 'Find players'}</h2>
                        <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            {canInvite ? 'Search by nickname or email' : 'Browse players — invite unlocks after admin approval'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* Search input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                        {searching && <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />}
                        <input autoFocus
                            value={query} onChange={e => setQuery(e.target.value)}
                            placeholder="Search by nickname or email…"
                            className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm text-white outline-none"
                            style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: 'rgba(255,50,50,0.1)', color: '#ff6b6b', border: '1px solid rgba(255,50,50,0.2)' }}>
                            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                        </div>
                    )}

                    {/* Results */}
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                        {results.length === 0 && !searching && !error && (
                            <p className="text-center py-8 text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                {query ? 'No players found' : 'Type to search available players'}
                            </p>
                        )}
                        {results.map(r => {
                            const onRoster = already(r.userId._id);
                            return (
                                <div key={r._id} className="flex items-center gap-3 p-3 rounded-xl"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                                        style={{ background: 'rgba(59,158,255,0.15)', color: '#3b9eff' }}>
                                        {r.userId.avatar
                                            ? <img src={r.userId.avatar} className="w-full h-full rounded-xl object-cover" alt="" />
                                            : r.userId.nickname.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{r.userId.nickname}</p>
                                        <div className="flex items-center gap-2 text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                            <span>{r.userId.email}</span>
                                            {r.rank && <><span>·</span><span style={{ color: '#fbbf24' }}>{r.rank}</span></>}
                                            {r.elo !== undefined && <><span>·</span><span>{r.elo} ELO</span></>}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={onRoster || inviting === r.userId._id}
                                        onClick={() => handleInvite(r)}
                                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase transition-all"
                                        style={onRoster
                                            ? { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed' }
                                            : !canInvite
                                              ? { background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)', cursor: 'pointer' }
                                              : { background: '#00ff0015', color: '#00ff00', border: '1px solid #00ff0030' }}>
                                        {inviting === r.userId._id
                                            ? <RefreshCw className="w-3 h-3 animate-spin" />
                                            : onRoster ? <><Check className="w-3 h-3" /> On Team</>
                                            : !canInvite ? 'Pending approval'
                                            : <><UserPlus className="w-3 h-3" /> Invite</>}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="px-6 pb-5">
                    <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-bold"
                        style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Edit Modal ─────────────────────────────────────────────────────────────────

function EditModal({ player, onClose, onSave }: { player: TeamPlayer; onClose: () => void; onSave: (p: TeamPlayer) => void }) {
    const [form, setForm] = useState({ ...player, number: player.number?.toString() ?? '' });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-sm mx-4 rounded-2xl shadow-2xl overflow-hidden" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <h2 className="text-white font-black">Edit Player</h2>
                    <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.4)' }}><X className="w-5 h-5" /></button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Nickname</label>
                        <input value={form.nickname} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                            style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Role</label>
                            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as PlayerRole }))}
                                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                                style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)' }}>
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Status</label>
                            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as PlayerStatus }))}
                                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                                style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)' }}>
                                {(['ACTIVE','BENCHED','TRIAL','INACTIVE'] as PlayerStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 px-5 pb-5">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                        style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>Cancel</button>
                    <button onClick={() => onSave({ ...form, number: form.number ? parseInt(form.number) : undefined })}
                        className="flex-1 py-2.5 rounded-xl text-sm font-black"
                        style={{ background: '#00ff00', color: '#000' }}>Save</button>
                </div>
            </div>
        </div>
    );
}

