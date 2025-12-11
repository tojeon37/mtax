import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { MenuDrawer } from './MenuDrawer'

const HeaderBar: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [showMenuDrawer, setShowMenuDrawer] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
    setShowMenuDrawer(false)
  }

  return (
    <>
      <header 
        className="bg-[#0d1b2a] text-white h-14 flex items-center justify-between px-4 shadow-md sticky top-0 z-50"
        style={{ height: '56px' }}
      >
        <Link
          to="/"
          className="text-lg font-bold hover:opacity-80 transition"
          style={{ fontSize: '18px' }}
        >
          계발이
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button
                onClick={handleLogout}
                className="text-sm font-medium hover:opacity-80 transition"
              >
                로그아웃
              </button>
              <button
                onClick={() => setShowMenuDrawer(true)}
                className="text-xl hover:opacity-80 transition"
                aria-label="메뉴"
              >
                ☰
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="text-sm font-medium hover:opacity-80 transition"
              >
                로그인
              </button>
              <button
                onClick={() => navigate('/register')}
                className="text-sm font-medium hover:opacity-80 transition"
              >
                회원가입
              </button>
            </>
          )}
        </div>
      </header>

      <MenuDrawer
        isOpen={showMenuDrawer}
        onClose={() => setShowMenuDrawer(false)}
      />
    </>
  )
}

export default HeaderBar






