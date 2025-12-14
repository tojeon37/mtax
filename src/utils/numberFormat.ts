/**
 * 숫자 포맷팅 유틸리티 함수
 */

/**
 * 숫자에 천단위 콤마 추가
 */
export const formatNumber = (value: string | number): string => {
  if (!value && value !== 0) return ''
  
  const numStr = String(value).replace(/,/g, '')
  
  if (numStr === '' || numStr === '-') return numStr
  
  if (isNaN(Number(numStr)) && numStr !== '') return value as string
  
  const parts = numStr.split('.')
  const integerPart = parts[0]
  const decimalPart = parts[1]
  
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  
  return decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger
}

/**
 * 천단위 콤마 제거
 */
export const removeCommas = (value: string): string => {
  return value.replace(/,/g, '')
}

/**
 * 입력값을 숫자 형식으로 검증하고 포맷팅 (소수점 허용)
 */
export const formatNumberInput = (value: string): string => {
  let cleaned = removeCommas(value)
  
  const parts = cleaned.split('.')
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('')
  }
  
  cleaned = cleaned.replace(/[^0-9.-]/g, '')
  
  if (cleaned.includes('-')) {
    const minusIndex = cleaned.indexOf('-')
    if (minusIndex !== 0) {
      cleaned = cleaned.replace(/-/g, '')
    } else if (cleaned.split('-').length > 2) {
      cleaned = '-' + cleaned.replace(/-/g, '')
    }
  }
  
  return cleaned
}

/**
 * 자연수만 입력받도록 검증하고 포맷팅 (소수점 불허)
 */
export const formatIntegerInput = (value: string): string => {
  let cleaned = removeCommas(value)
  
  cleaned = cleaned.replace(/[^0-9-]/g, '')
  
  if (cleaned.includes('-')) {
    const minusIndex = cleaned.indexOf('-')
    if (minusIndex !== 0) {
      cleaned = cleaned.replace(/-/g, '')
    } else if (cleaned.split('-').length > 2) {
      cleaned = '-' + cleaned.replace(/-/g, '')
    }
  }
  
  return cleaned
}






