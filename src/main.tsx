import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 초기 다크모드 설정 (깜빡임 방지)
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  const root = document.documentElement
  const body = document.body
  
  if (savedTheme === 'dark') {
    root.classList.add('dark')
    body.classList.add('dark')
  } else if (savedTheme === 'light') {
    root.classList.remove('dark')
    body.classList.remove('dark')
  } else {
    // 시스템 설정 확인
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.classList.add('dark')
      body.classList.add('dark')
    }
  }
}

// DOM 로드 전에 실행
initTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)



