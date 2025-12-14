import React from 'react'
import { useNavigate } from 'react-router-dom'

// 설정 메뉴 아이템 컴포넌트
interface SettingMenuItemProps {
  title: string
  description: string
  onClick: () => void
  icon?: React.ReactNode
  danger?: boolean
}

const SettingMenuItem: React.FC<SettingMenuItemProps> = ({
  title,
  description,
  onClick,
  icon,
  danger = false,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full rounded-lg border p-4 shadow-sm flex justify-between items-center
        transition-all duration-200 mb-4
        ${danger
          ? 'border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }
        bg-white dark:bg-gray-800
      `}
    >
      <div className="flex-1 text-left">
        <h3 className={`text-lg font-semibold ${danger
          ? 'text-red-600 dark:text-red-400'
          : title === '회원 탈퇴'
            ? 'text-gray-400 dark:text-gray-500'
            : 'text-gray-900 dark:text-gray-100'
          }`}>
          {title}
        </h3>
        {description && (
          <p className={`text-sm mt-1 ${title === '회원 탈퇴'
            ? 'text-gray-400 dark:text-gray-500'
            : 'text-gray-600 dark:text-gray-400'
            }`}>
            {description}
          </p>
        )}
      </div>
      <div className="ml-4">
        {icon || (
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        )}
      </div>
    </button>
  )
}

// 메인 설정 페이지 컴포넌트
export const Settings: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6 pt-24 pb-8">
      {/* 전체 컨테이너: 최소 높이 전체 화면, 배경색, 패딩, 상단 여백 */}
      <div className="max-w-[480px] mx-auto">
        {/* 콘텐츠 래퍼: 최대 너비 제한, 중앙 정렬, 모바일 최적화 */}

        {/* 제목 */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          설정
        </h1>

        {/* 계정 설정 섹션 */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
            계정 설정
          </h2>

          {/* 비밀번호 변경 */}
          <SettingMenuItem
            title="비밀번호 변경"
            description=""
            onClick={() => navigate('/settings/password')}
          />
        </div>

        {/* 보안 설정 섹션 */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
            보안 설정
          </h2>

          {/* 로그인 기기 관리 */}
          <SettingMenuItem
            title="로그인 기기 관리"
            description=""
            onClick={() => navigate('/settings/sessions')}
          />
        </div>

        {/* 회원탈퇴 - 하단 배치 */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <SettingMenuItem
            title="회원 탈퇴"
            description=""
            onClick={() => navigate('/settings/delete-account')}
            danger={false}
          />
        </div>
      </div>
    </div>
  )
}
