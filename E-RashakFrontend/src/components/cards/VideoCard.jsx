import { MdPlayCircleOutline } from 'react-icons/md'
import { formatDateTime } from '../../utils/formatters'

export default function VideoCard({ video, onSelect, isActive }) {
  return (
    <button
      onClick={() => onSelect?.(video)}
      className={`flex w-full items-center gap-3 rounded-control border p-3 text-left transition ${
        isActive
          ? 'border-secondary bg-secondary-50 dark:bg-secondary-600/10'
          : 'border-slate-200 hover:bg-slate-50 dark:border-primary-400/30 dark:hover:bg-primary-400/10'
      }`}
    >
      <div className="relative h-14 w-24 flex-shrink-0 overflow-hidden rounded-control bg-slate-200 dark:bg-primary-700">
        <img src={video.snapshot} alt={video.id} className="h-full w-full object-cover" loading="lazy" />
        <MdPlayCircleOutline className="absolute inset-0 m-auto h-6 w-6 text-white drop-shadow" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-primary dark:text-slate-100">{video.cameraId}</p>
        <p className="truncate text-xs text-slate-400 dark:text-slate-500">{formatDateTime(video.timestamp)}</p>
      </div>
    </button>
  )
}
