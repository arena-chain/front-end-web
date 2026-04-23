import { useCallback, useEffect, useState } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { vexCurrencyLogo } from '../../assets/vexCurrencyBrand';
import { cn } from '../../lib/utils';
import {
    creditTestGameToken,
    displayTokenName,
    displayTokenSymbol,
    fetchGameTokenConfig,
    fetchGameTokenLedger,
    fetchMyGameToken,
    purchaseSimulatedGameToken,
    spendSimulatedGameToken,
    type GameTokenConfig,
    type GameTokenLedgerItem,
    type GameTokenMe,
} from '../../services/gameToken.service';
import CurrencyPackStorefront from './CurrencyPackStorefront';

function axiosMessage(err: unknown): string {
    if (typeof err === 'object' && err !== null && 'response' in err) {
        const d = (err as { response?: { data?: { message?: string | string[] } } }).response?.data;
        if (typeof d?.message === 'string') return d.message;
        if (Array.isArray(d?.message)) return d.message.join(', ');
    }
    if (err instanceof Error) return err.message;
    return '';
}

function categoryLabelFr(category: string): string {
    const m: Record<string, string> = {
        mint_test: 'Crédit test',
        purchase_simulated: 'Achat (simulation)',
        pack_purchase: 'Achat pack',
        burn_sell: 'Brûlage (vente)',
        spend_simulated: 'Dépense (simulation)',
    };
    return m[category] ?? category;
}

/**
 * Full-page wallet & ledger UI (used on /player/wallet).
 */
export default function GameTokenWalletDashboard() {
    const [vexOfferModalOpen, setVexOfferModalOpen] = useState(false);
    const [vexOfferModalKey, setVexOfferModalKey] = useState(0);
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState<GameTokenConfig | null>(null);
    const [me, setMe] = useState<GameTokenMe | null>(null);
    const [ledger, setLedger] = useState<GameTokenLedgerItem[]>([]);
    const [ledgerTotal, setLedgerTotal] = useState(0);
    const [buyWhole, setBuyWhole] = useState(100);
    const [spendWhole, setSpendWhole] = useState(1);
    const [spendReason, setSpendReason] = useState('');
    const [busy, setBusy] = useState<string | null>(null);

    const refreshBalances = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const [cfg, bal, page] = await Promise.all([
                fetchGameTokenConfig(),
                fetchMyGameToken(),
                fetchGameTokenLedger(1, 30),
            ]);
            setConfig(cfg);
            setMe(bal);
            setLedger(page.items);
            setLedgerTotal(page.total);
        } catch {
            /* keep previous */
        }
    }, []);

    const refresh = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setConfig(null);
            setMe(null);
            setLedger([]);
            setLedgerTotal(0);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [cfg, bal, page] = await Promise.all([
                fetchGameTokenConfig(),
                fetchMyGameToken(),
                fetchGameTokenLedger(1, 30),
            ]);
            setConfig(cfg);
            setMe(bal);
            setLedger(page.items);
            setLedgerTotal(page.total);
        } catch {
            setConfig(null);
            setMe(null);
            setLedger([]);
            setLedgerTotal(0);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    useEffect(() => {
        const onFocus = () => void refresh();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [refresh]);

    useEffect(() => {
        if (!vexOfferModalOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setVexOfferModalOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [vexOfferModalOpen]);

    useEffect(() => {
        if (!vexOfferModalOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [vexOfferModalOpen]);

    const run = async (key: string, fn: () => Promise<void>) => {
        setBusy(key);
        try {
            await fn();
            await refresh();
        } catch (e: unknown) {
            toast.error(axiosMessage(e) || 'Erreur');
        } finally {
            setBusy(null);
        }
    };

    const onPurchase = () =>
        run('buy', async () => {
            await purchaseSimulatedGameToken(buyWhole);
            toast.success(`+${buyWhole} (achat simulation)`);
        });

    const onCreditTest = () =>
        run('credit', async () => {
            await creditTestGameToken(100);
            toast.success('+100 crédit test');
        });

    const onSpendSim = () =>
        run('spend', async () => {
            await spendSimulatedGameToken(spendWhole, spendReason || undefined);
            toast.success(`Dépense simulée : ${spendWhole}`);
        });

    const sym = displayTokenSymbol(config, me);
    const balanceLine =
        me?.balanceFormatted != null ? `${me.balanceFormatted} ${sym}` : config ? `0 ${sym}` : '—';

    const openVexOfferModal = () => {
        setVexOfferModalKey((k) => k + 1);
        setVexOfferModalOpen(true);
    };

    return (
        <div className="space-y-8">
            <div
                className={cn(
                    'relative overflow-hidden rounded-3xl border border-black/20 p-6 md:p-8',
                    /* Same neon palette as app CTAs (--color-primary / primary-dark / primary-light in index.css) */
                    'bg-gradient-to-br from-primary-dark via-primary to-primary-light',
                    'shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0_0_1px_rgba(0,0,0,0.12)]',
                    'motion-safe:animate-glow-breathe',
                )}
            >
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.22] motion-safe:animate-grid-move"
                    style={{
                        backgroundImage: `repeating-linear-gradient(
                            60deg,
                            transparent,
                            transparent 11px,
                            rgba(0, 0, 0, 0.08) 11px,
                            rgba(0, 0, 0, 0.08) 12px
                        ),
                        repeating-linear-gradient(
                            -60deg,
                            transparent,
                            transparent 11px,
                            rgba(255, 255, 255, 0.12) 11px,
                            rgba(255, 255, 255, 0.12) 12px
                        )`,
                    }}
                />
                <div className="pointer-events-none absolute -left-1/4 top-1/2 h-[120%] w-[80%] -translate-y-1/2 motion-safe:animate-spin-slow rounded-full bg-[conic-gradient(from_0deg,transparent,rgba(0,0,0,0.06),transparent,rgba(255,255,255,0.14),transparent)] blur-3xl" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/25" />
                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 flex-1 flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
                        <div className="motion-safe:animate-[float_6s_ease-in-out_infinite] shrink-0 rounded-2xl border border-black/15 bg-black/10 p-2 shadow-[0_8px_24px_rgba(0,0,0,0.2)] ring-1 ring-white/30 backdrop-blur-[2px] sm:p-2.5">
                            <img
                                src={vexCurrencyLogo}
                                alt=""
                                width={88}
                                height={88}
                                className="h-14 w-14 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] sm:h-[4.5rem] sm:w-[4.5rem]"
                                draggable={false}
                            />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-black italic tracking-tight text-black drop-shadow-[0_1px_0_rgba(255,255,255,0.35)] md:text-3xl">
                                Portefeuille
                            </h1>
                            <p className="mt-1 max-w-xl text-sm leading-relaxed text-black/70">
                                Solde {config ? displayTokenName(config) : 'Vex'} sur la chaîne, adresse liée à votre compte, et
                                historique des mouvements.
                            </p>
                        </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                        <button
                            type="button"
                            onClick={openVexOfferModal}
                            className={cn(
                                'inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-black uppercase tracking-widest',
                                'border border-white/15 bg-black text-white',
                                'shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_28px_rgba(0,0,0,0.45)]',
                                'transition-[transform,box-shadow,background-color,border-color] hover:-translate-y-0.5 hover:border-primary/40 hover:bg-zinc-950 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_14px_36px_rgba(0,0,0,0.55)]',
                                'active:translate-y-0 active:scale-[0.99]',
                            )}
                        >
                            <Sparkles className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                            Acheter du VEX
                        </button>
                    </div>
                </div>
            </div>

            {vexOfferModalOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="vex-offer-modal-title"
                >
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        aria-label="Fermer"
                        onClick={() => setVexOfferModalOpen(false)}
                    />
                    <div className="relative z-[1] flex max-h-[min(92vh,880px)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#060708] shadow-[0_0_80px_rgba(0,0,0,0.85)]">
                        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
                            <h2 id="vex-offer-modal-title" className="text-sm font-black uppercase tracking-[0.2em] text-white/80">
                                Offres monnaie
                            </h2>
                            <button
                                type="button"
                                onClick={() => setVexOfferModalOpen(false)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/50 transition-colors hover:border-white/25 hover:bg-white/5 hover:text-white"
                                aria-label="Fermer"
                            >
                                <X size={18} strokeWidth={2.5} />
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6 scrollbar-hide">
                            <p className="mb-5 text-xs text-white/45">
                                Offres publiées par l’administration — appuyez sur le prix pour acheter. Le solde du portefeuille se met à jour après l’achat.
                            </p>
                            <CurrencyPackStorefront
                                key={vexOfferModalKey}
                                variant="showcase"
                                hideHeading
                                onPurchaseSuccess={async () => {
                                    await refreshBalances();
                                    setVexOfferModalOpen(false);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex min-h-[40vh] items-center justify-center text-white/40">
                    <Loader2 className="h-10 w-10 animate-spin" />
                </div>
            ) : !localStorage.getItem('token') ? (
                <p className="text-sm text-white/50">Connectez-vous pour voir votre portefeuille.</p>
            ) : (
                <div className="grid gap-6 lg:grid-cols-12">
                    {/* Balance + actions */}
                    <div className="space-y-5 lg:col-span-5">
                        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-500/15 via-violet-600/10 to-cyan-500/10 p-6 shadow-[0_0_40px_rgba(168,85,247,0.12)]">
                            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-fuchsia-500/20 blur-2xl" />
                            <div className="pointer-events-none absolute -bottom-10 left-0 h-28 w-28 rounded-full bg-cyan-500/15 blur-2xl" />
                            <div className="relative flex items-start gap-3">
                                <img src={vexCurrencyLogo} alt="" width={44} height={44} className="h-11 w-11 shrink-0 object-contain" />
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Solde</p>
                                    <p className="mt-1 text-2xl font-black tabular-nums text-white md:text-3xl">{balanceLine}</p>
                                </div>
                            </div>
                        </div>

                        {me?.linked && (
                            <div className="space-y-4">
                                {me.purchaseSimulationAvailable && (
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                                        <p className="text-[10px] font-black uppercase text-white/50">Achat (simulation)</p>
                                        <div className="flex flex-wrap gap-2">
                                            <input
                                                type="number"
                                                min={1}
                                                className="min-w-[6rem] flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                                                value={buyWhole}
                                                onChange={(e) => setBuyWhole(Number(e.target.value) || 1)}
                                            />
                                            <button
                                                type="button"
                                                disabled={busy === 'buy'}
                                                onClick={() => void onPurchase()}
                                                className="rounded-xl bg-primary px-4 py-2 text-[10px] font-black uppercase text-black disabled:opacity-50"
                                            >
                                                {busy === 'buy' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Acheter'}
                                            </button>
                                        </div>
                                        <p className="text-[9px] text-white/35">
                                            Remplacez par un paiement réel en production — ici le serveur mint seulement.
                                        </p>
                                    </div>
                                )}

                                {me.testCreditMintAvailable &&
                                    (import.meta.env.DEV || import.meta.env.VITE_GTK_ENABLE_TEST_PURCHASE === 'true') && (
                                        <button
                                            type="button"
                                            disabled={busy === 'credit'}
                                            onClick={() => void onCreditTest()}
                                            className="w-full rounded-2xl border border-white/15 py-2.5 text-[10px] font-black uppercase text-primary hover:bg-white/5 disabled:opacity-50"
                                        >
                                            {busy === 'credit' ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : '+100 test API'}
                                        </button>
                                    )}

                                {me.economySpendSimulationAvailable && (
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                                        <p className="text-[10px] font-black uppercase text-white/50">Dépense simulée</p>
                                        <div className="flex flex-wrap gap-2">
                                            <input
                                                type="number"
                                                min={1}
                                                className="w-24 rounded-xl border border-white/10 bg-black/40 px-2 py-2 text-sm text-white"
                                                value={spendWhole}
                                                onChange={(e) => setSpendWhole(Number(e.target.value) || 1)}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Motif (optionnel)"
                                                className="min-w-[8rem] flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white"
                                                value={spendReason}
                                                onChange={(e) => setSpendReason(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                disabled={busy === 'spend'}
                                                onClick={() => void onSpendSim()}
                                                className="rounded-xl border border-white/15 px-3 py-2 text-[10px] font-black uppercase text-white/70 disabled:opacity-50"
                                            >
                                                {busy === 'spend' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'OK'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Activity */}
                    <div className="lg:col-span-7">
                        <div className="rounded-2xl border border-white/10 bg-[#0c0e11]/80 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                            <div className="mb-4 flex items-center justify-between gap-2">
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Activité récente</h2>
                                <span className="text-[10px] text-white/30">{ledgerTotal} entrées</span>
                            </div>
                            {ledger.length === 0 ? (
                                <p className="rounded-xl border border-dashed border-white/10 py-12 text-center text-sm text-white/35">
                                    Aucun mouvement enregistré.
                                </p>
                            ) : (
                                <ul className="max-h-[min(70vh,520px)] space-y-2 overflow-y-auto pr-1 scrollbar-hide">
                                    {ledger.map((row) => (
                                        <li
                                            key={row.id}
                                            className="flex items-start justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/25 px-4 py-3 transition-colors hover:border-white/10"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-baseline gap-2">
                                                    <span
                                                        className={cn(
                                                            'text-sm font-black tabular-nums',
                                                            row.direction === 'in' ? 'text-fuchsia-300' : 'text-orange-300',
                                                        )}
                                                    >
                                                        {row.direction === 'in' ? '+' : '−'}
                                                        {row.amountFormatted} {sym}
                                                    </span>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/35">
                                                        {categoryLabelFr(row.category)}
                                                    </span>
                                                </div>
                                                {row.title ? (
                                                    <p className="mt-1 truncate text-xs text-white/45">{row.title}</p>
                                                ) : null}
                                            </div>
                                            <time className="shrink-0 text-[10px] tabular-nums text-white/25">
                                                {new Date(row.createdAt).toLocaleString()}
                                            </time>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
