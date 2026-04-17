import { useCallback, useEffect, useState } from 'react';
import { Coins, Loader2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import {
    fetchGameTokenConfig,
    fetchMyGameToken,
    linkInventoryWallet,
    type GameTokenConfig,
    type GameTokenMe,
} from '../../services/gameToken.service';
import { cn } from '../../lib/utils';

type EthRequest = (args: { method: string; params?: unknown[] }) => Promise<unknown>;

function getEthereum(): { request: EthRequest } | undefined {
    return (typeof window !== 'undefined' ? (window as unknown as { ethereum?: { request: EthRequest } }).ethereum : undefined) as
        | { request: EthRequest }
        | undefined;
}

function shortAddr(a: string): string {
    if (a.length < 12) return a;
    return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

async function ensureChain(ethereum: { request: EthRequest }, chainId: number): Promise<void> {
    const hex = `0x${chainId.toString(16)}`;
    try {
        await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: hex }],
        });
        return;
    } catch (e: unknown) {
        const code = (e as { code?: number })?.code;
        if (code !== 4902) throw e;
    }
    if (chainId === 31337) {
        await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
                {
                    chainId: hex,
                    chainName: 'Anvil local',
                    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                    rpcUrls: ['http://127.0.0.1:8545'],
                },
            ],
        });
        return;
    }
    throw new Error(`Add this network in your wallet (chain id ${chainId}).`);
}

/**
 * Shows the logged-in player’s on-app game currency balance (server reads the linked wallet’s ERC-20 balance).
 */
export default function PlayerGameTokenBalance({ className }: { className?: string }) {
    const [config, setConfig] = useState<GameTokenConfig | null>(null);
    const [me, setMe] = useState<GameTokenMe | null>(null);
    const [loading, setLoading] = useState(true);
    const [linking, setLinking] = useState(false);
    const [statusText, setStatusText] = useState<string | null>(null);

    const load = useCallback(async () => {
        const token = localStorage.getItem('token');
        try {
            const cfg = await fetchGameTokenConfig();
            setConfig(cfg);
            if (!token) {
                setMe(null);
                setStatusText(`Connect to see ${cfg.symbol}`);
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

    const onLinkWallet = async () => {
        if (!config) return;
        const ethereum = getEthereum();
        if (!ethereum?.request) {
            toast.error('Install a wallet extension (e.g. MetaMask) to link your address.');
            return;
        }
        setLinking(true);
        try {
            await ensureChain(ethereum, config.chainId);
            const accounts = (await ethereum.request({ method: 'eth_requestAccounts' })) as string[];
            const address = accounts[0];
            if (!address) throw new Error('No account returned.');
            await linkInventoryWallet(address);
            toast.success('Wallet linked');
            await load();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Could not link wallet';
            toast.error(msg);
        } finally {
            setLinking(false);
        }
    };

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
                <Coins className="h-4 w-4 text-primary shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-wider text-white/70">
                    {statusText ?? 'Currency'}
                </span>
            </div>
        );
    }

    if (!me.linked) {
        return (
            <button
                type="button"
                onClick={() => void onLinkWallet()}
                disabled={linking}
                className={cn(
                    'flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-1.5 text-primary hover:bg-primary/15 transition-colors disabled:opacity-60',
                    className,
                )}
                title={me.hint || 'Link the wallet that holds your game tokens'}
            >
                {linking ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <Wallet className="h-4 w-4 shrink-0" />}
                <span className="text-[10px] font-black uppercase tracking-wider">Lier {config.symbol}</span>
            </button>
        );
    }

    const sym = me.symbol || config.symbol;
    const display = me.balanceFormatted != null ? `${me.balanceFormatted} ${sym}` : `— ${sym}`;

    return (
        <div
            className={cn(
                'flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-white shadow-[inset_0_0_0_1px_rgba(0,255,136,0.06)]',
                className,
            )}
            title={me.walletAddress ? `Wallet: ${me.walletAddress}` : undefined}
        >
            <Coins className="h-4 w-4 text-primary shrink-0" />
            <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-black text-white tabular-nums leading-tight truncate max-w-[140px] sm:max-w-[200px]">{display}</span>
                {me.walletAddress && (
                    <span className="text-[9px] text-white/35 font-bold uppercase tracking-wider leading-none mt-0.5">
                        {shortAddr(me.walletAddress)}
                    </span>
                )}
            </div>
        </div>
    );
}
