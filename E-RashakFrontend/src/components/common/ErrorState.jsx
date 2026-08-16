import { MdErrorOutline } from 'react-icons/md'
import { useLanguage } from '../../context/LanguageContext.jsx'

export default function ErrorState({
  title,
  description,
  onRetry,
}) {
  const { t } = useLanguage()
  const resolvedTitle = title === undefined ? t('components.errorState.defaultTitle') : title
  const resolvedDescription = description === undefined ? t('components.errorState.defaultDesc') : description
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-danger-100 bg-danger-50 py-14 text-center animate-fadeIn dark:border-red-900/40 dark:bg-red-950/20">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-danger shadow-soft dark:bg-primary-600">
        <MdErrorOutline className="h-7 w-7" />
      </div>
      <p className="text-base font-semibold text-primary dark:text-slate-100">{resolvedTitle}</p>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{resolvedDescription}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-danger mt-1">
          {t('components.errorState.retry')}
        </button>
      )}
    </div>
  )
}
