import { NavLink } from 'react-router-dom'
import * as Icons from 'react-icons/md'
import { NAV_ITEMS } from '../../utils/constants'
import { classNames } from '../../utils/formatters'
import { useLanguage } from '../../context/LanguageContext.jsx'

export default function Sidebar({ collapsed, onToggle }) {
  const { t } = useLanguage()
  return (
    <aside
      className={classNames(
        'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-primary-400/20 bg-primary transition-all duration-200',
        collapsed ? 'w-[76px]' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-primary-400/20 px-4">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-control bg-secondary text-white">
          <Icons.MdSecurity className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0 overflow-hidden">
            <p className="truncate text-sm font-bold text-white">SentryVision</p>
            <p className="truncate text-[10px] uppercase tracking-wide text-slate-400">{t('sidebar.tagline')}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = Icons[item.icon] || Icons.MdFiberManualRecord
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? t(item.labelKey) : undefined}
              className={({ isActive }) =>
                classNames(
                  'flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-secondary text-white shadow-soft'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                )
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
            </NavLink>
          )
        })}
      </nav>

      <button
        onClick={onToggle}
        className="flex items-center justify-center gap-2 border-t border-primary-400/20 px-4 py-4 text-xs font-medium text-slate-400 transition hover:text-white"
      >
        <Icons.MdChevronLeft className={classNames('h-5 w-5 transition-transform', collapsed && 'rotate-180')} />
        {!collapsed && t('sidebar.collapse')}
      </button>
    </aside>
  )
}
