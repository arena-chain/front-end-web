import type { ScoutedPlayerProfile, PlayerMatchSummary, LeaderboardEntry } from '../../services/scouterService';
import { STATIC_LEADERBOARD } from './staticLeaderboard';

export interface PlayerHighlight {
  id: string;
  title: string;
  thumbnailUrl: string;
  url: string;
  duration?: string;
  date?: string;
  type: 'vod' | 'highlight';
}

export interface StreamerInfo {
  platform: 'twitch' | 'youtube' | 'kick';
  channelUrl: string;
  channelName: string;
  followers?: string;
  isLive?: boolean;
}

/** Demo matches for static player profiles */
const DEMO_MATCHES: PlayerMatchSummary[] = [
  { _id: 'm1', roundId: { roundNumber: 12 }, scheduledStart: '2025-02-15T18:00:00Z', status: 'COMPLETED', team1GamesWon: 2, team2GamesWon: 1 },
  { _id: 'm2', roundId: { roundNumber: 11 }, scheduledStart: '2025-02-10T20:00:00Z', status: 'COMPLETED', team1GamesWon: 0, team2GamesWon: 2 },
  { _id: 'm3', roundId: { roundNumber: 10 }, scheduledStart: '2025-02-05T19:00:00Z', status: 'COMPLETED', team1GamesWon: 2, team2GamesWon: 0 },
  { _id: 'm4', roundId: { roundNumber: 9 }, scheduledStart: '2025-01-28T18:30:00Z', status: 'COMPLETED', team1GamesWon: 1, team2GamesWon: 2 },
  { _id: 'm5', roundId: { roundNumber: 8 }, scheduledStart: '2025-01-22T17:00:00Z', status: 'COMPLETED', team1GamesWon: 2, team2GamesWon: 1 },
];

/** Demo highlights/VODs for static profiles */
const DEMO_HIGHLIGHTS: PlayerHighlight[] = [
  { id: 'h1', title: 'Champions Tour Finals - Map 3 Clutch', thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ', duration: '2:34', date: '2025-02-10', type: 'highlight' },
  { id: 'h2', title: 'Full VOD vs Vitality', thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ', duration: '42:00', date: '2025-02-05', type: 'vod' },
  { id: 'h3', title: 'Ace Round - Bind', thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ', duration: '1:45', date: '2025-01-28', type: 'highlight' },
];

/** Demo streamer info – only some static players have this */
const DEMO_STREAMERS: Record<string, StreamerInfo> = {
  u1: { platform: 'twitch', channelUrl: 'https://twitch.tv/zenithgod', channelName: 'zenithgod', followers: '124K', isLive: false },
  u2: { platform: 'twitch', channelUrl: 'https://twitch.tv/shadowblade', channelName: 'shadowblade', followers: '89K', isLive: true },
  u3: { platform: 'youtube', channelUrl: 'https://youtube.com/@neonphoenix', channelName: 'NeonPhoenix', followers: '256K', isLive: false },
  u5: { platform: 'twitch', channelUrl: 'https://twitch.tv/cyberwolf', channelName: 'cyberwolf', followers: '67K', isLive: false },
  u7: { platform: 'twitch', channelUrl: 'https://twitch.tv/ghostsniper', channelName: 'ghostsniper', followers: '42K', isLive: true },
};

/** Build full demo profile from leaderboard-style user id (e.g. u1, u2) */
export function getDemoProfile(playerUserId: string): {
  profile: ScoutedPlayerProfile;
  team: LeaderboardEntry['team'];
  matches: PlayerMatchSummary[];
  highlights: PlayerHighlight[];
  streamer: StreamerInfo | null;
  stats: { killsPerRound: number; deathPerRound: number; winRate: number; headshotPct: number };
} | null {
  const lbEntry = STATIC_LEADERBOARD.find(e => (e.user as { _id: string })?._id === playerUserId);
  if (!lbEntry) return null;

  const entry = STATIC_ENTRIES.find(e => (e.user as { _id: string })?._id === playerUserId)!;
  const user = entry.user as { _id: string; nickname?: string; email?: string; country?: string; region?: string };
  const profile: ScoutedPlayerProfile = {
    _id: lbEntry._id,
    userId: { _id: user._id, nickname: user.nickname ?? 'Player', email: `${(user.nickname ?? 'player').toLowerCase().replace(/\s/g, '')}@arena.gg` },
    elo: entry.elo,
    rank: entry.tier && entry.division != null ? `${entry.tier} ${entry.division}` : (entry.tier ?? '—'),
    region: user.country ?? user.region ?? '—',
    isPro: (entry.elo ?? 0) >= 3500,
    stats: {},
  };

  const streamer = DEMO_STREAMERS[user._id] ?? null;
  const seed = user._id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const stats = {
    killsPerRound: Math.round((0.68 + (seed % 20) / 100) * 100) / 100,
    deathPerRound: Math.round((0.55 + (seed % 15) / 100) * 100) / 100,
    winRate: Math.round((52 + (seed % 25)) * 10) / 10,
    headshotPct: Math.round((20 + (seed % 18)) * 10) / 10,
  };

  return {
    profile,
    team: lbEntry.team,
    matches: DEMO_MATCHES,
    highlights: DEMO_HIGHLIGHTS,
    streamer,
    stats,
  };
}

const STATIC_ENTRIES = [
  { _id: 'static-1', user: { _id: 'u1', nickname: 'ZenithGod', country: 'South Korea', region: 'AS' }, elo: 4280, tier: 'Radiant', division: 1 },
  { _id: 'static-2', user: { _id: 'u2', nickname: 'ShadowBlade', country: 'France', region: 'EU' }, elo: 4150, tier: 'Radiant', division: 2 },
  { _id: 'static-3', user: { _id: 'u3', nickname: 'NeonPhoenix', country: 'United States', region: 'NA' }, elo: 4090, tier: 'Radiant', division: 3 },
  { _id: 'static-4', user: { _id: 'u4', nickname: 'VoidHunter', country: 'Brazil', region: 'SA' }, elo: 3980, tier: 'Radiant', division: 1 },
  { _id: 'static-5', user: { _id: 'u5', nickname: 'CyberWolf', country: 'Germany', region: 'EU' }, elo: 3850, tier: 'Immortal', division: 3 },
  { _id: 'static-6', user: { _id: 'u6', nickname: 'StormRider', country: 'Japan', region: 'AS' }, elo: 3740, tier: 'Immortal', division: 2 },
  { _id: 'static-7', user: { _id: 'u7', nickname: 'GhostSniper', country: 'United Kingdom', region: 'EU' }, elo: 3680, tier: 'Immortal', division: 1 },
  { _id: 'static-8', user: { _id: 'u8', nickname: 'PixelKnight', country: 'China', region: 'AS' }, elo: 3620, tier: 'Immortal', division: 3 },
  { _id: 'static-9', user: { _id: 'u9', nickname: 'ArcaneWitch', country: 'Sweden', region: 'EU' }, elo: 3560, tier: 'Immortal', division: 2 },
  { _id: 'static-10', user: { _id: 'u10', nickname: 'IronTitan', country: 'Australia', region: 'OCE' }, elo: 3490, tier: 'Diamond', division: 1 },
  { _id: 'static-11', user: { _id: 'u11', nickname: 'BlazeRunner', country: 'Canada', region: 'NA' }, elo: 3410, tier: 'Diamond', division: 2 },
  { _id: 'static-12', user: { _id: 'u12', nickname: 'QuantumFox', country: 'Turkey', region: 'EU' }, elo: 3350, tier: 'Diamond', division: 1 },
  { _id: 'static-13', user: { _id: 'u13', nickname: 'DarkMatter', country: 'Russia', region: 'EU' }, elo: 3290, tier: 'Diamond', division: 3 },
  { _id: 'static-14', user: { _id: 'u14', nickname: 'LunarEdge', country: 'India', region: 'AS' }, elo: 3220, tier: 'Diamond', division: 2 },
  { _id: 'static-15', user: { _id: 'u15', nickname: 'FrostByte', country: 'Poland', region: 'EU' }, elo: 3160, tier: 'Diamond', division: 1 },
  { _id: 'static-16', user: { _id: 'u16', nickname: 'VenomStrike', country: 'Mexico', region: 'NA' }, elo: 3090, tier: 'Platinum', division: 3 },
  { _id: 'static-17', user: { _id: 'u17', nickname: 'NightCrawler', country: 'Nigeria', region: 'AF' }, elo: 3010, tier: 'Platinum', division: 2 },
  { _id: 'static-18', user: { _id: 'u18', nickname: 'OmegaForce', country: 'Netherlands', region: 'EU' }, elo: 2950, tier: 'Platinum', division: 1 },
  { _id: 'static-19', user: { _id: 'u19', nickname: 'SteelPhantom', country: 'Argentina', region: 'SA' }, elo: 2880, tier: 'Platinum', division: 3 },
  { _id: 'static-20', user: { _id: 'u20', nickname: 'Player One', country: 'Tunisia', region: 'AF' }, elo: 2840, tier: 'Diamond', division: 3 },
  { _id: 'static-21', user: { _id: 'u21', nickname: 'NovaStrike', country: 'Spain', region: 'EU' }, elo: 2790, tier: 'Platinum', division: 2 },
  { _id: 'static-22', user: { _id: 'u22', nickname: 'CrimsonAce', country: 'Italy', region: 'EU' }, elo: 2720, tier: 'Platinum', division: 1 },
  { _id: 'static-23', user: { _id: 'u23', nickname: 'ThunderBolt', country: 'Egypt', region: 'AF' }, elo: 2650, tier: 'Gold', division: 3 },
  { _id: 'static-24', user: { _id: 'u24', nickname: 'PhoenixRise', country: 'Portugal', region: 'EU' }, elo: 2580, tier: 'Gold', division: 2 },
  { _id: 'static-25', user: { _id: 'u25', nickname: 'IceVein', country: 'South Africa', region: 'AF' }, elo: 2510, tier: 'Gold', division: 1 },
];
