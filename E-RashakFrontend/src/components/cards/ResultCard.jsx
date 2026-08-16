import { Link } from 'react-router-dom'
import { MdPlayCircleOutline, MdFileDownload, MdNearMe, MdCameraAlt, MdLocationOn } from 'react-icons/md'
import { formatDateTime, formatConfidence, confidenceTone, classNames } from '../../utils/formatters'
import { useLanguage } from '../../context/LanguageContext.jsx'

export default function ResultCard({ result, onTrack }) {
  const { t } = useLanguage()
  return (
    <div className="card-surface group overflow-hidden transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-card animate-fadeIn">
      <div className="relative h-40 w-full overflow-hidden bg-slate-100 dark:bg-primary-700">
        <img
          src={result.snapshot}
          alt={t('resultCard.detectionAlt', { id: result.id })}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <span
          className={classNames(
            'absolute right-2.5 top-2.5 rounded-full border px-2 py-1 text-xs font-bold',
            confidenceTone(result.confidence)
          )}
        >
          {formatConfidence(result.confidence)}
        </span>
      </div>

      <div className="space-y-2.5 p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
          <span>{formatDateTime(result.timestamp)}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-500 dark:bg-primary-700 dark:text-slate-400">
            {t(`enums.objectTypes.${result.objectType}`)}
          </span>
        </div>

        <p className="flex items-center gap-1.5 text-sm font-semibold text-primary dark:text-slate-100">
          <MdCameraAlt className="h-4 w-4 text-slate-400" /> {result.cameraId}
        </p>
        <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <MdLocationOn className="h-4 w-4 text-slate-400" /> {result.location}
        </p>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {result.vehicleType !== '-' && (
            <span className="rounded-full bg-secondary-50 px-2 py-0.5 text-xs font-medium text-secondary-700 dark:bg-secondary-600/15 dark:text-secondary-100">
              {t(`enums.vehicleTypes.${result.vehicleType}`)}
            </span>
          )}
          {result.clothing !== '-' && (
            <span className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-700 dark:bg-accent-600/15 dark:text-accent-100">
              {result.clothing}
            </span>
          )}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-primary-700 dark:text-slate-400">
            {t(`enums.clothingColors.${result.color}`)}
          </span>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Link
            to={`/video/${result.id}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-control bg-secondary px-2.5 py-2 text-xs font-semibold text-white transition hover:bg-secondary-700"
          >
            <MdPlayCircleOutline className="h-4 w-4" /> {t('resultCard.viewClip')}
          </Link>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-control border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-primary-400/30 dark:text-slate-300 dark:hover:bg-primary-400/10"
            aria-label={t('resultCard.downloadImage')}
            title={t('resultCard.downloadImage')}
          >
            <MdFileDownload className="h-4 w-4" />
          </button>
          <button
            onClick={() => onTrack?.(result)}
            className="flex h-9 w-9 items-center justify-center rounded-control border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-primary-400/30 dark:text-slate-300 dark:hover:bg-primary-400/10"
            aria-label={t('resultCard.trackAcrossCameras')}
            title={t('resultCard.trackAcrossCameras')}
          >
            <MdNearMe className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
