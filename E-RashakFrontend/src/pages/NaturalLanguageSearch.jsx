import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MdSearch } from 'react-icons/md'
import SearchBar from '../components/search/SearchBar.jsx'
import FilterPanel from '../components/search/FilterPanel.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'

const DEFAULT_FILTERS = {
  camera: '',
  location: '',
  date: '',
  time: '',
  objectType: '',
  vehicleType: '',
  clothingColor: '',
  confidence: 50,
}

export default function NaturalLanguageSearch() {
  const location = useLocation()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { t } = useLanguage()
  const [query, setQuery] = useState(location.state?.prefill || '')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [isSearching, setIsSearching] = useState(false)

  function handleImageUpload(file) {
    if (!file) return
    showToast({ type: 'info', title: t('search.imageAttachedTitle'), message: t('search.imageAttachedMessage', { filename: file.name }) })
  }

  function handleSubmit() {
    if (!query.trim()) {
      showToast({ type: 'warning', title: t('search.emptyQueryTitle'), message: t('search.emptyQueryMessage') })
      return
    }
    setIsSearching(true)
    setTimeout(() => {
      setIsSearching(false)
      navigate('/search/results', { state: { query, filters } })
    }, 400)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary-50 text-secondary-700 dark:bg-secondary-600/15 dark:text-secondary-100">
          <MdSearch className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-primary dark:text-slate-100">{t('search.title')}</h1>
        <p className="max-w-xl text-sm text-slate-500 dark:text-slate-400">
          {t('search.subtitle')}
        </p>
        <div className="w-full max-w-3xl pt-2">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={handleSubmit}
            onImageUpload={handleImageUpload}
            isSearching={isSearching}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        <FilterPanel filters={filters} onChange={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} />

        <div className="card-surface flex flex-col items-center justify-center gap-3 p-10 text-center text-slate-400 dark:text-slate-500">
          <MdSearch className="h-10 w-10" />
          <p className="text-sm font-medium">{t('search.resultsHintTitle')}</p>
          <p className="text-xs">{t('search.resultsHintDesc')}</p>
        </div>
      </div>
    </div>
  )
}
