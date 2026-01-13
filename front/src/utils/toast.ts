import { ToastMessage, ToastType } from '../components/common/Toast'

let toastListeners: Array<(toasts: ToastMessage[]) => void> = []
let toasts: ToastMessage[] = []

const notifyListeners = () => {
  toastListeners.forEach((listener) => listener([...toasts]))
}

export const showToast = (
  message: string,
  type: ToastType = 'info',
  duration?: number
) => {
  const id = Math.random().toString(36).substring(2, 9)
  const newToast: ToastMessage = {
    id,
    message,
    type,
    duration,
  }

  toasts = [...toasts, newToast]
  notifyListeners()

  return id
}

export const removeToast = (id: string) => {
  toasts = toasts.filter((toast) => toast.id !== id)
  notifyListeners()
}

export const subscribeToasts = (listener: (toasts: ToastMessage[]) => void) => {
  toastListeners.push(listener)
  listener([...toasts])

  return () => {
    toastListeners = toastListeners.filter((l) => l !== listener)
  }
}

// 브라우저 기본 alert() 함수를 커스텀 Toast로 래핑
export const customAlert = (message: string, type: ToastType = 'info') => {
  showToast(message, type, 3000)
}

// 브라우저 기본 confirm() 함수를 커스텀 Toast로 래핑 (선택적)
export const customConfirm = (
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
): void => {
  // confirm은 Toast로 대체할 수 없으므로, 기본 confirm 사용
  // 필요시 커스텀 모달로 구현 가능
  const confirmed = window.confirm(message)
  if (confirmed) {
    onConfirm()
  } else if (onCancel) {
    onCancel()
  }
}

