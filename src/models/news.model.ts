export interface NewsItem {
    _id: string;
    title: string;
    slug: string;
    summary: string;
    content?: string;
    coverImageUrl?: string;
    sourceName: string;
    sourceUrl: string;
    publishedAt: string;
    language: string;
    region: string;
    category: 'patch_notes' | 'esports' | 'community' | 'tech' | 'release' | 'general';
    game: 'valorant' | 'lol' | 'cs2' | 'fortnite' | 'other';
    tags: string[];
    status: 'published' | 'draft';
    isFeatured: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface NewsResponse {
    items: NewsItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
