import { classNames } from '../../utils/formatters'
import { useLanguage } from '../../context/LanguageContext.jsx'

export default function Loader({ label, fullHeight = false, size = 'md' }) {
  const { t } = useLanguage()
  const resolvedLabel = label === undefined ? t('components.loader.defaultLabel') : label
  const sizes = { sm: 'h-5 w-5 border-2', md: 'h-8 w-8 border-[3px]', lg: 'h-12 w-12 border-4' }

  return (
    <div
      className={classNames(
        'flex flex-col items-center justify-center gap-3 py-10 text-slate-500 dark:text-slate-400',
        fullHeight && 'min-h-[60vh]'
      )}
      role="status"
      aria-live="polite"
    >
      <span
        className={classNames(
          'animate-spin rounded-full border-secondary/20 border-t-secondary',
          sizes[size]
        )}
      />
      {resolvedLabel && <p className="text-sm font-medium">{resolvedLabel}</p>}
    </div>
  )
}
