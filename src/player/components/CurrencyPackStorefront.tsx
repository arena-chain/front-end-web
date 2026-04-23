import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { vexCurrencyLogo } from '../../assets/vexCurrencyBrand';
import { getApiBase } from '../../lib/apiBase';
import { isLocalCurrencyPackId } from '../../lib/localCurrencyPacks';
import { cn } from '../../lib/utils';
import {
    creditTestGameToken,
    displayTokenSymbol,
    fetchActiveCurrencyPacksDetailed,
    fetchGameTokenConfig,
    fetchMyGameToken,
    purchaseCurrencyPack,
    purchaseSimulatedGameToken,
    type CurrencyPackRow,
    type GameTokenConfig,
    type GameTokenMe,
} from '../../services/gameToken.service';

function axiosMessage(err: unknown): string {
    if (typeof err === 'object' && err !== null && 'response' in err) {
        const d = (err as { response?: { data?: { message?: string | string[] } } }).response?.data;
        if (typeof d?.message === 'string') return d.message;
        if (Array.isArray(d?.message)) return d.message.join(', ');
    }
    if (err instanceof Error) return err.message;
    return '';
}

function axiosStatus(err: unknown): number | null {
    if (typeof err === 'object' && err !== null && 'response' in err) {
        const status = (err as { response?: { status?: unknown } }).response?.status;
        return typeof status === 'number' ? status : null;
    }
    return null;
}

function formatPackPrice(p: CurrencyPackRow): string {
    const n = (p.priceCents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${n} ${p.priceCurrency}`;
}

function packLogoClass(grantWhole: number): string {
    if (grantWhole >= 5000) return 'h-[4.5rem] w-[4.5rem]';
    if (grantWhole >= 2000) return 'h-[4rem] w-[4rem]';
    if (grantWhole >= 500) return 'h-14 w-14';
    return 'h-12 w-12';
}

function packLogoClassShowcase(grantWhole: number): string {
    if (grantWhole >= 5000) return 'h-[7.5rem] w-[7.5rem] sm:h-[8.25rem] sm:w-[8.25rem]';
    if (grantWhole >= 2000) return 'h-28 w-28 sm:h-32 sm:w-32';
    if (grantWhole >= 500) return 'h-24 w-24 sm:h-28 sm:w-28';
    return 'h-[5.5rem] w-[5.5rem] sm:h-24 sm:w-24';
}

function sortPacksForStore(list: CurrencyPackRow[]): CurrencyPackRow[] {
    return [...list].sort((a, b) => (a.sortOrder - b.sortOrder) || (a.grantWholeTokens - b.grantWholeTokens));
}

/** Bonus ribbon vs previous tier (Fortnite-style), only when clearly more currency per step. */
function extraRibbonLabel(prevGrant: number, grant: number): string | null {
    if (prevGrant <= 0 || grant <= prevGrant) return null;
    const pct = Math.round(100 * (grant / prevGrant - 1));
    return pct >= 6 ? `${pct}% EXTRA` : null;
}

/**
 * Admin currency packs (GET /currency/packs + POST purchase).
 * `rail` = compact horizontal strip; `showcase` = large grid cards (e.g. modal chooser).
 */
export default function CurrencyPackStorefront({
    onPurchaseSuccess,
    className,
    variant = 'rail',
    hideHeading = false,
}: {
    onPurchaseSuccess?: () => void | Promise<void>;
    className?: string;
    variant?: 'rail' | 'showcase';
    hideHeading?: boolean;
}) {
    const [config, setConfig] = useState<GameTokenConfig | null>(null);
    const [me, setMe] = useState<GameTokenMe | null>(null);
    const [packs, setPacks] = useState<CurrencyPackRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyPackId, setBusyPackId] = useState<string | null>(null);
    /** Set when GET /currency/packs fails and there are no packs to show (remote + browser-local). */
    const [packsLoadError, setPacksLoadError] = useState<string | null>(null);
    /** API failed or empty, but packs from Arena Admin (same browser) are shown. */
    const [browserLocalPacksNote, setBrowserLocalPacksNote] = useState(false);

    const load = useCallback(async () => {
        const token = localStorage.getItem('token');
        setLoading(true);
        setPacksLoadError(null);
        setBrowserLocalPacksNote(false);

        try {
            const cfg = await fetchGameTokenConfig();
            setConfig(cfg);
        } catch {
            setConfig(null);
        }

        const { packs: list, remoteLoadError } = await fetchActiveCurrencyPacksDetailed();
        setPacks(Array.isArray(list) ? list : []);
        if (list.length === 0 && remoteLoadError) {
            setPacksLoadError(remoteLoadError);
        } else {
            setPacksLoadError(null);
            setBrowserLocalPacksNote(Boolean(remoteLoadError && list.length > 0));
        }

        if (token) {
            try {
                setMe(await fetchMyGameToken());
            } catch {
                setMe(null);
            }
        } else {
            setMe(null);
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        const onFocus = () => void load();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [load]);

    const sym = displayTokenSymbol(config, me);
    const ordered = sortPacksForStore(packs);
    const isShowcase = variant === 'showcase';

    const handlePurchase = async (pack: CurrencyPackRow) => {
        const packId = pack.id;
        if (!localStorage.getItem('token')) {
            toast.error('Connectez-vous pour acheter.');
            return;
        }
        if (!me?.walletAddress) {
            toast.error('Portefeuille indisponible. Vérifiez la connexion et que l’API crée bien votre portefeuille intégré.');
            return;
        }
        if (isLocalCurrencyPackId(packId)) {
            setBusyPackId(packId);
            try {
                // Try purchase first, then test-credit fallback (handles stale capability flags).
                try {
                    await purchaseSimulatedGameToken(pack.grantWholeTokens);
                } catch (purchaseErr: unknown) {
                    const purchaseStatus = axiosStatus(purchaseErr);
                    if (purchaseStatus !== 403 && purchaseStatus !== 404) {
                        throw purchaseErr;
                    }
                    await creditTestGameToken(pack.grantWholeTokens);
                }
                toast.success(`${pack.title} — +${pack.grantWholeTokens} ${sym}`);
                await load();
                await onPurchaseSuccess?.();
            } catch (e: unknown) {
                toast.error(
                    axiosMessage(e) ||
                        'Achat impossible (API refuse la requête). Activez GTK_ALLOW_PURCHASE_SIMULATION ou GTK_ALLOW_TEST_CREDIT sur le backend.',
                );
            } finally {
                setBusyPackId(null);
            }
            return;
        }
        setBusyPackId(packId);
        try {
            const r = await purchaseCurrencyPack(packId);
            toast.success(`${r.packTitle} — +${r.wholeTokensGranted} ${sym}`);
            await load();
            await onPurchaseSuccess?.();
        } catch (e: unknown) {
            toast.error(axiosMessage(e) || 'Achat impossible');
        } finally {
            setBusyPackId(null);
        }
    };

    const authLinks = !localStorage.getItem('token') ? (
        <Link
            to="/"
            className="text-[10px] font-black uppercase tracking-wider text-sky-300 underline-offset-2 hover:underline"
        >
            Connexion
        </Link>
    ) : null;

    const renderPackCard = (pack: CurrencyPackRow, i: number) => {
        const prevGrant = i > 0 ? ordered[i - 1]!.grantWholeTokens : null;
        const ribbon = prevGrant != null && i > 0 ? extraRibbonLabel(prevGrant, pack.grantWholeTokens) : null;
        const logoCls = isShowcase ? packLogoClassShowcase(pack.grantWholeTokens) : packLogoClass(pack.grantWholeTokens);

        return (
            <article
                key={pack.id}
                style={isShowcase ? { animationDelay: `${Math.min(i, 8) * 90}ms` } : undefined}
                className={cn(
                    'relative flex flex-col overflow-hidden border border-sky-300/25 bg-gradient-to-b from-sky-400/35 via-blue-600/50 to-[#071225]',
                    isShowcase
                        ? 'min-h-[360px] w-full rounded-3xl border-sky-400/35 shadow-[0_28px_70px_rgba(8,47,73,0.7)] motion-safe:animate-[scale-in_0.55s_ease-out_both]'
                        : 'min-h-[268px] w-[156px] shrink-0 rounded-2xl shadow-[0_20px_50px_rgba(8,47,73,0.55)] sm:w-[172px]',
                )}
            >
                {ribbon ? (
                    <div
                        className={cn(
                            'pointer-events-none absolute right-0 z-10 translate-x-2 rotate-[14deg] select-none',
                            isShowcase ? 'top-6' : 'top-4',
                        )}
                    >
                        <div className="origin-top-right bg-red-600 px-3 py-1.5 pr-5 text-[10px] font-black uppercase italic tracking-wide text-white shadow-[2px_4px_12px_rgba(127,29,29,0.6)] sm:text-[11px]">
                            {ribbon}
                        </div>
                    </div>
                ) : null}

                <div className={cn('flex flex-1 flex-col', isShowcase ? 'px-6 pt-8 pb-3' : 'px-4 pt-5 pb-2')}>
                    <p
                        className={cn(
                            'line-clamp-2 text-center font-bold uppercase leading-tight tracking-wide text-white/85',
                            isShowcase ? 'min-h-[2.75rem] text-sm sm:text-base' : 'min-h-[2rem] text-[10px]',
                        )}
                    >
                        {pack.title}
                    </p>
                    <div className={cn('flex flex-1 flex-col items-center justify-center', isShowcase ? 'py-8' : 'py-4')}>
                        <img
                            src={vexCurrencyLogo}
                            alt=""
                            className={cn('object-contain drop-shadow-[0_0_22px_rgba(186,230,253,0.55)]', logoCls)}
                            draggable={false}
                        />
                    </div>
                    <p
                        className={cn(
                            'text-center font-black tabular-nums tracking-tight text-white drop-shadow-sm',
                            isShowcase ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl',
                        )}
                    >
                        {Number(pack.grantWholeTokens).toLocaleString('fr-FR')}
                    </p>
                    <p
                        className={cn(
                            'text-center font-black uppercase tracking-[0.2em] text-sky-100/80',
                            isShowcase ? 'mt-1 text-xs sm:text-sm' : 'text-[10px]',
                        )}
                    >
                        {sym}
                    </p>
                    {pack.description ? (
                        <p
                            className={cn(
                                'mt-2 line-clamp-3 text-center text-sky-100/50',
                                isShowcase ? 'text-xs sm:text-sm' : 'mt-1 text-[9px]',
                            )}
                        >
                            {pack.description}
                        </p>
                    ) : null}
                </div>

                <button
                    type="button"
                    disabled={busyPackId === pack.id || !me?.walletAddress || !localStorage.getItem('token')}
                    onClick={() => void handlePurchase(pack)}
                    title={!me?.walletAddress ? 'Portefeuille intégré indisponible' : `Acheter — ${formatPackPrice(pack)}`}
                    className={cn(
                        'mt-auto w-full border-t border-amber-300/30 bg-[#f5d034] text-center font-black tabular-nums text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-[filter,transform] hover:brightness-105 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45',
                        isShowcase ? 'py-4 text-base sm:text-lg' : 'py-3 text-[13px]',
                    )}
                >
                    {busyPackId === pack.id ? (
                        <Loader2 className="mx-auto h-5 w-5 animate-spin sm:h-6 sm:w-6" />
                    ) : (
                        formatPackPrice(pack)
                    )}
                </button>
            </article>
        );
    };

    return (
        <div className={cn('space-y-3', className)}>
            {!hideHeading ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/55">Acheter de la monnaie</h2>
                    {authLinks}
                </div>
            ) : !localStorage.getItem('token') ? (
                <div className="mb-1 flex flex-wrap justify-end gap-2">{authLinks}</div>
            ) : null}

            {browserLocalPacksNote ? (
                <div className="rounded-xl border border-amber-400/35 bg-amber-500/[0.08] px-3 py-2 text-[11px] leading-relaxed text-amber-100/90">
                    L’API <code className="rounded bg-black/30 px-1 font-mono text-[10px]">GET /currency/packs</code> ne répond
                    pas ou est vide — les cartes incluent des packs créés dans l’admin (
                    <span className="font-semibold text-white/80">Economy → Currency offers</span>) sur{' '}
                    <strong className="text-white/70">ce même navigateur</strong>. Pour la prod, utilisez la même base que
                    l’API Nest.
                </div>
            ) : null}

            {loading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-white/35">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-xs">Chargement des offres…</span>
                </div>
            ) : packsLoadError ? (
                <div className="space-y-3 rounded-2xl border border-red-500/35 bg-red-500/10 p-4">
                    <p className="text-sm font-medium text-red-100/95">{packsLoadError}</p>
                    <p className="text-[11px] text-red-100/60">
                        Vérifiez que le serveur tourne, que le proxy Vite pointe sur le même hôte que l’admin (`VITE_API_URL`
                        ou <code className="rounded bg-black/30 px-1">/api</code>), et que la route{' '}
                        <code className="rounded bg-black/30 px-1">GET /api/currency/packs</code> répond.
                    </p>
                    <button
                        type="button"
                        onClick={() => void load()}
                        className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white hover:bg-white/15"
                    >
                        Réessayer
                    </button>
                </div>
            ) : packs.length === 0 ? (
                <div className="space-y-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5">
                    <p className="text-sm text-white/45">Aucune offre active pour l’instant.</p>
                    <p className="text-[11px] leading-relaxed text-white/30">
                        Ajoutez des packs actifs côté API, ou dans l’admin Arena sous{' '}
                        <strong className="text-white/50">Economy → Currency offers</strong> (stockage navigateur, visible
                        ici sur la même machine). Si l’API a des offres mais pas ici, vérifiez{' '}
                        <code className="rounded bg-black/40 px-1 font-mono text-[10px]">VITE_API_URL</code> et le même
                        serveur Nest + Mongo.
                    </p>
                    <p className="text-[10px] font-mono text-white/25">
                        Offres chargées depuis : {getApiBase()}/currency/packs
                    </p>
                </div>
            ) : isShowcase ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{ordered.map((pack, i) => renderPackCard(pack, i))}</div>
            ) : (
                <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 pt-1 scrollbar-hide">
                    {ordered.map((pack, i) => renderPackCard(pack, i))}
                </div>
            )}
        </div>
    );
}
