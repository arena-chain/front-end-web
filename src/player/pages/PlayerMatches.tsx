import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { getApiBase } from '../../lib/apiBase';

interface MatchRow {
    id: string;
    matchId: string | null;
    result: 'W' | 'L';
    championName: string;
    championId: number | null;
    mode: string;
    kills: number;
    deaths: number;
    assists: number;
    kda: string;
    durationLabel: string;
    agoLabel: string;
    itemIds: number[];
    source: 'riot' | 'platform';
}

interface RiotMatchApiRecord {
    matchId?: string;
    gameType?: string;
    win?: boolean;
    championName?: string;
    championId?: number;
    kills?: number;
    deaths?: number;
    assists?: number;
    kda?: string;
    duration?: number;
    items?: number[];
    gameCreation?: number | string;
    gameMode?: string;
}

interface RiotMatchHistoryResponse {
    linked?: boolean;
    matches?: RiotMatchApiRecord[];
}

interface MatchApiRecord {
    _id?: string;
    gameMode?: string;
    mapName?: string;
    scheduledStart?: string;
}

interface LinkStatusResponse {
    riotRegion?: string | null;
    riotPuuid?: string | null;
}

interface TeamStatsView {
    kills: number;
    gold: string;
    towers: number;
    barons: number;
    dragons: number;
}

interface MatchDetailView {
    matchId: string;
    cs: number;
    damage: string;
    vision: number;
    itemIds: number[];
    blue: TeamStatsView;
    red: TeamStatsView;
}

export default function PlayerMatches() {
    const [rows, setRows] = useState<MatchRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [region, setRegion] = useState<string | null>(null);
    const [puuid, setPuuid] = useState<string | null>(null);
    const [selectedMatch, setSelectedMatch] = useState<MatchRow | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailsByMatchId, setDetailsByMatchId] = useState<Record<string, MatchDetailView>>({});

    useEffect(() => {
        const loadMatches = async () => {
            setLoading(true);
            const token = localStorage.getItem('token');
            const API = getApiBase();
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            try {
                const [profileRes, riotHistoryRes, linkStatusRes] = await Promise.allSettled([
                    axios.get(`${API}/auth/profile`, { headers }),
                    axios.get(`${API}/riot-api/match-history`, {
                        headers,
                        params: { game: 'lol', start: 0, count: 20 },
                    }),
                    axios.get(`${API}/riot-api/link-status`, { headers }),
                ]);

                const myUserId =
                    profileRes.status === 'fulfilled' && profileRes.value?.data?._id
                        ? String(profileRes.value.data._id)
                        : null;

                const riotData =
                    riotHistoryRes.status === 'fulfilled'
                        ? (riotHistoryRes.value.data as RiotMatchHistoryResponse)
                        : null;
                const linkStatus =
                    linkStatusRes.status === 'fulfilled'
                        ? (linkStatusRes.value.data as LinkStatusResponse)
                        : null;
                setRegion(typeof linkStatus?.riotRegion === 'string' ? linkStatus.riotRegion : null);
                setPuuid(typeof linkStatus?.riotPuuid === 'string' ? linkStatus.riotPuuid : null);
                const riotMatches = Array.isArray(riotData?.matches) ? riotData.matches : [];

                if (riotData?.linked && riotMatches.length > 0) {
                    const mapped = riotMatches.map((m) => mapRiotMatchToRow(m)).filter(Boolean) as MatchRow[];
                    setRows(mapped);
                    setSelectedMatch(mapped[0] ?? null);
                    return;
                }

                if (!myUserId) {
                    setRows([]);
                    return;
                }

                const fallbackRes = await axios.get(`${API}/scouter/players/${myUserId}/matches`, { headers });
                const fallbackMatches = Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
                const mappedFallback = fallbackMatches
                    .map((m: MatchApiRecord) => mapPlatformMatchToRow(m))
                    .filter(Boolean) as MatchRow[];
                setRows(mappedFallback);
                setSelectedMatch(mappedFallback[0] ?? null);
            } catch {
                setRows([]);
            } finally {
                setLoading(false);
            }
        };

        void loadMatches();
    }, []);

    useEffect(() => {
        const matchId = selectedMatch?.matchId;
        if (!matchId || selectedMatch?.source !== 'riot' || !region || !puuid) return;
        if (detailsByMatchId[matchId]) return;

        const loadDetail = async () => {
            const token = localStorage.getItem('token');
            const API = getApiBase();
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            setDetailLoading(true);
            try {
                const res = await axios.get(`${API}/riot-api/match/${matchId}`, {
                    headers,
                    params: { region, puuid },
                });
                const detail = mapDetailResponseToView(matchId, res.data);
                setDetailsByMatchId((prev) => ({ ...prev, [matchId]: detail }));
            } catch {
                // Keep panel visible with basic fallback numbers if detail fails.
            } finally {
                setDetailLoading(false);
            }
        };

        void loadDetail();
    }, [selectedMatch, region, puuid, detailsByMatchId]);

    const content = useMemo(() => {
        if (loading) {
            return <p className="text-sm text-white/60">Loading match history...</p>;
        }
        if (rows.length === 0) {
            return (
                <p className="text-sm text-white/45">
                    No Riot matches found. Link and verify your account, then refresh this page.
                </p>
            );
        }

        return (
            <div className="space-y-3">
                {rows.map((row) => {
                    const hasItems = row.itemIds.length > 0;
                    return (
                        <div
                            key={row.id}
                            className={`rounded-2xl border px-5 py-4 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                                selectedMatch?.id === row.id
                                    ? 'border-[#00d4ff]/40 bg-[#0b1328]'
                                    : 'border-white/10 bg-[#090f1f]/70 hover:bg-[#0c1327]'
                            }`}
                            onClick={() => setSelectedMatch(row)}
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <ChampionAvatar championId={row.championId} championName={row.championName} />
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-xl font-bold tracking-tight text-white truncate">{row.championName}</p>
                                        <span
                                            className={`h-5 min-w-5 px-1.5 inline-flex items-center justify-center rounded-md text-[11px] font-black ${
                                                row.result === 'W'
                                                    ? 'bg-[#00d37f]/20 text-[#00ff9a]'
                                                    : 'bg-[#ff4654]/20 text-[#ff6b79]'
                                            }`}
                                        >
                                            {row.result}
                                        </span>
                                        <span className="h-5 px-2 inline-flex items-center justify-center rounded-md text-[11px] font-black bg-[#00bcd4]/20 text-[#21d4fd]">
                                            {row.mode}
                                        </span>
                                    </div>
                                    <p className="text-sm text-white/35">
                                        {row.durationLabel} • {row.agoLabel}
                                    </p>
                                </div>
                            </div>

                            <div className="shrink-0 text-right">
                                <p className="text-3xl font-extrabold tracking-tight text-white">
                                    {row.kills}/{row.deaths}/{row.assists}
                                </p>
                                <p className="text-sm text-white/35">KDA {row.kda}</p>
                            </div>

                            <div className="shrink-0 flex items-center gap-1.5">
                                {hasItems ? (
                                    row.itemIds.slice(0, 7).map((itemId, idx) => (
                                        <img
                                            key={`${row.id}-${itemId}-${idx}`}
                                            src={itemIconUrl(itemId)}
                                            alt={`item-${itemId}`}
                                            className="h-8 w-8 rounded-md border border-white/10 bg-[#0a1022]"
                                            loading="lazy"
                                            onError={(e) => {
                                                const target = e.currentTarget;
                                                target.style.display = 'none';
                                            }}
                                        />
                                    ))
                                ) : (
                                    <div className="text-xs text-white/30">No item data</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }, [loading, rows, selectedMatch]);

    const selectedDetail =
        selectedMatch?.matchId ? detailsByMatchId[selectedMatch.matchId] : undefined;

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Match History</h1>
                <p className="text-text-muted">Review your past performance and match details.</p>
            </div>
            <div className="bg-[#060b17]/80 border border-white/10 rounded-2xl p-4 md:p-5">
                {content}
            </div>
            {selectedMatch && (
                <div className="rounded-3xl border border-[#00d4ff]/35 bg-[#070e20] p-5 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-3xl font-black uppercase tracking-tight text-white">Match Details</h2>
                        <button
                            type="button"
                            onClick={() => setSelectedMatch(null)}
                            className="h-9 w-9 rounded-md inline-flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5"
                        >
                            <X size={22} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-6">
                        <div>
                            <div className="flex items-center gap-4">
                                <ChampionAvatar championId={selectedMatch.championId} championName={selectedMatch.championName} />
                                <div>
                                    <p className="text-4xl font-black tracking-tight text-white">{selectedMatch.championName}</p>
                                    <p className="text-sm text-white/45">
                                        {selectedMatch.mode} • {selectedMatch.durationLabel}
                                    </p>
                                    <p className="text-sm text-white/35">{selectedMatch.agoLabel}</p>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-2">
                                <StatChip label="KDA" value={`${selectedMatch.kills}/${selectedMatch.deaths}/${selectedMatch.assists}`} />
                                <StatChip label="CS" value={String(selectedDetail?.cs ?? 0)} />
                                <StatChip label="Gold" value={selectedDetail?.blue.gold ?? '0'} />
                                <StatChip label="Damage" value={selectedDetail?.damage ?? '0'} />
                                <StatChip label="Vision" value={String(selectedDetail?.vision ?? 0)} />
                                <div className="rounded-xl bg-white/5 px-3 py-2 border border-white/10">
                                    <p className="text-[11px] uppercase tracking-wide text-white/40 font-bold">Items</p>
                                    <div className="mt-1 flex items-center gap-1">
                                        {(selectedDetail?.itemIds?.length ? selectedDetail.itemIds : selectedMatch.itemIds)
                                            .slice(0, 7)
                                            .map((itemId, idx) => (
                                                <img
                                                    key={`detail-item-${itemId}-${idx}`}
                                                    src={itemIconUrl(itemId)}
                                                    alt={`item-${itemId}`}
                                                    className="h-6 w-6 rounded-md border border-white/10 bg-[#0a1022]"
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className="text-3xl font-black uppercase tracking-tight text-white/55">Team Objectives</p>
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <TeamObjectivesCard
                                    teamLabel="Blue Team"
                                    tint="blue"
                                    stats={selectedDetail?.blue}
                                />
                                <TeamObjectivesCard
                                    teamLabel="Red Team"
                                    tint="red"
                                    stats={selectedDetail?.red}
                                />
                            </div>
                            {detailLoading && (
                                <p className="mt-3 text-sm text-white/40">Loading objective details...</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function mapRiotMatchToRow(match: RiotMatchApiRecord): MatchRow | null {
    const id = match.matchId ? String(match.matchId) : null;
    if (!id) return null;
    const kills = Number(match.kills ?? 0);
    const deaths = Number(match.deaths ?? 0);
    const assists = Number(match.assists ?? 0);
    const kda = typeof match.kda === 'string' ? match.kda : formatKda(kills, deaths, assists);
    const mode = normalizeMode(match.gameMode);
    const ts = Number(match.gameCreation ?? 0);

    return {
        id,
        matchId: id,
        result: match.win ? 'W' : 'L',
        championName: match.championName || 'Unknown Champion',
        championId: Number.isFinite(Number(match.championId)) ? Number(match.championId) : null,
        mode,
        kills,
        deaths,
        assists,
        kda,
        durationLabel: formatDuration(Number(match.duration ?? 0)),
        agoLabel: ts > 0 ? formatAgo(ts) : 'recent',
        itemIds: Array.isArray(match.items)
            ? match.items.map((v) => Number(v)).filter((v) => Number.isFinite(v) && v > 0)
            : [],
        source: 'riot',
    };
}

function mapPlatformMatchToRow(match: MatchApiRecord): MatchRow | null {
    if (!match._id) return null;
    return {
        id: String(match._id),
        matchId: null,
        result: 'W',
        championName: typeof match.mapName === 'string' ? match.mapName : 'Match',
        championId: null,
        mode: normalizeMode(match.gameMode),
        kills: 0,
        deaths: 0,
        assists: 0,
        kda: '0.00:1',
        durationLabel: '0m 00s',
        agoLabel: match.scheduledStart ? formatAgo(match.scheduledStart) : 'recent',
        itemIds: [],
        source: 'platform',
    };
}

function mapDetailResponseToView(matchId: string, data: unknown): MatchDetailView {
    const obj = (data && typeof data === 'object' ? data : {}) as Record<string, any>;
    const playerStats = (obj.playerStats && typeof obj.playerStats === 'object' ? obj.playerStats : {}) as Record<string, any>;
    const teamStats = (obj.teamStats && typeof obj.teamStats === 'object' ? obj.teamStats : {}) as Record<string, any>;
    const blue = (teamStats.blue && typeof teamStats.blue === 'object' ? teamStats.blue : {}) as Record<string, any>;
    const red = (teamStats.red && typeof teamStats.red === 'object' ? teamStats.red : {}) as Record<string, any>;

    const items = Array.isArray(playerStats.items)
        ? playerStats.items.map((v: unknown) => Number(v)).filter((v: number) => Number.isFinite(v) && v > 0)
        : [];

    return {
        matchId,
        cs: Number(playerStats.cs ?? 0),
        damage: compactNumber(Number(playerStats.damageDealt ?? 0)),
        vision: Number(playerStats.visionScore ?? 0),
        itemIds: items,
        blue: {
            kills: Number(blue.kills ?? blue.totalKills ?? 0),
            gold: compactNumber(Number(blue.gold ?? blue.totalGold ?? 0)),
            towers: Number(blue.towers ?? 0),
            barons: Number(blue.barons ?? 0),
            dragons: Number(blue.dragons ?? 0),
        },
        red: {
            kills: Number(red.kills ?? red.totalKills ?? 0),
            gold: compactNumber(Number(red.gold ?? red.totalGold ?? 0)),
            towers: Number(red.towers ?? 0),
            barons: Number(red.barons ?? 0),
            dragons: Number(red.dragons ?? 0),
        },
    };
}

function formatAgo(value: string | number): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'recent';
    const deltaMs = Date.now() - date.getTime();
    const days = Math.floor(deltaMs / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days}d ago`;
    const hours = Math.floor(deltaMs / (1000 * 60 * 60));
    if (hours > 0) return `${hours}h ago`;
    const minutes = Math.max(1, Math.floor(deltaMs / (1000 * 60)));
    return `${minutes}m ago`;
}

function formatDuration(totalSeconds: number): string {
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '0m 00s';
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${String(secs).padStart(2, '0')}s`;
}

function formatKda(k: number, d: number, a: number): string {
    const ratio = d === 0 ? k + a : (k + a) / d;
    return `${ratio.toFixed(2)}:1`;
}

function normalizeMode(gameMode: unknown): string {
    const raw = typeof gameMode === 'string' ? gameMode.trim() : '';
    if (!raw) return 'RANKED';
    const upper = raw.toUpperCase();
    if (upper.includes('ARAM')) return 'ARAM';
    if (upper.includes('CLASSIC') || upper.includes('RANKED')) return 'RANKED';
    return upper;
}

function championIconUrl(championId: number): string {
    return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${championId}.png`;
}

function itemIconUrl(itemId: number): string {
    return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/items/${itemId}/icon.png`;
}

function compactNumber(value: number): string {
    if (!Number.isFinite(value)) return '0';
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}m`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return String(Math.round(value));
}

function StatChip({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl bg-white/5 px-3 py-2 border border-white/10">
            <p className="text-3xl leading-none font-black tracking-tight text-white">{value}</p>
            <p className="text-[11px] uppercase tracking-wide text-white/40 font-bold mt-1">{label}</p>
        </div>
    );
}

function TeamObjectivesCard({
    teamLabel,
    tint,
    stats,
}: {
    teamLabel: string;
    tint: 'blue' | 'red';
    stats?: TeamStatsView;
}) {
    const baseClass =
        tint === 'blue'
            ? 'border-[#4f7dff]/30 bg-[#1b2a55]/35'
            : 'border-[#a73f55]/30 bg-[#4c1f2d]/35';

    return (
        <div className={`rounded-2xl border p-4 ${baseClass}`}>
            <p className={`text-2xl font-black uppercase tracking-tight ${tint === 'blue' ? 'text-[#6ea0ff]' : 'text-[#ff718f]'}`}>
                {teamLabel}
            </p>
            <div className="mt-2 space-y-1.5 text-white/75">
                <ObjectiveRow label="Kills" value={String(stats?.kills ?? 0)} />
                <ObjectiveRow label="Gold" value={stats?.gold ?? '0'} />
                <ObjectiveRow label="Towers" value={String(stats?.towers ?? 0)} />
                <ObjectiveRow label="Barons" value={String(stats?.barons ?? 0)} />
                <ObjectiveRow label="Dragons" value={String(stats?.dragons ?? 0)} />
            </div>
        </div>
    );
}

function ObjectiveRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between text-xl font-semibold">
            <span className="text-white/55">{label}</span>
            <span>{value}</span>
        </div>
    );
}

function ChampionAvatar({
    championId,
    championName,
}: {
    championId: number | null;
    championName: string;
}) {
    if (championId) {
        return (
            <img
                src={championIconUrl(championId)}
                alt={championName}
                className="h-14 w-14 rounded-xl border border-[#00ffa3]/35 bg-[#0a1022] object-cover"
                loading="lazy"
            />
        );
    }
    return (
        <div className="h-14 w-14 rounded-xl border border-white/15 bg-[#0a1022] flex items-center justify-center text-sm font-black text-white/50">
            ?
        </div>
    );
}
