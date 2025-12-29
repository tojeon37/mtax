import React from 'react'

interface CertificateRegistrationModalProps {
  isOpen: boolean
  onComplete: () => void
  onCancel: () => void
  isChecking: boolean
}

export const CertificateRegistrationModal: React.FC<CertificateRegistrationModalProps> = ({
  isOpen,
  onComplete,
  onCancel,
  isChecking,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-6">
        {/* 제목 */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            인증서 등록 진행 중
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            새 창에서 인증서 등록을 진행해주세요.
            <br />
            등록을 완료하셨다면 아래 버튼을 눌러주세요.
          </p>
        </div>

        {/* 안내 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            • 인증서 등록은 새 창에서 진행됩니다.
            <br />
            • 등록을 완료한 후 이 창으로 돌아와주세요.
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onComplete}
            disabled={isChecking}
            className={`flex-1 px-4 py-3 rounded-lg bg-blue-600 dark:bg-blue-500 text-white font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors ${isChecking ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            {isChecking ? '확인 중...' : '등록 완료 확인'}
          </button>
        </div>
      </div>
    </div>
  )
}
