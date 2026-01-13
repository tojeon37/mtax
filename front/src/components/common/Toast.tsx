import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastProps {
  toast: ToastMessage
  onClose: (id: string) => void
}

function Toast({ toast, onClose }: ToastProps) {
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    const duration = toast.duration ?? 3000
    const timer = setTimeout(() => {
      setIsClosing(true)
      // 애니메이션 완료 후 제거
      setTimeout(() => {
        onClose(toast.id)
      }, 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onClose])

  const getToastStyles = () => {
    const baseStyles = 'px-6 py-4 rounded-lg shadow-xl text-sm font-medium max-w-md transition-all duration-300'
    
    switch (toast.type) {
      case 'success':
        return `${baseStyles} bg-green-500 dark:bg-green-600 text-white`
      case 'error':
        return `${baseStyles} bg-red-500 dark:bg-red-600 text-white`
      case 'warning':
        return `${baseStyles} bg-yellow-500 dark:bg-yellow-600 text-white`
      case 'info':
      default:
        return `${baseStyles} bg-blue-500 dark:bg-blue-600 text-white`
    }
  }

  return (
    <div
      className={getToastStyles()}
      style={{
        whiteSpace: 'pre-line',
        wordBreak: 'break-word',
        animation: isClosing ? 'fadeOut 0.3s ease-out forwards' : 'fadeInUp 0.3s ease-out',
      }}
    >
      {toast.message}
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastMessage[]
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div
      className="fixed z-[9999] flex flex-col gap-3 pointer-events-none items-center"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        width: '100%',
        maxWidth: '90vw',
        padding: '0 1rem',
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="w-full flex justify-center"
        >
          <Toast toast={toast} onClose={onClose} />
        </div>
      ))}
    </div>
  )
}

