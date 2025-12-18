import { useState, useEffect } from 'react'
import axiosInstance from '../api/axiosInstance'
import { formatError } from '../utils/errorHelpers'

interface BillingCycle {
  id: number
  year_month: string
  total_bill_amount: number
  status: string
  due_date: string | null
}

interface CurrentMonthSummary {
  current_month: string
  total_usage_amount: number
  usage_count: number
  latest_billing_cycle: BillingCycle | null
}

export const useBillingCycles = () => {
  const [cycles, setCycles] = useState<BillingCycle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCycles()
  }, [])

  const fetchCycles = async () => {
    try {
      setIsLoading(true)
      const res = await axiosInstance.get('/billing', {
        params: { page: 1, limit: 100 }
      })
      setCycles(res.data)
      setError(null)
    } catch (err: any) {
      setError(formatError(err) || '청구서 목록을 불러올 수 없습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return { cycles, isLoading, error, refetch: fetchCycles }
}

export const useCurrentMonthSummary = () => {
  const [summary, setSummary] = useState<CurrentMonthSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSummary()
  }, [])

  const fetchSummary = async () => {
    try {
      setIsLoading(true)
      const res = await axiosInstance.get('/billing/current/summary')
      setSummary(res.data)
      setError(null)
    } catch (err: any) {
      setError(formatError(err) || '요약 정보를 불러올 수 없습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return { summary, isLoading, error, refetch: fetchSummary }
}

interface FreeQuotaInfo {
  free_invoice_left: number
  free_status_left: number
  show_free_popup?: boolean
  consumed_at?: string | null  // 소진 시점 (ISO 형식)
}

export const useFreeQuota = () => {
  const [quota, setQuota] = useState<FreeQuotaInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchQuota()
  }, [])

  const fetchQuota = async () => {
    try {
      setIsLoading(true)
      const res = await axiosInstance.get('/free-quota')
      setQuota(res.data)
      setError(null)
    } catch (err: any) {
      setError(formatError(err) || '무료 제공 정보를 불러올 수 없습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return { quota, isLoading, error, refetch: fetchQuota }
}

