// Sample reels catalog — used by PlayerReelsPage in static / preview mode.
// Replaced by a network call later once the highlights queue is wired.
//
// Paths are Vite asset URLs (hashed, cached). Add MP4s next to this file and
// import them below.

import cs from './cs.mp4';
import dota from './dota.mp4';
import lolc from './lolc.mp4';
import val from './val.mp4';

export type SampleReel = {
    id: string;
    src: string;
    title: string;
    creator: string;
    description?: string;
    likes: number;
    comments: number;
    shares: number;
};

export const SAMPLE_REELS: SampleReel[] = [
    {
        id: 'reel-cs',
        src: cs,
        title: 'Counter-Strike highlight',
        creator: 'AWPerOne',
        description: 'Clean entry frag on A site — full team trade.',
        likes: 2100,
        comments: 142,
        shares: 58,
    },
    {
        id: 'reel-dota',
        src: dota,
        title: 'Dota 2 teamfight',
        creator: 'MidKing',
        description: 'Black Hole into Cataclysm — wipe at Rosh.',
        likes: 1840,
        comments: 96,
        shares: 41,
    },
    {
        id: 'reel-lol',
        src: lolc,
        title: 'League clutch',
        creator: 'SoloCarry',
        description: '1v2 under tower with perfect cooldown rotation.',
        likes: 3200,
        comments: 210,
        shares: 89,
    },
    {
        id: 'reel-val',
        src: val,
        title: 'Valorant ace',
        creator: 'HeadshotHannah',
        description: 'Operator 4K to close out overtime.',
        likes: 4100,
        comments: 301,
        shares: 120,
    },
];
