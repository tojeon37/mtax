import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axiosInstance'

interface BillingCycle {
  id: number
  user_id: number
  year_month: string
  total_usage_amount: number
  monthly_fee: number
  total_bill_amount: number
  status: string
  due_date: string | null
  created_at: string
}

export default function BillingCycleListPage() {
  const navigate = useNavigate()
  const [cycles, setCycles] = useState<BillingCycle[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCycles()
  }, [])

  const fetchCycles = async () => {
    try {
      setIsLoading(true)
      const res = await axiosInstance.get('/billing', {
        params: {
          page: 1,
          limit: 100
        }
      })
      setCycles(res.data)
    } catch (error: any) {
      console.error('청구서 목록 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('ko-KR')
    } catch {
      return dateString
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '미납'
      case 'paid':
        return '납부완료'
      case 'overdue':
        return '연체'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
      case 'paid':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      case 'overdue':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6 pt-24 pb-8">
      <div className="max-w-[480px] mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          청구서 보기
        </h1>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            불러오는 중…
          </div>
        ) : cycles.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              청구서가 없습니다.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {cycles.map((cycle) => (
              <div
                key={cycle.id}
                onClick={() => navigate(`/billing/cycles/${cycle.id}`)}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {cycle.year_month.slice(0, 4)}년 {cycle.year_month.slice(4)}월 청구서
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      사용 금액: {formatNumber(cycle.total_usage_amount)}원
                    </div>
                    {cycle.due_date && (
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        납부 기한: {formatDate(cycle.due_date)}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                      {formatNumber(cycle.total_bill_amount)}원
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(cycle.status)}`}>
                      {getStatusLabel(cycle.status)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

