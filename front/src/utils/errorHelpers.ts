/**
 * FastAPI 에러 응답을 문자열로 변환하는 유틸리티 함수
 * FastAPI의 ValidationError는 detail이 배열이거나 객체일 수 있음
 * React에서 객체를 직접 렌더링하는 것을 방지하기 위해 항상 문자열로 변환
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
  if (error.response?.data) {
    const data = error.response.data

    // detail이 있는 경우 (FastAPI 표준 에러 형식)
    if (data.detail) {
      const detail = data.detail

      // 배열인 경우 (Pydantic ValidationError)
      if (Array.isArray(detail)) {
        return detail
          .map((item: any) => {
            if (typeof item === 'string') return item
            if (item && typeof item === 'object') {
              if (item.msg) {
                const field = item.loc?.slice(-1)?.[0] || '필드'
                return `${field}: ${item.msg}`
              }
              // 객체인 경우 JSON 문자열로 변환 (렌더링 방지)
              return JSON.stringify(item)
            }
            return String(item)
          })
          .join(', ')
      }

      // 문자열인 경우
      if (typeof detail === 'string') {
        return detail
      }

      // 객체인 경우 JSON 문자열로 변환 (렌더링 방지)
      if (detail && typeof detail === 'object') {
        return JSON.stringify(detail)
      }
    }

    // detail이 없지만 message가 있는 경우
    if (data.message && typeof data.message === 'string') {
      return data.message
    }
  }

  // error.message가 있는 경우
  if (error.message && typeof error.message === 'string') {
    return error.message
  }

  // 객체 자체가 전달된 경우 (예: 직접 detail 객체가 전달됨)
  if (error && typeof error === 'object') {
    // Pydantic ValidationError 형식인지 확인
    if (Array.isArray(error)) {
      return error
        .map((item: any) => {
          if (typeof item === 'string') return item
          if (item?.msg) {
            const field = item.loc?.slice(-1)?.[0] || '필드'
            return `${field}: ${item.msg}`
          }
          return JSON.stringify(item)
        })
        .join(', ')
    }
    // 객체인 경우 JSON 문자열로 변환
    return JSON.stringify(error)
  }

  // 그 외의 경우
  return '알 수 없는 오류가 발생했습니다.'
}
