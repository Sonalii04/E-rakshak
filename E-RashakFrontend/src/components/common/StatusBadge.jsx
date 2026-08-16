import { classNames } from '../../utils/formatters'
import { STATUS_COLORS } from '../../utils/constants'
import { useLanguage } from '../../context/LanguageContext.jsx'

export default function StatusBadge({ status, className = '' }) {
  const { t } = useLanguage()
  const tone = STATUS_COLORS[status] || {
    dot: 'bg-slate-400',
    text: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  }

  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
        tone.bg,
        tone.text,
        tone.border,
        className
      )}
    >
      <span className={classNames('h-1.5 w-1.5 rounded-full', tone.dot)} />
      {t(`status.${status}`)}
    </span>
  )
}
