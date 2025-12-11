import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'

interface UsageLog {
  id: number
  usage_type: string
  unit_price: number
  quantity: number
  total_price: number
  created_at: string
}

interface BillingCycleDetail {
  id: number
  user_id: number
  year_month: string
  total_usage_amount: number
  monthly_fee: number
  total_bill_amount: number
  status: string
  due_date: string | null
  created_at: string
  usage_count: number
  usage_logs: UsageLog[]
}

const BillingCycleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [cycle, setCycle] = useState<BillingCycleDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaying, setIsPaying] = useState(false)

  useEffect(() => {
    if (id) {
      fetchDetail()
    }
  }, [id])

  const fetchDetail = async () => {
    try {
      setIsLoading(true)
      const res = await axiosInstance.get(`/billing/${id}`)
      setCycle(res.data)
    } catch (error: any) {
      console.error('청구서 상세 로드 실패:', error)
      alert('청구서를 불러올 수 없습니다.')
      navigate('/billing/cycles')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    navigate('/billing/cycles')
  }

  const handlePayment = async () => {
    if (!cycle || !id) return
    
    if (!confirm(`총 ${formatNumber(cycle.total_bill_amount)}원을 결제하시겠습니까?`)) {
      return
    }

    try {
      setIsPaying(true)
      await axiosInstance.post(`/payment/${id}/pay`, {
        billing_cycle_id: parseInt(id),
        amount: cycle.total_bill_amount,
        payment_method: 'card',  // TODO: 실제 결제 수단 선택 UI 추가
        transaction_id: null
      })
      
      alert('결제가 완료되었습니다.')
      fetchDetail()  // 상태 업데이트
    } catch (error: any) {
      console.error('결제 실패:', error)
      alert('결제 처리 중 오류가 발생했습니다.')
    } finally {
      setIsPaying(false)
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6 pt-24">
        <div className="max-w-[480px] mx-auto">
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            로딩 중...
          </div>
        </div>
      </div>
    )
  }

  if (!cycle) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6 pt-24 pb-32">
      <div className="max-w-[480px] mx-auto space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {cycle.year_month.slice(0, 4)}년 {cycle.year_month.slice(4)}월 청구서
          </h1>
        </div>

        {/* 청구 요약 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">사용 금액</span>
              <span className="text-gray-900 dark:text-gray-100">
                {formatNumber(cycle.total_usage_amount)}원
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">월 기본료</span>
              <span className="text-gray-900 dark:text-gray-100">
                {formatNumber(cycle.monthly_fee)}원
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">총 청구 금액</span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatNumber(cycle.total_bill_amount)}원
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">납부 상태</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {getStatusLabel(cycle.status)}
              </span>
            </div>
            {cycle.due_date && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">납부 기한</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {formatDate(cycle.due_date)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 사용 내역 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            사용 내역 ({cycle.usage_count}건)
          </h2>
          {cycle.usage_logs.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              사용 내역이 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {cycle.usage_logs.map((log) => (
                <div
                  key={log.id}
                  className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
                >
                  <div>
                    <div className="text-gray-900 dark:text-gray-100 font-medium">
                      {getUsageTypeLabel(log.usage_type)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {formatNumber(log.unit_price)}원 × {log.quantity}건
                    </div>
                  </div>
                  <div className="text-gray-900 dark:text-gray-100 font-semibold">
                    {formatNumber(log.total_price)}원
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 결제 버튼 */}
        {cycle.status === 'pending' && (
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40">
            <div className="max-w-[480px] mx-auto px-4 py-4">
              <button
                onClick={handlePayment}
                disabled={isPaying}
                className="w-full h-14 rounded-xl font-semibold text-lg bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPaying ? '결제 처리 중...' : `결제하기 (${formatNumber(cycle.total_bill_amount)}원)`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BillingCycleDetail

