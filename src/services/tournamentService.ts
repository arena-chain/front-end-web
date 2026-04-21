import type {
    Tournament,
    CreateTournamentDto,
    UpdateTournamentDto,
    AddPhaseDto,
    UpdatePhaseStatusDto,
} from '../models/tournament';
import { PhaseName } from '../models/tournament';
import { getApiBase } from '../lib/apiBase';

// Backend controller path (intentional spelling: `tournements`)
const API_BASE_URL = `${getApiBase()}/tournements`;

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

class TournamentService {
    /**
     * Fetch all tournaments
     */
    async fetchTournaments(): Promise<Tournament[]> {
        try {
            const response = await fetch(API_BASE_URL);
            if (!response.ok) {
                throw new Error(`Failed to fetch tournaments: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching tournaments:', error);
            throw error;
        }
    }

    /**
     * Fetch a single tournament by ID
     */
    async fetchTournamentById(id: string): Promise<Tournament> {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch tournament: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching tournament:', error);
            throw error;
        }
    }

    /**
     * Create a new tournament
     */
    async createTournament(data: CreateTournamentDto | FormData): Promise<Tournament> {
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
                throw new Error(`Failed to create tournament: ${errorMessage}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error creating tournament:', error);
            throw error;
        }
    }

    /**
     * Update an existing tournament
     */
    async updateTournament(id: string, data: UpdateTournamentDto): Promise<Tournament> {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders(),
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const errorMessage = await buildErrorMessage(response, response.statusText);
                throw new Error(`Failed to update tournament: ${errorMessage}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error updating tournament:', error);
            throw error;
        }
    }

    /**
     * Delete a tournament
     */
    async deleteTournament(id: string): Promise<{ message: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            if (!response.ok) {
                const errorMessage = await buildErrorMessage(response, response.statusText);
                throw new Error(`Failed to delete tournament: ${errorMessage}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error deleting tournament:', error);
            throw error;
        }
    }

    /**
     * Register a team to a tournament
     */
    async registerTeam(tournamentId: string, teamId: string): Promise<Tournament> {
        try {
            const response = await fetch(`${API_BASE_URL}/${tournamentId}/register-team`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders(),
                },
                body: JSON.stringify({ teamId }),
            });
            if (!response.ok) {
                const errorMessage = await buildErrorMessage(response, response.statusText);
                throw new Error(`Failed to register team: ${errorMessage}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error registering team:', error);
            throw error;
        }
    }

    /**
     * Unregister a team from a tournament
     */
    async unregisterTeam(tournamentId: string, teamId: string): Promise<Tournament> {
        try {
            const response = await fetch(`${API_BASE_URL}/${tournamentId}/unregister-team/${teamId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            if (!response.ok) {
                const errorMessage = await buildErrorMessage(response, response.statusText);
                throw new Error(`Failed to unregister team: ${errorMessage}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error unregistering team:', error);
            throw error;
        }
    }

    /**
     * Add a phase to a tournament
     */
    async addPhase(tournamentId: string, phase: AddPhaseDto): Promise<Tournament> {
        try {
            const response = await fetch(`${API_BASE_URL}/${tournamentId}/phases`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders(),
                },
                body: JSON.stringify(phase),
            });
            if (!response.ok) {
                const errorMessage = await buildErrorMessage(response, response.statusText);
                throw new Error(`Failed to add phase: ${errorMessage}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error adding phase:', error);
            throw error;
        }
    }

    /**
     * Update a phase status
     */
    async updatePhaseStatus(
        tournamentId: string,
        phaseName: PhaseName,
        data: UpdatePhaseStatusDto
    ): Promise<Tournament> {
        try {
            const response = await fetch(`${API_BASE_URL}/${tournamentId}/phases/${phaseName}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders(),
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const errorMessage = await buildErrorMessage(response, response.statusText);
                throw new Error(`Failed to update phase status: ${errorMessage}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error updating phase status:', error);
            throw error;
        }
    }

    /**
     * Update tournament status
     */
    async updateTournamentStatus(id: string, status: typeof import('../models/tournament').TournamentStatus[keyof typeof import('../models/tournament').TournamentStatus]): Promise<Tournament> {
        return this.updateTournament(id, { status });
    }
}

export default new TournamentService();
