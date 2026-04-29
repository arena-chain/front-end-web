# User-Side Leagues System (Frontend)

This document explains how the **Leagues system is implemented from the user side** in the frontend app.

## 1) User entry points

Users can access leagues from two main contexts:

- **Public pages (no player dashboard required)**
  - `/leagues` -> `src/_public/pages/LeaguesPage.tsx`
  - `/leagues/:id` -> `src/_public/pages/LeaguesPage.tsx`
  - `/leagues/:leagueId/seasons/:seasonId` -> `src/_public/pages/TournamentPage.tsx`
- **Player dashboard (authenticated player)**
  - `/player/leagues` -> `src/player/pages/PlayerLeagues.tsx`
  - `/player/leagues/:id` -> `src/player/pages/PlayerLeagues.tsx`
  - `/player/leagues/:id/hub` -> `src/player/pages/PlayerLeagueWikiPage.tsx`

Route wiring is in `src/App.tsx`.

## 2) Main player experience (`PlayerLeagues`)

File: `src/player/pages/PlayerLeagues.tsx`

This is the primary player-facing league hub. It implements:

- **Left rail of leagues**
  - Loads all leagues with `leagueService.getAllLeagues()`
  - Selecting a league navigates to `/player/leagues/:id`
- **League header**
  - Displays level, status, format, max teams, and date range
  - Includes CTA buttons:
    - `Tournament wiki` -> `/player/leagues/:id/hub`
    - `Get Tickets` -> `/player/events`
- **Tabs**
  - `Live Stream`
  - `Standings`
  - `Seasons`
  - `Tournament Wiki` (embedded wiki component)

### Data loaded in `PlayerLeagues`

- `leagueService.getAllLeagues()` -> all leagues
- `leagueService.getLeagueStandings(leagueId)` -> registration/league standings
- `seasonService.getByLeague(leagueId)` -> seasons list
- `getMatchesBySeason(seasonId)` -> season matches
- `getAdminStandings(seasonId)` -> season standings table
- `stageService.getBySeason(seasonId)` -> stages per season (lazy-loaded on season expand)

### Live stream behavior

In `Live Stream` tab:

- If a match is `ONGOING` and has HTTPS `streamUrl`, an iframe embed is shown.
- If live match exists without embed, a broadcast placeholder is shown.
- If no live match, it shows standby/demo/empty states based on season and env flags.

## 3) Tournament wiki experience (`PlayerLeagueWikiPage`)

File: `src/player/pages/PlayerLeagueWikiPage.tsx`

This page (and embedded mode inside `PlayerLeagues`) is the detailed league encyclopedia view:

- Selects league by URL param or embedded prop (`embeddedLeagueId`)
- Loads league + seasons, auto-picks ongoing season if available
- For selected season, fetches all detail blocks in parallel:
  - rules
  - prize pool
  - participants (teams + players)
  - matches
  - bracket
  - standings
  - stages

### Wiki sections rendered

- `Format & Rules`
- `Prize Pool`
- `Participants` (Liquipedia-style team cards)
- `Schedule & Results` (grouped by rounds)
- `Playoffs Bracket`

The page is read-only from player side (view and navigation focused).

## 4) Public leagues flow (`LeaguesPage`)

File: `src/_public/pages/LeaguesPage.tsx`

Public visitors can browse:

1. **Leagues grid** (all leagues)
2. **Seasons list** for selected league
3. **Public season hub** tabs:
   - Standings
   - Schedule (by round)
   - Bracket

This page uses lightweight "hub" APIs and allows read-only exploration without admin tooling.

## 5) Services used by user-side league pages

### `src/services/leagueService.ts`

- `getAllLeagues()`
- `getLeagueById(id)`
- `getLeagueStandings(id)`
- (also contains admin/mutation methods, but user pages mostly read via methods above)

### `src/services/seasonService.ts`

- `getByLeague(leagueId)`
- plus other CRUD helpers (mostly admin-facing)

### `src/services/stageService.ts`

- `getBySeason(seasonId)` used to show stage timeline in seasons tab

### `src/services/adminLeagueService.ts`

Despite the name, player wiki/hub reuses read endpoints from here:

- `getSeasonRule`
- `getPrizePool`
- `getSeasonTeamsWithPlayers`
- `getMatchesBySeason`
- `getAdminBracket`
- `getAdminStandings`
- `getStages`

### `src/services/leagueHubService.ts`

Used by public league hub:

- `getStandings(seasonId)`
- `getRoundsBySeason(seasonId)`
- `getMatchesByRound(roundId)`
- `getBracket(seasonId)`

## 6) User journey summary

Typical player flow:

1. Open `Leagues` from side nav (`/player/leagues`)
2. Choose a league from left panel
3. View current season data:
   - live stream / standby
   - standings
   - season + stage timeline
4. Open `Tournament wiki` for full details (rules, prize, participants, schedule, bracket)
5. Jump to `Get Tickets` (`/player/events`) for event/ticket browsing

## 7) Key implementation notes

- Most user league screens are **read-only** and consume backend league/season/match/standing APIs.
- Selection logic favors an **ONGOING season** when available; otherwise first season.
- UI supports both:
  - **league-level standings** (`/leagues/:id/standings` style data)
  - **season-level standings** (`/standings?seasonId=...`)
- Bracket rendering supports placeholder expansion for single-elimination trees via:
  - `src/lib/syntheticSingleElimBracket.ts`

---

If needed, this can be extended with a sequence diagram of API calls per page.
