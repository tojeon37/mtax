import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { changePassword } from '../api/authApi'
import { formatError } from '../utils/errorHelpers'

const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate()
  
  // 폼 상태
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  
  // 에러 상태
  const [errors, setErrors] = useState<{
    currentPassword?: string
    newPassword?: string
    confirmPassword?: string
  }>({})
  
  // 성공 상태
  const [isSuccess, setIsSuccess] = useState(false)
  
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false)

  // 입력 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // 입력 시 해당 필드의 에러 제거
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  // 비밀번호 유효성 검사
  const validatePassword = (password: string): string | undefined => {
    if (password.length < 8) {
      return '비밀번호는 8자 이상이어야 합니다.'
    }
    if (!/[a-zA-Z]/.test(password)) {
      return '비밀번호에 영문자가 포함되어야 합니다.'
    }
    if (!/[0-9]/.test(password)) {
      return '비밀번호에 숫자가 포함되어야 합니다.'
    }
    return undefined
  }

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 에러 초기화
    const newErrors: typeof errors = {}

    // 현재 비밀번호 검증
    if (!formData.currentPassword) {
      newErrors.currentPassword = '현재 비밀번호를 입력해주세요.'
    }

    // 새 비밀번호 검증
    if (!formData.newPassword) {
      newErrors.newPassword = '새 비밀번호를 입력해주세요.'
    } else {
      const passwordError = validatePassword(formData.newPassword)
      if (passwordError) {
        newErrors.newPassword = passwordError
      }
    }

    // 비밀번호 확인 검증
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.'
    }

    // 현재 비밀번호와 새 비밀번호가 같은지 확인
    if (formData.currentPassword && formData.newPassword && 
        formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = '현재 비밀번호와 동일한 비밀번호는 사용할 수 없습니다.'
    }

    // 에러가 있으면 중단
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)

    try {
      // API 호출
      await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      })

      // 성공 처리
      setIsSuccess(true)
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })

      // 2초 후 이전 페이지로 이동
      setTimeout(() => {
        navigate(-1)
      }, 2000)
    } catch (error: any) {
      console.error('비밀번호 변경 실패:', error)
      console.error('에러 상세:', error.response?.data)
      
      // API 에러 처리
      if (error.response?.status === 401) {
        setErrors({ currentPassword: formatError(error) || '현재 비밀번호가 올바르지 않습니다.' })
      } else if (error.response?.status === 400) {
        const errorMessage = formatError(error) || '비밀번호 변경 중 오류가 발생했습니다.'
        if (errorMessage.includes('8자')) {
          setErrors({ newPassword: errorMessage })
        } else if (errorMessage.includes('동일한')) {
          setErrors({ newPassword: errorMessage })
        } else {
          alert(errorMessage)
        }
      } else if (error.response?.status === 500) {
        const errorMessage = error.response?.data?.detail || '비밀번호 변경 중 오류가 발생했습니다. 다시 시도해주세요.'
        alert(errorMessage)
      } else if (error.message) {
        alert(`오류: ${error.message}`)
      } else {
        alert('비밀번호 변경 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6 pt-24 pb-8">
      <div className="max-w-[480px] mx-auto">
        {/* 제목 */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          비밀번호 변경
        </h1>

        {/* 성공 메시지 */}
        {isSuccess && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
            <p className="text-green-800 dark:text-green-200 text-sm">
              비밀번호가 성공적으로 변경되었습니다. 잠시 후 이전 페이지로 이동합니다.
            </p>
          </div>
        )}

        {/* 폼 카드 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 현재 비밀번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                현재 비밀번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className={`
                  w-full px-3 py-2 border rounded-lg
                  bg-white dark:bg-gray-700
                  text-gray-900 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${errors.currentPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                `}
                placeholder="현재 비밀번호를 입력하세요"
              />
              {errors.currentPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.currentPassword}
                </p>
              )}
            </div>

            {/* 새 비밀번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                새 비밀번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className={`
                  w-full px-3 py-2 border rounded-lg
                  bg-white dark:bg-gray-700
                  text-gray-900 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${errors.newPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                `}
                placeholder="8자 이상, 영문+숫자 포함"
              />
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.newPassword}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                8자 이상, 영문자와 숫자를 포함해야 합니다.
              </p>
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                새 비밀번호 확인 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`
                  w-full px-3 py-2 border rounded-lg
                  bg-white dark:bg-gray-700
                  text-gray-900 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                `}
                placeholder="새 비밀번호를 다시 입력하세요"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* 버튼 영역 */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading || isSuccess}
                className={`
                  w-full py-3 px-6 rounded-lg font-semibold text-base
                  transition-all duration-200
                  ${isLoading || isSuccess
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-sm hover:shadow-md'
                  }
                `}
              >
                {isLoading ? '처리 중...' : isSuccess ? '변경 완료' : '비밀번호 변경'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ChangePasswordPage

/* 
========================================
API 연동 포인트
========================================

1. 비밀번호 변경 API
   - 엔드포인트: PUT /api/v1/auth/password
   - 요청 본문: {
       currentPassword: string,
       newPassword: string
     }
   - 응답: {
       success: boolean,
       message?: string
     }
   - 에러 응답 (401): {
       detail: "현재 비밀번호가 올바르지 않습니다."
     }

2. 에러 처리
   - 401: 현재 비밀번호 불일치
   - 400: 비밀번호 형식 오류
   - 500: 서버 오류

3. 성공 후 처리
   - 성공 메시지 표시
   - 2초 후 이전 페이지로 이동
   - 또는 로그아웃 후 재로그인 요구
*/

