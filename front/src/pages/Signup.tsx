import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../hooks/useAuth'
import { checkUsername } from '../api/authApi'
import { formatError } from '../utils/errorHelpers'

interface SignupFormData {
  username: string
  password: string
  passwordConfirm: string
  agreeTerms: boolean
  agreePrivacy: boolean
}

export const Signup: React.FC = () => {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [usernameCheckLoading, setUsernameCheckLoading] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  )
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const form = useForm<SignupFormData>({
    defaultValues: {
      agreeTerms: false,
      agreePrivacy: false,
    },
  })

  // 체크박스 상태 관리
  const agreeTerms = form.watch('agreeTerms')
  const agreePrivacy = form.watch('agreePrivacy')
  const isAllChecked = agreeTerms && agreePrivacy

  const handleCheckUsername = async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null)
      setUsernameCheckLoading(false)
      return
    }

    setUsernameCheckLoading(true)
    try {
      const result = await checkUsername(username)
      setUsernameAvailable(result.available)
      if (!result.available) {
        form.setError('username', {
          type: 'manual',
          message: result.message,
        })
      } else {
        // 사용 가능한 경우 에러 제거
        form.clearErrors('username')
      }
    } catch (err) {
      console.error('아이디 중복 확인 오류:', err)
      // 에러 발생 시 상태 초기화하지 않음 (이전 결과 유지)
    } finally {
      setUsernameCheckLoading(false)
    }
  }

  // debounce된 아이디 중복 확인
  const debouncedCheckUsername = (username: string) => {
    // 이전 타이머 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // 3자 미만이면 즉시 상태 초기화
    if (username.length < 3) {
      setUsernameAvailable(null)
      setUsernameCheckLoading(false)
      form.clearErrors('username')
      return
    }

    // 로딩 상태 표시
    setUsernameCheckLoading(true)

    // 500ms 후 API 호출
    debounceTimerRef.current = setTimeout(() => {
      handleCheckUsername(username)
    }, 500)
  }

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const onSubmit = async (data: SignupFormData) => {
    if (data.password !== data.passwordConfirm) {
      form.setError('passwordConfirm', {
        type: 'manual',
        message: '비밀번호가 일치하지 않습니다',
      })
      return
    }

    if (!data.agreeTerms) {
      form.setError('agreeTerms', {
        type: 'manual',
        message: '이용약관에 동의해주세요',
      })
      return
    }

    if (!data.agreePrivacy) {
      form.setError('agreePrivacy', {
        type: 'manual',
        message: '개인정보처리방침에 동의해주세요',
      })
      return
    }

    // 아이디 중복 확인
    if (usernameAvailable === false) {
      setError('이미 사용 중인 아이디입니다')
      return
    }

    if (usernameAvailable === null) {
      // 중복 확인이 안 된 경우 확인
      await handleCheckUsername(data.username)
      if (usernameAvailable === false) {
        return
      }
    }

    setError('')
    setIsLoading(true)

    try {
      console.log('회원가입 시작:', data.username)
      // 아이디와 비밀번호만으로 회원가입 (사업자 정보 없음)
      await registerUser({
        username: data.username,
        password: data.password,
      })
      console.log('회원가입 성공, 페이지 이동 중...')
      // 성공 시 메인 페이지로 이동
      navigate('/', { replace: true })
    } catch (err: any) {
      console.error('회원가입 오류 전체:', err)
      console.error('회원가입 오류 응답:', err.response?.data)
      console.error('회원가입 오류 detail:', JSON.stringify(err.response?.data?.detail, null, 2))
      setError(formatError(err) || '회원가입에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 pt-20 pb-8">
      <div className="max-w-[480px] w-full">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
            회원가입
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            autoComplete="off"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                아이디 <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                {...form.register('username', {
                  required: '아이디를 입력해주세요',
                  minLength: {
                    value: 3,
                    message: '아이디는 최소 3자 이상이어야 합니다',
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9]+$/,
                    message: '아이디는 영문과 숫자만 사용할 수 있습니다',
                  },
                  onChange: (e) => {
                    const value = e.target.value
                    form.setValue('username', value)
                    debouncedCheckUsername(value)
                  },
                })}
                name="username"
                type="text"
                autoComplete="username"
                className="w-full h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="영문/숫자 조합 3자 이상"
                disabled={isLoading}
              />
              {/* 고정 높이로 레이아웃 시프트 방지 */}
              <div className="mt-1 min-h-[20px]">
                {usernameCheckLoading && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">확인 중...</p>
                )}
                {!usernameCheckLoading && usernameAvailable === true && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    사용 가능한 아이디입니다
                  </p>
                )}
                {!usernameCheckLoading && form.formState.errors.username && (
                  <p className="text-sm text-red-500 dark:text-red-400">
                    {form.formState.errors.username.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                비밀번호 <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                {...form.register('password', {
                  required: '비밀번호를 입력해주세요',
                  minLength: {
                    value: 6,
                    message: '비밀번호는 최소 6자 이상이어야 합니다',
                  },
                })}
                name="password"
                type="password"
                autoComplete="new-password"
                className="w-full h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="6자 이상"
                disabled={isLoading}
              />
              {form.formState.errors.password && (
                <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                비밀번호 확인 <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                {...form.register('passwordConfirm', {
                  required: '비밀번호 확인을 입력해주세요',
                  validate: (value) =>
                    value === form.watch('password') ||
                    '비밀번호가 일치하지 않습니다',
                })}
                name="passwordConfirm"
                type="password"
                autoComplete="new-password"
                className="w-full h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="비밀번호를 다시 입력하세요"
                disabled={isLoading}
              />
              {form.formState.errors.passwordConfirm && (
                <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                  {form.formState.errors.passwordConfirm.message}
                </p>
              )}
            </div>

            {/* 이용약관 및 개인정보처리방침 동의 */}
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    {...form.register('agreeTerms', {
                      required: '이용약관에 동의해주세요',
                    })}
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    이용약관에 동의합니다 <span className="text-red-500 dark:text-red-400">*</span>
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => window.open('/docs/terms.html', '_blank')}
                  className="text-blue-600 dark:text-blue-400 underline text-sm hover:text-blue-700 dark:hover:text-blue-300"
                >
                  보기
                </button>
              </div>
              {form.formState.errors.agreeTerms && (
                <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                  {form.formState.errors.agreeTerms.message}
                </p>
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    {...form.register('agreePrivacy', {
                      required: '개인정보처리방침에 동의해주세요',
                    })}
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    개인정보처리방침에 동의합니다 <span className="text-red-500 dark:text-red-400">*</span>
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => window.open('/docs/privacy.html', '_blank')}
                  className="text-blue-600 dark:text-blue-400 underline text-sm hover:text-blue-700 dark:hover:text-blue-300"
                >
                  보기
                </button>
              </div>
              {form.formState.errors.agreePrivacy && (
                <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                  {form.formState.errors.agreePrivacy.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !isAllChecked}
              className={`w-full h-14 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors ${isLoading || !isAllChecked ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              {isLoading ? '가입 중...' : '회원가입'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
              to="/login"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              이미 계정이 있으신가요? 로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
