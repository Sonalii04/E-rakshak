import { MdCheckCircle, MdError, MdInfo, MdWarning, MdClose } from 'react-icons/md'
import { classNames } from '../../utils/formatters'
import { useLanguage } from '../../context/LanguageContext.jsx'

const VARIANTS = {
  success: { icon: MdCheckCircle, classes: 'bg-white border-accent-100 text-accent-700' },
  error: { icon: MdError, classes: 'bg-white border-danger-100 text-red-700' },
  warning: { icon: MdWarning, classes: 'bg-white border-warning-100 text-amber-700' },
  info: { icon: MdInfo, classes: 'bg-white border-secondary-100 text-secondary-700' },
}

export default function Toast({ toast, onDismiss }) {
  const { t } = useLanguage()
  const variant = VARIANTS[toast.type] || VARIANTS.info
  const Icon = variant.icon

  return (
    <div
      role="status"
      className={classNames(
        'pointer-events-auto flex w-80 items-start gap-3 rounded-control border px-4 py-3 shadow-popover animate-slideIn dark:bg-primary-600 dark:text-slate-100',
        variant.classes
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
      <div className="flex-1 text-sm">
        {toast.title && <p className="font-semibold">{toast.title}</p>}
        {toast.message && <p className="text-slate-600 dark:text-slate-300">{toast.message}</p>}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        aria-label={t('components.toast.dismiss')}
      >
        <MdClose className="h-4 w-4" />
      </button>
    </div>
  )
}
