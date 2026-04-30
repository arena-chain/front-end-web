import type { Ticket, UpdateTicketStatusDto, CreateTicketDto } from '../models/ticket';
import { getApiBase } from '../lib/apiBase';

const API_URL = getApiBase();

const ticketService = {
    decodeUserIdFromToken(token: string): string {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const { sub: userId } = JSON.parse(jsonPayload);
        return userId;
    },

    getUserIdForTicketOps(token?: string): string {
        const resolvedToken = token || localStorage.getItem('token') || '';
        if (resolvedToken) {
            try {
                return this.decodeUserIdFromToken(resolvedToken);
            } catch {
                // Continue with fallback sources
            }
        }

        const directUserId = localStorage.getItem('userId');
        if (directUserId) return directUserId;

        try {
            const rawUser = localStorage.getItem('user');
            if (rawUser) {
                const parsedUser = JSON.parse(rawUser);
                const candidate = parsedUser?._id || parsedUser?.id;
                if (candidate) return String(candidate);
            }
        } catch {
            // Ignore malformed local storage.
        }

        throw new Error('User ID is missing. Please log in again.');
    },

    async getMyTickets(): Promise<Ticket[]> {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        const userId = this.getUserIdForTicketOps(token);
        const response = await fetch(`${API_URL}/tickets/my-tickets?userId=${userId}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Error ${response.status}: ${text || 'Empty response'}`);
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },

    async getLeagueTickets(leagueId: string): Promise<Ticket[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/tickets?leagueId=${leagueId}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch league tickets');
        return response.json();
    },

    async createNftTicket(dto: CreateTicketDto): Promise<Ticket> {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        const response = await fetch(`${API_URL}/tickets/nft`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(dto),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || 'Failed to create NFT ticket');
        }

        return response.json();
    },

    async getTicketById(id: string): Promise<Ticket> {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await fetch(`${API_URL}/tickets/${id}`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            let message = 'Failed to fetch ticket';
            try {
                const error = await response.json();
                message = error?.message || message;
            } catch {
                // keep default
            }
            throw new Error(message);
        }

        return response.json();
    },

    async getAllTickets(): Promise<Ticket[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/tickets`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || 'Failed to fetch all tickets');
        }
        return response.json();
    },

    async updateTicketStatus(id: string, data: UpdateTicketStatusDto): Promise<Ticket> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/tickets/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || 'Failed to update ticket status');
        }
        return response.json();
    },

    async deleteTicket(id: string): Promise<void> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/tickets/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || 'Failed to delete ticket');
        }
    },

    async validateTicket(ticketNumber: string): Promise<any> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/tickets/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ ticketNumber }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || 'Failed to validate ticket');
        }
        return response.json();
    },

    async getTemplates(): Promise<Ticket[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/tickets/market-templates`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
        });
        
        const text = await response.text();
        if (!response.ok) {
            try {
                const error = JSON.parse(text);
                throw new Error(error?.message || 'Failed to fetch ticket templates');
            } catch {
                throw new Error(`Error ${response.status}: ${text || 'Empty response'}`);
            }
        }
        
        try {
            return JSON.parse(text);
        } catch (err) {
            console.error('Failed to parse JSON from market-templates:', text);
            throw new Error(`Malformed JSON response: ${text.slice(0, 50)}...`);
        }
    },

    async updateTemplate(leagueId: string, data: any): Promise<Ticket> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/tickets/market-templates/${leagueId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || 'Failed to update ticket template');
        }
        return response.json();
    },

    async addTicketTypesToTournament(tournamentId: string, ticketTypes: any[]): Promise<any> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${getApiBase()}/tournements/${tournamentId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ ticketTypes }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || 'Failed to add ticket types to tournament');
        }
        return response.json();
    },

    async addTicketTypesToLeague(leagueId: string, ticketTypes: any[]): Promise<any> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${getApiBase()}/leagues/${leagueId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ ticketTypes }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || 'Failed to add ticket types to league');
        }
        return response.json();
    },

    async createNftTicketForCurrentUser(tournamentId: string, ticketName: string, quantity: number): Promise<any[]> {
        const token = localStorage.getItem('token');
        const userId = this.getUserIdForTicketOps(token);
        
        const tickets = [];
        for (let i = 0; i < quantity; i++) {
            const response = await fetch(`${API_URL}/tickets/nft`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    league: tournamentId, // Reusing league field for tournament ID in backend
                    user: userId,
                    category: 'NFT',
                    type: ticketName,
                    quantity: 1
                }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error?.message || `Failed to mint NFT ${i + 1}/${quantity}`);
            }
            tickets.push(await response.json());
        }
        return tickets;
    }
};

export default ticketService;
