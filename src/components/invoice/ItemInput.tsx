import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Item } from '../../store/invoiceStore'
import { formatNumber, formatNumberInput, removeCommas } from '../../utils/numberFormat'

interface ItemInputProps {
  item: Item
  index: number
  isExpanded?: boolean
  onToggle?: () => void
  onUpdate: (updates: Partial<Item>) => void
  onRemove?: () => void
  canRemove: boolean
}

interface ItemFormData {
  name: string
  specification: string
  quantity: number
  unitPrice: number
  supplyValue: number
  note: string
}

export const ItemInput: React.FC<ItemInputProps> = ({
  item,
  index,
  isExpanded: controlledExpanded,
  onToggle,
  onUpdate,
  onRemove,
  canRemove,
}) => {
  const {
    register,
    setValue,
    formState: { errors },
  } = useForm<ItemFormData>({
    defaultValues: {
      name: item.name || '',
      specification: item.specification || '',
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || 0,
      supplyValue: item.supplyValue || 0,
      note: item.note || '',
    },
  })

  // 콤마가 포함된 표시용 값들
  const [quantityDisplay, setQuantityDisplay] = useState(
    item.quantity ? formatNumber(item.quantity.toString()) : '1'
  )
  const [unitPriceDisplay, setUnitPriceDisplay] = useState(
    item.unitPrice ? formatNumber(item.unitPrice.toString()) : '0'
  )
  const [supplyValueDisplay, setSupplyValueDisplay] = useState(
    item.supplyValue ? formatNumber(item.supplyValue.toString()) : '0'
  )

  // 공급가액 자동 계산 함수
  const calculateSupplyValue = (qty: number, price: number) => {
    if (qty > 0 && price > 0) {
      const calculated = qty * price
      setValue('supplyValue', calculated)
      setSupplyValueDisplay(formatNumber(calculated.toString()))
      return calculated
    }
    return 0
  }

  // 수량 입력 핸들러
  const handleQuantityChange = (value: string) => {
    const formatted = formatNumberInput(value)
    const displayFormatted = formatNumber(formatted)
    setQuantityDisplay(displayFormatted)
    const numValue = parseFloat(removeCommas(formatted)) || 0
    setValue('quantity', numValue)
    
    // 공급가액 자동 계산
    const currentUnitPrice = parseFloat(removeCommas(unitPriceDisplay)) || 0
    const calculatedSupply = calculateSupplyValue(numValue, currentUnitPrice)
    
    // store 업데이트
    onUpdate({
      quantity: numValue,
      unitPrice: currentUnitPrice,
      supplyValue: calculatedSupply,
    })
  }

  // 단가 입력 핸들러
  const handleUnitPriceChange = (value: string) => {
    const formatted = formatNumberInput(value)
    const displayFormatted = formatNumber(formatted)
    setUnitPriceDisplay(displayFormatted)
    const numValue = parseFloat(removeCommas(formatted)) || 0
    setValue('unitPrice', numValue)
    
    // 공급가액 자동 계산
    const currentQuantity = parseFloat(removeCommas(quantityDisplay)) || 0
    const calculatedSupply = calculateSupplyValue(currentQuantity, numValue)
    
    // store 업데이트
    onUpdate({
      quantity: currentQuantity,
      unitPrice: numValue,
      supplyValue: calculatedSupply,
    })
  }

  // 공급가액 직접 수정 시
  const handleSupplyValueChange = (value: string) => {
    const formatted = formatNumberInput(value)
    setSupplyValueDisplay(formatNumber(formatted))
    const numValue = parseFloat(removeCommas(formatted)) || 0
    setValue('supplyValue', numValue)
    onUpdate({ supplyValue: numValue })
  }

  // 품목명 변경 시
  const handleNameChange = (name: string) => {
    setValue('name', name)
    onUpdate({ name })
  }

  // 규격 변경 시
  const handleSpecificationChange = (specification: string) => {
    setValue('specification', specification)
    onUpdate({ specification })
  }

  // 비고 변경 시
  const handleNoteChange = (note: string) => {
    setValue('note', note)
    onUpdate({ note })
  }

  // item이 외부에서 변경될 때 display 값 업데이트 (초기 로드 시에만)
  useEffect(() => {
    const currentQuantity = parseFloat(removeCommas(quantityDisplay)) || 0
    const currentUnitPrice = parseFloat(removeCommas(unitPriceDisplay)) || 0
    const currentSupplyValue = parseFloat(removeCommas(supplyValueDisplay)) || 0
    
    // 외부에서 변경된 경우에만 업데이트 (사용자 입력과 충돌 방지)
    if (item.quantity !== undefined && Math.abs(item.quantity - currentQuantity) > 0.01) {
      setQuantityDisplay(formatNumber(item.quantity.toString()))
      setValue('quantity', item.quantity)
    }
    if (item.unitPrice !== undefined && Math.abs(item.unitPrice - currentUnitPrice) > 0.01) {
      setUnitPriceDisplay(formatNumber(item.unitPrice.toString()))
      setValue('unitPrice', item.unitPrice)
    }
    if (item.supplyValue !== undefined && Math.abs(item.supplyValue - currentSupplyValue) > 0.01) {
      setSupplyValueDisplay(formatNumber(item.supplyValue.toString()))
      setValue('supplyValue', item.supplyValue)
    }
  }, [item.id]) // item.id가 변경될 때만 (다른 item으로 전환 시)

  // 아코디언 상태 관리 (외부 제어 또는 내부 상태)
  // 기본값: false - 모든 품목이 접힌 상태로 시작 (사용자가 클릭해야 펼쳐짐)
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = controlledExpanded !== undefined ? controlledExpanded : internalOpen

  const handleToggle = () => {
    if (onToggle) {
      onToggle()
    } else {
      setInternalOpen(!internalOpen)
    }
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm mb-4">
      {/* 아코디언 헤더 */}
      <button
        type="button"
        className="flex justify-between items-center w-full"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-semibold">
            품목 #{index + 1}
          </span>
          <span className="text-gray-700 dark:text-gray-300 font-medium">
            {item.name && !isOpen ? item.name : item.name || "입력 필요"}
          </span>
          {item.supplyValue > 0 && !isOpen && (
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {formatNumber(item.supplyValue.toString())}원
            </span>
          )}
        </div>

        <span className="text-gray-500 dark:text-gray-400">
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {/* 아코디언 내용 */}
      {isOpen && (
        <div className="mt-4 space-y-3">
          {/* 품목명 */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              품목명 <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              {...register('name', { required: '품목명을 입력해주세요' })}
              onChange={(e) => handleNameChange(e.target.value)}
              className="mt-1 w-full h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="품목명을 입력하세요"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* 규격 */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              규격
            </label>
            <input
              {...register('specification')}
              onChange={(e) => handleSpecificationChange(e.target.value)}
              className="mt-1 w-full h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="규격 (선택사항)"
            />
          </div>

          {/* 수량 + 단가 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                수량 <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                value={quantityDisplay}
                onChange={(e) => handleQuantityChange(e.target.value)}
                onBlur={() => {
                  const numValue = parseFloat(removeCommas(quantityDisplay)) || 0
                  if (numValue < 0.01) {
                    setQuantityDisplay('1')
                    setValue('quantity', 1)
                    onUpdate({ quantity: 1 })
                  } else {
                    setQuantityDisplay(formatNumber(numValue.toString()))
                  }
                }}
                className="mt-1 w-full h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="1"
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                  {errors.quantity.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                단가 <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                value={unitPriceDisplay}
                onChange={(e) => handleUnitPriceChange(e.target.value)}
                onBlur={() => {
                  const numValue = parseFloat(removeCommas(unitPriceDisplay)) || 0
                  setUnitPriceDisplay(formatNumber(numValue.toString()))
                }}
                className="mt-1 w-full h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="0"
              />
              {errors.unitPrice && (
                <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                  {errors.unitPrice.message}
                </p>
              )}
            </div>
          </div>

          {/* 공급가액 */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              공급가액
            </label>
            <input
              type="text"
              value={supplyValueDisplay}
              onChange={(e) => handleSupplyValueChange(e.target.value)}
              onBlur={() => {
                const numValue = parseFloat(removeCommas(supplyValueDisplay)) || 0
                setSupplyValueDisplay(formatNumber(numValue.toString()))
              }}
              className="mt-1 w-full h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="자동 계산"
            />
            {errors.supplyValue && (
              <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                {errors.supplyValue.message}
              </p>
            )}
          </div>

          {/* 비고 */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              비고
            </label>
            <input
              {...register('note')}
              onChange={(e) => handleNoteChange(e.target.value)}
              className="mt-1 w-full h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="비고 (선택사항)"
            />
          </div>

          {/* 삭제 버튼 */}
          {canRemove && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-red-500 dark:text-red-400 text-sm font-medium mt-3 hover:text-red-600 dark:hover:text-red-300 transition-colors"
            >
              품목 삭제
            </button>
          )}
        </div>
      )}
    </div>
  )
}

