import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, FileText, ArrowRight, Trash2, Trophy, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { scoutingService, type WatchlistEntry } from '../../services/scoutingService';
import { scouterService, type ScoutedPlayerProfile } from '../../services/scouterService';
import { UserService, type User } from '../../services/userService';
import { resolveBackendAssetUrl } from '../../lib/apiBase';

type WatchlistRowModel = WatchlistEntry & { profileDetail?: ScoutedPlayerProfile };

/** Populated `playerId` / row shapes omit index signatures; use when probing dynamic API fields. */
function looseRec(o: object): Record<string, unknown> {
    return o as unknown as Record<string, unknown>;
}

function getScouterId(): string | null {
    try {
        const raw = localStorage.getItem('user');
        const user = raw ? JSON.parse(raw) : null;
        return user?.id ?? user?._id ?? null;
    } catch {
        return null;
    }
}

function playerEmail(e: WatchlistEntry): string | undefined {
    const p = e.playerId;
    if (typeof p === 'object' && p != null) {
        const o = looseRec(p);
        const u = o.user as { email?: string } | undefined;
        const em =
            (typeof o.email === 'string' && o.email.trim() ? o.email : undefined) ??
            (typeof u?.email === 'string' && u.email.trim() ? u.email : undefined);
        if (em) return em;
        const uid = o.userId;
        if (uid && typeof uid === 'object' && 'email' in uid) {
            const e2 = (uid as { email?: string }).email?.trim();
            if (e2) return e2;
        }
    }
    return undefined;
}

function playerName(e: WatchlistEntry): string {
    const p = e.playerId;
    if (typeof p === 'object' && p != null) {
        const o = looseRec(p);
        const u = o.user as { nickname?: string; email?: string } | undefined;
        if (u?.nickname?.trim()) return u.nickname.trim();
        const uid = o.userId;
        if (uid && typeof uid === 'object' && 'nickname' in uid) {
            const n = (uid as { nickname?: string }).nickname?.trim();
            if (n) return n;
        }
        const nick = (o.nickname as string | undefined)?.trim();
        if (nick) return nick;
        const em = playerEmail(e);
        if (em?.includes('@')) {
            const local = em.split('@')[0]?.trim();
            if (local) return local;
        }
    }
    return 'Player';
}

function playerAvatarPath(e: WatchlistRowModel): string | undefined {
    const pd = e.profileDetail;
    if (pd) {
        const uid = pd.userId;
        if (typeof uid === 'object' && uid != null && 'avatar' in uid) {
            const a = (uid as { avatar?: string }).avatar?.trim();
            if (a) return a;
        }
    }
    const p = e.playerId;
    if (typeof p === 'object' && p != null) {
        const o = looseRec(p);
        const u = o.user as { avatar?: string } | undefined;
        const fromUser = typeof u?.avatar === 'string' ? u.avatar.trim() : '';
        if (fromUser) return fromUser;
        const uid = o.userId;
        if (uid && typeof uid === 'object' && 'avatar' in uid) {
            const a = (uid as { avatar?: string }).avatar?.trim();
            if (a) return a;
        }
        const top = typeof o.avatar === 'string' ? o.avatar.trim() : '';
        if (top) return top;
    }
    return undefined;
}

function playerMetaLine(e: WatchlistEntry): string | undefined {
    const p = e.playerId;
    if (typeof p !== 'object' || p == null) return undefined;
    const o = looseRec(p);
    const user = o.user as { country?: string; region?: string } | undefined;
    const country = (typeof o.country === 'string' && o.country.trim() ? o.country : user?.country?.trim()) || '';
    const region = (typeof o.region === 'string' && o.region.trim() ? o.region : user?.region?.trim()) || '';
    const email = playerEmail(e);
    const bits = [email, country || region].filter(Boolean);
    return bits.length ? bits.join(' · ') : undefined;
}

function rowLocationLabel(e: WatchlistRowModel): string {
    const prof = e.profileDetail?.region?.trim();
    if (prof) return prof;
    const p = e.playerId;
    if (typeof p === 'object' && p != null) {
        const o = looseRec(p);
        const user = o.user as { country?: string; region?: string } | undefined;
        const c = (typeof o.country === 'string' && o.country.trim() ? o.country : user?.country?.trim()) || '';
        const r = (typeof o.region === 'string' && o.region.trim() ? o.region : user?.region?.trim()) || '';
        const label = (c || r).trim();
        if (label) return label.toUpperCase();
    }
    return '—';
}

function rowElo(e: WatchlistRowModel): string | number {
    const v = e.profileDetail?.elo;
    if (v !== undefined && v !== null) return v;
    return '—';
}

function rowRank(e: WatchlistRowModel): string {
    const r = e.profileDetail?.rank?.trim();
    if (r) return r;
    return 'Unranked';
}

/** Raw nickname on populated payload (for matching users when API omits user id). */
function playerRawNickname(e: WatchlistEntry): string | undefined {
    const p = e.playerId;
    if (typeof p === 'object' && p != null) {
        const o = looseRec(p);
        const u = o.user as { nickname?: string } | undefined;
        if (u?.nickname?.trim()) return u.nickname.trim();
        const uid = o.userId;
        if (uid && typeof uid === 'object' && 'nickname' in uid) {
            const n = (uid as { nickname?: string }).nickname?.trim();
            if (n) return n;
        }
        const nick = (o.nickname as string | undefined)?.trim();
        if (nick) return nick;
    }
    return undefined;
}

function unwrapMongoId(raw: unknown): string {
    if (typeof raw === 'string' && raw.trim()) return raw.trim();
    if (raw && typeof raw === 'object' && '$oid' in (raw as object)) {
        return String((raw as { $oid: string }).$oid).trim();
    }
    return '';
}

function idFromUserLike(o: object): string {
    const rec = looseRec(o);
    return unwrapMongoId(rec._id ?? rec.id);
}

function watchlistPlayerUserId(e: WatchlistEntry): string {
    const extRoot = looseRec(e);
    for (const key of ['playerId', 'player', 'playerUserId']) {
        const v = extRoot[key];
        if (typeof v === 'string' && v.trim()) return v.trim();
    }

    const p = e.playerId;
    if (typeof p === 'string' && p.trim()) return p.trim();

    const fromObject = (o: object | null | undefined): string => {
        if (!o) return '';
        const obj = looseRec(o);
        const uidField = obj.userId;
        if (typeof uidField === 'string' && uidField.trim()) return uidField.trim();
        if (uidField && typeof uidField === 'object') {
            const id = idFromUserLike(uidField);
            if (id) return id;
        }
        const user = obj.user;
        if (user && typeof user === 'object') {
            const id = idFromUserLike(user);
            if (id) return id;
        }
        return idFromUserLike(obj);
    };

    if (p && typeof p === 'object') {
        const hit = fromObject(p);
        if (hit) return hit;
    }

    const ext = looseRec(e);
    if (typeof ext.player === 'string' && ext.player.trim()) return ext.player.trim();

    const nestedPlayer = ext.player;
    if (nestedPlayer && typeof nestedPlayer === 'object') {
        const hit = fromObject(nestedPlayer);
        if (hit) return hit;
    }
    for (const key of ['playerUserId', 'userId']) {
        const v = ext[key];
        if (typeof v === 'string' && v.trim()) return v.trim();
        if (v && typeof v === 'object') {
            const id = idFromUserLike(v);
            if (id) return id;
        }
    }
    return '';
}

function watchlistRowActionId(e: WatchlistEntry): string {
    const primary = watchlistPlayerUserId(e);
    if (primary) return primary;
    const p = e.playerId;
    if (p && typeof p === 'object') {
        const id = idFromUserLike(p);
        if (id) return id;
    }
    const ex = looseRec(e);
    if (typeof ex.player === 'string' && ex.player.trim()) return ex.player.trim();
    if (ex.player && typeof ex.player === 'object') {
        const id = idFromUserLike(ex.player);
        if (id) return id;
    }
    return '';
}

function normalizeWatchlistRow(row: WatchlistEntry): WatchlistEntry {
    const r = looseRec(row);
    const next: WatchlistEntry = { ...row };
    const n = looseRec(next);
    if ((n.playerId === null || n.playerId === undefined) && r.player != null) {
        n.playerId = r.player as WatchlistEntry['playerId'];
    }
    if ((n.playerId === null || n.playerId === undefined) && typeof r.player_id === 'string') {
        n.playerId = r.player_id as WatchlistEntry['playerId'];
    }
    return next;
}

function enrichWatchlistEntry(e: WatchlistEntry, pool: User[]): WatchlistEntry {
    if (watchlistPlayerUserId(e)) return e;
    const email = playerEmail(e)?.toLowerCase();
    const nick = playerRawNickname(e)?.trim();
    const u =
        (email ? pool.find((x) => x.email?.toLowerCase() === email) : undefined) ??
        (nick ? pool.find((x) => x.nickname === nick) : undefined);
    if (!u) return e;
    const cur = e.playerId;
    const mergedUser = {
        _id: u._id,
        nickname: u.nickname,
        email: u.email,
        avatar: u.avatar,
        country: u.country,
        region: u.region,
    };
    if (typeof cur === 'object' && cur !== null) {
        return {
            ...e,
            playerId: { ...looseRec(cur), user: mergedUser, userId: u._id } as WatchlistEntry['playerId'],
        };
    }
    return { ...e, playerId: mergedUser as WatchlistEntry['playerId'] };
}

async function hydrateWatchlistProfiles(rows: WatchlistEntry[]): Promise<WatchlistRowModel[]> {
    return Promise.all(
        rows.map(async (entry) => {
            const uid = watchlistPlayerUserId(entry);
            if (!uid) return { ...entry };
            try {
                const profileDetail = await scouterService.getPlayerProfile(uid);
                return { ...entry, profileDetail };
            } catch {
                return { ...entry };
            }
        }),
    );
}

function WatchlistAvatar({ entry }: { entry: WatchlistRowModel }) {
    const raw = playerAvatarPath(entry);
    const url = raw ? resolveBackendAssetUrl(raw) : '';
    const [imgFailed, setImgFailed] = useState(false);
    const initial = playerName(entry).charAt(0).toUpperCase();

    if (url && !imgFailed) {
        return (
            <img
                src={url}
                alt=""
                className="h-[72px] w-[72px] shrink-0 rounded-2xl border-2 border-primary/35 object-cover shadow-lg shadow-black/30"
                onError={() => setImgFailed(true)}
            />
        );
    }
    return (
        <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl border-2 border-primary/35 bg-zinc-900 text-2xl font-black text-primary shadow-inner">
            {initial}
        </div>
    );
}

export default function ScouterWatchlist() {
    const scouterId = getScouterId();
    const [entries, setEntries] = useState<WatchlistRowModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState<string | null>(null);

    const load = useCallback(
        async (opts?: { silent?: boolean }) => {
            if (!scouterId) return;
            if (!opts?.silent) {
                await Promise.resolve();
                setLoading(true);
            }
            try {
                const list = await scoutingService.listWatchlistByScouter(scouterId);
                const users = await UserService.getAllUsers().catch(() => [] as User[]);
                const pool = users;
                const merged = list.map((row) => enrichWatchlistEntry(normalizeWatchlistRow(row), pool));
                const hydrated = await hydrateWatchlistProfiles(merged);
                setEntries(hydrated);
            } catch {
                setEntries([]);
            } finally {
                if (!opts?.silent) setLoading(false);
            }
        },
        [scouterId],
    );

    useEffect(() => {
        if (!scouterId) {
            queueMicrotask(() => {
                setLoading(false);
                setEntries([]);
            });
            return;
        }
        void load();
    }, [scouterId, load]);

    const handleRemove = async (e: WatchlistRowModel) => {
        if (!scouterId) return;
        const playerUserId = watchlistPlayerUserId(e) || watchlistRowActionId(e);
        setRemovingId(e._id);
        const snapshot = entries;
        setEntries((prev) => prev.filter((row) => row._id !== e._id));
        try {
            if (playerUserId) {
                await scoutingService.removeFromWatchlist(scouterId, playerUserId);
            } else {
                await scoutingService.removeWatchlistByEntryId(e._id);
            }
            toast.success('Removed from watchlist');
            void load({ silent: true });
        } catch (err) {
            setEntries(snapshot);
            toast.error(err instanceof Error ? err.message : 'Could not remove from watchlist');
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary/80">
                    <Bookmark size={14} /> Watchlist
                </div>
                <h1 className="text-3xl font-black tracking-tight text-white">My watchlist</h1>
                <p className="mt-1 text-sm text-white/50">
                    Players you are tracking. Remove or open profile to add reports and recommendations.
                </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#141820] shadow-xl shadow-black/40">
                {loading ? (
                    <div className="py-24 text-center text-primary/70">Loading watchlist…</div>
                ) : entries.length === 0 ? (
                    <div className="py-24 text-center">
                        <Bookmark className="mx-auto mb-4 h-14 w-14 text-primary/40" />
                        <p className="font-semibold text-white/80">Watchlist is empty</p>
                        <p className="mx-auto mt-1 max-w-sm text-sm text-white/40">
                            Add players from the Rankings or Player profile with &quot;Add to watchlist&quot;.
                        </p>
                        <Link
                            to="/scouter/players"
                            className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                        >
                            Browse players <ArrowRight size={14} />
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-800">
                        {entries.map((e) => {
                            const actionId = watchlistRowActionId(e);
                            const email = playerEmail(e);
                            const metaFallback = playerMetaLine(e);
                            return (
                                <div
                                    key={e._id}
                                    className="flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-zinc-900/50 sm:flex-row sm:items-center sm:gap-6"
                                >
                                    <WatchlistAvatar
                                        key={`${e._id}-${playerAvatarPath(e) ?? 'no-avatar'}`}
                                        entry={e}
                                    />
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <h2 className="text-xl font-black tracking-tight text-white">{playerName(e)}</h2>
                                        {email ? (
                                            <p className="truncate text-sm text-zinc-500">{email}</p>
                                        ) : metaFallback ? (
                                            <p className="truncate text-sm text-zinc-500">{metaFallback}</p>
                                        ) : null}
                                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                                            <span className="inline-flex items-center gap-1.5 font-bold text-primary">
                                                <Trophy size={15} className="shrink-0" />
                                                {rowElo(e)} Elo
                                            </span>
                                            <span className="text-white/65">Rank: {rowRank(e)}</span>
                                            <span className="inline-flex items-center gap-1.5 text-white/65">
                                                <MapPin size={15} className="shrink-0" />
                                                {rowLocationLabel(e)}
                                            </span>
                                        </div>
                                        {e.notes ? (
                                            <p className="line-clamp-2 text-sm text-white/45">{e.notes}</p>
                                        ) : null}
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/75">
                                            Watchlist · {e.priority}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch md:flex-row">
                                        {actionId ? (
                                            <>
                                                <Link
                                                    to={`/scouter/players/${actionId}`}
                                                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-primary/30 bg-primary/20 px-3 py-2.5 text-sm font-bold text-primary hover:bg-primary/30"
                                                >
                                                    <ArrowRight size={14} /> Profile
                                                </Link>
                                                <Link
                                                    to="/scouter/reports"
                                                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
                                                >
                                                    <FileText size={14} /> Report
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => void handleRemove(e)}
                                                    disabled={removingId === e._id}
                                                    className="inline-flex items-center justify-center rounded-lg border border-red-500/35 bg-red-500/10 p-2.5 text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                                                    title="Remove from watchlist"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex max-w-[220px] flex-col items-stretch gap-2 sm:items-end">
                                                <p className="text-xs text-amber-400/90">
                                                    Orphan row (no player id). Remove it or fix the entry in the database.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => void handleRemove(e)}
                                                    disabled={removingId === e._id}
                                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/15 px-3 py-2 text-sm font-bold text-red-300 hover:bg-red-500/25 disabled:opacity-50"
                                                    title="Remove this watchlist row"
                                                >
                                                    <Trash2 size={16} /> Remove row
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
