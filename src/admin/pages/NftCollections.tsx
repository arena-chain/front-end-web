import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, X, Folder, Layers, Package, Trash2,
    Edit3, Eye, ToggleLeft, ToggleRight, Loader2,
} from 'lucide-react';
import {
    nftCollectionService,
    COLLECTION_CATEGORIES,
    type NftCollection,
    type CollectionCategory,
} from '../../services/nftAdminService';

export default function NftCollections() {
    const navigate = useNavigate();
    const [collections, setCollections] = useState<NftCollection[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState<CollectionCategory | 'ALL'>('ALL');
    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] = useState<NftCollection | null>(null);

    const load = async () => {
        try {
            setLoading(true);
            const data = await nftCollectionService.getAll(filterCat === 'ALL' ? undefined : filterCat);
            setCollections(data);
        } catch (e) {
            console.error('Failed to load collections', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [filterCat]);

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this collection? It must be empty.')) return;
        try {
            await nftCollectionService.delete(id);
            setCollections(prev => prev.filter(c => c._id !== id));
        } catch (e: unknown) {
            alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Delete failed');
        }
    };

    const handleToggle = async (col: NftCollection) => {
        try {
            const updated = await nftCollectionService.update(col._id, { isActive: !col.isActive });
            setCollections(prev => prev.map(c => c._id === col._id ? updated : c));
        } catch (e) {
            console.error('Toggle failed', e);
        }
    };

    const filtered = collections.filter(c =>
        !search || c.name.toLowerCase().includes(search.toLowerCase())
    );

    const CAT_ICONS: Record<string, string> = {
        AVATARS: '👤', WEAPONS: '⚔️', SKINS: '🎨', CHARACTERS: '🧙', BADGES: '🏅',
        TROPHIES: '🏆', ARMOR: '🛡️', ACCESSORIES: '💍', MIXED: '📦',
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <Layers size={24} className="text-primary" />
                        NFT Collections
                    </h1>
                    <p className="text-text-muted text-sm mt-1">Manage themed NFT collections for your games</p>
                </div>
                <button
                    onClick={() => { setEditTarget(null); setShowCreate(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-black text-sm font-black uppercase tracking-wider transition-all"
                >
                    <Plus size={16} /> New Collection
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search collections..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-surface border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-text-muted/50 focus:border-primary/50 outline-none"
                    />
                </div>
                <div className="flex items-center gap-1 bg-surface border border-white/5 rounded-xl p-1 overflow-x-auto">
                    <button
                        onClick={() => setFilterCat('ALL')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterCat === 'ALL' ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'}`}
                    >
                        All
                    </button>
                    {COLLECTION_CATEGORIES.map(cat => (
                        <button
                            key={cat.value}
                            onClick={() => setFilterCat(cat.value)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterCat === cat.value ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'}`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={24} className="animate-spin text-primary" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-surface border border-white/5 rounded-2xl">
                    <Folder className="w-12 h-12 text-primary opacity-20 mb-4" />
                    <p className="text-white font-black text-lg">No collections found</p>
                    <p className="text-text-muted text-sm mt-1">Create your first collection to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map(col => (
                        <div
                            key={col._id}
                            className="group bg-[#111214] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all duration-300"
                        >
                            {/* Cover */}
                            <div className="relative h-32 bg-gradient-to-br from-primary/10 via-violet-500/10 to-blue-500/10 flex items-center justify-center">
                                <span className="text-5xl">{CAT_ICONS[col.category] || '📦'}</span>
                                <div className="absolute top-3 right-3 flex gap-1.5">
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${col.isActive ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-400'}`}>
                                        {col.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <span className="absolute bottom-2 left-3 px-2 py-0.5 rounded-lg bg-black/40 backdrop-blur-sm text-[9px] font-bold text-white uppercase tracking-widest">
                                    {col.category}
                                </span>
                            </div>

                            {/* Info */}
                            <div className="p-4 space-y-3">
                                <div>
                                    <h3 className="text-white font-black text-sm truncate">{col.name}</h3>
                                    <p className="text-text-muted text-[11px] mt-0.5 line-clamp-2">{col.description || 'No description'}</p>
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-text-muted font-bold">
                                    <span>Minted: <span className="text-white">{col.totalMinted}</span></span>
                                    <span>Max: <span className="text-white">{col.maxSupply === 0 ? '∞' : col.maxSupply}</span></span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => navigate(`/admin/nft-manager?collectionId=${col._id}`)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        <Eye size={12} /> View NFTs
                                    </button>
                                    <button
                                        onClick={() => { setEditTarget(col); setShowCreate(true); }}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 hover:bg-white/5 text-text-muted hover:text-white transition-all"
                                    >
                                        <Edit3 size={13} />
                                    </button>
                                    <button
                                        onClick={() => handleToggle(col)}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 hover:bg-white/5 text-text-muted hover:text-white transition-all"
                                        title={col.isActive ? 'Deactivate' : 'Activate'}
                                    >
                                        {col.isActive ? <ToggleRight size={13} className="text-primary" /> : <ToggleLeft size={13} />}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(col._id)}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-red-500/20 hover:bg-red-500/10 text-red-400 transition-all"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showCreate && (
                <CollectionModal
                    existing={editTarget}
                    onClose={() => setShowCreate(false)}
                    onSaved={() => { setShowCreate(false); load(); }}
                />
            )}
        </div>
    );
}

// ─── Create/Edit Modal ───────────────────────────────────────────────────────

function CollectionModal({ existing, onClose, onSaved }: {
    existing: NftCollection | null; onClose: () => void; onSaved: () => void;
}) {
    const [form, setForm] = useState({
        name: existing?.name ?? '',
        description: existing?.description ?? '',
        category: existing?.category ?? ('AVATARS' as CollectionCategory),
        maxSupply: existing?.maxSupply ?? 0,
        isActive: existing?.isActive ?? true,
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!form.name.trim()) return;
        try {
            setSaving(true);
            if (existing) {
                await nftCollectionService.update(existing._id, form);
            } else {
                await nftCollectionService.create(form);
            }
            onSaved();
        } catch (e: unknown) {
            alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
                <div className="flex items-center justify-between">
                    <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-2">
                        <Package size={18} className="text-primary" />
                        {existing ? 'Edit Collection' : 'New Collection'}
                    </h2>
                    <button onClick={onClose} className="text-text-muted hover:text-white transition-colors"><X size={20} /></button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Name *</label>
                        <input
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                            placeholder="e.g. Dragon Weapons Season 1"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Description</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary/50 outline-none resize-none h-20"
                            placeholder="Describe this collection..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Category</label>
                            <select
                                value={form.category}
                                onChange={e => setForm(f => ({ ...f, category: e.target.value as CollectionCategory }))}
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                            >
                                {COLLECTION_CATEGORIES.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Max Supply</label>
                            <input
                                type="number"
                                min={0}
                                value={form.maxSupply}
                                onChange={e => setForm(f => ({ ...f, maxSupply: +e.target.value }))}
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                                placeholder="0 = unlimited"
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                            className="accent-primary w-4 h-4"
                        />
                        <span className="text-sm text-white font-bold">Active</span>
                    </label>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white text-sm font-bold transition-all">Cancel</button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !form.name.trim()}
                        className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-black text-sm font-black uppercase tracking-wider disabled:opacity-50 transition-all"
                    >
                        {saving ? 'Saving…' : existing ? 'Update' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    );
}
