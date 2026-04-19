export type EthRequest = (args: { method: string; params?: unknown[] }) => Promise<unknown>;

export function shortAddr(a: string): string {
    if (a.length < 12) return a;
    return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function getEthereum(): { request: EthRequest } | undefined {
    return (typeof window !== 'undefined' ? (window as unknown as { ethereum?: { request: EthRequest } }).ethereum : undefined) as
        | { request: EthRequest }
        | undefined;
}

export async function ensureChain(ethereum: { request: EthRequest }, chainId: number): Promise<void> {
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

/** OZ ERC-20 `burn(uint256)` selector + ABI-encoded amount (32-byte uint). */
export function encodeBurnUint256Call(whole: number, decimals: number): `0x${string}` {
    if (!Number.isInteger(whole) || whole < 1) {
        throw new Error('Invalid whole-token amount');
    }
    const wei = BigInt(whole) * 10n ** BigInt(decimals);
    const hex = wei.toString(16).padStart(64, '0');
    return `0x42966c68${hex}` as `0x${string}`;
}
