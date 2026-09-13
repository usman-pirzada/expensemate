import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Runs an async data loader whenever deps change.
 * Returns { data, loading, error, reload }.
 */
export default function useRequest(loader, deps) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const loaderRef = useRef(loader)

  useEffect(() => {
    loaderRef.current = loader
  }, [loader])

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    loaderRef
      .current()
      .then((result) => setData(result))
      .catch((reason) => setError(reason))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(reload, [reload])

  return { data, loading, error, reload }
}