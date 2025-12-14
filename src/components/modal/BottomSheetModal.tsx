import React, { useEffect, useState } from 'react'

interface BottomSheetModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

const BottomSheetModal: React.FC<BottomSheetModalProps> = ({ isOpen, onClose, title, children, className = '' }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setStartY(e.touches[0].clientY)
    setCurrentY(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const y = e.touches[0].clientY
    setCurrentY(y)
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    const diff = currentY - startY
    
    // 아래로 100px 이상 드래그하면 닫기
    if (diff > 100) {
      onClose()
    }
    
    setIsDragging(false)
    setStartY(0)
    setCurrentY(0)
  }

  if (!isOpen) return null

  const translateY = isDragging && currentY > startY ? currentY - startY : 0

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-60"
      onClick={onClose}
    >
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-xl shadow-xl max-h-[85vh] overflow-y-auto ${className}`}
        style={{ transform: `translateY(${translateY}px)` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 드래그 핸들 */}
        <div
          className="sticky top-0 bg-white dark:bg-gray-800 pt-3 pb-2 flex justify-center z-10"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>

        {/* 헤더 */}
        {title && (
          <div className="sticky top-0 bg-white dark:bg-gray-800 px-5 pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h2>
              <button
                onClick={onClose}
                className="text-gray-300 dark:text-gray-400 text-xl hover:text-gray-100 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* 내용 */}
        <div className="px-5 pb-6">{children}</div>
      </div>
    </div>
  )
}

export default BottomSheetModal






