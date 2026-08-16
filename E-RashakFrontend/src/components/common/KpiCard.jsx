import * as Icons from 'react-icons/md'
import { classNames } from '../../utils/formatters'
import { useLanguage } from '../../context/LanguageContext.jsx'

const TONES = {
  secondary: 'bg-secondary-50 text-secondary-700 dark:bg-secondary-600/15 dark:text-secondary-100',
  accent: 'bg-accent-50 text-accent-700 dark:bg-accent-600/15 dark:text-accent-100',
  warning: 'bg-warning-50 text-amber-700 dark:bg-warning/15 dark:text-amber-200',
  danger: 'bg-danger-50 text-red-700 dark:bg-danger/15 dark:text-red-200',
}

export default function KpiCard({ id, label, value, delta, icon, tone = 'secondary' }) {
  const { t } = useLanguage()
  const Icon = Icons[icon] || Icons.MdInsights
  const displayLabel = id ? t(`dashboard.kpiLabels.${id}`) : label

  return (
    <div className="card-surface flex items-start justify-between gap-3 p-5 transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-card animate-fadeIn">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{displayLabel}</p>
        <p className="mt-2 truncate text-2xl font-bold text-primary dark:text-slate-50">
          {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        </p>
        {delta && <p className="mt-1 text-xs font-medium text-slate-400 dark:text-slate-500">{delta}</p>}
      </div>
      <div className={classNames('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-control', TONES[tone])}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  )
}
