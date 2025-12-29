import React, { useState, useEffect } from 'react'
import axiosInstance from '../api/axiosInstance'
import { useNavigate } from 'react-router-dom'
import { useFreeQuota } from '../hooks/useBilling'
import FreeQuotaModal from '../components/FreeQuotaModal'

interface CurrentMonthSummary {
  current_month: string
  total_usage_amount: number
  usage_count: number
  latest_billing_cycle: {
    id: number
    year_month: string
    total_bill_amount: number
    status: string
    due_date: string | null
  } | null
}

const BillingDashboard: React.FC = () => {
  const [summary, setSummary] = useState<CurrentMonthSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const { quota, isLoading: quotaLoading, refetch: refetchQuota } = useFreeQuota()
  const [showFreeModal, setShowFreeModal] = useState(false)
  const [previousQuota, setPreviousQuota] = useState<{ free_invoice_left: number; free_status_left: number } | null>(null)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axiosInstance.get('/billing/current/summary')
        setSummary(res.data)
      } catch (error: any) {
        console.error('요약 정보 로드 실패:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSummary()
  }, [])

  // 무료 쿼터 변경 감지 및 팝업 표시
  useEffect(() => {
    if (!quota) return

    // 이전 상태와 비교하여 변경 감지
    if (previousQuota) {
      // 전자세금계산서 무료 제공분 소진 시 팝업 표시
      // 사업자상태조회는 전자세금계산서 무료 제공 기간 동안만 무료로 제공되므로 별도 기준 불필요
      const wasMoreThanZero = previousQuota.free_invoice_left > 0
      const isNowZero = quota.free_invoice_left === 0

      if (wasMoreThanZero && isNowZero && quota.show_free_popup) {
        setShowFreeModal(true)
      }
    }

    // 현재 상태를 이전 상태로 저장 (값이 실제로 변경된 경우에만)
    const currentQuota = {
      free_invoice_left: quota.free_invoice_left,
      free_status_left: quota.free_status_left
    }

    if (!previousQuota ||
      previousQuota.free_invoice_left !== currentQuota.free_invoice_left ||
      previousQuota.free_status_left !== currentQuota.free_status_left) {
      setPreviousQuota(currentQuota)
    }
  }, [quota]) // previousQuota를 의존성에서 제거

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  // 무료 제공 정보 표시 여부 결정 (소진 후 1주일 경과 시 숨김)
  const shouldShowFreeQuota = (quota: { free_invoice_left: number; free_status_left: number; consumed_at?: string | null }) => {
    // 전자세금계산서 무료 제공분이 남아있으면 항상 표시
    // 사업자상태조회는 전자세금계산서 무료 제공 기간 동안만 무료로 제공되므로 별도 기준 불필요
    if (quota.free_invoice_left > 0) {
      return true
    }

    // 무료가 모두 소진되었지만 consumed_at이 없으면 표시 (아직 소진 안됨)
    if (!quota.consumed_at) {
      return true
    }

    // 소진 시점으로부터 1주일 경과 여부 확인
    const consumedDate = new Date(quota.consumed_at)
    const now = new Date()
    const daysSinceConsumed = Math.floor((now.getTime() - consumedDate.getTime()) / (1000 * 60 * 60 * 24))

    // 1주일(7일) 미만이면 표시, 7일 이상이면 숨김
    return daysSinceConsumed < 7
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6 pt-24 pb-8">
      <div className="max-w-[480px] mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          사용요금
        </h1>

        {/* 사용요금 안내 */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg mb-4">
          <h2 className="text-base font-semibold text-blue-900 dark:text-blue-100 mb-2">
            사용요금 안내
          </h2>
          <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
            • 전자세금계산서 발행: <b>건당 200원</b>
            <br />
            • 사업자등록 상태조회: <b>건당 15원</b>
            <br />
            <br />
            지난달 사용한 만큼만 매월 초에 후불로 청구됩니다.
          </p>
        </div>

        {/* 무료 제공 정보 */}
        {!quotaLoading && quota && shouldShowFreeQuota(quota) && (
          <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg mb-4">
            <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed">
              무료 제공: 계산서 <b>{quota.free_invoice_left}건</b> 남음
              {quota.free_invoice_left > 0 && <span className="text-green-600 dark:text-green-300"> (상태조회는 기간내 무료제공)</span>}
            </p>
          </div>
        )}

        {/* 이번 달 사용 현황 카드 (클릭 가능) */}
        <button
          onClick={() => navigate('/billing/usage?month=current')}
          className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            이번 달 사용 현황
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">사용 금액</span>
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {formatNumber(summary?.total_usage_amount || 0)}원
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">사용 건수</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {summary?.usage_count || 0}건
              </span>
            </div>
          </div>
        </button>

        {/* 메뉴 카드 */}
        <div className="grid grid-cols-1 gap-3 mt-4">
          <button
            onClick={() => navigate('/billing/usage')}
            className="w-full py-4 px-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                  사용 내역 보기
                </div>
              </div>
              <span className="text-gray-400 text-xl">→</span>
            </div>
          </button>

          <button
            onClick={() => navigate('/billing/cycles')}
            className="w-full py-4 px-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                  청구서 보기
                </div>
              </div>
              <span className="text-gray-400 text-xl">→</span>
            </div>
          </button>

          <button
            onClick={() => navigate('/billing/payment-methods')}
            className="w-full py-4 px-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                  결제수단 관리
                </div>
              </div>
              <span className="text-gray-400 text-xl">→</span>
            </div>
          </button>
        </div>
      </div>

      {/* 무료 제공 소진 팝업 */}
      {showFreeModal && (
        <FreeQuotaModal
          onClose={() => {
            setShowFreeModal(false)
            refetchQuota() // 쿼터 정보 다시 불러오기
          }}
        />
      )}
    </div>
  )
}

export default BillingDashboard

