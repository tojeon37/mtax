/**
 * 회사 정보 검증 유틸리티
 */
import { CompanyFormData } from '../../hooks/company/useCompanyForm'

export interface ValidationResult {
  isValid: boolean
  message?: string
}

/**
 * 회사 정보 폼 검증
 */
export const validateCompanyForm = (form: CompanyFormData): ValidationResult => {
  // 필수 필드 확인
  if (!form.businessNumber || !form.name || !form.ceoName || !form.address) {
    return {
      isValid: false,
      message: '사업자번호, 회사명, 대표자명, 주소는 필수 입력 항목입니다.',
    }
  }

  // 백엔드 필수 필드 확인
  if (!form.bizType || !form.bizClass || !form.email || !form.hp) {
    return {
      isValid: false,
      message: '업태, 종목, 이메일, 휴대폰번호는 필수 입력 항목입니다.',
    }
  }

  // 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(form.email)) {
    return {
      isValid: false,
      message: '올바른 이메일 형식을 입력해주세요.',
    }
  }

  // 사업자번호 형식 검증 (하이픈 포함 13자리 또는 숫자만 10자리)
  const bizNumberClean = form.businessNumber.replace(/-/g, '')
  if (bizNumberClean.length !== 10) {
    return {
      isValid: false,
      message: '사업자번호는 10자리 숫자여야 합니다.',
    }
  }

  return { isValid: true }
}

