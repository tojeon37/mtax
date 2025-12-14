import axios from 'axios'

const API_BASE_URL = (import.meta.env as { VITE_API_BASE_URL?: string }).VITE_API_BASE_URL || '/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 요청 인터셉터 - 백엔드 JWT 토큰 추가
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('access_token')
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터 - 401 에러 시 로그아웃
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      console.error('[API 네트워크 오류]', error.message)
      return Promise.reject(new Error('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.'))
    }
    
    if (error.response?.status === 401) {
      const isLoginPage = window.location.pathname === '/login' || window.location.pathname.includes('/login')
      const isRegisterAPI = error.config?.url?.includes('/auth/register')
      const isLoginAPI = error.config?.url?.includes('/auth/login')
      const isCallbackPage = window.location.pathname === '/auth/callback'
      
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('remember_me')
      
      if (!isRegisterAPI && !isLoginAPI && !isLoginPage && !isCallbackPage && !window.location.pathname.includes('/invoice/create')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (data: { barobill_id: string; password: string; email: string; biz_name?: string }) =>
    api.post('/auth/register', data),
  
  login: (data: { username: string; password: string }) => {
    const params = new URLSearchParams()
    params.append('username', data.username)
    params.append('password', data.password)
    return api.post('/auth/login', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
  },
  
  getMe: (accessToken?: string) => {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
    return api.get('/auth/me', { headers })
  },
}

// BaroBill Tax Invoice API
export const barobillTaxInvoiceAPI = {
  issue: (data: any) => api.post('/barobill/tax-invoices/issue', data),
}


export default api






