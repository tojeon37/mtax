import React, { useState } from 'react'
import { useInvoiceStore } from '../store/invoiceStore'
import { ItemInput } from '../components/invoice/ItemInput'
import { SummaryBox } from '../components/invoice/SummaryBox'
import { PreviewModal } from '../components/invoice/PreviewModal'
import { CustomerSelectModal } from '../components/invoice/CustomerSelectModal'
import { CompanySelectModal } from '../components/modals/CompanySelectModal'
import { useQuickInvoice } from '../hooks/invoice/useQuickInvoice'
import { useInvoiceIssue } from '../hooks/invoice/useInvoiceIssue'
import { useInvoiceValidation } from '../hooks/invoice/useInvoiceValidation'

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

  const { handleIssue, isIssuing } = useInvoiceIssue()
  const { isFormValid } = useInvoiceValidation()

  const [showOptionSheet, setShowOptionSheet] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  
  // 옵션 변경을 위한 로컬 상태
  const [localIssueDate, setLocalIssueDate] = useState(issueDate)
  const [localPaymentType, setLocalPaymentType] = useState<'receipt' | 'invoice'>(paymentType)
  const [localPaymentMethod, setLocalPaymentMethod] = useState<'cash' | 'credit' | 'check' | 'bill'>(paymentMethod)

  const handleIssueWithPreview = async () => {
    const result = await handleIssue()
    if (result?.success) {
      setIsPreviewOpen(false)
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
          <button
            onClick={() => setCompanyModalOpen(true)}
            className={`h-12 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${currentCompany
                ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-300'
                : 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-500 dark:hover:border-blue-400'
              }`}
          >
            <span>우리회사</span>
            {currentCompany && (
              <span className="text-xs truncate max-w-[100px]">
                {currentCompany.name}
              </span>
            )}
          </button>
          <button
            onClick={() => setCustomerModalOpen(true)}
            className={`h-12 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${buyer
                ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-300'
                : 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-500 dark:hover:border-blue-400'
              }`}
          >
            <span>거래처</span>
            {buyer && (
              <span className="text-xs truncate max-w-[100px]">
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
          className="mt-4 text-center text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              isFormValid()
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
            disabled={!isFormValid() || isIssuing}
            className={`w-full h-14 rounded-xl font-semibold text-lg transition-colors ${isFormValid() && !isIssuing
                ? 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
          >
            {isIssuing ? '발행 중...' : '바로 발행'}
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
                  className={`flex-1 h-12 rounded-lg border-2 transition-colors font-medium ${
                    localPaymentType === 'receipt'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  onClick={() => setLocalPaymentType('receipt')}
                >
                  영수
                </button>
                <button 
                  className={`flex-1 h-12 rounded-lg border-2 transition-colors font-medium ${
                    localPaymentType === 'invoice'
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
    </div>
  )
}

