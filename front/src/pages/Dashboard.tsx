import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCompanyStore } from '../store/useCompanyStore'

export const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const { currentCompany, loadCurrentCompany } = useCompanyStore()
  const navigate = useNavigate()

  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // 회사 정보 로드 (버튼 클릭 시에만 실행되도록 하려면 이 부분도 제거 가능)
  // 하지만 Dashboard에서는 회사 정보를 표시해야 하므로 로드 필요
  useEffect(() => {
    if (isAuthenticated && !currentCompany) {
      loadCurrentCompany()
    }
  }, [isAuthenticated, currentCompany, loadCurrentCompany])

  const handleIssueClick = () => {
    navigate('/invoice/quick')
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-[480px] mx-auto px-4 py-8 pt-20">
        {/* 사용자 로그인 상태 표시 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            대시보드
          </h1>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">로그인 상태</p>
              <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                {user ? `✅ ${user.barobill_id}` : '❌ 로그인되지 않음'}
              </p>
            </div>
            
            {user?.biz_name && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">사업자명</p>
                <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {user.biz_name}
                </p>
              </div>
            )}
            
            {user?.email && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">이메일</p>
                <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {user.email}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 회사 정보 표시 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            회사 정보
          </h2>
          
          {currentCompany ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">회사명</p>
                <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {currentCompany.name}
                </p>
              </div>
              
              {currentCompany.businessNumber && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">사업자번호</p>
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {currentCompany.businessNumber}
                  </p>
                </div>
              )}
              
              {currentCompany.address && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">주소</p>
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {currentCompany.address}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                등록된 회사 정보가 없습니다.
              </p>
              <button
                onClick={() => navigate('/company')}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                회사 등록하기
              </button>
            </div>
          )}
        </div>

        {/* 발행하기 버튼 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <button
            onClick={handleIssueClick}
            className="w-full h-14 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            발행하기
          </button>
        </div>
      </div>
    </div>
  )
}

