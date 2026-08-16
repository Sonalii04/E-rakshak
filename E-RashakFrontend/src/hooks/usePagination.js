import { useMemo, useState } from 'react'

export function usePagination(items, pageSize = 6) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  function goToPage(next) {
    setPage(Math.min(Math.max(1, next), totalPages))
  }

  return { page, totalPages, paginated, goToPage, setPage }
}
