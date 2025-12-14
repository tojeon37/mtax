import React from 'react'
import HeaderBar from './HeaderBar'

interface MainLayoutProps {
  children: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <HeaderBar />
      <main className="container-mobile py-4 dark:text-gray-100">
        {children}
      </main>
    </div>
  )
}

export default MainLayout






