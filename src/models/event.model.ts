import type { TicketType } from './ticket';

export interface LeagueEvent {
    _id: string;
    leagueId: string;
    name: string;
    description?: string;
    date: string;
    location: string;
    isOnline: boolean;
    totalCapacity: number;
    remainingCapacity: number;
    ticketTypes: TicketType[];
    bannerImageUrl?: string;
    status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
    createdAt: string;
    updatedAt: string;
}

export interface CreateEventDto {
    leagueId: string;
    name: string;
    description?: string;
    date: string;
    location: string;
    isOnline: boolean;
    totalCapacity: number;
    ticketTypes: TicketType[];
}
