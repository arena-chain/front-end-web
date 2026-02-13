# Tournament Management - Frontend Implementation Guide

This guide provides comprehensive instructions for implementing the tournament management system on the frontend.

---

## Table of Contents

1. [Data Models](#data-models)
2. [API Endpoints](#api-endpoints)
3. [UI Components](#ui-components)
4. [State Management](#state-management)
5. [User Flows](#user-flows)
6. [Features to Implement](#features-to-implement)

---

## Data Models

### Tournament Interface

```typescript
export enum TournamentFormat {
  SINGLE_ELIMINATION = 'SINGLE_ELIMINATION',
  DOUBLE_ELIMINATION = 'DOUBLE_ELIMINATION',
  SWISS = 'SWISS',
  ROUND_ROBIN = 'ROUND_ROBIN',
}

export enum TournamentStatus {
  DRAFT = 'DRAFT',
  OPEN_REGISTRATION = 'OPEN_REGISTRATION',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PhaseName {
  PLAY_IN = 'PLAY_IN',
  GROUP_STAGE = 'GROUP_STAGE',
  QUARTERFINALS = 'QUARTERFINALS',
  SEMIFINALS = 'SEMIFINALS',
  FINALS = 'FINALS',
}

export enum PhaseStatus {
  PENDING = 'PENDING',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
}

export interface TournamentPhase {
  name: PhaseName;
  status: PhaseStatus;
  startDate?: string;
  endDate?: string;
  matches: string[]; // Array of match IDs
}

export interface Tournament {
  _id: string;
  name: string;
  description?: string;
  gameId: {
    _id: string;
    title: string;
    genre: string;
    coverImageUrl?: string;
  };
  organizerId: {
    _id: string;
    username: string;
    email: string;
  };
  startDate: string;
  endDate: string;
  registrationStart?: string;
  registrationEnd?: string;
  maxTeams: number;
  currentTeams: number;
  teams: string[]; // Array of team IDs or populated team objects
  registrationOpen: boolean;
  prizePool: number;
  firstPlace: number;
  secondPlace: number;
  thirdPlace: number;
  format: TournamentFormat;
  phases: TournamentPhase[];
  status: TournamentStatus;
  rules?: Record<string, any>;
  bannerImageUrl?: string;
  streamUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTournamentDto {
  name: string;
  description?: string;
  gameId: string;
  organizerId: string;
  startDate: Date;
  endDate: Date;
  registrationStart?: Date;
  registrationEnd?: Date;
  maxTeams: number;
  prizePool?: number;
  firstPlace?: number;
  secondPlace?: number;
  thirdPlace?: number;
  format: TournamentFormat;
  rules?: Record<string, any>;
  bannerImageUrl?: string;
  streamUrl?: string;
  registrationOpen?: boolean;
}
```

---

## API Endpoints

### Base URL
```
/tournements
```

### 1. Get All Tournaments
```typescript
GET /tournements

// Example Request
const tournaments = await fetch('/tournements');

// Response: Tournament[]
```

### 2. Get Tournament by ID
```typescript
GET /tournements/:id

// Example Request
const tournament = await fetch(`/tournements/${tournamentId}`);

// Response: Tournament
```

### 3. Create Tournament
```typescript
POST /tournements
Content-Type: application/json

// Example Request
const newTournament = await fetch('/tournements', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Winter Championship 2026',
    description: 'The biggest winter event',
    gameId: '65bf...',
    organizerId: '65bf...',
    startDate: new Date('2026-12-01T10:00:00.000Z'),
    endDate: new Date('2026-12-05T20:00:00.000Z'),
    maxTeams: 16,
    prizePool: 5000,
    firstPlace: 2500,
    secondPlace: 1500,
    thirdPlace: 1000,
    format: 'SINGLE_ELIMINATION',
  }),
});

// Response: Tournament
```

### 4. Update Tournament
```typescript
PATCH /tournements/:id
Content-Type: application/json

// Example Request (partial update)
const updatedTournament = await fetch(`/tournements/${tournamentId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'ONGOING',
    registrationOpen: false,
  }),
});

// Response: Tournament
```

### 5. Delete Tournament
```typescript
DELETE /tournements/:id

// Example Request
await fetch(`/tournements/${tournamentId}`, {
  method: 'DELETE',
});

// Response: { message: 'Tournament deleted successfully' }
```

### 6. Register Team
```typescript
POST /tournements/:id/register-team
Content-Type: application/json

// Example Request
const result = await fetch(`/tournements/${tournamentId}/register-team`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    teamId: '65bf...',
  }),
});

// Response: Tournament (with updated teams array)
```

### 7. Unregister Team
```typescript
DELETE /tournements/:id/unregister-team/:teamId

// Example Request
await fetch(`/tournements/${tournamentId}/unregister-team/${teamId}`, {
  method: 'DELETE',
});

// Response: Tournament (with updated teams array)
```

### 8. Add Phase
```typescript
POST /tournements/:id/phases
Content-Type: application/json

// Example Request
const result = await fetch(`/tournements/${tournamentId}/phases`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'QUARTERFINALS',
    startDate: new Date('2026-12-02T10:00:00.000Z'),
    endDate: new Date('2026-12-02T20:00:00.000Z'),
  }),
});

// Response: Tournament (with new phase added)
```

### 9. Update Phase Status
```typescript
PATCH /tournements/:id/phases/:phaseName
Content-Type: application/json

// Example Request
const result = await fetch(`/tournements/${tournamentId}/phases/QUARTERFINALS`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'ONGOING',
  }),
});

// Response: Tournament (with updated phase status)
```

---

## UI Components

### 1. Tournament List View (`TournamentList.tsx`)

**Purpose:** Display all tournaments with filtering and sorting

**Features:**
- Grid/List view toggle
- Filter by status (All, Open Registration, Ongoing, Completed)
- Filter by game
- Search by tournament name
- Sort by start date, prize pool, participants

**Display for Each Tournament:**
- Banner image
- Tournament name
- Game name/icon
- Start date
- Prize pool
- Current teams / Max teams
- Status badge
- "View Details" button

### 2. Tournament Detail View (`TournamentDetail.tsx`)

**Purpose:** Show comprehensive tournament information

**Sections:**
- **Header:** Banner, name, game, status badge
- **Info:** Description, dates, organizer, prize distribution
- **Teams:** List of registered teams with logos
- **Phases/Brackets:** Tournament bracket visualization
- **Rules:** Display custom rules
- **Stream:** Embed stream if available
- **Registration:** "Register Team" button (if eligible)

### 3. Tournament Creation Form (`CreateTournament.tsx`)

**Purpose:** Allow organizers to create new tournaments

**Form Fields:**
- **Basic Info:** Name, Description, Game (dropdown)
- **Dates:** Start Date, End Date, Registration Period
- **Teams:** Max Teams (number input)
- **Prize Pool:** Total, 1st Place, 2nd Place, 3rd Place
- **Format:** Radio buttons (Single Elimination, Double Elimination, etc.)
- **Media:** Banner Image Upload, Stream URL
- **Rules:** JSON editor or key-value pairs
- **Submit:** "Create Tournament" button

**Validation:**
- All required fields filled
- End date after start date
- Max teams >= 2
- Prize distribution <= total prize pool

### 4. Tournament Management Panel (`ManageTournament.tsx`)

**Purpose:** Admin/Organizer panel for managing tournament

**Features:**
- Update tournament details
- Open/Close registration
- Add tournament phases
- Update phase statuses
- View registered teams
- Remove teams (if needed)
- Change tournament status
- Delete tournament (with confirmation)

### 5. Team Registration Component (`TeamRegistration.tsx`)

**Purpose:** Allow team managers to register their team

**Features:**
- Display tournament requirements
- Select team from user's managed teams
- Confirm registration
- Show registration success/error messages
- Display roster confirmation

### 6. Tournament Bracket Viewer (`TournamentBracket.tsx`)

**Purpose:** Visual representation of tournament progression

**Features:**
- Display phases as tabs (Play-in, Quarters, Semis, Finals)
- Show matchups in bracket format
- Highlight completed matches
- Show scores/winners
- Interactive (click match for details)

### 7. Tournament Card (`TournamentCard.tsx`)

**Purpose:** Reusable card component for tournament display

**Design:**
- Card with banner image background
- Overlay with tournament info
- Status indicator
- Prize pool badge
- Hover effects
- Click to navigate to details

---

## State Management

### Using Context API (React)

```typescript
// TournamentContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface TournamentContextType {
  tournaments: Tournament[];
  loading: boolean;
  error: string | null;
  fetchTournaments: () => Promise<void>;
  fetchTournamentById: (id: string) => Promise<Tournament>;
  createTournament: (data: CreateTournamentDto) => Promise<Tournament>;
  updateTournament: (id: string, data: Partial<Tournament>) => Promise<Tournament>;
  deleteTournament: (id: string) => Promise<void>;
  registerTeam: (tournamentId: string, teamId: string) => Promise<Tournament>;
  unregisterTeam: (tournamentId: string, teamId: string) => Promise<Tournament>;
}

export const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const TournamentProvider: React.FC = ({ children }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/tournements');
      const data = await response.json();
      setTournaments(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ... implement other methods

  return (
    <TournamentContext.Provider value={{ tournaments, loading, error, fetchTournaments, ... }}>
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournaments = () => {
  const context = useContext(TournamentContext);
  if (!context) throw new Error('useTournaments must be used within TournamentProvider');
  return context;
};
```

### Using Redux Toolkit (Alternative)

```typescript
// tournamentSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchTournaments = createAsyncThunk(
  'tournaments/fetchAll',
  async () => {
    const response = await fetch('/tournements');
    return response.json();
  }
);

const tournamentSlice = createSlice({
  name: 'tournaments',
  initialState: {
    tournaments: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTournaments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTournaments.fulfilled, (state, action) => {
        state.tournaments = action.payload;
        state.loading = false;
      })
      .addCase(fetchTournaments.rejected, (state, action) => {
        state.error = action.error.message;
        state.loading = false;
      });
  },
});

export default tournamentSlice.reducer;
```

---

## User Flows

### Flow 1: Browse and View Tournaments

1. User navigates to "Tournaments" page
2. System displays `TournamentList` with all tournaments
3. User can filter by status, game, or search
4. User clicks on a tournament card
5. System navigates to `TournamentDetail` page
6. User views full tournament information, teams, brackets

### Flow 2: Create Tournament (Organizer)

1. Organizer clicks "Create Tournament" button
2. System displays `CreateTournament` form
3. Organizer fills in all required fields
4. Organizer clicks "Create Tournament"
5. System validates data and sends POST request
6. On success, system navigates to tournament detail page
7. Tournament is in DRAFT status initially

### Flow 3: Register Team (Team Manager)

1. Team manager views tournament details
2. System shows "Register Team" button (if eligible)
3. Team manager clicks button
4. System displays team selection modal
5. Team manager selects their team
6. Team manager confirms registration
7. System sends POST request to `/tournements/:id/register-team`
8. On success, team is added to tournament roster
9. System updates UI to show registration success

### Flow 4: Manage Tournament Phases (Organizer)

1. Organizer opens tournament management panel
2. System displays current tournament details
3. Organizer clicks "Add Phase"
4. System shows phase creation form
5. Organizer selects phase name (e.g., QUARTERFINALS)
6. Organizer sets start/end dates
7. System sends POST request to `/tournements/:id/phases`
8. System updates tournament with new phase
9. Organizer can update phase status as tournament progresses

### Flow 5: Update Tournament Status

1. Organizer opens tournament management panel
2. Organizer changes status dropdown (e.g., DRAFT → OPEN_REGISTRATION)
3. System sends PATCH request with new status
4. System updates tournament in database
5. UI reflects new status immediately
6. Registered users receive notifications (if implemented)

---

## Features to Implement

### Priority 1 (Core Features)

- ✅ **Tournament List View** with filtering and sorting
- ✅ **Tournament Detail Page** with full information
- ✅ **Create Tournament Form** for organizers
- ✅ **Team Registration** functionality
- ✅ **Basic tournament status management**

### Priority 2 (Enhanced Features)

- **Tournament Bracket Visualization** with interactive brackets
- **Live Updates** using WebSockets for real-time status changes
- **Search and Advanced Filtering** (by prize pool range, date range, etc.)
- **Tournament Calendar View** showing upcoming tournaments
- **Notification System** for registration confirmations, phase changes

### Priority 3 (Advanced Features)

- **Tournament Templates** for quick tournament creation
- **Automatic Bracket Generation** based on format and teams
- **Match Scheduling** with calendar integration
- **Tournament Analytics** (viewer stats, engagement metrics)
- **Export Tournament Data** (PDF, CSV)
- **Social Sharing** for tournaments
- **Spectator Mode** with live match tracking

---

## Additional Recommendations

### 1. Responsive Design
- Ensure all components work on mobile, tablet, and desktop
- Use mobile-first approach
- Implement swipe gestures for bracket navigation on mobile

### 2. Accessibility
- Use semantic HTML
- Add ARIA labels for screen readers
- Ensure keyboard navigation works
- Provide alternative text for images

### 3. Performance Optimization
- Implement pagination for tournament lists
- Use lazy loading for images
- Cache tournament data when appropriate
- Implement optimistic UI updates

### 4. Error Handling
- Display user-friendly error messages
- Implement retry logic for failed requests
- Show loading states during API calls
- Validate all form inputs before submission

### 5. User Experience
- Add confirmation dialogs for destructive actions
- Provide visual feedback for all user actions
- Use skeleton loaders during data fetching
- Implement smooth transitions and animations

---

## Example Component Implementation

### Tournament Card Component (React + TypeScript)

```tsx
import React from 'react';
import { Tournament, TournamentStatus } from '../types';
import { formatDate, formatCurrency } from '../utils';

interface TournamentCardProps {
  tournament: Tournament;
  onClick: () => void;
}

export const TournamentCard: React.FC<TournamentCardProps> = ({ tournament, onClick }) => {
  const getStatusBadgeColor = (status: TournamentStatus) => {
    switch (status) {
      case 'OPEN_REGISTRATION': return 'bg-green-500';
      case 'ONGOING': return 'bg-blue-500';
      case 'COMPLETED': return 'bg-gray-500';
      case 'CANCELLED': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <div
      onClick={onClick}
      className="tournament-card cursor-pointer rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
      style={{
        backgroundImage: `url(${tournament.bannerImageUrl || '/default-banner.jpg'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="overlay bg-gradient-to-t from-black/80 to-transparent p-6">
        {/* Status Badge */}
        <div className={`inline-block px-3 py-1 rounded-full text-white text-sm ${getStatusBadgeColor(tournament.status)}`}>
          {tournament.status.replace('_', ' ')}
        </div>

        {/* Tournament Info */}
        <h3 className="text-2xl font-bold text-white mt-4">{tournament.name}</h3>
        <p className="text-gray-300 text-sm mt-2">{tournament.gameId.title}</p>

        {/* Prize Pool */}
        {tournament.prizePool > 0 && (
          <div className="mt-4 text-yellow-400 font-semibold">
            💰 {formatCurrency(tournament.prizePool)} Prize Pool
          </div>
        )}

        {/* Teams */}
        <div className="mt-2 text-gray-300 text-sm">
          👥 {tournament.currentTeams} / {tournament.maxTeams} Teams
        </div>

        {/* Start Date */}
        <div className="mt-2 text-gray-400 text-sm">
          📅 {formatDate(tournament.startDate)}
        </div>
      </div>
    </div>
  );
};
```

---

## Conclusion

This guide provides a comprehensive foundation for implementing the tournament management system on the frontend. Start with Priority 1 features and progressively enhance the application with additional functionality.

**Key Takeaways:**
- Use the provided TypeScript interfaces for type safety
- Implement proper state management for tournament data
- Create reusable components for consistency
- Focus on user experience and accessibility
- Test all user flows thoroughly

For any questions or clarifications about the API, refer to the updated `tournaments_api.md` documentation.
