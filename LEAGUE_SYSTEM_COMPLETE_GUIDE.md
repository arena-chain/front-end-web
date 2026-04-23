# ArenaChain — League System: Complete Frontend Guide
> React + Vite + TailwindCSS + shadcn/ui  
> Backend: NestJS + MongoDB on `http://localhost:3000`  
> Stack: React Query, Axios, react-tournament-brackets, date-fns

---

## Table of Contents

1. [Tech Stack & Setup](#1-tech-stack--setup)
2. [Routing Structure](#2-routing-structure)
3. [TypeScript Interfaces (all entities)](#3-typescript-interfaces)
4. [API Service Layer](#4-api-service-layer)
5. [Admin Flow — Step-by-Step Wizard](#5-admin-flow--step-by-step-wizard)
6. [Admin Pages Specification](#6-admin-pages-specification)
7. [Player-Facing Public Pages](#7-player-facing-public-pages)
8. [Component Specifications](#8-component-specifications)
9. [All API Endpoints Reference](#9-all-api-endpoints-reference)
10. [Design System](#10-design-system)

---

## 1. Tech Stack & Setup

### Install Dependencies
```bash
npm install @tanstack/react-query axios react-router-dom date-fns
npm install @radix-ui/react-tabs @radix-ui/react-dialog @radix-ui/react-select
npm install react-tournament-brackets
npm install lucide-react
npm install react-hot-toast
npx shadcn@latest init
npx shadcn@latest add button card badge tabs dialog select table progress
```

### Axios Instance (`src/services/api.ts`)
```ts
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

### React Query Setup (`src/main.tsx`)
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const queryClient = new QueryClient();

<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

---

## 2. Routing Structure

```tsx
// src/App.tsx routes
<Routes>
  {/* ── Public ── */}
  <Route path="/"                          element={<HomePage />} />
  <Route path="/leagues"                   element={<LeaguesPublicPage />} />
  <Route path="/leagues/:leagueId"         element={<LeaguePublicPage />} />
  <Route path="/leagues/:leagueId/seasons/:seasonId" element={<TournamentPage />} />

  {/* ── Admin ── */}
  <Route path="/admin" element={<AdminLayout />}>
    <Route index                           element={<AdminDashboard />} />
    <Route path="leagues"                  element={<AdminLeaguesPage />} />
    <Route path="leagues/:leagueId"        element={<AdminLeagueHub />}>
      <Route path="seasons"                element={<AdminSeasonsTab />} />
      <Route path="seasons/:seasonId"      element={<AdminSeasonHub />} />
      <Route path="seasons/:seasonId/setup" element={<SeasonSetupWizard />} />
    </Route>
  </Route>
</Routes>
```

---

## 3. TypeScript Interfaces

```ts
// src/models/league.ts

export interface League {
  _id: string;
  name: string;
  level: 'INTERNATIONAL' | 'CONTINENTAL' | 'NATIONAL' | 'REGIONAL';
  regionId: string;
  gameId: string;
  description?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Season {
  _id: string;
  leagueId: string;
  rulesId?: string;
  name: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  status: 'PLANNED' | 'ONGOING' | 'FINISHED';
  description?: string;
}

export interface SeasonRule {
  _id: string;
  seasonId: string;
  matchType: 'BO1' | 'BO3' | 'BO5';
  pointsWin: number;
  pointsLoss: number;
  pointsDraw: number;
  maxTeams: number;
  forfeitCountsAsLoss: boolean;
  maxForfeitsBeforeDisqualification: number;
}

export interface PrizePool {
  _id: string;
  seasonId: string;
  totalAmount: number;
  currency: string;
  distribution: { rank: number; amount: number; label?: string }[];
  sponsor?: string;
}

export interface SeasonTeam {
  _id: string;
  seasonId: string;
  teamId: string;
  seed?: number;
  status: 'ACTIVE' | 'DISQUALIFIED' | 'WITHDRAWN';
  qualifiedFromName?: string;
  qualifiedFromSeasonId?: string;
  qualifiedViaRank?: number;
  finalRank?: number;
}

export interface Stage {
  _id: string;
  seasonId: string;
  leagueId?: string;
  name: string;
  stageType: 'LEAGUE' | 'BRACKET' | 'SWISS' | 'GROUPS';
  orderIndex: number;
  startAt: string;
  endAt: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
  advancementCount: number;
  eliminationCount: number;
  swissConfig?: { roundsToWin: number; roundsToEliminate: number; maxRounds: number };
  bracketId?: string;
  description?: string;
}

export interface Group {
  _id: string;
  seasonId: string;
  stageId: string;
  name: string;          // "Group A", "Group B" …
  groupIndex: number;
  teamIds: string[];
  advancementCount: number;
}

export interface Round {
  _id: string;
  seasonId: string;
  stageId?: string;
  roundNumber: number;
  startDate: string;
  endDate: string;
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED';
}

export interface GameResult {
  gameNumber: number;
  winnerId: string;
  mapName?: string;
  team1Score?: number;
  team2Score?: number;
  durationMinutes?: number;
}

export interface Match {
  _id: string;
  roundId: string;
  seasonId: string;
  team1Id: string;
  team2Id: string;
  format: 'BO1' | 'BO3' | 'BO5';
  formatOverride?: 'BO1' | 'BO3' | 'BO5';
  groupId?: string;
  streamUrl?: string;
  scheduledStart: string;
  scheduledEnd?: string;
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'FORFEIT' | 'CANCELLED';
  team1GamesWon: number;
  team2GamesWon: number;
  winnerId?: string;
  loserId?: string;
  games: GameResult[];
  matchOrder?: number;
}

export interface Standings {
  _id: string;
  seasonId: string;
  stageId?: string;
  groupId?: string;
  teamId: string;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  gamesWon: number;
  gamesLost: number;
  gameDiff: number;
  rank: number;
}

export interface BracketSlot {
  slotId: string;        // e.g. "UB-R1M1", "LB-R2M1", "GF", "R1S1"
  roundNumber: number;
  position: number;
  team1Id?: string;
  team2Id?: string;
  winnerId?: string;
  loserId?: string;
  matchId?: string;
  nextSlotId?: string;
  loserNextSlotId?: string;   // double elimination only
  status: 'PENDING' | 'READY' | 'COMPLETED' | 'BYE';
}

export interface Bracket {
  _id: string;
  seasonId: string;
  stageId?: string;
  format: 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION';
  totalRounds: number;
  slots: BracketSlot[];
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
  championId?: string;
}

export interface SeasonRoster {
  _id: string;
  seasonId: string;
  teamId: string;
  playerIds: string[];
  status: 'OPEN' | 'LOCKED';
  minRosterSize: number;
  maxRosterSize: number;
}

export interface Team {
  _id: string;
  name: string;
  tag?: string;
  logoUrl?: string;
  type: 'amateur' | 'pro';
}
```

---

## 4. API Service Layer

```ts
// src/services/league.service.ts
import api from './api';
import type { League, Season, Stage, Group, Match, Standings, Bracket, PrizePool, SeasonTeam } from '../models/league';

// ── Leagues ──
export const getLeagues = () => api.get<League[]>('/leagues').then(r => r.data);
export const getLeague = (id: string) => api.get<League>(`/leagues/${id}`).then(r => r.data);
export const createLeague = (dto: Partial<League>) => api.post<League>('/leagues', dto).then(r => r.data);
export const updateLeague = (id: string, dto: Partial<League>) => api.patch<League>(`/leagues/${id}`, dto).then(r => r.data);

// ── Seasons ──
export const getSeasons = (leagueId: string) => api.get<Season[]>(`/seasons?leagueId=${leagueId}`).then(r => r.data);
export const getSeason = (id: string) => api.get<Season>(`/seasons/${id}`).then(r => r.data);
export const createSeason = (dto: Partial<Season>) => api.post<Season>('/seasons', dto).then(r => r.data);
export const updateSeason = (id: string, dto: Partial<Season>) => api.patch<Season>(`/seasons/${id}`, dto).then(r => r.data);

// ── Rules ──
export const getSeasonRule = (seasonId: string) => api.get(`/season-rules/season/${seasonId}`).then(r => r.data);
export const createSeasonRule = (dto: any) => api.post('/season-rules', dto).then(r => r.data);
export const updateSeasonRule = (id: string, dto: any) => api.patch(`/season-rules/${id}`, dto).then(r => r.data);

// ── Prize Pool ──
export const getPrizePool = (seasonId: string) => api.get<PrizePool>(`/prize-pool?seasonId=${seasonId}`).then(r => r.data);
export const createPrizePool = (dto: Partial<PrizePool>) => api.post<PrizePool>('/prize-pool', dto).then(r => r.data);
export const updatePrizePool = (id: string, dto: Partial<PrizePool>) => api.patch<PrizePool>(`/prize-pool/${id}`, dto).then(r => r.data);

// ── Teams (registration) ──
export const getSeasonTeams = (seasonId: string) => api.get<SeasonTeam[]>(`/league-registration/season/${seasonId}`).then(r => r.data);
export const registerTeam = (dto: { seasonId: string; teamId: string; seed?: number; qualifiedFromName?: string }) =>
  api.post('/league-registration', dto).then(r => r.data);
export const removeTeam = (id: string) => api.delete(`/league-registration/${id}`).then(r => r.data);

// ── Stages ──
export const getStages = (seasonId: string) => api.get<Stage[]>(`/stages?seasonId=${seasonId}`).then(r => r.data);
export const createStage = (dto: Partial<Stage>) => api.post<Stage>('/stages', dto).then(r => r.data);
export const updateStage = (id: string, dto: Partial<Stage>) => api.patch<Stage>(`/stages/${id}`, dto).then(r => r.data);

// ── Groups ──
export const getGroups = (stageId: string) => api.get<Group[]>(`/groups?stageId=${stageId}`).then(r => r.data);
export const createGroup = (dto: Partial<Group>) => api.post<Group>('/groups', dto).then(r => r.data);
export const assignTeamsToGroup = (groupId: string, teamIds: string[]) =>
  api.patch(`/groups/${groupId}/teams/bulk`, { teamIds }).then(r => r.data);

// ── Rounds ──
export const getRounds = (seasonId: string, stageId?: string) =>
  api.get(`/rounds/season/${seasonId}${stageId ? `?stageId=${stageId}` : ''}`).then(r => r.data);
export const generateRounds = (dto: {
  seasonId: string; stageId?: string; weekCount?: number;
  generateMatches?: boolean; stageType?: string; swissRoundNumber?: number;
}) => api.post('/rounds/generate', dto).then(r => r.data);

// ── Matches ──
export const getMatches = (params: {
  seasonId?: string; roundId?: string; groupId?: string;
  status?: string; from?: string;
}) => {
  const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v))).toString();
  return api.get<Match[]>(`/matches?${q}`).then(r => r.data);
};
export const submitMatchResult = (matchId: string, dto: {
  team1GamesWon: number; team2GamesWon: number;
  games?: { gameNumber: number; winnerId: string; mapName?: string; team1Score?: number; team2Score?: number }[];
}) => api.patch(`/matches/${matchId}/result`, dto).then(r => r.data);
export const forfeitMatch = (matchId: string, dto: { forfeitingTeamId: string; forfeitReason?: string }) =>
  api.patch(`/matches/${matchId}/forfeit`, dto).then(r => r.data);
export const updateMatch = (matchId: string, dto: Partial<Match>) =>
  api.patch(`/matches/${matchId}`, dto).then(r => r.data);

// ── Standings ──
export const getStandings = (seasonId: string, groupId?: string, stageId?: string) => {
  const q = new URLSearchParams({ seasonId, ...(groupId && { groupId }), ...(stageId && { stageId }) }).toString();
  return api.get<Standings[]>(`/standings?${q}`).then(r => r.data);
};

// ── Bracket ──
export const getBracket = (seasonId: string) => api.get<Bracket>(`/brackets/season/${seasonId}`).then(r => r.data);
export const generateBracket = (dto: {
  seasonId: string; format: 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION';
  stageId?: string; seededTeamIds?: string[];
}) => api.post<Bracket>('/brackets/generate', dto).then(r => r.data);
export const advanceBracketSlot = (seasonId: string, dto: {
  slotId: string; winnerId: string; loserId?: string; matchId?: string;
}) => api.patch(`/brackets/${seasonId}/advance`, dto).then(r => r.data);

// ── Teams lookup ──
export const getTeam = (id: string) => api.get<Team>(`/teams/${id}`).then(r => r.data);
export const getAllTeams = () => api.get<Team[]>('/teams').then(r => r.data);
```

---

## 5. Admin Flow — Step-by-Step Wizard

This is the **exact sequence** a league organizer follows to set up a full tournament.
Implement this as a stepper component on the season setup page.

```
STEP 1 — Create League
  POST /leagues
  Fields: name, gameId (from GET /catalog), level, regionId, logoUrl, description

STEP 2 — Create Season
  POST /seasons  { leagueId, name, startDate, endDate, registrationDeadline }
  → Season status starts as "PLANNED"

STEP 3 — Attach Rules
  POST /season-rules
  { seasonId, matchType: "BO3", pointsWin: 3, pointsLoss: 0,
    maxTeams: 16, forfeitCountsAsLoss: true, maxForfeitsBeforeDisqualification: 2 }
  → PATCH /seasons/:id { rulesId: "<rule._id>" }

STEP 4 — Set Prize Pool
  POST /prize-pool
  { seasonId, totalAmount: 50000, currency: "USD",
    distribution: [
      { rank: 1, amount: 20000, label: "1st Place" },
      { rank: 2, amount: 10000, label: "2nd Place" },
      { rank: 3, amount: 5000,  label: "3rd-4th" },
      { rank: 4, amount: 5000,  label: "3rd-4th" }
    ]
  }

STEP 5 — Register Teams
  For each team: POST /league-registration
  { seasonId, teamId, seed: 1, qualifiedFromName: "DACH Qualifier" }
  → SeasonRoster is auto-created by backend
  → Standings row is auto-created by backend

STEP 6 — Create Stages
  Example (VCL format): two stages
  POST /stages  { seasonId, name: "Group Stage", stageType: "GROUPS",
    orderIndex: 0, advancementCount: 2, eliminationCount: 0,
    startAt: "...", endAt: "...", rulesetId: "<rule._id>" }
  POST /stages  { seasonId, name: "Playoffs", stageType: "BRACKET",
    orderIndex: 1, advancementCount: 1, startAt: "...", endAt: "...", rulesetId: "<rule._id>" }

STEP 7a — Create Groups (only if stage is GROUPS)
  POST /groups  { seasonId, stageId: "<groupStageId>", name: "Group A", groupIndex: 0, advancementCount: 2 }
  POST /groups  { seasonId, stageId, name: "Group B", groupIndex: 1, advancementCount: 2 }
  POST /groups  { seasonId, stageId, name: "Group C", groupIndex: 2, advancementCount: 2 }
  POST /groups  { seasonId, stageId, name: "Group D", groupIndex: 3, advancementCount: 2 }

  Assign teams to groups:
  PATCH /groups/:groupAId/teams/bulk  { teamIds: ["team1", "team2", "team3", "team4"] }
  PATCH /groups/:groupBId/teams/bulk  { teamIds: ["team5", "team6", "team7", "team8"] }
  …etc

STEP 7b — Generate Rounds (for GROUPS / SWISS / LEAGUE stages)
  POST /rounds/generate
  {
    seasonId, stageId: "<groupStageId>",
    generateMatches: true, stageType: "GROUPS"
    // For Swiss stages use: stageType: "SWISS", swissRoundNumber: 1
  }
  → Creates rounds + round-robin matches for all groups automatically

STEP 8 — Open Season
  PATCH /seasons/:id  { status: "ONGOING" }

STEP 9 — Submit Match Results (during the season)
  PATCH /matches/:matchId/result
  {
    team1GamesWon: 2, team2GamesWon: 1,
    games: [
      { gameNumber: 1, winnerId: "team1Id", mapName: "Haven",   team1Score: 13, team2Score: 9 },
      { gameNumber: 2, winnerId: "team2Id", mapName: "Bind",    team1Score: 10, team2Score: 13 },
      { gameNumber: 3, winnerId: "team1Id", mapName: "Ascent",  team1Score: 13, team2Score: 7 }
    ]
  }
  → Standings auto-updated
  → Bracket slot auto-advanced (if playoffs)

STEP 10 — Generate Playoff Bracket
  First: get top teams from group standings
  POST /brackets/generate
  {
    seasonId, stageId: "<playoffStageId>",
    format: "DOUBLE_ELIMINATION",
    seededTeamIds: ["1stGroupA", "1stGroupB", "1stGroupC", "1stGroupD"]
  }

STEP 11 — Close Season
  PATCH /seasons/:id  { status: "FINISHED" }
  Then set finalRank on each team:
  PATCH /league-registration/:id  { finalRank: 1 }
```

---

## 6. Admin Pages Specification

### 6.1 `/admin/leagues` — League List

**Layout:** Page header + "New League" button + grid of cards  
**Each card shows:** logo, name, game badge, level badge, region, active/inactive toggle  
**Actions per card:** Edit, View Hub, Toggle Active

```tsx
// Key data fetch
const { data: leagues } = useQuery({ queryKey: ['leagues'], queryFn: getLeagues });
```

**New League Modal fields:**
- Name (text)
- Game (select from GET /catalog)
- Level (select: INTERNATIONAL / CONTINENTAL / NATIONAL / REGIONAL)
- Region (text)
- Logo URL (text or file upload)
- Description (textarea)

---

### 6.2 `/admin/leagues/:leagueId` — League Hub

**Layout:** Sticky top bar with league name + level badge + "New Season" button  
**Tab navigation:** Overview | Seasons | Teams | Prize Pools

**Overview tab:**
- League info card (name, game, level, region, description)
- Stats row: total seasons, active teams, total matches played

**Seasons tab:**
- List of seasons as cards, each showing: name, date range, status badge, team count
- Clicking a season → navigate to `/admin/leagues/:leagueId/seasons/:seasonId`
- "New Season" button → opens creation modal

---

### 6.3 `/admin/leagues/:leagueId/seasons/:seasonId` — Season Hub

This is the **main admin workspace**. Use a tab layout with these tabs:

```
[Overview] [Rules] [Teams] [Prize Pool] [Stages] [Rounds & Matches] [Brackets] [Standings]
```

#### Overview Tab
- Season name, date range, status badge
- Quick stats: N teams registered, N rounds, N matches completed
- Status control buttons:
  - "Open Season" → PATCH status: ONGOING (only shown if PLANNED)
  - "Close Season" → PATCH status: FINISHED (only shown if ONGOING)
- Setup Wizard button (links to `/setup` route for new seasons)

#### Rules Tab
- Shows current rules in a clean card if set
- Fields: Match Format (BO1/BO3/BO5), Points Win/Loss/Draw, Max Teams,
  Forfeit rules
- "Edit Rules" button → inline edit form
- "Attach Rules" button if no rules yet

#### Teams Tab
- Table: Seed | Team Logo + Name | Status | Qualified From | Roster Size | Actions
- "Register Team" button → modal: select team (GET /teams), optional seed + qualifiedFromName
- Per-row: Remove team (DELETE), Edit seed
- Status badge: ACTIVE (green) / DISQUALIFIED (red) / WITHDRAWN (gray)

#### Prize Pool Tab
- Distribution table: Rank | Label | Amount | % of Total
- Edit inline per row
- "Set Prize Pool" button if none exists

#### Stages Tab
- Ordered list of stages (Group Stage, Playoffs, etc.)
- Each stage card: name, type badge, dates, advancementCount, status
- "Add Stage" → modal with fields: name, stageType (LEAGUE/GROUPS/BRACKET/SWISS),
  orderIndex, advancementCount, eliminationCount, dates
- For SWISS stages: show swissConfig fields (roundsToWin, roundsToEliminate, maxRounds)
- For GROUPS stages: "Manage Groups" → opens group assignment UI

**Group Assignment UI (sub-panel for GROUPS stage):**
- Shows groups (A, B, C, D) as columns
- Teams list on the left (all registered teams not yet assigned)
- Drag & drop or click to assign teams to groups
- "Create Groups" button: auto-creates groups A/B/C/D based on team count
- API: PATCH /groups/:id/teams/bulk

#### Rounds & Matches Tab
- Top section: "Generate Rounds" button
  - Modal fields: weekCount (optional), generateMatches toggle, stageId select
  - For Swiss stage: show swissRoundNumber field
- Round list as accordion, each round shows:
  - Round number, date range, status badge
  - Match table inside each round:
    - Team 1 vs Team 2 | Format | Date | Status | Score | Actions
  - "Start Round" / "Complete Round" buttons per round
  - Per match row: "Submit Score" button → opens score form

**Score Form Modal:**
- Team 1 Games Won (number) | Team 2 Games Won (number)
- Map results section (repeats for each game in BO):
  - Map name (text), Team 1 Score, Team 2 Score
- "Submit" → PATCH /matches/:id/result
- "Forfeit" → separate button → select forfeiting team

#### Brackets Tab
- Shows if BRACKET stage exists
- "Generate Bracket" button (shown when no bracket yet):
  - Format: SINGLE_ELIMINATION / DOUBLE_ELIMINATION
  - Option to manually seed teams or auto-seed from standings
- Bracket visual using `react-tournament-brackets` library
- Double elimination: shows Upper Bracket + Lower Bracket + Grand Final sections
- Each slot shows: team logos/names, score (if completed), "TBD" if pending
- Admin can click a READY slot to manually advance the winner if auto-advance fails

**Bracket rendering logic:**
```tsx
// Transform backend BracketSlot[] to react-tournament-brackets format
const upperBracket = slots.filter(s => s.slotId.startsWith('UB-') || s.slotId.startsWith('R'));
const lowerBracket = slots.filter(s => s.slotId.startsWith('LB-'));
const grandFinal   = slots.filter(s => s.slotId === 'GF');
```

#### Standings Tab
- Tabs per group if GROUPS stage: [Overall] [Group A] [Group B] [Group C] [Group D]
- Table: Rank | Team | Played | W | L | Points | Game Diff
- Top N rows highlighted green (advancement zone based on advancementCount)
- Bottom N rows highlighted red (elimination zone based on eliminationCount)
- "Recalculate" button → POST /standings/recalculate

---

## 7. Player-Facing Public Pages

### 7.1 `/leagues` — Tournament Directory

**Layout:** Hero section + filter bar + grid  
**Filters:** Game (All / VALORANT / LoL / CS2), Level, Region  
**Card:** League logo, name, level badge, game badge, region, current season status  
**Click → `/leagues/:leagueId`**

---

### 7.2 `/leagues/:leagueId` — League Landing

**Layout:** Full-width header with league branding  
**Header:** Logo, name, game, level, region, description  
**Season cards:** Each season: name, dates, status (ONGOING / PLANNED / FINISHED),
  team count, prize pool amount  
**Click season → `/leagues/:leagueId/seasons/:seasonId`**

---

### 7.3 `/leagues/:leagueId/seasons/:seasonId` — Tournament Page ⭐

This is the **Liquipedia-style public page**. This is the most important page.

**Layout structure:**
```
┌─────────────────────────────────────────────────┐
│  HEADER: Tournament banner, name, dates, game   │
│  game logo | Level badge | Status badge         │
├─────────────────────────────────────────────────┤
│  [Overview] [Participants] [Group Stage]         │
│  [Playoffs] [Schedule] [Prize Pool]              │
├─────────────────────────────────────────────────┤
│  TAB CONTENT (see below)                        │
└─────────────────────────────────────────────────┘
```

#### Overview Tab
- Format description card (from stages):
  ```
  Group Stage: 4 groups of 4 teams, round-robin, top 2 advance
  Playoffs: Double Elimination, Best-of-3 (Grand Final: Best-of-5)
  ```
- Next match countdown: nearest SCHEDULED match with streamUrl
- Current standings summary (top 3 per group)
- Recent results (last 5 completed matches)

**Countdown component:**
```tsx
// Uses scheduledStart from match
const diff = new Date(match.scheduledStart).getTime() - Date.now();
const days = Math.floor(diff / 86400000);
const hours = Math.floor((diff % 86400000) / 3600000);
const mins = Math.floor((diff % 3600000) / 60000);
const secs = Math.floor((diff % 60000) / 1000);
// → "2d 14h 32m 11s"
```

#### Participants Tab
**Layout:** Grid of team cards (3-4 per row)  
**Each card:**
- Team logo
- Team name + tag
- "Qualified via: [qualifiedFromName]" badge
- Seed number
- Player roster (collapsed, expand on click): shows playerIds mapped to user names
- Region flag if available

**Data fetching:**
```ts
const seasonTeams = await getSeasonTeams(seasonId);  // GET /league-registration/season/:id
const teams = await Promise.all(seasonTeams.map(st => getTeam(st.teamId)));
const rosters = await Promise.all(seasonTeams.map(st =>
  api.get(`/season-roster?seasonId=${seasonId}&teamId=${st.teamId}`).then(r => r.data)
));
```

#### Group Stage Tab
**Layout:** 2x2 grid of group cards (for 4 groups)  
**Each group card:**
- Group name header (Group A, Group B…)
- Mini standings table: Rank | Team logo+name | W | L | Pts
  - Green background: top N rows (advancementCount)
  - Red background: bottom row if eliminationCount > 0
- Match results section below standings: shows all group matches with scores

**Data fetching:**
```ts
const groups = await getGroups(groupStageId);   // GET /groups?stageId=xxx
for (const group of groups) {
  const standings = await getStandings(seasonId, group._id);  // GET /standings?groupId=xxx
  const matches = await getMatches({ seasonId, groupId: group._id });
}
```

#### Playoffs Tab
**Layout:** Full-width bracket visualization  
**Use `react-tournament-brackets` library:**
```tsx
import { DoubleEliminationBracket, SVGViewer } from 'react-tournament-brackets';

// Transform slots to the library format:
const transformToLibFormat = (slots: BracketSlot[], teamMap: Record<string, Team>) => {
  return slots.map(slot => ({
    id: slot.slotId,
    name: `Round ${slot.roundNumber}`,
    nextMatchId: slot.nextSlotId,
    tournamentRoundText: slot.slotId,
    startTime: '',
    state: slot.status === 'COMPLETED' ? 'DONE'
         : slot.status === 'READY' ? 'RUNNING' : 'SCHEDULED',
    participants: [
      {
        id: slot.team1Id ?? 'tbd',
        name: slot.team1Id ? teamMap[slot.team1Id]?.name ?? 'TBD' : 'TBD',
        isWinner: slot.winnerId === slot.team1Id,
        resultText: slot.status === 'COMPLETED' ? String(slot.team1GamesWon ?? '') : null,
      },
      {
        id: slot.team2Id ?? 'tbd',
        name: slot.team2Id ? teamMap[slot.team2Id]?.name ?? 'TBD' : 'TBD',
        isWinner: slot.winnerId === slot.team2Id,
        resultText: slot.status === 'COMPLETED' ? String(slot.team2GamesWon ?? '') : null,
      },
    ],
  }));
};
```

#### Schedule Tab
**Layout:** Calendar / list view toggle  
**Match card:**
```
┌─────────────────────────────────────────────────┐
│  Thu 03 Apr 2026  18:00 UTC                     │
│  ┌──────────┐  2  –  1  ┌──────────┐           │
│  │ Team Phm │           │ Nxs Frc  │           │
│  └──────────┘  COMPLETED└──────────┘           │
│  📺 Watch Live                    Map Details ▼ │
└─────────────────────────────────────────────────┘
```
- SCHEDULED matches: show countdown + "Watch Live" (streamUrl) if set
- COMPLETED: show score + expandable map-by-map breakdown
- Filter buttons: [All] [Upcoming] [Completed] [Group Stage] [Playoffs]

**Data fetching:**
```ts
// Upcoming
const upcoming = await getMatches({ seasonId, status: 'SCHEDULED', from: new Date().toISOString() });
// All
const all = await getMatches({ seasonId });
```

#### Prize Pool Tab
**Layout:** Centered table  
```
┌─────────────────────────────────────┐
│      TOTAL PRIZE POOL: $50,000      │
├──────┬───────────────┬──────────────┤
│  1st │ Champion      │  $20,000     │
│  2nd │ Runner-up     │  $10,000     │
│ 3-4th│ Semifinalists │  $5,000 each │
└──────┴───────────────┴──────────────┘
         Sponsor: [name if set]
```

---

## 8. Component Specifications

### `<SeasonStatusBadge status={} />`
```tsx
const colors = {
  PLANNED: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  ONGOING: 'bg-green-500/20 text-green-400 border-green-500/30',
  FINISHED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};
```

### `<StandingsTable seasonId groupId? stageId? advancementCount? eliminationCount? />`
- Fetches `GET /standings?seasonId=&groupId=&stageId=`
- Shows rank, team logo+name, W, L, Pts, Game Diff
- Green rows: top `advancementCount` teams
- Red rows: bottom `eliminationCount` teams

### `<MatchCard match teams showAdmin? />`
- Shows both teams with logos, format badge, scheduled time
- COMPLETED: shows score prominently, expandable game-by-map details
- SCHEDULED: shows countdown, streamUrl Watch button if set
- Admin mode: adds "Submit Score" + "Forfeit" buttons

### `<GroupGrid stageId seasonId />`
- Fetches groups for stage, renders 2×2 or 1×N grid
- Each group: mini standings + matches

### `<BracketViewer seasonId format />`
- Fetches bracket, transforms to react-tournament-brackets format
- SINGLE_ELIMINATION: use `SingleEliminationBracket`
- DOUBLE_ELIMINATION: use `DoubleEliminationBracket`
- UB slots: `slotId.startsWith('UB-')`, LB: `slotId.startsWith('LB-')`, GF: `slotId === 'GF'`

### `<Countdown targetDate />`
```tsx
// Updates every second with setInterval
// Shows: Xd Xh Xm Xs or "LIVE" if past time
// Color: normal → orange (< 1h) → red (< 10min) → green "LIVE"
```

### `<SeasonSetupWizard seasonId />`
- 6-step stepper: Rules → Prize Pool → Stages → Groups → Rounds → Review
- Step completion stored in local state
- Each step: form + submit + "Next" button
- Review step: summary of everything + "Open Season" final button

---

## 9. All API Endpoints Reference

### Leagues
| Method | URL | Body / Params |
|---|---|---|
| GET | `/leagues` | — |
| GET | `/leagues/:id` | — |
| POST | `/leagues` | `{ name, level, regionId, gameId, logoUrl?, description? }` |
| PATCH | `/leagues/:id` | partial fields |

### Seasons
| Method | URL | Body / Params |
|---|---|---|
| GET | `/seasons?leagueId=` | filter by league |
| GET | `/seasons/:id` | — |
| POST | `/seasons` | `{ leagueId, name, startDate, endDate, registrationDeadline }` |
| PATCH | `/seasons/:id` | `{ status?, rulesId?, description? }` |

### Season Rules
| Method | URL | Body |
|---|---|---|
| GET | `/season-rules/season/:seasonId` | — |
| POST | `/season-rules` | `{ seasonId, matchType, pointsWin, pointsLoss, maxTeams, forfeitCountsAsLoss }` |
| PATCH | `/season-rules/:id` | partial fields |

### Prize Pool
| Method | URL | Body |
|---|---|---|
| GET | `/prize-pool?seasonId=` | — |
| POST | `/prize-pool` | `{ seasonId, totalAmount, currency, distribution[], sponsor? }` |
| PATCH | `/prize-pool/:id` | partial fields |

### League Registration (Season Teams)
| Method | URL | Body |
|---|---|---|
| GET | `/league-registration/season/:seasonId` | — |
| POST | `/league-registration` | `{ seasonId, teamId, seed?, qualifiedFromName?, status? }` |
| PATCH | `/league-registration/:id` | `{ seed?, status?, finalRank?, qualifiedFromName? }` |
| DELETE | `/league-registration/:id` | — |

### Stages
| Method | URL | Body |
|---|---|---|
| GET | `/stages?seasonId=` | — |
| GET | `/stages/:id` | — |
| POST | `/stages` | `{ seasonId, name, stageType, orderIndex, advancementCount, eliminationCount, startAt, endAt, rulesetId, swissConfig? }` |
| PATCH | `/stages/:id` | partial fields |

### Groups
| Method | URL | Body |
|---|---|---|
| GET | `/groups?stageId=` | — |
| GET | `/groups?seasonId=` | — |
| GET | `/groups/:id` | — |
| POST | `/groups` | `{ seasonId, stageId, name, groupIndex, advancementCount?, teamIds? }` |
| PATCH | `/groups/:id` | partial fields |
| POST | `/groups/:id/teams` | `{ teamId }` |
| DELETE | `/groups/:id/teams` | `{ teamId }` |
| PATCH | `/groups/:id/teams/bulk` | `{ teamIds: string[] }` |
| DELETE | `/groups/:id` | — |

### Rounds
| Method | URL | Body |
|---|---|---|
| GET | `/rounds/season/:seasonId` | `?stageId=` optional |
| POST | `/rounds` | `{ seasonId, stageId?, roundNumber, startDate, endDate }` |
| POST | `/rounds/generate` | `{ seasonId, stageId?, weekCount?, generateMatches?, stageType?, swissRoundNumber? }` |
| PATCH | `/rounds/:id` | `{ status? }` |
| DELETE | `/rounds/:id` | — |

### Matches
| Method | URL | Body / Params |
|---|---|---|
| GET | `/matches?seasonId=&groupId=&status=&from=` | filters |
| GET | `/matches?roundId=` | by round |
| GET | `/matches/:id` | — |
| POST | `/matches` | `{ roundId, seasonId, team1Id, team2Id, scheduledStart, groupId?, streamUrl?, formatOverride? }` |
| PATCH | `/matches/:id` | `{ streamUrl?, scheduledStart?, formatOverride? }` |
| PATCH | `/matches/:id/result` | `{ team1GamesWon, team2GamesWon, games? }` |
| PATCH | `/matches/:id/forfeit` | `{ forfeitingTeamId, forfeitReason? }` |

### Standings
| Method | URL | Params |
|---|---|---|
| GET | `/standings?seasonId=&stageId=&groupId=` | all filters optional except seasonId |
| POST | `/standings/recalculate` | `{ seasonId }` |

### Brackets
| Method | URL | Body |
|---|---|---|
| GET | `/brackets/season/:seasonId` | — |
| POST | `/brackets/generate` | `{ seasonId, format, stageId?, seededTeamIds? }` |
| PATCH | `/brackets/:seasonId/advance` | `{ slotId, winnerId, loserId?, matchId? }` |

### Season Rosters
| Method | URL | Body |
|---|---|---|
| GET | `/season-roster?seasonId=&teamId=` | — |
| POST | `/season-roster` | `{ seasonId, teamId, minRosterSize?, maxRosterSize? }` |
| POST | `/season-roster/:seasonId/:teamId/players` | `{ playerId }` |
| DELETE | `/season-roster/:seasonId/:teamId/players` | `{ playerId }` |

---

## 10. Design System

### Color Palette (dark theme — matches the admin panel screenshots)
```css
--bg-primary:    #0d0f14;   /* page background */
--bg-card:       #13161e;   /* card background */
--bg-elevated:   #1a1e28;   /* modal, dropdown */
--border:        #2a2f3d;   /* card borders */
--accent-green:  #22c55e;   /* primary action, ACTIVE/ONGOING */
--accent-yellow: #eab308;   /* SCHEDULED, warnings */
--accent-red:    #ef4444;   /* FORFEIT, eliminated */
--accent-blue:   #3b82f6;   /* bracket UB slots */
--accent-purple: #a855f7;   /* bracket LB slots */
--text-primary:  #f1f5f9;
--text-muted:    #64748b;
```

### Level Badges
```tsx
const levelColors = {
  INTERNATIONAL: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  CONTINENTAL:   'bg-blue-500/20   text-blue-400   border border-blue-500/30',
  NATIONAL:      'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  REGIONAL:      'bg-gray-500/20   text-gray-400   border border-gray-500/30',
};
```

### Stage Type Badges
```tsx
const stageColors = {
  GROUPS:  'bg-blue-500/20   text-blue-400',
  BRACKET: 'bg-purple-500/20 text-purple-400',
  SWISS:   'bg-orange-500/20 text-orange-400',
  LEAGUE:  'bg-green-500/20  text-green-400',
};
```

### Typography
- Page title: `text-2xl font-bold text-white`
- Section header: `text-lg font-semibold text-white`
- Label: `text-sm font-medium text-slate-400`
- Body: `text-sm text-slate-300`
- Muted: `text-xs text-slate-500`

### Bracket Slot Colors
```tsx
// Upper bracket slots: blue left border
'border-l-4 border-blue-500 bg-slate-800/50'
// Lower bracket slots: purple left border
'border-l-4 border-purple-500 bg-slate-800/50'
// Grand Final: gold border
'border-l-4 border-yellow-500 bg-slate-800/50'
// Completed: green background tint
'bg-green-900/20'
// Ready to play: pulsing orange border
'border-orange-500 animate-pulse'
```

---

## Quick Start Checklist for Developer

```
□ Install all dependencies listed in section 1
□ Create src/services/api.ts with the Axios instance
□ Create src/services/league.service.ts with all API functions
□ Create src/models/league.ts with all TypeScript interfaces
□ Add React Query provider to main.tsx
□ Set up React Router with the route structure from section 2
□ Build AdminLeagueHub (/admin/leagues/:leagueId) with tab navigation
□ Build SeasonSetupWizard with 6 steps
□ Build TournamentPage (/leagues/:id/seasons/:id) with 6 tabs
□ Integrate react-tournament-brackets for bracket visualization
□ Add countdown timer component for upcoming matches
```

---

*Last updated: March 2026 — Backend v2 (14 entities including Group, Stage with Swiss/Groups support, Double Elimination bracket, per-map game results)*
