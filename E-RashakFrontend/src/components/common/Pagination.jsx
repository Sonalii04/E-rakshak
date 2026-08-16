import { MdChevronLeft, MdChevronRight } from 'react-icons/md'
import { useLanguage } from '../../context/LanguageContext.jsx'

export default function Pagination({ page, totalPages, onPageChange }) {
  const { t } = useLanguage()
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="flex items-center justify-center gap-1.5 pt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="flex h-9 w-9 items-center justify-center rounded-control border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-primary-400/30 dark:text-slate-300 dark:hover:bg-primary-400/10"
        aria-label={t('components.pagination.previous')}
      >
        <MdChevronLeft className="h-5 w-5" />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={
            p === page
              ? 'flex h-9 w-9 items-center justify-center rounded-control bg-secondary text-sm font-semibold text-white'
              : 'flex h-9 w-9 items-center justify-center rounded-control border border-slate-200 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-primary-400/30 dark:text-slate-300 dark:hover:bg-primary-400/10'
          }
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-control border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-primary-400/30 dark:text-slate-300 dark:hover:bg-primary-400/10"
        aria-label={t('components.pagination.next')}
      >
        <MdChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}
