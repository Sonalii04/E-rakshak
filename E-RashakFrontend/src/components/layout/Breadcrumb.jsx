import { Link, useLocation } from 'react-router-dom'
import { MdChevronRight, MdHome } from 'react-icons/md'
import { NAV_ITEMS } from '../../utils/constants'
import { useLanguage } from '../../context/LanguageContext.jsx'

function labelForSegment(segment, fullPath, t) {
  const match = NAV_ITEMS.find((item) => item.path === fullPath)
  if (match) return t(match.labelKey)
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
}

export default function Breadcrumb() {
  const location = useLocation()
  const { t } = useLanguage()
  const segments = location.pathname.split('/').filter(Boolean)

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500" aria-label={t('breadcrumb.ariaLabel')}>
      <Link to="/dashboard" className="flex items-center gap-1 hover:text-secondary">
        <MdHome className="h-3.5 w-3.5" />
      </Link>
      {segments.map((segment, index) => {
        const fullPath = `/${segments.slice(0, index + 1).join('/')}`
        const isLast = index === segments.length - 1
        return (
          <span key={fullPath} className="flex items-center gap-1.5">
            <MdChevronRight className="h-3.5 w-3.5" />
            {isLast ? (
              <span className="font-semibold text-primary dark:text-slate-200">{labelForSegment(segment, fullPath, t)}</span>
            ) : (
              <Link to={fullPath} className="hover:text-secondary">{labelForSegment(segment, fullPath, t)}</Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
