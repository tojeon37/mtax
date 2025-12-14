import React from 'react'

interface FormInputProps {
  label?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  type?: string
  className?: string
  disabled?: boolean
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  className = '',
  disabled = false,
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-gray-300 dark:text-gray-400 mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full input-height px-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

export default FormInput






