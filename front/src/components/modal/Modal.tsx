import React, { useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className = '' }) => {
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

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-60"
      onClick={onClose}
    >
      <div
        className={`w-[90%] max-w-[420px] max-h-[85vh] bg-white dark:bg-gray-800 rounded-xl p-5 overflow-y-auto relative shadow-xl ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="sticky top-0 bg-white dark:bg-gray-800 pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-300 dark:text-gray-400 text-xl hover:text-gray-100 dark:hover:text-gray-200"
        >
          ×
        </button>
        <div className="pb-4">{children}</div>
      </div>
    </div>
  )
}

export default Modal






