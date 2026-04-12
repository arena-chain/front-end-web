import { useState } from 'react';
import { Swords, Plus, Calendar, Clock, X, Check, Users } from 'lucide-react';

interface Scrim {
    id: string;
    opponent: string;
    date: string;
    time: string;
    game: string;
    format: string;
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
    notes?: string;
}

const MOCK_SCRIMS: Scrim[] = [
    { id: '1', opponent: 'Team Nova',    date: '2026-02-22', time: '20:00', game: 'Valorant', format: 'BO3', status: 'CONFIRMED' },
    { id: '2', opponent: 'Shadow Squad', date: '2026-02-25', time: '19:00', game: 'CS2',      format: 'BO3', status: 'PENDING',   notes: 'Waiting for confirmation' },
    { id: '3', opponent: 'Alpha Rush',   date: '2026-02-15', time: '18:00', game: 'Valorant', format: 'BO5', status: 'COMPLETED' },
];

const STATUS_STYLES: Record<string, string> = {
    PENDING:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    CONFIRMED: 'bg-primary/10 text-primary border-primary/20',
    COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    CANCELLED: 'bg-white/5 text-text-muted border-white/10',
};

const EMPTY_FORM = { opponent: '', date: '', time: '', game: 'Valorant', format: 'BO3', notes: '' };

export default function ManagerScrims() {
    const [scrims, setScrims]     = useState<Scrim[]>(MOCK_SCRIMS);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm]         = useState({ ...EMPTY_FORM });
    const [toast, setToast]       = useState('');

    const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const handleCreate = () => {
        if (!form.opponent.trim() || !form.date || !form.time) return notify('Fill all required fields');
        const scrim: Scrim = {
            id: Date.now().toString(),
            ...form,
            status: 'PENDING',
        };
        setScrims(s => [scrim, ...s]);
        setForm({ ...EMPTY_FORM });
        setShowForm(false);
        notify('Scrim scheduled!');
    };

    const handleCancel = (id: string) =>
        setScrims(s => s.map(sc => sc.id === id ? { ...sc, status: 'CANCELLED' } : sc));

    const handleConfirm = (id: string) =>
        setScrims(s => s.map(sc => sc.id === id ? { ...sc, status: 'CONFIRMED' } : sc));

    const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const upcoming  = scrims.filter(s => s.status !== 'COMPLETED' && s.status !== 'CANCELLED');
    const past      = scrims.filter(s => s.status === 'COMPLETED' || s.status === 'CANCELLED');

    return (
        <div className="space-y-6">
            {toast && (
                <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-sm font-medium bg-emerald-900/90 text-emerald-200 border border-emerald-500/40">
                    <Check className="w-4 h-4" />{toast}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                        <Swords className="w-6 h-6 text-rose-400" /> Scrims
                    </h1>
                    <p className="text-text-muted text-sm mt-1">Schedule and track practice matches</p>
                </div>
                <button onClick={() => setShowForm(v => !v)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-black font-bold text-sm hover:bg-primary-light transition-colors">
                    {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showForm ? 'Cancel' : 'Schedule Scrim'}
                </button>
            </div>

            {/* Create form */}
            {showForm && (
                <div className="bg-surface border border-white/5 rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">New Scrim</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Opponent Team *</label>
                            <div className="relative">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input value={form.opponent} onChange={e => setForm(f => ({ ...f, opponent: e.target.value }))}
                                    placeholder="Opponent name…"
                                    className="w-full pl-9 pr-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-text-muted outline-none focus:border-primary/50" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Date *</label>
                            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-primary/50" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Time *</label>
                            <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-primary/50" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Game</label>
                            <select value={form.game} onChange={e => setForm(f => ({ ...f, game: e.target.value }))}
                                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-primary/50">
                                {['Valorant', 'CS2', 'League of Legends', 'Rocket League', 'Other'].map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Format</label>
                            <select value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value }))}
                                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-primary/50">
                                {['BO1', 'BO3', 'BO5'].map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2 md:col-span-3">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Notes</label>
                            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                placeholder="Optional notes…"
                                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-text-muted outline-none focus:border-primary/50" />
                        </div>
                    </div>
                    <button onClick={handleCreate}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-black font-bold text-sm hover:bg-primary-light transition-colors">
                        <Plus className="w-4 h-4" /> Schedule
                    </button>
                </div>
            )}

            {/* Upcoming */}
            {upcoming.length > 0 && (
                <div className="space-y-2">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted px-1">Upcoming</h2>
                    {upcoming.map(s => (
                        <ScrimCard key={s.id} scrim={s} fmt={fmt} onCancel={handleCancel} onConfirm={handleConfirm} />
                    ))}
                </div>
            )}

            {/* Past */}
            {past.length > 0 && (
                <div className="space-y-2">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted px-1">Past</h2>
                    {past.map(s => (
                        <ScrimCard key={s.id} scrim={s} fmt={fmt} onCancel={handleCancel} onConfirm={handleConfirm} />
                    ))}
                </div>
            )}

            {scrims.length === 0 && (
                <div className="bg-surface border border-white/5 rounded-xl p-12 text-center text-text-muted">
                    <Swords className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No scrims scheduled yet</p>
                </div>
            )}
        </div>
    );
}

function ScrimCard({ scrim: s, fmt, onCancel, onConfirm }: {
    scrim: Scrim;
    fmt: (d: string) => string;
    onCancel: (id: string) => void;
    onConfirm: (id: string) => void;
}) {
    return (
        <div className="bg-surface border border-white/5 rounded-xl px-5 py-4 flex items-center justify-between gap-4 hover:border-white/10 transition-all">
            <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                    <Swords className="w-5 h-5 text-rose-400" />
                </div>
                <div className="min-w-0">
                    <p className="text-white font-bold text-sm">vs {s.opponent}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-text-muted">
                            <Calendar className="w-3 h-3" />{fmt(s.date)}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-text-muted">
                            <Clock className="w-3 h-3" />{s.time}
                        </span>
                        <span className="text-xs text-text-muted">{s.game} · {s.format}</span>
                    </div>
                    {s.notes && <p className="text-xs text-text-muted mt-0.5 italic">{s.notes}</p>}
                </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${STATUS_STYLES[s.status]}`}>
                    {s.status}
                </span>
                {s.status === 'PENDING' && (
                    <button onClick={() => onConfirm(s.id)}
                        className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20">
                        <Check className="w-3.5 h-3.5" />
                    </button>
                )}
                {(s.status === 'PENDING' || s.status === 'CONFIRMED') && (
                    <button onClick={() => onCancel(s.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors border border-white/5 hover:border-red-500/20">
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}
