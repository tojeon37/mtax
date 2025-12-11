import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'

interface MenuDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const { isAuthenticated, logout, user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const handleNavigate = (path: string) => {
    navigate(path)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform">
        <div className="p-4">
          {/* Close button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={onClose}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              aria-label="메뉴 닫기"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Profile Section */}
          <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="px-4 py-2">
              {isAuthenticated && (
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {user?.biz_name || user?.barobill_id || '사용자'}
                </p>
              )}
              {/* 다크모드 토글 */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  다크모드
                </span>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
                  `}
                  aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <nav className="space-y-1">
            <button
              onClick={() => handleNavigate('/invoice/history')}
              className="w-full text-left px-4 py-3 text-base text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              발행내역
            </button>
            <button
              onClick={() => handleNavigate('/settings/export')}
              className="w-full text-left px-4 py-3 text-base text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              거래처 업로드
            </button>
            <button
              onClick={() => handleNavigate('/certificate')}
              className="w-full text-left px-4 py-3 text-base text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              공동인증서
            </button>
            <button
              onClick={() => handleNavigate('/billing')}
              className="w-full text-left px-4 py-3 text-base text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              사용요금
            </button>
            <button
              onClick={() => handleNavigate('/settings')}
              className="w-full text-left px-4 py-3 text-base text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              설정
            </button>
            {isAuthenticated && (
              <button
                onClick={() => {
                  logout()
                  onClose()
                }}
                className="w-full text-left px-4 py-3 text-base text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              >
                로그아웃
              </button>
            )}
          </nav>
        </div>
      </div>
    </>
  )
}
