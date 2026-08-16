import { useState, useEffect } from 'react'
import { MdFilterList, MdRefresh } from 'react-icons/md'
import { OBJECT_TYPES, VEHICLE_TYPES, CLOTHING_COLORS } from '../../utils/constants'
import { useLanguage } from '../../context/LanguageContext.jsx'
import { getCameras } from '../../services/cameraService.js'

export default function FilterPanel({ filters, onChange, onReset }) {
  const { t } = useLanguage()
  const [cameras, setCameras] = useState([])

  useEffect(() => {
    getCameras().then(setCameras).catch(() => {})
  }, [])

  function set(field, val) {
    onChange({ ...filters, [field]: val })
  }

  return (
    <div className="card-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-primary dark:text-slate-100">
          <MdFilterList className="h-4 w-4 text-secondary" /> {t('filterPanel.title')}
        </h3>
        <button onClick={onReset} className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-secondary">
          <MdRefresh className="h-4 w-4" /> {t('filterPanel.reset')}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="label-text">{t('filterPanel.camera')}</label>
          <select className="input-field" value={filters.camera} onChange={(e) => set('camera', e.target.value)}>
            <option value="">{t('filterPanel.allCameras')}</option>
            {cameras.map((cam) => (
              <option key={cam.id} value={cam.id}>{cam.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-text">{t('filterPanel.location')}</label>
          <input
            type="text"
            className="input-field"
            placeholder={t('filterPanel.locationPlaceholder')}
            value={filters.location}
            onChange={(e) => set('location', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-text">{t('filterPanel.date')}</label>
            <input type="date" className="input-field" value={filters.date} onChange={(e) => set('date', e.target.value)} />
          </div>
          <div>
            <label className="label-text">{t('filterPanel.time')}</label>
            <input type="time" className="input-field" value={filters.time} onChange={(e) => set('time', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label-text">{t('filterPanel.objectType')}</label>
          <select className="input-field" value={filters.objectType} onChange={(e) => set('objectType', e.target.value)}>
            <option value="">{t('filterPanel.anyObject')}</option>
            {OBJECT_TYPES.map((type) => (
              <option key={type} value={type}>{t(`enums.objectTypes.${type}`)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-text">{t('filterPanel.vehicleType')}</label>
          <select className="input-field" value={filters.vehicleType} onChange={(e) => set('vehicleType', e.target.value)}>
            <option value="">{t('filterPanel.anyVehicle')}</option>
            {VEHICLE_TYPES.map((type) => (
              <option key={type} value={type}>{t(`enums.vehicleTypes.${type}`)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-text">{t('filterPanel.clothingColor')}</label>
          <select className="input-field" value={filters.clothingColor} onChange={(e) => set('clothingColor', e.target.value)}>
            <option value="">{t('filterPanel.anyColor')}</option>
            {CLOTHING_COLORS.map((color) => (
              <option key={color} value={color}>{t(`enums.clothingColors.${color}`)}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="label-text mb-0">{t('filterPanel.confidence')}</label>
            <span className="text-xs font-semibold text-secondary">{filters.confidence}%+</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={filters.confidence}
            onChange={(e) => set('confidence', Number(e.target.value))}
            className="w-full accent-secondary"
          />
        </div>
      </div>
    </div>
  )
}
