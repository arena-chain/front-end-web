import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

// ─── Enums ───────────────────────────────────────────────────────────────────

export type NftCategory = 'WEAPON' | 'AVATAR' | 'SKIN' | 'CHARACTER' | 'CONSUMABLE' | 'BADGE' | 'TROPHY' | 'EMOTE' | 'ARMOR' | 'ACCESSORY' | 'OTHER';
export type NftRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
export type NftStatus = 'DRAFT' | 'MINTED' | 'LISTED' | 'BURNED';
export type CollectionCategory = 'AVATARS' | 'WEAPONS' | 'SKINS' | 'CHARACTERS' | 'BADGES' | 'TROPHIES' | 'ARMOR' | 'ACCESSORIES' | 'MIXED';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface NftCollection {
    _id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    creatorId: string | { _id: string; nickname: string; email: string };
    category: CollectionCategory;
    compatibleGames: string[] | { _id: string; title: string; genre: string }[];
    isActive: boolean;
    totalMinted: number;
    maxSupply: number;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

export interface Nft {
    _id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    creatorId: string | { _id: string; nickname: string; email: string };
    collectionId?: string | { _id: string; name: string; category: string };
    category: NftCategory;
    rarity: NftRarity;
    compatibleGames: string[] | { _id: string; title: string; genre: string }[];
    tags: string[];
    contractAddress?: string;
    tokenId?: string;
    transactionHash?: string;
    status: NftStatus;
    mintedAt?: string;
    isEquippable: boolean;
    isConsumable: boolean;
    isTradeable: boolean;
    supply: number;
    maxSupply: number;
    externalUrl?: string;
    metadata: Record<string, unknown>;
    attributes?: NftAttribute[];
    createdAt: string;
    updatedAt: string;
}

export interface NftAttribute {
    _id: string;
    nftId: string;
    traitType: string;
    value: string;
    displayType?: string;
    numericValue?: number;
    maxValue?: number;
}

export interface NftItem {
    _id: string;
    nftId: string | Nft;
    ownerId: string;
    walletAddress?: string;
    tokenId?: string;
    transactionHash?: string;
    edition: number;
    status: 'OWNED' | 'EQUIPPED' | 'LISTED' | 'TRANSFERRED' | 'BURNED';
    acquiredAt: string;
    acquiredVia: 'MINTED' | 'PURCHASED' | 'REWARD' | 'TRANSFER' | 'AIRDROP';
    metadata: Record<string, unknown>;
}

export interface NftStats {
    totalNfts: number;
    totalMinted: number;
    totalItems: number;
    totalCollections: number;
    byCategory: { _id: string; count: number }[];
    byRarity: { _id: string; count: number }[];
}

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface CreateNftCollectionDto {
    name: string;
    description?: string;
    imageUrl?: string;
    category: CollectionCategory;
    compatibleGames?: string[];
    isActive?: boolean;
    maxSupply?: number;
    metadata?: Record<string, unknown>;
}

export interface CreateNftAttributeDto {
    nftId: string;
    traitType: string;
    value: string;
    displayType?: string;
    numericValue?: number;
    maxValue?: number;
}

export interface MintNftDto {
    nftId: string;
    walletAddress: string;
}

export interface AirdropNftDto {
    nftId: string;
    toUserId: string;
    walletAddress?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const RARITY_COLORS: Record<NftRarity, string> = {
    COMMON: '#9E9E9E',
    UNCOMMON: '#4CAF50',
    RARE: '#2196F3',
    EPIC: '#9C27B0',
    LEGENDARY: '#FF9800',
    MYTHIC: '#F44336',
};

export const RARITY_GRADIENTS: Record<NftRarity, string> = {
    COMMON: 'linear-gradient(135deg, #9E9E9E, #BDBDBD)',
    UNCOMMON: 'linear-gradient(135deg, #4CAF50, #81C784)',
    RARE: 'linear-gradient(135deg, #2196F3, #64B5F6)',
    EPIC: 'linear-gradient(135deg, #9C27B0, #CE93D8)',
    LEGENDARY: 'linear-gradient(135deg, #FF9800, #FFB74D)',
    MYTHIC: 'linear-gradient(135deg, #F44336, #EF5350)',
};

export const NFT_CATEGORIES: { value: NftCategory; label: string }[] = [
    { value: 'WEAPON', label: 'Weapon' },
    { value: 'AVATAR', label: 'Avatar' },
    { value: 'SKIN', label: 'Skin' },
    { value: 'CHARACTER', label: 'Character' },
    { value: 'CONSUMABLE', label: 'Consumable' },
    { value: 'BADGE', label: 'Badge' },
    { value: 'TROPHY', label: 'Trophy' },
    { value: 'EMOTE', label: 'Emote' },
    { value: 'ARMOR', label: 'Armor' },
    { value: 'ACCESSORY', label: 'Accessory' },
    { value: 'OTHER', label: 'Other' },
];

export const COLLECTION_CATEGORIES: { value: CollectionCategory; label: string }[] = [
    { value: 'AVATARS', label: 'Avatars' },
    { value: 'WEAPONS', label: 'Weapons' },
    { value: 'SKINS', label: 'Skins' },
    { value: 'CHARACTERS', label: 'Characters' },
    { value: 'BADGES', label: 'Badges' },
    { value: 'TROPHIES', label: 'Trophies' },
    { value: 'ARMOR', label: 'Armor' },
    { value: 'ACCESSORIES', label: 'Accessories' },
    { value: 'MIXED', label: 'Mixed' },
];

export const NFT_RARITIES: { value: NftRarity; label: string; color: string }[] = [
    { value: 'COMMON', label: 'Common', color: '#9E9E9E' },
    { value: 'UNCOMMON', label: 'Uncommon', color: '#4CAF50' },
    { value: 'RARE', label: 'Rare', color: '#2196F3' },
    { value: 'EPIC', label: 'Epic', color: '#9C27B0' },
    { value: 'LEGENDARY', label: 'Legendary', color: '#FF9800' },
    { value: 'MYTHIC', label: 'Mythic', color: '#F44336' },
];

// ─── Image helper ────────────────────────────────────────────────────────────

export const getImageUrl = (imageUrl?: string): string => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${API}${imageUrl}`;
};

// ─── API Services ────────────────────────────────────────────────────────────

export const nftCollectionService = {
    create: (data: CreateNftCollectionDto): Promise<NftCollection> =>
        axios.post(`${API}/nft/collections`, data, auth()).then(r => r.data),

    getAll: (category?: string): Promise<NftCollection[]> =>
        axios.get(`${API}/nft/collections`, { ...auth(), params: category ? { category } : {} }).then(r => r.data),

    getOne: (id: string): Promise<NftCollection> =>
        axios.get(`${API}/nft/collections/${id}`, auth()).then(r => r.data),

    getNfts: (id: string): Promise<Nft[]> =>
        axios.get(`${API}/nft/collections/${id}/nfts`, auth()).then(r => r.data),

    update: (id: string, data: Partial<CreateNftCollectionDto>): Promise<NftCollection> =>
        axios.patch(`${API}/nft/collections/${id}`, data, auth()).then(r => r.data),

    delete: (id: string): Promise<void> =>
        axios.delete(`${API}/nft/collections/${id}`, auth()).then(r => r.data),
};

export const nftCoreService = {
    create: (formData: FormData): Promise<Nft> =>
        axios.post(`${API}/nft`, formData, {
            ...auth(),
            headers: { ...auth().headers, 'Content-Type': 'multipart/form-data' },
        }).then(r => r.data),

    getAll: (filters?: { category?: string; rarity?: string; status?: string; collectionId?: string }): Promise<Nft[]> =>
        axios.get(`${API}/nft`, { ...auth(), params: filters }).then(r => r.data),

    getOne: (id: string): Promise<Nft & { attributes: NftAttribute[] }> =>
        axios.get(`${API}/nft/${id}`, auth()).then(r => r.data),

    update: (id: string, formData: FormData): Promise<Nft> =>
        axios.patch(`${API}/nft/${id}`, formData, {
            ...auth(),
            headers: { ...auth().headers, 'Content-Type': 'multipart/form-data' },
        }).then(r => r.data),

    delete: (id: string): Promise<void> =>
        axios.delete(`${API}/nft/${id}`, auth()).then(r => r.data),

    getStats: (): Promise<NftStats> =>
        axios.get(`${API}/nft/stats`, auth()).then(r => r.data),
};

export const nftAttributeService = {
    add: (data: CreateNftAttributeDto): Promise<NftAttribute> =>
        axios.post(`${API}/nft/attributes`, data, auth()).then(r => r.data),

    getByNft: (nftId: string): Promise<NftAttribute[]> =>
        axios.get(`${API}/nft/${nftId}/attributes`, auth()).then(r => r.data),

    remove: (attributeId: string): Promise<void> =>
        axios.delete(`${API}/nft/attributes/${attributeId}`, auth()).then(r => r.data),
};

export const nftMintService = {
    mint: (data: MintNftDto): Promise<NftItem> =>
        axios.post(`${API}/nft/mint`, data, auth()).then(r => r.data),

    airdrop: (data: AirdropNftDto): Promise<NftItem> =>
        axios.post(`${API}/nft/airdrop`, data, auth()).then(r => r.data),
};
