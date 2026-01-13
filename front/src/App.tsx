import { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { ThemeProvider } from './hooks/useTheme'
import { TopBar } from './components/layout/TopBar'
import { AppRouter } from './router'
import { refreshAccessToken } from './api/tokenRefresh'
import axios from 'axios'
import { ToastContainer } from './components/common/Toast'
import { subscribeToasts, removeToast, ToastMessage } from './utils/toast'
import { overrideGlobalAlert } from './utils/alert'

function App() {
  // 앱 시작 시 불필요한 회사 정보 로드는 제거
  // 회사 정보는 각 페이지에서 필요할 때만 로드하도록 변경

  // Toast 상태 관리
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const unsubscribe = subscribeToasts((newToasts) => {
      setToasts(newToasts)
    })

    // 전역 alert() 함수를 커스텀 Toast로 오버라이드
    overrideGlobalAlert()

    return unsubscribe
  }, [])

  // 앱 시작 시 refresh token으로 자동 로그인 시도
  useEffect(() => {
    const initializeAuth = async () => {
      const refreshToken = localStorage.getItem('refresh_token')
      
      if (refreshToken) {
        try {
          // refresh token으로 새 access token 발급 시도
          const newToken = await refreshAccessToken()
          
          if (newToken) {
            // axios 기본 헤더 설정
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
          }
        } catch (error) {
          // 자동 로그인 실패 시 무시
        }
      }
    }

    initializeAuth()
  }, [])

  // 30분마다 자동으로 access token 갱신
  useEffect(() => {
    // 초기 로드 시 refresh token이 있는지 확인
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      return // refresh token이 없으면 interval 설정하지 않음
    }

    // 30분(1800000ms)마다 실행
    const intervalId = setInterval(async () => {
      const token = await refreshAccessToken()
      if (!token) {
        // refreshAccessToken 내부에서 이미 토큰 제거 및 리다이렉트 처리
        clearInterval(intervalId)
      }
    }, 30 * 60 * 1000) // 30분

    // 컴포넌트 언마운트 시 interval 정리
    return () => {
      clearInterval(intervalId)
    }
  }, [])

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <TopBar />
            <main className="max-w-[480px] mx-auto bg-gray-50 dark:bg-gray-900">
              <AppRouter />
            </main>
            <ToastContainer toasts={toasts} onClose={removeToast} />
          </div>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
