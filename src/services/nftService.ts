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

export const nftService = {
    // Admin
    getAll: (): Promise<NftAvatar[]> =>
        axios.get(`${API}/nfts`, auth()).then(r => r.data),

    create: (dto: CreateNftDto): Promise<NftAvatar> =>
        axios.post(`${API}/nfts`, dto, auth()).then(r => r.data),

    assign: (dto: AssignNftDto): Promise<NftAvatar> =>
        axios.post(`${API}/nfts/${dto.nftId}/assign`, { playerId: dto.playerId }, auth()).then(r => r.data),

    delete: (id: string): Promise<void> =>
        axios.delete(`${API}/nfts/${id}`, auth()).then(r => r.data),

    // Player / Marketplace
    getMarketplace: (): Promise<NftAvatar[]> =>
        axios.get(`${API}/nfts/marketplace`, auth()).then(r => r.data),

    getMyNfts: (): Promise<NftAvatar[]> =>
        axios.get(`${API}/nfts/my`, auth()).then(r => r.data),

    listForSale: (nftId: string, listPrice: number): Promise<NftAvatar> =>
        axios.post(`${API}/nfts/${nftId}/list`, { listPrice }, auth()).then(r => r.data),

    unlist: (nftId: string): Promise<NftAvatar> =>
        axios.post(`${API}/nfts/${nftId}/unlist`, {}, auth()).then(r => r.data),

    buy: (nftId: string): Promise<NftAvatar> =>
        axios.post(`${API}/nfts/${nftId}/buy`, {}, auth()).then(r => r.data),
};
