import { useLocation, useNavigate } from 'react-router-dom'
import { MdArrowBack } from 'react-icons/md'
import ResultCard from '../components/cards/ResultCard.jsx'
import Loader from '../components/common/Loader.jsx'
import ErrorState from '../components/common/ErrorState.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import Pagination from '../components/common/Pagination.jsx'
import { useAsync } from '../hooks/useAsync.js'
import { usePagination } from '../hooks/usePagination.js'
import { runSearch } from '../services/searchService.js'
import { useToast } from '../context/ToastContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function SearchResults() {
  const location = useLocation()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { t } = useLanguage()
  const query = location.state?.query || ''
  const filters = location.state?.filters || {}

  const { data, isLoading, error, refetch } = useAsync(() => runSearch(query, filters), [query])
  const results = data?.results || []
  const { page, totalPages, paginated, goToPage } = usePagination(results, 6)

  function handleTrack(result) {
    showToast({ type: 'success', title: t('searchResults.trackingStartedTitle'), message: t('searchResults.trackingStartedMessage', { id: result.id }) })
    navigate('/tracking', { state: { resultId: result.id } })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button onClick={() => navigate('/search')} className="mb-2 flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-secondary">
            <MdArrowBack className="h-4 w-4" /> {t('searchResults.backToSearch')}
          </button>
          <h1 className="text-2xl font-bold text-primary dark:text-slate-100">{t('searchResults.title')}</h1>
          {query && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t('searchResults.showingResultsFor')} <span className="font-semibold text-primary dark:text-slate-200">&ldquo;{query}&rdquo;</span>
            </p>
          )}
        </div>
        {!isLoading && !error && (
          <span className="rounded-full bg-secondary-50 px-3 py-1.5 text-xs font-semibold text-secondary-700 dark:bg-secondary-600/15 dark:text-secondary-100">
            {t('searchResults.matchesFound', { count: results.length })}
          </span>
        )}
      </div>

      {isLoading && <Loader label={t('searchResults.scanning')} fullHeight />}
      {error && <ErrorState description={error} onRetry={refetch} />}

      {!isLoading && !error && results.length === 0 && (
        <EmptyState
          title={t('searchResults.noMatchesTitle')}
          description={t('searchResults.noMatchesDesc')}
        />
      )}

      {!isLoading && !error && results.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((result) => (
              <ResultCard
                key={result.id}
                result={result}
                onTrack={handleTrack}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
        </>
      )}
    </div>
  )
}
