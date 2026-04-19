import { useState, useEffect, useCallback } from 'react';
import {
    Users, Plus, Lock, Unlock, Trash2, UserPlus,
    X, Check, AlertCircle, ShieldCheck, Shield,
} from 'lucide-react';
import { leagueService, type League } from '../../../services/leagueService';
import { seasonService, type Season } from '../../../services/seasonService';
import { seasonRosterService, type SeasonRoster, type RosterPlayer } from '../../../services/seasonRosterService';

interface Toast { msg: string; ok: boolean }

export default function RostersPage() {
    const [leagues, setLeagues]         = useState<League[]>([]);
    const [seasons, setSeasons]         = useState<Season[]>([]);
    const [rosters, setRosters]         = useState<SeasonRoster[]>([]);
    const [selLeague, setSelLeague]     = useState('');
    const [selSeason, setSelSeason]     = useState('');
    const [loading, setLoading]         = useState(false);
    const [toast, setToast]             = useState<Toast | null>(null);
    const [showCreate, setShowCreate]   = useState(false);
    const [createForm, setCreateForm]   = useState({ teamId: '', playerIds: '' });
    const [submitting, setSubmitting]   = useState(false);
    const [addingPlayer, setAddingPlayer] = useState<{ rosterId: string; playerId: string } | null>(null);

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

    const loadRosters = useCallback(async () => {
        if (!selSeason) { setRosters([]); return; }
        try {
            setLoading(true);
            setRosters(await seasonRosterService.getBySeason(selSeason));
        } catch { notify('Failed to load rosters', false); }
        finally   { setLoading(false); }
    }, [selSeason]);

    useEffect(() => { loadRosters(); }, [loadRosters]);

    const handleCreate = async () => {
        const playerIds = createForm.playerIds.split(',').map(s => s.trim()).filter(Boolean);
        if (!createForm.teamId.trim()) return notify('Team ID required', false);
        try {
            setSubmitting(true);
            await seasonRosterService.create({ seasonId: selSeason, teamId: createForm.teamId, playerIds });
            notify('Roster created');
            setShowCreate(false);
            setCreateForm({ teamId: '', playerIds: '' });
            loadRosters();
        } catch { notify('Create failed', false); }
        finally  { setSubmitting(false); }
    };

    const handleLock = async (r: SeasonRoster) => {
        try {
            if (r.status === 'LOCKED') await seasonRosterService.unlock(r._id);
            else await seasonRosterService.lock(r._id);
            notify(r.status === 'LOCKED' ? 'Unlocked' : 'Locked');
            loadRosters();
        } catch { notify('Failed', false); }
    };

    const handleDelete = async (r: SeasonRoster) => {
        if (!confirm('Delete this roster?')) return;
        try { await seasonRosterService.delete(r._id); notify('Deleted'); loadRosters(); }
        catch { notify('Delete failed', false); }
    };

    const handleRemovePlayer = async (rosterId: string, playerId: string) => {
        try { await seasonRosterService.removePlayer(rosterId, playerId); notify('Player removed'); loadRosters(); }
        catch { notify('Failed', false); }
    };

    const handleAddPlayer = async () => {
        if (!addingPlayer) return;
        try {
            await seasonRosterService.addPlayer(addingPlayer.rosterId, addingPlayer.playerId);
            notify('Player added');
            setAddingPlayer(null);
            loadRosters();
        } catch { notify('Failed', false); }
    };

    const resolvePlayers = (roster: SeasonRoster): RosterPlayer[] => {
        if (!roster.playerIds?.length) return [];
        if (typeof roster.playerIds[0] === 'string') {
            return (roster.playerIds as string[]).map(id => ({ _id: id, nickname: id.slice(-8) }));
        }
        return roster.playerIds as RosterPlayer[];
    };

    const resolveTeam = (roster: SeasonRoster) => {
        if (typeof roster.teamId === 'string') return { name: roster.teamId.slice(-8), logo: undefined };
        return roster.teamId as { name: string; logo?: string };
    };

    return (
        <div className="space-y-6 p-6">
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-sm font-medium border
                    ${toast.ok ? 'bg-emerald-900/90 text-emerald-200 border-emerald-500/40' : 'bg-red-900/90 text-red-200 border-red-500/40'}`}>
                    {toast.ok ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Season Rosters</h1>
                        <p className="text-sm text-slate-400">Manage team player rosters per season</p>
                    </div>
                </div>
                <button onClick={() => setShowCreate(true)} disabled={!selSeason}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold disabled:opacity-40 transition-colors">
                    <Plus className="w-4 h-4" /> New Roster
                </button>
            </div>

            {/* Season selector */}
            <div className="grid grid-cols-2 gap-3">
                <select value={selLeague} onChange={e => setSelLeague(e.target.value)} className="input-field">
                    <option value="">— Select League —</option>
                    {leagues.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                </select>
                <select value={selSeason} onChange={e => setSelSeason(e.target.value)} className="input-field" disabled={!selLeague}>
                    <option value="">— Select Season —</option>
                    {seasons.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
            </div>

            {/* Roster list */}
            {!selSeason ? (
                <div className="text-center py-20 text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Select a season to view rosters</p>
                </div>
            ) : loading ? (
                <div className="text-slate-500 text-sm text-center py-16">Loading…</div>
            ) : rosters.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No rosters yet</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {rosters.map(roster => {
                        const team    = resolveTeam(roster);
                        const players = resolvePlayers(roster);
                        const locked  = roster.status === 'LOCKED';
                        return (
                            <div key={roster._id} className="bg-slate-800/60 border border-slate-700/40 rounded-xl overflow-hidden">
                                <div className="flex items-center justify-between px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        {team.logo ? (
                                            <img src={team.logo} alt={team.name} className="w-9 h-9 rounded-lg object-contain" />
                                        ) : (
                                            <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center">
                                                <Shield className="w-4 h-4 text-slate-500" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-white font-semibold text-sm">{team.name}</p>
                                            <p className="text-xs text-slate-500">{players.length} players</p>
                                        </div>
                                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${locked
                                            ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}>
                                            {locked ? 'LOCKED' : 'OPEN'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setAddingPlayer({ rosterId: roster._id, playerId: '' })}
                                            disabled={locked}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-xs disabled:opacity-40">
                                            <UserPlus className="w-3.5 h-3.5" /> Add
                                        </button>
                                        <button onClick={() => handleLock(roster)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${locked
                                                ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                                                : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'}`}>
                                            {locked ? <><Unlock className="w-3.5 h-3.5" /> Unlock</> : <><Lock className="w-3.5 h-3.5" /> Lock</>}
                                        </button>
                                        <button onClick={() => handleDelete(roster)}
                                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Player chips */}
                                {players.length > 0 && (
                                    <div className="px-5 pb-4 flex flex-wrap gap-2 border-t border-slate-700/40 pt-3">
                                        {players.map(pl => (
                                            <div key={pl._id} className="flex items-center gap-2 bg-slate-700/60 border border-slate-600/40 rounded-lg px-3 py-1.5">
                                                {pl.avatar
                                                    ? <img src={pl.avatar} className="w-5 h-5 rounded-full object-cover" alt="" />
                                                    : <div className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center">
                                                        <ShieldCheck className="w-3 h-3 text-slate-400" />
                                                    </div>
                                                }
                                                <span className="text-xs text-white">{pl.nickname}</span>
                                                {!locked && (
                                                    <button onClick={() => handleRemovePlayer(roster._id, pl._id)}
                                                        className="text-slate-500 hover:text-red-400 ml-1">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add player inline modal */}
            {addingPlayer !== null && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-white font-semibold">Add Player</h2>
                            <button onClick={() => setAddingPlayer(null)}><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <input value={addingPlayer.playerId}
                            onChange={e => setAddingPlayer(a => a ? { ...a, playerId: e.target.value } : null)}
                            className="input-field" placeholder="Player ID…" />
                        <div className="flex gap-3">
                            <button onClick={() => setAddingPlayer(null)}
                                className="flex-1 py-2 rounded-lg border border-slate-700 text-slate-400 text-sm">Cancel</button>
                            <button onClick={handleAddPlayer}
                                className="flex-1 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold">
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create roster modal */}
            {showCreate && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-white font-semibold">Create Roster</h2>
                            <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <div>
                            <label className="label">Team ID *</label>
                            <input value={createForm.teamId}
                                onChange={e => setCreateForm(f => ({ ...f, teamId: e.target.value }))}
                                className="input-field" placeholder="Team ID…" />
                        </div>
                        <div>
                            <label className="label">Player IDs (comma-separated)</label>
                            <textarea value={createForm.playerIds}
                                onChange={e => setCreateForm(f => ({ ...f, playerIds: e.target.value }))}
                                rows={3} className="input-field resize-none" placeholder="id1, id2, id3…" />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowCreate(false)}
                                className="flex-1 py-2 rounded-lg border border-slate-700 text-slate-400 text-sm">Cancel</button>
                            <button onClick={handleCreate} disabled={submitting}
                                className="flex-1 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold disabled:opacity-50">
                                {submitting ? 'Creating…' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
