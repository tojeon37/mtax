import React, { useState, useEffect } from 'react'

interface SecurityEnvironmentCheckModalProps {
  isOpen: boolean
  onComplete: () => void
  onPrepare: () => void
  needsInstallation: boolean
}

export const SecurityEnvironmentCheckModal: React.FC<SecurityEnvironmentCheckModalProps> = ({
  isOpen,
  onComplete,
  onPrepare,
  needsInstallation,
}) => {
  const [checkProgress, setCheckProgress] = useState(0)
  const [isChecking, setIsChecking] = useState(true)

  // 모든 Hook은 조건부 return 전에 호출되어야 함
  useEffect(() => {
    if (!isOpen) {
      setCheckProgress(0)
      setIsChecking(true)
      return
    }

    // 보안 환경 점검 시뮬레이션 (3-5초)
    const duration = 4000 // 4초
    const interval = 100
    const steps = duration / interval
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      setCheckProgress((currentStep / steps) * 100)

      if (currentStep >= steps) {
        clearInterval(timer)
        setIsChecking(false)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [isOpen])

  // 점검 완료 시 자동으로 다음 단계로
  useEffect(() => {
    if (!isChecking && !needsInstallation && isOpen) {
      // 모달이 열려있고 점검이 완료된 경우에만 자동 완료
      const timer = setTimeout(() => {
        onComplete()
      }, 800) // 약간 더 긴 지연으로 모달 상태 업데이트 완료 보장
      return () => clearTimeout(timer)
    }
  }, [isChecking, needsInstallation, isOpen, onComplete])

  if (!isOpen) return null

  if (isChecking) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-6">
          {/* 제목 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              보안 환경을 자동으로 점검하고 있습니다…
            </h2>
          </div>

          {/* 진행 바 */}
          <div className="space-y-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-100"
                style={{ width: `${checkProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>인증서 사용 가능 여부 확인</span>
              <span>{Math.round(checkProgress)}%</span>
            </div>
          </div>

          {/* 점검 항목 */}
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${checkProgress > 20 ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span>인증서 사용 가능 여부</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${checkProgress > 50 ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span>필수 보안 모듈 확인</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${checkProgress > 80 ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span>브라우저/OS 호환성 확인</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (needsInstallation) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-6">
          {/* 제목 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              보안 구성요소 준비 필요
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              전자세금계산서 발행을 위해 필요한 보안 구성요소 1개를 준비합니다.
              <br />
              <span className="font-medium">(이 과정은 최초 1회만 필요합니다)</span>
            </p>
          </div>

          {/* 버튼 */}
          <button
            onClick={onPrepare}
            className="w-full px-4 py-3 rounded-lg bg-blue-600 dark:bg-blue-500 text-white font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            자동으로 준비하기
          </button>
        </div>
      </div>
    )
  }

  return null
}
