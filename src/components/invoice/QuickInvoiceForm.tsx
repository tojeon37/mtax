import React, { useState, useEffect } from 'react'
import { useInvoiceStore } from '../../store/invoiceStore'
import { useCompanyStore } from '../../store/useCompanyStore'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { ItemRow } from './ItemRow'
import { SummaryBar } from './SummaryBar'
import { PreviewModal } from './PreviewModal'
import { getClients } from '../../api/clientApi'
import { useBarobillInvoice } from '../../hooks/invoice/useBarobillInvoice'
import { validateInvoiceForm } from '../../utils/validators/invoiceValidator'

export const QuickInvoiceForm: React.FC = () => {
  const {
    buyer,
    items,
    paymentType,
    setBuyer,
    updateItem,
    removeItem,
    addItem,
    setPaymentType,
  } = useInvoiceStore()

  const { currentCompany } = useCompanyStore()
  const {
    handleIssue,
    isIssuing,
    freeInvoiceRemaining,
    freeStatuscheckRemaining,
    hasPaymentMethod,
    isFreeMode,
    loadUserInfo,
    navigate,
  } = useBarobillInvoice()

  const [buyerSearch, setBuyerSearch] = useState('')
  const [buyerSuggestions, setBuyerSuggestions] = useState<any[]>([])
  const [recentClients, setRecentClients] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    loadRecentClients()
    loadUserInfo()
  }, [])

  const loadRecentClients = async () => {
    try {
      const clients = await getClients()
      setRecentClients(clients.slice(0, 5))
    } catch (error) {
      console.error('거래처 로드 실패:', error)
    }
  }

  useEffect(() => {
    if (buyerSearch.length > 0) {
      searchClients(buyerSearch)
    } else {
      setBuyerSuggestions([])
    }
  }, [buyerSearch])

  const searchClients = async (query: string) => {
    try {
      const clients = await getClients()
      const filtered = clients.filter((client: any) =>
        client.companyName?.toLowerCase().includes(query.toLowerCase()) ||
        client.businessNumber?.replace(/-/g, '').includes(query.replace(/-/g, ''))
      )
      setBuyerSuggestions(filtered.slice(0, 10))
    } catch (error) {
      console.error('거래처 검색 실패:', error)
    }
  }

  const handleIssueWithValidation = async () => {
    // 폼 검증
    const validation = validateInvoiceForm(buyer, items, currentCompany)
    if (!validation.isValid) {
      alert(validation.message)
      return
    }

    // 무료 모드 종료 및 결제수단 미등록 확인
    if (!isFreeMode && !hasPaymentMethod) {
      alert('무료 제공 5건이 모두 소진되었습니다.\n계속 이용하시려면 결제수단을 등록해주세요.')
      navigate('/billing/payment-methods')
      return
    }

    if (freeInvoiceRemaining === 0 && !hasPaymentMethod) {
      alert('무료건수가 소진되었습니다. 발행을 위해 결제수단을 등록해주세요.')
      navigate('/billing/payment-methods')
      return
    }

    const result = await handleIssue()

    if (result.success) {
      alert(result.message || '세금계산서가 발행되었습니다!')
      setShowPreview(false)
      await loadRecentClients()
      await loadUserInfo()
      
      if (result.showPaymentAlert) {
        alert('무료 제공 5건이 모두 소진되었습니다.\n계속 이용하시려면 결제수단을 등록해주세요.')
      }
    } else {
      if (result.shouldNavigateToCert) {
        const shouldGoToCert = confirm(
          `${result.error}\n\n인증서 등록 페이지로 이동하시겠습니까?`
        )
        if (shouldGoToCert) {
          navigate('/certificate')
        }
      } else {
        alert(`발행 실패: ${result.error}`)
      }
    }
  }

  const isIssueDisabled = (!isFreeMode && !hasPaymentMethod) || (freeInvoiceRemaining === 0 && !hasPaymentMethod)

  return (
    <div className="max-w-[480px] mx-auto px-4 pb-24">
      {/* 무료 제공 건수 표시 (무료 모드일 때만 표시) */}
      {isFreeMode && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            남은 무료건수: 계산서 {freeInvoiceRemaining}건 / 조회 {freeStatuscheckRemaining}건
          </p>
        </div>
      )}
      
      <div className="space-y-4 py-4">
        {/* 거래처 선택 */}
        <div className="relative">
          <Input
            label="거래처"
            placeholder="거래처 검색 또는 선택"
            value={buyer?.name || buyerSearch}
            onChange={(e) => {
              setBuyerSearch(e.target.value)
              if (!e.target.value) {
                setBuyer(null)
              }
            }}
          />
          
          {/* 최근 거래처 추천 */}
          {!buyer && buyerSearch.length === 0 && recentClients.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-500">최근 거래처</p>
              {recentClients.slice(0, 3).map((client: any) => (
                <button
                  key={client.id}
                  onClick={() => {
                    setBuyer({
                      id: client.id.toString(),
                      name: client.companyName,
                      businessNumber: client.businessNumber,
                      ceoName: client.ceoName,
                      address: client.address,
                      email: client.email,
                      businessType: client.businessType,
                      businessItem: client.businessItem,
                    })
                    setBuyerSearch('')
                  }}
                  className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm"
                >
                  {client.companyName}
                </button>
              ))}
            </div>
          )}

          {/* 검색 결과 */}
          {buyerSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {buyerSuggestions.map((client: any) => (
                <button
                  key={client.id}
                  onClick={() => {
                    setBuyer({
                      id: client.id.toString(),
                      name: client.companyName,
                      businessNumber: client.businessNumber,
                      ceoName: client.ceoName,
                      address: client.address,
                      email: client.email,
                      businessType: client.businessType,
                      businessItem: client.businessItem,
                    })
                    setBuyerSearch('')
                    setBuyerSuggestions([])
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                >
                  {client.companyName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 결제구분 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            결제구분
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setPaymentType('receipt')}
              className={`flex-1 h-12 rounded-lg border-2 transition-colors ${
                paymentType === 'receipt'
                  ? 'border-blue-600 bg-blue-50 text-blue-600 font-semibold'
                  : 'border-gray-300 bg-white text-gray-700'
              }`}
            >
              영수
            </button>
            <button
              onClick={() => setPaymentType('invoice')}
              className={`flex-1 h-12 rounded-lg border-2 transition-colors ${
                paymentType === 'invoice'
                  ? 'border-blue-600 bg-blue-50 text-blue-600 font-semibold'
                  : 'border-gray-300 bg-white text-gray-700'
              }`}
            >
              청구
            </button>
          </div>
        </div>

        {/* 품목 목록 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            품목
          </label>
          <div className="space-y-4">
            {items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onUpdate={(updates) => {
                  updateItem(item.id, updates)
                }}
                onRemove={() => removeItem(item.id)}
                canRemove={items.length > 1}
              />
            ))}
          </div>
          <button
            onClick={addItem}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            + 품목 추가
          </button>
        </div>

        {/* 발행 버튼 */}
        <Button
          variant="primary"
          size="lg"
          onClick={() => setShowPreview(true)}
          className="w-full mt-6"
          disabled={!validateInvoiceForm(buyer, items, currentCompany).isValid || isIssuing || isIssueDisabled}
        >
          {isIssuing ? '발행 중...' : '바로 발행'}
        </Button>
      </div>

      <SummaryBar />
      <PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onIssue={handleIssueWithValidation}
      />
    </div>
  )
}

