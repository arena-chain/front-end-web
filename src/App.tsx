import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './_public/home';
import NewsPage from './_public/pages/NewsPage';
import TournamentDetailsPage from './_public/pages/TournamentDetailsPage';
import Login from './feature_auth/login';
import Register from './feature_auth/register';
import ForgotPassword from './feature_auth/forgot-password';
import ResetPassword from './feature_auth/reset-password';
import VerifyEmail from './feature_auth/verify-email';
import AdminLayout from './admin/layout/AdminLayout';
import Overview from './admin/pages/Overview';
import Users from './admin/pages/Users';
import Tournaments from './admin/pages/Tournaments';
import TournamentDetails from './admin/pages/TournamentDetails';
import Games from './admin/pages/Games';
import Matches from './admin/pages/Matches';
import Channels from './admin/pages/Channels';
import Settings from './admin/pages/Settings';

// Player Imports
import PlayerLayout from './player/layout/PlayerLayout';
import PlayerDashboard from './player/pages/PlayerDashboard';
import PlayerMatches from './player/pages/PlayerMatches';
import PlayerLeagues from './player/pages/PlayerLeagues';
import PlayerProfile from './player/pages/PlayerProfile';
import PlayerTournaments from './player/pages/PlayerTournaments';
import PlayerTicketMarket from './player/pages/PlayerTicketMarket';
import PlayerTournamentDetails from './player/pages/PlayerTournamentDetails';
import ReservationConfirmation from './player/pages/ReservationConfirmation';
import BookingHistory from './player/pages/BookingHistory';
import TicketDetails from './player/pages/TicketDetails';
import TicketBooking from './player/pages/TicketBooking';
import MyTickets from './player/pages/MyTickets';
import PlayerSubscription from './player/pages/PlayerSubscription';
import PlayerPayment from './player/pages/PlayerPayment';
import PlayerRankings from './player/pages/PlayerRankings';

// Manager Imports
import ManagerLayout from './manager/layout/ManagerLayout';
import ManagerDashboard from './manager/pages/ManagerDashboard';
import ManagerRoster from './manager/pages/ManagerRoster';
import ManagerTournaments from './manager/pages/ManagerTournaments';
import ManagerScrims from './manager/pages/ManagerScrims';
import ManagerSettings from './manager/pages/ManagerSettings';

// Referee Imports
import RefereeLayout from './referee/layout/RefereeLayout';
import RefereeDashboard from './referee/pages/RefereeDashboard';

// Admin misc
import AdminLeagues from './admin/pages/Leagues';
import Reservations from './admin/pages/Reservations';
import AdminTickets from './admin/pages/Tickets';
import Partnerships from './admin/pages/Partnerships';

// League Hub
import LeagueHubLayout from './admin/pages/league-hub/LeagueHubLayout';
import WorkflowPage from './admin/pages/league-hub/WorkflowPage';
import ProgressionPage from './admin/pages/league-hub/ProgressionPage';
import SeasonsPage from './admin/pages/league-hub/SeasonsPage';
import RulesPage from './admin/pages/league-hub/RulesPage';
import RoundsPage from './admin/pages/league-hub/RoundsPage';
import MatchesPage from './admin/pages/league-hub/MatchesPage';
import TeamsPage from './admin/pages/league-hub/TeamsPage';
import RostersPage from './admin/pages/league-hub/RostersPage';
import PrizePoolPage from './admin/pages/league-hub/PrizePoolPage';
import CheckInsPage from './admin/pages/league-hub/CheckInsPage';
import DisputesPage from './admin/pages/league-hub/DisputesPage';
import BracketsPage from './admin/pages/league-hub/BracketsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/tournaments/:id" element={<TournamentDetailsPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* ── Admin ──────────────────────────────────────────────────── */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Overview />} />
          <Route path="users" element={<Users />} />
          <Route path="tournaments" element={<Tournaments />} />
          <Route path="tournaments/:id" element={<TournamentDetails />} />
          <Route path="tickets" element={<AdminTickets />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="games" element={<Games />} />
          <Route path="partnerships" element={<Partnerships />} />
          <Route path="matches" element={<Matches />} />
          <Route path="channels" element={<Channels />} />
          <Route path="settings" element={<Settings />} />

          {/* Standalone (MUST come before the :id wildcard) */}
          <Route path="leagues/workflow" element={<WorkflowPage />} />
          <Route path="leagues/progression" element={<ProgressionPage />} />

          {/* League list */}
          <Route path="leagues" element={<AdminLeagues />} />

          {/* League Hub — all sub-pages nested under the league's :id */}
          <Route path="leagues/:id" element={<LeagueHubLayout />}>
            <Route index element={<Navigate to="seasons" replace />} />
            <Route path="seasons" element={<SeasonsPage />} />
            <Route path="rules" element={<RulesPage />} />
            <Route path="rounds" element={<RoundsPage />} />
            <Route path="matches" element={<MatchesPage />} />
            <Route path="teams" element={<TeamsPage />} />
            <Route path="rosters" element={<RostersPage />} />
            <Route path="brackets" element={<BracketsPage />} />
            <Route path="prize-pools" element={<PrizePoolPage />} />
            <Route path="check-ins" element={<CheckInsPage />} />
            <Route path="disputes" element={<DisputesPage />} />
          </Route>
        </Route>

        {/* ── Player ─────────────────────────────────────────────────── */}
        <Route path="/player" element={<PlayerLayout />}>
          <Route index element={<Navigate to="/player/dashboard" replace />} />
          <Route path="dashboard" element={<PlayerDashboard />} />
          <Route path="tournaments" element={<PlayerTournaments />} />
          <Route path="tournaments/:id" element={<PlayerTournamentDetails />} />
          <Route path="market" element={<PlayerTicketMarket />} />
          <Route path="tournaments/:id/tickets" element={<TicketBooking />} />
          <Route path="reservation-confirmation" element={<ReservationConfirmation />} />
          <Route path="my-tickets" element={<MyTickets />} />
          <Route path="tickets" element={<BookingHistory />} />
          <Route path="tickets/:id" element={<TicketDetails />} />
          <Route path="matches" element={<PlayerMatches />} />
          <Route path="leagues" element={<PlayerLeagues />} />
          <Route path="leagues/:id" element={<PlayerLeagues />} />
          <Route path="rankings" element={<PlayerRankings />} />
          <Route path="profile" element={<PlayerProfile />} />
          <Route path="subscription" element={<PlayerSubscription />} />
          <Route path="payment" element={<PlayerPayment />} />
        </Route>

        {/* ── Manager ────────────────────────────────────────────────── */}
        <Route path="/manager" element={<ManagerLayout />}>
          <Route index element={<Navigate to="/manager/dashboard" replace />} />
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="roster" element={<ManagerRoster />} />
          <Route path="tournaments" element={<ManagerTournaments />} />
          <Route path="scrims" element={<ManagerScrims />} />
          <Route path="settings" element={<ManagerSettings />} />
        </Route>

        {/* ── Referee ────────────────────────────────────────────────── */}
        <Route path="/referee" element={<RefereeLayout />}>
          <Route index element={<Navigate to="/referee/dashboard" replace />} />
          <Route path="dashboard" element={<RefereeDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
