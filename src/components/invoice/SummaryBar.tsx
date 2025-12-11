import React from 'react'
import { useInvoiceStore } from '../../store/invoiceStore'

export const SummaryBar: React.FC = () => {
  const { supplyValue, taxAmount, totalAmount } = useInvoiceStore()

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(num))
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-[480px] mx-auto px-4 py-3">
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="text-gray-600">공급가액</span>
          <span className="font-semibold">{formatNumber(supplyValue)}원</span>
        </div>
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="text-gray-600">부가세</span>
          <span className="font-semibold">{formatNumber(taxAmount)}원</span>
        </div>
        <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-gray-200">
          <span>합계</span>
          <span className="text-blue-600">{formatNumber(totalAmount)}원</span>
        </div>
      </div>
    </div>
  )
}

