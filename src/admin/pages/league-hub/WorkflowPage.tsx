import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Gamepad2, BookOpen, Trophy, Calendar, Flag, Users, Swords,
    ArrowRight, CheckCircle2, Circle, ChevronDown, ChevronUp,
    Zap, Info, ExternalLink, Copy, Check,
} from 'lucide-react';
import { cn } from '../../../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkflowStep {
    number: number;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    why: string;
    endpoint: string;
    method: 'POST' | 'GET' | 'PATCH';
    body: string;
    returns: string;
    saveas: string;
    color: string;
    glow: string;
    border: string;
    route: string;
    routeLabel: string;
    deps: string[];
}

const STEPS: WorkflowStep[] = [
    {
        number: 1,
        icon: <Gamepad2 size={22} />,
        title: 'Create the Game',
        subtitle: 'Game Catalog',
        why: 'Everything links back to a game. You need gameId for both League and LeagueRule — so this is always first.',
        endpoint: '/catalog',
        method: 'POST',
        body: `{
  "title": "Valorant",
  "genre": "Tactical Shooter",
  "publisher": "Riot Games",
  "teamSize": 5,
  "supportsTeams": true
}`,
        returns: '_id → gameId',
        saveas: 'gameId',
        color: 'from-violet-600/20 to-violet-900/10',
        glow: 'rgba(139,92,246,0.35)',
        border: 'border-violet-500/30',
        route: '/admin/games',
        routeLabel: 'Games Catalog',
        deps: [],
    },
    {
        number: 2,
        icon: <BookOpen size={22} />,
        title: 'Create Competition Rules',
        subtitle: 'League Rules',
        why: 'Rules need gameId. Season needs rulesId. Rules must exist before the season can be created.',
        endpoint: '/league-rules',
        method: 'POST',
        body: `{
  "name": "Valorant Standard BO3",
  "gameId": "<gameId>",
  "formatType": "LEAGUE",
  "matchType": "BO3",
  "pointsWin": 3,
  "pointsDraw": 0,
  "pointsLoss": 0,
  "maxTeams": 10,
  "tiebreaker": "GAME_DIFF"
}`,
        returns: '_id → rulesId',
        saveas: 'rulesId',
        color: 'from-blue-600/20 to-blue-900/10',
        glow: 'rgba(59,130,246,0.35)',
        border: 'border-blue-500/30',
        route: '/admin/leagues/rules',
        routeLabel: 'Rules Manager',
        deps: ['gameId'],
    },
    {
        number: 3,
        icon: <Trophy size={22} />,
        title: 'Create the League',
        subtitle: 'League Setup',
        why: 'League needs gameId. Season needs leagueId. The league is the persistent competition structure, seasons are its episodes.',
        endpoint: '/leagues',
        method: 'POST',
        body: `{
  "name": "ArenaChain Valorant Tunisia",
  "level": "NATIONAL",
  "regionId": "TN",
  "gameId": "<gameId>",
  "description": "Tunisia national Valorant league"
}`,
        returns: '_id → leagueId',
        saveas: 'leagueId',
        color: 'from-green-600/20 to-green-900/10',
        glow: 'rgba(34,197,94,0.35)',
        border: 'border-green-500/30',
        route: '/admin/leagues/list',
        routeLabel: 'Leagues Manager',
        deps: ['gameId'],
    },
    {
        number: 4,
        icon: <Calendar size={22} />,
        title: 'Create the Season',
        subtitle: 'Season Planning',
        why: 'Season needs leagueId (step 3) and rulesId (step 2). Season status is automatically set to PLANNED.',
        endpoint: '/seasons',
        method: 'POST',
        body: `{
  "leagueId": "<leagueId>",
  "rulesId": "<rulesId>",
  "name": "Spring Split 2026",
  "registrationDeadline": "2026-03-01",
  "startDate": "2026-03-10",
  "endDate": "2026-06-30"
}`,
        returns: '_id → seasonId · status: PLANNED',
        saveas: 'seasonId',
        color: 'from-amber-600/20 to-amber-900/10',
        glow: 'rgba(245,158,11,0.35)',
        border: 'border-amber-500/30',
        route: '/admin/leagues/seasons',
        routeLabel: 'Seasons Manager',
        deps: ['leagueId', 'rulesId'],
    },
    {
        number: 5,
        icon: <Flag size={22} />,
        title: 'Generate Rounds',
        subtitle: 'Schedule Setup',
        why: 'Rounds need seasonId. Create the schedule before registration so teams see the full calendar when they sign up.',
        endpoint: '/rounds/generate',
        method: 'POST',
        body: `{
  "seasonId": "<seasonId>",
  "startDate": "2026-03-10",
  "weekCount": 9
}`,
        returns: '9 rounds auto-created (Round 1–9)',
        saveas: 'roundIds[]',
        color: 'from-orange-600/20 to-orange-900/10',
        glow: 'rgba(249,115,22,0.35)',
        border: 'border-orange-500/30',
        route: '/admin/leagues/rounds',
        routeLabel: 'Rounds Manager',
        deps: ['seasonId'],
    },
    {
        number: 6,
        icon: <Users size={22} />,
        title: 'Register Teams',
        subtitle: 'Team Enrollment',
        why: 'Teams register during the PLANNED phase, before the deadline. Once activated, no new teams can join.',
        endpoint: '/seasons/:seasonId/teams',
        method: 'POST',
        body: `{
  "teamId": "<teamId>",
  "seasonId": "<seasonId>"
}`,
        returns: 'SeasonTeam record · status: ACTIVE',
        saveas: 'seasonTeamId',
        color: 'from-cyan-600/20 to-cyan-900/10',
        glow: 'rgba(6,182,212,0.35)',
        border: 'border-cyan-500/30',
        route: '/admin/leagues/teams',
        routeLabel: 'Teams Manager',
        deps: ['seasonId'],
    },
    {
        number: 7,
        icon: <Swords size={22} />,
        title: 'Schedule & Report Matches',
        subtitle: 'Match Operations',
        why: 'Matches are scheduled inside rounds. Results are reported per game (BO3/BO5) or as final score. Forfeits auto-update standings.',
        endpoint: '/matches',
        method: 'POST',
        body: `{
  "roundId": "<roundId>",
  "homeTeamId": "<teamId>",
  "awayTeamId": "<teamId>",
  "scheduledAt": "2026-03-10T18:00:00Z"
}`,
        returns: 'Match record · status: SCHEDULED',
        saveas: 'matchId',
        color: 'from-rose-600/20 to-rose-900/10',
        glow: 'rgba(244,63,94,0.35)',
        border: 'border-rose-500/30',
        route: '/admin/leagues/matches',
        routeLabel: 'Matches Manager',
        deps: ['roundId', 'teamIds'],
    },
];

// ─── Copy snippet ─────────────────────────────────────────────────────────────

function CodeBlock({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };
    return (
        <div className="relative group/code mt-2">
            <pre className="bg-black/40 border border-white/8 rounded-xl p-3 text-[10px] leading-relaxed text-text-muted font-mono overflow-x-auto">
                {code}
            </pre>
            <button
                onClick={copy}
                className="absolute top-2 right-2 opacity-0 group-hover/code:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 p-1.5 rounded-md"
            >
                {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} className="text-text-muted" />}
            </button>
        </div>
    );
}

// ─── Step card ────────────────────────────────────────────────────────────────

function StepCard({ step, expanded, onToggle }: {
    step: WorkflowStep;
    expanded: boolean;
    onToggle: () => void;
}) {
    const navigate = useNavigate();

    return (
        <div
            className={cn(
                'rounded-2xl border transition-all duration-300',
                'bg-gradient-to-br',
                step.color, step.border,
                expanded && 'shadow-lg',
            )}
            style={expanded ? { boxShadow: `0 8px 40px -8px ${step.glow}` } : undefined}
        >
            {/* Header row */}
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-4 p-4 text-left group"
            >
                {/* Step number */}
                <div
                    className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm border"
                    style={{ background: step.glow, borderColor: step.glow }}
                >
                    {step.number}
                </div>

                {/* Icon + title */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-white/70 group-hover:text-white transition-colors shrink-0">
                        {step.icon}
                    </span>
                    <div className="min-w-0">
                        <p className="text-white font-bold text-sm leading-tight">{step.title}</p>
                        <p className="text-text-muted text-[10px] uppercase tracking-widest font-semibold">{step.subtitle}</p>
                    </div>
                </div>

                {/* Deps */}
                <div className="hidden md:flex items-center gap-1 shrink-0">
                    {step.deps.map(d => (
                        <span key={d} className="text-[9px] font-black bg-white/5 border border-white/10 px-2 py-0.5 rounded text-text-muted uppercase tracking-wide">
                            {d}
                        </span>
                    ))}
                </div>

                {/* Returns badge */}
                <span className="hidden lg:flex text-[9px] font-black text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-lg whitespace-nowrap shrink-0">
                    → {step.saveas}
                </span>

                {/* Expand toggle */}
                <span className="shrink-0 text-text-muted group-hover:text-white transition-colors ml-2">
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
            </button>

            {/* Expanded content */}
            {expanded && (
                <div className="px-4 pb-4 space-y-4">
                    <div className="border-t border-white/8 pt-4 grid md:grid-cols-2 gap-4">
                        {/* Why + body */}
                        <div className="space-y-3">
                            <div className="flex items-start gap-2">
                                <Info size={13} className="text-text-muted mt-0.5 shrink-0" />
                                <p className="text-text-muted text-xs leading-relaxed">{step.why}</p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={cn(
                                        'text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded',
                                        step.method === 'POST' ? 'bg-green-500/20 text-green-400' :
                                        step.method === 'PATCH' ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-blue-500/20 text-blue-400'
                                    )}>
                                        {step.method}
                                    </span>
                                    <code className="text-[10px] text-white/70 font-mono">{step.endpoint}</code>
                                </div>
                                <CodeBlock code={step.body} />
                            </div>
                        </div>

                        {/* Returns + action */}
                        <div className="space-y-3">
                            <div className="bg-black/30 border border-white/8 rounded-xl p-3">
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Returns</p>
                                <p className="text-white text-xs font-mono">{step.returns}</p>
                            </div>

                            <div className="bg-black/30 border border-white/8 rounded-xl p-3">
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Save as</p>
                                <code className="text-green-400 text-xs font-bold font-mono">{step.saveas}</code>
                            </div>

                            <button
                                onClick={() => navigate(step.route)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm text-white border border-white/15 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-all"
                                style={{ boxShadow: `0 0 16px -4px ${step.glow}` }}
                            >
                                <ExternalLink size={14} />
                                Go to {step.routeLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkflowPage() {
    const [expanded, setExpanded] = useState<number | null>(1);
    const navigate = useNavigate();

    const toggle = (n: number) => setExpanded(prev => prev === n ? null : n);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Page header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-900/20 to-black border border-green-500/20 p-6"
                style={{ boxShadow: '0 0 60px -20px rgba(34,197,94,0.2)' }}>
                <div className="absolute inset-0 opacity-5"
                    style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,0.5) 39px,rgba(255,255,255,0.5) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,0.5) 39px,rgba(255,255,255,0.5) 40px)' }} />
                <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                        <Zap size={14} className="text-green-400" />
                        <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">League Lifecycle</span>
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2">Full Lifecycle Workflow</h1>
                    <p className="text-text-muted text-sm leading-relaxed max-w-xl">
                        Follow these <strong className="text-white">7 ordered steps</strong> to create a fully operational league —
                        from game catalog to live match reporting. Each step has a dependency on the previous ones.
                    </p>

                    {/* Quick nav pills */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        {STEPS.map(s => (
                            <button
                                key={s.number}
                                onClick={() => setExpanded(s.number)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border border-white/10 bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-all"
                            >
                                <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-black">{s.number}</span>
                                {s.title}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Step dependency legend */}
            <div className="flex items-center gap-6 px-2">
                <div className="flex items-center gap-2 text-[10px] text-text-muted">
                    <Circle size={10} className="text-text-muted" />
                    <span>Step</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-text-muted">
                    <CheckCircle2 size={10} className="text-green-400" />
                    <span>Dependency tag</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-text-muted">
                    <ArrowRight size={10} className="text-text-muted" />
                    <span>Returns ID for next step</span>
                </div>
            </div>

            {/* Steps accordion */}
            <div className="space-y-2">
                {STEPS.map((step, i) => (
                    <div key={step.number} className="relative">
                        <StepCard
                            step={step}
                            expanded={expanded === step.number}
                            onToggle={() => toggle(step.number)}
                        />
                        {/* Connector arrow between steps */}
                        {i < STEPS.length - 1 && (
                            <div className="flex justify-center py-1">
                                <ArrowRight size={14} className="rotate-90 text-white/15" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Summary quick-links at bottom */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                {[
                    { label: 'Rules', route: '/admin/leagues/rules', icon: <BookOpen size={16}/> },
                    { label: 'Leagues', route: '/admin/leagues/list', icon: <Trophy size={16}/> },
                    { label: 'Seasons', route: '/admin/leagues/seasons', icon: <Calendar size={16}/> },
                    { label: 'Rounds', route: '/admin/leagues/rounds', icon: <Flag size={16}/> },
                    { label: 'Teams', route: '/admin/leagues/teams', icon: <Users size={16}/> },
                    { label: 'Matches', route: '/admin/leagues/matches', icon: <Swords size={16}/> },
                    { label: 'Games', route: '/admin/games', icon: <Gamepad2 size={16}/> },
                    { label: 'Back to Hub', route: '/admin/leagues', icon: <Zap size={16}/> },
                ].map(link => (
                    <button
                        key={link.label}
                        onClick={() => navigate(link.route)}
                        className="flex items-center gap-2 p-3 rounded-xl border border-white/8 bg-white/3 hover:bg-white/8 hover:border-white/15 text-text-muted hover:text-white transition-all text-sm font-semibold"
                    >
                        {link.icon}
                        {link.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
