import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export type SeasonStatus = 'PLANNED' | 'ONGOING' | 'FINISHED';

export interface Season {
    _id: string;
    leagueId: string;
    rulesId: string | { _id: string; name: string; formatType: string; matchType: string };
    name: string;
    registrationDeadline: string;
    startDate: string;
    endDate: string;
    status: SeasonStatus;
    description?: string;
    createdAt?: string;
}

export interface CreateSeasonDto {
    leagueId: string;
    rulesId: string;
    name: string;
    registrationDeadline: string;
    startDate: string;
    endDate: string;
    description?: string;
}

export const seasonService = {
    getByLeague: (leagueId: string): Promise<Season[]> =>
        axios.get(`${API}/seasons?leagueId=${leagueId}`).then(r => r.data),

    getById: (id: string): Promise<Season> =>
        axios.get(`${API}/seasons/${id}`).then(r => r.data),

    create: (dto: CreateSeasonDto): Promise<Season> =>
        axios.post(`${API}/seasons`, dto, auth()).then(r => r.data),

    update: (id: string, dto: Partial<CreateSeasonDto>): Promise<Season> =>
        axios.patch(`${API}/seasons/${id}`, dto, auth()).then(r => r.data),

    activate: (id: string): Promise<Season> =>
        axios.patch(`${API}/seasons/${id}/activate`, {}, auth()).then(r => r.data),

    close: (id: string): Promise<Season> =>
        axios.patch(`${API}/seasons/${id}/close`, {}, auth()).then(r => r.data),

    delete: (id: string): Promise<void> =>
        axios.delete(`${API}/seasons/${id}`, auth()).then(r => r.data),

    getStandings: (seasonId: string) =>
        axios.get(`${API}/standings?seasonId=${seasonId}`).then(r => r.data),
};
