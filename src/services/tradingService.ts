import { getApiBase } from '../lib/apiBase';

/** Optional performance fields returned with player-style trading assets */
export interface TradingAssetStats {
    winRate?: number;
    matchesPlayed?: number;
    ranking?: number;
}

export interface OrderBookLevel {
    price: number;
    amount: number;
    total?: number;
}

export interface OrderBookSnapshot {
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
}

export interface TradeHistoryEntry {
    assetId?: string;
    price: number;
    amount: number;
    side: 'BUY' | 'SELL';
    timestamp: string;
}

/** POST /order JSON body (client → API). */
export interface PlaceOrderPayload {
    assetId: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT';
    price: number;
    amount: number;
}

/** Order row returned by API (shape may grow; keep indexable). */
export type PlacedOrder = Record<string, unknown>;

export type ActiveOrder = Record<string, unknown>;

export interface TradingAsset {
    _id: string;
    name: string;
    symbol: string;
    type: 'NFT' | 'PLAYER_TOKEN' | 'TEAM_TOKEN' | 'EVENT_TICKET';
    lastPrice: number;
    priceChange24h: number;
    volume24h: number;
    imageUrl: string;
    stats?: TradingAssetStats;
}

export interface PortfolioPosition {
    asset: TradingAsset;
    amount: number;
    averagePrice: number;
    currentPrice: number;
    currentValue: number;
    pnl: number;
    pnlPercentage: number;
}

const API_BASE = `${getApiBase()}/trading`;

class TradingService {
    private async getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        };
    }

    async getAssets(): Promise<TradingAsset[]> {
        const response = await fetch(`${API_BASE}/assets`);
        if (!response.ok) throw new Error('Failed to fetch trading assets');
        return response.json();
    }

    async getAssetDetails(
        assetId: string,
    ): Promise<{ asset: TradingAsset; orderBook: OrderBookSnapshot; history: TradeHistoryEntry[] }> {
        const response = await fetch(`${API_BASE}/assets/${assetId}`);
        if (!response.ok) throw new Error('Failed to fetch asset details');
        return response.json();
    }

    async placeOrder(orderData: PlaceOrderPayload): Promise<PlacedOrder> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${API_BASE}/order`, {
            method: 'POST',
            headers,
            body: JSON.stringify(orderData),
        });
        if (!response.ok) throw new Error('Failed to place order');
        return response.json();
    }

    async getPortfolio(): Promise<{ assets: PortfolioPosition[]; activeOrders: ActiveOrder[] }> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${API_BASE}/portfolio`, {
            headers,
        });
        if (!response.ok) throw new Error('Failed to fetch portfolio');
        return response.json();
    }
}

export default new TradingService();
