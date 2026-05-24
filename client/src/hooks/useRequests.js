import { useState, useEffect, useCallback } from 'react'
import { getRequests } from '../api/requests'
import { getErrorMessage } from '../utils'

export function useRequests(initialParams = {}) {
  const [requests, setRequests] = useState([])
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, page: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [params, setParams] = useState(initialParams)

  const fetch = useCallback(() => {
    setLoading(true)
    setError(null)
    getRequests(params)
      .then((res) => {
        const { requests: reqs, total, totalPages, page } = res.data.data
        setRequests(reqs)
        setMeta({ total, totalPages, page })
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [params])

  useEffect(() => { fetch() }, [fetch])

  return {
    requests,
    total: meta.total,
    totalPages: meta.totalPages,
    page: meta.page,
    loading,
    error,
    params,
    setParams,
    refetch: fetch,
  }
}
