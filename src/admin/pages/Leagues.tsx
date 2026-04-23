import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Trophy, Search, Loader2, Globe, Edit2, Trash2,
    ChevronRight, Calendar, Zap, Star,
    CheckSquare, AlertTriangle, MapPin,
} from 'lucide-react';
import { leagueService, type League, type CreateLeaguePayload, LeagueLevel } from '../../services/leagueService';
import CreateLeagueModal from '../components/leagues/CreateLeagueModal';
import { cn } from '../../lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Summary row under the grid — one card per `LeagueLevel` (same set as filter pills, minus ALL). */
const LEVEL_QUICK_STAT: Record<LeagueLevel, { label: string; icon: ReactNode; color: string }> = {
    INTERNATIONAL: { label: 'International', icon: <Star size={14} />, color: 'text-purple-400' },
    CONTINENTAL: { label: 'Continental', icon: <Calendar size={14} />, color: 'text-blue-400' },
    NATIONAL: { label: 'National', icon: <CheckSquare size={14} />, color: 'text-green-400' },
    REGIONAL: { label: 'Regional', icon: <MapPin size={14} />, color: 'text-gray-400' },
};

const LEVEL_COLORS: Record<string, { pill: string; glow: string; border: string; hex: string }> = {
    INTERNATIONAL: { pill: 'bg-purple-500/15 text-purple-300 border-purple-500/25', glow: 'rgba(168,85,247,0.15)', border: 'border-purple-500/20', hex: '#a855f7' },
    CONTINENTAL: { pill: 'bg-blue-500/15 text-blue-300 border-blue-500/25', glow: 'rgba(59,130,246,0.15)', border: 'border-blue-500/20', hex: '#3b82f6' },
    NATIONAL: { pill: 'bg-green-500/15 text-green-300 border-green-500/25', glow: 'rgba(34,197,94,0.15)', border: 'border-green-500/20', hex: '#22c55e' },
    REGIONAL: { pill: 'bg-gray-500/15 text-gray-400 border-gray-500/25', glow: 'rgba(107,114,128,0.12)', border: 'border-gray-500/20', hex: '#6b7280' },
};
const apiErr = (e: unknown) => {
    const err = e as { response?: { data?: { message?: string } } };
    return err?.response?.data?.message || 'Something went wrong';
};

function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' }) {
    return (
        <div className={cn(
            'fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl border',
            type === 'ok'
                ? 'bg-green-500/15 border-green-500/30 text-green-300'
                : 'bg-red-500/15 border-red-500/30 text-red-300'
        )}>
            {type === 'ok' ? <CheckSquare size={15} /> : <AlertTriangle size={15} />}
            {msg}
        </div>
    );
}

// ─── League Card ──────────────────────────────────────────────────────────────

function LeagueCard({
    league, onEdit, onDelete, onManage,
}: {
    league: League;
    onEdit: (l: League) => void;
    onDelete: (l: League) => void;
    onManage: (l: League) => void;
}) {
    const lc = LEVEL_COLORS[league.level] || LEVEL_COLORS.REGIONAL;

    return (
        <div
            className={cn(
                'relative bg-surface border rounded-2xl overflow-hidden flex flex-col group transition-all duration-300 hover:-translate-y-0.5',
                lc.border,
            )}
            style={{ boxShadow: `0 4px 32px -8px ${lc.glow}` }}
        >
            {/* Accent top bar */}
            <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${lc.hex}80, transparent)` }} />

            <div className="p-5 flex flex-col flex-1 gap-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-4 min-w-0">
                        {league.logoUrl && (
                            <img
                                src={league.logoUrl}
                                alt={league.name}
                                className="w-12 h-12 rounded-xl object-contain bg-white/5 border border-white/10 p-1 shrink-0"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border', lc.pill)}>
                                    {league.level}
                                </span>
                            </div>
                            <h3 className="text-white font-black text-base uppercase tracking-tight leading-tight truncate">
                                {league.name}
                            </h3>
                            {league.description && (
                                <p className="text-text-muted text-xs mt-1 line-clamp-2 leading-relaxed">
                                    {league.description}
                                </p>
                            )}
                        </div>
                    </div>
                    {/* Edit / Delete */}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onEdit(league)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/10 transition-all"
                        >
                            <Edit2 size={13} />
                        </button>
                        <button
                            onClick={() => onDelete(league)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap gap-3 text-[10px] font-bold text-text-muted uppercase tracking-wide">
                    {league.regionId && (
                        <span className="flex items-center gap-1">
                            <Globe size={10} style={{ color: lc.hex }} /> {league.regionId}
                        </span>
                    )}
                    {/* Assuming gameId here is what you want to keep. If you want to remove it, let me know. */}
                </div>

                {/* CTA */}
                <button
                    onClick={() => onManage(league)}
                    className={cn(
                        'mt-auto flex items-center justify-between gap-2 w-full px-4 py-2.5 rounded-xl',
                        'text-[11px] font-black uppercase tracking-widest transition-all duration-200',
                        'bg-white/5 border border-white/8 text-text-muted',
                        'hover:bg-primary/10 hover:border-primary/30 hover:text-primary',
                    )}
                >
                    <div className="flex items-center gap-2">
                        <Trophy size={12} />
                        Manage League
                    </div>
                    <ChevronRight size={12} />
                </button>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminLeagues() {
    const navigate = useNavigate();
    const [leagues, setLeagues] = useState<League[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [levelFilter, setLevelFilter] = useState<LeagueLevel | 'all'>('all');
    const [showModal, setShowModal] = useState(false);
    const [editingLeague, setEditingLeague] = useState<League | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

    const notify = (msg: string, type: 'ok' | 'err' = 'ok') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchLeagues = useCallback(async () => {
        setLoading(true);
        try { setLeagues(await leagueService.getAllLeagues()); }
        catch (e) { notify(apiErr(e), 'err'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchLeagues(); }, []);

    const handleSubmit = async (data: CreateLeaguePayload | FormData) => {
        try {
            if (editingLeague) {
                await leagueService.updateLeague(editingLeague._id, data);
                notify('League updated');
                setShowModal(false);
                setEditingLeague(null);
                await fetchLeagues();
            } else {
                const created = await leagueService.createLeague(data) as { _id: string };
                setShowModal(false);
                navigate(`/admin/leagues/${created._id}`);
            }
        } catch (e) { notify(apiErr(e), 'err'); throw e; }
    };

    const handleDelete = async (league: League) => {
        if (!confirm(`Delete "${league.name}"? This cannot be undone.`)) return;
        try {
            await leagueService.deleteLeague(league._id);
            notify('League deleted');
            await fetchLeagues();
        } catch (e) { notify(apiErr(e), 'err'); }
    };

    const filtered = leagues.filter(l =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (levelFilter === 'all' || l.level === levelFilter)
    );

    const isLeagueLevel = (value: string): value is LeagueLevel =>
        Object.values(LeagueLevel).includes(value as LeagueLevel);

    const counts = Object.fromEntries(
        ([...Object.values(LeagueLevel), 'all'] as string[]).map(lv => [
            lv,
            lv === 'all' ? leagues.length : leagues.filter(l => l.level === lv).length,
        ])
    );

    return (
        <div className="space-y-6">
            {toast && <Toast {...toast} />}

            {/* ── Page header ─────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white">
                        League Hub
                    </h1>
                    <p className="text-text-muted text-sm mt-0.5">
                        {leagues.length} league{leagues.length !== 1 ? 's' : ''} · click any card to manage seasons, rounds &amp; matches
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/admin/leagues/workflow')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-text-muted hover:text-white hover:bg-white/10 transition-all"
                    >
                        <Zap size={13} /> Workflow Guide
                    </button>
                    <button
                        onClick={() => { setEditingLeague(null); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90 transition-all"
                    >
                        <Plus size={13} /> Create League
                    </button>
                </div>
            </div>

            {/* ── Filters ─────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-3 items-center">
                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search leagues…"
                        className="w-full pl-9 pr-3 py-2 bg-surface border border-white/8 rounded-xl text-sm text-white placeholder-text-muted focus:border-primary/40 outline-none"
                    />
                </div>
                {/* Level filter pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {(['all', ...Object.values(LeagueLevel)] as string[]).map(lv => (
                        <button
                            key={lv}
                            onClick={() => setLevelFilter(lv === 'all' ? 'all' : (isLeagueLevel(lv) ? lv : 'all'))}
                            className={cn(
                                'px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all',
                                levelFilter === lv
                                    ? 'bg-primary text-black border-primary'
                                    : 'bg-white/5 border-white/10 text-text-muted hover:text-white'
                            )}
                        >
                            {lv} {counts[lv] !== undefined && <span className="opacity-60">({counts[lv]})</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Grid ────────────────────────────────────────────────── */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Trophy className="w-16 h-16 text-text-muted mb-4 opacity-15" />
                    <p className="text-white font-black text-xl uppercase tracking-widest mb-2">No leagues found</p>
                    <p className="text-text-muted text-sm mb-6">
                        {searchQuery || levelFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first league to get started'}
                    </p>
                    {!searchQuery && levelFilter === 'all' && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90 transition-all"
                        >
                            <Plus size={14} /> Create First League
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {filtered.map(league => (
                        <LeagueCard
                            key={league._id}
                            league={league}
                            onEdit={l => { setEditingLeague(l); setShowModal(true); }}
                            onDelete={handleDelete}
                            onManage={l => navigate(`/admin/leagues/${l._id}`)}
                        />
                    ))}

                    {/* Add league card */}
                    <button
                        onClick={() => { setEditingLeague(null); setShowModal(true); }}
                        className="border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 text-text-muted hover:text-white hover:border-white/25 hover:bg-white/[0.02] transition-all min-h-[200px] group"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/30 transition-all">
                            <Plus size={20} className="group-hover:text-primary transition-colors" />
                        </div>
                        <div className="text-center">
                            <p className="text-[11px] font-black uppercase tracking-widest">New League</p>
                            <p className="text-[10px] mt-0.5 opacity-60">Click to create</p>
                        </div>
                    </button>
                </div>
            )}

            {/* Quick stats — mirrors filter levels (ALL is only in pills; here: total + each LeagueLevel) */}
            {leagues.length > 0 && (
                <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-6 sm:grid-cols-3 lg:grid-cols-5">
                    <div className="bg-surface border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                        <span className="text-white opacity-60"><Trophy size={14} /></span>
                        <div>
                            <p className="text-2xl font-black text-white">{leagues.length}</p>
                            <p className="text-text-muted text-[10px] uppercase tracking-widest">Total</p>
                        </div>
                    </div>
                    {(Object.keys(LeagueLevel) as (keyof typeof LeagueLevel)[]).map(key => {
                        const level = LeagueLevel[key];
                        const meta = LEVEL_QUICK_STAT[level];
                        const val = leagues.filter(l => l.level === level).length;
                        return (
                            <div key={level} className="bg-surface border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                                <span className={cn('opacity-60', meta.color)}>{meta.icon}</span>
                                <div>
                                    <p className={cn('text-2xl font-black', meta.color)}>{val}</p>
                                    <p className="text-text-muted text-[10px] uppercase tracking-widest">{meta.label}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <CreateLeagueModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingLeague(null); }}
                onSubmit={handleSubmit}
                league={editingLeague}
            />
        </div>
    );
}
