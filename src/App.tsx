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

// Manager Imports
import ManagerLayout from './manager/layout/ManagerLayout';
import ManagerDashboard from './manager/pages/ManagerDashboard';

// Referee Imports
import RefereeLayout from './referee/layout/RefereeLayout';
import RefereeDashboard from './referee/pages/RefereeDashboard';
import AdminLeagues from "./admin/pages/Leagues.tsx";
import Reservations from "./admin/pages/Reservations.tsx";
import AdminTickets from "./admin/pages/Tickets.tsx";

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

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Overview />} />
          <Route path="users" element={<Users />} />
          <Route path="tournaments" element={<Tournaments />} />
          <Route path="leagues" element={<AdminLeagues />} />
          <Route path="tournaments/:id" element={<TournamentDetails />} />
          <Route path="tickets" element={<AdminTickets />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="games" element={<Games />} />
          <Route path="matches" element={<Matches />} />
          <Route path="channels" element={<Channels />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Player Routes with Layout */}
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
          <Route path="profile" element={<PlayerProfile />} />
          <Route path="subscription" element={<PlayerSubscription />} />
          <Route path="payment" element={<PlayerPayment />} />
        </Route>

        {/* Manager Routes */}
        <Route path="/manager" element={<ManagerLayout />}>
          <Route index element={<Navigate to="/manager/dashboard" replace />} />
          <Route path="dashboard" element={<ManagerDashboard />} />
        </Route>

        {/* Referee Routes */}
        <Route path="/referee" element={<RefereeLayout />}>
          <Route index element={<Navigate to="/referee/dashboard" replace />} />
          <Route path="dashboard" element={<RefereeDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
