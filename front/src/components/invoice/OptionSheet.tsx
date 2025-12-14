import React from 'react'
import { useInvoiceStore } from '../../store/invoiceStore'

interface OptionSheetProps {
  isOpen: boolean
  onClose: () => void
}

export const OptionSheet: React.FC<OptionSheetProps> = ({
  isOpen,
  onClose,
}) => {
  const { issueDate, paymentType, paymentMethod, setPaymentType, setPaymentMethod, setIssueDate } = useInvoiceStore()
  const [localIssueDate, setLocalIssueDate] = React.useState(issueDate)
  const [localPaymentType, setLocalPaymentType] =
    React.useState<'receipt' | 'invoice'>(paymentType)
  const [localPaymentMethod, setLocalPaymentMethod] =
    React.useState<'cash' | 'credit' | 'check' | 'bill'>(paymentMethod)

  // 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기 (미래 날짜 선택 방지)
  const today = new Date().toISOString().split('T')[0]

  React.useEffect(() => {
    if (isOpen) {
      setLocalIssueDate(issueDate)
      setLocalPaymentType(paymentType)
      setLocalPaymentMethod(paymentMethod)
    }
  }, [isOpen, issueDate, paymentType, paymentMethod])

  const handleSave = () => {
    // 미래 날짜가 선택된 경우 오늘 날짜로 설정
    const selectedDate = localIssueDate > today ? today : localIssueDate
    setPaymentType(localPaymentType)
    setPaymentMethod(localPaymentMethod)
    setIssueDate(selectedDate)
    onClose()
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value
    // 미래 날짜 선택 방지
    if (selectedDate <= today) {
      setLocalIssueDate(selectedDate)
    } else {
      // 미래 날짜를 선택하려고 하면 오늘 날짜로 설정
      setLocalIssueDate(today)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl z-50 max-w-[480px] mx-auto">
        <div className="p-4">
          {/* Handle */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 mb-6">옵션 변경</h2>

          {/* 작성일자 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              작성일자
            </label>
            <input
              type="date"
              value={localIssueDate}
              onChange={handleDateChange}
              max={today}
              className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 결제구분 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              결제구분
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setLocalPaymentType('receipt')}
                className={`flex-1 h-12 rounded-lg border-2 transition-colors font-medium ${
                  localPaymentType === 'receipt'
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-300 bg-white text-gray-700'
                }`}
              >
                영수
              </button>
              <button
                onClick={() => setLocalPaymentType('invoice')}
                className={`flex-1 h-12 rounded-lg border-2 transition-colors font-medium ${
                  localPaymentType === 'invoice'
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-300 bg-white text-gray-700'
                }`}
              >
                청구
              </button>
            </div>
          </div>

          {/* 결제수단 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              결제수단
            </label>
            <select
              className="w-full h-12 px-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={localPaymentMethod}
              onChange={(e) => setLocalPaymentMethod(e.target.value as 'cash' | 'credit' | 'check' | 'bill')}
            >
              <option value="cash">현금</option>
              <option value="credit">외상미수금</option>
              <option value="check">수표</option>
              <option value="bill">어음</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-12 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="flex-1 h-12 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

