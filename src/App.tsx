import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './_public/home';
import Login from './feature_auth/login';
import Register from './feature_auth/register';
import AdminLayout from './admin/layout/AdminLayout';
import Overview from './admin/pages/Overview';
import Users from './admin/pages/Users';
import Tournaments from './admin/pages/Tournaments';
import Games from './admin/pages/Games';
import Matches from './admin/pages/Matches';
import Channels from './admin/pages/Channels';
import Settings from './admin/pages/Settings';

// Player Imports
import PlayerLayout from './player/layout/PlayerLayout';
import PlayerDashboard from './player/pages/PlayerDashboard';
import PlayerMatches from './player/pages/PlayerMatches';

// Manager Imports
import ManagerLayout from './manager/layout/ManagerLayout';
import ManagerDashboard from './manager/pages/ManagerDashboard';

// Referee Imports
import RefereeLayout from './referee/layout/RefereeLayout';
import RefereeDashboard from './referee/pages/RefereeDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Overview />} />
          <Route path="users" element={<Users />} />
          <Route path="tournaments" element={<Tournaments />} />
          <Route path="games" element={<Games />} />
          <Route path="matches" element={<Matches />} />
          <Route path="channels" element={<Channels />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Player Routes */}
        <Route path="/player" element={<PlayerLayout />}>
          <Route index element={<Navigate to="/player/dashboard" replace />} />
          <Route path="dashboard" element={<PlayerDashboard />} />
          <Route path="matches" element={<PlayerMatches />} />
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
