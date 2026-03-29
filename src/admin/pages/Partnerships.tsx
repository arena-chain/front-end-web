import { useState, useEffect, useCallback } from 'react';
import {
    Handshake, Plus, Trash2, Edit2, ExternalLink,
    Globe, Tag, Search, Building2, X, Check, AlertCircle,
} from 'lucide-react';
import {
    partnershipService,
    type Partnership,
    type CreatePartnershipDto,
    type PartnerType,
} from '../../services/partnershipService';

const PARTNER_TYPES: PartnerType[] = [
    'Event Sponsor',
    'Platform Sponsor',
];
const TYPE_COLORS: Record<PartnerType, string> = {
    'Title Sponsor': 'bg-primary/10 text-primary border-primary/20',
    'Event Sponsor': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'Platform Sponsor': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Media Partner': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

interface Toast { msg: string; ok: boolean }

const EMPTY_FORM: CreatePartnershipDto = {
    name: '', logo: '', type: 'Event Sponsor', website: '', description: '',
};

export default function PartnershipsPage() {
    const [partners, setPartners] = useState<Partnership[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<PartnerType | 'ALL'>('ALL');
    const [toast, setToast] = useState<Toast | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Partnership | null>(null);
    const [form, setForm] = useState<CreatePartnershipDto>(EMPTY_FORM);
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
    const openEdit = (p: Partnership) => {
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
        <div className="space-y-6 p-6 h-full min-h-0 overflow-y-auto animate-fade-in-up">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-sm font-black uppercase tracking-widest border transition-all
                    ${toast.ok ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {toast.ok ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0" style={{ boxShadow: '0 0 20px rgba(var(--primary), 0.15)' }}>
                        <Handshake className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter text-white leading-none mb-1">Partnerships</h1>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Sponsors &amp; media partners</p>
                    </div>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5">
                    <Plus className="w-4 h-4" /> Add Partner
                </button>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {PARTNER_TYPES.map(t => {
                    const count = partners.filter(p => p.type === t).length;
                    return (
                        <div key={t} className="bg-[#0f0f10] border border-white/[0.06] rounded-2xl p-5 relative overflow-hidden group hover:border-white/10 transition-colors">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 relative z-10">{t}</p>
                            <p className="text-3xl font-black text-white relative z-10">{count}</p>
                        </div>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search partners…"
                        className="w-full pl-11 pr-4 py-3 bg-[#0f0f10] border border-white/[0.06] rounded-2xl text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                    />
                </div>
                <div className="relative shrink-0">
                    <select value={filterType} onChange={e => setFilterType(e.target.value as PartnerType | 'ALL')}
                        className="w-full sm:w-48 pl-4 pr-10 py-3 bg-[#0f0f10] border border-white/[0.06] rounded-2xl text-[11px] font-black uppercase tracking-widest text-white appearance-none focus:outline-none focus:border-primary/50 transition-all cursor-pointer">
                        <option value="ALL">All Types</option>
                        {PARTNER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="w-2 h-2 border-b-2 border-r-2 border-white/40 transform rotate-45" />
                    </div>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
            ) : visible.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-[#0f0f10] border border-white/[0.04] rounded-3xl">
                    <Handshake className="w-16 h-16 text-white/10 mb-4" />
                    <p className="text-sm font-black uppercase tracking-widest text-white/40">No partners found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {visible.map(p => (
                        <PartnerCard key={p._id} partner={p} onEdit={openEdit} onDelete={handleDelete} />
                    ))}
                </div>
            )}

            {/* Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeForm} />

                    <div className="relative bg-[#09090b] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in-up">
                        <div className="flex items-center justify-between p-6 border-b border-white/[0.06] shrink-0 bg-[#0f0f10]/50">
                            <h2 className="text-lg font-black uppercase tracking-tighter text-white">
                                {editing ? 'Edit Partner' : 'Add Partner'}
                            </h2>
                            <button onClick={closeForm} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                                <X className="w-4 h-4 text-white/70" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto min-h-0 space-y-6 custom-scrollbar">
                            <Field label="Name *">
                                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.04] transition-all"
                                    placeholder="e.g. Intel" />
                            </Field>
                            <Field label="Type">
                                <div className="relative">
                                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as PartnerType }))}
                                        className="w-full pl-4 pr-10 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-[11px] font-black uppercase tracking-widest text-white appearance-none focus:outline-none focus:border-primary/50 focus:bg-white/[0.04] transition-all cursor-pointer">
                                        {PARTNER_TYPES.map(t => <option key={t} value={t} className="bg-[#0f0f10]">{t}</option>)}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <div className="w-2 h-2 border-b-2 border-r-2 border-white/40 transform rotate-45" />
                                    </div>
                                </div>
                            </Field>
                            <Field label="Logo *">
                                <div className="flex items-start gap-4 mt-1">
                                    {form.logo ? (
                                        <div className="w-16 h-16 rounded-xl bg-white/[0.02] border border-white/[0.06] p-2 shrink-0 flex items-center justify-center overflow-hidden">
                                            <img src={form.logo} alt="Preview" className="w-full h-full object-contain" />
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 rounded-xl bg-white/[0.02] border border-white/[0.04] border-dashed shrink-0 flex items-center justify-center">
                                            <Building2 className="w-6 h-6 text-white/20" />
                                        </div>
                                    )}
                                    <div className="flex-1 space-y-2">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setForm(f => ({ ...f, logo: reader.result as string }));
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            className="block w-full text-xs text-white/60
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-xl file:border-0
                                                file:text-[10px] file:font-black file:uppercase file:tracking-widest
                                                file:bg-primary/10 file:text-primary
                                                hover:file:bg-primary/20 cursor-pointer
                                                file:cursor-pointer file:transition-colors"
                                        />
                                        {form.logo && (
                                            <button
                                                type="button"
                                                onClick={() => setForm(f => ({ ...f, logo: '' }))}
                                                className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                Remove image
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </Field>
                            <Field label="Website">
                                <div className="relative">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                    <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                                        className="w-full pl-11 pr-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.04] transition-all"
                                        placeholder="https://…" />
                                </div>
                            </Field>
                            <Field label="Description">
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.04] transition-all resize-none custom-scrollbar"
                                    placeholder="Short description…" />
                            </Field>
                        </div>

                        <div className="p-6 border-t border-white/[0.06] shrink-0 bg-[#0f0f10]/50 flex gap-3">
                            <button onClick={closeForm}
                                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[11px] font-black uppercase tracking-widest transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSubmit} disabled={submitting}
                                className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-black uppercase tracking-widest disabled:opacity-50 transition-all shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5">
                                {submitting ? 'Saving…' : editing ? 'Update Partner' : 'Create Partner'}
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
        <div className="bg-[#0f0f10] border border-white/[0.06] rounded-3xl overflow-hidden hover:border-primary/30 transition-all duration-300 group shadow-lg hover:shadow-primary/10 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/60 via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="p-6 space-y-5 relative z-10">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-4">
                        {p.logo ? (
                            <img src={p.logo} alt={p.name} className="w-14 h-14 object-contain rounded-2xl bg-white/[0.02] border border-white/[0.06] p-2" />
                        ) : (
                            <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-white/20" />
                            </div>
                        )}
                        <div>
                            <h3 className="text-white font-black text-lg tracking-tight mb-1">{p.name}</h3>
                            <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border mt-0.5 ${TYPE_COLORS[p.type]}`}>
                                {p.type}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <button onClick={() => onEdit(p)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onDelete(p)} className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-transparent hover:border-red-500/20 text-red-500/60 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {p.description && (
                    <p className="text-xs text-white/50 font-medium line-clamp-2 leading-relaxed">{p.description}</p>
                )}

                {p.website && (
                    <a href={p.website} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary transition-colors">
                        <Globe className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate max-w-[180px]">{p.website.replace(/^https?:\/\//, '')}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                )}

                <div className="flex items-center gap-2 pt-4 border-t border-white/[0.06]">
                    <Tag className="w-3 h-3 text-white/20" />
                    <span className="text-[10px] font-bold tracking-widest text-white/20 font-mono uppercase">ID: {p._id.slice(-8)}</span>
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
