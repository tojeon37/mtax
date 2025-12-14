import React from 'react'

interface PlusButtonProps {
  onClick: () => void
  className?: string
  ariaLabel?: string
}

export const PlusButton: React.FC<PlusButtonProps> = ({
  onClick,
  className = '',
  ariaLabel = '추가',
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-14 h-14 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-transform hover:scale-110 ${className}`}
      aria-label={ariaLabel}
    >
      +
    </button>
  )
}

