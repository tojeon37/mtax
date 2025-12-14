import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface MobileLayoutProps {
  children: React.ReactNode
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50 max-w-[480px] mx-auto">
      <div className="pb-20">{children}</div>
      
      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-[480px] mx-auto flex justify-around">
          <button
            onClick={() => navigate('/')}
            className={`flex-1 py-3 px-4 text-center transition-colors ${
              isActive('/') ? 'text-blue-600 font-semibold' : 'text-gray-600'
            }`}
          >
            <div className="text-xs">홈</div>
          </button>
          <button
            onClick={() => navigate('/invoice/quick')}
            className={`flex-1 py-3 px-4 text-center transition-colors ${
              isActive('/invoice/quick') ? 'text-blue-600 font-semibold' : 'text-gray-600'
            }`}
          >
            <div className="text-xs">빠른 발행</div>
          </button>
          <button
            onClick={() => navigate('/clients')}
            className={`flex-1 py-3 px-4 text-center transition-colors ${
              isActive('/clients') ? 'text-blue-600 font-semibold' : 'text-gray-600'
            }`}
          >
            <div className="text-xs">거래처</div>
          </button>
          <button
            onClick={() => navigate('/history')}
            className={`flex-1 py-3 px-4 text-center transition-colors ${
              isActive('/history') ? 'text-blue-600 font-semibold' : 'text-gray-600'
            }`}
          >
            <div className="text-xs">발행내역</div>
          </button>
        </div>
      </nav>
    </div>
  )
}

