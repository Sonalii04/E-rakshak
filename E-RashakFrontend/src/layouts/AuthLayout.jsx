import { Outlet } from 'react-router-dom'
import { MdSecurity } from 'react-icons/md'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function AuthLayout() {
  const { t } = useLanguage()
  return (
    <div className="flex min-h-screen w-full bg-primary">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary-600 to-secondary-700 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-control bg-white/10">
            <MdSecurity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-bold">SentryVision</p>
            <p className="text-xs uppercase tracking-wide text-slate-300">{t('authLayout.tagline')}</p>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="text-3xl font-bold leading-tight">
            {t('authLayout.heading')}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            {t('authLayout.description')}
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-400">
          <span>{t('authLayout.badgeIso')}</span>
          <span>&middot;</span>
          <span>{t('authLayout.badgeAudit')}</span>
          <span>&middot;</span>
          <span>{t('authLayout.badgeGov')}</span>
        </div>

        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="flex w-full flex-1 items-center justify-center bg-surface px-6 py-12 dark:bg-[#0B1120] lg:w-1/2">
        <Outlet />
      </div>
    </div>
  )
}
