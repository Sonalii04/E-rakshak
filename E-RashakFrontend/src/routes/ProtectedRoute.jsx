import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import Loader from '../components/common/Loader.jsx'

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()

  if (isLoading) return <Loader label={t('auth.checkingSession')} fullHeight />
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />

  return <Outlet />
}
