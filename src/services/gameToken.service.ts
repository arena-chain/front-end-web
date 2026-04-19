import axios from 'axios';
import { getApiBase } from '../lib/apiBase';
import { mergeRemoteAndLocalPacks, readLocalCurrencyPacks } from '../lib/localCurrencyPacks';

const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });

export interface GameTokenConfig {
    contractAddress: string;
    /** On-chain ERC-20 name */
    name: string;
    /** On-chain symbol (e.g. GTK) */
    symbol: string;
    decimals: number;
    chainId: number;
    /** UI label from backend (GAME_TOKEN_DISPLAY_NAME); may match `name` if unset on server */
    displayName?: string;
    /** Short UI suffix (GAME_TOKEN_DISPLAY_SYMBOL); may match `symbol` if unset on server */
    displaySymbol?: string;
    /** True when metadata comes from .env (RPC could not read the contract). */
    degraded?: boolean;
}

export interface GameTokenMe {
    linked: boolean;
    walletAddress: string | null;
    /** True when this address was auto-created by the API (in-app wallet). MetaMask burn UI should stay off. */
    appManagedWallet?: boolean;
    balanceRaw: string | null;
    balanceFormatted: string | null;
    symbol: string | null;
    decimals: number | null;
    chainId?: number;
    displayName?: string | null;
    displaySymbol?: string | null;
    hint?: string;
    /** Server allows POST credit-test (GTK_ALLOW_TEST_CREDIT + minting key). */
    testCreditMintAvailable?: boolean;
    /** Server allows POST purchase (GTK_ALLOW_PURCHASE_SIMULATION + minting key). */
    purchaseSimulationAvailable?: boolean;
    /** Server allows POST spend-simulated (GTK_ALLOW_ECONOMY_SIMULATION). */
    economySpendSimulationAvailable?: boolean;
    degraded?: boolean;
    balanceUnavailableReason?: string;
}

export interface GameTokenLedgerItem {
    id: string;
    direction: 'in' | 'out';
    category: string;
    title: string;
    amountWei: string;
    amountFormatted: string;
    decimals: number;
    chainId?: number;
    txHash?: string;
    meta?: Record<string, unknown>;
    createdAt: string;
}

export interface GameTokenLedgerPage {
    items: GameTokenLedgerItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

function envDisplaySymbol(): string | undefined {
    const v = import.meta.env.VITE_GAME_TOKEN_DISPLAY_SYMBOL;
    return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function envDisplayName(): string | undefined {
    const v = import.meta.env.VITE_GAME_TOKEN_DISPLAY_NAME;
    return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

/**
 * Prefer branding for UI: Vite env (optional) → API display fields → on-chain symbol.
 * If you still see "GTK", restart the Nest API after setting GAME_TOKEN_DISPLAY_* in backend `.env`,
 * or set VITE_GAME_TOKEN_DISPLAY_SYMBOL in the web `.env` for a local override.
 */
export function displayTokenSymbol(config: GameTokenConfig | null, me: GameTokenMe | null): string {
    const fromEnv = envDisplaySymbol();
    if (fromEnv) return fromEnv;
    const fromMe = me?.displaySymbol?.trim();
    if (fromMe) return fromMe;
    const fromCfg = config?.displaySymbol?.trim();
    if (fromCfg) return fromCfg;
    const chainMe = me?.symbol?.trim();
    if (chainMe) return chainMe;
    return config?.symbol?.trim() ?? '—';
}

export function displayTokenName(config: GameTokenConfig | null): string {
    const fromEnv = envDisplayName();
    if (fromEnv) return fromEnv;
    const fromCfg = config?.displayName?.trim();
    if (fromCfg) return fromCfg;
    return config?.name ?? 'Game currency';
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

/** Dev/staging: mint whole tokens to the linked wallet. Requires GTK_ALLOW_TEST_CREDIT on the API. */
export async function creditTestGameToken(wholeAmount: number): Promise<{
    ok: boolean;
    transactionHash: string;
    creditedWhole: number;
    walletAddress: string;
    ledgerRecorded?: boolean;
}> {
    const base = getApiBase();
    const { data } = await axios.post(`${base}/currency/game-token/credit-test`, { wholeAmount }, auth());
    return data;
}

export async function fetchGameTokenLedger(page = 1, limit = 20): Promise<GameTokenLedgerPage> {
    const base = getApiBase();
    const { data } = await axios.get<GameTokenLedgerPage>(`${base}/currency/game-token/ledger`, {
        ...auth(),
        params: { page, limit },
    });
    return data;
}

/** Simulated buy — mint + ledger. Requires GTK_ALLOW_PURCHASE_SIMULATION on the API. */
export async function purchaseSimulatedGameToken(wholeAmount: number): Promise<{
    ok: boolean;
    transactionHash: string;
    purchasedWhole: number;
    walletAddress: string;
    ledgerRecorded?: boolean;
}> {
    const base = getApiBase();
    const { data } = await axios.post(`${base}/currency/game-token/purchase`, { wholeAmount }, auth());
    return data;
}

/** After MetaMask burn(), register the sell in history. */
export async function confirmBurnSell(txHash: string): Promise<{
    ok: boolean;
    transactionHash: string;
    amountWei: string;
    amountFormatted: string;
}> {
    const base = getApiBase();
    const { data } = await axios.post(`${base}/currency/game-token/sell/confirm-burn`, { txHash }, auth());
    return data;
}

/** Dev: ledger-only spend row. Requires GTK_ALLOW_ECONOMY_SIMULATION. */
export async function spendSimulatedGameToken(wholeAmount: number, reason?: string): Promise<{
    ok: boolean;
    recordedWhole: number;
    walletAddress: string;
}> {
    const base = getApiBase();
    const { data } = await axios.post(`${base}/currency/game-token/spend-simulated`, { wholeAmount, reason }, auth());
    return data;
}

/** Active store packs (admin). Public GET. */
export interface CurrencyPackRow {
    id: string;
    title: string;
    description: string | null;
    grantWholeTokens: number;
    priceCents: number;
    priceCurrency: string;
    active: boolean;
    sortOrder: number;
    createdAt?: string;
    updatedAt?: string;
}

export type CurrencyPacksLoadResult = {
    packs: CurrencyPackRow[];
    /** Set when `GET /currency/packs` fails; `packs` may still include browser-local rows from the admin editor. */
    remoteLoadError: string | null;
};

function axiosMessageShort(err: unknown): string {
    if (typeof err === 'object' && err !== null && 'response' in err) {
        const d = (err as { response?: { data?: { message?: string | string[] } } }).response?.data;
        if (typeof d?.message === 'string') return d.message;
        if (Array.isArray(d?.message)) return d.message.join(', ');
    }
    if (err instanceof Error) return err.message;
    return '';
}

/** Remote packs (when API works) + active packs from the same browser’s admin “Currency offers” editor. */
export async function fetchActiveCurrencyPacksDetailed(): Promise<CurrencyPacksLoadResult> {
    const local = readLocalCurrencyPacks();
    let remoteLoadError: string | null = null;
    let remote: CurrencyPackRow[] = [];
    try {
        const base = getApiBase();
        const { data } = await axios.get<{ packs: CurrencyPackRow[] }>(`${base}/currency/packs`);
        remote = Array.isArray(data.packs) ? data.packs : [];
    } catch (e: unknown) {
        remoteLoadError = axiosMessageShort(e) || 'Impossible de joindre /currency/packs.';
        remote = [];
    }
    const packs = mergeRemoteAndLocalPacks(remote, local);
    return { packs, remoteLoadError };
}

export async function fetchActiveCurrencyPacks(): Promise<CurrencyPackRow[]> {
    const { packs } = await fetchActiveCurrencyPacksDetailed();
    return packs;
}

/** Mint to linked inventory wallet; requires JWT + GTK_ALLOW_PURCHASE_SIMULATION on API. */
export async function purchaseCurrencyPack(packId: string): Promise<{
    purchaseId: string;
    transactionHash: string;
    wholeTokensGranted: number;
    packTitle: string;
    ledgerRecorded: boolean;
}> {
    const base = getApiBase();
    const { data } = await axios.post(`${base}/currency/packs/${packId}/purchase`, {}, auth());
    return data;
}
