import { useState, useEffect, useCallback } from 'react';
import {
    Handshake, Plus, Trash2, Edit2, ExternalLink,
    Globe, Tag, Search, Building2, X, Check, AlertCircle,
} from 'lucide-react';
import {
    partnershipService,
    Partnership,
    CreatePartnershipDto,
    PartnerType,
} from '../../services/partnershipService';

const PARTNER_TYPES: PartnerType[] = [
    'Title Sponsor',
    'Event Sponsor',
    'Platform Sponsor',
    'Media Partner',
];

const TYPE_COLORS: Record<PartnerType, string> = {
    'Title Sponsor':    'bg-amber-500/20 text-amber-300 border-amber-500/30',
    'Event Sponsor':    'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'Platform Sponsor': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'Media Partner':    'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

interface Toast { msg: string; ok: boolean }

const EMPTY_FORM: CreatePartnershipDto = {
    name: '', logo: '', type: 'Event Sponsor', website: '', description: '',
};

export default function PartnershipsPage() {
    const [partners, setPartners]     = useState<Partnership[]>([]);
    const [loading, setLoading]       = useState(true);
    const [search, setSearch]         = useState('');
    const [filterType, setFilterType] = useState<PartnerType | 'ALL'>('ALL');
    const [toast, setToast]           = useState<Toast | null>(null);
    const [showForm, setShowForm]     = useState(false);
    const [editing, setEditing]       = useState<Partnership | null>(null);
    const [form, setForm]             = useState<CreatePartnershipDto>(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);

    const notify = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    };

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setPartners(await partnershipService.getAll());
        } catch {
            notify('Failed to load partnerships', false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };
    const openEdit   = (p: Partnership) => {
        setEditing(p);
        setForm({ name: p.name, logo: p.logo || '', type: p.type, website: p.website || '', description: p.description || '' });
        setShowForm(true);
    };
    const closeForm = () => { setShowForm(false); setEditing(null); };

    const handleSubmit = async () => {
        if (!form.name.trim()) return notify('Name is required', false);
        try {
            setSubmitting(true);
            if (editing) {
                await partnershipService.update(editing._id, form);
                notify('Partner updated');
            } else {
                await partnershipService.create(form);
                notify('Partner created');
            }
            closeForm();
            load();
        } catch {
            notify('Save failed', false);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (p: Partnership) => {
        if (!confirm(`Delete "${p.name}"?`)) return;
        try {
            await partnershipService.delete(p._id);
            notify('Deleted');
            load();
        } catch {
            notify('Delete failed', false);
        }
    };

    const visible = partners.filter(p => {
        if (filterType !== 'ALL' && p.type !== filterType) return false;
        if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-6 p-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-sm font-medium border transition-all
                    ${toast.ok ? 'bg-emerald-900/90 text-emerald-200 border-emerald-500/40' : 'bg-red-900/90 text-red-200 border-red-500/40'}`}>
                    {toast.ok ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                        <Handshake className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Partnerships</h1>
                        <p className="text-sm text-slate-400">Sponsors &amp; media partners</p>
                    </div>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition-colors">
                    <Plus className="w-4 h-4" /> Add Partner
                </button>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PARTNER_TYPES.map(t => {
                    const count = partners.filter(p => p.type === t).length;
                    return (
                        <div key={t} className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4">
                            <p className="text-xs text-slate-500 mb-1">{t}</p>
                            <p className="text-2xl font-bold text-white">{count}</p>
                        </div>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search partners…"
                        className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                    />
                </div>
                <select value={filterType} onChange={e => setFilterType(e.target.value as PartnerType | 'ALL')}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none">
                    <option value="ALL">All Types</option>
                    {PARTNER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-slate-500 text-sm text-center py-16">Loading…</div>
            ) : visible.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                    <Handshake className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No partners found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visible.map(p => (
                        <PartnerCard key={p._id} partner={p} onEdit={openEdit} onDelete={handleDelete} />
                    ))}
                </div>
            )}

            {/* Modal */}
            {showForm && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-white font-semibold text-lg">
                                {editing ? 'Edit Partner' : 'Add Partner'}
                            </h2>
                            <button onClick={closeForm}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
                        </div>

                        <div className="space-y-4">
                            <Field label="Name *">
                                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    className="input-field" placeholder="e.g. Intel" />
                            </Field>
                            <Field label="Type">
                                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as PartnerType }))}
                                    className="input-field">
                                    {PARTNER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </Field>
                            <Field label="Logo URL">
                                <input value={form.logo} onChange={e => setForm(f => ({ ...f, logo: e.target.value }))}
                                    className="input-field" placeholder="https://…" />
                            </Field>
                            <Field label="Website">
                                <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                                    className="input-field" placeholder="https://…" />
                            </Field>
                            <Field label="Description">
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    rows={3} className="input-field resize-none" placeholder="Short description…" />
                            </Field>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={closeForm}
                                className="flex-1 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white text-sm transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSubmit} disabled={submitting}
                                className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold disabled:opacity-50 transition-colors">
                                {submitting ? 'Saving…' : editing ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function PartnerCard({ partner: p, onEdit, onDelete }: {
    partner: Partnership;
    onEdit: (p: Partnership) => void;
    onDelete: (p: Partnership) => void;
}) {
    return (
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl overflow-hidden hover:border-amber-500/30 transition-all group">
            <div className="h-1.5 bg-gradient-to-r from-amber-500/60 via-amber-400/40 to-transparent" />
            <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        {p.logo ? (
                            <img src={p.logo} alt={p.name} className="w-12 h-12 object-contain rounded-lg bg-slate-700 p-1" />
                        ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-slate-500" />
                            </div>
                        )}
                        <div>
                            <h3 className="text-white font-semibold text-sm">{p.name}</h3>
                            <span className={`inline-block text-xs px-2 py-0.5 rounded-full border mt-1 ${TYPE_COLORS[p.type]}`}>
                                {p.type}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEdit(p)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onDelete(p)} className="p-1.5 rounded-lg hover:bg-red-900/40 text-slate-400 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {p.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>
                )}

                {p.website && (
                    <a href={p.website} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                        <Globe className="w-3 h-3" />
                        {p.website.replace(/^https?:\/\//, '')}
                        <ExternalLink className="w-3 h-3" />
                    </a>
                )}

                <div className="flex items-center gap-2 pt-1 border-t border-slate-700/60">
                    <Tag className="w-3 h-3 text-slate-500" />
                    <span className="text-xs text-slate-500 font-mono">{p._id.slice(-8)}</span>
                </div>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
            {children}
        </div>
    );
}
