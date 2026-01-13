import { showToast } from './toast'

/**
 * 커스텀 alert 함수
 * 브라우저 기본 alert()를 커스텀 Toast로 대체
 * 화면 중앙에 표시됩니다.
 */
export const customAlert = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
  showToast(message, type, 3000)
}

/**
 * 전역 window.alert를 오버라이드하여 커스텀 Toast 사용
 * 주의: 이 함수는 앱 초기화 시 한 번만 호출해야 합니다.
 */
export const overrideGlobalAlert = () => {
  // 기존 alert 함수 백업 (필요시 사용)
  const originalAlert = window.alert

  // 커스텀 alert로 교체
  window.alert = (message: string) => {
    // 메시지에서 개행 문자를 처리
    const formattedMessage = String(message).replace(/\n/g, '\n')
    
    // 에러 메시지 감지 (일반적인 패턴)
    if (
      formattedMessage.toLowerCase().includes('오류') ||
      formattedMessage.toLowerCase().includes('error') ||
      formattedMessage.toLowerCase().includes('실패') ||
      formattedMessage.toLowerCase().includes('fail')
    ) {
      showToast(formattedMessage, 'error', 4000)
    } else if (
      formattedMessage.toLowerCase().includes('성공') ||
      formattedMessage.toLowerCase().includes('success') ||
      formattedMessage.toLowerCase().includes('완료')
    ) {
      showToast(formattedMessage, 'success', 3000)
    } else {
      showToast(formattedMessage, 'info', 3000)
    }
  }
}

