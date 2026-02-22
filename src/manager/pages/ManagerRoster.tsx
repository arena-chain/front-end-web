import { useState, useEffect } from 'react';
import {
    Users, Lock, Unlock, UserPlus, UserMinus, ShieldCheck,
    Shield, Plus, X, Check, AlertCircle, RefreshCw,
} from 'lucide-react';
import { leagueService, League } from '../../services/leagueService';
import { seasonService, Season } from '../../services/seasonService';
import { seasonRosterService, SeasonRoster, RosterPlayer } from '../../services/seasonRosterService';

interface Toast { msg: string; ok: boolean }

export default function ManagerRoster() {
    const [leagues, setLeagues]   = useState<League[]>([]);
    const [seasons, setSeasons]   = useState<Season[]>([]);
    const [rosters, setRosters]   = useState<SeasonRoster[]>([]);
    const [selLeague, setSelLeague] = useState('');
    const [selSeason, setSelSeason] = useState('');
    const [loading, setLoading]   = useState(false);
    const [toast, setToast]       = useState<Toast | null>(null);
    const [addPlayerId, setAddPlayerId] = useState('');
    const [addingToRoster, setAddingToRoster] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    const notify = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        leagueService.getAllLeagues().then(setLeagues).catch(() => {});
    }, []);

    useEffect(() => {
        if (!selLeague) { setSeasons([]); setSelSeason(''); return; }
        seasonService.getByLeague(selLeague).then(setSeasons).catch(() => {});
        setSelSeason('');
    }, [selLeague]);

    const loadRosters = async () => {
        if (!selSeason) { setRosters([]); return; }
        try {
            setLoading(true);
            setRosters(await seasonRosterService.getBySeason(selSeason));
        } catch { notify('Failed to load rosters', false); }
        finally   { setLoading(false); }
    };

    useEffect(() => { loadRosters(); }, [selSeason]);

    const handleAddPlayer = async (rosterId: string) => {
        if (!addPlayerId.trim()) return notify('Enter a Player ID', false);
        try {
            await seasonRosterService.addPlayer(rosterId, addPlayerId.trim());
            notify('Player added');
            setAddPlayerId('');
            setAddingToRoster(null);
            loadRosters();
        } catch { notify('Failed to add player', false); }
    };

    const handleRemove = async (rosterId: string, playerId: string) => {
        try {
            await seasonRosterService.removePlayer(rosterId, playerId);
            notify('Player removed');
            loadRosters();
        } catch { notify('Failed', false); }
    };

    const handleLockToggle = async (r: SeasonRoster) => {
        try {
            if (r.status === 'LOCKED') await seasonRosterService.unlock(r._id);
            else await seasonRosterService.lock(r._id);
            notify(r.status === 'LOCKED' ? 'Roster unlocked' : 'Roster locked 🔒');
            loadRosters();
        } catch { notify('Failed', false); }
    };

    const resolvePlayers = (roster: SeasonRoster): RosterPlayer[] => {
        if (!roster.playerIds?.length) return [];
        if (typeof roster.playerIds[0] === 'string') {
            return (roster.playerIds as string[]).map(id => ({ _id: id, nickname: `…${id.slice(-8)}` }));
        }
        return roster.playerIds as RosterPlayer[];
    };

    const resolveTeam = (r: SeasonRoster) => {
        if (typeof r.teamId === 'string') return { name: `…${r.teamId.slice(-8)}`, logo: undefined };
        return r.teamId as { name: string; logo?: string };
    };

    return (
        <div className="space-y-6">
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-sm font-medium border
                    ${toast.ok ? 'bg-emerald-900/90 text-emerald-200 border-emerald-500/40' : 'bg-red-900/90 text-red-200 border-red-500/40'}`}>
                    {toast.ok ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                        <Users className="w-6 h-6 text-primary" /> My Roster
                    </h1>
                    <p className="text-text-muted text-sm mt-1">Manage players per season</p>
                </div>
                <button onClick={loadRosters} className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-text-muted hover:text-white transition-colors">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Season selector */}
            <div className="grid grid-cols-2 gap-3">
                <select value={selLeague} onChange={e => setSelLeague(e.target.value)}
                    className="bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-primary/50">
                    <option value="">— Select League —</option>
                    {leagues.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                </select>
                <select value={selSeason} onChange={e => setSelSeason(e.target.value)}
                    className="bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-primary/50"
                    disabled={!selLeague}>
                    <option value="">— Select Season —</option>
                    {seasons.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
            </div>

            {/* Content */}
            {!selSeason ? (
                <div className="bg-surface border border-white/5 rounded-xl p-12 text-center text-text-muted">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>Select a league and season to manage your roster</p>
                </div>
            ) : loading ? (
                <div className="text-text-muted text-center py-16">Loading…</div>
            ) : rosters.length === 0 ? (
                <div className="bg-surface border border-white/5 rounded-xl p-12 text-center text-text-muted">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="mb-4">No roster found for this season</p>
                    <button onClick={() => setCreating(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-black font-bold text-sm hover:bg-primary-light transition-colors">
                        <Plus className="w-4 h-4" /> Create Roster
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {rosters.map(roster => {
                        const team    = resolveTeam(roster);
                        const players = resolvePlayers(roster);
                        const locked  = roster.status === 'LOCKED';
                        return (
                            <div key={roster._id} className="bg-surface border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all">
                                {/* Roster header */}
                                <div className="flex items-center justify-between px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        {team.logo
                                            ? <img src={team.logo} className="w-8 h-8 rounded-lg object-contain" alt="" />
                                            : <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><Shield className="w-4 h-4 text-text-muted" /></div>
                                        }
                                        <div>
                                            <p className="text-white font-bold text-sm">{team.name}</p>
                                            <p className="text-text-muted text-xs">{players.length} player{players.length !== 1 ? 's' : ''}</p>
                                        </div>
                                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${locked
                                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                            : 'bg-primary/10 text-primary border-primary/20'}`}>
                                            {locked ? 'LOCKED' : 'OPEN'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!locked && (
                                            <button onClick={() => setAddingToRoster(roster._id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/15 text-xs font-medium">
                                                <UserPlus className="w-3.5 h-3.5" /> Add Player
                                            </button>
                                        )}
                                        <button onClick={() => handleLockToggle(roster)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${locked
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15'
                                                : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/15'}`}>
                                            {locked ? <><Unlock className="w-3.5 h-3.5" /> Unlock</> : <><Lock className="w-3.5 h-3.5" /> Lock Roster</>}
                                        </button>
                                    </div>
                                </div>

                                {/* Add player inline */}
                                {addingToRoster === roster._id && (
                                    <div className="px-5 pb-4 flex items-center gap-2 border-t border-white/5 pt-3">
                                        <input value={addPlayerId} onChange={e => setAddPlayerId(e.target.value)}
                                            placeholder="Player ID…"
                                            className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted outline-none focus:border-primary/50" />
                                        <button onClick={() => handleAddPlayer(roster._id)}
                                            className="px-4 py-2 rounded-lg bg-primary text-black text-sm font-bold">Add</button>
                                        <button onClick={() => { setAddingToRoster(null); setAddPlayerId(''); }}
                                            className="p-2 rounded-lg text-text-muted hover:text-white">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {/* Player list */}
                                {players.length > 0 && (
                                    <div className="border-t border-white/5 px-5 py-3">
                                        <div className="flex flex-wrap gap-2">
                                            {players.map(pl => (
                                                <div key={pl._id} className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 group">
                                                    {pl.avatar
                                                        ? <img src={pl.avatar} className="w-5 h-5 rounded-full" alt="" />
                                                        : <ShieldCheck className="w-4 h-4 text-text-muted" />
                                                    }
                                                    <span className="text-xs text-white font-medium">{pl.nickname}</span>
                                                    {!locked && (
                                                        <button onClick={() => handleRemove(roster._id, pl._id)}
                                                            className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all ml-1">
                                                            <UserMinus className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create roster modal */}
            {creating && (
                <CreateRosterModal
                    seasonId={selSeason}
                    onClose={() => setCreating(false)}
                    onCreated={() => { setCreating(false); loadRosters(); }}
                    notify={notify}
                />
            )}
        </div>
    );
}

function CreateRosterModal({ seasonId, onClose, onCreated, notify }: {
    seasonId: string;
    onClose: () => void;
    onCreated: () => void;
    notify: (msg: string, ok?: boolean) => void;
}) {
    const [teamId, setTeamId]     = useState('');
    const [playerIds, setPlayerIds] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!teamId.trim()) return notify('Team ID required', false);
        const ids = playerIds.split(',').map(s => s.trim()).filter(Boolean);
        try {
            setSubmitting(true);
            await seasonRosterService.create({ seasonId, teamId, playerIds: ids });
            notify('Roster created!');
            onCreated();
        } catch { notify('Create failed', false); }
        finally  { setSubmitting(false); }
    };

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                    <h2 className="text-white font-black">Create Roster</h2>
                    <button onClick={onClose}><X className="w-5 h-5 text-text-muted" /></button>
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-text-muted mb-1.5">Team ID *</label>
                    <input value={teamId} onChange={e => setTeamId(e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary/50" placeholder="Your team's ID" />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-text-muted mb-1.5">Player IDs (comma-separated)</label>
                    <textarea value={playerIds} onChange={e => setPlayerIds(e.target.value)} rows={3}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary/50 resize-none placeholder-text-muted"
                        placeholder="id1, id2, id3…" />
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-white/10 text-text-muted text-sm">Cancel</button>
                    <button onClick={handleSubmit} disabled={submitting}
                        className="flex-1 py-2 rounded-xl bg-primary text-black text-sm font-bold disabled:opacity-50 hover:bg-primary-light transition-colors">
                        {submitting ? 'Creating…' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    );
}
