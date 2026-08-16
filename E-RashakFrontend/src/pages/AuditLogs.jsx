import { useMemo, useState } from 'react'
import { MdSearch, MdAssignmentTurnedIn } from 'react-icons/md'
import Loader from '../components/common/Loader.jsx'
import ErrorState from '../components/common/ErrorState.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import { useAsync } from '../hooks/useAsync.js'
import { getAuditLogs } from '../services/auditService.js'
import { formatDateTime, classNames } from '../utils/formatters'
import { useLanguage } from '../context/LanguageContext.jsx'

const EXPORT_TONES = {
  Success: 'bg-accent-50 text-accent-700 dark:bg-accent-600/15 dark:text-accent-100',
  Failed: 'bg-danger-50 text-red-700 dark:bg-danger/15 dark:text-red-200',
  '-': 'bg-slate-100 text-slate-500 dark:bg-primary-700 dark:text-slate-400',
}

export default function AuditLogs() {
  const { data: logs, isLoading, error, refetch } = useAsync(getAuditLogs, [])
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('All')

  const actions = useMemo(() => {
    if (!logs) return ['All']
    return ['All', ...new Set(logs.map((log) => log.action))]
  }, [logs])

  const filtered = useMemo(() => {
    if (!logs) return []
    return logs.filter((log) => {
      const matchesSearch =
        log.user.toLowerCase().includes(search.toLowerCase()) ||
        log.query.toLowerCase().includes(search.toLowerCase())
      const matchesAction = actionFilter === 'All' || log.action === actionFilter
      return matchesSearch && matchesAction
    })
  }, [logs, search, actionFilter])

  if (isLoading) return <Loader label={t('auditLogs.loading')} fullHeight />
  if (error) return <ErrorState description={error} onRetry={refetch} />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary dark:text-slate-100">{t('auditLogs.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('auditLogs.subtitle')}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-control border border-slate-200 bg-white px-3 py-2.5 dark:border-primary-400/30 dark:bg-primary-600 sm:max-w-sm">
          <MdSearch className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('auditLogs.searchPlaceholder')}
            className="w-full border-none bg-transparent text-sm text-primary outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="input-field w-auto">
          {actions.map((action) => (
            <option key={action} value={action}>{action === 'All' ? t('status.All') : t(`enums.auditActions.${action}`)}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={MdAssignmentTurnedIn} title={t('auditLogs.noEntriesTitle')} description={t('auditLogs.noEntriesDesc')} />
      ) : (
        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-primary-400/20">
                  <th className="px-5 py-3 font-medium">{t('auditLogs.table.user')}</th>
                  <th className="px-5 py-3 font-medium">{t('auditLogs.table.time')}</th>
                  <th className="px-5 py-3 font-medium">{t('auditLogs.table.action')}</th>
                  <th className="px-5 py-3 font-medium">{t('auditLogs.table.query')}</th>
                  <th className="px-5 py-3 font-medium">{t('auditLogs.table.exportStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70 dark:border-primary-400/10 dark:hover:bg-primary-400/5">
                    <td className="px-5 py-3 font-medium text-primary dark:text-slate-100">{log.user}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{formatDateTime(log.time)}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{t(`enums.auditActions.${log.action}`)}</td>
                    <td className="max-w-xs truncate px-5 py-3 text-slate-500 dark:text-slate-400">{log.query}</td>
                    <td className="px-5 py-3">
                      <span className={classNames('rounded-full px-2.5 py-1 text-xs font-semibold', EXPORT_TONES[log.exportStatus] || EXPORT_TONES['-'])}>
                        {t(`status.${log.exportStatus}`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
