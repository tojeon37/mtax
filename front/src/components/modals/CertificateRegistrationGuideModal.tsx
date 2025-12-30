import React from 'react'

interface CertificateRegistrationGuideModalProps {
  isOpen: boolean
  onCancel: () => void
  onStartRegistration: () => void
  showStartButton?: boolean
}

export const CertificateRegistrationGuideModal: React.FC<CertificateRegistrationGuideModalProps> = ({
  isOpen,
  onCancel,
  onStartRegistration,
  showStartButton = true,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-6">
        {/* 제목 */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            인증서 등록을 시작하세요
          </h2>
          <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                계발이는 제휴된 전자세금계산서 시스템을 통해
                <br />
                인증서 등록과 발행을 안전하게 처리합니다.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                🔐 인증서 등록을 위해 로그인이 필요합니다
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                회원가입 시 입력하신 아이디와 비밀번호로 로그인해 주세요.
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              (이 과정은 최초 1회만 필요하며, 약 1분 정도 소요됩니다)
            </p>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            나중에
          </button>
          <button
            onClick={onStartRegistration}
            className="flex-1 px-4 py-3 rounded-lg bg-blue-600 dark:bg-blue-500 text-white font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            인증서 등록 시작
          </button>
        </div>
      </div>
    </div>
  )
}
