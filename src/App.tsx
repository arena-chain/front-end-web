import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import RequireRole from './components/auth/RequireRole';
import Home from './_public/home';
import NewsPage from './_public/pages/NewsPage';
import TournamentDetailsPage from './_public/pages/TournamentDetailsPage';
import DownloadPage from './_public/pages/DownloadPage';
import LeaguesPage from './_public/pages/LeaguesPage';
import Login from './feature_auth/login';
import Register from './feature_auth/register';
import AuthTransitionLayout from './feature_auth/AuthTransitionLayout';
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
import AdminNews from './admin/pages/News';

// Player Imports
import PlayerLayout from './player/layout/PlayerLayout';
import PlayerDashboard from './player/pages/PlayerDashboard';
import PlayerMatches from './player/pages/PlayerMatches';
import PlayerLeagues from './player/pages/PlayerLeagues';
import PlayerLeagueWikiPage from './player/pages/PlayerLeagueWikiPage';
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
import PlayerNews from './player/pages/PlayerNews';
import NewsArticlePage from './_public/pages/NewsArticlePage';

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

// Scouter Imports
import ScouterLayout from './scouter/layout/ScouterLayout';
import ScouterDashboard from './scouter/pages/ScouterDashboard';
import ScouterPlayers from './scouter/pages/ScouterPlayers';
import ScouterPlayerProfile from './scouter/pages/ScouterPlayerProfile';
import ScouterHighlights from './scouter/pages/ScouterHighlights';
import ScouterEvaluated from './scouter/pages/ScouterEvaluated';
import ScouterReports from './scouter/pages/ScouterReports';
import ScouterRecommendations from './scouter/pages/ScouterRecommendations';
import ScouterWatchlist from './scouter/pages/ScouterWatchlist';

// NFT
import NftManager from './admin/pages/NftManager';
import PlayerMarketplace from './player/pages/PlayerMarketplace';
import PlayerInventoryPage from './player/pages/PlayerInventoryPage';
import ChannelStudioPage from './university/pages/ChannelStudioPage';
import PlayerVideoHighlightsPage from './player/pages/PlayerVideoHighlightsPage';
import PlayerMyVideosPage from './player/pages/PlayerMyVideosPage';
import PlayerHighlightsHubPage from './player/pages/PlayerHighlightsHubPage';
import GoLivePage from './university/pages/GoLivePage';
import AllLivesPage from './university/pages/AllLivesPage';
import WatchChannelPage from './university/pages/WatchChannelPage';
import ChannelDetailPage from './university/pages/ChannelDetailPage';


// Admin misc
import AdminLeagues from './admin/pages/Leagues';
import Reservations from './admin/pages/Reservations';
import AdminTickets from './admin/pages/Tickets';
import Partnerships from './admin/pages/Partnerships';
import TeamManagerRequests from './admin/pages/TeamManagerRequests';

// League Hub (legacy — kept for fallback)
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
import StagesPage from './admin/pages/league-hub/StagesPage';
// League Hub V2 — new workflow-driven design
import AdminLeagueHubV2 from './admin/pages/league-hub/AdminLeagueHubV2';
import AdminSeasonWorkspace from './admin/pages/league-hub/AdminSeasonWorkspace';
// Public tournament page (Liquipedia-style)
import TournamentPage from './_public/pages/TournamentPage';


function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:id" element={<NewsArticlePage />} />
          <Route path="/download" element={<DownloadPage />} />
          <Route path="/tournaments/:id" element={<TournamentDetailsPage />} />
          <Route path="/leagues" element={<LeaguesPage />} />
          <Route path="/leagues/:id" element={<LeaguesPage />} />
          <Route path="/leagues/:leagueId/seasons/:seasonId" element={<TournamentPage />} />
          <Route element={<AuthTransitionLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/watch/:channelId" element={<WatchChannelPage />} />
          <Route path="/channel/:channelId/detail" element={<ChannelDetailPage />} />

        {/* ── Admin ──────────────────────────────────────────────────── */}
        <Route path="/admin" element={<RequireRole allow={['admin']}><AdminLayout /></RequireRole>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Overview />} />
          <Route path="news" element={<AdminNews />} />
          <Route path="users" element={<Users />} />
          <Route path="team-manager-requests" element={<TeamManagerRequests />} />
          <Route path="tournaments" element={<Tournaments />} />
          <Route path="tournaments/:id" element={<TournamentDetails />} />
          <Route path="tickets" element={<AdminTickets />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="games" element={<Games />} />
          <Route path="partnerships" element={<Partnerships />} />
          <Route path="matches" element={<Matches />} />
          <Route path="channels" element={<Channels />} />
          <Route path="nft-manager" element={<NftManager />} />
          <Route path="nft-inventory" element={<NftManager />} />
          <Route path="settings" element={<Settings />} />

          {/* Standalone (MUST come before the :id wildcard) */}
          <Route path="leagues/workflow" element={<WorkflowPage />} />
          <Route path="leagues/progression" element={<ProgressionPage />} />

          {/* League list */}
          <Route path="leagues" element={<AdminLeagues />} />

          {/* League Hub V2 — new workflow-driven design */}
          <Route path="leagues/:id" element={<AdminLeagueHubV2 />} />
          <Route path="leagues/:id/seasons" element={<Navigate to=".." relative="path" replace />} />
          <Route path="leagues/:id/seasons/:seasonId" element={<AdminSeasonWorkspace />} />

          {/* League Hub legacy tabs (kept under /admin/leagues/:id/hub for fallback) */}
          <Route path="leagues/:id/hub" element={<LeagueHubLayout />}>
            <Route index element={<Navigate to="seasons" replace />} />
            <Route path="seasons" element={<SeasonsPage />} />
            <Route path="stages" element={<StagesPage />} />
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
          <Route path="/player" element={<RequireRole allow={['player']}><PlayerLayout /></RequireRole>}>
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
            <Route path="leagues/:id/hub" element={<PlayerLeagueWikiPage />} />
            <Route path="leagues/:id" element={<PlayerLeagues />} />
            <Route path="rankings" element={<PlayerRankings />} />
            <Route path="marketplace" element={<PlayerMarketplace />} />
            <Route path="inventory" element={<PlayerInventoryPage />} />
            <Route path="news" element={<PlayerNews />} />
            <Route path="news/:id" element={<NewsArticlePage />} />
            <Route path="channel" element={<ChannelStudioPage />} />
            <Route path="my-videos" element={<PlayerMyVideosPage />} />
            <Route path="highlights" element={<PlayerHighlightsHubPage />} />
            <Route path="videos/:videoId/highlights" element={<PlayerVideoHighlightsPage />} />
            <Route path="channel/:channelId/detail" element={<ChannelDetailPage />} />
            <Route path="go-live" element={<GoLivePage />} />
            <Route path="all-lives" element={<AllLivesPage />} />
            <Route path="profile" element={<PlayerProfile />} />
            <Route path="subscription" element={<PlayerSubscription />} />
            <Route path="payment" element={<PlayerPayment />} />
          </Route>

        {/* ── Manager ────────────────────────────────────────────────── */}
        <Route path="/manager" element={<RequireRole allow={['team_manager']}><ManagerLayout /></RequireRole>}>
          <Route index element={<Navigate to="/manager/dashboard" replace />} />
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="roster" element={<ManagerRoster />} />
          <Route path="tournaments" element={<ManagerTournaments />} />
          <Route path="scrims" element={<ManagerScrims />} />
          <Route path="settings" element={<ManagerSettings />} />
        </Route>

        {/* ── Referee ────────────────────────────────────────────────── */}
        <Route path="/referee" element={<RequireRole allow={['referee']}><RefereeLayout /></RequireRole>}>
          <Route index element={<Navigate to="/referee/dashboard" replace />} />
          <Route path="dashboard" element={<RefereeDashboard />} />
        </Route>

        {/* ── Scouter ────────────────────────────────────────────────── */}
        <Route path="/scouter" element={<RequireRole allow={['scouter']}><ScouterLayout /></RequireRole>}>
          <Route index element={<Navigate to="/scouter/dashboard" replace />} />
          <Route path="dashboard" element={<ScouterDashboard />} />
          <Route path="players" element={<ScouterPlayers />} />
          <Route path="players/:playerUserId" element={<ScouterPlayerProfile />} />
          <Route path="watchlist" element={<ScouterWatchlist />} />
          <Route path="reports" element={<ScouterReports />} />
          <Route path="recommendations" element={<ScouterRecommendations />} />
          <Route path="highlights" element={<ScouterHighlights />} />
          <Route path="reels" element={<Navigate to="/scouter/highlights" replace />} />
          <Route path="best-highlights" element={<Navigate to="/scouter/highlights" replace />} />
          <Route path="evaluated" element={<ScouterEvaluated />} />
        </Route>
      </Routes>
    </Router>
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#12141a',
          border: '1px solid rgba(255,255,255,0.09)',
          color: '#e8e8e8',
          fontSize: '13px',
        },
      }}
      richColors
    />
    </>
  );
}

export default App;
