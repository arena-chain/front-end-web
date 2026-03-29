import type { Ticket, UpdateTicketStatusDto } from '../models/ticket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Ticket Service - Handles all ticket-related API calls
 */
const ticketService = {
    /**
     * Get all tickets for the current user
     * @returns Array of user's tickets
     */
    async getMyTickets(): Promise<Ticket[]> {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        // Decode token to get userId (simple decoding for now)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const { sub: userId } = JSON.parse(jsonPayload);

        const response = await fetch(`${API_URL}/tickets/my-tickets?userId=${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch tickets');
        }

        return response.json();
    },

    /**
     * Add ticket types to a tournament
     * @param tournamentId - Tournament ID
     * @param ticketTypes - Array of ticket types
     */
    async addTicketTypesToTournament(tournamentId: string, ticketTypes: any[]): Promise<any> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/tournements/${tournamentId}/tickets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ ticketTypes }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to add ticket types');
        }

        return response.json();
    },

    /**
     * Get available ticket types for a specific tournament
     * @param tournamentId - Tournament ID
     */
    async getAvailableTickets(tournamentId: string): Promise<any> {
        const response = await fetch(`${API_URL}/tournements/${tournamentId}/available-tickets`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch available tickets');
        }
        return response.json();
    },


    /**
     * Book a new ticket
     * @param tournamentId - Tournament ID
     * @param ticketType - Type of ticket (VIP, Standard)
     * @param quantity - Number of tickets
     */
    async bookTicket(tournamentId: string, ticketType: string, quantity: number): Promise<Ticket[]> {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        // Decode token to get userId
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const { sub: userId } = JSON.parse(jsonPayload);

        const response = await fetch(`${API_URL}/tickets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                tournament: tournamentId,
                user: userId,
                type: ticketType,
                quantity
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to book tickets');
        }

        return response.json();
    },

    /**
     * Get all tickets (Admin only)
     * @returns Array of all tickets
     */
    async getAllTickets(): Promise<Ticket[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/tickets`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch all tickets');
        }

        return response.json();
    },

    /**
     * Get a ticket by ID
     * @param id - Ticket ID
     * @returns Ticket details with QR code
     */
    async getTicketById(id: string): Promise<Ticket> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/tickets/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch ticket');
        }

        return response.json();
    },

    /**
     * Search for a ticket by ticket number (Admin/Scanner)
     * @param ticketNumber - Ticket number to search
     * @returns Ticket details
     */
    async searchTicketByNumber(ticketNumber: string): Promise<Ticket> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/tickets/search?number=${encodeURIComponent(ticketNumber)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ticket not found');
        }

        return response.json();
    },

    /**
     * Update ticket status (Admin only)
     * @param id - Ticket ID
     * @param data - Updated status
     * @returns Updated ticket
     */
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
            throw new Error(error.message || 'Failed to update ticket status');
        }

        return response.json();
    },

    /**
     * Delete a ticket (Admin only)
     * @param id - Ticket ID
     */
    async deleteTicket(id: string): Promise<void> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/tickets/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete ticket');
        }
    },
};

export default ticketService;
