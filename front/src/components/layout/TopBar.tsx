import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MenuDrawer } from './MenuDrawer'
import { useAuth } from '../../hooks/useAuth'
import { useCompanyStore } from '../../store/useCompanyStore'

export const TopBar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const { currentCompany } = useCompanyStore()

  // TopBar에서는 회사 정보를 로드하지 않음
  // 각 페이지에서 필요할 때만 로드하도록 변경

  // barobill_id에서 "회사_" 접두사 제거
  const getDisplayName = () => {
    if (currentCompany?.name) {
      return currentCompany.name
    }
    if (user?.barobill_id) {
      // "회사_" 접두사 제거
      return user.barobill_id.replace(/^회사_/, '')
    }
    return ''
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-[480px] mx-auto px-4 h-14 flex items-center justify-between">
          {/* Left: 서비스명 */}
          <button
            onClick={() => navigate('/')}
            className="text-lg font-bold text-gray-900 dark:text-gray-100"
          >
            계발이
          </button>

          {/* Right: 로그인/회원가입 및 햄버거 메뉴 */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-2 py-1.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 whitespace-nowrap"
                >
                  로그인
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="px-2 py-1.5 text-xs sm:text-sm bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 whitespace-nowrap"
                >
                  회원가입
                </button>
              </>
            ) : (
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate max-w-[100px]">
                {getDisplayName()}
              </span>
            )}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              aria-label="메뉴 열기"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <MenuDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  )
}
