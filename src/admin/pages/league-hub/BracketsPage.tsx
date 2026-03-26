import { useState, useEffect, useCallback } from 'react';
import {
    GitBranch, Zap, RotateCcw, Trash2, Trophy,
    X, Shield, Clock, Swords,
} from 'lucide-react';
import { bracketService } from '../../../services/bracketService';
import type { Bracket, BracketSlot, BracketFormat } from '../../../services/bracketService';
import { useLeagueHub } from './LeagueHubContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SLOT_COLORS: Record<string, string> = {
    PENDING:   'border-white/10 bg-[#0d0d0d]',
    READY:     'border-primary/40 bg-primary/5',
    COMPLETED: 'border-emerald-500/30 bg-emerald-500/5',
    BYE:       'border-white/5 bg-black/40 opacity-40',
};

function getRoundLabel(rn: number, total: number): string {
    const diff = total - rn;
    if (diff === 0) return 'Grand Final';
    if (diff === 1) return 'Semi-Finals';
    if (diff === 2) return 'Quarter-Finals';
    return `Round ${rn}`;
}

function getRoundFormat(rn: number, total: number): string {
    const diff = total - rn;
    if (diff === 0) return 'BO5';
    if (diff === 1) return 'BO3';
    return 'BO3';
}

function getRoundHeaderColor(rn: number, total: number) {
    const diff = total - rn;
    if (diff === 0) return { text: 'text-yellow-400', dot: 'bg-yellow-400', border: 'border-yellow-500/30' };
    if (diff === 1) return { text: 'text-violet-400', dot: 'bg-violet-400', border: 'border-violet-500/30' };
    if (diff === 2) return { text: 'text-blue-400',   dot: 'bg-blue-400',   border: 'border-blue-500/30' };
    return { text: 'text-emerald-400', dot: 'bg-emerald-400', border: 'border-emerald-500/30' };
}

function teamName(t: BracketSlot['team1Id']): string {
    if (!t) return 'TBD';
    if (typeof t === 'string') return `…${t.slice(-6)}`;
    return (t as { name: string }).name;
}

function teamLogo(t: BracketSlot['team1Id']): string | undefined {
    if (!t || typeof t === 'string') return undefined;
    return (t as { logo?: string }).logo;
}

function teamId(t: BracketSlot['team1Id']): string | undefined {
    if (!t) return undefined;
    if (typeof t === 'string') return t;
    return (t as { _id: string })._id;
}

function useCountdown(target: string | undefined): string {
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        if (!target) return;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [target]);
    if (!target) return '';
    const diff = new Date(target).getTime() - now;
    if (diff <= 0) return 'LIVE NOW';
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
}

// ─── Demo Bracket (static preview) ────────────────────────────────────────────

const DEMO_TEAMS = ['Sentinels', 'LOUD', 'Fnatic', 'DRX', 'Paper Rex', 'NRG', 'Evil Geniuses', 'Team Liquid'];

function buildDemoBracket(): Bracket {
    const slots: BracketSlot[] = [];
    // QF — round 1, 4 matches
    for (let i = 0; i < 4; i++) {
        const t1 = DEMO_TEAMS[i * 2];
        const t2 = DEMO_TEAMS[i * 2 + 1];
        // winner alternates: even=t1, odd=t2
        slots.push({
            slotId: `qf-${i}`, roundNumber: 1, position: i + 1,
            team1Id: { _id: `t${i * 2}`, name: t1 },
            team2Id: { _id: `t${i * 2 + 1}`, name: t2 },
            winnerId: `t${i % 2 === 0 ? i * 2 : i * 2 + 1}`,
            status: 'COMPLETED',
        });
    }
    // SF — round 2, 2 matches
    slots.push({
        slotId: 'sf-0', roundNumber: 2, position: 1,
        team1Id: { _id: 't0', name: 'Sentinels' },
        team2Id: { _id: 't3', name: 'DRX' },
        winnerId: 't0',
        status: 'COMPLETED',
    });
    slots.push({
        slotId: 'sf-1', roundNumber: 2, position: 2,
        team1Id: { _id: 't4', name: 'Paper Rex' },
        team2Id: { _id: 't7', name: 'Team Liquid' },
        status: 'READY',
    });
    // Grand Final — round 3
    slots.push({
        slotId: 'gf-0', roundNumber: 3, position: 1,
        team1Id: { _id: 't0', name: 'Sentinels' },
        team2Id: undefined,
        status: 'PENDING',
    });
    return {
        _id: 'demo', seasonId: 'demo', format: 'SINGLE_ELIMINATION',
        totalRounds: 3, slots, status: 'ACTIVE',
    };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BracketsPage() {
    const { selectedSeason, notify } = useLeagueHub();
    const [bracket, setBracket] = useState<Bracket | null>(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [genForm, setGenForm] = useState<{ format: BracketFormat; seededTeamIds: string }>({ format: 'SINGLE_ELIMINATION', seededTeamIds: '' });
    const [showGenForm, setShowGenForm] = useState(false);
    const [activeTab, setActiveTab] = useState<'bracket' | 'matches'>('bracket');

    // Use demo bracket as fallback for design preview
    const isDemo = !bracket;
    const displayBracket = bracket ?? buildDemoBracket();

    const load = useCallback(async () => {
        if (!selectedSeason) { setBracket(null); return; }
        try {
            setLoading(true);
            setBracket(await bracketService.getBySeason(selectedSeason._id));
        } catch (e) { console.error('Failed to load bracket', e); notify('Failed to load bracket', 'err'); }
        finally { setLoading(false); }
    }, [selectedSeason, notify]);

    useEffect(() => { load(); }, [load]);

    const handleGenerate = async () => {
        if (!selectedSeason) return;
        try {
            setGenerating(true);
            const ids = genForm.seededTeamIds.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
            const b = await bracketService.generate({
                seasonId: selectedSeason._id,
                format: genForm.format,
                ...(ids.length >= 2 ? { seededTeamIds: ids } : {}),
            });
            setBracket(b);
            setShowGenForm(false);
            notify('Bracket generated!', 'ok');
        } catch (e: any) {
            const msg = e?.response?.data?.message || e?.message || 'Unknown error';
            console.error('Generation failed', msg, e?.response?.data);
            notify(`Generation failed: ${msg}`, 'err');
        }
        finally { setGenerating(false); }
    };

    const handleReset = async () => {
        if (!bracket) return;
        if (!confirm('Reset bracket? All results will be cleared.')) return;
        try { setBracket(await bracketService.reset(bracket._id)); notify('Bracket reset', 'ok'); }
        catch (e) { console.error('Reset failed', e); notify('Reset failed', 'err'); }
    };

    const handleDelete = async () => {
        if (!bracket) return;
        if (!confirm('Delete bracket permanently?')) return;
        try { await bracketService.delete(bracket._id); setBracket(null); notify('Deleted', 'ok'); }
        catch (e) { console.error('Delete failed', e); notify('Delete failed', 'err'); }
    };

    // Group slots by round
    const rounds = (() => {
        const map: Record<number, BracketSlot[]> = {};
        for (const slot of displayBracket.slots) {
            if (!map[slot.roundNumber]) map[slot.roundNumber] = [];
            map[slot.roundNumber].push(slot);
        }
        return Object.entries(map)
            .sort(([a], [b]) => +a - +b)
            .map(([rn, slots]) => ({
                roundNumber: +rn,
                slots: slots.sort((a, b) => a.position - b.position),
            }));
    })();

    // Build scheduled matches from bracket slots
    const scheduledMatches = (() => {
        return displayBracket.slots
            .filter(s => s.status === 'PENDING' || s.status === 'READY')
            .sort((a, b) => a.roundNumber - b.roundNumber || a.position - b.position)
            .map(s => ({
                ...s,
                stageLabel: getRoundLabel(s.roundNumber, displayBracket.totalRounds),
                format: getRoundFormat(s.roundNumber, displayBracket.totalRounds),
            }));
    })();

    // No season
    if (!selectedSeason) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <GitBranch size={40} className="text-text-muted mb-4 opacity-30" />
                <p className="text-white font-black text-lg uppercase tracking-widest mb-1">No Season Selected</p>
                <p className="text-text-muted text-sm">Please select a season from the top bar to view brackets.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <GitBranch size={24} className="text-violet-400" />
                        Brackets & Playoffs
                    </h1>
                    <p className="text-text-muted text-sm mt-1">
                        Tournament bracket for <strong className="text-white">{selectedSeason.name}</strong> — Grand Final is <span className="text-yellow-400 font-black">BO5</span>
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {!bracket && (
                        <button onClick={() => setShowGenForm(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-black bg-primary hover:bg-primary/90 transition-all shrink-0">
                            <Zap size={16} /> Generate Bracket
                        </button>
                    )}
                    {bracket && (
                        <>
                            <button onClick={handleReset}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white/5 hover:bg-white/10 text-white transition-all">
                                <RotateCcw size={14} /> Reset
                            </button>
                            <button onClick={handleDelete}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all">
                                <Trash2 size={14} /> Delete
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-primary text-sm font-bold text-center py-16 animate-pulse">Loading Bracket…</div>
            ) : (
                <>
                    {/* Demo banner */}
                    {isDemo && (
                        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3">
                            <Zap size={16} className="text-amber-400 shrink-0" />
                            <div className="flex-1">
                                <p className="text-amber-300 text-xs font-black uppercase tracking-widest">Preview Mode</p>
                                <p className="text-amber-200/60 text-[11px] mt-0.5">Showing demo bracket. Generate a real bracket or register teams to replace this.</p>
                            </div>
                            <button onClick={() => setShowGenForm(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-widest transition-all shrink-0">
                                <Zap size={12} /> Generate Real Bracket
                            </button>
                        </div>
                    )}
                    {/* Bracket meta badges */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs bg-violet-500/15 text-violet-300 border border-violet-500/30 px-3 py-1.5 rounded-full font-black uppercase tracking-wider">
                            {displayBracket.format.replace(/_/g, ' ')}
                        </span>
                        <span className={`text-xs px-3 py-1.5 rounded-full border font-black uppercase tracking-wider ${displayBracket.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : displayBracket.status === 'ACTIVE' ? 'bg-primary/10 text-primary border-primary/30'
                                : 'bg-white/5 text-text-muted border-white/10'}`}>
                            {displayBracket.status}
                        </span>
                        <span className="text-xs font-bold text-text-muted">{displayBracket.totalRounds} rounds · {displayBracket.slots.length} slots</span>
                        {displayBracket.championId && (
                            <span className="flex items-center gap-1.5 text-xs bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 px-3 py-1.5 rounded-full font-black uppercase tracking-wider">
                                <Trophy className="w-3.5 h-3.5" />
                                Champion: {typeof displayBracket.championId === 'string'
                                    ? `…${displayBracket.championId.slice(-6)}`
                                    : (displayBracket.championId as { name: string }).name}
                            </span>
                        )}
                    </div>

                    {/* Tab switcher: Bracket / Matches */}
                    <div className="flex items-center gap-1 bg-[#0a0a0a] border border-white/5 rounded-xl p-1 w-fit">
                        <button
                            onClick={() => setActiveTab('bracket')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'bracket' ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'}`}
                        >
                            <GitBranch size={13} /> Bracket
                        </button>
                        <button
                            onClick={() => setActiveTab('matches')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'matches' ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'}`}
                        >
                            <Swords size={13} /> Matches
                        </button>
                    </div>

                    {/* ═══ BRACKET TAB ═══ */}
                    {activeTab === 'bracket' && (
                        <div className="overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            <div className="flex gap-0 min-w-max pt-2 px-2">
                                {rounds.map(({ roundNumber, slots }, roundIdx) => {
                                    const label = getRoundLabel(roundNumber, displayBracket.totalRounds);
                                    const format = getRoundFormat(roundNumber, displayBracket.totalRounds);
                                    const hc = getRoundHeaderColor(roundNumber, displayBracket.totalRounds);
                                    const isFinal = displayBracket.totalRounds - roundNumber === 0;
                                    const isLast = roundIdx === rounds.length - 1;

                                    return (
                                        <div key={roundNumber} className="flex items-stretch">
                                            {/* Round column */}
                                            <div className={`flex flex-col min-w-[260px] ${isFinal ? 'min-w-[300px]' : ''}`}>
                                                {/* Round header */}
                                                <div className={`flex items-center justify-between mb-5 px-1`}>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${hc.dot}`} />
                                                        <span className={`text-xs font-black uppercase tracking-widest ${hc.text}`}>
                                                            {label}
                                                        </span>
                                                    </div>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${hc.border} ${hc.text} bg-black/40`}>
                                                        {format}
                                                    </span>
                                                </div>

                                                {/* Slots */}
                                                <div className={`flex flex-col h-full justify-around ${isFinal ? 'gap-0' : 'gap-4'}`}>
                                                    {slots.map((slot) => {
                                                        const isCompleted = slot.status === 'COMPLETED';
                                                        return (
                                                            <div key={slot.slotId} className="px-1">
                                                                <div className={`relative border rounded-xl overflow-hidden transition-all ${SLOT_COLORS[slot.status]}
                                                                    ${slot.status === 'READY' ? 'shadow-[0_0_20px_rgba(34,197,94,0.12)] ring-1 ring-primary/20' : ''}
                                                                    ${isFinal ? 'ring-1 ring-yellow-500/20 shadow-[0_0_30px_rgba(234,179,8,0.08)]' : ''}`}
                                                                >
                                                                    {isFinal && (
                                                                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-500/0 via-yellow-500/60 to-yellow-500/0" />
                                                                    )}
                                                                    <BracketTeamRow
                                                                        name={teamName(slot.team1Id)}
                                                                        logo={teamLogo(slot.team1Id)}
                                                                        seed={slot.position * 2 - 1}
                                                                        isWinner={!!slot.winnerId && slot.winnerId === teamId(slot.team1Id)}
                                                                        isLoser={isCompleted && !!slot.winnerId && slot.winnerId !== teamId(slot.team1Id)}
                                                                        isBye={slot.status === 'BYE'}
                                                                    />
                                                                    <div className="h-px bg-white/[0.04]" />
                                                                    <BracketTeamRow
                                                                        name={teamName(slot.team2Id)}
                                                                        logo={teamLogo(slot.team2Id)}
                                                                        seed={slot.position * 2}
                                                                        isWinner={!!slot.winnerId && slot.winnerId === teamId(slot.team2Id)}
                                                                        isLoser={isCompleted && !!slot.winnerId && slot.winnerId !== teamId(slot.team2Id)}
                                                                        isBye={slot.status === 'BYE'}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Connector lines between rounds */}
                                            {!isLast && (
                                                <div className="flex items-center w-10 shrink-0">
                                                    <div className="w-full flex flex-col items-center justify-around h-full">
                                                        {slots.map((_, i) => (
                                                            i % 2 === 0 && (
                                                                <div key={i} className="relative flex items-center w-full" style={{ height: `${100 / Math.ceil(slots.length / 2)}%` }}>
                                                                    <svg className="w-full h-full" viewBox="0 0 40 60" preserveAspectRatio="none" fill="none">
                                                                        <path d="M0 15 H15 V30 H40" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" fill="none" />
                                                                        <path d="M0 45 H15 V30 H40" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" fill="none" />
                                                                    </svg>
                                                                </div>
                                                            )
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Advances / Eliminated columns */}
                                {displayBracket.status === 'COMPLETED' && (
                                    <div className="flex flex-col min-w-[220px] ml-6">
                                        <div className="mb-5 px-1">
                                            <span className="text-xs font-black uppercase tracking-widest text-yellow-400">Champion</span>
                                        </div>
                                        <div className="flex flex-col gap-3 px-1">
                                            {displayBracket.championId && (
                                                <div className="border border-yellow-500/30 bg-yellow-500/5 rounded-xl p-3 flex items-center gap-3">
                                                    <Trophy className="w-5 h-5 text-yellow-400 shrink-0" />
                                                    <span className="text-sm font-black text-yellow-400">
                                                        {typeof displayBracket.championId === 'string'
                                                            ? `…${displayBracket.championId.slice(-6)}`
                                                            : (displayBracket.championId as { name: string }).name}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ═══ MATCHES TAB ═══ */}
                    {activeTab === 'matches' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock size={14} className="text-text-muted" />
                                <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Scheduled Matches — Countdown to Kickoff</span>
                            </div>

                            {scheduledMatches.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center bg-surface border border-white/5 rounded-2xl">
                                    <Swords className="w-10 h-10 text-text-muted opacity-20 mb-3" />
                                    <p className="text-white font-black text-sm uppercase tracking-widest mb-1">No upcoming matches</p>
                                    <p className="text-text-muted text-xs">All bracket matches have been completed or none are scheduled yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {scheduledMatches.map(match => (
                                        <ScheduledMatchCard
                                            key={match.slotId}
                                            slot={match}
                                            stageLabel={match.stageLabel}
                                            format={match.format}
                                            totalRounds={displayBracket.totalRounds}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Generate modal */}
            {showGenForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-5 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-white font-black uppercase tracking-widest">Generate Bracket</h2>
                            <button onClick={() => setShowGenForm(false)} className="text-text-muted hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Format</label>
                            <div className="grid grid-cols-2 gap-3">
                                {(['SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION'] as BracketFormat[]).map(f => (
                                    <button key={f} onClick={() => setGenForm(prev => ({ ...prev, format: f }))}
                                        className={`py-3 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all ${genForm.format === f
                                            ? 'bg-primary/15 text-primary border-primary/40'
                                            : 'bg-black/30 text-text-muted border-white/10 hover:border-white/20 hover:text-white'}`}>
                                        {f === 'SINGLE_ELIMINATION' ? 'Single Elim.' : 'Double Elim.'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Seeded Team IDs <span className="text-text-muted/50">(optional)</span></label>
                            <textarea
                                value={genForm.seededTeamIds}
                                onChange={e => setGenForm(f => ({ ...f, seededTeamIds: e.target.value }))}
                                placeholder={'Paste team IDs (one per line or comma-separated)\ne.g. 661f…, 662a…'}
                                rows={4}
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono placeholder-text-muted/40 focus:border-primary/50 outline-none resize-none"
                            />
                            <p className="text-[10px] text-text-muted mt-1.5">Need at least 2 teams. Leave empty to use season standings.</p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowGenForm(false)}
                                className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white text-sm font-bold transition-all">Cancel</button>
                            <button onClick={handleGenerate} disabled={generating}
                                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-black text-sm font-black uppercase tracking-wider disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                                {generating ? 'Generating…' : <><Zap size={14} /> Generate</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Bracket Team Row ─────────────────────────────────────────────────────────

function BracketTeamRow({ name, logo, seed, isWinner, isLoser, isBye }: {
    name: string; logo?: string; seed: number; isWinner: boolean; isLoser: boolean; isBye: boolean;
}) {
    return (
        <div className={`flex items-center justify-between px-3 py-2.5 gap-2 transition-all
            ${isWinner ? 'bg-primary/10' : ''}
            ${isLoser ? 'opacity-40' : ''}`}
        >
            <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-[9px] font-bold text-text-muted/50 w-3 text-center shrink-0">{seed}</span>
                {logo ? (
                    <img src={logo} className="w-5 h-5 rounded-md object-contain flex-shrink-0 bg-black/50" alt="" />
                ) : (
                    <div className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-3 h-3 text-text-muted" />
                    </div>
                )}
                <span className={`text-xs truncate ${isBye ? 'text-text-muted italic' : isWinner ? 'text-primary font-black' : 'text-white font-bold'}`}>
                    {name}
                </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                {isWinner && <Trophy className="w-3.5 h-3.5 text-primary" />}
            </div>
        </div>
    );
}

// ─── Scheduled Match Card ─────────────────────────────────────────────────────

function ScheduledMatchCard({ slot, stageLabel, format, totalRounds }: {
    slot: BracketSlot; stageLabel: string; format: string; totalRounds: number;
}) {
    const hc = getRoundHeaderColor(slot.roundNumber, totalRounds);
    const isFinal = totalRounds - slot.roundNumber === 0;
    const countdown = useCountdown(undefined); // no scheduledStart on BracketSlot, show "TBD"

    return (
        <div className={`relative border rounded-xl overflow-hidden transition-all bg-[#0d0d0d] hover:bg-[#111] ${hc.border}
            ${isFinal ? 'ring-1 ring-yellow-500/15' : ''}`}
        >
            {isFinal && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-500/0 via-yellow-500/50 to-yellow-500/0" />
            )}

            <div className="flex items-center gap-4 p-4">
                {/* Stage badge */}
                <div className="flex flex-col items-center gap-1 shrink-0 min-w-[90px]">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${hc.text}`}>
                        {stageLabel}
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${hc.border} ${hc.text} bg-black/40`}>
                        {format}
                    </span>
                </div>

                {/* Divider */}
                <div className="w-px h-10 bg-white/5 shrink-0" />

                {/* Teams */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        {teamLogo(slot.team1Id) ? (
                            <img src={teamLogo(slot.team1Id)} className="w-6 h-6 rounded-md object-contain bg-black/50 shrink-0" alt="" />
                        ) : (
                            <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center shrink-0">
                                <Shield className="w-3.5 h-3.5 text-text-muted" />
                            </div>
                        )}
                        <span className="text-sm font-bold text-white truncate">{teamName(slot.team1Id)}</span>
                    </div>

                    <span className="text-[10px] font-black text-text-muted bg-white/5 px-2.5 py-1 rounded-lg shrink-0 uppercase tracking-widest">VS</span>

                    <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                        <span className="text-sm font-bold text-white truncate">{teamName(slot.team2Id)}</span>
                        {teamLogo(slot.team2Id) ? (
                            <img src={teamLogo(slot.team2Id)} className="w-6 h-6 rounded-md object-contain bg-black/50 shrink-0" alt="" />
                        ) : (
                            <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center shrink-0">
                                <Shield className="w-3.5 h-3.5 text-text-muted" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Divider */}
                <div className="w-px h-10 bg-white/5 shrink-0" />

                {/* Countdown */}
                <div className="flex flex-col items-end gap-0.5 shrink-0 min-w-[100px]">
                    <div className="flex items-center gap-1.5">
                        <Clock size={11} className="text-text-muted" />
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Starts in</span>
                    </div>
                    <span className={`text-sm font-black tabular-nums ${slot.status === 'READY' ? 'text-primary' : 'text-text-muted'}`}>
                        {slot.status === 'READY' ? 'READY' : countdown || 'TBD'}
                    </span>
                </div>
            </div>
        </div>
    );
}
