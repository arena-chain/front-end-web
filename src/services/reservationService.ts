import type { Reservation, CreateReservationDto, ConfirmReservationDto } from '../models/ticket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Reservation Service - Handles all reservation-related API calls
 */
const reservationService = {
    /**
     * Create a new reservation (book tickets)
     * @param data - Reservation data (tournament, user, ticketType, quantity)
     * @returns Created reservation with 15-minute expiration
     */
    async createReservation(data: CreateReservationDto): Promise<Reservation> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/reservations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create reservation');
        }

        return response.json();
    },

    /**
     * Confirm a reservation after payment
     * @param id - Reservation ID
     * @param data - Payment confirmation data
     * @returns Confirmed reservation with tickets
     */
    async confirmReservation(id: string, data: ConfirmReservationDto): Promise<Reservation> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/reservations/${id}/confirm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to confirm reservation');
        }

        return response.json();
    },

    /**
     * Get all reservations for the current user
     * @returns Array of user's reservations
     */
    async getMyReservations(): Promise<Reservation[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/reservations/my-reservations`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch reservations');
        }

        return response.json();
    },

    /**
     * Get all reservations (Admin only)
     * @returns Array of all reservations
     */
    async getAllReservations(): Promise<Reservation[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/reservations`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch all reservations');
        }

        return response.json();
    },

    /**
     * Get a reservation by ID
     * @param id - Reservation ID
     * @returns Reservation details
     */
    async getReservationById(id: string): Promise<Reservation> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/reservations/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch reservation');
        }

        return response.json();
    },

    /**
     * Cancel a reservation
     * @param id - Reservation ID
     */
    async cancelReservation(id: string): Promise<void> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/reservations/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to cancel reservation');
        }
    },
};

export default reservationService;
