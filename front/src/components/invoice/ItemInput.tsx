import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Item } from '../../store/invoiceStore'
import { formatNumber, formatNumberInput, removeCommas } from '../../utils/numberFormat'
import { ItemPickerSheet, saveRecentItem } from './ItemPickerSheet'

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
  vatRate: number
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
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      supplyValue: item.supplyValue,
      note: item.note || '',
    },
  })

  // 콤마가 포함된 표시용 값들
  const [quantityDisplay, setQuantityDisplay] = useState(
    item.quantity ? formatNumber(item.quantity.toString()) : ''
  )
  const [unitPriceDisplay, setUnitPriceDisplay] = useState(
    item.unitPrice ? formatNumber(item.unitPrice.toString()) : ''
  )
  const [supplyValueDisplay, setSupplyValueDisplay] = useState(
    item.supplyValue ? formatNumber(item.supplyValue.toString()) : ''
  )

  // 공급가액 하이라이트 상태
  const [highlightAmount, setHighlightAmount] = useState(false)

  // 공급가액 자동 계산 함수
  const calculateSupplyValue = (qty: number, price: number) => {
    const qtyNum = Number(qty || 0)
    const priceNum = Number(price || 0)
    if (qtyNum > 0 && priceNum > 0) {
      const calculated = qtyNum * priceNum
      setValue('supplyValue', calculated)
      setSupplyValueDisplay(formatNumber(calculated.toString()))
      return calculated
    }
    setValue('supplyValue', 0)
    setSupplyValueDisplay('')
    return 0
  }

  // 수량 입력 핸들러
  const handleQuantityChange = (value: string) => {
    const formatted = formatNumberInput(value)
    const displayFormatted = formatNumber(formatted)
    setQuantityDisplay(displayFormatted)
    const numValue = Number(removeCommas(formatted) || 0)
    setValue('quantity', numValue)

    // 공급가액 자동 계산
    const currentUnitPrice = Number(removeCommas(unitPriceDisplay) || 0)
    const calculatedSupply = calculateSupplyValue(numValue, currentUnitPrice)

    // 공급가액 하이라이트 효과
    setHighlightAmount(true)
    setTimeout(() => setHighlightAmount(false), 300)

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
    const numValue = Number(removeCommas(formatted) || 0)
    setValue('unitPrice', numValue)

    // 공급가액 자동 계산
    const currentQuantity = Number(removeCommas(quantityDisplay) || 0)
    const calculatedSupply = calculateSupplyValue(currentQuantity, numValue)

    // 공급가액 하이라이트 효과
    setHighlightAmount(true)
    setTimeout(() => setHighlightAmount(false), 300)

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
    const numValue = Number(removeCommas(formatted) || 0)
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

  // 부가세율 변경 시
  const handleVatRateChange = (vatRate: number) => {
    // 유효성 검증: 0 미만이면 0, 10 초과면 10으로 제한
    let validatedRate = vatRate
    if (isNaN(validatedRate) || validatedRate < 0) {
      validatedRate = 0
    } else if (validatedRate > 10) {
      validatedRate = 10
    }

    setValue('vatRate', validatedRate)
    onUpdate({ vatRate: validatedRate })
  }

  // 비고 변경 시
  const handleNoteChange = (note: string) => {
    setValue('note', note)
    onUpdate({ note })
  }

  // 품목 선택 핸들러
  const handleItemSelect = (selectedItem: Item) => {
    const selectedQuantity = selectedItem.quantity || item.quantity || 1
    const selectedUnitPrice = selectedItem.unitPrice || 0
    const calculatedSupply = selectedQuantity * selectedUnitPrice

    setValue('name', selectedItem.name)
    setValue('specification', selectedItem.specification || '')
    setValue('quantity', selectedQuantity)
    setValue('unitPrice', selectedUnitPrice)
    setValue('supplyValue', calculatedSupply)
    setValue('vatRate', selectedItem.vatRate ?? 10)

    setQuantityDisplay(selectedQuantity > 0 ? formatNumber(selectedQuantity.toString()) : '')
    setUnitPriceDisplay(selectedUnitPrice > 0 ? formatNumber(selectedUnitPrice.toString()) : '')
    setSupplyValueDisplay(calculatedSupply > 0 ? formatNumber(calculatedSupply.toString()) : '')

    onUpdate({
      name: selectedItem.name,
      specification: selectedItem.specification ?? '',
      unitPrice: selectedUnitPrice,
      quantity: selectedQuantity,
      supplyValue: calculatedSupply,
      vatRate: selectedItem.vatRate ?? 10,
    })
  }

  // item이 외부에서 변경될 때 display 값 업데이트 (초기 로드 시에만)
  useEffect(() => {
    const currentQuantity = Number(removeCommas(quantityDisplay) || 0)
    const currentUnitPrice = Number(removeCommas(unitPriceDisplay) || 0)
    const currentSupplyValue = Number(removeCommas(supplyValueDisplay) || 0)

    // 외부에서 변경된 경우에만 업데이트 (사용자 입력과 충돌 방지)
    if (item.quantity !== undefined && Math.abs(item.quantity - currentQuantity) > 0.01) {
      setQuantityDisplay(item.quantity > 0 ? formatNumber(item.quantity.toString()) : '')
      setValue('quantity', item.quantity)
    }
    if (item.unitPrice !== undefined && Math.abs(item.unitPrice - currentUnitPrice) > 0.01) {
      setUnitPriceDisplay(item.unitPrice > 0 ? formatNumber(item.unitPrice.toString()) : '')
      setValue('unitPrice', item.unitPrice)
    }
    if (item.supplyValue !== undefined && Math.abs(item.supplyValue - currentSupplyValue) > 0.01) {
      setSupplyValueDisplay(item.supplyValue > 0 ? formatNumber(item.supplyValue.toString()) : '')
      setValue('supplyValue', item.supplyValue)
    }
  }, [item.id]) // item.id가 변경될 때만 (다른 item으로 전환 시)

  // 품목명이 직접 입력되고 완성되었을 때 최근 사용에 추가
  // TODO: 실제 API 연동 시 이 로직을 발행 완료 시점(handleIssue)으로 이동
  useEffect(() => {
    // 품목명이 있고, 공급가액이 0보다 큰 경우
    if (
      item.name &&
      item.name.trim() !== '' &&
      item.supplyValue > 0
    ) {
      const itemToSave: Item = {
        id: item.id,
        name: item.name,
        specification: item.specification,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        supplyValue: item.supplyValue,
        note: item.note,
      }

      // 디바운스: 3초 후에 저장 (사용자가 계속 입력 중이면 저장하지 않음)
      const timer = setTimeout(() => {
        saveRecentItem(itemToSave)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [item.name, item.supplyValue, item.id])

  // 아코디언 상태 관리 (외부 제어 또는 내부 상태)
  // 기본값: false - 모든 품목이 접힌 상태로 시작 (사용자가 클릭해야 펼쳐짐)
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = controlledExpanded !== undefined ? controlledExpanded : internalOpen

  // 품목 선택 모달 상태
  const [itemPickerOpen, setItemPickerOpen] = useState(false)

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
            <div className="relative mt-1">
              <input
                {...register('name', { required: '품목명을 입력해주세요' })}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full h-12 px-4 pr-14 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="품목명을 입력하거나 선택하세요"
              />
              <button
                type="button"
                onClick={() => setItemPickerOpen(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-12 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 transition-colors z-10"
                aria-label="자주 사용하는 품목 선택"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </button>
            </div>
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
              placeholder=""
            />
          </div>

          {/* 수량 + 단가 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                수량 <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <div className="relative w-full">
                <input
                  type="text"
                  value={quantityDisplay}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  onBlur={() => {
                    const numValue = Number(removeCommas(quantityDisplay) || 0)
                    if (numValue > 0) {
                      setQuantityDisplay(formatNumber(numValue.toString()))
                    }
                  }}
                  className="mt-1 w-full h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder=""
                />
                {(quantityDisplay && Number(removeCommas(quantityDisplay) || 0) > 0) && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 dark:text-green-400 text-sm font-bold">✔</span>
                )}
              </div>
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
              <div className="relative w-full">
                <input
                  type="text"
                  value={unitPriceDisplay}
                  onChange={(e) => handleUnitPriceChange(e.target.value)}
                  onBlur={() => {
                    const numValue = Number(removeCommas(unitPriceDisplay) || 0)
                    if (numValue > 0) {
                      setUnitPriceDisplay(formatNumber(numValue.toString()))
                    }
                  }}
                  className="mt-1 w-full h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder=""
                />
                {(unitPriceDisplay && Number(removeCommas(unitPriceDisplay) || 0) > 0) && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 dark:text-green-400 text-sm font-bold">✔</span>
                )}
              </div>
              {errors.unitPrice && (
                <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                  {errors.unitPrice.message}
                </p>
              )}
            </div>
          </div>

          {/* 부가세율 */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              부가세율(%)
            </label>
            <div className="relative w-full">
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                {...register('vatRate', {
                  valueAsNumber: true,
                  min: { value: 0, message: '0 이상의 값을 입력해주세요' },
                  max: { value: 10, message: '10 이하의 값을 입력해주세요' }
                })}
                defaultValue={item.vatRate ?? 10}
                onChange={(e) => {
                  const inputValue = e.target.value
                  // 빈 값일 경우 0으로 처리
                  if (inputValue === '' || inputValue === null || inputValue === undefined) {
                    handleVatRateChange(0)
                    e.target.value = '0'
                    return
                  }

                  const value = parseFloat(inputValue)
                  // NaN이거나 음수인 경우 0으로 처리
                  if (isNaN(value) || value < 0) {
                    handleVatRateChange(0)
                    e.target.value = '0'
                    return
                  }

                  // 10 초과인 경우 10으로 제한
                  if (value > 10) {
                    handleVatRateChange(10)
                    e.target.value = '10'
                    return
                  }

                  handleVatRateChange(value)
                }}
                onBlur={(e) => {
                  const inputValue = e.target.value
                  // 빈 값일 경우 0으로 처리
                  if (inputValue === '' || inputValue === null || inputValue === undefined) {
                    handleVatRateChange(0)
                    e.target.value = '0'
                    return
                  }

                  const value = parseFloat(inputValue)
                  // NaN이거나 음수인 경우 0으로 처리
                  if (isNaN(value) || value < 0) {
                    handleVatRateChange(0)
                    e.target.value = '0'
                    return
                  }

                  // 10 초과인 경우 10으로 제한
                  if (value > 10) {
                    handleVatRateChange(10)
                    e.target.value = '10'
                    return
                  }

                  // 정상적인 값인 경우 그대로 사용
                  handleVatRateChange(value)
                }}
                className="mt-1 w-full h-12 px-4 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                %
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              간이과세자는 0~5%까지 입력 가능합니다
            </p>
            {errors.vatRate && (
              <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                {errors.vatRate.message}
              </p>
            )}
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
                const numValue = Number(removeCommas(supplyValueDisplay) || 0)
                if (numValue > 0) {
                  setSupplyValueDisplay(formatNumber(numValue.toString()))
                }
              }}
              className={`mt-1 w-full h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300 ${highlightAmount ? 'bg-blue-100/30 dark:bg-blue-900/30' : ''
                }`}
              placeholder="(자동계산)"
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
              placeholder=""
            />
          </div>

          {/* 삭제 버튼 */}
          {canRemove && onRemove && (
            <div className="flex justify-center mt-3">
              <button
                type="button"
                onClick={onRemove}
                className="text-red-500 dark:text-red-400 text-sm font-medium hover:text-red-600 dark:hover:text-red-300 transition-colors"
              >
                품목 삭제
              </button>
            </div>
          )}
        </div>
      )}

      {/* ItemPickerSheet */}
      <ItemPickerSheet
        open={itemPickerOpen}
        onClose={() => setItemPickerOpen(false)}
        favorites={[]}
        recents={[]}
        onSelect={handleItemSelect}
      />
    </div>
  )
}

