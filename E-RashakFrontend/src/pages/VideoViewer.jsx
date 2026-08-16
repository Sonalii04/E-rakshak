import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  MdArrowBack,
  MdPlayArrow,
  MdPause,
  MdSkipPrevious,
  MdSkipNext,
  MdCameraAlt,
  MdLocationOn,
  MdAccessTime,
} from 'react-icons/md'
import Loader from '../components/common/Loader.jsx'
import ErrorState from '../components/common/ErrorState.jsx'
import { useAsync } from '../hooks/useAsync.js'
import { getResultById } from '../services/searchService.js'
import { formatDateTime, formatConfidence, confidenceTone, classNames } from '../utils/formatters'
import { useLanguage } from '../context/LanguageContext.jsx'

const SPEEDS = [0.5, 1, 1.5, 2]

export default function VideoViewer() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: result, isLoading, error, refetch } = useAsync(() => getResultById(id), [id])
  const { t } = useLanguage()

  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(15)
  const [speed, setSpeed] = useState(1)

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : Math.min(100, prev + speed)))
    }, 300)
    return () => clearInterval(interval)
  }, [isPlaying, speed])

  if (isLoading) return <Loader label={t('videoViewer.loadingFootage')} fullHeight />
  if (error) return <ErrorState description={error} onRetry={refetch} />
  if (!result) return <ErrorState title={t('videoViewer.clipNotFoundTitle')} description={t('videoViewer.clipNotFoundDesc')} />

  const snapshots = result?.snapshots || [result?.snapshot]
  const currentFrameIndex = Math.min(
    snapshots.length - 1,
    Math.floor((progress / 100) * snapshots.length)
  )
  const currentImage = snapshots[currentFrameIndex] || result?.snapshot

  const BOUNDING_BOXES = [
    {
      id: result.id,
      top: result.objectType === 'Person' ? '28%' : '46%',
      left: result.objectType === 'Person' ? '32%' : '58%',
      width: result.objectType === 'Person' ? '18%' : '26%',
      height: result.objectType === 'Person' ? '38%' : '24%',
      objectType: result.objectType,
      confidence: result.confidence
    }
  ]

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-secondary">
        <MdArrowBack className="h-4 w-4" /> {t('videoViewer.backToResults')}
      </button>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <div className="card-surface overflow-hidden">
          <div className="relative aspect-video w-full bg-black flex items-center justify-center">
            <img src={currentImage} alt={result.id} className="max-h-full max-w-full object-contain opacity-90" />

            {BOUNDING_BOXES.map((box) => (
              <div
                key={box.id}
                className="absolute rounded border-2 border-accent shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
                style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
              >
                <span className="absolute -top-6 left-0 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {t(`enums.objectTypes.${box.objectType}`)} - {box.confidence}%
                </span>
              </div>
            ))}

            <button
              onClick={() => setIsPlaying((v) => !v)}
              className="absolute inset-0 flex items-center justify-center bg-black/0 transition hover:bg-black/10"
              aria-label={t('videoViewer.togglePlay')}
            >
              {!isPlaying && (
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-primary shadow-popover">
                  <MdPlayArrow className="h-8 w-8" />
                </span>
              )}
            </button>
          </div>

          <div className="space-y-3 p-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{Math.round(progress)}%</span>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="flex-1 accent-secondary"
              />
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">02:14</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setProgress((p) => Math.max(0, p - 10))}
                  className="flex h-9 w-9 items-center justify-center rounded-control border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-primary-400/30 dark:text-slate-300 dark:hover:bg-primary-400/10"
                  aria-label={t('videoViewer.previousFrame')}
                >
                  <MdSkipPrevious className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setIsPlaying((v) => !v)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-white hover:bg-secondary-700"
                  aria-label={t('videoViewer.playPause')}
                >
                  {isPlaying ? <MdPause className="h-5 w-5" /> : <MdPlayArrow className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => setProgress((p) => Math.min(100, p + 10))}
                  className="flex h-9 w-9 items-center justify-center rounded-control border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-primary-400/30 dark:text-slate-300 dark:hover:bg-primary-400/10"
                  aria-label={t('videoViewer.nextFrame')}
                >
                  <MdSkipNext className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={classNames(
                      'rounded-control px-2.5 py-1.5 text-xs font-semibold transition',
                      speed === s
                        ? 'bg-secondary text-white'
                        : 'border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-primary-400/30 dark:text-slate-300 dark:hover:bg-primary-400/10'
                    )}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card-surface space-y-4 p-5">
          <h3 className="text-sm font-semibold text-primary dark:text-slate-100">{t('videoViewer.objectInformation')}</h3>

          <div className={classNames('rounded-control border px-3 py-2 text-xs font-bold', confidenceTone(result.confidence))}>
            {t('videoViewer.confidenceLabel', { value: formatConfidence(result.confidence) })}
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500"><MdCameraAlt className="h-4 w-4" /> {t('videoViewer.camera')}</dt>
              <dd className="font-medium text-primary dark:text-slate-100">{result.cameraId}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500"><MdLocationOn className="h-4 w-4" /> {t('videoViewer.location')}</dt>
              <dd className="text-right font-medium text-primary dark:text-slate-100">{result.location}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500"><MdAccessTime className="h-4 w-4" /> {t('videoViewer.timestamp')}</dt>
              <dd className="text-right font-medium text-primary dark:text-slate-100">{formatDateTime(result.timestamp)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-primary-400/20">
              <dt className="text-slate-400 dark:text-slate-500">{t('videoViewer.objectType')}</dt>
              <dd className="font-medium text-primary dark:text-slate-100">{t(`enums.objectTypes.${result.objectType}`)}</dd>
            </div>
            {result.vehicleType !== '-' && (
              <div className="flex items-center justify-between">
                <dt className="text-slate-400 dark:text-slate-500">{t('videoViewer.vehicleType')}</dt>
                <dd className="font-medium text-primary dark:text-slate-100">{t(`enums.vehicleTypes.${result.vehicleType}`)}</dd>
              </div>
            )}
            {result.clothing !== '-' && (
              <div className="flex items-center justify-between">
                <dt className="text-slate-400 dark:text-slate-500">{t('videoViewer.clothing')}</dt>
                <dd className="text-right font-medium text-primary dark:text-slate-100">{result.clothing}</dd>
              </div>
            )}
            <div className="flex items-center justify-between">
              <dt className="text-slate-400 dark:text-slate-500">{t('videoViewer.color')}</dt>
              <dd className="font-medium text-primary dark:text-slate-100">{t(`enums.clothingColors.${result.color}`)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
