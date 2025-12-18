import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../hooks/useAuth'
import { formatError } from '../utils/errorHelpers'

interface LoginFormData {
  username: string
  password: string
}

export const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  // 이미 로그인되어 있으면 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/invoice/quick'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>()

  const onSubmit = async (data: LoginFormData) => {
    setError('')
    setIsLoading(true)

    try {
      await login({
        username: data.username,
        password: data.password,
      })
      // 로그인 성공 시 원래 가려던 페이지로 이동 (없으면 /invoice/quick)
      const from = (location.state as any)?.from?.pathname || '/invoice/quick'
      navigate(from, { replace: true })
    } catch (err: any) {
      setError(formatError(err) || '로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 pt-20">
      <div className="max-w-[480px] w-full">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
            로그인
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                아이디
              </label>
              <input
                {...register('username', {
                  required: '아이디를 입력해주세요',
                  minLength: {
                    value: 3,
                    message: '아이디는 최소 3자 이상이어야 합니다',
                  },
                })}
                type="text"
                className="w-full h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="바로빌 아이디를 입력하세요"
                disabled={isLoading}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                비밀번호
              </label>
              <input
                {...register('password', {
                  required: '비밀번호를 입력해주세요',
                  minLength: {
                    value: 6,
                    message: '비밀번호는 최소 6자 이상이어야 합니다',
                  },
                })}
                type="password"
                className="w-full h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="비밀번호를 입력하세요"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full h-14 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
              to="/signup"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
