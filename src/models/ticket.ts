// Ticket & Reservation TypeScript Models and Interfaces

// Ticket Status
export const TicketStatus = {
    PENDING: 'PENDING',
    VALID: 'VALID',
    USED: 'USED',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED',
} as const;
export type TicketStatus = typeof TicketStatus[keyof typeof TicketStatus];

// Reservation Status
export const ReservationStatus = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    CANCELLED: 'CANCELLED',
} as const;
export type ReservationStatus = typeof ReservationStatus[keyof typeof ReservationStatus];

// Bundle interface for ticket discounts
export interface Bundle {
    quantity: number;
    price: number;
}

// Ticket Type configuration for tournaments
export interface TicketType {
    name: string;           // "VIP", "Standard", "Premium"
    price: number;
    capacity: number;
    bundles?: Bundle[];     // Optional bundle discounts
}

export interface TournamentInfo {
    _id?: string;
    name?: string;
    startDate?: string;
    bannerImageUrl?: string;
    [key: string]: unknown;
}

// Ticket interface
export interface Ticket {
    _id: string;
    ticketNumber: string;
    tournament: string | TournamentInfo;      // Tournament ID or populated object
    user: string;            // User ID or populated object
    status: TicketStatus;
    price: number;
    purchaseDate: string;
    qrCode: string;          // Base64 data URL or QR code data
    type: string;            // "VIP", "Standard", etc.
    perks?: string;          // Special perks for VIP tickets
    usedAt?: string;
    expiresAt?: string;
    createdAt: string;
    updatedAt: string;
}

// Reservation interface
export interface Reservation {
    _id: string;
    user: string;            // User ID or populated object
    tournament: string | TournamentInfo;      // Tournament ID or populated object
    tickets: string[] | Ticket[];  // Array of ticket IDs or populated tickets
    status: ReservationStatus;
    totalPrice: number;
    reservedAt: string;
    expiresAt: string;       // 15-minute expiration from reservedAt
    paymentId?: string;
    createdAt: string;
    updatedAt: string;
}

// DTOs for API requests
export interface CreateReservationDto {
    tournament: string;
    user: string;
    ticketType: string;
    quantity: number;
}

export interface ConfirmReservationDto {
    paymentId: string;
}

export interface UpdateTicketStatusDto {
    status: TicketStatus;
}
