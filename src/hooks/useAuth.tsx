import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  login as loginApi,
  register as registerApi,
  getToken,
  removeToken,
  saveToken,
  saveRefreshToken,
  LoginRequest,
  RegisterRequest,
} from '../api/authApi'
import { useCompanyStore } from '../store/useCompanyStore'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE_URL = `${API_URL}/api/v1`;

interface User {
  id: number
  barobill_id: string
  email?: string
  biz_name: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (payload: LoginRequest) => Promise<void>
  register: (payload: RegisterRequest) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { loadCurrentCompany } = useCompanyStore()

  // 초기 로드 시 토큰 확인 및 사용자 정보 조회
  useEffect(() => {
    const initializeUser = async () => {
      const token = getToken()
      const refreshToken = localStorage.getItem('refresh_token')

      // refresh token이 있지만 access token이 없거나 만료된 경우 자동 갱신 시도
      if (refreshToken && !token) {
        try {
          const { refreshAccessToken } = await import('../api/tokenRefresh')
          const newToken = await refreshAccessToken()
          if (newToken) {
            // 새 토큰으로 사용자 정보 조회
            await fetchUserInfo(newToken)
            return
          }
        } catch (error) {
          console.error('초기 로드 시 토큰 갱신 실패:', error)
          setLoading(false)
          return
        }
      }

      if (token) {
        await fetchUserInfo(token)
      } else {
        setLoading(false)
      }
    }

    const fetchUserInfo = async (token: string) => {
      // axios 기본 헤더에 토큰 설정
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

      try {
        // 토큰이 있으면 사용자 정보 조회
        const response = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setUser(response.data)
        // 사용자 정보 로드 후 회사 정보도 로드
        loadCurrentCompany()
      } catch (error: any) {
        // 네트워크 에러(서버 미실행)는 조용히 처리
        if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || error.message?.includes('ERR_CONNECTION_REFUSED')) {
          // 개발 환경에서만 콘솔 경고
          if (import.meta.env.DEV) {
            console.warn('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.')
          }
        } else {
          // 토큰이 유효하지 않으면 삭제
          removeToken()
          delete axios.defaults.headers.common['Authorization']
        }
      } finally {
        setLoading(false)
      }
    }

    initializeUser()
  }, [])

  const login = async (payload: LoginRequest) => {
    const response = await loginApi(payload)

    // Access token과 refresh token 모두 저장
    saveToken(response.access_token)
    if (response.refresh_token) {
      saveRefreshToken(response.refresh_token)
    }

    // 바로빌 연동을 위해 비밀번호를 세션 스토리지에 임시 저장 (로그아웃 시 삭제)
    // 보안상 세션 스토리지 사용 (브라우저 종료 시 자동 삭제)
    if (payload.password) {
      sessionStorage.setItem('barobill_password', payload.password)
    }

    // axios 기본 헤더에 토큰 설정
    axios.defaults.headers.common['Authorization'] = `Bearer ${response.access_token}`

    if (response.user) {
      setUser(response.user)
    } else {
      // 사용자 정보가 없으면 다시 조회
      const userResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${response.access_token}`,
        },
      })
      setUser(userResponse.data)
    }

    // 로그인 후 회사 정보 로드
    loadCurrentCompany()

    // navigate는 Login 컴포넌트에서 처리하도록 함
  }

  const register = async (payload: RegisterRequest) => {
    try {
      console.log('registerApi 호출 시작:', payload.username)
      const response = await registerApi(payload)
      console.log('registerApi 성공:', response)

      // Access token과 refresh token 모두 저장
      saveToken(response.access_token)
      if (response.refresh_token) {
        saveRefreshToken(response.refresh_token)
      }

      // 바로빌 연동을 위해 비밀번호를 세션 스토리지에 임시 저장 (로그아웃 시 삭제)
      // 보안상 세션 스토리지 사용 (브라우저 종료 시 자동 삭제)
      if (payload.password) {
        sessionStorage.setItem('barobill_password', payload.password)
      }

      // axios 기본 헤더에 토큰 설정
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.access_token}`

      if (response.user) {
        setUser(response.user)
        console.log('사용자 정보 설정 완료:', response.user)
      } else {
        // 사용자 정보가 없으면 다시 조회
        console.log('사용자 정보 조회 중...')
        const userResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${response.access_token}`,
          },
        })
        setUser(userResponse.data)
        console.log('사용자 정보 조회 완료:', userResponse.data)
      }

      // 회원가입 후 회사 정보 로드
      loadCurrentCompany()
      console.log('회원가입 완료')
    } catch (error: any) {
      console.error('register 함수에서 에러 발생:', error)
      // 에러 발생 시 다시 throw하여 Signup 컴포넌트에서 처리
      throw error
    }
  }

  const logout = () => {
    removeToken()
    // 세션 스토리지의 비밀번호도 삭제
    sessionStorage.removeItem('barobill_password')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    // 로그아웃 시 회사 정보도 초기화
    const { setCurrentCompany } = useCompanyStore.getState()
    setCurrentCompany(null)
    navigate('/login')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
