import { useState } from 'react';
import { Shield } from 'lucide-react';
import { resolveBackendAssetUrl } from '../../lib/apiBase';
import type { SeasonTeamWithPlayersRow } from '../../services/adminLeagueService';

export function buildTeamNameMapFromRows(rows: SeasonTeamWithPlayersRow[]): Map<string, string> {
    const m = new Map<string, string>();
    for (const row of rows) {
        const id = row.team?._id;
        if (id) m.set(String(id), row.team?.name ?? 'Team');
    }
    return m;
}

/** Resolve bracket / standing id to display name */
export function teamNameFromMap(map: Map<string, string>, id: unknown): string {
    if (id == null || id === '') return 'TBD';
    if (typeof id === 'object' && id !== null && 'name' in id && typeof (id as { name?: string }).name === 'string') {
        return (id as { name: string }).name;
    }
    const s =
        typeof id === 'object' && id !== null && '_id' in id
            ? String((id as { _id: string })._id)
            : String(id);
    return map.get(s) ?? 'TBD';
}

export function LiquipediaParticipantCard({ row }: { row: SeasonTeamWithPlayersRow }) {
    const [showRoster, setShowRoster] = useState(false);
    const [logoOk, setLogoOk] = useState(true);
    const team = row.team;
    const reg = row.registration;
    const name = team?.name ?? 'Unknown';
    const rawLogo = team?.logo?.trim();
    const logoUrl = rawLogo ? resolveBackendAssetUrl(rawLogo) : '';
    const members = team?.members ?? [];

    const footer =
        reg.seed != null
            ? `Seed #${reg.seed} · ${String(reg.status || 'ACTIVE').replace(/_/g, ' ')}`
            : String(reg.status || 'ACTIVE').replace(/_/g, ' ');

    return (
        <button
            type="button"
            onClick={() => setShowRoster((v) => !v)}
            className="group flex flex-col rounded-md border border-white/12 bg-gradient-to-b from-[#1e232e]/95 to-[#12141c] text-left overflow-hidden min-h-[210px] w-full hover:border-[#00ff87]/35 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff87]/40"
        >
            <div className="text-center text-xs font-extrabold text-cyan-300/90 border-b border-white/10 px-2 py-2 min-h-[2.5rem] flex items-center justify-center leading-tight">
                {name}
            </div>
            <div className="relative flex-1 min-h-[128px] bg-black/40">
                {!showRoster ? (
                    <div className="absolute inset-0 flex items-center justify-center p-3">
                        {logoUrl && logoOk ? (
                            <img
                                src={logoUrl}
                                alt=""
                                className="max-h-[100px] max-w-full object-contain"
                                onError={() => setLogoOk(false)}
                            />
                        ) : (
                            <div
                                className="w-[4.5rem] h-[4.5rem] rounded-xl border border-dashed border-[#00ff87]/35 bg-[#00ff87]/[0.08] flex items-center justify-center text-[#00ff87]/55"
                                aria-hidden
                            >
                                <Shield className="w-9 h-9" strokeWidth={1.25} />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="absolute inset-0 overflow-y-auto p-2.5 text-[11px] leading-snug">
                        {members.length === 0 ? (
                            <p className="text-white/35 text-center py-6 text-xs">No roster on team record</p>
                        ) : (
                            <ul className="space-y-0">
                                {members.map((pl, i) => (
                                    <li
                                        key={pl._id || `${i}-${pl.nickname}`}
                                        className="flex gap-2 border-b border-white/[0.06] py-1 text-white/85"
                                    >
                                        <span className="text-white/40 w-4 shrink-0 tabular-nums">{i + 1}.</span>
                                        <span className="truncate min-w-0">{pl.nickname || pl.email || 'Player'}</span>
                                        {pl.country ? (
                                            <span className="text-white/35 shrink-0 text-[10px]">{pl.country}</span>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
            <div className="text-[10px] font-bold text-center text-sky-300/90 bg-[#161a22] border-t border-white/10 px-2 py-2">
                {footer}
            </div>
            <p className="text-[9px] text-white/30 text-center pb-1.5 pt-0.5">
                {showRoster ? 'Click for logo' : 'Click for roster'}
            </p>
        </button>
    );
}
