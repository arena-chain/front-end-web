import axios from 'axios';
import {
    getApiBase,
    getBackendOrigin,
    resolveBackendAssetUrl as resolveAsset,
    resolveInventoryFilesUrl,
    resolveUploadsUrl,
} from '../lib/apiBase';

const API = getApiBase();

function authHeaders() {
    const t = localStorage.getItem('token');
    return t ? { Authorization: `Bearer ${t}` } : {};
}

export type NftCategory =
    | 'WEAPON'
    | 'AVATAR'
    | 'SKIN'
    | 'CHARACTER'
    | 'CONSUMABLE'
    | 'BADGE'
    | 'TROPHY'
    | 'EMOTE'
    | 'ARMOR'
    | 'ACCESSORY'
    | 'OTHER';

export interface CatalogGame {
    _id: string;
    title: string;
    genre?: string;
    isActive?: boolean;
}

export interface NftTemplate {
    _id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    category?: NftCategory;
    rarity?: string;
    metadata?: Record<string, unknown>;
    compatibleGames?: CatalogGame[];
    isEquippable?: boolean;
    isTradeable?: boolean;
}

export interface NftItemOwned {
    _id: string;
    nftId: NftTemplate | string;
    ownerId: string;
    status: string;
    edition?: number;
    acquiredVia?: string;
    metadata?: Record<string, unknown>;
    createdAt?: string;
    updatedAt?: string;
}

export interface InventoryDoc {
    _id: string;
    userId: string;
    items: NftItemOwned[];
    equippedItems: Array<{
        nftItemId: NftItemOwned | string;
        slot: string;
        equippedAt?: string;
    }>;
    walletAddress?: string;
}

export interface GameAssetFile {
    relativePath: string;
    urlPath: string;
    fileName: string;
    extension: string;
    rootFolder: string;
    subFolder?: string;
}

export interface GameAssetsResponse {
    files: GameAssetFile[];
    count: number;
    hint?: string;
}

export interface AssetPreset {
    _id: string;
    name: string;
    baseNftId?: NftTemplate | string;
    assetPath?: string;
    config: Record<string, unknown>;
    previewImageUrl?: string;
    updatedAt?: string;
}

/** Browser URL from `GET /game-assets` `urlPath` (`/uploads/inventory/...` or `/inventory-files/...`). */
export function resolveInventoryFileUrl(urlPath: string): string {
    const path = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
    if (import.meta.env.DEV && (path.startsWith('/uploads') || path.startsWith('/inventory-files'))) {
        return path;
    }
    const m = path.match(/^\/inventory-files\/(.+)$/);
    if (m) return resolveInventoryFilesUrl(m[1]);
    if (path.startsWith('/uploads')) {
        return resolveUploadsUrl(path);
    }
    return `${getBackendOrigin().replace(/\/$/, '')}${path}`;
}

export const nftInventoryApi = {
    getCatalog(): Promise<CatalogGame[]> {
        return axios.get(`${API}/catalog`).then((r) => r.data);
    },

    getNftTemplates(params?: {
        category?: string;
        gameId?: string;
        tag?: string;
        status?: string;
    }): Promise<NftTemplate[]> {
        return axios
            .get(`${API}/nft`, { params: { ...params } })
            .then((r) => r.data);
    },

    getGameAssets(): Promise<GameAssetsResponse> {
        return axios.get(`${API}/game-assets`).then((r) => r.data);
    },

    getMyInventory(): Promise<InventoryDoc> {
        return axios.get(`${API}/inventory`, { headers: authHeaders() }).then((r) => r.data);
    },

    getMyNftItems(): Promise<NftItemOwned[]> {
        return axios.get(`${API}/nft/items/my`, { headers: authHeaders() }).then((r) => r.data);
    },

    equip(nftItemId: string, slot: string): Promise<InventoryDoc> {
        return axios
            .post(`${API}/inventory/equip`, { nftItemId, slot }, { headers: authHeaders() })
            .then((r) => r.data);
    },

    unequip(nftItemId: string): Promise<InventoryDoc> {
        return axios
            .post(`${API}/inventory/unequip/${nftItemId}`, {}, { headers: authHeaders() })
            .then((r) => r.data);
    },

    removeFromInventory(nftItemId: string): Promise<InventoryDoc> {
        return axios
            .delete(`${API}/inventory/remove/${nftItemId}`, { headers: authHeaders() })
            .then((r) => r.data);
    },

    getMarketplaceListings(params?: {
        gameId?: string;
        category?: string;
        skip?: number;
        limit?: number;
    }): Promise<NftItemOwned[]> {
        return axios.get(`${API}/nft/marketplace/listings`, { params }).then((r) => r.data);
    },

    listItemForSale(nftItemId: string, price: number, currency?: string): Promise<NftItemOwned> {
        return axios
            .post(`${API}/nft/marketplace/list`, { nftItemId, price, currency }, { headers: authHeaders() })
            .then((r) => r.data);
    },

    unlistItem(nftItemId: string): Promise<NftItemOwned> {
        return axios
            .post(`${API}/nft/marketplace/unlist`, { nftItemId }, { headers: authHeaders() })
            .then((r) => r.data);
    },

    purchaseListing(nftItemId: string): Promise<NftItemOwned> {
        return axios
            .post(`${API}/nft/marketplace/purchase`, { nftItemId }, { headers: authHeaders() })
            .then((r) => r.data);
    },

    saveConfiguredAsItem(body: {
        baseNftId: string;
        config?: Record<string, unknown>;
        displayName?: string;
    }): Promise<NftItemOwned> {
        return axios
            .post(`${API}/nft/items/save-configured`, body, { headers: authHeaders() })
            .then((r) => r.data);
    },

    getMyPresets(): Promise<AssetPreset[]> {
        return axios.get(`${API}/asset-presets/mine`, { headers: authHeaders() }).then((r) => r.data);
    },

    createPreset(body: {
        name: string;
        baseNftId?: string;
        assetPath?: string;
        config?: Record<string, unknown>;
        previewImageUrl?: string;
    }): Promise<AssetPreset> {
        return axios.post(`${API}/asset-presets`, body, { headers: authHeaders() }).then((r) => r.data);
    },

    deletePreset(id: string): Promise<void> {
        return axios.delete(`${API}/asset-presets/${id}`, { headers: authHeaders() }).then(() => undefined);
    },
};

export function nftTemplateImage(nft: NftTemplate | undefined): string {
    if (!nft?.imageUrl) {
        return `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(nft?.name || 'nft')}`;
    }
    return resolveAsset(nft.imageUrl);
}

export { resolveAsset as resolveBackendAssetUrl };
