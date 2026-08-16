import { MdVideocam, MdLocationOn, MdAspectRatio, MdAccessTime } from 'react-icons/md'
import StatusBadge from '../common/StatusBadge.jsx'
import { formatDateTime } from '../../utils/formatters'
import { useLanguage } from '../../context/LanguageContext.jsx'

export default function CameraCard({ camera }) {
  const { t } = useLanguage()
  return (
    <div className="card-surface flex flex-col gap-3 p-5 transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-card animate-fadeIn">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-control bg-secondary-50 text-secondary-700 dark:bg-secondary-600/15 dark:text-secondary-100">
            <MdVideocam className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary dark:text-slate-100">{camera.name}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{camera.id}</p>
          </div>
        </div>
        <StatusBadge status={camera.status} />
      </div>
      <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
        <p className="flex items-center gap-1.5"><MdLocationOn className="h-4 w-4" /> {camera.location}</p>
        <p className="flex items-center gap-1.5"><MdAspectRatio className="h-4 w-4" /> {camera.resolution}</p>
        <p className="flex items-center gap-1.5"><MdAccessTime className="h-4 w-4" /> {t('components.cameraCard.lastActive')} {formatDateTime(camera.lastActive)}</p>
      </div>
    </div>
  )
}
