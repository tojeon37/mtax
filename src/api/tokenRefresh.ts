import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE_URL = `${API_URL}/api/v1`;

/**
 * Refresh token을 사용하여 새로운 access token 발급
 * @returns 새로운 access token 또는 null (실패 시)
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem('refresh_token')

  if (!refresh) {
    return null
  }

  try {
    const res = await axios.post<{ access_token: string; token_type: string }>(
      `${API_BASE_URL}/auth/refresh`,
      { refresh_token: refresh }
    )

    const token = res.data.access_token

    if (token) {
      // localStorage에 새 access token 저장
      localStorage.setItem('access_token', token)

      // axios 기본 헤더와 인스턴스 헤더 모두 업데이트
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

      return token
    }

    return null
  } catch (err) {
    // Refresh token이 만료되었거나 유효하지 않은 경우
    // 모든 토큰 제거 및 로그인 페이지로 리다이렉트
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    delete axios.defaults.headers.common['Authorization']

    // 로그인 페이지가 아닌 경우에만 리다이렉트
    const isLoginPage = window.location.pathname === '/login'
    const isRegisterPage = window.location.pathname === '/register'
    if (!isLoginPage && !isRegisterPage) {
      window.location.href = '/login'
    }

    return null
  }
}

