import { useState, useEffect } from 'react';
import {
    BookOpen, Plus, Loader2, Trash2, Search, AlertTriangle,
    CheckSquare, ChevronRight, RefreshCw, X, Gamepad2, Map,
    ToggleLeft, ToggleRight, Zap, Calendar, Users,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
    leagueRulesService,
    type SeasonRule, type FormatType, type MatchType,
    type Tiebreaker, type MapVetoFormat, type VetoFirstPick,
    type OvertimeFormat, type OvertimeConfig, type PopulatedGame,
    type RuleUsage, type SideSelection, type ScoreSubmissionMethod,
} from '../../../services/leagueRulesService';
import catalogService from '../../../services/catalogService';
import type { Game } from '../../../models/game';
import { useLeagueHub } from './LeagueHubContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const apiErr = (e: unknown) => {
    const err = e as { response?: { data?: { message?: string } } };
    return err?.response?.data?.message || 'Something went wrong';
};

// Veto format options filtered by match type
const VETO_OPTIONS: Record<MatchType, { value: MapVetoFormat; label: string }[]> = {
    BO1: [
        { value: 'BAN_BAN_DECIDER', label: 'Ban Ban → Decider' },
        { value: 'RANDOM', label: 'Random' },
        { value: 'ADMIN_PICK', label: 'Admin Pick' },
    ],
    BO3: [
        { value: 'BAN_BAN_PICK_PICK_BAN_BAN_DECIDER', label: 'Ban Ban Pick Pick Ban Ban → Decider (Standard)' },
        { value: 'PICK_PICK_DECIDER', label: 'Pick Pick → Decider (Simple)' },
    ],
    BO5: [
        { value: 'BAN_BAN_PICK_PICK_PICK_PICK_DECIDER', label: 'Ban Ban Pick Pick Pick Pick → Decider' },
    ],
};

// ─── Game presets (map system + overtime) ────────────────────────────────────

interface GamePreset {
    mapPool: string[];
    mapVetoEnabled: boolean;
    mapVetoFormat: MapVetoFormat | null;
    vetoFirstPick: VetoFirstPick | null;
    overtimeConfig: OvertimeConfig;
}

const GAME_PRESETS: Record<string, GamePreset> = {
    Valorant: {
        mapPool: ['Haven', 'Bind', 'Split', 'Ascent', 'Pearl', 'Lotus', 'Sunset'],
        mapVetoEnabled: true,
        mapVetoFormat: 'BAN_BAN_PICK_PICK_BAN_BAN_DECIDER',
        vetoFirstPick: 'HIGHER_SEED',
        overtimeConfig: { format: 'VALORANT_OT', enabled: true, maxOvertimePeriods: 0 },
    },
    'League of Legends': {
        mapPool: ["Summoner's Rift"],
        mapVetoEnabled: false,
        mapVetoFormat: null,
        vetoFirstPick: null,
        overtimeConfig: { format: 'NONE', enabled: false },
    },
    CS2: {
        mapPool: ['Mirage', 'Inferno', 'Nuke', 'Overpass', 'Vertigo', 'Ancient', 'Anubis'],
        mapVetoEnabled: true,
        mapVetoFormat: 'BAN_BAN_PICK_PICK_BAN_BAN_DECIDER',
        vetoFirstPick: 'COIN_FLIP',
        overtimeConfig: { format: 'CS2_OT', enabled: true, maxRoundsPerPeriod: 6, startMoney: 10500, allowDrawIfDisabled: false, maxOvertimePeriods: 0 },
    },
    'Counter-Strike 2': {
        mapPool: ['Mirage', 'Inferno', 'Nuke', 'Overpass', 'Vertigo', 'Ancient', 'Anubis'],
        mapVetoEnabled: true,
        mapVetoFormat: 'BAN_BAN_PICK_PICK_BAN_BAN_DECIDER',
        vetoFirstPick: 'COIN_FLIP',
        overtimeConfig: { format: 'CS2_OT', enabled: true, maxRoundsPerPeriod: 6, startMoney: 10500, allowDrawIfDisabled: false, maxOvertimePeriods: 0 },
    },
};

const MAP_PRESETS = GAME_PRESETS;

// Parse veto format into step list
function parseVetoSteps(fmt: string): { step: number; team: string; action: string }[] {
    if (!fmt) return [];
    const parts = fmt.split('_');
    const steps: { step: number; team: string; action: string }[] = [];
    let team = 'A';
    let n = 1;
    for (const p of parts) {
        if (p === 'DECIDER') {
            steps.push({ step: n++, team: 'AUTO', action: 'DECIDER' });
        } else if (p === 'BAN' || p === 'PICK') {
            steps.push({ step: n++, team: `Team ${team}`, action: p });
            team = team === 'A' ? 'B' : 'A';
        }
    }
    return steps;
}

const FORMAT_COLORS: Record<string, string> = {
    LEAGUE: 'bg-green-500/15 text-green-400 border-green-500/25',
    GROUPS: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    SWISS: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
    KNOCKOUT: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
};
const MATCH_COLORS: Record<string, string> = {
    BO1: 'bg-white/5 text-text-muted border-white/10',
    BO3: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
    BO5: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
};

function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' }) {
    return (
        <div className={cn('fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl',
            type === 'ok' ? 'bg-green-500/20 border border-green-500/30 text-green-300' : 'bg-red-500/20 border border-red-500/30 text-red-300')}>
            {type === 'ok' ? <CheckSquare size={15} /> : <AlertTriangle size={15} />}
            {msg}
        </div>
    );
}

function FormSection({ icon, title, accent = 'emerald', children }: { icon: React.ReactNode; title: string; accent?: 'emerald' | 'blue' | 'amber' | 'slate' | 'indigo'; children: React.ReactNode }) {
    const accentCls = {
        emerald: 'border-l-emerald-500/50 bg-emerald-500/5',
        blue: 'border-l-blue-500/50 bg-blue-500/5',
        amber: 'border-l-amber-500/50 bg-amber-500/5',
        slate: 'border-l-slate-500/50 bg-slate-500/5',
        indigo: 'border-l-indigo-500/50 bg-indigo-500/5',
    }[accent];
    return (
        <div className={cn('rounded-xl border border-white/10 pl-4 border-l-4', accentCls)}>
            <div className="py-3 flex items-center gap-2">
                <span className="text-white/70">{icon}</span>
                <h4 className="text-sm font-bold text-white">{title}</h4>
            </div>
            <div className="pb-4 space-y-3">{children}</div>
        </div>
    );
}

const inputCls = 'w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted focus:border-emerald-500/40 outline-none transition-colors';
const labelCls = 'block text-xs font-medium text-slate-400 mb-1';

// ─── Map Pool chip input ───────────────────────────────────────────────────────

function MapPoolInput({ maps, onChange }: { maps: string[]; onChange: (maps: string[]) => void }) {
    const [input, setInput] = useState('');

    const add = () => {
        const v = input.trim();
        if (v && !maps.includes(v)) { onChange([...maps, v]); }
        setInput('');
    };
    const remove = (m: string) => onChange(maps.filter(x => x !== m));
    const onKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); add(); } };

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={onKey}
                    placeholder="Type map name, press Enter…"
                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted focus:border-green-500/50 outline-none"
                />
                <button type="button" onClick={add}
                    className="px-3 py-2 rounded-lg bg-white/8 hover:bg-white/15 text-white text-sm font-bold border border-white/10 transition-all">
                    Add
                </button>
            </div>
            {maps.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {maps.map(m => (
                        <span key={m} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/25">
                            <Map size={10} />
                            {m}
                            <button type="button" onClick={() => remove(m)} className="hover:text-red-400 transition-colors ml-0.5">
                                <X size={10} />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Veto sequence visualizer ─────────────────────────────────────────────────

function VetoVisualizer({ fmt }: { fmt: string }) {
    const steps = parseVetoSteps(fmt);
    if (!steps.length) return null;
    return (
        <div className="flex flex-wrap gap-1.5 mt-2">
            {steps.map(s => (
                <div key={s.step} className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border',
                    s.action === 'BAN' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        s.action === 'PICK' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            'bg-white/5 text-text-muted border-white/10'
                )}>
                    <span className="text-white/30">{s.step}.</span>
                    {s.team === 'AUTO' ? 'AUTO' : s.team} — {s.action}
                </div>
            ))}
        </div>
    );
}

// ─── Form interface ───────────────────────────────────────────────────────────

const RULE_USAGE_OPTIONS: { value: RuleUsage; label: string }[] = [
    { value: 'REGULAR_SEASON', label: 'Regular Season' },
    { value: 'PLAYOFFS', label: 'Playoffs' },
    { value: 'GRAND_FINAL', label: 'Grand Final' },
    { value: 'PLAY_IN', label: 'Play-In' },
    { value: 'QUALIFICATION', label: 'Qualification' },
    { value: 'GROUP_STAGE', label: 'Group Stage' },
];

const SIDE_SELECTION_OPTIONS: { value: SideSelection; label: string }[] = [
    { value: 'HIGHER_SEED_CHOOSES', label: 'Higher seed chooses' },
    { value: 'KNIFE_ROUND', label: 'Knife round' },
    { value: 'COIN_TOSS', label: 'Coin toss' },
    { value: 'VETO_WINNER_CHOOSES', label: 'Veto winner chooses' },
    { value: 'FIXED_TEAM_A_ATTACK', label: 'Fixed: Team A attack' },
];

const SCORE_SUBMISSION_OPTIONS: { value: ScoreSubmissionMethod; label: string }[] = [
    { value: 'ADMIN_VERIFIED', label: 'Admin verified' },
    { value: 'BOTH_TEAMS_CONFIRM', label: 'Both teams confirm' },
    { value: 'AUTO_FROM_API', label: 'Auto from API' },
];

interface CreateForm {
    name: string;
    gameId: string;
    formatType: FormatType;
    matchType: MatchType;
    pointsWin: number;
    pointsLoss: number;
    maxTeams: number;
    maxForfeitsBeforeDisqualification: number;
    forfeitCountsAsLoss: boolean;
    tiebreaker: Tiebreaker;
    mapVetoEnabled: boolean;
    mapVetoFormat: MapVetoFormat | null;
    vetoFirstPick: VetoFirstPick | null;
    mapPool: string[];
    overtimeConfig: OvertimeConfig;
    ruleUsage: RuleUsage[];
    sideSelection: SideSelection;
    scoreSubmissionMethod: ScoreSubmissionMethod;
    substitutionsAllowed: boolean;
    maxSubstitutions: number;
    emergencySubsOnly: boolean;
    pauseAllowedForDisconnect: boolean;
    replayConditions: string;
    remakeConditions: string;
    adminDecisionRequired: boolean;
}

const EMPTY: CreateForm = {
    name: '',
    gameId: '',
    formatType: 'LEAGUE',
    matchType: 'BO3',
    pointsWin: 3,
    pointsLoss: 0,
    maxTeams: 10,
    maxForfeitsBeforeDisqualification: 3,
    forfeitCountsAsLoss: true,
    tiebreaker: 'GAME_DIFF',
    mapVetoEnabled: true,
    mapVetoFormat: 'BAN_BAN_PICK_PICK_BAN_BAN_DECIDER',
    vetoFirstPick: 'HIGHER_SEED',
    mapPool: [],
    overtimeConfig: { format: 'NONE', enabled: false, maxOvertimePeriods: 0 },
    ruleUsage: ['REGULAR_SEASON'],
    sideSelection: 'HIGHER_SEED_CHOOSES',
    scoreSubmissionMethod: 'ADMIN_VERIFIED',
    substitutionsAllowed: false,
    maxSubstitutions: 0,
    emergencySubsOnly: false,
    pauseAllowedForDisconnect: true,
    replayConditions: '',
    remakeConditions: '',
    adminDecisionRequired: false,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RulesPage() {
    const {
        seasons, seasonsLoading,
        selectedSeason, setSelectedSeason,
    } = useLeagueHub();

    // Local state: rules & games loaded independently so this page works
    // even when navigated to directly (without switching seasons in sidebar).
    const [rules, setRules] = useState<SeasonRule[]>([]);
    const [games, setGames] = useState<Game[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<CreateForm>(EMPTY);
    const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

    const notify = (msg: string, type: 'ok' | 'err') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Load games once on mount
    useEffect(() => {
        catalogService.fetchGames().then(setGames).catch(() => notify('Failed to load games', 'err'));
    }, []);

    // Load rules whenever the selected season changes
    const loadRules = async (seasonId: string) => {
        setLoading(true);
        setRules([]);
        try {
            const rls = await leagueRulesService.getBySeasonId(seasonId);
            setRules(rls);
        } catch (e) { notify(apiErr(e), 'err'); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (selectedSeason) {
            loadRules(selectedSeason._id);
        } else {
            setRules([]);
        }
    }, [selectedSeason?._id]);

    // When game changes, auto-apply preset
    const handleGameChange = (gameId: string) => {
        const game = games.find(g => g._id === gameId);
        if (game) {
            const preset = GAME_PRESETS[game.title];
            if (preset) {
                setForm(f => ({
                    ...f,
                    gameId,
                    mapPool: preset.mapPool,
                    mapVetoEnabled: preset.mapVetoEnabled,
                    mapVetoFormat: preset.mapVetoFormat,
                    vetoFirstPick: preset.vetoFirstPick,
                    overtimeConfig: preset.overtimeConfig,
                }));
                return;
            }
        }
        setForm(f => ({ ...f, gameId }));
    };

    // When matchType changes, reset veto format to first valid option
    const handleMatchTypeChange = (mt: MatchType) => {
        const opts = VETO_OPTIONS[mt];
        setForm(f => ({
            ...f,
            matchType: mt,
            mapVetoFormat: opts.length ? opts[0].value : null,
        }));
    };

    const applyPreset = (title: string) => {
        const preset = GAME_PRESETS[title];
        if (!preset) return;
        setForm(f => ({
            ...f,
            mapPool: preset.mapPool,
            mapVetoEnabled: preset.mapVetoEnabled,
            mapVetoFormat: preset.mapVetoFormat,
            vetoFirstPick: preset.vetoFirstPick,
            overtimeConfig: preset.overtimeConfig,
        }));
        notify(`${title} preset applied!`, 'ok');
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSeason) { notify('Select a season first', 'err'); return; }
        setCreating(true);
        try {
            await leagueRulesService.create({
                ...form,
                seasonId: selectedSeason._id,   // ← key: tie rule to this season
                mapVetoFormat: form.mapVetoEnabled ? form.mapVetoFormat : null,
                vetoFirstPick: form.mapVetoEnabled ? form.vetoFirstPick : null,
                ruleUsage: form.ruleUsage.length ? form.ruleUsage : ['REGULAR_SEASON'],
                sideSelection: form.sideSelection,
                scoreSubmissionMethod: form.scoreSubmissionMethod,
                substitutionsAllowed: form.substitutionsAllowed,
                maxSubstitutions: form.maxSubstitutions,
                emergencySubsOnly: form.emergencySubsOnly,
                pauseAllowedForDisconnect: form.pauseAllowedForDisconnect,
                replayConditions: form.replayConditions || undefined,
                remakeConditions: form.remakeConditions || undefined,
                adminDecisionRequired: form.adminDecisionRequired,
            });
            notify('Season rule created!', 'ok');
            setShowForm(false);
            setForm(EMPTY);
            loadRules(selectedSeason._id);
        } catch (e) { notify(apiErr(e), 'err'); }
        finally { setCreating(false); }
    };

    const del = async (id: string) => {
        if (!confirm('Delete this rule?')) return;
        try {
            await leagueRulesService.delete(id);
            notify('Rule deleted.', 'ok');
            if (selectedSeason) loadRules(selectedSeason._id);
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    const filtered = rules.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()));

    const resolveGame = (r: SeasonRule) => {
        if (typeof r.gameId === 'object' && r.gameId !== null) return r.gameId as PopulatedGame;
        const found = games.find(g => g._id === r.gameId);
        return found ? { _id: found._id, title: found.title, genre: found.genre, coverImageUrl: found.coverImageUrl, logoUrl: found.logoUrl } as PopulatedGame & { logoUrl?: string } : null;
    };

    const sel = form.gameId ? games.find(g => g._id === form.gameId) : null;
    const isLoL = sel?.title === 'League of Legends';
    const isCS2Format = form.overtimeConfig.format === 'CS2_OT';
    const setOT = (patch: Partial<OvertimeConfig>) =>
        setForm(f => ({ ...f, overtimeConfig: { ...f.overtimeConfig, ...patch } }));

    return (
        <div className="space-y-6">
            {toast && <Toast {...toast} />}

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                        <span>League Hub</span><ChevronRight size={12} /><span className="text-white font-semibold">Season Rules</span>
                    </div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <BookOpen size={24} className="text-blue-400" />Season Rules
                    </h1>
                    <p className="text-text-muted text-sm mt-1">Rules configured per season — each season owns its own ruleset.</p>
                </div>
                <button
                    onClick={() => { if (!selectedSeason) { notify('Select a season first', 'err'); return; } setShowForm(v => !v); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-black bg-green-400 hover:bg-green-300 transition-all shrink-0">
                    {showForm ? <X size={16} /> : <Plus size={16} />}
                    {showForm ? 'Cancel' : 'New Rule'}
                </button>
            </div>

            {/* ── Season selector ── */}
            <div className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-slate-900/40">
                <Calendar size={16} className="text-amber-400 shrink-0" />
                <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Season</p>
                    {seasonsLoading ? (
                        <p className="text-sm text-slate-400 flex items-center gap-2"><Loader2 size={13} className="animate-spin" /> Loading seasons…</p>
                    ) : seasons.length === 0 ? (
                        <p className="text-sm text-slate-400">No seasons found — create a season first.</p>
                    ) : (
                        <select
                            value={selectedSeason?._id ?? ''}
                            onChange={e => {
                                const s = seasons.find(s => s._id === e.target.value) ?? null;
                                setSelectedSeason(s);
                                setShowForm(false);
                                setForm(EMPTY);
                            }}
                            className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-amber-500/40 outline-none cursor-pointer transition-colors min-w-[260px]"
                        >
                            <option value="">Select a season…</option>
                            {seasons.map(s => (
                                <option key={s._id} value={s._id}>{s.name} ({s.status})</option>
                            ))}
                        </select>
                    )}
                </div>
                {selectedSeason && (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20 shrink-0">
                        {rules.length} rule{rules.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* ── No season selected placeholder ── */}
            {!selectedSeason && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Calendar size={40} className="text-text-muted mb-4 opacity-30" />
                    <p className="text-white font-black text-lg uppercase tracking-widest mb-1">No Season Selected</p>
                    <p className="text-text-muted text-sm">Select a season above to view or create its rules.</p>
                </div>
            )}

            {/* ── Create form — shown only when a season is selected ── */}
            {selectedSeason && showForm && (
                <form onSubmit={handleCreate} className="space-y-6">
                    {/* Season context tag */}
                    <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold">
                        <Calendar size={13} />
                        Creating rule for <span className="font-black">{selectedSeason.name}</span>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Left column */}
                        <div className="space-y-6">
                            <FormSection icon={<BookOpen size={16} />} title="Core settings" accent="emerald">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <label className={labelCls}>Name *</label>
                                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Valorant Standard BO3" className={inputCls} required />
                                    </div>
                                    <div className="col-span-2">
                                        <label className={labelCls}>Game *</label>
                                        <div className="relative">
                                            <select value={form.gameId} onChange={e => handleGameChange(e.target.value)} className={cn(inputCls, 'pl-9')} required>
                                                <option value="">Select game…</option>
                                                {games.map(g => <option key={g._id} value={g._id}>{g.title}</option>)}
                                            </select>
                                            {sel?.logoUrl || sel?.coverImageUrl ? (
                                                <img src={sel.logoUrl || sel.coverImageUrl} alt="" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded object-cover pointer-events-none" />
                                            ) : (
                                                <Gamepad2 size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                            )}
                                        </div>
                                        {sel && MAP_PRESETS[sel.title] && <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1"><Zap size={9} /> Preset applied</p>}
                                    </div>
                                    <div>
                                        <label className={labelCls}>Format</label>
                                        <select value={form.formatType} onChange={e => setForm(f => ({ ...f, formatType: e.target.value as FormatType }))} className={inputCls}>
                                            {['LEAGUE', 'GROUPS', 'SWISS', 'KNOCKOUT'].map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Match type</label>
                                        <select value={form.matchType} onChange={e => handleMatchTypeChange(e.target.value as MatchType)} className={inputCls}>
                                            {['BO1', 'BO3', 'BO5'].map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Tiebreaker</label>
                                        <select value={form.tiebreaker} onChange={e => setForm(f => ({ ...f, tiebreaker: e.target.value as Tiebreaker }))} className={inputCls}>
                                            {['GAME_DIFF', 'POINTS', 'HEAD_TO_HEAD'].map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Points (win / loss)</label>
                                        <div className="flex gap-2">
                                            <input type="number" value={form.pointsWin} onChange={e => setForm(f => ({ ...f, pointsWin: +e.target.value }))} min={0} className={inputCls} />
                                            <input type="number" value={form.pointsLoss} onChange={e => setForm(f => ({ ...f, pointsLoss: +e.target.value }))} min={0} className={inputCls} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Max teams</label>
                                        <input type="number" value={form.maxTeams} onChange={e => setForm(f => ({ ...f, maxTeams: +e.target.value }))} min={2} className={inputCls} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Max forfeits</label>
                                        <input type="number" value={form.maxForfeitsBeforeDisqualification} onChange={e => setForm(f => ({ ...f, maxForfeitsBeforeDisqualification: +e.target.value }))} min={1} className={inputCls} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                                            <button type="button" onClick={() => setForm(f => ({ ...f, forfeitCountsAsLoss: !f.forfeitCountsAsLoss }))} className="focus:outline-none">
                                                {form.forfeitCountsAsLoss ? <ToggleRight size={20} className="text-emerald-400" /> : <ToggleLeft size={20} className="text-slate-500" />}
                                            </button>
                                            Forfeit counts as loss
                                        </label>
                                    </div>
                                </div>
                            </FormSection>

                            <FormSection icon={<ChevronRight size={16} />} title="Phase & side" accent="slate">
                                <div>
                                    <label className={labelCls}>Applies to phases</label>
                                    <div className="flex flex-wrap gap-2">
                                        {RULE_USAGE_OPTIONS.map(o => {
                                            const checked = form.ruleUsage.includes(o.value);
                                            return (
                                                <label key={o.value} className={cn('px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors', checked ? 'bg-slate-500/20 border-slate-400/40 text-white' : 'border-white/10 text-slate-400 hover:border-white/20')}>
                                                    <input type="checkbox" checked={checked} onChange={() => setForm(f => ({ ...f, ruleUsage: checked ? f.ruleUsage.filter(u => u !== o.value) : [...f.ruleUsage, o.value] }))} className="sr-only" />
                                                    {o.label}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Side selection</label>
                                    <select value={form.sideSelection} onChange={e => setForm(f => ({ ...f, sideSelection: e.target.value as SideSelection }))} className={inputCls}>
                                        {SIDE_SELECTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                            </FormSection>

                            <FormSection icon={<CheckSquare size={16} />} title="Match reporting" accent="indigo">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <label className={labelCls}>Score submission</label>
                                        <select value={form.scoreSubmissionMethod} onChange={e => setForm(f => ({ ...f, scoreSubmissionMethod: e.target.value as ScoreSubmissionMethod }))} className={inputCls}>
                                            {SCORE_SUBMISSION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 col-span-2">
                                        <button type="button" onClick={() => setForm(f => ({ ...f, adminDecisionRequired: !f.adminDecisionRequired }))} className="focus:outline-none">
                                            {form.adminDecisionRequired ? <ToggleRight size={20} className="text-amber-400" /> : <ToggleLeft size={20} className="text-slate-500" />}
                                        </button>
                                        Admin decision required
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                                        <button type="button" onClick={() => setForm(f => ({ ...f, substitutionsAllowed: !f.substitutionsAllowed }))} className="focus:outline-none">
                                            {form.substitutionsAllowed ? <ToggleRight size={20} className="text-emerald-400" /> : <ToggleLeft size={20} className="text-slate-500" />}
                                        </button>
                                        Substitutions allowed
                                    </label>
                                    {form.substitutionsAllowed && (
                                        <>
                                            <div>
                                                <label className={labelCls}>Max substitutions</label>
                                                <input type="number" min={0} value={form.maxSubstitutions} onChange={e => setForm(f => ({ ...f, maxSubstitutions: +e.target.value }))} className={inputCls} />
                                            </div>
                                            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 col-span-2">
                                                <button type="button" onClick={() => setForm(f => ({ ...f, emergencySubsOnly: !f.emergencySubsOnly }))} className="focus:outline-none">
                                                    {form.emergencySubsOnly ? <ToggleRight size={20} className="text-amber-400" /> : <ToggleLeft size={20} className="text-slate-500" />}
                                                </button>
                                                Emergency subs only
                                            </label>
                                        </>
                                    )}
                                    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 col-span-2">
                                        <button type="button" onClick={() => setForm(f => ({ ...f, pauseAllowedForDisconnect: !f.pauseAllowedForDisconnect }))} className="focus:outline-none">
                                            {form.pauseAllowedForDisconnect ? <ToggleRight size={20} className="text-emerald-400" /> : <ToggleLeft size={20} className="text-slate-500" />}
                                        </button>
                                        Pause allowed for disconnect
                                    </label>
                                    <div className="col-span-2">
                                        <label className={labelCls}>Replay conditions (optional)</label>
                                        <input value={form.replayConditions} onChange={e => setForm(f => ({ ...f, replayConditions: e.target.value }))} placeholder="When a replay is allowed…" className={inputCls} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className={labelCls}>Remake conditions (optional)</label>
                                        <input value={form.remakeConditions} onChange={e => setForm(f => ({ ...f, remakeConditions: e.target.value }))} placeholder="When a remake is allowed…" className={inputCls} />
                                    </div>
                                </div>
                            </FormSection>
                        </div>

                        {/* Right column */}
                        <div className="space-y-6">
                            <FormSection icon={<Map size={16} />} title="Map system" accent="blue">
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {['Valorant', 'CS2', 'League of Legends'].map(name => (
                                        <button key={name} type="button" onClick={() => applyPreset(name)}
                                            className="text-xs font-medium px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/20 transition-colors">
                                            {name === 'League of Legends' ? 'LoL' : name}
                                        </button>
                                    ))}
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 mb-3">
                                    <button type="button" onClick={() => setForm(f => ({ ...f, mapVetoEnabled: !f.mapVetoEnabled }))} className="focus:outline-none">
                                        {form.mapVetoEnabled ? <ToggleRight size={20} className="text-emerald-400" /> : <ToggleLeft size={20} className="text-slate-500" />}
                                    </button>
                                    Map veto enabled
                                </label>
                                {form.mapVetoEnabled && (
                                    <div className="space-y-3">
                                        <div>
                                            <label className={labelCls}>Veto format ({form.matchType})</label>
                                            <select value={form.mapVetoFormat ?? ''} onChange={e => setForm(f => ({ ...f, mapVetoFormat: e.target.value as MapVetoFormat }))} className={inputCls}>
                                                {VETO_OPTIONS[form.matchType].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                            </select>
                                            {form.mapVetoFormat && <VetoVisualizer fmt={form.mapVetoFormat} />}
                                        </div>
                                        <div>
                                            <label className={labelCls}>First pick</label>
                                            <select value={form.vetoFirstPick ?? ''} onChange={e => setForm(f => ({ ...f, vetoFirstPick: e.target.value as VetoFirstPick }))} className={inputCls}>
                                                <option value="HIGHER_SEED">Higher seed</option>
                                                <option value="LOWER_SEED">Lower seed</option>
                                                <option value="COIN_FLIP">Coin flip</option>
                                                <option value="ADMIN">Admin</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className={labelCls}>Map pool ({form.mapPool.length})</label>
                                    <MapPoolInput maps={form.mapPool} onChange={maps => setForm(f => ({ ...f, mapPool: maps }))} />
                                </div>
                            </FormSection>

                            {!isLoL && (
                                <FormSection icon={<Zap size={16} />} title="Overtime" accent="amber">
                                    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 mb-3">
                                        <button type="button" onClick={() => setOT({ enabled: !form.overtimeConfig.enabled, format: form.overtimeConfig.enabled ? 'NONE' : (sel?.title === 'Valorant' ? 'VALORANT_OT' : 'CS2_OT') })} className="focus:outline-none">
                                            {form.overtimeConfig.enabled ? <ToggleRight size={20} className="text-emerald-400" /> : <ToggleLeft size={20} className="text-slate-500" />}
                                        </button>
                                        Overtime enabled
                                    </label>
                                    {form.overtimeConfig.enabled ? (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className={labelCls}>Format</label>
                                                <select value={form.overtimeConfig.format} onChange={e => setOT({ format: e.target.value as OvertimeFormat })} className={inputCls}>
                                                    <option value="VALORANT_OT">Valorant OT</option>
                                                    <option value="CS2_OT">CS2 OT</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Max OT periods (0 = ∞)</label>
                                                <input type="number" min={0} value={form.overtimeConfig.maxOvertimePeriods ?? 0} onChange={e => setOT({ maxOvertimePeriods: +e.target.value })} className={inputCls} />
                                            </div>
                                            {isCS2Format && (
                                                <>
                                                    <div>
                                                        <label className={labelCls}>Rounds per period</label>
                                                        <input type="number" min={2} value={form.overtimeConfig.maxRoundsPerPeriod ?? 6} onChange={e => setOT({ maxRoundsPerPeriod: +e.target.value })} className={inputCls} />
                                                    </div>
                                                    <div>
                                                        <label className={labelCls}>Start money</label>
                                                        <input type="number" min={0} step={500} value={form.overtimeConfig.startMoney ?? 10500} onChange={e => setOT({ startMoney: +e.target.value })} className={inputCls} />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ) : sel && !['Valorant', 'League of Legends'].includes(sel.title) && (
                                        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                                            <button type="button" onClick={() => setOT({ allowDrawIfDisabled: !form.overtimeConfig.allowDrawIfDisabled })} className="focus:outline-none">
                                                {form.overtimeConfig.allowDrawIfDisabled ? <ToggleRight size={20} className="text-amber-400" /> : <ToggleLeft size={20} className="text-slate-500" />}
                                            </button>
                                            Allow draw on tie
                                        </label>
                                    )}
                                </FormSection>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={creating}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-black bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 transition-colors">
                            {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            Create rule
                        </button>
                    </div>
                </form>
            )}

            {/* ── Rule list (only when season is selected) ── */}
            {selectedSeason && (
                <>
                    {/* Search + refresh */}
                    <div className="flex gap-3">
                        <div className="relative flex-1 max-w-xs">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rules…"
                                className="w-full pl-9 pr-3 py-2 bg-surface border border-white/10 rounded-xl text-sm text-white placeholder-text-muted focus:border-green-500/50 outline-none" />
                        </div>
                        <button onClick={() => loadRules(selectedSeason._id)} className="p-2 rounded-xl border border-white/10 hover:bg-white/5 text-text-muted hover:text-white transition-all">
                            <RefreshCw size={16} />
                        </button>
                    </div>

                    {/* Rule cards */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 size={32} className="animate-spin text-green-400" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <BookOpen size={40} className="text-text-muted mb-4 opacity-50" />
                            <p className="text-text-muted font-semibold">No rules for this season</p>
                            <p className="text-text-muted text-sm mt-1">Create the first rule for <span className="text-white font-semibold">{selectedSeason.name}</span></p>
                        </div>
                    ) : (
                        <div className="flex gap-6 overflow-x-auto pb-6 snap-x -mx-6 px-6 flex-nowrap">
                            {filtered.map(r => {
                                const game = resolveGame(r) as (PopulatedGame & { logoUrl?: string; coverImageUrl?: string }) | null;
                                const cover = game?.coverImageUrl;
                                const logo = (game as Game & PopulatedGame | null)?.logoUrl ?? game?.coverImageUrl;

                                return (
                                    <div key={r._id} className="relative bg-[#0f0f10] border border-white/[0.06] rounded-3xl overflow-hidden hover:border-primary/30 transition-all duration-300 group shadow-lg hover:shadow-primary/10 shrink-0 w-[420px] snap-start">
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                        {/* Dynamic top bar color based on format type or just primary */}
                                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/60 via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                        {/* Header */}
                                        <div className="relative z-10 p-6 pb-4 border-b border-white/[0.06]">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="relative w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.06] p-2 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                        {/* Fallback Icon always underneath */}
                                                        <Gamepad2 size={24} className="text-white/20 absolute z-0" />

                                                        {/* Image layer */}
                                                        {(logo || cover) && (
                                                            <img
                                                                src={
                                                                    (logo || cover)?.startsWith('/') && !(logo || cover)?.startsWith('http')
                                                                        ? `http://localhost:3000${logo || cover}`
                                                                        : (logo || cover)
                                                                }
                                                                alt={game?.title}
                                                                className="w-full h-full object-contain relative z-10"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="text-white font-black text-lg tracking-tight mb-1 truncate">{r.name}</h3>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary truncate">{game?.title ?? 'Unknown Game'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 flex-shrink-0">
                                                    <button onClick={() => del(r._id)} className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-transparent hover:border-red-500/20 text-red-500/60 hover:text-red-400 transition-colors" title="Delete Rule">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Body */}
                                        <div className="relative z-10 p-6 space-y-5">
                                            {/* Badges */}
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border', FORMAT_COLORS[r.formatType] || FORMAT_COLORS.LEAGUE)}>
                                                    {r.formatType}
                                                </span>
                                                <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border', MATCH_COLORS[r.matchType] || MATCH_COLORS.BO3)}>
                                                    {r.matchType}
                                                </span>

                                                <div className="flex items-center gap-1.5 ml-1 px-2 py-0.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                                                    <span className="text-emerald-400 text-[10px] font-black">{r.pointsWin}W</span>
                                                    <span className="text-white/20 text-[10px]">:</span>
                                                    <span className="text-red-400/80 text-[10px] font-black">{r.pointsLoss}L</span>
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">
                                                    TIE: {r.tiebreaker.replace(/_/g, ' ')}
                                                </span>
                                            </div>

                                            {/* Rule Usage & Side Selection */}
                                            {((r.ruleUsage && r.ruleUsage.length > 0) || r.sideSelection) && (
                                                <div className="space-y-1.5">
                                                    {r.ruleUsage && r.ruleUsage.length > 0 && (
                                                        <p className="text-xs text-white/60 font-medium">
                                                            <span className="text-white/40 uppercase text-[9px] font-black tracking-widest mr-2">Phases</span>
                                                            {r.ruleUsage.map(u => RULE_USAGE_OPTIONS.find(o => o.value === u)?.label ?? u).join(', ')}
                                                        </p>
                                                    )}
                                                    {r.sideSelection && (
                                                        <p className="text-xs text-white/60 font-medium">
                                                            <span className="text-white/40 uppercase text-[9px] font-black tracking-widest mr-2">Side</span>
                                                            {SIDE_SELECTION_OPTIONS.find(o => o.value === r.sideSelection)?.label ?? r.sideSelection}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Map Info */}
                                            {(r.mapPool?.length || r.mapVetoEnabled) && (
                                                <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-3">
                                                    {r.mapPool && r.mapPool.length > 0 && (
                                                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-400">
                                                            <Map size={12} />
                                                            <span>{r.mapPool.length} Maps in pool</span>
                                                        </div>
                                                    )}
                                                    {r.mapVetoEnabled && r.mapVetoFormat && (
                                                        <div className="pt-1">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-white/40 block mb-2">Map Veto Format</span>
                                                            <VetoVisualizer fmt={r.mapVetoFormat} />
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Overtime Info */}
                                            {r.overtimeConfig && (
                                                <div className="flex items-center gap-2 rounded-xl bg-amber-500/5 border border-amber-500/10 px-4 py-3">
                                                    <Zap size={14} className="text-amber-500/70" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/90">
                                                        {r.overtimeConfig.enabled
                                                            ? `OT: ${r.overtimeConfig.format.replace(/_/g, ' ')} ${r.overtimeConfig.format === 'CS2_OT' ? `· ${r.overtimeConfig.maxRoundsPerPeriod ?? 6}R / $${(r.overtimeConfig.startMoney ?? 10500).toLocaleString()}` : ''}`
                                                            : r.overtimeConfig.allowDrawIfDisabled ? 'Draws Allowed' : 'No Overtime'}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Extra Admin Details */}
                                            {(r.scoreSubmissionMethod || r.substitutionsAllowed || r.adminDecisionRequired) && (
                                                <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-bold text-white/40 uppercase tracking-widest pt-2">
                                                    {r.scoreSubmissionMethod && (
                                                        <span className="flex items-center gap-1.5"><CheckSquare size={10} /> {SCORE_SUBMISSION_OPTIONS.find(o => o.value === r.scoreSubmissionMethod)?.label}</span>
                                                    )}
                                                    {r.substitutionsAllowed && (
                                                        <span className="flex items-center gap-1.5"><Users size={10} /> Subs: {r.maxSubstitutions ?? 0}{r.emergencySubsOnly ? ' (Emergency Only)' : ''}</span>
                                                    )}
                                                    {r.adminDecisionRequired && (
                                                        <span className="flex items-center gap-1.5"><AlertTriangle size={10} className="text-amber-500/70" /> Admin Decision Required</span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Footer Stats */}
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/30 pt-4 border-t border-white/[0.06]">
                                                <span>Limit: {r.maxTeams} Teams</span>
                                                <span>{r.maxForfeitsBeforeDisqualification ?? '—'} Forfeits / DQ</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                    }
                </>
            )}
        </div>
    );
}
