import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // localStorage에서 테마 읽기 또는 시스템 설정 확인
  const [theme, setThemeState] = useState<Theme>(() => {
    // localStorage에서 저장된 테마 확인
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme) {
      return savedTheme
    }
    
    // 시스템 설정 확인
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    
    return 'light'
  })

  // 테마 변경 시 HTML 요소와 body에 dark 클래스 추가/제거
  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    
    if (theme === 'dark') {
      root.classList.add('dark')
      body.classList.add('dark')
    } else {
      root.classList.remove('dark')
      body.classList.remove('dark')
    }
    
    // localStorage에 저장
    localStorage.setItem('theme', theme)
  }, [theme])

  // 시스템 테마 변경 감지
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      // localStorage에 저장된 테마가 없을 때만 시스템 설정 따름
      if (!localStorage.getItem('theme')) {
        setThemeState(e.matches ? 'dark' : 'light')
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light')
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

