import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import axiosInstance from '../../api/axiosInstance'

interface UsageLog {
  id: number
  user_id: number
  usage_type: string
  unit_price: number
  quantity: number
  total_price: number
  billing_cycle_id: number | null
  created_at: string
}

export default function UsageHistoryPage() {
  const [searchParams] = useSearchParams()
  const [logs, setLogs] = useState<UsageLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [activeTab, setActiveTab] = useState<'current' | 'all'>('current')

  // URL 파라미터에서 month=current 확인
  useEffect(() => {
    const month = searchParams.get('month')
    if (month === 'current') {
      setActiveTab('current')
    } else {
      setActiveTab('all')
    }
  }, [searchParams])

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true)
        
        const params: any = {
          page,
          limit: 50
        }
        
        // 이번 달 필터링
        if (activeTab === 'current') {
          const now = new Date()
          const year = now.getFullYear()
          const month = String(now.getMonth() + 1).padStart(2, '0')
          params.start_date = `${year}-${month}-01`
          // 다음 달 1일
          const nextMonth = new Date(year, now.getMonth() + 1, 1)
          params.end_date = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`
        }
        
        const res = await axiosInstance.get('/usage', { params })
        const newLogs = res.data
        
        if (page === 1) {
          setLogs(newLogs)
        } else {
          setLogs(prev => [...prev, ...newLogs])
        }
        
        setHasMore(newLogs.length === 50)
      } catch (error: any) {
        console.error('사용 내역 로드 실패:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (activeTab) {
      fetchLogs()
    }
  }, [activeTab, page])

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const getUsageTypeLabel = (type: string) => {
    switch (type) {
      case 'invoice_issue':
        return '세금계산서 발행'
      case 'status_check':
        return '사업자 상태조회'
      default:
        return type
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6 pt-24 pb-8">
      <div className="max-w-[480px] mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          사용 내역
        </h1>

        {/* 탭 UI */}
        <div className="flex gap-2 mb-6 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              setActiveTab('current')
              setPage(1)
              setLogs([])
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'current'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            이번 달 사용내역
          </button>
          <button
            onClick={() => {
              setActiveTab('all')
              setPage(1)
              setLogs([])
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            전체 내역
          </button>
        </div>

        {isLoading && logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            불러오는 중…
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              사용 내역이 없습니다.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {getUsageTypeLabel(log.usage_type)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      단가 {formatNumber(log.unit_price)}원 × {log.quantity}건
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {formatDate(log.created_at)}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatNumber(log.total_price)}원
                  </div>
                </div>
              </div>
            ))}
            
            {hasMore && (
              <button
                onClick={() => setPage(prev => prev + 1)}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? '불러오는 중…' : '더 보기'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

