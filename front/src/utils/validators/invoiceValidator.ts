/**
 * 세금계산서 발행 데이터 검증 유틸리티
 */
import { Item } from '../../store/invoiceStore'

export interface ValidationResult {
  isValid: boolean
  message?: string
}

/**
 * 거래처 검증
 */
export const validateBuyer = (buyer: any): ValidationResult => {
  if (!buyer || !buyer.name) {
    return {
      isValid: false,
      message: '거래처를 선택해주세요.',
    }
  }
  if (!buyer.businessNumber) {
    return {
      isValid: false,
      message: '거래처 사업자번호가 없습니다.',
    }
  }
  return { isValid: true }
}

/**
 * 품목 검증
 */
export const validateItems = (items: Item[]): ValidationResult => {
  if (items.length === 0) {
    return {
      isValid: false,
      message: '품목을 입력해주세요.',
    }
  }

  const hasValidItem = items.some(
    (item) => item.name && item.supplyValue > 0 && item.quantity && item.unitPrice
  )

  if (!hasValidItem) {
    return {
      isValid: false,
      message: '품목 정보를 올바르게 입력해주세요.',
    }
  }

  return { isValid: true }
}

/**
 * 회사 정보 검증
 */
export const validateCompany = (company: any): ValidationResult => {
  if (!company) {
    return {
      isValid: false,
      message: '우리회사 정보가 등록되지 않았습니다.',
    }
  }

  if (!company.businessNumber) {
    return {
      isValid: false,
      message: '우리회사 사업자번호가 없습니다.',
    }
  }

  return { isValid: true }
}

/**
 * 전체 폼 검증
 */
export const validateInvoiceForm = (
  buyer: any,
  items: Item[],
  company: any
): ValidationResult => {
  const buyerValidation = validateBuyer(buyer)
  if (!buyerValidation.isValid) {
    return buyerValidation
  }

  const itemsValidation = validateItems(items)
  if (!itemsValidation.isValid) {
    return itemsValidation
  }

  const companyValidation = validateCompany(company)
  if (!companyValidation.isValid) {
    return companyValidation
  }

  return { isValid: true }
}

