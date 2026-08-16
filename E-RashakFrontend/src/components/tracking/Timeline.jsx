import { MdCameraAlt, MdLocationOn } from 'react-icons/md'
import { formatDateTime, formatConfidence, confidenceTone, classNames } from '../../utils/formatters'

export default function Timeline({ trail }) {
  return (
    <div className="relative flex flex-col gap-6 pl-2 sm:flex-row sm:items-start sm:gap-4 sm:overflow-x-auto sm:pb-4">
      <div className="absolute left-[27px] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-primary-400/30 sm:left-0 sm:right-0 sm:top-[27px] sm:bottom-auto sm:h-0.5 sm:w-full" />
      {trail.map((point, index) => (
        <div key={point.id} className="relative z-10 flex gap-4 sm:min-w-[220px] sm:flex-col sm:gap-3">
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-secondary bg-white text-xs font-bold text-secondary dark:bg-primary-600">
              {index + 1}
            </div>
          </div>
          <div className="card-surface flex-1 p-4 animate-fadeIn">
            <img
              src={point.preview}
              alt={point.camera}
              className="mb-3 h-24 w-full rounded-control object-cover"
              loading="lazy"
            />
            <p className="flex items-center gap-1.5 text-sm font-semibold text-primary dark:text-slate-100">
              <MdCameraAlt className="h-4 w-4 text-slate-400" /> {point.camera}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <MdLocationOn className="h-4 w-4 text-slate-400" /> {point.location}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-slate-400 dark:text-slate-500">{formatDateTime(point.timestamp)}</span>
              <span className={classNames('rounded-full border px-2 py-0.5 text-xs font-bold', confidenceTone(point.confidence))}>
                {formatConfidence(point.confidence)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
