import { useCallback, useEffect, useState, type MouseEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { vexCurrencyLogo } from '../../assets/vexCurrencyBrand';
import { ensureChain, getEthereum } from '../../lib/evmWallet';
import {
    creditTestGameToken,
    displayTokenName,
    displayTokenSymbol,
    fetchGameTokenConfig,
    fetchMyGameToken,
    type GameTokenConfig,
    type GameTokenMe,
} from '../../services/gameToken.service';
import { cn } from '../../lib/utils';

/**
 * Shows the logged-in player’s game currency balance (server-backed wallet on inventory; auto-provisioned by API by default).
 */
export default function PlayerGameTokenBalance({ className }: { className?: string }) {
    const navigate = useNavigate();
    const [config, setConfig] = useState<GameTokenConfig | null>(null);
    const [me, setMe] = useState<GameTokenMe | null>(null);
    const [loading, setLoading] = useState(true);
    const [crediting, setCrediting] = useState(false);
    const [metaMaskBusy, setMetaMaskBusy] = useState(false);
    const [statusText, setStatusText] = useState<string | null>(null);

    const load = useCallback(async () => {
        const token = localStorage.getItem('token');
        try {
            const cfg = await fetchGameTokenConfig();
            setConfig(cfg);
            if (!token) {
                setMe(null);
                setStatusText(`Connect to see ${displayTokenSymbol(cfg, null)}`);
                return;
            }
            const bal = await fetchMyGameToken();
            setMe(bal);
            setStatusText(null);
        } catch {
            setConfig(null);
            setMe(null);
            setStatusText('Currency unavailable');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        const onFocus = () => void load();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [load]);

    if (loading) {
        return (
            <div className={cn('flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-white/40', className)}>
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Solde</span>
            </div>
        );
    }

    if (!config || !me) {
        return (
            <div
                className={cn(
                    'flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-white shadow-[inset_0_0_0_1px_rgba(0,255,136,0.06)]',
                    className,
                )}
                title={statusText ?? 'Currency status'}
            >
                <img
                    src={vexCurrencyLogo}
                    alt={config ? displayTokenName(config) : 'Vex currency'}
                    width={36}
                    height={36}
                    className="h-9 w-9 shrink-0 object-contain pointer-events-none"
                    draggable={false}
                />
                <span className="text-[10px] font-black uppercase tracking-wider text-white/70">
                    {statusText ?? (config ? displayTokenName(config) : 'Currency')}
                </span>
            </div>
        );
    }

    const sym = displayTokenSymbol(config, me);
    const display =
        me.balanceFormatted != null ? `${me.balanceFormatted} ${sym}` : me.linked ? `— ${sym}` : `0 ${sym}`;
    const showTestTopUp =
        me.testCreditMintAvailable &&
        me.linked &&
        (import.meta.env.DEV || import.meta.env.VITE_GTK_ENABLE_TEST_PURCHASE === 'true');

    const onMetaMaskChipClick = async () => {
        if (!localStorage.getItem('token')) {
            toast.error('Connectez-vous d’abord à Arena.');
            return;
        }
        const eth = getEthereum();
        if (!eth?.request) {
            toast.error('MetaMask introuvable. Installez l’extension ou activez-la pour ce site.');
            return;
        }
        setMetaMaskBusy(true);
        try {
            const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[];
            const addr = accounts[0];
            if (config?.chainId != null) {
                await ensureChain(eth, config.chainId);
            }
            if (addr) {
                toast.success(`MetaMask : ${addr.slice(0, 6)}…${addr.slice(-4)}`);
            } else {
                toast.success('MetaMask est ouvert — aucun compte sélectionné.');
            }
            void navigate('/player/wallet');
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Connexion MetaMask refusée ou annulée.';
            toast.error(msg);
        } finally {
            setMetaMaskBusy(false);
        }
    };

    const onTestTopUp = async (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setCrediting(true);
        try {
            await creditTestGameToken(100);
            toast.success('100 crédits de test ajoutés');
            await load();
        } catch (err: unknown) {
            const msg =
                err && typeof err === 'object' && 'response' in err
                    ? String((err as { response?: { data?: { message?: string | string[] } } }).response?.data?.message)
                    : '';
            toast.error(msg || 'Impossible d’ajouter des crédits de test');
        } finally {
            setCrediting(false);
        }
    };

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => void onMetaMaskChipClick()}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    void onMetaMaskChipClick();
                }
            }}
            className={cn(
                'flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-white shadow-[inset_0_0_0_1px_rgba(0,255,136,0.06)]',
                'cursor-pointer select-none transition-colors hover:border-primary/30 hover:bg-white/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                (metaMaskBusy || crediting) && 'pointer-events-none opacity-70',
                className,
            )}
            title="Ouvrir MetaMask (compte + réseau du jeton) — portefeuille Arena inchangé"
        >
            <img
                src={vexCurrencyLogo}
                alt={displayTokenName(config)}
                width={36}
                height={36}
                className="h-9 w-9 shrink-0 object-contain pointer-events-none"
                draggable={false}
            />
            <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[11px] font-black text-white tabular-nums leading-tight truncate max-w-[140px] sm:max-w-[200px]">
                    {display}
                </span>
                {me.walletAddress ? (
                    <span className="text-[9px] text-white/35 font-bold uppercase tracking-wider leading-none mt-0.5">
                        <span className="normal-case text-primary/90">Portefeuille Arena</span>
                    </span>
                ) : me.hint ? (
                    <span className="text-[9px] text-amber-200/80 font-bold leading-none mt-0.5 truncate max-w-[200px]">{me.hint}</span>
                ) : null}
            </div>
            {showTestTopUp && (
                <button
                    type="button"
                    onClick={(e) => void onTestTopUp(e)}
                    disabled={crediting || metaMaskBusy}
                    className="shrink-0 rounded-lg border border-white/15 bg-white/[0.06] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-primary hover:bg-white/10 disabled:opacity-50"
                    title="Crédit de test (API uniquement)"
                >
                    {crediting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : '+100'}
                </button>
            )}
        </div>
    );
}
