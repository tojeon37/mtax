import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axiosInstance'

interface PaymentMethod {
  id: number
  user_id: number
  method_type: string
  masked_number: string
  provider: string
  toss_billing_key: string | null
  is_default: boolean
  created_at: string
}

export default function PaymentMethodPage() {
  const navigate = useNavigate()
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [openForm, setOpenForm] = useState(false)
  const [type, setType] = useState<'card' | 'bank'>('card')
  const [number, setNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadMethods()
  }, [])

  const loadMethods = async () => {
    try {
      setIsLoading(true)
      const res = await axiosInstance.get('/payment-methods')
      setMethods(res.data)
    } catch (error: any) {
      console.error('결제수단 목록 로드 실패:', error)
      alert('결제수단 목록을 불러올 수 없습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const registerMethod = async () => {
    if (!number.trim()) {
      alert('카드번호 또는 계좌번호를 입력해주세요.')
      return
    }

    try {
      setIsSubmitting(true)
      await axiosInstance.post('/payment-methods', {
        method_type: type,
        number: number.trim(),
      })
      setOpenForm(false)
      setNumber('')
      loadMethods()
    } catch (error: any) {
      console.error('결제수단 등록 실패:', error)
      alert('결제수단 등록에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const setDefault = async (id: number) => {
    try {
      await axiosInstance.patch(`/payment-methods/${id}/default`)
      loadMethods()
    } catch (error: any) {
      console.error('기본 결제수단 설정 실패:', error)
      alert('기본 결제수단 설정에 실패했습니다.')
    }
  }

  const remove = async (id: number) => {
    if (!confirm('정말로 이 결제수단을 삭제하시겠습니까?')) {
      return
    }

    try {
      await axiosInstance.delete(`/payment-methods/${id}`)
      loadMethods()
    } catch (error: any) {
      console.error('결제수단 삭제 실패:', error)
      alert('결제수단 삭제에 실패했습니다.')
    }
  }

  const getMethodTypeLabel = (methodType: string) => {
    return methodType === 'card' ? '카드' : '계좌'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6 pt-24 pb-8">
      <div className="max-w-[480px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/billing')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            결제수단 관리
          </h1>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            불러오는 중…
          </div>
        ) : (
          <>
            {/* 등록된 결제수단 목록 */}
            {methods.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-200 dark:border-gray-700 text-center mb-4">
                <p className="text-gray-500 dark:text-gray-400">
                  등록된 결제수단이 없습니다.
                </p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {methods.map((m) => (
                  <div
                    key={m.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {getMethodTypeLabel(m.method_type)}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          ({m.masked_number})
                        </span>
                      </div>
                      {m.is_default && (
                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-medium">
                          기본
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex gap-3">
                      {!m.is_default && (
                        <button
                          onClick={() => setDefault(m.id)}
                          className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          기본설정
                        </button>
                      )}
                      <button
                        onClick={() => remove(m.id)}
                        className="text-red-600 dark:text-red-400 text-sm font-medium hover:text-red-700 dark:hover:text-red-300"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 새 결제수단 등록 버튼 */}
            {!openForm && (
              <button
                onClick={() => setOpenForm(true)}
                className="w-full py-3 px-4 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
              >
                새 결제수단 등록
              </button>
            )}

            {/* 등록 폼 */}
            {openForm && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  결제수단 등록
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    결제수단 종류
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'card' | 'bank')}
                    className="w-full h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="card">신용/체크카드</option>
                    <option value="bank">계좌 자동이체</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {type === 'card' ? '카드번호' : '계좌번호'}
                  </label>
                  <input
                    type="text"
                    placeholder={type === 'card' ? '카드번호를 입력하세요' : '계좌번호를 입력하세요'}
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={registerMethod}
                    disabled={isSubmitting || !number.trim()}
                    className="flex-1 py-3 px-4 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? '등록 중...' : '등록하기'}
                  </button>
                  <button
                    onClick={() => {
                      setOpenForm(false)
                      setNumber('')
                    }}
                    className="flex-1 py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

