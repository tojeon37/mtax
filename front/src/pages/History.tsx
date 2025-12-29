import React, { useEffect, useState, useRef } from 'react'
import { Card } from '../components/ui/Card'
import { getInvoiceHistory, cancelTaxInvoice, cancelTaxInvoiceByInvoiceId, deleteInvoice, checkInvoiceStatus, InvoiceResponse } from '../api/invoiceApi'
import { useAuth } from '../hooks/useAuth'
import { formatError } from '../utils/errorHelpers'

export const History: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancellingIds, setCancellingIds] = useState<Set<number>>(new Set())
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())
  const { isAuthenticated } = useAuth()
  const statusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // 발행내역 로드
  useEffect(() => {
    const loadInvoiceHistory = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getInvoiceHistory()
        // 디버깅: 상태 값 확인
        console.log('발행내역 데이터:', data)
        data.forEach((invoice: InvoiceResponse) => {
          console.log(`Invoice ${invoice.id}: status="${invoice.status}", mgt_key="${invoice.mgt_key}"`)
        })
        setInvoices(data)
      } catch (err: any) {
        console.error('발행내역 로드 실패:', err)
        setError(formatError(err) || '발행내역을 불러오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadInvoiceHistory()
  }, [])

  // 3시간마다 상태 체크 (로그인된 경우만)
  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    const checkStatus = async () => {
      try {
        const result = await checkInvoiceStatus()
        if (result.success && result.updated_count > 0) {
          // 상태가 업데이트되었으면 발행내역 다시 로드
          const data = await getInvoiceHistory()
          setInvoices(data)
        }
      } catch (err: any) {
        // 상태 체크 실패는 조용히 처리 (콘솔에만 로그)
        console.error('상태 체크 실패:', err)
      }
    }

    // 초기 로드 후 즉시 한 번 체크
    const initialDelay = setTimeout(() => {
      checkStatus()
    }, 5000) // 5초 후 첫 체크

    // 3시간(10800000ms)마다 체크
    statusCheckIntervalRef.current = setInterval(() => {
      checkStatus()
    }, 3 * 60 * 60 * 1000) // 3시간

    return () => {
      clearTimeout(initialDelay)
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current)
      }
    }
  }, [isAuthenticated])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  const formatAmount = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('ko-KR').format(numAmount)
  }

  const getStatusDisplay = (status: string | undefined | null) => {
    if (!status) return '상태 없음'
    const statusMap: { [key: string]: string } = {
      'CREATED': '대기',  // CREATED도 대기로 표시
      '대기': '대기',
      '완료': '완료',
      '취소됨': '취소됨',
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string | undefined | null) => {
    if (!status) return 'text-gray-500 dark:text-gray-400'
    const normalizedStatus = status.toUpperCase()
    // CREATED와 대기는 모두 노란색(대기 색상)으로 표시
    if (normalizedStatus === 'CREATED' || normalizedStatus === '대기' || normalizedStatus === 'WAITING') {
      return 'text-yellow-600 dark:text-yellow-400'
    }
    if (normalizedStatus === '완료' || normalizedStatus === 'COMPLETED') {
      return 'text-green-600 dark:text-green-400'
    }
    if (normalizedStatus === '취소됨' || normalizedStatus === 'CANCELLED') {
      return 'text-gray-500 dark:text-gray-400'
    }
    return 'text-gray-600 dark:text-gray-400'
  }

  const handleCancel = async (invoice: InvoiceResponse) => {
    if (invoice.status === '완료') {
      alert('홈택스로 전송된 세금계산서는 취소할 수 없습니다.')
      return
    }

    const confirmed = window.confirm('세금계산서를 취소하시겠습니까?')
    if (!confirmed) return

    setCancellingIds(prev => new Set(prev).add(invoice.id))

    try {
      let result

      // mgt_key가 있으면 mgt_key로 취소, 없으면 invoice_id로 취소
      if (invoice.mgt_key && invoice.mgt_key !== 'null' && invoice.mgt_key !== '') {
        result = await cancelTaxInvoice(invoice.mgt_key)
      } else {
        // invoice_id로 취소 (백엔드에서 TaxInvoiceIssue에서 mgt_key 찾기)
        result = await cancelTaxInvoiceByInvoiceId(invoice.id)
      }

      if (result.success) {
        alert(result.message || '세금계산서가 취소되었습니다.')
        // 목록 새로고침
        const data = await getInvoiceHistory()
        setInvoices(data)
      } else {
        alert(result.message || '취소에 실패했습니다.')
      }
    } catch (err: any) {
      console.error('취소 실패:', err)
      alert(formatError(err) || '취소 중 오류가 발생했습니다.')
    } finally {
      setCancellingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(invoice.id)
        return newSet
      })
    }
  }

  const canDelete = (invoice: InvoiceResponse): boolean => {
    // 바로빌로 발행하지 않은 세금계산서만 삭제 가능
    // mgt_key가 없고, 상태가 "대기" 또는 "CREATED"인 경우 삭제 가능
    const hasNoMgtKey = !invoice.mgt_key || invoice.mgt_key === 'null' || invoice.mgt_key === null || invoice.mgt_key === ''
    const isWaitingStatus = invoice.status === '대기' || invoice.status === 'CREATED'

    return hasNoMgtKey && isWaitingStatus
  }

  const handleDelete = async (invoice: InvoiceResponse) => {
    if (invoice.status === '완료') {
      alert('완료된 세금계산서는 삭제할 수 없습니다.')
      return
    }

    const confirmed = window.confirm('세금계산서를 삭제하시겠습니까?')
    if (!confirmed) return

    setDeletingIds(prev => new Set(prev).add(invoice.id))

    try {
      const result = await deleteInvoice(invoice.id)
      if (result.success) {
        alert(result.message || '세금계산서가 삭제되었습니다.')
        // 목록 새로고침
        const data = await getInvoiceHistory()
        setInvoices(data)
      } else {
        alert(result.message || '삭제에 실패했습니다.')
      }
    } catch (err: any) {
      console.error('삭제 실패:', err)
      alert(formatError(err) || '삭제 중 오류가 발생했습니다.')
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(invoice.id)
        return newSet
      })
    }
  }

  const canCancel = (invoice: InvoiceResponse): boolean => {
    // 바로빌로 발행한 세금계산서만 취소 가능
    // mgt_key가 있거나, 상태가 "대기"/"CREATED"인 경우 취소 가능
    // 하지만 mgt_key가 없으면 바로빌로 발행하지 않은 것이므로 취소 불가
    const hasMgtKey = !!(invoice.mgt_key && invoice.mgt_key !== 'null' && invoice.mgt_key !== null && invoice.mgt_key !== '')
    const isWaitingStatus = invoice.status === '대기' || invoice.status === 'CREATED'

    // 디버깅용 로그 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      console.log('canCancel check:', {
        id: invoice.id,
        mgt_key: invoice.mgt_key,
        status: invoice.status,
        hasMgtKey,
        isWaitingStatus,
        canCancel: hasMgtKey && isWaitingStatus
      })
    }

    // mgt_key가 있고 "대기" 또는 "CREATED" 상태면 취소 가능
    // mgt_key가 없으면 바로빌로 발행하지 않은 것이므로 취소 불가
    return !!(hasMgtKey && isWaitingStatus)
  }

  return (
    <div className="px-4 py-4 pt-20">
      <h1 className="text-xl font-bold mb-4 dark:text-gray-100">발행내역</h1>

      {/* 안내 문구 */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          홈택스 전송은 익일 처리되며, 발행 상태는 자동으로 갱신됩니다.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-12">
          <p>로딩 중...</p>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 dark:text-red-400 py-12">
          <p>{error}</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-12">
          <p>발행된 세금계산서가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map((invoice) => (
            <Card key={invoice.id} className="dark:bg-gray-800">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {invoice.customer_name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {formatDate(invoice.created_at)}
                  </p>
                  {invoice.memo && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {invoice.memo}
                    </p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatAmount(invoice.amount)}원
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {invoice.tax_type}
                  </p>
                  <div className="mt-1">
                    <p className={`text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      상태: {getStatusDisplay(invoice.status)}
                    </p>
                    {canCancel(invoice) && (
                      <>
                        <button
                          onClick={() => handleCancel(invoice)}
                          disabled={cancellingIds.has(invoice.id)}
                          className="mt-2 text-sm text-red-600 dark:text-red-400 underline hover:text-red-700 dark:hover:text-red-300 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:no-underline"
                        >
                          {cancellingIds.has(invoice.id) ? '취소 중...' : '발행 취소하기'}
                        </button>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-left">
                          발행을 취소하면 다시 작성할 수 있습니다.
                        </p>
                      </>
                    )}
                    {canDelete(invoice) && (
                      <>
                        <button
                          onClick={() => handleDelete(invoice)}
                          disabled={deletingIds.has(invoice.id)}
                          className="mt-2 text-sm text-red-600 dark:text-red-400 underline hover:text-red-700 dark:hover:text-red-300 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:no-underline"
                        >
                          {deletingIds.has(invoice.id) ? '삭제 중...' : '삭제하기'}
                        </button>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-left">
                          바로빌로 발행하지 않은 세금계산서는 삭제할 수 있습니다.
                        </p>
                      </>
                    )}
                    {!canCancel(invoice) && !canDelete(invoice) && (invoice.status === '대기' || invoice.status === 'CREATED') && invoice.mgt_key && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-left">
                        바로빌로 발행한 세금계산서는 취소 기능을 사용해주세요.
                      </p>
                    )}
                    {invoice.status === '완료' && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-left">
                        발행이 완료된 계산서는 수정할 수 없습니다.<br />
                        수정세금계산서 발급은 홈택스에서 신청해야 합니다.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

