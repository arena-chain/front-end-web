import { useState, useEffect, useCallback } from 'react';
import {
    GitBranch, Zap, RotateCcw, Trash2, Trophy,
    X, Shield,
} from 'lucide-react';
import { bracketService, Bracket, BracketSlot, BracketFormat } from '../../../services/bracketService';
import { useLeagueHub } from './LeagueHubContext';

const SLOT_COLORS: Record<string, string> = {
    PENDING: 'border-white/10 bg-surface/60',
    READY: 'border-primary/40 bg-primary/10',
    COMPLETED: 'border-emerald-500/40 bg-emerald-500/10',
    BYE: 'border-white/5 bg-black/40 opacity-50',
};

export default function BracketsPage() {
    const { selectedSeason, notify } = useLeagueHub();
    const [bracket, setBracket] = useState<Bracket | null>(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [genForm, setGenForm] = useState<{ format: BracketFormat }>({ format: 'SINGLE_ELIMINATION' });
    const [showGenForm, setShowGenForm] = useState(false);

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
            const b = await bracketService.generate({ seasonId: selectedSeason._id, format: genForm.format });
            setBracket(b);
            setShowGenForm(false);
            notify('Bracket generated!', 'ok');
        } catch (e) { console.error('Generation failed', e); notify('Generation failed', 'err'); }
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
        if (!bracket) return [];
        const map: Record<number, BracketSlot[]> = {};
        for (const slot of bracket.slots) {
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

    const teamName = (t: BracketSlot['team1Id']) => {
        if (!t) return 'TBD';
        if (typeof t === 'string') return `…${t.slice(-6)}`;
        return (t as { name: string }).name;
    };

    const teamLogo = (t: BracketSlot['team1Id']): string | undefined => {
        if (!t || typeof t === 'string') return undefined;
        return (t as { logo?: string }).logo;
    };

    const roundLabel = (rn: number, total: number) => {
        const diff = total - rn;
        if (diff === 0) return 'Grand Final';
        if (diff === 1) return 'Semi-Finals';
        if (diff === 2) return 'Quarter-Finals';
        return `Round ${rn}`;
    };

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
                        Brackets
                    </h1>
                    <p className="text-text-muted text-sm mt-1">
                        View and manage knockout brackets for <strong className="text-white">{selectedSeason.name}</strong>.
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
            ) : !bracket ? (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-surface border border-white/5 rounded-2xl">
                    <GitBranch className="w-12 h-12 mx-auto mb-4 text-violet-400 opacity-20" />
                    <p className="text-white font-black text-lg uppercase tracking-widest mb-1">No bracket generated yet</p>
                    <p className="text-text-muted text-sm mb-6">Create a knockout bracket based on current standings</p>
                    <button onClick={() => setShowGenForm(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-black text-sm font-black uppercase tracking-widest transition-all">
                        <Zap className="w-4 h-4" /> Generate Bracket
                    </button>
                </div>
            ) : (
                <>
                    {/* Bracket meta */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs bg-violet-500/15 text-violet-300 border border-violet-500/30 px-3 py-1.5 rounded-full font-black uppercase tracking-wider">
                            {bracket.format.replace(/_/g, ' ')}
                        </span>
                        <span className={`text-xs px-3 py-1.5 rounded-full border font-black uppercase tracking-wider ${bracket.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : bracket.status === 'ACTIVE' ? 'bg-primary/10 text-primary border-primary/30'
                                : 'bg-white/5 text-text-muted border-white/10'}`}>
                            {bracket.status}
                        </span>
                        <span className="text-xs font-bold text-text-muted">{bracket.totalRounds} rounds · {bracket.slots.length} slots</span>
                        {bracket.championId && (
                            <span className="flex items-center gap-1.5 text-xs bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 px-3 py-1.5 rounded-full font-black uppercase tracking-wider">
                                <Trophy className="w-3.5 h-3.5" />
                                Champion: {typeof bracket.championId === 'string'
                                    ? `…${bracket.championId.slice(-6)}`
                                    : (bracket.championId as { name: string }).name}
                            </span>
                        )}
                    </div>

                    {/* Visual bracket flex layout */}
                    <div className="overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        <div className="flex gap-8 min-w-max pt-2 px-2">
                            {rounds.map(({ roundNumber, slots }) => (
                                <div key={roundNumber} className="flex flex-col flex-1 min-w-[240px]">
                                    <p className="text-xs font-black uppercase tracking-widest text-text-muted text-center mb-6">
                                        {roundLabel(roundNumber, bracket.totalRounds)}
                                    </p>
                                    <div className="flex flex-col h-full justify-around space-y-6">
                                        {slots.map(slot => (
                                            <div key={slot.slotId}
                                                className={`relative w-full border rounded-xl overflow-hidden transition-all ${SLOT_COLORS[slot.status]} ${slot.status === 'READY' ? 'shadow-[0_0_15px_rgba(34,197,94,0.15)] ring-1 ring-primary/20' : ''}`}>
                                                {/* Connecting lines could be CSS pseudo elements here if desired */}

                                                {/* Team 1 */}
                                                <TeamRow
                                                    name={teamName(slot.team1Id)}
                                                    logo={teamLogo(slot.team1Id)}
                                                    isWinner={!!slot.winnerId && slot.winnerId === (typeof slot.team1Id === 'string' ? slot.team1Id : (slot.team1Id as { _id: string })?._id)}
                                                    isBye={slot.status === 'BYE'}
                                                />
                                                <div className="h-px bg-white/5" />
                                                {/* Team 2 */}
                                                <TeamRow
                                                    name={teamName(slot.team2Id)}
                                                    logo={teamLogo(slot.team2Id)}
                                                    isWinner={!!slot.winnerId && slot.winnerId === (typeof slot.team2Id === 'string' ? slot.team2Id : (slot.team2Id as { _id: string })?._id)}
                                                    isBye={slot.status === 'BYE'}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
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
                                    <button key={f} onClick={() => setGenForm({ format: f })}
                                        className={`py-3 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all ${genForm.format === f
                                            ? 'bg-primary/15 text-primary border-primary/40'
                                            : 'bg-black/30 text-text-muted border-white/10 hover:border-white/20 hover:text-white'}`}>
                                        {f === 'SINGLE_ELIMINATION' ? 'Single Elim.' : 'Double Elim.'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-xs font-bold text-primary/80 space-y-1">
                            <p>Bracket will be seeded from current season standings.</p>
                            <p>Teams must be registered before generating.</p>
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

function TeamRow({ name, logo, isWinner, isBye }: {
    name: string; logo?: string; isWinner: boolean; isBye: boolean;
}) {
    return (
        <div className={`flex items-center justify-between px-3 py-2.5 gap-2 transition-colors ${isWinner ? 'bg-primary/10' : ''}`}>
            <div className="flex items-center gap-2.5 min-w-0">
                {logo ? (
                    <img src={logo} className="w-5 h-5 rounded-md object-contain flex-shrink-0 bg-black/50" alt="" />
                ) : (
                    <div className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-3 h-3 text-text-muted" />
                    </div>
                )}
                <span className={`text-xs truncate ${isBye ? 'text-text-muted' : isWinner ? 'text-primary font-black' : 'text-white font-bold'}`}>
                    {name}
                </span>
            </div>
            {isWinner && <Trophy className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
        </div>
    );
}
