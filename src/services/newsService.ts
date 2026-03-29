import axios from 'axios';
import type { NewsResponse, NewsItem } from '../models/news.model';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const newsService = {
    async getNews(params: { game?: string; category?: string; page?: number; limit?: number } = {}): Promise<NewsResponse> {
        // Remove undefined/null params to avoid sending them as strings or empty values
        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
        );
        const response = await axios.get<NewsResponse>(`${API_URL}/news`, { params: cleanParams });
        return response.data;
    },

    async getNewsItem(idOrSlug: string): Promise<NewsItem> {
        const response = await axios.get<NewsItem>(`${API_URL}/news/${idOrSlug}`);
        return response.data;
    },

    async createNews(newsData: Partial<NewsItem>): Promise<NewsItem> {
        const token = localStorage.getItem('token');
        const response = await axios.post<NewsItem>(`${API_URL}/news`, newsData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    async updateNews(id: string, newsData: Partial<NewsItem>): Promise<NewsItem> {
        const token = localStorage.getItem('token');
        const response = await axios.patch<NewsItem>(`${API_URL}/news/${id}`, newsData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    async deleteNews(id: string): Promise<void> {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/news/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }
};
