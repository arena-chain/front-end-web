import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Toaster } from 'sonner';
import RequireRole from './components/auth/RequireRole';
import { NotificationProvider } from './contexts/NotificationContext';
const Home = lazy(() => import('./_public/home'));
const NewsPage = lazy(() => import('./_public/pages/NewsPage'));
const TournamentDetailsPage = lazy(() => import('./_public/pages/TournamentDetailsPage'));
const DownloadPage = lazy(() => import('./_public/pages/DownloadPage'));
const LeaguesPage = lazy(() => import('./_public/pages/LeaguesPage'));
const LeagueDetailsPage = lazy(() => import('./_public/pages/LeagueDetailsPage'));
const Login = lazy(() => import('./feature_auth/login'));
const Register = lazy(() => import('./feature_auth/register'));
const AuthTransitionLayout = lazy(() => import('./feature_auth/AuthTransitionLayout'));
const ForgotPassword = lazy(() => import('./feature_auth/forgot-password'));
const ResetPassword = lazy(() => import('./feature_auth/reset-password'));
const VerifyEmail = lazy(() => import('./feature_auth/verify-email'));
const AdminLayout = lazy(() => import('./admin/layout/AdminLayout'));
const Overview = lazy(() => import('./admin/pages/Overview'));
const Users = lazy(() => import('./admin/pages/Users'));
const Tournaments = lazy(() => import('./admin/pages/Tournaments'));
const TournamentDetails = lazy(() => import('./admin/pages/TournamentDetails'));
const Games = lazy(() => import('./admin/pages/Games'));
const Matches = lazy(() => import('./admin/pages/Matches'));
const Channels = lazy(() => import('./admin/pages/Channels'));
const Settings = lazy(() => import('./admin/pages/Settings'));
const AdminNews = lazy(() => import('./admin/pages/News'));

// Player Imports
const PlayerLayout = lazy(() => import('./player/layout/PlayerLayout'));
const PlayerDashboard = lazy(() => import('./player/pages/PlayerDashboard'));
const PlayerMatches = lazy(() => import('./player/pages/PlayerMatches'));
const PlayerLeagues = lazy(() => import('./player/pages/PlayerLeagues'));
const PlayerLeagueWikiPage = lazy(() => import('./player/pages/PlayerLeagueWikiPage'));
const PlayerProfile = lazy(() => import('./player/pages/PlayerProfile'));
const PlayerTournaments = lazy(() => import('./player/pages/PlayerTournaments'));
const PlayerTicketMarket = lazy(() => import('./player/pages/PlayerTicketMarket'));
const PlayerTournamentDetails = lazy(() => import('./player/pages/PlayerTournamentDetails'));
const ReservationConfirmation = lazy(() => import('./player/pages/ReservationConfirmation'));
const BookingHistory = lazy(() => import('./player/pages/BookingHistory'));
const TicketDetails = lazy(() => import('./player/pages/TicketDetails'));
const TicketBooking = lazy(() => import('./player/pages/TicketBooking'));
const MyTickets = lazy(() => import('./player/pages/MyTickets'));
const EventBrowsing = lazy(() => import('./player/pages/EventBrowsing'));
const EventDetails = lazy(() => import('./player/pages/EventDetails'));
const PlayerSubscription = lazy(() => import('./player/pages/PlayerSubscription'));
const PlayerPayment = lazy(() => import('./player/pages/PlayerPayment'));
const PlayerWalletPage = lazy(() => import('./player/pages/PlayerWalletPage'));
const PlayerRankings = lazy(() => import('./player/pages/PlayerRankings'));
const PlayerRewards = lazy(() => import('./player/pages/PlayerRewards'));
const PlayerNews = lazy(() => import('./player/pages/PlayerNews'));
const PlayerFriends = lazy(() => import('./player/pages/PlayerFriends'));
const NewsArticlePage = lazy(() => import('./_public/pages/NewsArticlePage'));
// Manager Imports
const ManagerLayout = lazy(() => import('./manager/layout/ManagerLayout'));
const ManagerDashboard = lazy(() => import('./manager/pages/ManagerDashboard'));
const ManagerRoster = lazy(() => import('./manager/pages/ManagerRoster'));
const ManagerTournaments = lazy(() => import('./manager/pages/ManagerTournaments'));
const ManagerScrims = lazy(() => import('./manager/pages/ManagerScrims'));
const ManagerSettings = lazy(() => import('./manager/pages/ManagerSettings'));

// Referee Imports
const RefereeLayout = lazy(() => import('./referee/layout/RefereeLayout'));
const RefereeDashboard = lazy(() => import('./referee/pages/RefereeDashboard'));

// Scouter Imports
const ScouterLayout = lazy(() => import('./scouter/layout/ScouterLayout'));
const ScouterDashboard = lazy(() => import('./scouter/pages/ScouterDashboard'));
const ScouterPlayers = lazy(() => import('./scouter/pages/ScouterPlayers'));
const ScouterPlayerProfile = lazy(() => import('./scouter/pages/ScouterPlayerProfile'));
const ScouterHighlights = lazy(() => import('./scouter/pages/ScouterHighlights'));
const ScouterEvaluated = lazy(() => import('./scouter/pages/ScouterEvaluated'));
const ScouterReports = lazy(() => import('./scouter/pages/ScouterReports'));
const ScouterRecommendations = lazy(() => import('./scouter/pages/ScouterRecommendations'));
const ScouterWatchlist = lazy(() => import('./scouter/pages/ScouterWatchlist'));

// NFT
const NftAvatars = lazy(() => import('./admin/pages/NftAvatars'));
const NftCollections = lazy(() => import('./admin/pages/NftCollections'));
const NftManager = lazy(() => import('./admin/pages/NftManager'));
const PlayerMarketplace = lazy(() => import('./player/pages/PlayerMarketplace'));
const PlayerInventoryPage = lazy(() => import('./player/pages/PlayerInventoryPage'));
const ChannelStudioPage = lazy(() => import('./university/pages/ChannelStudioPage'));
const PlayerVideoHighlightsPage = lazy(() => import('./player/pages/PlayerVideoHighlightsPage'));
const PlayerMyVideosPage = lazy(() => import('./player/pages/PlayerMyVideosPage'));
const PlayerHighlightsHubPage = lazy(() => import('./player/pages/PlayerHighlightsHubPage'));
const PlayerClubs = lazy(() => import('./player/pages/PlayerClubs'));
const TeamProfilePage = lazy(() => import('./shared/pages/TeamProfilePage'));
const GoLivePage = lazy(() => import('./university/pages/GoLivePage'));
const AllLivesPage = lazy(() => import('./university/pages/AllLivesPage'));
const WatchChannelPage = lazy(() => import('./university/pages/WatchChannelPage'));
const ChannelDetailPage = lazy(() => import('./university/pages/ChannelDetailPage'));


// Admin misc
const AdminLeagues = lazy(() => import('./admin/pages/Leagues'));
const Reservations = lazy(() => import('./admin/pages/Reservations'));
const AdminTickets = lazy(() => import('./admin/pages/Tickets'));
const Partnerships = lazy(() => import('./admin/pages/Partnerships'));
const TeamManagerRequests = lazy(() => import('./admin/pages/TeamManagerRequests'));
const CurrencyOffers = lazy(() => import('./admin/pages/CurrencyOffers'));

// League Hub (legacy — kept for fallback)
const LeagueHubLayout = lazy(() => import('./admin/pages/league-hub/LeagueHubLayout'));
const WorkflowPage = lazy(() => import('./admin/pages/league-hub/WorkflowPage'));
const ProgressionPage = lazy(() => import('./admin/pages/league-hub/ProgressionPage'));
const SeasonsPage = lazy(() => import('./admin/pages/league-hub/SeasonsPage'));
const RulesPage = lazy(() => import('./admin/pages/league-hub/RulesPage'));
const RoundsPage = lazy(() => import('./admin/pages/league-hub/RoundsPage'));
const MatchesPage = lazy(() => import('./admin/pages/league-hub/MatchesPage'));
const TeamsPage = lazy(() => import('./admin/pages/league-hub/TeamsPage'));
const RostersPage = lazy(() => import('./admin/pages/league-hub/RostersPage'));
const PrizePoolPage = lazy(() => import('./admin/pages/league-hub/PrizePoolPage'));
const CheckInsPage = lazy(() => import('./admin/pages/league-hub/CheckInsPage'));
const DisputesPage = lazy(() => import('./admin/pages/league-hub/DisputesPage'));
const BracketsPage = lazy(() => import('./admin/pages/league-hub/BracketsPage'));
const StagesPage = lazy(() => import('./admin/pages/league-hub/StagesPage'));
// League Hub V2 — new workflow-driven design
const AdminLeagueHubV2 = lazy(() => import('./admin/pages/league-hub/AdminLeagueHubV2'));
const AdminSeasonWorkspace = lazy(() => import('./admin/pages/league-hub/AdminSeasonWorkspace'));
// Public tournament page (Liquipedia-style)
const TournamentPage = lazy(() => import('./_public/pages/TournamentPage'));

const TradingTerminal = lazy(() =>
  import('./components/trading/TradingTerminal').then((module) => ({ default: module.TradingTerminal })),
);

function ProtectedSection({ children }: { children: React.ReactNode }) {
  return <NotificationProvider>{children}</NotificationProvider>;
}

function App() {
  return (
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:id" element={<NewsArticlePage />} />
          <Route path="/download" element={<DownloadPage />} />
          <Route path="/ticket/:id" element={<TicketDetails />} />
          <Route path="/tournaments/:id" element={<TournamentDetailsPage />} />
          <Route path="/leagues" element={<LeaguesPage />} />
          <Route path="/leagues/:id" element={<LeaguesPage />} />
          <Route path="/league/:id" element={<LeagueDetailsPage />} />
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
          <Route path="/admin" element={<ProtectedSection><RequireRole allow={['admin']}><AdminLayout /></RequireRole></ProtectedSection>}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Overview />} />
            <Route path="overview" element={<Overview />} />
            <Route path="news" element={<AdminNews />} />
            <Route path="users" element={<Users />} />
            <Route path="team-manager-requests" element={<TeamManagerRequests />} />
            <Route path="currency-offers" element={<CurrencyOffers />} />
            <Route path="tournaments" element={<Tournaments />} />
            <Route path="tournaments/:id" element={<TournamentDetails />} />
            <Route path="tickets" element={<AdminTickets />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="games" element={<Games />} />
            <Route path="partnerships" element={<Partnerships />} />
            <Route path="matches" element={<Matches />} />
            <Route path="channels" element={<Channels />} />
            <Route path="nft-avatars" element={<NftAvatars />} />
            <Route path="nft-collections" element={<NftCollections />} />
            <Route path="nft-manager" element={<NftManager />} />
            <Route path="nft-inventory" element={<NftManager />} />
            <Route path="trading" element={<TradingTerminal />} />
            <Route path="settings" element={<Settings />} />
            <Route path="leagues/workflow" element={<WorkflowPage />} />
            <Route path="leagues/progression" element={<ProgressionPage />} />
            <Route path="leagues" element={<AdminLeagues />} />
            <Route path="leagues/:id" element={<AdminLeagueHubV2 />} />
            <Route path="leagues/:id/seasons" element={<Navigate to=".." relative="path" replace />} />
            <Route path="leagues/:id/seasons/:seasonId" element={<AdminSeasonWorkspace />} />
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
          <Route path="/player" element={<ProtectedSection><RequireRole allow={['player']}><PlayerLayout /></RequireRole></ProtectedSection>}>
            <Route index element={<Navigate to="/player/dashboard" replace />} />
            <Route path="dashboard" element={<PlayerDashboard />} />
            <Route path="friends" element={<PlayerFriends />} />
            <Route path="tournaments" element={<PlayerTournaments />} />
            <Route path="tournaments/:id" element={<PlayerTournamentDetails />} />
            <Route path="market" element={<PlayerTicketMarket />} />
            <Route path="tournaments/:id/tickets" element={<TicketBooking />} />
            <Route path="reservation-confirmation" element={<ReservationConfirmation />} />
            <Route path="my-tickets" element={<Navigate to="/player/tickets" replace />} />
            <Route path="tickets/:id" element={<TicketDetails />} />
            <Route path="tickets" element={<MyTickets />} />
            <Route path="booking-history" element={<BookingHistory />} />
            <Route path="matches" element={<PlayerMatches />} />
            <Route path="leagues" element={<PlayerLeagues />} />
            <Route path="leagues/:id/hub" element={<PlayerLeagueWikiPage />} />
            <Route path="leagues/:id" element={<PlayerLeagues />} />
            <Route path="rankings" element={<PlayerRankings />} />
            <Route path="rewards" element={<PlayerRewards />} />
            <Route path="events" element={<EventBrowsing />} />
            <Route path="events/:id" element={<EventDetails />} />
            <Route path="marketplace" element={<PlayerMarketplace />} />
            <Route path="clubs" element={<PlayerClubs />} />
            <Route path="clubs/:teamId" element={<TeamProfilePage />} />
            <Route path="inventory" element={<PlayerInventoryPage />} />
            <Route path="news" element={<PlayerNews />} />
            <Route path="news/:id" element={<NewsArticlePage />} />
            <Route path="trading" element={<TradingTerminal />} />
            <Route path="channel" element={<ChannelStudioPage />} />
            <Route path="my-videos" element={<PlayerMyVideosPage />} />
            <Route path="videos" element={<PlayerMyVideosPage />} />
            <Route path="highlights" element={<PlayerHighlightsHubPage />} />
            <Route path="highlights/:videoId" element={<PlayerVideoHighlightsPage />} />
            <Route path="videos/:videoId/highlights" element={<PlayerVideoHighlightsPage />} />
            <Route path="channel/:channelId/detail" element={<ChannelDetailPage />} />
            <Route path="go-live" element={<GoLivePage />} />
            <Route path="all-lives" element={<AllLivesPage />} />
            <Route path="profile" element={<PlayerProfile />} />
            <Route path="wallet" element={<PlayerWalletPage />} />
            <Route path="subscription" element={<PlayerSubscription />} />
            <Route path="payment" element={<PlayerPayment />} />
          </Route>

          {/* ── Manager ─────────────────────────────────────────────────- */}
          <Route path="/manager" element={<ProtectedSection><RequireRole allow={['team_manager']}><ManagerLayout /></RequireRole></ProtectedSection>}>
            <Route index element={<Navigate to="/manager/dashboard" replace />} />
            <Route path="dashboard" element={<ManagerDashboard />} />
            <Route path="roster" element={<ManagerRoster />} />
            <Route path="teams/:teamId" element={<TeamProfilePage />} />
            <Route path="tournaments" element={<ManagerTournaments />} />
            <Route path="scrims" element={<ManagerScrims />} />
            <Route path="settings" element={<ManagerSettings />} />
          </Route>

          {/* ── Referee ─────────────────────────────────────────────────- */}
          <Route path="/referee" element={<ProtectedSection><RequireRole allow={['referee']}><RefereeLayout /></RequireRole></ProtectedSection>}>
            <Route index element={<Navigate to="/referee/dashboard" replace />} />
            <Route path="dashboard" element={<RefereeDashboard />} />
          </Route>

          {/* ── Scouter ─────────────────────────────────────────────────- */}
          <Route path="/scouter" element={<ProtectedSection><RequireRole allow={['scouter']}><ScouterLayout /></RequireRole></ProtectedSection>}>
            <Route index element={<Navigate to="/scouter/dashboard" replace />} />
            <Route path="dashboard" element={<ScouterDashboard />} />
            <Route path="players" element={<ScouterPlayers />} />
            <Route path="players/:playerUserId" element={<ScouterPlayerProfile />} />
            <Route path="watchlist" element={<ScouterWatchlist />} />
            <Route path="reports" element={<ScouterReports />} />
            <Route path="recommendations" element={<ScouterRecommendations />} />
            <Route path="highlights" element={<ScouterHighlights />} />
            <Route path="evaluated" element={<ScouterEvaluated />} />
            <Route path="reels" element={<Navigate to="/scouter/highlights" replace />} />
            <Route path="best-highlights" element={<Navigate to="/scouter/highlights" replace />} />
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
      </Suspense>
  );
}

export default App;
