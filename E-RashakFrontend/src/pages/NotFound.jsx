import { Link } from 'react-router-dom'
import { MdErrorOutline } from 'react-icons/md'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function NotFound() {
  const { t } = useLanguage()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 text-center dark:bg-[#0B1120]">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary-50 text-secondary-700 dark:bg-secondary-600/15 dark:text-secondary-100">
        <MdErrorOutline className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-bold text-primary dark:text-slate-100">{t('notFound.title')}</h1>
      <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
        {t('notFound.description')}
      </p>
      <Link to="/dashboard" className="btn-primary">{t('notFound.backToDashboard')}</Link>
    </div>
  )
}
