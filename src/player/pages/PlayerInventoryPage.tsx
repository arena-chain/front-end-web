import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Package,
    Clapperboard,
    Loader2,
    Copy,
    ExternalLink,
    Shield,
    Wrench,
    Save,
    Trash2,
    ShoppingBag,
    Layers,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import {
    nftInventoryApi,
    nftTemplateImage,
    resolveInventoryFileUrl,
    type AssetPreset,
    type CatalogGame,
    type GameAssetFile,
    type InventoryDoc,
    type NftItemOwned,
    type NftTemplate,
} from '../../services/nftInventoryApi';

type TabId = 'assets' | 'templates' | 'inventory' | 'presets';

function itemName(item: NftItemOwned): string {
    const nft = item.nftId;
    if (nft && typeof nft === 'object' && 'name' in nft) {
        return String((nft as NftTemplate).name);
    }
    return 'Item';
}

function itemCategory(item: NftItemOwned): string {
    const nft = item.nftId;
    if (nft && typeof nft === 'object' && 'category' in nft) {
        return String((nft as NftTemplate).category || '—');
    }
    return '—';
}

export default function PlayerInventoryPage() {
    const [tab, setTab] = useState<TabId>('inventory');
    const [loading, setLoading] = useState(false);

    const [assets, setAssets] = useState<GameAssetFile[]>([]);
    const [catalog, setCatalog] = useState<CatalogGame[]>([]);
    const [gameId, setGameId] = useState('');
    const [templates, setTemplates] = useState<NftTemplate[]>([]);
    const [inventory, setInventory] = useState<InventoryDoc | null>(null);
    const [presets, setPresets] = useState<AssetPreset[]>([]);

    const [equipItemId, setEquipItemId] = useState<string | null>(null);
    const [equipSlot, setEquipSlot] = useState('weapon');

    const [presetName, setPresetName] = useState('');
    const [presetAssetPath, setPresetAssetPath] = useState('');
    const [presetBaseNft, setPresetBaseNft] = useState('');

    const [craftBaseNft, setCraftBaseNft] = useState('');
    const [craftJson, setCraftJson] = useState('{}');
    const [craftName, setCraftName] = useState('');

    const [listModal, setListModal] = useState<NftItemOwned | null>(null);
    const [listPrice, setListPrice] = useState('10');

    const loadAssets = useCallback(async () => {
        try {
            const res = await nftInventoryApi.getGameAssets();
            setAssets(res.files || []);
        } catch (e) {
            console.error(e);
            toast.error('Could not load game assets (is the backend running?)');
            setAssets([]);
        }
    }, []);

    const loadCatalog = useCallback(async () => {
        try {
            const c = await nftInventoryApi.getCatalog();
            setCatalog(Array.isArray(c) ? c : []);
        } catch {
            setCatalog([]);
        }
    }, []);

    const loadTemplates = useCallback(async () => {
        try {
            const list = await nftInventoryApi.getNftTemplates({
                gameId: gameId || undefined,
            });
            setTemplates(Array.isArray(list) ? list : []);
        } catch {
            setTemplates([]);
        }
    }, [gameId]);

    const loadInventory = useCallback(async () => {
        try {
            const inv = await nftInventoryApi.getMyInventory();
            setInventory(inv);
        } catch (e) {
            console.error(e);
            toast.error('Sign in required or inventory unavailable');
            setInventory(null);
        }
    }, []);

    const loadPresets = useCallback(async () => {
        try {
            const p = await nftInventoryApi.getMyPresets();
            setPresets(Array.isArray(p) ? p : []);
        } catch {
            setPresets([]);
        }
    }, []);

    useEffect(() => {
        void loadCatalog();
    }, [loadCatalog]);

    useEffect(() => {
        setLoading(true);
        const run = async () => {
            try {
                if (tab === 'assets') await loadAssets();
                if (tab === 'templates') await loadTemplates();
                if (tab === 'inventory') await loadInventory();
                if (tab === 'presets') await loadPresets();
            } finally {
                setLoading(false);
            }
        };
        void run();
    }, [tab, loadAssets, loadTemplates, loadInventory, loadPresets]);

    useEffect(() => {
        if (tab === 'templates') void loadTemplates();
    }, [gameId, tab, loadTemplates]);

    async function handleEquip() {
        if (!equipItemId) return;
        try {
            await nftInventoryApi.equip(equipItemId, equipSlot);
            toast.success('Equipped');
            setEquipItemId(null);
            await loadInventory();
        } catch (e: unknown) {
            const msg = e && typeof e === 'object' && 'response' in e
                ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message)
                : 'Equip failed';
            toast.error(msg || 'Equip failed');
        }
    }

    async function handleUnequip(id: string) {
        try {
            await nftInventoryApi.unequip(id);
            toast.success('Unequipped');
            await loadInventory();
        } catch {
            toast.error('Unequip failed');
        }
    }

    async function handleRemove(id: string) {
        if (!confirm('Remove from inventory?')) return;
        try {
            await nftInventoryApi.removeFromInventory(id);
            toast.success('Removed');
            await loadInventory();
        } catch {
            toast.error('Remove failed');
        }
    }

    async function handleCreatePreset() {
        if (!presetName.trim()) {
            toast.error('Name required');
            return;
        }
        try {
            await nftInventoryApi.createPreset({
                name: presetName.trim(),
                assetPath: presetAssetPath || undefined,
                baseNftId: presetBaseNft || undefined,
                config: { note: 'Edit from studio' },
            });
            toast.success('Preset saved');
            setPresetName('');
            setPresetAssetPath('');
            setPresetBaseNft('');
            await loadPresets();
        } catch {
            toast.error('Could not save preset');
        }
    }

    async function handleCraftNft() {
        if (!craftBaseNft) {
            toast.error('Pick a base NFT template id');
            return;
        }
        let config: Record<string, unknown> = {};
        try {
            config = JSON.parse(craftJson || '{}') as Record<string, unknown>;
        } catch {
            toast.error('Config must be valid JSON');
            return;
        }
        try {
            await nftInventoryApi.saveConfiguredAsItem({
                baseNftId: craftBaseNft,
                config,
                displayName: craftName || undefined,
            });
            toast.success('Saved as NFT item — check Inventory tab');
            await loadInventory();
        } catch (e: unknown) {
            const msg = e && typeof e === 'object' && 'response' in e
                ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message)
                : 'Save failed';
            toast.error(msg || 'Save failed');
        }
    }

    async function handleListForSale() {
        if (!listModal) return;
        const price = parseFloat(listPrice);
        if (Number.isNaN(price) || price < 0) {
            toast.error('Invalid price');
            return;
        }
        try {
            await nftInventoryApi.listItemForSale(listModal._id, price, 'USD');
            toast.success('Listed on marketplace');
            setListModal(null);
            await loadInventory();
        } catch (e: unknown) {
            const msg = e && typeof e === 'object' && 'response' in e
                ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message)
                : 'List failed';
            toast.error(msg || 'List failed');
        }
    }

    const tabs: { id: TabId; label: string; icon: typeof Package }[] = [
        { id: 'inventory', label: 'NFT inventory', icon: Shield },
        { id: 'assets', label: 'Raw assets', icon: Package },
        { id: 'templates', label: 'NFT templates', icon: Layers },
        { id: 'presets', label: 'Saved presets', icon: Save },
    ];

    return (
        <div className="mx-auto max-w-6xl space-y-8 pb-16">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/80">Studio</p>
                    <h1 className="mt-1 text-2xl font-black italic tracking-tight text-white md:text-3xl">
                        Inventory & NFT loadout
                    </h1>
                    <p className="mt-2 max-w-xl text-sm text-white/45">
                        Browse files from the backend, your equipped items, templates, and non-NFT presets. Link this page from Channel studio when configuring avatars or weapons.
                    </p>
                </div>
                <Link
                    to="/player/channel"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-widest text-white/70 transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                >
                    <Clapperboard size={16} />
                    Back to channel studio
                </Link>
            </div>

            <div className="flex flex-wrap gap-2">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        className={cn(
                            'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[11px] font-black uppercase tracking-wider transition-all',
                            tab === t.id
                                ? 'border-primary/40 bg-primary/15 text-primary shadow-[0_0_20px_rgba(0,255,136,0.12)]'
                                : 'border-white/10 bg-[#0f1114] text-white/45 hover:border-white/20 hover:text-white',
                        )}
                    >
                        <t.icon size={16} />
                        {t.label}
                    </button>
                ))}
            </div>

            {loading && (
                <div className="flex items-center gap-2 text-sm text-white/40">
                    <Loader2 className="animate-spin" size={18} />
                    Loading…
                </div>
            )}

            {!loading && tab === 'assets' && (
                <section className="rounded-3xl border border-white/10 bg-[#0c0e11]/80 p-6">
                    <h2 className="text-sm font-black uppercase tracking-widest text-white/80">Server inventory files</h2>
                    <p className="mt-1 text-xs text-white/40">
                        URLs use <code className="rounded bg-white/10 px-1">/inventory-files/…</code> on the API host (no{' '}
                        <code className="rounded bg-white/10 px-1">/api</code> prefix).
                    </p>
                    <div className="mt-4 max-h-[480px] overflow-auto rounded-2xl border border-white/5">
                        <table className="w-full text-left text-xs">
                            <thead className="sticky top-0 bg-[#12141a] text-[10px] font-black uppercase tracking-wider text-white/35">
                                <tr>
                                    <th className="p-3">File</th>
                                    <th className="p-3">Game / folder</th>
                                    <th className="p-3">Open</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assets.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-white/35">
                                            No files found. Add assets under <code className="text-primary/80">src/inventory</code> on the
                                            backend and restart.
                                        </td>
                                    </tr>
                                ) : (
                                    assets.map((f) => (
                                        <tr key={f.relativePath} className="border-t border-white/5 text-white/70">
                                            <td className="p-3 font-mono text-[11px]">{f.relativePath}</td>
                                            <td className="p-3 text-white/50">
                                                {f.subFolder ? `${f.rootFolder} / ${f.subFolder}` : f.rootFolder}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-bold uppercase text-primary hover:bg-primary/10"
                                                        onClick={() => {
                                                            void navigator.clipboard.writeText(resolveInventoryFileUrl(f.urlPath));
                                                            toast.success('URL copied');
                                                        }}
                                                    >
                                                        <Copy className="mr-1 inline" size={12} />
                                                        Copy URL
                                                    </button>
                                                    <a
                                                        href={resolveInventoryFileUrl(f.urlPath)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-bold uppercase text-white/60 hover:text-white"
                                                    >
                                                        <ExternalLink className="mr-1 inline" size={12} />
                                                        Open
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {!loading && tab === 'templates' && (
                <section className="space-y-4 rounded-3xl border border-white/10 bg-[#0c0e11]/80 p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-sm font-black uppercase tracking-widest text-white/80">NFT templates</h2>
                        <select
                            value={gameId}
                            onChange={(e) => setGameId(e.target.value)}
                            className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-xs text-white"
                        >
                            <option value="">All games</option>
                            {catalog.map((g) => (
                                <option key={g._id} value={g._id}>
                                    {g.title}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {templates.map((nft) => (
                            <div
                                key={nft._id}
                                className="rounded-2xl border border-white/10 bg-black/30 p-4"
                            >
                                <img
                                    src={nftTemplateImage(nft)}
                                    alt=""
                                    className="mb-3 h-28 w-full rounded-xl object-cover"
                                />
                                <p className="text-sm font-black text-white">{nft.name}</p>
                                <p className="text-[10px] uppercase tracking-wider text-white/35">{nft.category}</p>
                                <p className="mt-2 font-mono text-[10px] text-primary/80">_id: {nft._id}</p>
                                {(nft.metadata as { modelUrl?: string } | undefined)?.modelUrl && (
                                    <p className="mt-1 truncate text-[10px] text-white/40">
                                        model: {String((nft.metadata as { modelUrl: string }).modelUrl)}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                    {templates.length === 0 && (
                        <p className="text-center text-sm text-white/35">No NFT templates. Create some in Admin → NFT manager.</p>
                    )}

                    <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                            <Wrench size={14} />
                            Save configuration as NFT item
                        </h3>
                        <p className="mt-1 text-[11px] text-white/45">
                            Uses <code className="rounded bg-black/40 px-1">POST /api/nft/items/save-configured</code>. Paste a template{' '}
                            <code className="rounded bg-black/40 px-1">_id</code> from the cards above.
                        </p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <input
                                placeholder="baseNftId"
                                value={craftBaseNft}
                                onChange={(e) => setCraftBaseNft(e.target.value)}
                                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-white"
                            />
                            <input
                                placeholder="Display name (optional)"
                                value={craftName}
                                onChange={(e) => setCraftName(e.target.value)}
                                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white"
                            />
                        </div>
                        <textarea
                            value={craftJson}
                            onChange={(e) => setCraftJson(e.target.value)}
                            rows={4}
                            className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-[11px] text-white"
                        />
                        <button
                            type="button"
                            onClick={() => void handleCraftNft()}
                            className="mt-3 rounded-xl bg-primary px-5 py-2.5 text-xs font-black uppercase tracking-widest text-black"
                        >
                            Create owned item
                        </button>
                    </div>
                </section>
            )}

            {!loading && tab === 'inventory' && (
                <section className="space-y-6">
                    <div className="rounded-3xl border border-white/10 bg-[#0c0e11]/80 p-6">
                        <h2 className="text-sm font-black uppercase tracking-widest text-white/80">Equipped</h2>
                        <div className="mt-4 flex flex-wrap gap-3">
                            {(inventory?.equippedItems || []).length === 0 ? (
                                <p className="text-sm text-white/35">Nothing equipped.</p>
                            ) : (
                                inventory!.equippedItems.map((eq) => {
                                    const raw = eq.nftItemId;
                                    const it = typeof raw === 'object' && raw && '_id' in raw ? (raw as NftItemOwned) : null;
                                    const id = it?._id || String(raw);
                                    return (
                                        <div
                                            key={id + eq.slot}
                                            className="flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3"
                                        >
                                            <div>
                                                <p className="text-xs font-black uppercase text-primary">{eq.slot}</p>
                                                <p className="text-sm text-white">{it ? itemName(it) : id}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => void handleUnequip(id)}
                                                className="ml-auto text-[10px] font-black uppercase text-white/50 hover:text-white"
                                            >
                                                Unequip
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-[#0c0e11]/80 p-6">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-sm font-black uppercase tracking-widest text-white/80">All items</h2>
                            <Link
                                to="/player/marketplace"
                                className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-primary hover:underline"
                            >
                                <ShoppingBag size={14} />
                                Marketplace
                            </Link>
                        </div>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            {(inventory?.items || []).map((it) => (
                                <div
                                    key={it._id}
                                    className="flex gap-4 rounded-2xl border border-white/10 bg-black/30 p-4"
                                >
                                    <img
                                        src={nftTemplateImage(
                                            typeof it.nftId === 'object' ? (it.nftId as NftTemplate) : undefined,
                                        )}
                                        alt=""
                                        className="h-20 w-20 shrink-0 rounded-xl object-cover"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-black text-white">{itemName(it)}</p>
                                        <p className="text-[10px] uppercase text-white/35">{itemCategory(it)} · {it.status}</p>
                                        <p className="mt-1 font-mono text-[9px] text-white/25">{it._id}</p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {it.status !== 'LISTED' && (
                                                <button
                                                    type="button"
                                                    onClick={() => setEquipItemId(it._id)}
                                                    className="rounded-lg border border-white/15 px-2 py-1 text-[10px] font-black uppercase text-primary hover:bg-primary/10"
                                                >
                                                    Equip…
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setListModal(it)}
                                                className="rounded-lg border border-white/15 px-2 py-1 text-[10px] font-black uppercase text-white/60 hover:text-white"
                                            >
                                                List sale
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void handleRemove(it._id)}
                                                className="rounded-lg border border-red-500/20 px-2 py-1 text-[10px] font-black uppercase text-red-400/80 hover:bg-red-500/10"
                                            >
                                                <Trash2 className="mr-1 inline" size={12} />
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {(inventory?.items || []).length === 0 && (
                            <p className="mt-4 text-center text-sm text-white/35">
                                No items yet. Use templates tab to craft an item, or receive an airdrop from admin.
                            </p>
                        )}
                    </div>
                </section>
            )}

            {!loading && tab === 'presets' && (
                <section className="space-y-6 rounded-3xl border border-white/10 bg-[#0c0e11]/80 p-6">
                    <h2 className="text-sm font-black uppercase tracking-widest text-white/80">Non-NFT presets</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <input
                            placeholder="Preset name"
                            value={presetName}
                            onChange={(e) => setPresetName(e.target.value)}
                            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                        />
                        <input
                            placeholder="assetPath (e.g. weapens/cs2/foo.glb)"
                            value={presetAssetPath}
                            onChange={(e) => setPresetAssetPath(e.target.value)}
                            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-white"
                        />
                        <input
                            placeholder="baseNftId (optional)"
                            value={presetBaseNft}
                            onChange={(e) => setPresetBaseNft(e.target.value)}
                            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-white sm:col-span-2"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => void handleCreatePreset()}
                        className="rounded-xl bg-white/10 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-white/15"
                    >
                        Save preset
                    </button>

                    <ul className="mt-6 space-y-2">
                        {presets.map((p) => (
                            <li
                                key={p._id}
                                className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-3"
                            >
                                <div>
                                    <p className="font-bold text-white">{p.name}</p>
                                    <p className="text-[10px] text-white/35">{p.assetPath || '—'}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            await nftInventoryApi.deletePreset(p._id);
                                            toast.success('Deleted');
                                            await loadPresets();
                                        } catch {
                                            toast.error('Delete failed');
                                        }
                                    }}
                                    className="text-[10px] font-black uppercase text-red-400"
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {equipItemId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#12141a] p-6 shadow-2xl">
                        <p className="text-sm font-black text-white">Equip item</p>
                        <p className="mt-1 text-xs text-white/40">Slot name (e.g. weapon, avatar, accessory)</p>
                        <input
                            value={equipSlot}
                            onChange={(e) => setEquipSlot(e.target.value)}
                            className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setEquipItemId(null)}
                                className="rounded-xl px-4 py-2 text-xs font-black uppercase text-white/50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleEquip()}
                                className="rounded-xl bg-primary px-4 py-2 text-xs font-black uppercase text-black"
                            >
                                Equip
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {listModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#12141a] p-6 shadow-2xl">
                        <p className="text-sm font-black text-white">List for sale</p>
                        <p className="mt-1 truncate text-xs text-white/45">{itemName(listModal)}</p>
                        <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={listPrice}
                            onChange={(e) => setListPrice(e.target.value)}
                            className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setListModal(null)}
                                className="rounded-xl px-4 py-2 text-xs font-black uppercase text-white/50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleListForSale()}
                                className="rounded-xl bg-primary px-4 py-2 text-xs font-black uppercase text-black"
                            >
                                List
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
