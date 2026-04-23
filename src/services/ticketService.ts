import type { Ticket, UpdateTicketStatusDto } from '../models/ticket';
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
            let message = 'Failed to fetch tickets';
            try {
                const error = await response.json();
                message = error?.message || message;
            } catch {
                // keep default
            }
            throw new Error(message);
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },

    async getAvailableTickets(tournamentId: string): Promise<any> {
        const endpoints = [
            `${API_URL}/tournements/${tournamentId}/available-tickets`,
            `${API_URL}/tournaments/${tournamentId}/available-tickets`,
            `${API_URL}/tournements/${tournamentId}`,
            `${API_URL}/tournaments/${tournamentId}`,
        ];

        const normalize = (ticket: any) => {
            const name = String(ticket?.name ?? ticket?.type ?? ticket?.ticketType ?? ticket?.label ?? '').trim();
            if (!name) return null;
            return {
                name,
                price: Number(ticket?.price ?? ticket?.amount ?? ticket?.cost ?? 0) || 0,
                capacity: Number(ticket?.capacity ?? ticket?.maxCapacity ?? ticket?.quantity ?? ticket?.stock ?? 0) || 0,
                bundles: Array.isArray(ticket?.bundles) ? ticket.bundles : [],
                isNft: Boolean(ticket?.isNft ?? ticket?.nft ?? name.toUpperCase().includes('NFT')),
            };
        };

        const merged = new Map<string, any>();
        let lastError = 'Failed to fetch available tickets';

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint);
                if (!response.ok) {
                    try {
                        const err = await response.json();
                        lastError = err?.message || lastError;
                    } catch {
                        lastError = `Failed to fetch available tickets (HTTP ${response.status})`;
                    }
                    continue;
                }

                const payload = await response.json();
                const candidates = Array.isArray(payload?.availableTickets)
                    ? payload.availableTickets
                    : Array.isArray(payload?.ticketTypes)
                        ? payload.ticketTypes
                        : Array.isArray(payload)
                            ? payload
                            : [];

                candidates
                    .map(normalize)
                    .filter(Boolean)
                    .forEach((ticket) => {
                        if (!ticket) return;
                        const key = ticket.name.toUpperCase();
                        if (!merged.has(key)) merged.set(key, ticket);
                    });
            } catch {
                // Continue trying alternative endpoints.
            }
        }

        if (merged.size === 0) {
            throw new Error(lastError);
        }

        return { availableTickets: Array.from(merged.values()) };
    },

    async addTicketTypesToTournament(tournamentId: string, ticketTypes: any[]): Promise<any> {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };

        const normalize = (ticket: any) => {
            const name = String(ticket?.name ?? ticket?.type ?? ticket?.ticketType ?? ticket?.label ?? '').trim();
            if (!name) return null;
            return {
                name,
                price: Number(ticket?.price ?? ticket?.amount ?? ticket?.cost ?? 0),
                capacity: Number(ticket?.capacity ?? ticket?.maxCapacity ?? ticket?.quantity ?? ticket?.stock ?? 0),
                bundles: Array.isArray(ticket?.bundles) ? ticket.bundles : [],
                isNft: Boolean(ticket?.isNft ?? ticket?.nft ?? name.toUpperCase().includes('NFT')),
                perks: ticket?.perks ? String(ticket.perks) : undefined,
                metadata: ticket?.metadata && typeof ticket.metadata === 'object' ? ticket.metadata : undefined,
            };
        };

        // Preserve existing backend ticket types so admin edits don't accidentally wipe VIP NFT.
        const mergedByName = new Map<string, any>();
        try {
            const existingRes = await fetch(`${API_URL}/tournements/${tournamentId}`);
            if (existingRes.ok) {
                const existingTournament = await existingRes.json();
                const existingTypes = Array.isArray(existingTournament?.ticketTypes) ? existingTournament.ticketTypes : [];
                existingTypes
                    .map(normalize)
                    .filter(Boolean)
                    .forEach((ticket) => {
                        if (!ticket) return;
                        mergedByName.set(ticket.name.toUpperCase(), ticket);
                    });
            }
        } catch {
            // Continue with provided ticket types only if prefetch fails.
        }

        (Array.isArray(ticketTypes) ? ticketTypes : [])
            .map(normalize)
            .filter(Boolean)
            .forEach((ticket) => {
                if (!ticket) return;
                mergedByName.set(ticket.name.toUpperCase(), ticket);
            });

        const payload = {
            ticketTypes: Array.from(mergedByName.values()),
        };

        const tryParseError = async (res: Response): Promise<string> => {
            try {
                const data = await res.json();
                return data?.message || data?.error || `HTTP ${res.status}`;
            } catch {
                return `HTTP ${res.status}`;
            }
        };

        const primary = await fetch(`${API_URL}/tournements/${tournamentId}/tickets`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });
        if (primary.ok) return primary.json();

        const fallbackPatch = await fetch(`${API_URL}/tournements/${tournamentId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(payload),
        });
        if (fallbackPatch.ok) return fallbackPatch.json();

        const fallbackAlt = await fetch(`${API_URL}/tournaments/${tournamentId}/tickets`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });
        if (fallbackAlt.ok) return fallbackAlt.json();

        const primaryError = await tryParseError(primary);
        const patchError = await tryParseError(fallbackPatch);
        const altError = await tryParseError(fallbackAlt);
        throw new Error(`Failed to add ticket types. primary=${primaryError}; patch=${patchError}; alt=${altError}`);
    },

    async bookTicket(
        tournamentId: string,
        ticketType: string,
        quantity: number,
        paymentIntentId?: string
    ): Promise<Ticket[]> {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        const userId = this.getUserIdForTicketOps(token);

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
        const basePayload = {
            tournament: tournamentId,
            tournamentId,
            user: userId,
            userId,
            type: ticketType,
            ticketType,
            quantity,
        };

        let response = await fetch(`${API_URL}/tickets`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                ...basePayload,
                ...(paymentIntentId ? { paymentIntentId } : {}),
            }),
        });

        if (!response.ok && paymentIntentId) {
            let retryWithoutPaymentIntent = false;
            try {
                const err = await response.json();
                const msg = String(err?.message || '').toLowerCase();
                retryWithoutPaymentIntent =
                    response.status === 400 && (msg.includes('paymentintentid') || msg.includes('should not exist'));
            } catch {
                // Keep default behavior.
            }

            if (retryWithoutPaymentIntent) {
                response = await fetch(`${API_URL}/tickets`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(basePayload),
                });
            }
        }

        if (!response.ok) {
            let message = 'Failed to book tickets';
            try {
                const error = await response.json();
                message = error?.message || message;
            } catch {
                message = `Failed to book tickets (HTTP ${response.status})`;
            }
            throw new Error(message);
        }

        try {
            const data = await response.json();
            return Array.isArray(data) ? data : [data];
        } catch {
            // Some backends return 201/204 without JSON body.
            return [];
        }
    },

    async createNftTicketForCurrentUser(
        tournamentId: string,
        ticketType: string,
        quantity: number = 1
    ): Promise<Ticket[]> {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        const userId = this.getUserIdForTicketOps(token);

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };

        const requestedQuantity = Math.max(1, Math.floor(Number(quantity) || 1));
        const payload = {
            tournament: tournamentId,
            tournamentId,
            user: userId,
            userId,
            type: ticketType,
            ticketType,
            quantity: requestedQuantity,
            // Hint to backends that support explicit NFT ticket minting.
            mintNft: true,
            nft: true,
            isNft: true,
        };

        const endpoints = [
            `${API_URL}/admin/tickets/nft`,
            `${API_URL}/admin/tickets/mint`,
            `${API_URL}/tickets/nft`,
            `${API_URL}/tickets/mint`,
            `${API_URL}/tickets`,
        ];

        let lastError = 'Failed to create NFT ticket';

        for (const endpoint of endpoints) {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                try {
                    const data = await response.json();
                    const normalized = Array.isArray(data) ? data : [data];
                    if (normalized.length > 0) return normalized;
                    return [];
                } catch {
                    // Some backends return 201 without JSON body.
                    return [];
                }
            }

            if (response.status === 404) continue;

            try {
                const error = await response.json();
                lastError = error?.message || lastError;
            } catch {
                lastError = `Failed to create NFT ticket (HTTP ${response.status})`;
            }
        }

        throw new Error(lastError);
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

    async searchTicketByNumber(ticketNumber: string): Promise<Ticket> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/tickets/search?number=${encodeURIComponent(ticketNumber)}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || 'Ticket not found');
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

    async cancelMyTicket(id: string): Promise<void> {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        const response = await fetch(`${API_URL}/tickets/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
            let message = 'Failed to cancel ticket';
            try {
                const error = await response.json();
                message = error?.message || message;
            } catch {
                // keep default
            }
            throw new Error(message);
        }
    },
};

export default ticketService;
