import React, { useState, useEffect } from 'react'
import { useInvoiceStore } from '../store/invoiceStore'
import { ItemInput } from '../components/invoice/ItemInput'
import { SummaryBox } from '../components/invoice/SummaryBox'
import { PreviewModal } from '../components/invoice/PreviewModal'
import { CustomerSelectModal } from '../components/invoice/CustomerSelectModal'
import { CompanySelectModal } from '../components/modals/CompanySelectModal'
import { CertificateRegistrationGuideModal } from '../components/modals/CertificateRegistrationGuideModal'
import { CertificateRegistrationSuccessModal } from '../components/modals/CertificateRegistrationSuccessModal'
import { CertificateRegistrationModal } from '../components/modals/CertificateRegistrationModal'
import { useQuickInvoice } from '../hooks/invoice/useQuickInvoice'
import { useBarobillInvoice } from '../hooks/invoice/useBarobillInvoice'
import { useInvoiceValidation } from '../hooks/invoice/useInvoiceValidation'
import { checkCertificate } from '../api/barobillApi'
import { formatError } from '../utils/errorHelpers'

export const InvoiceQuick: React.FC = () => {
  const {
    paymentType,
    paymentMethod,
    issueDate,
    setPaymentType,
    setPaymentMethod,
    setIssueDate,
  } = useInvoiceStore()

  const {
    buyer,
    items,
    updateItem,
    expandedItemId,
    setExpandedItemId,
    currentCompany,
    isAuthenticated,
    isCustomerModalOpen,
    setCustomerModalOpen,
    isCompanyModalOpen,
    setCompanyModalOpen,
    handleAddItem,
    handleRemoveItem,
    handleSelectCustomer,
    handleSelectCompany,
  } = useQuickInvoice()

  const { handleIssue, isIssuing } = useBarobillInvoice()
  const { isFormValid } = useInvoiceValidation()

  const [showOptionSheet, setShowOptionSheet] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [showCustomerRing, setShowCustomerRing] = useState(true)

  // 인증서 등록 플로우 상태
  const [showGuideModal, setShowGuideModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showCertificateRegistrationModal, setShowCertificateRegistrationModal] = useState(false)
  const [certificateRegistUrl, setCertificateRegistUrl] = useState<string | null>(null)
  const [isCheckingCertificate, setIsCheckingCertificate] = useState(false)

  // 첫 번째 품목이 있으면 자동으로 펼치기
  useEffect(() => {
    if (items.length > 0 && !expandedItemId) {
      setExpandedItemId(items[0].id)
    }
  }, [items, expandedItemId, setExpandedItemId])

  // 최초 화면 진입 시 거래처 버튼에 1회만 ring 효과
  useEffect(() => {
    if (showCustomerRing) {
      const timer = setTimeout(() => {
        setShowCustomerRing(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [showCustomerRing])

  // 옵션 변경을 위한 로컬 상태
  const [localIssueDate, setLocalIssueDate] = useState(issueDate)
  const [localPaymentType, setLocalPaymentType] = useState<'receipt' | 'invoice'>(paymentType)
  const [localPaymentMethod, setLocalPaymentMethod] = useState<'cash' | 'credit' | 'check' | 'bill'>(paymentMethod)

  // 인증서 체크 및 발행 처리
  const handleIssueWithPreview = async () => {
    // 기본 검증
    if (!isFormValid()) {
      return
    }

    // 로그인 체크
    if (!isAuthenticated) {
      const shouldLogin = confirm('세금계산서를 발행하려면 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')
      if (shouldLogin) {
        // 로그인 페이지로 이동 (현재 위치 저장)
        window.location.href = '/login'
      }
      return
    }

    // 우리회사 정보 체크
    if (!currentCompany) {
      alert('우리회사 정보를 먼저 등록해주세요.')
      setCompanyModalOpen(true)
      return
    }

    // 인증서 체크
    setIsCheckingCertificate(true)
    try {
      const certCheckResult = await checkCertificate()

      if (!certCheckResult.is_valid) {
        // 인증서 미등록 - 안내 모달 표시
        setCertificateRegistUrl(certCheckResult.regist_url || null)
        setIsCheckingCertificate(false)
        // 모달 표시를 약간 지연시켜 상태 업데이트가 완료되도록 함
        setTimeout(() => {
          setShowGuideModal(true)
        }, 100)
        return
      }

      // 인증서 등록됨 - 발행 진행
      setIsCheckingCertificate(false)
      await proceedWithIssue()
    } catch (error: any) {
      // 에러 발생 시 항상 상태 리셋
      setIsCheckingCertificate(false)
      const errorMessage = formatError(error) || '인증서 확인 중 오류가 발생했습니다.'

      // 인증서 관련 에러인 경우 안내 모달 표시
      if (
        errorMessage.includes('인증서') ||
        errorMessage.includes('인증키') ||
        errorMessage.includes('cert')
      ) {
        // 모달 표시를 약간 지연시켜 상태 업데이트가 완료되도록 함
        setTimeout(() => {
          setShowGuideModal(true)
        }, 100)
      } else {
        alert(`오류: ${errorMessage}`)
      }
    }
  }


  // 인증서 등록 시작 버튼 클릭 시
  const handleStartCertificateRegistration = () => {
    setShowGuideModal(false)
    
    // 인증서 등록 페이지로 이동 (새 창)
    // 사용자가 명시적으로 버튼을 클릭했을 때만 실행되므로 팝업 차단 없음
    const registrationUrl = 'https://www.barobill.co.kr/join/login.asp?AURL=%2Fcert%2Fc%5Fcert%2Easp%3F'
    window.open(
      registrationUrl,
      '_blank',
      'width=1200,height=800'
    )

    // 인증서 등록 완료 확인 버튼이 있는 모달 표시
    setTimeout(() => {
      setShowCertificateRegistrationModal(true)
    }, 200)
  }

  // 인증서 등록 완료 확인
  const handleCheckCertificateComplete = async () => {
    try {
      setIsCheckingCertificate(true)
      const certCheckResult = await checkCertificate()
      setIsCheckingCertificate(false)

      if (certCheckResult.is_valid) {
        setShowCertificateRegistrationModal(false)
        // 모달 전환 시 약간의 지연을 두어 상태 업데이트가 완료되도록 함
        setTimeout(() => {
          setShowSuccessModal(true)
        }, 150)
      } else {
        alert('인증서가 아직 등록되지 않았습니다.\n인증서 등록을 완료한 후 다시 시도해주세요.')
      }
    } catch (error) {
      setIsCheckingCertificate(false)
      alert('인증서 확인 중 문제가 발생했습니다.\n잠시 후 다시 시도해주세요.')
    }
  }


  // 인증서 등록 완료 후 발행 계속
  const handleSuccessContinue = async () => {
    setShowSuccessModal(false)
    // 모달이 완전히 닫힌 후 발행 진행
    setTimeout(async () => {
      await proceedWithIssue()
    }, 150)
  }

  // 실제 발행 진행
  const proceedWithIssue = async () => {
    try {
      const result = await handleIssue()
      if (result?.success) {
        setIsPreviewOpen(false)
        alert(result.message || '세금계산서가 발행되었습니다!')
      } else if (result?.error) {
        // 인증서 관련 에러인 경우
        if (
          result.error.includes('인증서') ||
          result.error.includes('인증키') ||
          result.error.includes('cert')
        ) {
          // 인증서 등록 플로우로 다시 진입
          setIsCheckingCertificate(true)
          try {
            const certCheckResult = await checkCertificate()
            if (!certCheckResult.is_valid) {
              setCertificateRegistUrl(certCheckResult.regist_url || null)
              setIsCheckingCertificate(false)
              // 모달 표시를 약간 지연시켜 상태 업데이트가 완료되도록 함
              setTimeout(() => {
                setShowGuideModal(true)
              }, 100)
            } else {
              setIsCheckingCertificate(false)
              // 인증서는 있는데 발행 실패한 경우
              alert('인증서 확인 중 문제가 발생했습니다.\n잠시 후 다시 시도해주세요.')
            }
          } catch (error) {
            setIsCheckingCertificate(false)
            alert('인증서 확인 중 문제가 발생했습니다.\n잠시 후 다시 시도해주세요.')
          }
        } else {
          // 일반 에러
          alert(`발행 실패: ${result.error}`)
        }
      }
    } catch (error: any) {
      const errorMessage = formatError(error) || '세금계산서 발행 중 오류가 발생했습니다.'
      alert(`발행 실패: ${errorMessage}`)
    }
  }

  const handlePreview = () => {
    setIsPreviewOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-[480px] mx-auto px-4 space-y-4 py-4 pt-20 pb-32">
        {/* 우리회사/거래처 선택 버튼 - 비회원도 볼 수 있음 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* 우리회사 버튼 */}
          <button
            onClick={() => setCompanyModalOpen(true)}
            className="h-12 px-4 rounded-lg font-medium flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-default"
          >
            <span aria-hidden="true">🔒</span>
            <span>우리회사</span>
            {currentCompany && (
              <span className="text-xs truncate max-w-[100px]">
                {currentCompany.name}
              </span>
            )}
          </button>

          {/* 거래처 버튼 */}
          <button
            onClick={() => setCustomerModalOpen(true)}
            className={`h-12 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 relative ${buyer
              ? 'bg-blue-500 dark:bg-blue-600 text-white shadow-md hover:shadow-lg'
              : `bg-blue-500 dark:bg-blue-600 text-white shadow-md hover:shadow-lg ${showCustomerRing ? 'ring-2 ring-blue-300 dark:ring-blue-400' : ''}`
              }`}
          >
            {!buyer && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
            {buyer && (
              <span className="absolute top-1 right-1 text-white text-sm font-bold" aria-hidden="true">✓</span>
            )}
            <span>거래처</span>
            {buyer && (
              <span className="text-xs truncate max-w-[100px] text-white">
                {buyer.name}
              </span>
            )}
          </button>
        </div>

        {currentCompany && isAuthenticated && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
            현재 발행 사업자: {currentCompany.name} ({currentCompany.businessNumber})
          </p>
        )}

        {/* 품목 입력 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">품목</h2>

          {items.map((item, index) => (
            <ItemInput
              key={item.id}
              item={item}
              index={index}
              isExpanded={expandedItemId === item.id}
              onToggle={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
              onUpdate={(updates) => updateItem(item.id, updates)}
              onRemove={() => handleRemoveItem(item.id)}
              canRemove={items.length > 1}
            />
          ))}

          {/* 품목 추가 버튼 */}
          <div className="flex justify-center mt-3">
            <button
              onClick={handleAddItem}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700/40 text-gray-700 dark:text-gray-200 text-sm flex items-center gap-2 hover:bg-gray-300 dark:hover:bg-gray-700/60 active:scale-95 transition-all"
            >
              <span className="text-lg">+</span> 품목 추가
            </button>
          </div>
        </div>

        {/* 3. 합계 영역 */}
        <div className="space-y-3">
          <SummaryBox />
        </div>

        {/* 옵션 요약 라벨 */}
        <div
          className="mt-4 text-center text-base font-medium text-gray-700 dark:text-gray-300 cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          onClick={() => {
            setLocalIssueDate(issueDate)
            setLocalPaymentType(paymentType)
            setLocalPaymentMethod(paymentMethod)
            setShowOptionSheet(true)
          }}
        >
          옵션: {issueDate} · {paymentType === 'receipt' ? '영수' : '청구'} · {
            paymentMethod === 'cash' ? '현금' :
              paymentMethod === 'credit' ? '외상미수금' :
                paymentMethod === 'check' ? '수표' : '어음'
          }
        </div>

        {/* 미리보기 버튼 */}
        <div className="mt-3 flex justify-center">
          <button
            onClick={handlePreview}
            disabled={!isFormValid()}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${isFormValid()
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
          >
            미리보기
          </button>
        </div>

      </div>

      {/* 발행 버튼 - 하단 고정 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40">
        <div className="max-w-[480px] mx-auto px-4 py-4">
          <button
            onClick={handleIssueWithPreview}
            disabled={!isFormValid() || isIssuing || isCheckingCertificate}
            className={`w-full h-14 rounded-xl font-semibold text-lg transition-colors ${isFormValid() && !isIssuing && !isCheckingCertificate
              ? 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
          >
            {isCheckingCertificate ? '보안 확인 중...' : isIssuing ? '발행 중...' : '바로 발행'}
          </button>
        </div>
      </div>

      {/* 옵션 변경 bottom sheet 모달 */}
      {showOptionSheet && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setShowOptionSheet(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl p-6 shadow-xl z-50 max-w-[480px] mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">옵션 변경</h2>

            {/* 날짜 선택 */}
            <div className="mb-4">
              <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">날짜</label>
              <input
                type="date"
                className="w-full mt-1 h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={localIssueDate}
                onChange={(e) => {
                  const selectedDate = e.target.value
                  const today = new Date().toISOString().split('T')[0]
                  setLocalIssueDate(selectedDate <= today ? selectedDate : today)
                }}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* 영수 / 청구 선택 */}
            <div className="mb-4">
              <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">종류</label>
              <div className="flex gap-3 mt-1">
                <button
                  className={`flex-1 h-12 rounded-lg border-2 transition-colors font-medium ${localPaymentType === 'receipt'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  onClick={() => setLocalPaymentType('receipt')}
                >
                  영수
                </button>
                <button
                  className={`flex-1 h-12 rounded-lg border-2 transition-colors font-medium ${localPaymentType === 'invoice'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  onClick={() => setLocalPaymentType('invoice')}
                >
                  청구
                </button>
              </div>
            </div>

            {/* 결제수단 */}
            <div className="mb-4">
              <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">결제수단</label>
              <select
                className="mt-1 w-full h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={localPaymentMethod}
                onChange={(e) => setLocalPaymentMethod(e.target.value as 'cash' | 'credit' | 'check' | 'bill')}
              >
                <option value="cash">현금</option>
                <option value="credit">외상미수금</option>
                <option value="check">수표</option>
                <option value="bill">어음</option>
              </select>
            </div>

            <button
              className="w-full mt-4 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              onClick={() => {
                setIssueDate(localIssueDate)
                setPaymentType(localPaymentType)
                setPaymentMethod(localPaymentMethod)
                setShowOptionSheet(false)
              }}
            >
              적용하기
            </button>
          </div>
        </div>
      )}

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onIssue={handleIssueWithPreview}
      />

      {/* 거래처 선택 모달 */}
      <CustomerSelectModal
        isOpen={isCustomerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSelect={handleSelectCustomer}
      />

      {/* 우리회사 선택 모달 */}
      <CompanySelectModal
        isOpen={isCompanyModalOpen}
        onClose={() => setCompanyModalOpen(false)}
        onSelect={handleSelectCompany}
      />

      {/* 인증서 등록 안내 모달 */}
      <CertificateRegistrationGuideModal
        isOpen={showGuideModal}
        onCancel={() => setShowGuideModal(false)}
        onStartRegistration={handleStartCertificateRegistration}
        showStartButton={true}
      />

      {/* 인증서 등록 진행 중 모달 */}
      <CertificateRegistrationModal
        isOpen={showCertificateRegistrationModal}
        onComplete={handleCheckCertificateComplete}
        onCancel={() => setShowCertificateRegistrationModal(false)}
        isChecking={isCheckingCertificate}
      />

      {/* 인증서 등록 완료 모달 */}
      <CertificateRegistrationSuccessModal
        isOpen={showSuccessModal}
        onContinue={handleSuccessContinue}
      />
    </div>
  )
}

