import React from 'react'
import { useInvoiceStore } from '../../store/invoiceStore'

export const SummaryBox: React.FC = () => {
  const { supplyValue, taxAmount, totalAmount } = useInvoiceStore()

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(num))
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">합계</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-base text-gray-600 dark:text-gray-400">공급가액</span>
          <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {formatNumber(supplyValue)}원
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-base text-gray-600 dark:text-gray-400">세액 (10%)</span>
          <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {formatNumber(taxAmount)}원
          </span>
        </div>
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">총 합계</span>
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {formatNumber(totalAmount)}원
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

