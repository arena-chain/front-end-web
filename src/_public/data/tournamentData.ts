
export interface Team {
    id: string;
    name: string;
    logo: string;
}

export interface Match {
    id: string;
    round: 'Quarterfinals' | 'Semifinals' | 'Finals';
    team1: Team | null;
    team2: Team | null;
    score1: number | null;
    score2: number | null;
    winner: Team | null;
    date: string;
    time: string;
}

export interface Tournament {
    id: number; // Keeping number to match existing ID usage (though string is often better)
    title: string;
    game: string;
    status: 'Upcoming' | 'Ongoing' | 'Completed';
    date: string; // Display date range
    startDate: string; // ISO or specific date for logic
    endDate: string;
    prize: string;
    location: string;
    image: string;
    color: string;
    description: string;
    teams: Team[];
    bracket: Match[];
    ticketTypes?: { name: string; price: number; capacity: number; bundles?: { quantity: number; price: number }[] }[];
}

export const MOCK_TOURNAMENTS: Tournament[] = [
    {
        id: 1,
        title: "Valorant Champions 2024",
        game: "Valorant",
        status: "Ongoing",
        date: "Nov 15 - Dec 01",
        startDate: "2024-11-15",
        endDate: "2024-12-01",
        prize: "$1,000,000",
        location: "Los Angeles, CA",
        image: "https://images.unsplash.com/photo-1624138784181-dc7f5b75e526?q=80&w=2670&auto=format&fit=crop",
        color: "from-rose-500 to-red-600",
        description: "The culmination of the 2024 Valorant Champions Tour. The top 16 teams from around the world compete for the title of World Champion.",
        teams: [
            { id: 't1', name: "Fnatic", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/4/43/Fnatic_logo.svg/1200px-Fnatic_logo.svg.png" },
            { id: 't2', name: "LOUD", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/LOUD_logo.svg/1200px-LOUD_logo.svg.png" },
            { id: 't3', name: "Paper Rex", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/5/5b/Paper_Rex_logo.svg/1200px-Paper_Rex_logo.svg.png" },
            { id: 't4', name: "OpTic", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/OpTic_Gaming_logo.svg/1200px-OpTic_Gaming_logo.svg.png" },
            { id: 't5', name: "DRX", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/5/5f/DRX_logo.svg/1200px-DRX_logo.svg.png" },
            { id: 't6', name: "Evil Geniuses", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/3/3f/Evil_Geniuses_logo.svg/1200px-Evil_Geniuses_logo.svg.png" },
            { id: 't7', name: "Natus Vincere", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/Natus_Vincere_logo.svg/1200px-Natus_Vincere_logo.svg.png" },
            { id: 't8', name: "Team Liquid", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/f/f1/Team_Liquid_logo.svg/1200px-Team_Liquid_logo.svg.png" },
            // Add more dummy teams to reach 16 if needed, sticking to 8 for now for visual clarity
        ],
        bracket: [
            // Quarterfinals
            {
                id: 'q1', round: 'Quarterfinals',
                team1: { id: 't1', name: "Fnatic", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/4/43/Fnatic_logo.svg/1200px-Fnatic_logo.svg.png" },
                team2: { id: 't2', name: "LOUD", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/LOUD_logo.svg/1200px-LOUD_logo.svg.png" },
                score1: 2, score2: 1, winner: { id: 't1', name: "Fnatic", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/4/43/Fnatic_logo.svg/1200px-Fnatic_logo.svg.png" },
                date: "Nov 20", time: "18:00"
            },
            {
                id: 'q2', round: 'Quarterfinals',
                team1: { id: 't3', name: "Paper Rex", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/5/5b/Paper_Rex_logo.svg/1200px-Paper_Rex_logo.svg.png" },
                team2: { id: 't4', name: "OpTic", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/OpTic_Gaming_logo.svg/1200px-OpTic_Gaming_logo.svg.png" },
                score1: 0, score2: 2, winner: { id: 't4', name: "OpTic", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/OpTic_Gaming_logo.svg/1200px-OpTic_Gaming_logo.svg.png" },
                date: "Nov 20", time: "21:00"
            },
            {
                id: 'q3', round: 'Quarterfinals',
                team1: { id: 't5', name: "DRX", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/5/5f/DRX_logo.svg/1200px-DRX_logo.svg.png" },
                team2: { id: 't6', name: "Evil Geniuses", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/3/3f/Evil_Geniuses_logo.svg/1200px-Evil_Geniuses_logo.svg.png" },
                score1: 2, score2: 0, winner: { id: 't5', name: "DRX", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/5/5f/DRX_logo.svg/1200px-DRX_logo.svg.png" },
                date: "Nov 21", time: "18:00"
            },
            {
                id: 'q4', round: 'Quarterfinals',
                team1: { id: 't7', name: "Natus Vincere", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/Natus_Vincere_logo.svg/1200px-Natus_Vincere_logo.svg.png" },
                team2: { id: 't8', name: "Team Liquid", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/f/f1/Team_Liquid_logo.svg/1200px-Team_Liquid_logo.svg.png" },
                score1: 1, score2: 2, winner: { id: 't8', name: "Team Liquid", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/f/f1/Team_Liquid_logo.svg/1200px-Team_Liquid_logo.svg.png" },
                date: "Nov 21", time: "21:00"
            },
            // Semifinals
            {
                id: 's1', round: 'Semifinals',
                team1: { id: 't1', name: "Fnatic", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/4/43/Fnatic_logo.svg/1200px-Fnatic_logo.svg.png" },
                team2: { id: 't4', name: "OpTic", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/OpTic_Gaming_logo.svg/1200px-OpTic_Gaming_logo.svg.png" },
                score1: null, score2: null, winner: null,
                date: "Nov 25", time: "19:00"
            },
            {
                id: 's2', round: 'Semifinals',
                team1: { id: 't5', name: "DRX", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/5/5f/DRX_logo.svg/1200px-DRX_logo.svg.png" },
                team2: { id: 't8', name: "Team Liquid", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/f/f1/Team_Liquid_logo.svg/1200px-Team_Liquid_logo.svg.png" },
                score1: null, score2: null, winner: null,
                date: "Nov 25", time: "22:00"
            },
            {
                id: 'f1', round: 'Finals',
                team1: null,
                team2: null,
                score1: null, score2: null, winner: null,
                date: "Dec 01", time: "20:00"
            }
        ],
        ticketTypes: [
            { name: "Day Pass", price: 25, capacity: 1000 },
            { name: "Weekend Bundle", price: 60, capacity: 500, bundles: [{ quantity: 2, price: 100 }] },
            { name: "VIP", price: 150, capacity: 50 }
        ]
    },
    {
        id: 2,
        title: "League of Legends Worlds",
        game: "League of Legends",
        status: "Upcoming",
        date: "Oct 05 - Nov 12",
        startDate: "2024-10-05",
        endDate: "2024-11-12",
        prize: "$2,500,000",
        location: "Seoul, South Korea",
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop",
        color: "from-blue-500 to-indigo-600",
        description: "The League of Legends World Championship is the annual professional League of Legends world championship tournament hosted by Riot Games and is the culmination of each season.",
        teams: [
            { id: 't9', name: "T1", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/f/f9/T1_logo.svg/1200px-T1_logo.svg.png" },
            { id: 't10', name: "Gen.G", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/2/26/Gen.G_logo.svg/1200px-Gen.G_logo.svg.png" },
            { id: 't11', name: "G2 Esports", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/1/12/G2_Esports_logo.svg/1200px-G2_Esports_logo.svg.png" },
            { id: 't12', name: "JD Gaming", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/7/7d/JD_Gaming_logo.svg/1200px-JD_Gaming_logo.svg.png" }
        ],
        bracket: [], // Add mock matches if users click this
        ticketTypes: [
            { name: "Early Bird", price: 45, capacity: 500 },
            { name: "General Admission", price: 75, capacity: 2000 },
            { name: "VIP Experience", price: 250, capacity: 100 }
        ]
    },
    {
        id: 3,
        title: "CS2 Major Championship",
        game: "Counter-Strike 2",
        status: "Upcoming",
        date: "Dec 10 - Dec 20",
        startDate: "2024-12-10",
        endDate: "2024-12-20",
        prize: "$1,250,000",
        location: "Copenhagen, Denmark",
        image: "https://images.unsplash.com/photo-1593305841991-05c29736ce37?q=80&w=2670&auto=format&fit=crop",
        color: "from-yellow-400 to-orange-500",
        description: "The first ever CS2 Major, bringing together the absolute best aimers and tacticians on the planet.",
        teams: [],
        bracket: []
    }
];
