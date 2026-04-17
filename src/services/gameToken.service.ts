import axios from 'axios';
import { getApiBase } from '../lib/apiBase';

const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });

export interface GameTokenConfig {
    contractAddress: string;
    name: string;
    symbol: string;
    decimals: number;
    chainId: number;
}

export interface GameTokenMe {
    linked: boolean;
    walletAddress: string | null;
    balanceRaw: string | null;
    balanceFormatted: string | null;
    symbol: string | null;
    decimals: number | null;
    chainId?: number;
    hint?: string;
}

export async function fetchGameTokenConfig(): Promise<GameTokenConfig> {
    const base = getApiBase();
    const { data } = await axios.get<GameTokenConfig>(`${base}/currency/game-token/config`);
    return data;
}

export async function fetchMyGameToken(): Promise<GameTokenMe> {
    const base = getApiBase();
    const { data } = await axios.get<GameTokenMe>(`${base}/currency/game-token/me`, auth());
    return data;
}

export async function linkInventoryWallet(walletAddress: string): Promise<void> {
    const base = getApiBase();
    await axios.patch(`${base}/inventory/wallet/${walletAddress}`, {}, auth());
}
