import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInvoiceStore } from '../../store/invoiceStore'
import { useCompanyStore } from '../../store/useCompanyStore'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { checkCorpState, getCorpStateHistory } from '../../api/barobillApi'
import { useAuth } from '../../hooks/useAuth'

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
  onIssue: () => void
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  onIssue,
}) => {
  const {
    buyer,
    items,
    supplyValue,
    taxAmount,
    totalAmount,
    paymentType,
    paymentMethod,
    issueDate,
  } = useInvoiceStore()

  const { currentCompany } = useCompanyStore()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  
  const [isCheckingState, setIsCheckingState] = useState(false)
  const [corpStateResult, setCorpStateResult] = useState<{
    state_name: string;
    state_description: string;
  } | null>(null)
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null)
  const [isFreeMode, setIsFreeMode] = useState(true)
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false)

  // 모달이 열릴 때 최근 조회 이력 확인 및 사용자 정보 로드
  useEffect(() => {
    if (isOpen && buyer?.businessNumber && isAuthenticated) {
      loadCorpStateHistory()
    }
    if (isOpen) {
      loadUserInfo()
    }
  }, [isOpen, buyer?.businessNumber, isAuthenticated])

  const loadUserInfo = async () => {
    try {
      const { getUserInfo } = await import('../../api/authApi')
      const userInfo = await getUserInfo()
      setIsFreeMode(userInfo.is_free_mode !== undefined ? userInfo.is_free_mode : true)
      setHasPaymentMethod(userInfo.has_payment_method || false)
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error)
    }
  }

  const loadCorpStateHistory = async () => {
    if (!buyer?.businessNumber) return
    
    try {
      const history = await getCorpStateHistory(buyer.businessNumber)
      if (history.success && history.last_checked_at) {
        setLastCheckedAt(history.last_checked_at)
        if (history.state_name) {
          setCorpStateResult({
            state_name: history.state_name,
            state_description: getStateDescription(history.state || 0)
          })
        }
      }
    } catch (error) {
      // 이력 조회 실패는 무시 (로그인하지 않은 경우 등)
    }
  }

  const getStateDescription = (state: number): string => {
    const stateDescriptions: { [key: number]: string } = {
      0: "사업자등록이 되어있지 않은 상태입니다.",
      1: "정상적으로 사업을 운영 중인 상태입니다.",
      2: "일시적으로 사업을 중단한 상태입니다.",
      3: "사업을 종료한 상태입니다.",
      4: "간이과세자로 등록된 상태입니다.",
      5: "부가가치세 면세 사업자입니다.",
      6: "직권폐업 등 기타 상태입니다.",
      7: "사업자 상태를 조회할 수 없습니다.",
    }
    return stateDescriptions[state] || "상태를 확인할 수 없습니다."
  }

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}`
    } catch {
      return dateString
    }
  }

  if (!isOpen) return null
  
  const handleCheckCorpState = async () => {
    if (!buyer?.businessNumber) {
      alert('사업자번호가 없습니다.')
      return
    }
    
    // 무료 모드 종료 및 결제수단 미등록 확인
    if (!isFreeMode && !hasPaymentMethod) {
      alert('무료 제공 5건이 모두 소진되었습니다.\n계속 이용하시려면 결제수단을 등록해주세요.')
      navigate('/billing/payment-methods')
      return
    }
    
    // 확인 다이얼로그
    const confirmed = window.confirm('사업자 상태 조회 시 15원이 차감됩니다. 계속하시겠습니까?')
    if (!confirmed) return
    
    setIsCheckingState(true)
    setCorpStateResult(null)
    
    try {
      const result = await checkCorpState(buyer.businessNumber)
      if (result.success) {
        const stateName = result.state_name || result.data?.state_name || '조회 완료'
        const stateDescription = result.state_description || getStateDescription(result.data?.state || 0)
        
        setCorpStateResult({
          state_name: stateName,
          state_description: stateDescription
        })
        
        // 최근 조회 날짜 업데이트
        if (isAuthenticated) {
          await loadCorpStateHistory()
        }
        
        // 사용자 정보 재로드 (무료 건수 업데이트)
        await loadUserInfo()
        
        alert(`사업자 상태: ${stateName}\n${stateDescription}\n\n15원이 차감되었습니다.`)
      } else {
        throw new Error(result.message || '조회 실패')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || '사업자 상태 조회 중 오류가 발생했습니다.'
      alert(`오류: ${errorMessage}`)
      setCorpStateResult(null)
    } finally {
      setIsCheckingState(false)
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(num))
  }

  // 필드 렌더링 헬퍼 함수
  const renderField = (label: string, value: string | null | undefined) => {
    if (!value) return null
    return (
      <div className="mb-3">
        <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
        <div className="text-base font-medium text-gray-900 dark:text-gray-100 mt-1">{value}</div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-[480px] w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">발행 전 확인</h2>

          {/* 공급자 (우리회사) */}
          {currentCompany && (
            <Card className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">공급자</h2>
              {renderField('상호', currentCompany.name)}
              {renderField('사업자번호', currentCompany.businessNumber)}
              {renderField('대표자', currentCompany.ceoName)}
              {renderField('주소', currentCompany.address)}
              {renderField('이메일', currentCompany.email)}
            </Card>
          )}

          {/* 공급받는자 (거래처) */}
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">공급받는자</h2>
            {renderField('상호', buyer?.name || '미선택')}
            {buyer?.businessNumber && (
              <div className="mb-3">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">사업자번호</div>
                <div className="flex items-center gap-2">
                  <div className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {buyer.businessNumber}
                  </div>
                  <button
                    onClick={handleCheckCorpState}
                    disabled={isCheckingState || (!isFreeMode && !hasPaymentMethod)}
                    className="px-3 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
                  >
                    {isCheckingState ? '조회 중...' : '상태조회'}
                  </button>
                </div>
                {(!isFreeMode && !hasPaymentMethod) && (
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                    무료건수가 소진되었습니다. 조회를 위해 결제수단을 등록해주세요.
                  </div>
                )}
                {isFreeMode && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    조회 시 15원이 차감됩니다
                  </div>
                )}
                {corpStateResult && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                      상태: {corpStateResult.state_name}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      {corpStateResult.state_description}
                    </div>
                  </div>
                )}
                {lastCheckedAt && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    최근 조회: {formatDate(lastCheckedAt)}
                  </div>
                )}
              </div>
            )}
            {renderField('대표자', buyer?.ceoName)}
            {renderField('주소', buyer?.address)}
            {renderField('이메일', buyer?.email)}
          </Card>

          {/* 작성정보 */}
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">작성정보</h2>
            {renderField('작성일자', issueDate)}
            {renderField(
              '결제구분',
              paymentType === 'receipt' ? '영수' : '청구'
            )}
            {renderField(
              '결제수단',
              paymentMethod === 'cash' ? '현금' :
              paymentMethod === 'credit' ? '외상미수금' :
              paymentMethod === 'check' ? '수표' :
              paymentMethod === 'bill' ? '어음' : null
            )}
          </Card>

          {/* 품목 */}
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">품목</h2>
            <div className="space-y-0">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex justify-between items-center py-2 ${
                    index < items.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''
                  }`}
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {item.name || '품목명 없음'}
                  </span>
                  <span className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {formatNumber(item.supplyValue)}원
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* 합계 */}
          <Card className="mb-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">공급가액</span>
                <span className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {formatNumber(supplyValue)}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">부가세</span>
                <span className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {formatNumber(taxAmount)}원
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-base font-bold text-gray-900 dark:text-gray-100">총합계</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {formatNumber(totalAmount)}원
                </span>
              </div>
            </div>
          </Card>

          {/* 버튼 */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              취소
            </Button>
            <Button variant="primary" onClick={onIssue} className="flex-1" disabled={!currentCompany}>
              발행하기
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

