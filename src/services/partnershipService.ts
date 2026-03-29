import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export type PartnerType = 'Event Sponsor' | 'Platform Sponsor' | 'Title Sponsor' | 'Media Partner';

export interface Partnership {
    _id: string;
    name: string;
    logo?: string;
    type: PartnerType;
    website?: string;
    description?: string;
    createdAt?: string;
}

export interface CreatePartnershipDto {
    name: string;
    logo?: string;
    type: PartnerType;
    website?: string;
    description?: string;
}

export const partnershipService = {
    getAll: (): Promise<Partnership[]> =>
        axios.get(`${API}/partnerships`).then(r => r.data),

    getById: (id: string): Promise<Partnership> =>
        axios.get(`${API}/partnerships/${id}`).then(r => r.data),

    create: (dto: CreatePartnershipDto): Promise<Partnership> =>
        axios.post(`${API}/partnerships`, dto, auth()).then(r => r.data),

    update: (id: string, dto: Partial<CreatePartnershipDto>): Promise<Partnership> =>
        axios.patch(`${API}/partnerships/${id}`, dto, auth()).then(r => r.data),

    delete: (id: string): Promise<void> =>
        axios.delete(`${API}/partnerships/${id}`, auth()).then(r => r.data),
};
