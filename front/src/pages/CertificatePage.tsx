import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCertificateStatus, CertificateStatusResponse } from '../api/barobillApi'

const CertificatePage: React.FC = () => {
  const navigate = useNavigate()
  const [status, setStatus] = useState<CertificateStatusResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCertificateStatus()
  }, [])

  const loadCertificateStatus = async () => {
    try {
      setIsLoading(true)
      const result = await fetchCertificateStatus()
      setStatus(result)
    } catch (error) {
      console.error('인증서 상태 조회 실패:', error)
      setStatus({
        certificate_registered: false,
        expire_date: null,
        message: '인증서 상태를 확인할 수 없습니다.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    } catch {
      return dateString
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6 pt-24 pb-8">
      {/* 전체 컨테이너: 최소 높이 전체 화면, 배경색, 패딩, 상단 여백(헤더 공간) */}
      <div className="max-w-[480px] mx-auto">
        {/* 콘텐츠 래퍼: 최대 너비 제한, 중앙 정렬, 모바일 최적화 */}

        {/* 제목 */}
        <div className="mb-8 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 text-2xl font-bold transition-colors"
            aria-label="뒤로가기"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            공동인증서(구 공인인증서)
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 mb-6">
          <div className="space-y-4">
            {/* 인증서 상태 표시 */}
            {isLoading ? (
              <div className="p-3 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded mb-4">
                인증서 상태 확인 중...
              </div>
            ) : status?.certificate_registered ? (
              <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700 rounded mb-4">
                <p className="font-semibold mb-1">인증서가 등록되어 있습니다.</p>
                {status.expire_date && (
                  <p className="text-sm">만료일: {formatDate(status.expire_date)}</p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 rounded mb-4">
                <p className="font-semibold mb-1">인증서가 등록되어 있지 않습니다.</p>
                <p className="text-sm mt-1">전자세금계산서 발행을 위해 공동인증서 등록이 필요합니다.</p>
              </div>
            )}

            {/* 안내 블록 */}
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 text-sm space-y-2">
              <p className="text-blue-700 dark:text-blue-300">
                • 인증서는 우리 서버에 저장되지 않고, 바로빌에서 안전하게 관리됩니다.
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                • 계발이는 바로빌 공식 파트너로 동일한 아이디·비밀번호로 바로빌 로그인이 가능합니다.
              </p>
            </div>

            {/* CTA 버튼 */}
            <a
              href="https://www.barobill.co.kr/"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center px-4 py-2 md:px-5 md:py-2.5 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              인증서 등록하러 가기
            </a>

          </div>
        </div>
      </div>
    </div>
  )
}

export default CertificatePage
