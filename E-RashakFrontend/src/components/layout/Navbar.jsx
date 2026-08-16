import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MdSearch,
  MdNotifications,
  MdDarkMode,
  MdLightMode,
  MdMenu,
  MdExitToApp,
  MdSettings,
  MdPerson,
} from 'react-icons/md'
import { useTheme } from '../../context/ThemeContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useLanguage } from '../../context/LanguageContext.jsx'
import Breadcrumb from './Breadcrumb.jsx'
import { getSearchHistory } from '../../services/searchService.js'
import { formatDateTime } from '../../utils/formatters'

export default function Navbar({ onMenuClick }) {
  const { theme, toggleTheme } = useTheme()
  const { user, signOut } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [quickSearch, setQuickSearch] = useState('')
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (showNotifications) {
      getSearchHistory().then(setHistory).catch(() => {})
    }
  }, [showNotifications])

  function handleQuickSearch(e) {
    e.preventDefault()
    if (!quickSearch.trim()) return
    navigate('/search', { state: { prefill: quickSearch } })
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-primary-400/20 dark:bg-primary-900/90 sm:px-6">
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-control text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5 lg:hidden"
        aria-label={t('navbar.toggleSidebar')}
      >
        <MdMenu className="h-5 w-5" />
      </button>

      <div className="hidden lg:block">
        <Breadcrumb />
      </div>

      <form onSubmit={handleQuickSearch} className="ml-auto flex max-w-sm flex-1 items-center gap-2 rounded-control border border-slate-200 bg-slate-50 px-3 py-2 dark:border-primary-400/30 dark:bg-primary-700">
        <MdSearch className="h-4 w-4 flex-shrink-0 text-slate-400" />
        <input
          type="text"
          value={quickSearch}
          onChange={(e) => setQuickSearch(e.target.value)}
          placeholder={t('navbar.quickSearchPlaceholder')}
          className="w-full border-none bg-transparent text-sm text-primary outline-none placeholder:text-slate-400 dark:text-slate-100"
        />
      </form>

      <button
        onClick={toggleTheme}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-control text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
        aria-label={t('navbar.toggleDarkMode')}
        title={t('navbar.toggleDarkMode')}
      >
        {theme === 'dark' ? <MdLightMode className="h-5 w-5" /> : <MdDarkMode className="h-5 w-5" />}
      </button>

      <div className="relative">
        <button
          onClick={() => { setShowNotifications((v) => !v); setShowProfile(false) }}
          className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-control text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
          aria-label={t('navbar.notifications')}
        >
          <MdNotifications className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
        </button>
        {showNotifications && (
          <div className="absolute right-0 top-12 w-80 rounded-card border border-slate-100 bg-white p-3 shadow-popover animate-fadeIn dark:border-primary-400/20 dark:bg-primary-600">
            <p className="px-2 pb-2 text-sm font-semibold text-primary dark:text-slate-100">{t('navbar.recentAlerts')}</p>
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {history.slice(0, 4).map((s) => (
                <div key={s.id} className="rounded-control px-2 py-2 hover:bg-slate-50 dark:hover:bg-primary-400/10">
                  <p className="truncate text-xs font-medium text-primary dark:text-slate-100">{s.query}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">{formatDateTime(s.timestamp)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => { setShowProfile((v) => !v); setShowNotifications(false) }}
          className="flex items-center gap-2 rounded-control px-2 py-1.5 transition hover:bg-slate-100 dark:hover:bg-white/5"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-white">
            {(user?.username || 'IO').split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
          <span className="hidden text-left text-sm sm:block">
            <span className="block font-semibold text-primary dark:text-slate-100">{user?.username || t('navbar.officerFallback')}</span>
            <span className="block text-xs text-slate-400 dark:text-slate-500">{user?.role || t('navbar.officerRoleFallback')}</span>
          </span>
        </button>
        {showProfile && (
          <div className="absolute right-0 top-12 w-56 rounded-card border border-slate-100 bg-white p-2 shadow-popover animate-fadeIn dark:border-primary-400/20 dark:bg-primary-600">
            <button
              onClick={() => { setShowProfile(false); navigate('/settings') }}
              className="flex w-full items-center gap-2 rounded-control px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-primary-400/10"
            >
              <MdPerson className="h-4 w-4" /> {t('navbar.myProfile')}
            </button>
            <button
              onClick={() => { setShowProfile(false); navigate('/settings') }}
              className="flex w-full items-center gap-2 rounded-control px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-primary-400/10"
            >
              <MdSettings className="h-4 w-4" /> {t('navbar.settings')}
            </button>
            <div className="my-1 border-t border-slate-100 dark:border-primary-400/20" />
            <button
              onClick={() => { signOut(); navigate('/login') }}
              className="flex w-full items-center gap-2 rounded-control px-3 py-2 text-sm font-medium text-danger hover:bg-danger-50 dark:hover:bg-red-950/20"
            >
              <MdExitToApp className="h-4 w-4" /> {t('navbar.signOut')}
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
