export const formatBizNumber = (value: string) => {
  // 숫자만 추출하고 최대 10자리로 제한
  const digits = value.replace(/[^0-9]/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 5) return digits.replace(/(\d{3})(\d{1,2})/, "$1-$2")
  return digits.replace(/(\d{3})(\d{2})(\d{1,5})/, "$1-$2-$3")
}

/**
 * 전화번호 포맷팅 (일반전화)
 * 예: 0212345678 → 02-1234-5678
 *     0311234567 → 031-123-4567
 */
export const formatTel = (value: string) => {
  const digits = value.replace(/[^0-9]/g, '')
  
  if (digits.length === 0) return ''
  
  // 서울(02): 9-10자리
  if (digits.startsWith('02')) {
    if (digits.length <= 2) return digits
    if (digits.length <= 6) return digits.replace(/(\d{2})(\d{1,4})/, "$1-$2")
    return digits.replace(/(\d{2})(\d{3,4})(\d{4})/, "$1-$2-$3")
  }
  
  // 지역번호(031, 032, 041, 042, 043, 044, 051, 052, 053, 054, 055, 061, 062, 063, 064): 10-11자리
  if (digits.length >= 10 && digits.length <= 11) {
    if (digits.length === 10) {
      // 10자리: 031-123-4567 형식
      return digits.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")
    } else {
      // 11자리: 031-1234-5678 형식
      return digits.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")
    }
  }
  
  // 기본: 하이픈 없이 반환 (너무 짧거나 긴 경우)
  return digits
}

/**
 * 휴대폰번호 포맷팅
 * 예: 01012345678 → 010-1234-5678
 */
export const formatHp = (value: string) => {
  const digits = value.replace(/[^0-9]/g, '')
  
  if (digits.length === 0) return ''
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return digits.replace(/(\d{3})(\d{1,4})/, "$1-$2")
  // 11자리: 010-1234-5678
  return digits.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")
}

export const fixEmailTypo = (email: string) => {
  const lower = email.toLowerCase()

  if (lower.endsWith('.con')) return lower.replace('.con', '.com')
  if (lower.includes('gamil.com')) return lower.replace('gamil.com', 'gmail.com')
  if (lower.includes('gnail.com')) return lower.replace('gnail.com', 'gmail.com')
  if (lower.includes('naver.con')) return lower.replace('naver.con', 'naver.com')

  return lower
}

