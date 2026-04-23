import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { vexCurrencyLogo } from '../../assets/vexCurrencyBrand';
import { ensureChain, getEthereum, METAMASK_REQUEST_PENDING, metaMaskRpcCode, metaMaskRpcMessage } from '../../lib/evmWallet';
import {
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
    const [metaMaskBusy, setMetaMaskBusy] = useState(false);
    const [statusText, setStatusText] = useState<string | null>(null);
    const metaMaskConnectLock = useRef(false);

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
    const showBuyAction = me.linked;

    const onMetaMaskChipClick = async () => {
        if (metaMaskConnectLock.current) return;
        if (!localStorage.getItem('token')) {
            toast.error('Connectez-vous d’abord à Arena.');
            return;
        }
        const eth = getEthereum();
        if (!eth?.request) {
            toast.error('MetaMask introuvable. Installez l’extension ou activez-la pour ce site.');
            return;
        }
        metaMaskConnectLock.current = true;
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
            const code = metaMaskRpcCode(e);
            const msg =
                code === METAMASK_REQUEST_PENDING
                    ? 'MetaMask a déjà une demande en attente. Répondez à la fenêtre MetaMask, puis réessayez.'
                    : (metaMaskRpcMessage(e) ?? 'Connexion MetaMask refusée ou annulée.');
            toast.error(msg);
        } finally {
            metaMaskConnectLock.current = false;
            setMetaMaskBusy(false);
        }
    };

    const onBuyClick = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        void navigate('/player/wallet');
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
                'flex h-10 items-center gap-2.5 rounded-xl border border-white/[0.09] bg-black/25 px-3 text-white shadow-[inset_0_0_0_1px_rgba(0,255,136,0.06)]',
                'cursor-pointer select-none transition-colors hover:border-primary/30 hover:bg-white/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                metaMaskBusy && 'pointer-events-none opacity-70',
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
            <div className="min-w-0 flex-1">
                <span className="block text-[11px] font-black text-white tabular-nums leading-none truncate max-w-[140px] sm:max-w-[200px]">
                    {display}
                </span>
            </div>
            {showBuyAction && (
                <button
                    type="button"
                    onClick={onBuyClick}
                    disabled={metaMaskBusy}
                    className="shrink-0 rounded-lg border border-white/15 bg-white/[0.06] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-primary hover:bg-white/10 disabled:opacity-50"
                    title="Acheter des VEX via la page portefeuille"
                >
                    Buy
                </button>
            )}
        </div>
    );
}
