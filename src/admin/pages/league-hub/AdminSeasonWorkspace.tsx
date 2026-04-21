import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
    ArrowLeft, BookOpen, DollarSign, Users, Layers, Flag,
    PlayCircle, GitBranch, CheckCircle, Plus,
    Trash2, RefreshCw, ChevronDown, ChevronUp, Crown, Image as ImageIcon,
    AlertTriangle, TrendingUp, Edit2, Check, X, Info, Settings2, Shield,
} from 'lucide-react';
import { leagueService } from '../../../services/leagueService';
import { seasonService, type Season } from '../../../services/seasonService';
import catalogService from '../../../services/catalogService';
import type { Game } from '../../../models/game';
import {
    getSeasonRules, createSeasonRule, updateSeasonRule, deleteSeasonRule,
    getPrizePool, createPrizePool, updatePrizePool,
    getSeasonTeams, registerTeam, removeRegistration,
    getAllTeams,
    getStages, createStage, deleteStage,
    getGroups, createGroup, assignGroupTeams,
    getAdminRounds, generateRounds, updateRound, deleteRound,
    getMatchesByRound, submitResult,
    getAdminStandings, recalculateStandings,
    getAdminBracket, generateBracket,
    activateSeason, closeSeason,
    apiErr,
    type SeasonRule, type PrizePool, type SeasonTeamEntry, type Stage,
    type Group, type AdminRound, type AdminMatch, type StandingEntry, type AdminBracket, type TeamRef,
    type MapVetoFormat, type RuleUsage, type OvertimeConfig,
} from '../../../services/adminLeagueService';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt  = (d: string) => new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });

function tName(t: unknown): string {
    if (!t) return '?';
    if (typeof t === 'object' && 'name' in t) return (t as {name:string}).name;
    if (typeof t === 'string') return t.slice(-5);
    return '?';
}
function tId(t: unknown): string {
    if (!t) return '';
    if (typeof t === 'string') return t;
    if (typeof t === 'object' && '_id' in t) return (t as {_id:string})._id;
    return '';
}

const S_CLS: Record<string,string> = {
    PLANNED:'bg-blue-500/10 text-blue-400 border-blue-500/20',
    ONGOING:'bg-green-500/10 text-green-400 border-green-500/20',
    FINISHED:'bg-white/5 text-gray-400 border-white/10',
    SCHEDULED:'bg-blue-500/10 text-blue-400 border-blue-500/20',
    COMPLETED:'bg-green-500/10 text-green-400 border-green-500/20',
    FORFEIT:'bg-red-500/10 text-red-400 border-red-500/20',
    CANCELLED:'bg-white/5 text-gray-400 border-white/10',
    ACTIVE:'bg-green-500/10 text-green-400 border-green-500/20',
    READY:'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    PENDING:'bg-white/5 text-gray-400 border-white/10',
    DRAFT:'bg-white/5 text-gray-400 border-white/10',
    LIVE:'bg-green-500/10 text-green-400 border-green-500/20',
    WITHDRAWN:'bg-orange-500/10 text-orange-400 border-orange-500/20',
    DISQUALIFIED:'bg-red-500/10 text-red-400 border-red-500/20',
};

// ─── Shared Section Card (Liquipedia-style) ───────────────────────────────────
function SectionCard({ icon, title, action, children }: {
    icon: React.ReactNode; title: string;
    action?: React.ReactNode; children: React.ReactNode;
}) {
    return (
        <div className="bg-[#13161e] border border-white/8 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/[0.015]">
                <div className="flex items-center gap-2.5">
                    <span className="text-[#00ff00]/60">{icon}</span>
                    <h2 className="text-xs font-black uppercase tracking-widest text-white">{title}</h2>
                </div>
                {action && <div className="flex items-center gap-2">{action}</div>}
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function EditInlineBtn({ onClick, label = 'edit' }: { onClick: () => void; label?: string }) {
    return (
        <button onClick={onClick}
            className="text-[10px] font-mono text-[#00ff00]/60 hover:text-[#00ff00] border border-[#00ff00]/15 hover:border-[#00ff00]/40 px-2 py-0.5 rounded transition-all">
            [{label}]
        </button>
    );
}

// ─── Sidebar Cards ────────────────────────────────────────────────────────────
function TournamentInfoCard({ season, leagueName }: { season: Season; leagueName: string }) {
    return (
        <div className="bg-[#13161e] border border-white/8 rounded-2xl overflow-hidden text-sm">
            <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.015] flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-[#00ff00]/50" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#00ff00]/60">Tournament Info</span>
            </div>
            <div className="px-4 py-3 space-y-3">
                {([
                    ['Series', leagueName],
                    ['Season', season.name],
                    ['Start Date', fmt(season.startDate)],
                    ['End Date', fmt(season.endDate)],
                    ['Status', season.status],
                ] as [string, string][]).map(([k, v]) => (
                    <div key={k} className="flex items-start justify-between gap-2">
                        <span className="text-gray-500 text-xs flex-shrink-0">{k}</span>
                        <span className={`text-xs font-bold text-right ${
                            k === 'Status'
                                ? v === 'ONGOING' ? 'text-green-400' : v === 'FINISHED' ? 'text-gray-400' : 'text-blue-400'
                                : 'text-white'
                        }`}>{v}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SeasonActionsCard({ season, onUpdate }: { season: Season; onUpdate: (s: Season) => void }) {
    const [busy, setBusy] = useState(false);
    const open  = async () => { setBusy(true); try { onUpdate(await activateSeason(season._id) as Season); toast.success('Season is now LIVE!'); } catch(e){ toast.error(apiErr(e)); } finally { setBusy(false); } };
    const close = async () => { if (!confirm('Close season?')) return; setBusy(true); try { onUpdate(await closeSeason(season._id) as Season); toast.success('Season closed'); } catch(e){ toast.error(apiErr(e)); } finally { setBusy(false); } };
    return (
        <div className="bg-[#13161e] border border-white/8 rounded-2xl overflow-hidden text-sm">
            <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.015] flex items-center gap-2">
                <Settings2 className="w-3.5 h-3.5 text-[#00ff00]/50" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#00ff00]/60">Actions</span>
            </div>
            <div className="px-4 py-3 space-y-2">
                {season.status === 'PLANNED' && (
                    <button onClick={open} disabled={busy}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-xs disabled:opacity-50 transition-all">
                        <PlayCircle className="w-3.5 h-3.5" />{busy ? '…' : 'Open Season'}
                    </button>
                )}
                {season.status === 'ONGOING' && (
                    <button onClick={close} disabled={busy}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-white/15 text-gray-400 hover:text-white hover:bg-white/5 font-bold text-xs disabled:opacity-50 transition-all">
                        <CheckCircle className="w-3.5 h-3.5" />{busy ? '…' : 'Close Season'}
                    </button>
                )}
                {season.status === 'FINISHED' && (
                    <p className="text-center text-xs text-gray-500 py-2">Season complete</p>
                )}
            </div>
        </div>
    );
}


// ─── Sub-panels ───────────────────────────────────────────────────────────────

// ─── Rules Panel (full backend schema coverage) ───────────────────────────────
const EMPTY_OT: OvertimeConfig = { format: 'NONE', enabled: false, maxRoundsPerPeriod: 6, startMoney: 10500, allowDrawIfDisabled: false, maxOvertimePeriods: 0 };

type FullRuleForm = {
    name: string; gameId: string;
    formatType: 'LEAGUE'|'SWISS'|'KNOCKOUT'; matchType: 'BO1'|'BO3'|'BO5';
    pointsWin: number; pointsLoss: number; maxTeams: number;
    tiebreaker: 'POINTS'|'GAME_DIFF'|'HEAD_TO_HEAD';
    forfeitCountsAsLoss: boolean; maxForfeitsBeforeDisqualification: number;
    mapPool: string[]; mapVetoEnabled: boolean;
    mapVetoFormat: MapVetoFormat; vetoFirstPick: 'HIGHER_SEED'|'LOWER_SEED'|'COIN_FLIP'|'ADMIN';
    ruleUsage: RuleUsage[];
    sideSelection: 'HIGHER_SEED_CHOOSES'|'KNIFE_ROUND'|'COIN_TOSS'|'VETO_WINNER_CHOOSES'|'FIXED_TEAM_A_ATTACK';
    scoreSubmissionMethod: 'ADMIN_VERIFIED'|'BOTH_TEAMS_CONFIRM'|'AUTO_FROM_API';
    substitutionsAllowed: boolean; maxSubstitutions: number; emergencySubsOnly: boolean;
    pauseAllowedForDisconnect: boolean; replayConditions: string; remakeConditions: string;
    adminDecisionRequired: boolean; overtimeConfig: OvertimeConfig;
};

const DEFAULT_RULE_FORM: FullRuleForm = {
    name: '', gameId: '', formatType: 'LEAGUE', matchType: 'BO3', tiebreaker: 'POINTS',
    pointsWin: 3, pointsLoss: 0, maxTeams: 16, forfeitCountsAsLoss: true, maxForfeitsBeforeDisqualification: 3,
    mapPool: [], mapVetoEnabled: true, mapVetoFormat: 'BAN_BAN_PICK_PICK_BAN_BAN_DECIDER', vetoFirstPick: 'HIGHER_SEED',
    ruleUsage: ['REGULAR_SEASON'],
    sideSelection: 'HIGHER_SEED_CHOOSES', scoreSubmissionMethod: 'ADMIN_VERIFIED',
    substitutionsAllowed: false, maxSubstitutions: 0, emergencySubsOnly: false,
    pauseAllowedForDisconnect: true, replayConditions: '', remakeConditions: '',
    adminDecisionRequired: false, overtimeConfig: { ...EMPTY_OT },
};

const ALL_RULE_USAGES: RuleUsage[] = ['REGULAR_SEASON','PLAYOFFS','GRAND_FINAL','PLAY_IN','QUALIFICATION','GROUP_STAGE'];

function RuleFormSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-white/8 rounded-xl overflow-hidden">
            <button onClick={() => setOpen(p => !p)} className="w-full flex items-center justify-between px-4 py-2.5 bg-white/[0.03] hover:bg-white/[0.05] transition-colors text-left">
                <span className="text-xs font-black uppercase tracking-wider text-gray-300">{title}</span>
                {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
            </button>
            {open && <div className="px-4 py-3 space-y-3">{children}</div>}
        </div>
    );
}

function RulesPanel({ seasonId }: { seasonId: string }) {
    const [rules, setRules]       = useState<SeasonRule[]>([]);
    const [editingId, setEditingId] = useState<string | 'new' | null>(null);
    const [form, setForm]         = useState<FullRuleForm>(DEFAULT_RULE_FORM);
    const [mapInput, setMapInput] = useState('');
    const [busy, setBusy]         = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [games, setGames]       = useState<Game[]>([]);

    const load = () => getSeasonRules(seasonId).then(setRules);
    useEffect(() => { load(); }, [seasonId]);

    useEffect(() => {
        catalogService.fetchGames()
            .then(list => setGames([...list].sort((a, b) => a.title.localeCompare(b.title))))
            .catch(() => toast.error('Could not load games — check Games Catalog or API'));
    }, []);

    const startEdit = (r: SeasonRule) => {
        setForm({
            name: r.name, gameId: r.gameId, formatType: r.formatType, matchType: r.matchType,
            pointsWin: r.pointsWin, pointsLoss: r.pointsLoss, maxTeams: r.maxTeams, tiebreaker: r.tiebreaker,
            forfeitCountsAsLoss: r.forfeitCountsAsLoss, maxForfeitsBeforeDisqualification: r.maxForfeitsBeforeDisqualification,
            mapPool: r.mapPool ?? [], mapVetoEnabled: r.mapVetoEnabled,
            mapVetoFormat: r.mapVetoFormat ?? 'BAN_BAN_PICK_PICK_BAN_BAN_DECIDER',
            vetoFirstPick: r.vetoFirstPick ?? 'HIGHER_SEED',
            ruleUsage: r.ruleUsage ?? ['REGULAR_SEASON'],
            sideSelection: r.sideSelection ?? 'HIGHER_SEED_CHOOSES',
            scoreSubmissionMethod: r.scoreSubmissionMethod ?? 'ADMIN_VERIFIED',
            substitutionsAllowed: r.substitutionsAllowed ?? false,
            maxSubstitutions: r.maxSubstitutions ?? 0,
            emergencySubsOnly: r.emergencySubsOnly ?? false,
            pauseAllowedForDisconnect: r.pauseAllowedForDisconnect ?? true,
            replayConditions: r.replayConditions ?? '', remakeConditions: r.remakeConditions ?? '',
            adminDecisionRequired: r.adminDecisionRequired ?? false,
            overtimeConfig: r.overtimeConfig ?? { ...EMPTY_OT },
        });
        setEditingId(r._id);
    };

    const startNew = () => { setForm(DEFAULT_RULE_FORM); setEditingId('new'); };
    const cancelEdit = () => { setEditingId(null); setForm(DEFAULT_RULE_FORM); };

    const del = async (id: string) => {
        if (!confirm('Delete this rule?')) return;
        setDeleting(id);
        try { await deleteSeasonRule(id); await load(); toast.success('Rule deleted'); }
        catch (e) { toast.error(apiErr(e)); }
        finally { setDeleting(null); }
    };

    const save = async () => {
        if (!form.name || !form.gameId) { toast.error('Ruleset name and game are required'); return; }
        setBusy(true);
        try {
            if (editingId === 'new') {
                await createSeasonRule({ ...form, seasonId });
                toast.success('Rule created!');
            } else if (editingId) {
                await updateSeasonRule(editingId, { ...form, seasonId });
                toast.success('Rule updated!');
            }
            await load();
            cancelEdit();
        } catch (e) { toast.error(apiErr(e)); }
        finally { setBusy(false); }
    };

    const f = form;
    const sf = (k: keyof FullRuleForm) => (val: unknown) => setForm(p => ({ ...p, [k]: val }));
    const sel = (k: keyof FullRuleForm, opts: string[], w = 'w-full') => (
        <select value={f[k] as string} onChange={e => sf(k)(e.target.value)}
            className={`${w} bg-[#0d0f14] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00ff00]/40`}>
            {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
    );
    const num = (k: keyof FullRuleForm, w = 'w-20') => (
        <input type="number" min="0" value={f[k] as number} onChange={e => sf(k)(+e.target.value)}
            className={`${w} bg-[#0d0f14] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-[#00ff00]/40`} />
    );
    const chk = (k: keyof FullRuleForm, label: string) => (
        <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
            <input type="checkbox" checked={f[k] as boolean} onChange={e => sf(k)(e.target.checked)} className="rounded" />
            {label}
        </label>
    );
    const txt = (k: keyof FullRuleForm, placeholder: string) => (
        <input value={f[k] as string} onChange={e => sf(k)(e.target.value)} placeholder={placeholder}
            className="w-full bg-[#0d0f14] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00ff00]/40" />
    );

    const addMap = () => {
        const m = mapInput.trim();
        if (m && !form.mapPool.includes(m)) { setForm(p => ({ ...p, mapPool: [...p.mapPool, m] })); setMapInput(''); }
    };

    const toggleUsage = (u: RuleUsage) => setForm(p => ({
        ...p, ruleUsage: p.ruleUsage.includes(u) ? p.ruleUsage.filter(x => x !== u) : [...p.ruleUsage, u]
    }));

    if (editingId !== null) return (
        <div className="space-y-3 max-w-2xl">
            {/* ── CORE ── */}
            <RuleFormSection title="Core">
                <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] text-gray-500 mb-1 block">Ruleset Name *</label>
                        <input value={f.name} onChange={e => sf('name')(e.target.value)} placeholder="e.g. Standard BO3"
                            className="w-full bg-[#0d0f14] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00ff00]/40" />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 mb-1 block">Game *</label>
                        <select
                            value={f.gameId}
                            onChange={e => sf('gameId')(e.target.value)}
                            className="w-full bg-[#0d0f14] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00ff00]/40"
                        >
                            <option value="">— Select game —</option>
                            {f.gameId && !games.some(g => g._id === f.gameId) && (
                                <option value={f.gameId}>Saved game (not in catalog)</option>
                            )}
                            {games.map(g => (
                                <option key={g._id} value={g._id}>
                                    {g.title}{g.genre ? ` · ${g.genre}` : ''}
                                </option>
                            ))}
                        </select>
                        {games.length === 0 && (
                            <p className="mt-1 text-[9px] text-amber-500/90">
                                No games loaded — add titles under Admin → Games Catalog.
                            </p>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <div><label className="text-[10px] text-gray-500 mb-1 block">Format</label>{sel('formatType',['LEAGUE','SWISS','KNOCKOUT'])}</div>
                    <div><label className="text-[10px] text-gray-500 mb-1 block">Match Type</label>{sel('matchType',['BO1','BO3','BO5'])}</div>
                    <div><label className="text-[10px] text-gray-500 mb-1 block">Tiebreaker</label>{sel('tiebreaker',['POINTS','GAME_DIFF','HEAD_TO_HEAD'])}</div>
                </div>
            </RuleFormSection>

            {/* ── SCORING & FORFEIT ── */}
            <RuleFormSection title="Scoring &amp; Forfeit">
                <div className="grid grid-cols-4 gap-3">
                    <div><label className="text-[10px] text-gray-500 mb-1 block">Win Pts</label>{num('pointsWin')}</div>
                    <div><label className="text-[10px] text-gray-500 mb-1 block">Loss Pts</label>{num('pointsLoss')}</div>
                    <div><label className="text-[10px] text-gray-500 mb-1 block">Max Teams</label>{num('maxTeams')}</div>
                    <div><label className="text-[10px] text-gray-500 mb-1 block">Max Forfeits</label>{num('maxForfeitsBeforeDisqualification','w-full')}</div>
                </div>
                {chk('forfeitCountsAsLoss','Forfeit counts as a loss in standings')}
            </RuleFormSection>

            {/* ── MAP SYSTEM ── */}
            <RuleFormSection title="Map System" defaultOpen={false}>
                {chk('mapVetoEnabled','Map veto enabled')}
                {f.mapVetoEnabled && (
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-[10px] text-gray-500 mb-1 block">Veto Format</label>
                            {sel('mapVetoFormat',['ADMIN_PICK','RANDOM','BAN_BAN_DECIDER','BAN_BAN_PICK_PICK_BAN_BAN_DECIDER','PICK_PICK_DECIDER','BAN_BAN_PICK_PICK_PICK_PICK_DECIDER'])}
                        </div>
                        <div><label className="text-[10px] text-gray-500 mb-1 block">First Pick</label>
                            {sel('vetoFirstPick',['HIGHER_SEED','LOWER_SEED','COIN_FLIP','ADMIN'])}
                        </div>
                    </div>
                )}
                <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Map Pool</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {f.mapPool.map(m => (
                            <span key={m} className="flex items-center gap-1 text-[10px] bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white">
                                {m}<button onClick={() => setForm(p => ({ ...p, mapPool: p.mapPool.filter(x => x !== m) }))}><X className="w-3 h-3 text-gray-500 hover:text-red-400" /></button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input value={mapInput} onChange={e => setMapInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addMap()} placeholder="Map name (Enter to add)"
                            className="flex-1 bg-[#0d0f14] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00ff00]/40" />
                        <button onClick={addMap} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </RuleFormSection>

            {/* ── MATCH RULES ── */}
            <RuleFormSection title="Match Rules" defaultOpen={false}>
                <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] text-gray-500 mb-1 block">Side Selection</label>
                        {sel('sideSelection',['HIGHER_SEED_CHOOSES','KNIFE_ROUND','COIN_TOSS','VETO_WINNER_CHOOSES','FIXED_TEAM_A_ATTACK'])}
                    </div>
                    <div><label className="text-[10px] text-gray-500 mb-1 block">Score Submission</label>
                        {sel('scoreSubmissionMethod',['ADMIN_VERIFIED','BOTH_TEAMS_CONFIRM','AUTO_FROM_API'])}
                    </div>
                </div>
                <div>
                    <label className="text-[10px] text-gray-500 mb-2 block">Rule Usage (applies to which phase)</label>
                    <div className="flex flex-wrap gap-2">
                        {ALL_RULE_USAGES.map(u => (
                            <label key={u} className="flex items-center gap-1.5 text-[10px] text-gray-300 cursor-pointer">
                                <input type="checkbox" checked={f.ruleUsage.includes(u)} onChange={() => toggleUsage(u)} className="rounded" />
                                {u.replace('_',' ')}
                            </label>
                        ))}
                    </div>
                </div>
            </RuleFormSection>

            {/* ── SUBSTITUTIONS ── */}
            <RuleFormSection title="Substitutions" defaultOpen={false}>
                {chk('substitutionsAllowed','Allow substitutions during match')}
                {f.substitutionsAllowed && (
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-[10px] text-gray-500 mb-1 block">Max Substitutions</label>{num('maxSubstitutions','w-full')}</div>
                        <div className="flex items-end">{chk('emergencySubsOnly','Emergency subs only')}</div>
                    </div>
                )}
            </RuleFormSection>

            {/* ── OVERTIME ── */}
            <RuleFormSection title="Overtime" defaultOpen={false}>
                <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] text-gray-500 mb-1 block">OT Format</label>
                        <select value={f.overtimeConfig.format}
                            onChange={e => setForm(p => ({ ...p, overtimeConfig: { ...p.overtimeConfig, format: e.target.value as OvertimeConfig['format'] } }))}
                            className="w-full bg-[#0d0f14] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none">
                            {['NONE','VALORANT_OT','CS2_OT'].map(o => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                            <input type="checkbox" checked={f.overtimeConfig.enabled}
                                onChange={e => setForm(p => ({ ...p, overtimeConfig: { ...p.overtimeConfig, enabled: e.target.checked } }))} className="rounded" />
                            OT Enabled
                        </label>
                    </div>
                </div>
                {f.overtimeConfig.format !== 'NONE' && (
                    <div className="grid grid-cols-3 gap-3">
                        <div><label className="text-[10px] text-gray-500 mb-1 block">Rounds/Period</label>
                            <input type="number" value={f.overtimeConfig.maxRoundsPerPeriod}
                                onChange={e => setForm(p => ({ ...p, overtimeConfig: { ...p.overtimeConfig, maxRoundsPerPeriod: +e.target.value } }))}
                                className="w-full bg-[#0d0f14] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none" />
                        </div>
                        <div><label className="text-[10px] text-gray-500 mb-1 block">Start Money</label>
                            <input type="number" value={f.overtimeConfig.startMoney}
                                onChange={e => setForm(p => ({ ...p, overtimeConfig: { ...p.overtimeConfig, startMoney: +e.target.value } }))}
                                className="w-full bg-[#0d0f14] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none" />
                        </div>
                        <div><label className="text-[10px] text-gray-500 mb-1 block">Max OT Periods</label>
                            <input type="number" value={f.overtimeConfig.maxOvertimePeriods}
                                onChange={e => setForm(p => ({ ...p, overtimeConfig: { ...p.overtimeConfig, maxOvertimePeriods: +e.target.value } }))}
                                className="w-full bg-[#0d0f14] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none" />
                        </div>
                    </div>
                )}
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                    <input type="checkbox" checked={f.overtimeConfig.allowDrawIfDisabled}
                        onChange={e => setForm(p => ({ ...p, overtimeConfig: { ...p.overtimeConfig, allowDrawIfDisabled: e.target.checked } }))} className="rounded" />
                    Allow draw if OT disabled
                </label>
            </RuleFormSection>

            {/* ── OTHER ── */}
            <RuleFormSection title="Other Rules" defaultOpen={false}>
                {chk('pauseAllowedForDisconnect','Allow pause for disconnect')}
                {chk('adminDecisionRequired','Admin decision required for disputed outcomes')}
                <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] text-gray-500 mb-1 block">Replay Conditions</label>{txt('replayConditions','When a replay is warranted…')}</div>
                    <div><label className="text-[10px] text-gray-500 mb-1 block">Remake Conditions</label>{txt('remakeConditions','When a remake is warranted…')}</div>
                </div>
            </RuleFormSection>

            <div className="flex gap-3 pt-1">
                <button onClick={cancelEdit} className="px-4 py-2 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                <button onClick={save} disabled={busy} className="px-6 py-2 rounded-xl bg-[#00ff00] text-black font-bold text-sm hover:bg-[#00ff00]/90 disabled:opacity-50 transition-all">
                    {busy ? 'Saving…' : editingId === 'new' ? 'Create Rule' : 'Save Changes'}
                </button>
            </div>
        </div>
    );

    // ── List view ──────────────────────────────────────────────────────────────
    return (
        <div className="space-y-3">
            {rules.length === 0 ? (
                <div className="text-center py-10">
                    <BookOpen className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm mb-4">No ruleset configured yet</p>
                    <button onClick={startNew} className="px-5 py-2 rounded-xl bg-[#00ff00] text-black font-bold text-sm hover:bg-[#00ff00]/90 transition-all">
                        <Plus className="inline w-3.5 h-3.5 mr-1" /> Configure Rules
                    </button>
                </div>
            ) : (
                <>
                    {rules.map(r => (
                        <div key={r._id} className="border border-white/8 rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border-b border-white/5">
                                <div>
                                    <h3 className="font-bold text-white text-sm">{r.name}</h3>
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                        <span className="text-gray-300">
                                            {games.find(g => g._id === r.gameId)?.title ?? (r.gameId ? 'Game (not in catalog)' : '—')}
                                        </span>
                                        {' · '}{r.formatType} · {r.matchType} · Tiebreaker: {r.tiebreaker}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <EditInlineBtn onClick={() => startEdit(r)} />
                                    <button onClick={() => del(r._id)} disabled={deleting === r._id}
                                        className="text-[10px] font-mono text-red-400/60 hover:text-red-400 border border-red-500/15 hover:border-red-500/40 px-2 py-0.5 rounded transition-all disabled:opacity-40">
                                        {deleting === r._id ? '[…]' : '[delete]'}
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {([
                                        ['Match Type', r.matchType],
                                        ['Max Teams', String(r.maxTeams)],
                                        ['Win / Loss Pts', `${r.pointsWin} / ${r.pointsLoss}`],
                                        ['Forfeit = Loss', r.forfeitCountsAsLoss ? 'Yes' : 'No'],
                                        ['Max Forfeits', String(r.maxForfeitsBeforeDisqualification)],
                                        ['Side Selection', r.sideSelection?.replace(/_/g,' ') ?? '—'],
                                        ['Score Submission', r.scoreSubmissionMethod?.replace(/_/g,' ') ?? '—'],
                                        ['Rule Usage', (Array.isArray(r.ruleUsage) ? r.ruleUsage : []).map((u: string) => u.replace(/_/g,' ')).join(', ') || '—'],
                                    ] as [string, string][]).map(([k, v]) => (
                                        <div key={k} className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                                            <p className="text-[10px] text-gray-500 mb-1">{k}</p>
                                            <p className="text-xs text-white font-medium">{v}</p>
                                        </div>
                                    ))}
                                </div>
                                {Array.isArray(r.mapPool) && r.mapPool.length > 0 && (
                                    <div>
                                        <p className="text-[10px] text-gray-500 mb-1.5 uppercase tracking-wider">Map Pool</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {r.mapPool.map((m: string) => <span key={m} className="text-[10px] bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white">{m}</span>)}
                                        </div>
                                    </div>
                                )}
                                {r.overtimeConfig && r.overtimeConfig.format !== 'NONE' && (
                                    <p className="text-xs text-gray-400">{r.overtimeConfig.format} · {r.overtimeConfig.enabled ? 'Enabled' : 'Disabled'} · {r.overtimeConfig.maxRoundsPerPeriod} rounds/period</p>
                                )}
                            </div>
                        </div>
                    ))}
                    <button onClick={startNew}
                        className="w-full py-2.5 rounded-xl border border-dashed border-white/10 hover:border-[#00ff00]/30 text-xs text-gray-500 hover:text-[#00ff00]/70 transition-all flex items-center justify-center gap-2">
                        <Plus className="w-3.5 h-3.5" /> Add Another Rule
                    </button>
                </>
            )}
        </div>
    );
}

type PrizeForm = { totalAmount: number; currency: 'USD'|'EUR'|'TND'|'GBP'; source: 'PLATFORM'|'SPONSORED'|'MIXED'; notes: string; distribution: { rank: number; amount: number; percentage: number }[] };

function PrizePanel({ seasonId, leagueId }: { seasonId: string; leagueId: string }) {
    const [pool, setPool]       = useState<PrizePool | null>(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm]       = useState<PrizeForm>({ totalAmount: 0, currency: 'USD', source: 'PLATFORM', notes: '', distribution: [{ rank: 1, amount: 0, percentage: 0 }] });
    const [busy, setBusy]       = useState(false);

    useEffect(() => {
        getPrizePool(seasonId).then(p => { if (p) { setPool(p); setForm({ totalAmount: p.totalAmount, currency: p.currency, source: p.source, notes: p.notes || '', distribution: p.distribution.map(d => ({ rank: d.rank, amount: d.amount, percentage: d.percentage })) }); } });
    }, [seasonId]);

    const autoPercent = (dist: PrizeForm['distribution'], total: number) =>
        dist.map(d => ({ ...d, percentage: total > 0 ? Math.round(d.amount / total * 100) : 0 }));

    const save = async () => {
        setBusy(true);
        try {
            const dist = autoPercent(form.distribution, +form.totalAmount);
            const dto = { seasonId, leagueId, totalAmount: +form.totalAmount, currency: form.currency, source: form.source, notes: form.notes, distribution: dist };
            const p = pool ? await updatePrizePool(pool._id, dto) : await createPrizePool(dto);
            setPool(p); setEditing(false); toast.success('Prize pool saved');
        } catch (e) { toast.error(apiErr(e)); }
        finally { setBusy(false); }
    };

    const addRow = () => setForm(p => ({ ...p, distribution: [...p.distribution, { rank: p.distribution.length + 1, amount: 0, percentage: 0 }] }));
    const removeRow = (i: number) => setForm(p => ({ ...p, distribution: p.distribution.filter((_, j) => j !== i) }));

    if (!pool && !editing) return (
        <div className="text-center py-8">
            <DollarSign className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-4">No prize pool yet</p>
            <button onClick={() => setEditing(true)} className="px-5 py-2 rounded-xl bg-[#00ff00] text-black font-bold text-sm hover:bg-[#00ff00]/90">
                <Plus className="inline w-3.5 h-3.5 mr-1" /> Set Prize Pool
            </button>
        </div>
    );

    if (editing || !pool) return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                    <label className="text-xs text-gray-400 mb-1 block">Total Amount</label>
                    <input type="number" value={form.totalAmount} onChange={e => setForm(p=>({...p,totalAmount:+e.target.value}))} className="w-full bg-[#1a1e28] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff00]/40" />
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Currency</label>
                    <select value={form.currency} onChange={e => setForm(p=>({...p,currency:e.target.value as PrizeForm['currency']}))} className="w-full bg-[#1a1e28] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                        <option>USD</option><option>EUR</option><option>TND</option>
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Source</label>
                    <select value={form.source} onChange={e => setForm(p=>({...p,source:e.target.value as PrizeForm['source']}))} className="w-full bg-[#1a1e28] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                        <option value="PLATFORM">Platform</option>
                        <option value="SPONSORED">Sponsored</option>
                        <option value="MIXED">Mixed</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Notes (optional)</label>
                    <input value={form.notes} onChange={e => setForm(p=>({...p,notes:e.target.value}))} className="w-full bg-[#1a1e28] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff00]/40" />
                </div>
            </div>
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-gray-400">Distribution</label>
                    <button onClick={addRow} className="text-xs text-[#00ff00] hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add Row</button>
                </div>
                <div className="space-y-2">
                    {form.distribution.map((d, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="w-6 text-center text-xs text-gray-500 font-bold">#{d.rank}</span>
                            <input type="number" placeholder="Amount" value={d.amount} onChange={e => { const n=[...form.distribution]; n[i]={...n[i],amount:+e.target.value}; setForm(p=>({...p,distribution:n})); }} className="flex-1 bg-[#1a1e28] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none" />
                            <span className="text-xs text-gray-500 w-10 text-right">{form.totalAmount > 0 ? Math.round(+d.amount / +form.totalAmount * 100) : 0}%</span>
                            <button onClick={() => removeRow(i)} className="text-gray-600 hover:text-red-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex gap-3">
                {pool && <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>}
                <button onClick={save} disabled={busy} className="px-5 py-2 rounded-xl bg-[#00ff00] text-black font-bold text-sm hover:bg-[#00ff00]/90 disabled:opacity-50">{busy ? 'Saving…' : 'Save'}</button>
            </div>
        </div>
    );

    return (
        <div className="bg-[#1a1e28] border border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-xs text-gray-500 mb-0.5">Total Prize Pool</p>
                    <p className="text-2xl font-black text-white">{pool.currency} {pool.totalAmount.toLocaleString()}</p>
                    {pool.source && <p className="text-xs text-gray-500 mt-0.5">{pool.source}</p>}
                </div>
                <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
            </div>
            <div className="space-y-2">
                {pool.distribution.map(d => (
                    <div key={d.rank} className="flex items-center justify-between text-sm border-b border-white/5 pb-2 last:border-0">
                        <div className="flex items-center gap-2">
                            {d.rank === 1 && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
                            <span className="text-gray-400">{d.rank === 1 ? '1st' : d.rank === 2 ? '2nd' : d.rank === 3 ? '3rd' : `${d.rank}th`} Place</span>
                        </div>
                        <span className="text-white font-bold">{pool.currency} {d.amount.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function registrationClosedReason(season: Season): string | null {
    if (season.status === 'FINISHED') {
        return 'This season is finished — the API does not accept new team registrations.';
    }
    if (season.status === 'ONGOING') {
        return 'The season has already started — registrations are closed.';
    }
    const deadline = new Date(season.registrationDeadline);
    if (Number.isFinite(deadline.getTime()) && Date.now() > deadline.getTime()) {
        return `Registration deadline passed (${fmt(season.registrationDeadline)}).`;
    }
    return null;
}

function TeamsPanel({ season }: { season: Season }) {
    const seasonId = season._id;
    const [entries, setEntries]     = useState<SeasonTeamEntry[]>([]);
    const [allTeams, setAllTeams]   = useState<TeamRef[]>([]);
    const [teamsLoaded, setTeamsLoaded] = useState(false);
    const [selTeam, setSelTeam]     = useState('');
    const [manualId, setManualId]   = useState('');
    const [seed, setSeed]           = useState('');
    const [busy, setBusy]           = useState(false);

    const load = useCallback(() => {
        setTeamsLoaded(false);
        Promise.all([getSeasonTeams(seasonId), getAllTeams()]).then(([e, t]) => {
            setEntries(e);
            setAllTeams(t);
            setTeamsLoaded(true);
        });
    }, [seasonId]);

    useEffect(() => { load(); }, [load]);

    const teamIdToRegister = selTeam || manualId.trim();
    const blockReason = registrationClosedReason(season);

    const register = async () => {
        if (!teamIdToRegister || blockReason) return;
        setBusy(true);
        try {
            const seedTrim = seed.trim();
            const seedNum = seedTrim === '' ? undefined : Number(seedTrim);
            const payload: { seasonId: string; teamId: string; seed?: number } = {
                seasonId,
                teamId: teamIdToRegister,
            };
            if (Number.isFinite(seedNum) && seedNum >= 1) payload.seed = Math.floor(seedNum);

            await registerTeam(payload);
            toast.success('Team registered');
            setSelTeam(''); setManualId(''); setSeed('');
            load();
        } catch (e) { toast.error(apiErr(e)); }
        finally { setBusy(false); }
    };

    const remove = async (id: string) => {
        try { await removeRegistration(id); toast.success('Team removed'); load(); }
        catch (e) { toast.error(apiErr(e)); }
    };

    const registered = new Set(entries.map(e => tId(e.teamId)));
    const available  = allTeams.filter(t => !registered.has(t._id));
    const hasDropdown = teamsLoaded && allTeams.length > 0;
    const teamMap = new Map(allTeams.map(t => [t._id, t]));

    return (
        <div className="space-y-5">
            {/* Register form */}
            <div className="bg-[#1a1e28] border border-white/8 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Register Team</p>
                    <button onClick={load} className="text-[10px] text-gray-600 hover:text-gray-400 flex items-center gap-1 transition-colors">
                        <RefreshCw className="w-3 h-3" /> Reload
                    </button>
                </div>

                {blockReason && (
                    <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2.5 mb-3">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="text-[11px] text-amber-200/90 leading-snug">
                            <p className="font-bold text-amber-100/95 mb-0.5">Registration closed</p>
                            <p>{blockReason} Use a <strong className="text-white/90">PLANNED</strong> season before the deadline, or adjust dates/status in the backend if you need an exception.</p>
                        </div>
                    </div>
                )}

                {/* Warning if team list couldn't be fetched */}
                {teamsLoaded && allTeams.length === 0 && (
                    <div className="flex items-start gap-2 bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-3 py-2 mb-3">
                        <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-yellow-300/80">
                            No teams found from <code className="text-yellow-400/90">GET /api/teams</code>. Teams are created through the <strong>Team Manager</strong> portal. You can register a team by pasting its ID below.
                        </p>
                    </div>
                )}

                <div className="flex flex-wrap gap-3">
                    {/* Dropdown (shown only when teams are available) */}
                    {hasDropdown ? (
                        <select value={selTeam} onChange={e => { setSelTeam(e.target.value); setManualId(''); }}
                            className="flex-1 min-w-[180px] bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff00]/40">
                            <option value="">Select team…</option>
                            {available.map(t => <option key={t._id} value={t._id}>{t.name}{t.tag ? ` [${t.tag}]` : ''}</option>)}
                        </select>
                    ) : (
                        <input value={manualId} onChange={e => { setManualId(e.target.value); setSelTeam(''); }}
                            placeholder="Paste Team ID…"
                            className="flex-1 min-w-[180px] bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff00]/40" />
                    )}
                    <input type="number" min={1} placeholder="Seed" title="Optional — integer ≥ 1"
                        value={seed} onChange={e => setSeed(e.target.value)}
                        className="w-20 bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white text-center focus:outline-none" />
                    <button onClick={register} disabled={!teamIdToRegister || busy || Boolean(blockReason)}
                        className="px-4 py-2 rounded-xl bg-[#00ff00] text-black font-bold text-sm hover:bg-[#00ff00]/90 disabled:opacity-40 transition-all">
                        {busy ? '…' : <><Plus className="inline w-3.5 h-3.5" /> Add</>}
                    </button>
                </div>
            </div>

            {/* Team list */}
            {entries.length === 0 ? (
                <div className="text-center py-8 text-gray-600 text-sm">No teams registered yet</div>
            ) : (
                <div className="bg-[#1a1e28] border border-white/8 rounded-2xl overflow-hidden">
                    <table className="w-full">
                        <thead><tr className="border-b border-white/5">
                            {['Seed','Team','Status','Qualified From',''].map(h => <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">{h}</th>)}
                        </tr></thead>
                        <tbody>
                            {entries.map(e => (
                                <tr key={e._id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                                    <td className="px-4 py-3 text-sm text-gray-400 font-mono">{e.seed ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {teamMap.get(tId(e.teamId))?.logo
                                                ? <img src={teamMap.get(tId(e.teamId))!.logo} className="w-6 h-6 rounded object-contain bg-black/30 flex-shrink-0" alt="" />
                                                : <div className="w-6 h-6 rounded bg-[#00ff00]/10 border border-[#00ff00]/20 flex items-center justify-center overflow-hidden flex-shrink-0"><ImageIcon className="w-3.5 h-3.5 text-[#00ff00]/60" /></div>
                                            }
                                            <span className="text-sm text-white font-medium">{teamMap.get(tId(e.teamId))?.name ?? tName(e.teamId)}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${S_CLS[e.status]}`}>{e.status}</span></td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{e.seed ? `Seed #${e.seed}` : '—'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => remove(e._id)} className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function StagesPanel({ seasonId }: { seasonId: string }) {
    const [stages, setStages] = useState<Stage[]>([]);
    const [form, setForm] = useState({ name: '', stageType: 'GROUPS' as Stage['stageType'], orderIndex: 0, advancementCount: 2, eliminationCount: 0, startAt: '', endAt: '' });
    const [showForm, setShowForm] = useState(false);
    const [busy, setBusy] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<string | null>(null);

    const load = useCallback(() => getStages(seasonId).then(s => setStages(s.sort((a, b) => a.orderIndex - b.orderIndex))), [seasonId]);
    useEffect(() => { load(); }, [load]);

    const add = async () => {
        setBusy(true);
        try {
            await createStage({ ...form, seasonId, orderIndex: +form.orderIndex, advancementCount: +form.advancementCount, eliminationCount: +form.eliminationCount });
            toast.success('Stage created'); setShowForm(false); load();
        } catch (e) { toast.error(apiErr(e)); }
        finally { setBusy(false); }
    };

    const del = async (id: string) => {
        if (!confirm('Delete stage?')) return;
        try { await deleteStage(id); toast.success('Stage deleted'); load(); } catch (e) { toast.error(apiErr(e)); }
    };

    const STAGE_CLS: Record<string,string> = { GROUPS:'bg-blue-500/10 text-blue-400 border-blue-500/20', BRACKET:'bg-purple-500/10 text-purple-400 border-purple-500/20', SWISS:'bg-orange-500/10 text-orange-400 border-orange-500/20', LEAGUE:'bg-green-500/10 text-green-400 border-green-500/20' };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">{stages.length} stage{stages.length !== 1 ? 's' : ''}</p>
                <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00ff00]/10 text-[#00ff00] border border-[#00ff00]/20 text-xs font-bold hover:bg-[#00ff00]/20 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Add Stage
                </button>
            </div>

            {showForm && (
                <div className="bg-[#1a1e28] border border-white/8 rounded-2xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs text-gray-400 mb-1 block">Name</label>
                            <input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
                        </div>
                        <div><label className="text-xs text-gray-400 mb-1 block">Type</label>
                            <select value={form.stageType} onChange={e => setForm(p=>({...p,stageType:e.target.value as Stage['stageType']}))} className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                                <option value="GROUPS">Groups</option><option value="BRACKET">Bracket</option><option value="SWISS">Swiss</option><option value="LEAGUE">League</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        <div><label className="text-xs text-gray-400 mb-1 block">Order</label><input type="number" value={form.orderIndex} onChange={e=>setForm(p=>({...p,orderIndex:+e.target.value}))} className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none text-center" /></div>
                        <div><label className="text-xs text-gray-400 mb-1 block">Advance</label><input type="number" value={form.advancementCount} onChange={e=>setForm(p=>({...p,advancementCount:+e.target.value}))} className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none text-center" /></div>
                        <div><label className="text-xs text-gray-400 mb-1 block">Eliminate</label><input type="number" value={form.eliminationCount} onChange={e=>setForm(p=>({...p,eliminationCount:+e.target.value}))} className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none text-center" /></div>
                        <div></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs text-gray-400 mb-1 block">Start</label><input type="date" value={form.startAt} onChange={e=>setForm(p=>({...p,startAt:e.target.value}))} className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" /></div>
                        <div><label className="text-xs text-gray-400 mb-1 block">End</label><input type="date" value={form.endAt} onChange={e=>setForm(p=>({...p,endAt:e.target.value}))} className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" /></div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                        <button onClick={add} disabled={busy||!form.name} className="px-5 py-2 rounded-xl bg-[#00ff00] text-black font-bold text-sm disabled:opacity-50 hover:bg-[#00ff00]/90 transition-all">{busy ? 'Creating…' : 'Create Stage'}</button>
                    </div>
                </div>
            )}

            {stages.length === 0 && !showForm && (
                <div className="text-center py-8 text-gray-600 text-sm">No stages created yet</div>
            )}

            <div className="space-y-3">
                {stages.map(s => (
                    <div key={s._id} className="bg-[#1a1e28] border border-white/8 rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4">
                            <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STAGE_CLS[s.stageType]}`}>{s.stageType}</span>
                                <span className="text-white font-bold text-sm">{s.name}</span>
                                <span className="text-xs text-gray-500">→ Top {s.advancementCount} advance</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {s.stageType === 'GROUPS' && (
                                    <button onClick={() => setExpandedGroups(expandedGroups === s._id ? null : s._id)} className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                                        Groups {expandedGroups === s._id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    </button>
                                )}
                                <button onClick={() => del(s._id)} className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>
                        {expandedGroups === s._id && <GroupManager stageId={s._id} seasonId={seasonId} />}
                    </div>
                ))}
            </div>
        </div>
    );
}

function GroupManager({ stageId, seasonId }: { stageId: string; seasonId: string }) {
    const [groups, setGroups] = useState<Group[]>([]);
    const [teams, setTeams]   = useState<SeasonTeamEntry[]>([]);
    const [busy, setBusy]     = useState(false);

    const load = useCallback(() => {
        Promise.all([getGroups(stageId), getSeasonTeams(seasonId)]).then(([g, t]) => { setGroups(g); setTeams(t); });
    }, [stageId, seasonId]);
    useEffect(() => { load(); }, [load]);

    const autoCreate = async () => {
        setBusy(true);
        try {
            const n = Math.ceil(teams.length / 4);
            for (let i = 0; i < n; i++) {
                const g = await createGroup({ seasonId, stageId, name: `Group ${String.fromCharCode(65 + i)}`, groupIndex: i, advancementCount: 2 });
                const slice = teams.slice(i * 4, i * 4 + 4).map(t => tId(t.teamId));
                if (slice.length) await assignGroupTeams(g._id, slice);
            }
            toast.success('Groups created'); load();
        } catch (e) { toast.error(apiErr(e)); }
        finally { setBusy(false); }
    };

    return (
        <div className="border-t border-white/5 px-5 py-4">
            {groups.length === 0 ? (
                <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-500">No groups yet.</p>
                    <button onClick={autoCreate} disabled={busy || teams.length === 0} className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold hover:bg-blue-500/20 disabled:opacity-40 transition-all">
                        {busy ? '…' : `Auto-create groups for ${teams.length} teams`}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {groups.map(g => (
                        <div key={g._id} className="bg-[#0d0f14] border border-white/8 rounded-xl p-3">
                            <p className="text-xs font-black text-white mb-2">{g.name}</p>
                            <div className="space-y-1">
                                {g.teamIds.map(tid => {
                                    const e = teams.find(t => tId(t.teamId) === tid);
                                    return <p key={tid} className="text-xs text-gray-400">{e ? tName(e.teamId) : tid.slice(-4)}</p>;
                                })}
                                {!g.teamIds.length && <p className="text-xs text-gray-600 italic">Empty</p>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function RoundsPanel({ seasonId }: { seasonId: string }) {
    const [rounds, setRounds]   = useState<AdminRound[]>([]);
    const [stages, setStages]   = useState<Stage[]>([]);
    const [matchMap, setMatchMap] = useState<Record<string, AdminMatch[]>>({});
    const [expanded, setExpanded] = useState<string | null>(null);
    const [genForm, setGenForm] = useState({ weekCount: 5, stageId: '', generateMatches: true, stageType: 'GROUPS' });
    const [showGen, setShowGen] = useState(false);
    const [busy, setBusy]       = useState(false);
    const [scoreModal, setScoreModal] = useState<AdminMatch | null>(null);

    const load = useCallback(() => {
        Promise.all([getAdminRounds(seasonId), getStages(seasonId)]).then(([r, s]) => {
            setRounds(r.sort((a, b) => a.roundNumber - b.roundNumber));
            setStages(s);
            if (s.length) setGenForm(p => ({ ...p, stageId: s[0]._id, stageType: s[0].stageType }));
        });
    }, [seasonId]);
    useEffect(() => { load(); }, [load]);

    const loadMatches = async (roundId: string) => {
        if (matchMap[roundId]) return;
        const m = await getMatchesByRound(roundId);
        setMatchMap(p => ({ ...p, [roundId]: m }));
    };

    const toggleRound = (id: string) => {
        setExpanded(expanded === id ? null : id);
        loadMatches(id);
    };

    const gen = async () => {
        setBusy(true);
        try {
            await generateRounds({ ...genForm, seasonId, weekCount: +genForm.weekCount });
            toast.success('Rounds generated'); setShowGen(false); load();
        } catch (e) { toast.error(apiErr(e)); }
        finally { setBusy(false); }
    };

    const delRound = async (id: string) => {
        if (!confirm('Delete round?')) return;
        try { await deleteRound(id); toast.success('Round deleted'); load(); } catch (e) { toast.error(apiErr(e)); }
    };

    const patchRound = async (id: string, status: AdminRound['status']) => {
        try { await updateRound(id, { status }); load(); toast.success(`Round ${status}`); } catch (e) { toast.error(apiErr(e)); }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <button onClick={() => setShowGen(!showGen)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00ff00]/10 text-[#00ff00] border border-[#00ff00]/20 text-xs font-bold hover:bg-[#00ff00]/20 transition-all">
                    <RefreshCw className="w-3.5 h-3.5" /> Generate Rounds
                </button>
                <p className="text-xs text-gray-500">{rounds.length} round{rounds.length !== 1 ? 's' : ''}</p>
            </div>

            {showGen && (
                <div className="bg-[#1a1e28] border border-white/8 rounded-2xl p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                        <div><label className="text-xs text-gray-400 mb-1 block">Week Count</label><input type="number" value={genForm.weekCount} onChange={e=>setGenForm(p=>({...p,weekCount:+e.target.value}))} className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none text-center" /></div>
                        <div><label className="text-xs text-gray-400 mb-1 block">Stage</label>
                            <select value={genForm.stageId} onChange={e => { const s=stages.find(s=>s._id===e.target.value); setGenForm(p=>({...p,stageId:e.target.value,stageType:s?.stageType||'GROUPS'})); }} className="w-full bg-[#0d0f14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                                {stages.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="flex items-end"><label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer mb-2"><input type="checkbox" checked={genForm.generateMatches} onChange={e=>setGenForm(p=>({...p,generateMatches:e.target.checked}))} className="rounded" /> Generate Matches</label></div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowGen(false)} className="px-4 py-2 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                        <button onClick={gen} disabled={busy} className="px-5 py-2 rounded-xl bg-[#00ff00] text-black font-bold text-sm disabled:opacity-50 hover:bg-[#00ff00]/90 transition-all">{busy ? 'Generating…' : 'Generate'}</button>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {rounds.map(r => (
                    <div key={r._id} className="bg-[#1a1e28] border border-white/8 rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3">
                            <button onClick={() => toggleRound(r._id)} className="flex items-center gap-3 flex-1 text-left">
                                <span className="text-white font-bold text-sm">Round {r.roundNumber}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${S_CLS[r.status]}`}>{r.status}</span>
                                <span className="text-xs text-gray-500">{fmt(r.startDate)} → {fmt(r.endDate)}</span>
                                {expanded === r._id ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
                            </button>
                            <div className="flex items-center gap-1">
                                {r.status === 'SCHEDULED' && <button onClick={() => patchRound(r._id, 'ONGOING')} className="text-[10px] px-2 py-1 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 font-bold hover:bg-green-500/20 transition-all">Start</button>}
                                {r.status === 'ONGOING'   && <button onClick={() => patchRound(r._id, 'COMPLETED')} className="text-[10px] px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold hover:bg-blue-500/20 transition-all">Complete</button>}
                                <button onClick={() => delRound(r._id)} className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>
                        {expanded === r._id && (
                            <div className="border-t border-white/5 px-5 py-3">
                                {!(matchMap[r._id]) ? <p className="text-xs text-gray-500">Loading…</p> :
                                    matchMap[r._id].length === 0 ? <p className="text-xs text-gray-600">No matches in this round</p> :
                                    <div className="space-y-2">
                                        {matchMap[r._id].map(m => (
                                            <div key={m._id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 gap-3">
                                                <div className="flex items-center gap-2 flex-1">
                                                    <span className="text-sm text-white font-medium truncate">{tName(m.team1Id)}</span>
                                                    <span className="text-gray-600 text-xs">vs</span>
                                                    <span className="text-sm text-white font-medium truncate">{tName(m.team2Id)}</span>
                                                </div>
                                                {m.status === 'COMPLETED' && (
                                                    <span className="text-sm font-black text-white tabular-nums flex-shrink-0">{m.team1GamesWon} – {m.team2GamesWon}</span>
                                                )}
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${S_CLS[m.status]}`}>{m.status}</span>
                                                {m.status !== 'COMPLETED' && m.status !== 'CANCELLED' && (
                                                    <button onClick={() => setScoreModal(m)} className="text-[10px] px-2 py-1 rounded-lg bg-[#00ff00]/10 text-[#00ff00] border border-[#00ff00]/20 font-bold hover:bg-[#00ff00]/20 transition-all flex-shrink-0">
                                                        Submit Score
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                }
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {scoreModal && (
                <ScoreModal match={scoreModal} onClose={() => setScoreModal(null)} onSubmit={async (dto) => {
                    try {
                        await submitResult(scoreModal._id, dto);
                        toast.success('Result submitted');
                        setMatchMap(p => ({ ...p, [tId(scoreModal.roundId)]: (p[tId(scoreModal.roundId)] || []).map(m => m._id === scoreModal._id ? { ...m, status: 'COMPLETED', team1GamesWon: dto.team1GamesWon, team2GamesWon: dto.team2GamesWon } : m) }));
                        setScoreModal(null);
                    } catch (e) { toast.error(apiErr(e)); }
                }} />
            )}
        </div>
    );
}

function ScoreModal({ match, onClose, onSubmit }: { match: AdminMatch; onClose: () => void; onSubmit: (dto: { team1GamesWon: number; team2GamesWon: number; games?: {gameNumber:number;winnerId:string;mapName?:string;team1Score?:number;team2Score?:number}[] }) => Promise<void> }) {
    const maxGames = match.format === 'BO5' ? 5 : match.format === 'BO3' ? 3 : 1;
    const [w1, setW1] = useState(0);
    const [w2, setW2] = useState(0);
    const [maps, setMaps] = useState(Array.from({length: maxGames}, (_, i) => ({ gameNumber: i+1, mapName: '', team1Score: 0, team2Score: 0 })));
    const [busy, setBusy] = useState(false);

    const submit = async () => {
        setBusy(true);
        const games = maps.slice(0, w1 + w2).map(g => ({
            gameNumber: g.gameNumber, mapName: g.mapName || undefined,
            team1Score: g.team1Score || undefined, team2Score: g.team2Score || undefined,
            winnerId: (g.team1Score || 0) > (g.team2Score || 0) ? tId(match.team1Id) : tId(match.team2Id),
        }));
        await onSubmit({ team1GamesWon: w1, team2GamesWon: w2, games: games.length ? games : undefined });
        setBusy(false);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#13161e] border border-white/10 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-white font-black uppercase tracking-tight mb-1">Submit Score</h2>
                <p className="text-xs text-gray-500 mb-5">{tName(match.team1Id)} vs {tName(match.team2Id)} · {match.format}</p>
                <div className="flex items-center gap-4 mb-5">
                    <div className="flex-1 text-center">
                        <p className="text-xs text-gray-400 mb-2 truncate">{tName(match.team1Id)}</p>
                        <input type="number" min="0" max={maxGames} value={w1} onChange={e=>setW1(+e.target.value)} className="w-16 bg-[#1a1e28] border border-white/10 rounded-xl text-2xl font-black text-white text-center py-2 focus:outline-none mx-auto block" />
                    </div>
                    <span className="text-gray-600 text-xl font-black">:</span>
                    <div className="flex-1 text-center">
                        <p className="text-xs text-gray-400 mb-2 truncate">{tName(match.team2Id)}</p>
                        <input type="number" min="0" max={maxGames} value={w2} onChange={e=>setW2(+e.target.value)} className="w-16 bg-[#1a1e28] border border-white/10 rounded-xl text-2xl font-black text-white text-center py-2 focus:outline-none mx-auto block" />
                    </div>
                </div>
                <div className="space-y-2 mb-5">
                    {maps.slice(0, w1 + w2).map((g, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-12">Game {g.gameNumber}</span>
                            <input placeholder="Map" value={g.mapName} onChange={e=>{const n=[...maps];n[i]={...n[i],mapName:e.target.value};setMaps(n);}} className="flex-1 bg-[#1a1e28] border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none" />
                            <input type="number" placeholder="T1" value={g.team1Score||''} onChange={e=>{const n=[...maps];n[i]={...n[i],team1Score:+e.target.value};setMaps(n);}} className="w-12 bg-[#1a1e28] border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none" />
                            <span className="text-gray-600">:</span>
                            <input type="number" placeholder="T2" value={g.team2Score||''} onChange={e=>{const n=[...maps];n[i]={...n[i],team2Score:+e.target.value};setMaps(n);}} className="w-12 bg-[#1a1e28] border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none" />
                        </div>
                    ))}
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                    <button onClick={submit} disabled={busy||w1+w2===0} className="flex-1 py-2.5 rounded-xl bg-[#00ff00] text-black font-bold text-sm disabled:opacity-50 hover:bg-[#00ff00]/90 transition-all">{busy?'Submitting…':'Submit'}</button>
                </div>
            </div>
        </div>
    );
}

function StandingsPanel({ seasonId }: { seasonId: string }) {
    const [rows, setRows] = useState<StandingEntry[]>([]);
    const [busy, setBusy] = useState(false);
    useEffect(() => { getAdminStandings(seasonId).then(r => setRows(r.sort((a, b) => a.rank - b.rank))); }, [seasonId]);
    const recalc = async () => { setBusy(true); try { await recalculateStandings(seasonId); getAdminStandings(seasonId).then(r => setRows(r.sort((a,b)=>a.rank-b.rank))); toast.success('Standings recalculated'); } catch(e){toast.error(apiErr(e));} finally{setBusy(false);} };
    if (!rows.length) return <div className="text-center py-8 text-gray-600 text-sm">No standings data yet. Submit some match results first.</div>;
    return (
        <div className="space-y-3">
            <div className="flex justify-end"><button onClick={recalc} disabled={busy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white transition-all"><RefreshCw className={`w-3.5 h-3.5 ${busy?'animate-spin':''}`} /> Recalculate</button></div>
            <div className="bg-[#1a1e28] border border-white/8 rounded-2xl overflow-hidden">
                <table className="w-full"><thead><tr className="border-b border-white/5">{['#','Team','P','W','L','Pts','GD'].map(h=><th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
                <tbody>{rows.map(r=><tr key={r._id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-sm font-bold text-gray-400">{r.rank}</td>
                    <td className="px-4 py-3 text-sm text-white font-medium">{tName(r.teamId)}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{r.played}</td>
                    <td className="px-4 py-3 text-sm text-green-400 font-medium">{r.wins}</td>
                    <td className="px-4 py-3 text-sm text-red-400 font-medium">{r.losses}</td>
                    <td className="px-4 py-3 text-sm text-white font-black">{r.points}</td>
                    <td className="px-4 py-3 text-sm"><span className={r.gameDiff>=0?'text-green-400':'text-red-400'}>{r.gameDiff>=0?'+':''}{r.gameDiff}</span></td>
                </tr>)}</tbody></table>
            </div>
        </div>
    );
}

function BracketPanel({ seasonId }: { seasonId: string }) {
    const [bracket, setBracket] = useState<AdminBracket | null>(null);
    const [stages, setStages]   = useState<Stage[]>([]);
    const [genForm, setGenForm] = useState({ format: 'SINGLE_ELIMINATION', stageId: '' });
    const [busy, setBusy]       = useState(false);

    useEffect(() => {
        Promise.all([getAdminBracket(seasonId), getStages(seasonId)]).then(([b, s]) => {
            setBracket(b);
            const bStages = s.filter(st => st.stageType === 'BRACKET');
            setStages(bStages);
            if (bStages.length) setGenForm(p => ({ ...p, stageId: bStages[0]._id }));
        });
    }, [seasonId]);

    const gen = async () => {
        setBusy(true);
        try {
            const b = await generateBracket({ seasonId, format: genForm.format as 'SINGLE_ELIMINATION'|'DOUBLE_ELIMINATION' });
            setBracket(b); toast.success('Bracket generated');
        } catch (e) { toast.error(apiErr(e)); }
        finally { setBusy(false); }
    };

    const roundNums = bracket ? [...new Set(bracket.slots.map(s => s.roundNumber))].sort((a, b) => a - b) : [];
    const byRound: Record<number, typeof bracket extends null ? never : AdminBracket['slots']> = {};
    if (bracket) roundNums.forEach(r => { byRound[r] = bracket.slots.filter(s => s.roundNumber === r).sort((a, b) => a.position - b.position); });

    return (
        <div className="space-y-4">
            {!bracket ? (
                <div className="text-center py-8">
                    <GitBranch className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm mb-4">No bracket generated yet</p>
                    <div className="inline-flex flex-col items-center gap-3">
                        <div className="flex items-center gap-3">
                            <select value={genForm.format} onChange={e=>setGenForm(p=>({...p,format:e.target.value}))} className="bg-[#1a1e28] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                                <option value="SINGLE_ELIMINATION">Single Elimination</option>
                                <option value="DOUBLE_ELIMINATION">Double Elimination</option>
                            </select>
                            {stages.length > 0 && (
                                <select value={genForm.stageId} onChange={e=>setGenForm(p=>({...p,stageId:e.target.value}))} className="bg-[#1a1e28] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                                    {stages.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            )}
                        </div>
                        <button onClick={gen} disabled={busy} className="px-5 py-2.5 rounded-xl bg-[#00ff00] text-black font-bold text-sm hover:bg-[#00ff00]/90 disabled:opacity-50 transition-all">{busy?'Generating…':'Generate Bracket'}</button>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-yellow-400" />
                            <p className="font-bold text-white text-sm">{bracket.format.replace('_',' ')}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${S_CLS[bracket.status]}`}>{bracket.status}</span>
                        </div>
                        {bracket.championId && <span className="text-yellow-400 text-sm font-bold">Champion: {bracket.championId}</span>}
                    </div>
                    <div className="overflow-x-auto pb-2">
                        <div className="flex gap-5 min-w-max">
                            {roundNums.map((r, ri) => {
                                const label = r === bracket.totalRounds ? 'Grand Final' : r === bracket.totalRounds - 1 && bracket.totalRounds > 1 ? 'Semifinals' : `Round ${r}`;
                                return (
                                    <div key={r} className="flex flex-col gap-2">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center mb-1">{label}</p>
                                        <div className="flex flex-col" style={{ gap: `${Math.pow(2, ri) * 10 + 8}px` }}>
                                            {byRound[r].map(slot => {
                                                const isReady = slot.status === 'READY';
                                                return (
                                                    <div key={slot.slotId} className={`w-44 bg-[#1a1e28] rounded-xl overflow-hidden border ${isReady ? 'border-yellow-500/40 animate-pulse' : 'border-white/8'}`}>
                                                        {slot.status === 'PENDING' ? (
                                                            <div className="p-3 text-center text-xs text-gray-600 italic">TBD</div>
                                                        ) : (
                                                            <>
                                                                <div className={`flex items-center gap-2 px-3 py-2 border-b border-white/5 ${slot.winnerId === slot.team1Id && slot.status==='COMPLETED' ? 'bg-white/5' : ''}`}>
                                                                    <Shield className="w-3 h-3 text-[#00ff00]/30 flex-shrink-0" />
                                                                    <span className={`text-xs flex-1 truncate ${slot.winnerId === slot.team1Id && slot.status==='COMPLETED' ? 'text-white font-bold' : 'text-gray-400'}`}>{slot.team1Id ? slot.team1Id.toString().slice(-5) : 'TBD'}</span>
                                                                    {slot.winnerId === slot.team1Id && slot.status==='COMPLETED' && <Check className="w-3 h-3 text-green-400 flex-shrink-0" />}
                                                                </div>
                                                                <div className={`flex items-center gap-2 px-3 py-2 ${slot.winnerId === slot.team2Id && slot.status==='COMPLETED' ? 'bg-white/5' : ''}`}>
                                                                    <Shield className="w-3 h-3 text-[#00ff00]/30 flex-shrink-0" />
                                                                    <span className={`text-xs flex-1 truncate ${slot.winnerId === slot.team2Id && slot.status==='COMPLETED' ? 'text-white font-bold' : 'text-gray-400'}`}>{slot.team2Id ? slot.team2Id.toString().slice(-5) : 'TBD'}</span>
                                                                    {slot.winnerId === slot.team2Id && slot.status==='COMPLETED' && <Check className="w-3 h-3 text-green-400 flex-shrink-0" />}
                                                                </div>
                                                            </>
                                                        )}
                                                        <div className={`px-3 py-1 text-[9px] font-bold border-t border-white/5 ${S_CLS[slot.status]}`}>{slot.status}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Workspace (Liquipedia-style) ───────────────────────────────────────
export default function AdminSeasonWorkspace() {
    const { id, seasonId } = useParams<{ id: string; seasonId: string }>();
    const navigate = useNavigate();
    const [season, setSeason]         = useState<Season | null>(null);
    const [leagueName, setLeagueName] = useState('');
    const [loading, setLoading]       = useState(true);
    const [allSeasons, setAllSeasons] = useState<Season[]>([]);

    useEffect(() => {
        if (!id || !seasonId) return;
        Promise.all([
            seasonService.getById(seasonId).catch(() => null),
            leagueService.getLeagueById(id).catch(() => null),
        ]).then(([s, l]) => {
            setSeason(s as Season);
            setLeagueName((l as { name?: string })?.name || '');
        }).finally(() => setLoading(false));
    }, [id, seasonId]);

    useEffect(() => {
        if (!id) return;
        seasonService.getByLeague(id).then(setAllSeasons).catch(console.error);
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-gray-500">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />Loading…
        </div>
    );
    if (!season) return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <AlertTriangle className="w-10 h-10 mb-3 opacity-30" /><p>Season not found.</p>
            <button onClick={() => navigate(`/admin/leagues/${id}`)} className="mt-4 text-sm text-[#00ff00] hover:underline">Back</button>
        </div>
    );

    const statusColor = season.status === 'ONGOING' ? 'text-green-400 border-green-500/30 bg-green-500/5'
        : season.status === 'FINISHED' ? 'text-gray-400 border-white/10 bg-white/3'
        : 'text-blue-400 border-blue-500/30 bg-blue-500/5';

    return (
        <div className="space-y-5">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-gray-500">
                <button onClick={() => navigate('/admin/leagues')} className="hover:text-white transition-colors">Leagues</button>
                <span className="text-white/20">/</span>
                <button onClick={() => navigate(`/admin/leagues/${id}`)} className="hover:text-white transition-colors">{leagueName || 'League'}</button>
                <span className="text-white/20">/</span>
                <span className="text-white">{season.name}</span>
            </nav>

            {/* Title + status chip */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-black uppercase tracking-tight text-white">{season.name}</h1>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${statusColor}`}>
                        {season.status}
                    </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {allSeasons.length > 0 && (
                        <div className="relative">
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                            <select
                                value={seasonId}
                                onChange={e => navigate(`/admin/leagues/${id}/seasons/${e.target.value}`)}
                                className="bg-[#1a1e28] border border-white/10 rounded-xl pr-8 pl-3 py-2 text-xs text-white appearance-none cursor-pointer focus:outline-none focus:border-[#00ff00]/40 min-w-[190px]"
                            >
                                {allSeasons.map(s => (
                                    <option key={s._id} value={s._id}>{s.name} [{s.status}]</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <button onClick={() => navigate('/admin/leagues')}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                        <ArrowLeft className="w-3.5 h-3.5" /> All Leagues
                    </button>
                </div>
            </div>

            {/* Liquipedia 2-column layout */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-5 items-start">

                {/* ── LEFT: main sections ── */}
                <div className="space-y-4">

                    {/* About: Format & Rules */}
                    <SectionCard icon={<BookOpen className="w-4 h-4" />} title="About — Format &amp; Rules">
                        <RulesPanel seasonId={season._id} />
                    </SectionCard>

                    {/* Prize Pool */}
                    <SectionCard icon={<DollarSign className="w-4 h-4" />} title="Prize Pool">
                        <PrizePanel seasonId={season._id} leagueId={id!} />
                    </SectionCard>

                    {/* Participants */}
                    <SectionCard icon={<Users className="w-4 h-4" />} title="Participants">
                        <TeamsPanel season={season} />
                    </SectionCard>

                    {/* Stages */}
                    <SectionCard icon={<Layers className="w-4 h-4" />} title="Stages">
                        <StagesPanel seasonId={season._id} />
                    </SectionCard>

                    {/* Schedule & Results */}
                    <SectionCard icon={<Flag className="w-4 h-4" />} title="Schedule &amp; Results">
                        <RoundsPanel seasonId={season._id} />
                    </SectionCard>

                    {/* Playoffs Bracket */}
                    <SectionCard icon={<GitBranch className="w-4 h-4" />} title="Playoffs Bracket">
                        <BracketPanel seasonId={season._id} />
                    </SectionCard>

                    {/* Standings */}
                    <SectionCard icon={<TrendingUp className="w-4 h-4" />} title="Standings">
                        <StandingsPanel seasonId={season._id} />
                    </SectionCard>
                </div>

                {/* ── RIGHT: sidebar ── */}
                <div className="space-y-4 xl:sticky xl:top-6">
                    <TournamentInfoCard season={season} leagueName={leagueName} />
                    <SeasonActionsCard season={season} onUpdate={setSeason} />
                </div>
            </div>
        </div>
    );
}
