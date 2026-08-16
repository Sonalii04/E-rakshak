import { useLocation } from 'react-router-dom'
import { MdNearMe } from 'react-icons/md'
import Timeline from '../components/tracking/Timeline.jsx'
import Loader from '../components/common/Loader.jsx'
import ErrorState from '../components/common/ErrorState.jsx'
import { useAsync } from '../hooks/useAsync.js'
import api from '../services/api.js'
import { useLanguage } from '../context/LanguageContext.jsx'

async function getTrail(resultId) {
  const trackId = resultId || 'cam_01_00100'
  const res = await api.get(`/timeline/track/${trackId}`)
  return res.data
}

export default function CrossCameraTracking() {
  const location = useLocation()
  const resultId = location.state?.resultId
  const { data: trail, isLoading, error, refetch } = useAsync(() => getTrail(resultId), [resultId])
  const { t } = useLanguage()

  const durationMinutes = (() => {
    if (!trail || trail.length < 2) return 0;
    const start = new Date(trail[0].timestamp);
    const end = new Date(trail[trail.length - 1].timestamp);
    const diffMs = Math.abs(end - start);
    return Math.round(diffMs / (1000 * 60)) || 1;
  })()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-control bg-secondary-50 text-secondary-700 dark:bg-secondary-600/15 dark:text-secondary-100">
          <MdNearMe className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-primary dark:text-slate-100">{t('tracking.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {resultId ? t('tracking.subtitleWithId', { id: resultId }) : t('tracking.subtitleDefault')}
          </p>
        </div>
      </div>

      {isLoading && <Loader label={t('tracking.reconstructing')} fullHeight />}
      {error && <ErrorState description={error} onRetry={refetch} />}

      {!isLoading && !error && (
        <div className="card-surface p-6">
          <Timeline trail={trail} />
        </div>
      )}

      {!isLoading && !error && (
        <div className="card-surface p-5">
          <h3 className="mb-3 text-sm font-semibold text-primary dark:text-slate-100">{t('tracking.travelPathSummaryTitle')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('tracking.summaryPart1')} <span className="font-semibold text-primary dark:text-slate-200">{trail.length}</span>{' '}
            {t('tracking.summaryPart2')} <span className="font-semibold text-primary dark:text-slate-200">{durationMinutes} {t('common.minutes')}</span>,{' '}
            {t('tracking.summaryPart3')}{' '}
            <span className="font-semibold text-primary dark:text-slate-200">{trail[0]?.camera}</span>{' '}
            {t('tracking.summaryPart4')}{' '}
            <span className="font-semibold text-primary dark:text-slate-200">{trail[trail.length - 1]?.camera}</span>.
          </p>
        </div>
      )}
    </div>
  )
}
