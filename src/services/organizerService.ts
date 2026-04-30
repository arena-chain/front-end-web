import type { Organizer } from '../models/tournament';

// Mock data for initial implementation
const MOCK_ORGANIZERS: Organizer[] = [
    {
        _id: 'org1',
        username: 'prince_musa',
        name: 'Prince Musa',
        email: 'musa@arena-chain.com',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=musa'
    },
    {
        _id: 'org2',
        username: 'cortex_admin',
        name: 'Cortex Admin',
        email: 'admin@arena-chain.com',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
    }
];

class OrganizerService {
    async fetchOrganizers(): Promise<Organizer[]> {
        // In a real app, this would be an API call
        return new Promise((resolve) => {
            setTimeout(() => resolve(MOCK_ORGANIZERS), 500);
        });
    }

    async createOrganizer(data: Partial<Organizer>): Promise<Organizer> {
        return new Promise((resolve) => {
            const newOrg: Organizer = {
                _id: 'org' + Math.random().toString(36).substring(7),
                username: data.username || 'new_user',
                name: data.name || 'New Organizer',
                email: data.email || '',
                avatarUrl: data.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`,
                bio: data.bio || '',
                verified: false
            };
            MOCK_ORGANIZERS.push(newOrg);
            setTimeout(() => resolve(newOrg), 800);
        });
    }
}

export default new OrganizerService();
