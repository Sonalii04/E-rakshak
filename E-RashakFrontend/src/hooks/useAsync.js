import { useCallback, useEffect, useState } from 'react'

// Wraps a promise-returning function with loading/error/data state.
// Pass deps to control when it re-runs, mirroring useEffect semantics.
export function useAsync(asyncFn, deps = []) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const run = useCallback(() => {
    setIsLoading(true)
    setError(null)
    asyncFn()
      .then((result) => setData(result))
      .catch((err) => setError(err.message || 'Something went wrong.'))
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    run()
  }, [run])

  return { data, isLoading, error, refetch: run }
}
