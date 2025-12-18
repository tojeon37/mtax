import { useState, useEffect } from 'react'
import axiosInstance from '../api/axiosInstance'
import { formatError } from '../utils/errorHelpers'

interface UsageLog {
  id: number
  usage_type: string
  unit_price: number
  quantity: number
  total_price: number
  created_at: string
}

export const useUsageLogs = (page: number = 1, limit: number = 50) => {
  const [logs, setLogs] = useState<UsageLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [page])

  const fetchLogs = async () => {
    try {
      setIsLoading(true)
      const res = await axiosInstance.get('/usage', {
        params: { page, limit }
      })
      const newLogs = res.data
      
      if (page === 1) {
        setLogs(newLogs)
      } else {
        setLogs(prev => [...prev, ...newLogs])
      }
      
      setHasMore(newLogs.length === limit)
      setError(null)
    } catch (err: any) {
      setError(formatError(err) || '사용 내역을 불러올 수 없습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return { logs, isLoading, error, hasMore, refetch: fetchLogs }
}

