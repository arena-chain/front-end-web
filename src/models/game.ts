export interface GameRole {
    name: string;
    description?: string;
    icon?: string; // Optional icon for the role
}

export interface Game {
    _id: string;
    title: string;
    genre: string;
    description?: string;
    coverImageUrl?: string; // Banner/Cover image
    logoUrl?: string; // Square logo
    isPartner: boolean;
    roles: string[]; // e.g. ["Duelist", "Controller", "Initiator", "Sentinel"]
    activeTournaments: number;

    // New fields from Catalog Form
    publisher?: string;
    platforms?: string[];
    releaseDate?: string; // ISO 8601 string
    isActive?: boolean;
    metadata?: Record<string, any>;
}

// Mock Data for Development
export const MOCK_GAMES: Game[] = [
    {
        _id: '1',
        title: 'Valorant',
        genre: 'Tactical Shooter',
        description: 'A 5v5 character-based tactical shooter by Riot Games.',
        coverImageUrl: 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/bltc9ebc37d81a976c6/5e7171734293e62f6b8e8f80/valorant-wallpaper-2.jpg',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Valorant_logo_-_pink_color_version.svg/1200px-Valorant_logo_-_pink_color_version.svg.png',
        isPartner: true,
        roles: ['Duelist', 'Controller', 'Initiator', 'Sentinel'],
        activeTournaments: 12
    },
    {
        _id: '2',
        title: 'League of Legends',
        genre: 'MOBA',
        description: 'A team-based strategy game where two teams of five powerful champions face off.',
        coverImageUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_0.jpg',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/LoL_Icon_Flat_GOLD.svg/1200px-LoL_Icon_Flat_GOLD.svg.png',
        isPartner: true,
        roles: ['Top', 'Jungle', 'Mid', 'ADC', 'Support'],
        activeTournaments: 8
    },
    {
        _id: '3',
        title: 'Counter-Strike 2',
        genre: 'Tactical Shooter',
        description: 'The next era of Counter-Strike is here.',
        coverImageUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg',
        isPartner: false,
        roles: ['IGL', 'Entry Fragger', 'Support', 'AWPer', 'Lurker'],
        activeTournaments: 5
    }
];
