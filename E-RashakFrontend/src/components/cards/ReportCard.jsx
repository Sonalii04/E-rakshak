import { MdDescription, MdFileDownload } from 'react-icons/md'
import { formatDateTime } from '../../utils/formatters'
import { useLanguage } from '../../context/LanguageContext.jsx'

export default function ReportCard({ report, onView }) {
  const { t } = useLanguage()
  return (
    <div className="card-surface flex flex-col gap-3 p-5 animate-fadeIn">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-control bg-warning-50 text-amber-700 dark:bg-warning/15 dark:text-amber-200">
          <MdDescription className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-primary dark:text-slate-100">{report.title}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{report.id} &middot; {formatDateTime(report.date)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium dark:bg-primary-700">{report.format}</span>
        <span>{report.user}</span>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button onClick={() => onView?.(report)} className="btn-secondary flex-1 text-xs">
          {t('components.reportCard.viewDetails')}
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-control border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-primary-400/30 dark:text-slate-300 dark:hover:bg-primary-400/10" title={t('components.reportCard.download')} aria-label={t('components.reportCard.downloadAria')}>
          <MdFileDownload className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
