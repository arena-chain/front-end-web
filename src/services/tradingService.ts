import { getApiBase } from '../lib/apiBase';

export interface TradingAsset {
    _id: string;
    name: string;
    symbol: string;
    type: 'NFT' | 'PLAYER_TOKEN' | 'TEAM_TOKEN' | 'EVENT_TICKET';
    lastPrice: number;
    priceChange24h: number;
    volume24h: number;
    imageUrl: string;
    stats: any;
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

    async getAssetDetails(assetId: string): Promise<{ asset: TradingAsset; orderBook: any; history: any }> {
        const response = await fetch(`${API_BASE}/assets/${assetId}`);
        if (!response.ok) throw new Error('Failed to fetch asset details');
        return response.json();
    }

    async placeOrder(orderData: { assetId: string; side: 'BUY' | 'SELL'; type: 'MARKET' | 'LIMIT'; price: number; amount: number }): Promise<any> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${API_BASE}/order`, {
            method: 'POST',
            headers,
            body: JSON.stringify(orderData),
        });
        if (!response.ok) throw new Error('Failed to place order');
        return response.json();
    }

    async getPortfolio(): Promise<{ assets: PortfolioPosition[]; activeOrders: any[] }> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${API_BASE}/portfolio`, {
            headers,
        });
        if (!response.ok) throw new Error('Failed to fetch portfolio');
        return response.json();
    }
}

export default new TradingService();
