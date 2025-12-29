/**
 * 세금계산서 발행 로직 Hook
 */
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { formatError } from '../../utils/errorHelpers'
import { useInvoiceStore } from '../../store/invoiceStore'
import { useAuth } from '../useAuth'
import { createInvoice } from '../../api/invoiceApi'
import { useInvoiceValidation } from './useInvoiceValidation'
import { useCompanyStore } from '../../store/useCompanyStore'

export const useInvoiceIssue = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const { buyer, items, supplyValue, paymentType, paymentMethod, resetInvoice, setExpandedItemId } = useInvoiceStore()
  const { validateBuyer, validateItems } = useInvoiceValidation()
  const [isIssuing, setIsIssuing] = useState(false)

  const handleIssue = async () => {
    // 로그인 체크
    if (!isAuthenticated) {
      const shouldLogin = confirm('세금계산서를 발행하려면 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')
      if (shouldLogin) {
        navigate('/login', { state: { from: location } })
      }
      return
    }

    // 거래처 검증
    const buyerValidation = validateBuyer()
    if (!buyerValidation.isValid) {
      alert(buyerValidation.message)
      return
    }

    // 품목 검증
    const itemsValidation = validateItems()
    if (!itemsValidation.isValid) {
      alert(itemsValidation.message)
      return
    }

    // 회사 정보 검증 (인증서는 발행 시점에 체크)
    const { currentCompany } = useCompanyStore.getState()
    if (!currentCompany) {
      const shouldGoToRegister = confirm('우리회사 정보가 등록되지 않았습니다.\n회사 등록 페이지로 이동하시겠습니까?')
      if (shouldGoToRegister) {
        navigate('/company/new')
      }
      return
    }

    setIsIssuing(true)

    try {
      // 세금계산서 발행 데이터 준비
      const invoiceData = {
        customer_name: buyer!.name,
        amount: supplyValue || items.reduce((sum, item) => sum + (item.supplyValue || 0), 0),
        tax_type: paymentType === 'receipt' ? '영수' : '청구',
        paymentMethod,
        memo: `품목: ${items.map(item => item.name).join(', ')}`,
      }

      // 백엔드 API 호출
      await createInvoice(invoiceData)

      alert('세금계산서가 발행되었습니다!')
      resetInvoice()
      setExpandedItemId(null)

      return { success: true }
    } catch (error: any) {
      const errorMessage = formatError(error) || '세금계산서 발행에 실패했습니다.'
      alert(`발행 실패: ${errorMessage}`)
      return { success: false, error: errorMessage }
    } finally {
      setIsIssuing(false)
    }
  }

  return {
    handleIssue,
    isIssuing,
  }
}

