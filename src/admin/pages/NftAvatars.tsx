import { useState, useEffect } from 'react';
import {
    Gem, Plus, Trash2, X, UserPlus, Search,
    Sparkles, Crown, Star, Diamond,
} from 'lucide-react';
import { nftService } from '../../services/nftService';
import type { NftAvatar, NftRarity, CreateNftDto } from '../../services/nftService';
import { UserService } from '../../services/userService';

const RARITY_STYLES: Record<NftRarity, { bg: string; border: string; text: string; glow: string; badge: string }> = {
    COMMON:    { bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', text: 'text-zinc-400', glow: '', badge: 'bg-zinc-500/20 text-zinc-400' },
    RARE:      { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]', badge: 'bg-blue-500/20 text-blue-400' },
    EPIC:      { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', glow: 'shadow-[0_0_20px_rgba(139,92,246,0.2)]', badge: 'bg-violet-500/20 text-violet-400' },
    LEGENDARY: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', glow: 'shadow-[0_0_25px_rgba(245,158,11,0.25)]', badge: 'bg-amber-500/20 text-amber-400' },
};

const RARITY_ICON: Record<NftRarity, React.ReactNode> = {
    COMMON: <Star size={12} />,
    RARE: <Sparkles size={12} />,
    EPIC: <Crown size={12} />,
    LEGENDARY: <Diamond size={12} />,
};

const DEMO_NFTS: NftAvatar[] = [
    { _id: 'd1', name: 'Shadow Reaper', image: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=shadow', description: 'A dark warrior from the void', rarity: 'LEGENDARY', price: 500, listed: false, createdAt: new Date().toISOString() },
    { _id: 'd2', name: 'Cyber Samurai', image: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=cyber', description: 'Futuristic blade master', rarity: 'EPIC', price: 300, listed: false, createdAt: new Date().toISOString() },
    { _id: 'd3', name: 'Neon Fox', image: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=neon', description: 'Fast and cunning digital fox', rarity: 'RARE', price: 150, listed: true, listPrice: 200, createdAt: new Date().toISOString() },
    { _id: 'd4', name: 'Iron Guard', image: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=iron', description: 'Unbreakable protector', rarity: 'COMMON', price: 50, assignedTo: { _id: 'p1', username: 'ShadowBlade' }, listed: false, createdAt: new Date().toISOString() },
    { _id: 'd5', name: 'Phoenix Wing', image: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=phoenix', description: 'Rises from the ashes', rarity: 'LEGENDARY', price: 750, listed: true, listPrice: 900, createdAt: new Date().toISOString() },
    { _id: 'd6', name: 'Frost Mage', image: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=frost', description: 'Master of ice magic', rarity: 'EPIC', price: 280, assignedTo: { _id: 'p2', username: 'NeonPhoenix' }, listed: false, createdAt: new Date().toISOString() },
];

export default function NftAvatars() {
    const [nfts, setNfts] = useState<NftAvatar[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showAssign, setShowAssign] = useState<NftAvatar | null>(null);
    const [search, setSearch] = useState('');
    const [filterRarity, setFilterRarity] = useState<NftRarity | 'ALL'>('ALL');

    const loadNfts = async () => {
        try {
            setLoading(true);
            const data = await nftService.getAll();
            setNfts(data.length > 0 ? data : DEMO_NFTS);
        } catch {
            setNfts(DEMO_NFTS);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadNfts(); }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this NFT avatar?')) return;
        try {
            await nftService.delete(id);
            setNfts(prev => prev.filter(n => n._id !== id));
        } catch (e) {
            console.error('Delete failed', e);
        }
    };

    const filtered = nfts.filter(n => {
        if (filterRarity !== 'ALL' && n.rarity !== filterRarity) return false;
        if (search && !n.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const stats = {
        total: nfts.length,
        assigned: nfts.filter(n => n.assignedTo).length,
        listed: nfts.filter(n => n.listed).length,
        legendary: nfts.filter(n => n.rarity === 'LEGENDARY').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <Gem size={24} className="text-violet-400" />
                        NFT Avatars
                    </h1>
                    <p className="text-text-muted text-sm mt-1">Create, manage, and assign NFT avatars to players</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-black bg-primary hover:bg-primary/90 transition-all shrink-0"
                >
                    <Plus size={16} /> Create NFT
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total NFTs', value: stats.total, color: 'text-white' },
                    { label: 'Assigned', value: stats.assigned, color: 'text-primary' },
                    { label: 'Listed', value: stats.listed, color: 'text-blue-400' },
                    { label: 'Legendary', value: stats.legendary, color: 'text-amber-400' },
                ].map(s => (
                    <div key={s.label} className="bg-surface border border-white/5 rounded-xl p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{s.label}</p>
                        <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search NFTs..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-surface border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-text-muted/50 focus:border-primary/50 outline-none"
                    />
                </div>
                <div className="flex items-center gap-1 bg-surface border border-white/5 rounded-xl p-1">
                    {(['ALL', 'COMMON', 'RARE', 'EPIC', 'LEGENDARY'] as const).map(r => (
                        <button
                            key={r}
                            onClick={() => setFilterRarity(r)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterRarity === r
                                ? 'bg-white/10 text-white'
                                : 'text-text-muted hover:text-white'
                            }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-primary text-sm font-bold text-center py-16 animate-pulse">Loading NFTs…</div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-surface border border-white/5 rounded-2xl">
                    <Gem className="w-12 h-12 text-violet-400 opacity-20 mb-4" />
                    <p className="text-white font-black text-lg uppercase tracking-widest mb-1">No NFTs Found</p>
                    <p className="text-text-muted text-sm">Create your first NFT avatar or adjust filters</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map(nft => {
                        const rs = RARITY_STYLES[nft.rarity];
                        return (
                            <div key={nft._id} className={`group relative border rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] ${rs.border} ${rs.bg} ${rs.glow}`}>
                                {/* Image */}
                                <div className="relative aspect-square bg-black/40 p-6 flex items-center justify-center">
                                    <img
                                        src={nft.image}
                                        alt={nft.name}
                                        className="w-full h-full object-contain drop-shadow-lg"
                                        onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${nft.name}`; }}
                                    />
                                    {/* Rarity badge */}
                                    <span className={`absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${rs.badge}`}>
                                        {RARITY_ICON[nft.rarity]} {nft.rarity}
                                    </span>
                                    {/* Listed badge */}
                                    {nft.listed && (
                                        <span className="absolute top-3 right-3 bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                            Listed
                                        </span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-4 space-y-3">
                                    <div>
                                        <h3 className="text-white font-black text-sm">{nft.name}</h3>
                                        <p className="text-text-muted text-[11px] mt-0.5 line-clamp-2">{nft.description}</p>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-primary font-black text-sm">{nft.price} AC</span>
                                        {nft.assignedTo && (
                                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                → {typeof nft.assignedTo === 'string' ? `…${nft.assignedTo.slice(-6)}` : nft.assignedTo.username}
                                            </span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-1">
                                        <button
                                            onClick={() => setShowAssign(nft)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest transition-all"
                                        >
                                            <UserPlus size={12} /> Assign
                                        </button>
                                        <button
                                            onClick={() => handleDelete(nft._id)}
                                            className="flex items-center justify-center px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Modal */}
            {showCreate && <CreateNftModal onClose={() => setShowCreate(false)} onCreated={(nft) => { setNfts(prev => [nft, ...prev]); setShowCreate(false); }} />}

            {/* Assign Modal */}
            {showAssign && <AssignNftModal nft={showAssign} onClose={() => setShowAssign(null)} onAssigned={(updated) => { setNfts(prev => prev.map(n => n._id === updated._id ? updated : n)); setShowAssign(null); }} />}
        </div>
    );
}

// ─── Create NFT Modal ────────────────────────────────────────────────────────

function CreateNftModal({ onClose, onCreated }: { onClose: () => void; onCreated: (nft: NftAvatar) => void }) {
    const [form, setForm] = useState<CreateNftDto>({
        name: '', image: '', description: '', rarity: 'COMMON', price: 100,
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        if (!form.name || !form.image) return;
        try {
            setSaving(true);
            const nft = await nftService.create(form);
            onCreated(nft);
        } catch (e) {
            console.error('Create failed', e);
        } finally {
            setSaving(false);
        }
    };

    const previewSrc = form.image || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${form.name || 'preview'}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                    <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-2">
                        <Gem size={18} className="text-violet-400" /> Create NFT Avatar
                    </h2>
                    <button onClick={onClose} className="text-text-muted hover:text-white transition-colors"><X size={20} /></button>
                </div>

                {/* Preview */}
                <div className="flex justify-center">
                    <div className="w-32 h-32 rounded-2xl bg-black/40 border border-white/10 p-4 flex items-center justify-center">
                        <img src={previewSrc} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Name</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="e.g. Shadow Reaper"
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-text-muted/40 focus:border-primary/50 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Image URL</label>
                        <input
                            type="text"
                            value={form.image}
                            onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                            placeholder="https://... or leave empty for auto-generated"
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-text-muted/40 focus:border-primary/50 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Description</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="Short description..."
                            rows={2}
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-text-muted/40 focus:border-primary/50 outline-none resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Rarity</label>
                        <div className="grid grid-cols-4 gap-2">
                            {(['COMMON', 'RARE', 'EPIC', 'LEGENDARY'] as NftRarity[]).map(r => {
                                const rs = RARITY_STYLES[r];
                                return (
                                    <button
                                        key={r}
                                        onClick={() => setForm(f => ({ ...f, rarity: r }))}
                                        className={`py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${form.rarity === r
                                            ? `${rs.bg} ${rs.text} ${rs.border}`
                                            : 'bg-black/30 text-text-muted border-white/10 hover:border-white/20'
                                        }`}
                                    >
                                        {RARITY_ICON[r]} {r}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Price (AC)</label>
                        <input
                            type="number"
                            min={0}
                            value={form.price}
                            onChange={e => setForm(f => ({ ...f, price: +e.target.value }))}
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                        />
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white text-sm font-bold transition-all">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving || !form.name}
                        className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-black text-sm font-black uppercase tracking-wider disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {saving ? 'Creating…' : <><Plus size={14} /> Create</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Assign NFT Modal ────────────────────────────────────────────────────────

function AssignNftModal({ nft, onClose, onAssigned }: { nft: NftAvatar; onClose: () => void; onAssigned: (nft: NftAvatar) => void }) {
    const [playerId, setPlayerId] = useState('');
    const [players, setPlayers] = useState<{ _id: string; username: string }[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [saving, setSaving] = useState(false);
    const [loadingPlayers, setLoadingPlayers] = useState(true);

    useEffect(() => {
        UserService.getAllUsers()
            .then((users: any[]) => {
                setPlayers(users
                    .filter((u: any) => u.role === 'player' || u.role === 'PLAYER')
                    .map((u: any) => ({ _id: u._id, username: u.username || u.email }))
                );
            })
            .catch(() => {
                setPlayers([
                    { _id: 'p1', username: 'ShadowBlade' },
                    { _id: 'p2', username: 'NeonPhoenix' },
                    { _id: 'p3', username: 'VoidHunter' },
                    { _id: 'p4', username: 'CyberWolf' },
                ]);
            })
            .finally(() => setLoadingPlayers(false));
    }, []);

    const filteredPlayers = players.filter(p =>
        p.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAssign = async () => {
        if (!playerId) return;
        try {
            setSaving(true);
            const updated = await nftService.assign({ nftId: nft._id, playerId });
            onAssigned(updated);
        } catch (e) {
            console.error('Assign failed', e);
        } finally {
            setSaving(false);
        }
    };

    const rs = RARITY_STYLES[nft.rarity];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
                <div className="flex items-center justify-between">
                    <h2 className="text-white font-black uppercase tracking-widest flex items-center gap-2">
                        <UserPlus size={18} className="text-primary" /> Assign NFT
                    </h2>
                    <button onClick={onClose} className="text-text-muted hover:text-white transition-colors"><X size={20} /></button>
                </div>

                {/* NFT preview */}
                <div className={`flex items-center gap-4 p-3 rounded-xl border ${rs.border} ${rs.bg}`}>
                    <img src={nft.image} alt={nft.name} className="w-14 h-14 rounded-xl object-contain bg-black/30 p-2" />
                    <div>
                        <p className="text-white font-black text-sm">{nft.name}</p>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${rs.text}`}>{nft.rarity}</span>
                    </div>
                </div>

                {/* Player search */}
                <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Select Player</label>
                    <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search players..."
                            className="w-full bg-black/30 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-text-muted/40 focus:border-primary/50 outline-none"
                        />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1 bg-black/20 rounded-xl p-2">
                        {loadingPlayers ? (
                            <p className="text-text-muted text-xs text-center py-4 animate-pulse">Loading players…</p>
                        ) : filteredPlayers.length === 0 ? (
                            <p className="text-text-muted text-xs text-center py-4">No players found</p>
                        ) : filteredPlayers.map(p => (
                            <button
                                key={p._id}
                                onClick={() => setPlayerId(p._id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all ${playerId === p._id
                                    ? 'bg-primary/15 text-primary border border-primary/30'
                                    : 'text-text-muted hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <div className="w-6 h-6 rounded-full bg-surface border border-white/10 flex items-center justify-center text-[9px] font-black">
                                    {p.username[0].toUpperCase()}
                                </div>
                                {p.username}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white text-sm font-bold transition-all">Cancel</button>
                    <button
                        onClick={handleAssign}
                        disabled={saving || !playerId}
                        className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-black text-sm font-black uppercase tracking-wider disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {saving ? 'Assigning…' : <><UserPlus size={14} /> Assign</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
