import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import axiosInstance from '../api/axiosInstance'

interface DeleteCheckResponse {
  state: 'A' | 'B' | 'C' | 'D'
  unpaid_amount: number
  unbilled_amount: number
  has_history: boolean
}

const DeleteAccountPage: React.FC = () => {
  const navigate = useNavigate()
  const { logout } = useAuth()
  
  const [checkResult, setCheckResult] = useState<DeleteCheckResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkDeleteStatus()
  }, [])

  const checkDeleteStatus = async () => {
    try {
      setIsLoading(true)
      const res = await axiosInstance.get('/account/delete/check')
      setCheckResult(res.data)
    } catch (error: any) {
      console.error('탈퇴 상태 확인 실패:', error)
      setError('탈퇴 상태를 확인할 수 없습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInstantBillingAndPay = async () => {
    try {
      setIsProcessing(true)
      const res = await axiosInstance.post('/billing/generate-now')
      const billingId = res.data.billing_cycle_id
      navigate(`/billing/cycles/${billingId}`)
    } catch (error: any) {
      console.error('즉시 청구서 생성 실패:', error)
      alert('청구서 생성 중 오류가 발생했습니다.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!confirm('정말로 회원 탈퇴를 진행하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      return
    }

    try {
      setIsProcessing(true)
      await axiosInstance.post('/account/delete/confirm')
      
      // 탈퇴 성공 처리
      logout()
      navigate('/goodbye')
    } catch (error: any) {
      console.error('회원 탈퇴 실패:', error)
      if (error.response?.status === 403) {
        alert('미결제 사용요금이 있어 탈퇴할 수 없습니다. 상태를 다시 확인합니다.')
        checkDeleteStatus()
      } else {
        alert('회원 탈퇴 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6 pt-24 pb-8">
        <div className="max-w-[480px] mx-auto">
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            확인 중...
          </div>
        </div>
      </div>
    )
  }

  if (!checkResult) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6 pt-24 pb-8">
        <div className="max-w-[480px] mx-auto">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">
              {error || '탈퇴 상태를 확인할 수 없습니다.'}
            </p>
            <button
              onClick={checkDeleteStatus}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              다시 확인
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6 pt-24 pb-8">
      <div className="max-w-[480px] mx-auto">
        <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-6">
          회원 탈퇴
        </h1>

        {/* A 상태: 미결제 존재 */}
        {checkResult.state === 'A' && (
          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
                결제가 완료되지 않은 사용요금이 있어요.
              </h2>
              <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                회원탈퇴는 미결제 사용요금을 납부하신 뒤 가능합니다.
              </p>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">미결제 금액</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {formatNumber(checkResult.unpaid_amount)}원
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/billing/cycles')}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  결제하기
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="flex-1 py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* B 상태: 미청구 사용 존재 */}
        {checkResult.state === 'B' && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
                이번 달 사용하신 내역이 아직 청구되지 않았습니다.
              </h2>
              <p className="text-blue-700 dark:text-blue-300 mb-4">
                아래 금액을 결제하시면 회원탈퇴가 가능합니다.
              </p>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">미청구 사용금액</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {formatNumber(checkResult.unbilled_amount)}원
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleInstantBillingAndPay}
                  disabled={isProcessing}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? '처리 중...' : '즉시 청구서 생성하고 결제하기'}
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="flex-1 py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* C 상태: 과거 사용내역만 존재 */}
        {checkResult.state === 'C' && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                그동안 이용해주셔서 감사합니다.
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                탈퇴 시 계정은 삭제되며,<br/>
                발행내역은 법령에 따라 보관됩니다.<br/>
                탈퇴를 진행하시겠습니까?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmDelete}
                  disabled={isProcessing}
                  className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? '처리 중...' : '회원탈퇴 진행하기'}
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="flex-1 py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* D 상태: 사용내역 없음 */}
        {checkResult.state === 'D' && (
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-3">
                정말 탈퇴하시겠습니까?
              </h2>
              <p className="text-red-700 dark:text-red-300 mb-4 leading-relaxed">
                탈퇴 시 계정은 삭제되며,<br/>
                발행내역은 법령에 따라 보관됩니다.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmDelete}
                  disabled={isProcessing}
                  className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? '처리 중...' : '회원탈퇴'}
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="flex-1 py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DeleteAccountPage
