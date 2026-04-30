import type { AdminBracket, BracketSlot, SeasonTeamWithPlayersRow } from '../services/adminLeagueService';

/** Match Nest `BracketService.buildSingleElimination` seed order (by seed ascending). */
export function teamIdsSortedBySeed(rows: SeasonTeamWithPlayersRow[]): string[] {
    const rowsWithTeam = rows.filter((r) => r.team?._id);
    rowsWithTeam.sort((a, b) => (a.registration.seed ?? 9999) - (b.registration.seed ?? 9999));
    return rowsWithTeam.map((r) => r.team!._id);
}

function buildSingleEliminationSlots(teams: string[]): BracketSlot[] {
    const n = teams.length;
    const totalRounds = Math.ceil(Math.log2(n));
    const bracketSize = 2 ** totalRounds;
    const padded: (string | null)[] = [...teams];
    while (padded.length < bracketSize) padded.push(null);

    const slots: BracketSlot[] = [];
    const r1Matches = bracketSize / 2;
    for (let pos = 1; pos <= r1Matches; pos++) {
        const t1 = padded[(pos - 1) * 2];
        const t2 = padded[(pos - 1) * 2 + 1];
        const isBye = t1 !== null && t2 === null;
        const nextPos = Math.ceil(pos / 2);
        const nextSlotId = totalRounds > 1 ? `R2S${nextPos}` : undefined;
        slots.push({
            slotId: `R1S${pos}`,
            roundNumber: 1,
            position: pos,
            team1Id: t1 ?? undefined,
            team2Id: t2 ?? undefined,
            nextSlotId,
            status: isBye ? 'BYE' : t1 && t2 ? 'READY' : 'PENDING',
        });
    }
    for (let round = 2; round <= totalRounds; round++) {
        const matchesInRound = bracketSize / 2 ** round;
        for (let pos = 1; pos <= matchesInRound; pos++) {
            const nextPos = Math.ceil(pos / 2);
            const nextSlotId = round < totalRounds ? `R${round + 1}S${nextPos}` : undefined;
            slots.push({
                slotId: `R${round}S${pos}`,
                roundNumber: round,
                position: pos,
                nextSlotId,
                status: 'PENDING',
            });
        }
    }
    return slots;
}

/**
 * When the API still has a one-match placeholder (e.g. only `gf1`, totalRounds 1) but teams are registered,
 * build the full single-elimination tree for display — same shape as POST /brackets/generate.
 */
export function expandPlaceholderSingleElimBracket(
    bracket: AdminBracket | null,
    participantRows: SeasonTeamWithPlayersRow[],
): AdminBracket | null {
    if (!bracket || bracket.format !== 'SINGLE_ELIMINATION') return bracket;

    const teamIds = teamIdsSortedBySeed(participantRows);
    if (teamIds.length < 2) return bracket;

    const isPlaceholder =
        bracket.slots.length === 0 ||
        (bracket.slots.length === 1 && bracket.totalRounds === 1);

    if (!isPlaceholder) return bracket;

    const totalRounds = Math.ceil(Math.log2(teamIds.length));
    return {
        ...bracket,
        totalRounds,
        slots: buildSingleEliminationSlots(teamIds),
    };
}
