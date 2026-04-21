export type EthRequest = (args: { method: string; params?: unknown[] }) => Promise<unknown>;

/** MetaMask: another RPC for this origin is already waiting for user action. */
export const METAMASK_REQUEST_PENDING = -32002;

export function metaMaskRpcCode(e: unknown): number | undefined {
    if (typeof e === 'object' && e !== null && 'code' in e) {
        const c = (e as { code: unknown }).code;
        if (typeof c === 'number') return c;
    }
    return undefined;
}

export function metaMaskRpcMessage(e: unknown): string | undefined {
    if (typeof e === 'object' && e !== null && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
        return (e as { message: string }).message;
    }
    if (e instanceof Error) return e.message;
    return undefined;
}

export function shortAddr(a: string): string {
    if (a.length < 12) return a;
    return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function getEthereum(): { request: EthRequest } | undefined {
    return (typeof window !== 'undefined' ? (window as unknown as { ethereum?: { request: EthRequest } }).ethereum : undefined) as
        | { request: EthRequest }
        | undefined;
}

const pendingMsg =
    'MetaMask a déjà une demande en attente pour ce site. Répondez à la fenêtre MetaMask (Confirmer ou Annuler), puis réessayez — sans double-clic.';

export async function ensureChain(ethereum: { request: EthRequest }, chainId: number): Promise<void> {
    const hex = `0x${chainId.toString(16)}`;
    try {
        await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: hex }],
        });
        return;
    } catch (e: unknown) {
        const code = metaMaskRpcCode(e);
        if (code === METAMASK_REQUEST_PENDING) {
            throw new Error(pendingMsg);
        }
        if (code !== 4902) throw e;
    }
    if (chainId === 31337) {
        try {
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
        } catch (e: unknown) {
            if (metaMaskRpcCode(e) === METAMASK_REQUEST_PENDING) {
                throw new Error(pendingMsg);
            }
            throw e;
        }
        return;
    }
    throw new Error(`Add this network in your wallet (chain id ${chainId}).`);
}

/** OZ ERC-20 `burn(uint256)` selector + ABI-encoded amount (32-byte uint). */
export function encodeBurnUint256Call(whole: number, decimals: number): `0x${string}` {
    if (!Number.isInteger(whole) || whole < 1) {
        throw new Error('Invalid whole-token amount');
    }
    const wei = BigInt(whole) * 10n ** BigInt(decimals);
    const hex = wei.toString(16).padStart(64, '0');
    return `0x42966c68${hex}` as `0x${string}`;
}
