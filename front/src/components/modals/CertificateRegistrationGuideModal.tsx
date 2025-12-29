import React from 'react'

interface CertificateRegistrationGuideModalProps {
  isOpen: boolean
  onContinue: () => void
  onCancel: () => void
}

export const CertificateRegistrationGuideModal: React.FC<CertificateRegistrationGuideModalProps> = ({
  isOpen,
  onContinue,
  onCancel,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-6">
        {/* 제목 */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            전자세금계산서 발행을 위한 보안 인증 단계
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            인증서는 금융 보안 기준을 충족한 전문 기관에서 안전하게 보관됩니다.
            <br />
            이 과정은 최초 1회만 필요하며, 약 1분 정도 소요됩니다.
          </p>
        </div>

        {/* 단계 안내 */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
              1
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                보안 환경 자동 점검
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
              2
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                인증서 등록
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
              3
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                즉시 발행 진행
              </p>
            </div>
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
            onClick={onContinue}
            className="flex-1 px-4 py-3 rounded-lg bg-blue-600 dark:bg-blue-500 text-white font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            계속하기
          </button>
        </div>
      </div>
    </div>
  )
}
