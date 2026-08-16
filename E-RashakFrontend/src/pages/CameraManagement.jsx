import { useMemo, useState } from 'react'
import { MdSearch, MdVideocam } from 'react-icons/md'
import StatusBadge from '../components/common/StatusBadge.jsx'
import Loader from '../components/common/Loader.jsx'
import ErrorState from '../components/common/ErrorState.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import { useAsync } from '../hooks/useAsync.js'
import { getCameras } from '../services/cameraService.js'
import { formatDateTime } from '../utils/formatters'
import { useLanguage } from '../context/LanguageContext.jsx'

const STATUS_FILTERS = ['All', 'Online', 'Offline', 'Maintenance']

export default function CameraManagement() {
  const { data: cameras, isLoading, error, refetch } = useAsync(getCameras, [])
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filtered = useMemo(() => {
    if (!cameras) return []
    return cameras.filter((cam) => {
      const matchesSearch =
        cam.name.toLowerCase().includes(search.toLowerCase()) ||
        cam.id.toLowerCase().includes(search.toLowerCase()) ||
        cam.location.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'All' || cam.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [cameras, search, statusFilter])

  const summary = useMemo(() => {
    if (!cameras) return { Online: 0, Offline: 0, Maintenance: 0 }
    return cameras.reduce(
      (acc, cam) => ({ ...acc, [cam.status]: (acc[cam.status] || 0) + 1 }),
      { Online: 0, Offline: 0, Maintenance: 0 }
    )
  }, [cameras])

  if (isLoading) return <Loader label={t('cameras.loading')} fullHeight />
  if (error) return <ErrorState description={error} onRetry={refetch} />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary dark:text-slate-100">{t('cameras.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('cameras.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          {['Online', 'Maintenance', 'Offline'].map((status) => (
            <span key={status} className="flex items-center gap-1.5 rounded-control border border-slate-100 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 dark:border-primary-400/20 dark:bg-primary-600 dark:text-slate-300">
              <StatusBadge status={status} className="px-1.5 py-0.5" /> {summary[status] || 0}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-control border border-slate-200 bg-white px-3 py-2.5 dark:border-primary-400/30 dark:bg-primary-600 sm:max-w-sm">
          <MdSearch className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('cameras.searchPlaceholder')}
            className="w-full border-none bg-transparent text-sm text-primary outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
        </div>
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={
                statusFilter === status
                  ? 'rounded-control bg-secondary px-3 py-2 text-xs font-semibold text-white'
                  : 'rounded-control border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 dark:border-primary-400/30 dark:text-slate-300 dark:hover:bg-primary-400/10'
              }
            >
              {t(`status.${status}`)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={MdVideocam} title={t('cameras.noMatchTitle')} description={t('cameras.noMatchDesc')} />
      ) : (
        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-primary-400/20">
                  <th className="px-5 py-3 font-medium">{t('cameras.table.cameraId')}</th>
                  <th className="px-5 py-3 font-medium">{t('cameras.table.location')}</th>
                  <th className="px-5 py-3 font-medium">{t('cameras.table.status')}</th>
                  <th className="px-5 py-3 font-medium">{t('cameras.table.lastActive')}</th>
                  <th className="px-5 py-3 font-medium">{t('cameras.table.resolution')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((camera) => (
                  <tr key={camera.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70 dark:border-primary-400/10 dark:hover:bg-primary-400/5">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-primary dark:text-slate-100">{camera.id}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{camera.name}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{camera.location}</td>
                    <td className="px-5 py-3"><StatusBadge status={camera.status} /></td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{formatDateTime(camera.lastActive)}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{camera.resolution}</td>
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
