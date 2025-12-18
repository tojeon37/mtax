/**
 * 바로빌 세금계산서 발행 로직 Hook
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatError } from '../../utils/errorHelpers'
import { useInvoiceStore } from '../../store/invoiceStore'
import { useCompanyStore } from '../../store/useCompanyStore'
import { issueBarobillInvoice, BarobillInvoiceData } from '../../api/invoiceBarobillApi'
import { getUserInfo } from '../../api/authApi'

export const useBarobillInvoice = () => {
  const navigate = useNavigate()
  const {
    buyer,
    items,
    paymentType,
    paymentMethod,
    issueDate,
    supplyValue,
    taxAmount,
    totalAmount,
    resetInvoice,
  } = useInvoiceStore()
  const { currentCompany } = useCompanyStore()

  const [isIssuing, setIsIssuing] = useState(false)
  const [freeInvoiceRemaining, setFreeInvoiceRemaining] = useState(5)
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false)
  const [isFreeMode, setIsFreeMode] = useState(true)

  // 사용자 정보 로드
  const loadUserInfo = async () => {
    try {
      const userInfo = await getUserInfo()
      setFreeInvoiceRemaining(userInfo.free_invoice_remaining || 5)
      setHasPaymentMethod(userInfo.has_payment_method || false)
      setIsFreeMode(userInfo.is_free_mode !== undefined ? userInfo.is_free_mode : true)
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error)
    }
  }

  // 바로빌 세금계산서 발행 데이터 준비
  const prepareBarobillData = (): BarobillInvoiceData => {
    if (!currentCompany) {
      throw new Error('회사 정보가 없습니다.')
    }
    if (!buyer || !buyer.businessNumber) {
      throw new Error('거래처 정보가 없습니다.')
    }

    const writeDate = issueDate.replace(/-/g, '')

    const paymentMapping: Record<string, { cash?: string; chkBill?: string; note?: string; credit?: string }> = {
      cash: { cash: String(Math.round(totalAmount)) },
      credit: { credit: String(Math.round(totalAmount)) },
      check: { chkBill: String(Math.round(totalAmount)) },
      bill: { note: String(Math.round(totalAmount)) },
    }

    const paymentData = paymentMapping[paymentMethod] || {}

    const lineItems = items.map((item) => ({
      Name: item.name || '',
      Information: item.specification || '',
      ChargeableUnit: item.quantity ? String(item.quantity) : '1',
      UnitPrice: item.unitPrice ? String(Math.round(item.unitPrice)) : String(Math.round(item.supplyValue)),
      Amount: String(Math.round(item.supplyValue)),
      Tax: String(Math.round(item.supplyValue * 0.1)),
      Description: item.note || '',
    }))

    return {
      IssueDirection: 1,
      TaxInvoiceType: 1,
      TaxType: 1,
      TaxCalcType: 1,
      PurposeType: paymentType === 'receipt' ? 2 : 1,
      WriteDate: writeDate,
      AmountTotal: String(Math.round(supplyValue)),
      TaxTotal: String(Math.round(taxAmount)),
      TotalAmount: String(Math.round(totalAmount)),
      ...paymentData,
      InvoicerParty: {
        CorpNum: currentCompany.businessNumber.replace(/-/g, ''),
        CorpName: currentCompany.name,
        CEOName: currentCompany.ceoName || '',
        Addr: currentCompany.address || '',
        BizType: currentCompany.bizType || '',
        BizClass: currentCompany.bizClass || '',
        Email: currentCompany.email || '',
        HP: currentCompany.hp || '',
        TEL: currentCompany.tel || '',
      },
      InvoiceeParty: {
        CorpNum: buyer.businessNumber.replace(/-/g, ''),
        CorpName: buyer.name,
        CEOName: buyer.ceoName || '',
        Addr: buyer.address || '',
        BizType: buyer.businessType || '',
        BizClass: buyer.businessItem || '',
        Email: buyer.email || '',
      },
      TaxInvoiceTradeLineItems: lineItems,
      IssueTiming: 1,
    }
  }

  // 바로빌 세금계산서 발행
  const handleIssue = async () => {
    if (!currentCompany) {
      throw new Error('우리회사 정보가 등록되지 않았습니다.')
    }

    if (!buyer || !buyer.businessNumber) {
      throw new Error('거래처 정보가 없습니다.')
    }

    // 무료 모드 종료 및 결제수단 미등록 확인
    if (!isFreeMode && !hasPaymentMethod) {
      throw new Error('무료 제공 5건이 모두 소진되었습니다.\n계속 이용하시려면 결제수단을 등록해주세요.')
    }

    if (freeInvoiceRemaining === 0 && !hasPaymentMethod) {
      throw new Error('무료건수가 소진되었습니다. 발행을 위해 결제수단을 등록해주세요.')
    }

    setIsIssuing(true)

    try {
      const barobillData = prepareBarobillData()
      const response = await issueBarobillInvoice(barobillData)

      if (response.success) {
        resetInvoice()
        await loadUserInfo()

        const updatedUserInfo = await getUserInfo()
        if (!updatedUserInfo.is_free_mode && !updatedUserInfo.has_payment_method) {
          return {
            success: true,
            message: '세금계산서가 발행되었습니다!',
            showPaymentAlert: true,
          }
        }

        return {
          success: true,
          message: '세금계산서가 발행되었습니다!',
        }
      } else {
        throw new Error(response.message || '발행 실패')
      }
    } catch (error: any) {
      const errorMessage = formatError(error) || '세금계산서 발행 중 오류가 발생했습니다.'

      // 인증서 관련 에러인 경우 특별 처리
      if (
        errorMessage.includes('바로빌 연동') ||
        errorMessage.includes('인증서') ||
        errorMessage.includes('인증키') ||
        errorMessage.includes('cert') ||
        error.response?.status === 400
      ) {
        return {
          success: false,
          error: errorMessage,
          shouldNavigateToCert: true,
        }
      }

      return {
        success: false,
        error: errorMessage,
      }
    } finally {
      setIsIssuing(false)
    }
  }

  return {
    handleIssue,
    isIssuing,
    freeInvoiceRemaining,
    hasPaymentMethod,
    isFreeMode,
    loadUserInfo,
    navigate,
  }
}

