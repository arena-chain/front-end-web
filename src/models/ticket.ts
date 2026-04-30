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

// Ticket Category
export const TicketCategory = {
    STANDARD: 'STANDARD',
    NFT: 'NFT',
} as const;
export type TicketCategory = typeof TicketCategory[keyof typeof TicketCategory];

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

// League Info interface
export interface LeagueInfo {
    _id?: string;
    name?: string;
    startDate?: string;
    [key: string]: unknown;
}

// Ticket Metadata interface
export interface TicketMetadata {
    gate?: string;
    section?: string;
    seat?: string;
    row?: string;
    [key: string]: unknown;
}

// Ticket interface
export interface Ticket {
    _id: string;
    ticketNumber: string;
    league: string | LeagueInfo;      // League ID or populated object
    user: string;            // User ID or populated object
    category: TicketCategory;
    status: TicketStatus;
    price: number;
    purchaseDate: string;
    qrCode: string;          // Base64 data URL or QR code data
    type: string;            // "League Entry", "VIP", etc.
    perks?: string;          // Special perks for VIP tickets
    nftTokenId?: string;     // NFT token ID if applicable
    nftContractAddress?: string; // NFT contract address if applicable
    blockchain?: string;     // "Polygon", "Ethereum", etc.
    usedAt?: string;
    expiresAt?: string;
    metadata?: TicketMetadata;
    createdAt: string;
    updatedAt: string;
}

// Reservation interface
export interface Reservation {
    _id: string;
    user: string;            // User ID or populated object
    league: string | LeagueInfo;      // League ID or populated object
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
    league: string;
    user: string;
    ticketType: string;
    quantity: number;
}

export interface CreateTicketDto {
    league: string;
    user: string;
    category: TicketCategory;
    type?: string;
    price?: number;
    quantity?: number;
}

export interface ConfirmReservationDto {
    paymentId: string;
}

export interface UpdateTicketStatusDto {
    status: TicketStatus;
}
