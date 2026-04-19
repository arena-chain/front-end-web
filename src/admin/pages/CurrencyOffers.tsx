import { useCallback, useEffect, useMemo, useState } from 'react';
import { Coins, Plus, Trash2 } from 'lucide-react';
import { fetchGameTokenConfig, type CurrencyPackRow, type GameTokenConfig } from '../../services/gameToken.service';
import { readLocalCurrencyPacks, saveLocalCurrencyPacks } from '../../lib/localCurrencyPacks';
import { cn } from '../../lib/utils';

function newLocalPackId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `local-${crypto.randomUUID()}`;
    return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function CurrencyOffers() {
    const [config, setConfig] = useState<GameTokenConfig | null>(null);

    const [packs, setPacks] = useState<CurrencyPackRow[]>(() => readLocalCurrencyPacks());
    const [draft, setDraft] = useState({
        title: '',
        description: '',
        grantWholeTokens: '',
        priceMajor: '4.99',
        priceCurrency: 'EUR',
        sortOrder: '0',
    });

    const loadConfig = useCallback(async () => {
        try {
            const c = await fetchGameTokenConfig();
            setConfig(c);
        } catch {
            setConfig(null);
        }
    }, []);

    useEffect(() => {
        void loadConfig();
    }, [loadConfig]);

    useEffect(() => {
        saveLocalCurrencyPacks(packs);
    }, [packs]);

    const sym = config?.symbol ?? 'GTK';

    const sorted = useMemo(
        () => [...packs].sort((a, b) => (a.sortOrder - b.sortOrder) || (a.grantWholeTokens - b.grantWholeTokens)),
        [packs],
    );

    const addPack = () => {
        const title = draft.title.trim();
        const grant = Math.floor(Number(draft.grantWholeTokens));
        const major = parseFloat(String(draft.priceMajor).replace(',', '.'));
        if (!title || !Number.isFinite(grant) || grant <= 0) return;
        const priceCents = Number.isFinite(major) ? Math.max(0, Math.round(major * 100)) : 0;
        const sortOrder = Number.isFinite(Number(draft.sortOrder)) ? Number(draft.sortOrder) : 0;
        const row: CurrencyPackRow = {
            id: newLocalPackId(),
            title,
            description: draft.description.trim() || null,
            grantWholeTokens: grant,
            priceCents,
            priceCurrency: draft.priceCurrency.trim().toUpperCase() || 'EUR',
            active: true,
            sortOrder,
        };
        setPacks((prev) => [...prev, row]);
        setDraft({
            title: '',
            description: '',
            grantWholeTokens: '',
            priceMajor: '4.99',
            priceCurrency: 'EUR',
            sortOrder: String(sortOrder + 10),
        });
    };

    const removePack = (id: string) => setPacks((prev) => prev.filter((r) => r.id !== id));

    const toggleActive = (id: string) =>
        setPacks((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Coins className="text-primary w-7 h-7" />
                    Currency offer setup
                </h1>
            </div>

            <section className="rounded-2xl border border-white/10 bg-surface overflow-hidden">
                <div className="p-5 border-b border-white/10 space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-white/50">Store packs (local)</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
                        <div className="lg:col-span-3">
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">
                                Title
                            </label>
                            <input
                                value={draft.title}
                                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                                placeholder="Starter pack"
                                className="w-full rounded-xl bg-[#1a1e28] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-primary/40"
                            />
                        </div>
                        <div className="lg:col-span-2">
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">
                                Grant ({sym})
                            </label>
                            <input
                                value={draft.grantWholeTokens}
                                onChange={(e) => setDraft((d) => ({ ...d, grantWholeTokens: e.target.value }))}
                                placeholder="500"
                                className="w-full rounded-xl bg-[#1a1e28] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-primary/40"
                            />
                        </div>
                        <div className="lg:col-span-2">
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">
                                Price (major units)
                            </label>
                            <input
                                value={draft.priceMajor}
                                onChange={(e) => setDraft((d) => ({ ...d, priceMajor: e.target.value }))}
                                placeholder="4.99"
                                className="w-full rounded-xl bg-[#1a1e28] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-primary/40"
                            />
                        </div>
                        <div className="lg:col-span-2">
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">
                                Currency
                            </label>
                            <select
                                value={draft.priceCurrency}
                                onChange={(e) => setDraft((d) => ({ ...d, priceCurrency: e.target.value }))}
                                className="w-full rounded-xl bg-[#1a1e28] border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/40"
                            >
                                {['EUR', 'USD', 'GBP', 'TND'].map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="lg:col-span-1">
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">
                                Sort
                            </label>
                            <input
                                value={draft.sortOrder}
                                onChange={(e) => setDraft((d) => ({ ...d, sortOrder: e.target.value }))}
                                className="w-full rounded-xl bg-[#1a1e28] border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/40"
                            />
                        </div>
                        <div className="lg:col-span-2">
                            <button
                                type="button"
                                onClick={addPack}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-bold py-2 hover:bg-primary/20"
                            >
                                <Plus className="w-4 h-4" />
                                Add pack
                            </button>
                        </div>
                        <div className="lg:col-span-12">
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">
                                Description (optional)
                            </label>
                            <input
                                value={draft.description}
                                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                                placeholder="Shown on the player card"
                                className="w-full rounded-xl bg-[#1a1e28] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-primary/40"
                            />
                        </div>
                    </div>
                </div>

                {sorted.length === 0 ? (
                    <p className="p-8 text-text-muted text-sm">No packs yet. Add one above — they appear as cards in the player wallet modal.</p>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-text-muted">
                                <th className="px-4 py-3 font-medium">Active</th>
                                <th className="px-4 py-3 font-medium">Title</th>
                                <th className="px-4 py-3 font-medium">Grant</th>
                                <th className="px-4 py-3 font-medium">Price</th>
                                <th className="px-4 py-3 font-medium">Sort</th>
                                <th className="px-4 py-3 font-medium w-[100px]" />
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((row) => (
                                <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                    <td className="px-4 py-3">
                                        <button
                                            type="button"
                                            onClick={() => toggleActive(row.id)}
                                            className={cn(
                                                'text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-lg border',
                                                row.active
                                                    ? 'border-primary/40 text-primary bg-primary/10'
                                                    : 'border-white/10 text-white/40',
                                            )}
                                        >
                                            {row.active ? 'On' : 'Off'}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-white">{row.title}</td>
                                    <td className="px-4 py-3 font-mono text-white/90">
                                        {row.grantWholeTokens} {sym}
                                    </td>
                                    <td className="px-4 py-3 text-text-muted">
                                        {(row.priceCents / 100).toFixed(2)} {row.priceCurrency}
                                    </td>
                                    <td className="px-4 py-3 text-text-muted">{row.sortOrder}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            type="button"
                                            onClick={() => removePack(row.id)}
                                            className="inline-flex items-center gap-1 text-red-400/70 hover:text-red-400 text-xs font-bold"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
}
