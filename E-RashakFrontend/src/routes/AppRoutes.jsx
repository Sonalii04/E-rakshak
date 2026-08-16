import { Navigate, Route, Routes } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout.jsx'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'

import Login from '../pages/Login.jsx'
import Dashboard from '../pages/Dashboard.jsx'
import NaturalLanguageSearch from '../pages/NaturalLanguageSearch.jsx'
import SearchResults from '../pages/SearchResults.jsx'
import VideoViewer from '../pages/VideoViewer.jsx'
import CrossCameraTracking from '../pages/CrossCameraTracking.jsx'
import CameraManagement from '../pages/CameraManagement.jsx'
import IngestVideo from '../pages/IngestVideo.jsx'
import Reports from '../pages/Reports.jsx'
import AuditLogs from '../pages/AuditLogs.jsx'
import Settings from '../pages/Settings.jsx'
import NotFound from '../pages/NotFound.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/search" element={<NaturalLanguageSearch />} />
          <Route path="/search/results" element={<SearchResults />} />
          <Route path="/video/:id" element={<VideoViewer />} />
          <Route path="/tracking" element={<CrossCameraTracking />} />
          <Route path="/cameras" element={<CameraManagement />} />
          <Route path="/ingest" element={<IngestVideo />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
