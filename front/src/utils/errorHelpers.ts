/**
 * FastAPI 에러 응답을 문자열로 변환하는 유틸리티 함수
 * FastAPI의 ValidationError는 detail이 배열이거나 객체일 수 있음
 */
export function formatError(error: any): string {
  if (!error) {
    return '알 수 없는 오류가 발생했습니다.'
  }

  // 문자열인 경우 그대로 반환
  if (typeof error === 'string') {
    return error
  }

  // axios 에러인 경우
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail

    // 배열인 경우 (ValidationError)
    if (Array.isArray(detail)) {
      return detail
        .map((item: any) => {
          if (typeof item === 'string') return item
          if (item.msg) {
            const field = item.loc?.slice(-1)[0] || '필드'
            return `${field}: ${item.msg}`
          }
          return JSON.stringify(item)
        })
        .join(', ')
    }

    // 문자열인 경우
    if (typeof detail === 'string') {
      return detail
    }

    // 객체인 경우 JSON 문자열로 변환 (렌더링 방지)
    return JSON.stringify(detail)
  }

  // error.message가 있는 경우
  if (error.message) {
    return error.message
  }

  // 그 외의 경우
  return '알 수 없는 오류가 발생했습니다.'
}
