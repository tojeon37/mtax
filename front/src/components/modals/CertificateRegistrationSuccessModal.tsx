import React from 'react'

interface CertificateRegistrationSuccessModalProps {
  isOpen: boolean
  onContinue: () => void
}

export const CertificateRegistrationSuccessModal: React.FC<CertificateRegistrationSuccessModalProps> = ({
  isOpen,
  onContinue,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-6">
        {/* 제목 */}
        <div className="text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            인증이 완료되었습니다
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            이제 전자세금계산서를 바로 발행할 수 있습니다.
          </p>
        </div>

        {/* 버튼 */}
        <button
          onClick={onContinue}
          className="w-full px-4 py-3 rounded-lg bg-blue-600 dark:bg-blue-500 text-white font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          전자세금계산서 발행 계속하기
        </button>
      </div>
    </div>
  )
}
