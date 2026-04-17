import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export type NftRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface NftAvatar {
    _id: string;
    name: string;
    image: string;
    description: string;
    rarity: NftRarity;
    price: number;
    ownerId?: string | { _id: string; username: string };
    assignedTo?: string | { _id: string; username: string };
    listed: boolean;
    listPrice?: number;
    createdAt: string;
}

export interface CreateNftDto {
    name: string;
    image: string;
    description: string;
    rarity: NftRarity;
    price: number;
}

export interface AssignNftDto {
    nftId: string;
    playerId: string;
}

export interface NftTransaction {
    _id: string;
    nftItemId: { _id: string; nftId: { name: string; imageUrl: string } };
    fromUserId?: { _id: string; username: string; nickname?: string };
    toUserId?: { _id: string; username: string; nickname?: string };
    type: 'MINT' | 'LIST' | 'UNLIST' | 'SALE' | 'TRANSFER' | 'BURN';
    price: number;
    currency: string;
    createdAt: string;
}

const mapItemToAvatar = (item: any): NftAvatar => ({
    _id: item._id,
    name: item.nftId?.name || 'Unknown',
    image: item.nftId?.imageUrl || '',
    description: item.nftId?.description || '',
    rarity: item.nftId?.rarity || 'COMMON',
    price: item.nftId?.price || 0,
    ownerId: item.ownerId,
    listed: item.status === 'LISTED',
    listPrice: item.listPrice,
    createdAt: item.createdAt,
});

export const nftService = {
    // Admin
    getAll: (): Promise<any[]> =>
        axios.get(`${API}/nft`, auth()).then(r => r.data),

    create: (dto: CreateNftDto): Promise<any> =>
        axios.post(`${API}/nft`, dto, auth()).then(r => r.data),

    assign: (dto: AssignNftDto): Promise<any> =>
        axios.post(`${API}/nft/${dto.nftId}/assign`, { playerId: dto.playerId }, auth()).then(r => r.data),

    delete: (id: string): Promise<void> =>
        axios.delete(`${API}/nft/${id}`, auth()).then(r => r.data),

    // Player / Marketplace
    getMarketplace: (filters?: { search?: string; rarity?: string; isFeatured?: boolean }): Promise<NftAvatar[]> =>
        axios.get(`${API}/nft/marketplace`, { ...auth(), params: filters }).then(r => r.data.map(mapItemToAvatar)),

    getMyNfts: (): Promise<NftAvatar[]> =>
        axios.get(`${API}/nft/my`, auth()).then(r => r.data.map(mapItemToAvatar)),

    listForSale: (nftId: string, listPrice: number): Promise<NftAvatar> =>
        axios.post(`${API}/nft/${nftId}/list`, { listPrice }, auth()).then(r => mapItemToAvatar(r.data)),

    unlist: (nftId: string): Promise<NftAvatar> =>
        axios.post(`${API}/nft/${nftId}/unlist`, {}, auth()).then(r => mapItemToAvatar(r.data)),

    buy: (nftId: string): Promise<NftAvatar> =>
        axios.post(`${API}/nft/${nftId}/buy`, {}, auth()).then(r => mapItemToAvatar(r.data)),

    getHistory: (limit = 20): Promise<NftTransaction[]> =>
        axios.get(`${API}/nft/transactions/history`, { ...auth(), params: { limit } }).then(r => r.data),
};
