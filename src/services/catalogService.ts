import type { Game } from '../models/game';

import { getApiBase } from '../lib/apiBase';

const API_BASE_URL = `${getApiBase()}/catalog`;

function getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function buildErrorMessage(response: Response, fallback: string): Promise<string> {
    try {
        const payload = await response.json();
        const message = payload?.message;
        if (Array.isArray(message)) return message.join(', ');
        if (typeof message === 'string' && message.trim()) return message;
        if (typeof payload?.error === 'string' && payload.error.trim()) return payload.error;
    } catch {
        // Ignore JSON parsing errors and use fallback
    }
    return fallback;
}

export interface CreateGameDto {
    title: string;
    genre: string;
    description?: string;
    publisher?: string;
    platforms?: string[];
    releaseDate?: string;
    coverImageUrl?: string;
    isActive?: boolean;
    teamSize?: number;
    supportsTeams?: boolean;
    supportsSolo?: boolean;
    metadata?: Record<string, any>;
    isPartner?: boolean;
    roles?: string[];
    file?: File;
}

export interface UpdateGameDto {
    title?: string;
    genre?: string;
    description?: string;
    publisher?: string;
    platforms?: string[];
    releaseDate?: string;
    coverImageUrl?: string;
    isActive?: boolean;
    teamSize?: number;
    supportsTeams?: boolean;
    supportsSolo?: boolean;
    metadata?: Record<string, any>;
    isPartner?: boolean;
    roles?: string[];
    file?: File;
}

class CatalogService {
    /**
     * Fetch all games
     */
    async fetchGames(): Promise<Game[]> {
        try {
            const response = await fetch(API_BASE_URL);
            if (!response.ok) {
                throw new Error(`Failed to fetch games: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching games:', error);
            throw error;
        }
    }

    /**
     * Fetch a single game by ID
     */
    async fetchGameById(id: string): Promise<Game> {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch game: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching game:', error);
            throw error;
        }
    }

    /**
     * Create a new game
     */
    async createGame(data: CreateGameDto | FormData): Promise<Game> {
        try {
            const isFormData = data instanceof FormData;
            const headers: HeadersInit = {};

            if (!isFormData) {
                headers['Content-Type'] = 'application/json';
            }

            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: { ...headers, ...getAuthHeaders() },
                body: isFormData ? data : JSON.stringify(data),
            });

            if (!response.ok) {
                const errorMessage = await buildErrorMessage(response, response.statusText);
                throw new Error(`Failed to create game: ${errorMessage}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error creating game:', error);
            throw error;
        }
    }

    /**
     * Update an existing game
     */
    async updateGame(id: string, data: UpdateGameDto | FormData): Promise<Game> {
        try {
            const isFormData = data instanceof FormData;
            const headers: HeadersInit = {};

            if (!isFormData) {
                headers['Content-Type'] = 'application/json';
            }

            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'PATCH',
                headers: { ...headers, ...getAuthHeaders() },
                body: isFormData ? data : JSON.stringify(data),
            });

            if (!response.ok) {
                const errorMessage = await buildErrorMessage(response, response.statusText);
                throw new Error(`Failed to update game: ${errorMessage}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error updating game:', error);
            throw error;
        }
    }

    /**
     * Delete a game
     */
    async deleteGame(id: string): Promise<{ message: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            if (!response.ok) {
                const errorMessage = await buildErrorMessage(response, response.statusText);
                throw new Error(`Failed to delete game: ${errorMessage}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error deleting game:', error);
            throw error;
        }
    }
}

export default new CatalogService();
