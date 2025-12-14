/**
 * 세금계산서 발행 검증 로직 Hook
 */
import { useCompanyStore } from '../../store/useCompanyStore'
import { useInvoiceStore } from '../../store/invoiceStore'
import { checkCertificate } from '../../api/barobillApi'

export const useInvoiceValidation = () => {
  const { currentCompany } = useCompanyStore()
  const { buyer, items } = useInvoiceStore()

  // 폼 유효성 검사
  const isFormValid = () => {
    return (
      !!buyer &&
      items.length > 0 &&
      items.every(
        (item) => item.name && item.supplyValue > 0 && item.quantity && item.unitPrice
      )
    )
  }

  // 거래처 검증
  const validateBuyer = () => {
    if (!buyer || !buyer.name) {
      return {
        isValid: false,
        message: '거래처를 선택해주세요.',
      }
    }
    return { isValid: true }
  }

  // 품목 검증
  const validateItems = () => {
    if (items.length === 0 || !items.some(item => item.name && item.supplyValue > 0)) {
      return {
        isValid: false,
        message: '품목을 입력해주세요.',
      }
    }
    return { isValid: true }
  }

  // 회사 정보 및 인증서 검증
  const validateCompanyAndCertificate = async () => {
    const hasCompany = !!currentCompany
    let hasCertificate = false

    try {
      const certCheckResult = await checkCertificate()
      hasCertificate = certCheckResult.is_valid || false
    } catch (certError: any) {
      hasCertificate = false
    }

    if (!hasCompany || !hasCertificate) {
      return {
        isValid: false,
        hasCompany,
        hasCertificate,
        message: '"우리회사 정보"와 "공동인증서"가 아직 등록되지 않아\n\n전자세금계산서를 발행할 수 없습니다.\n\n등록 페이지로 이동하시겠습니까?',
      }
    }

    return {
      isValid: true,
      hasCompany,
      hasCertificate,
    }
  }

  return {
    isFormValid,
    validateBuyer,
    validateItems,
    validateCompanyAndCertificate,
  }
}

