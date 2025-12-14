import React, { useState, useEffect } from 'react'
import { Item } from '../../store/invoiceStore'
import { Input } from '../ui/Input'
import { ItemPickerSheet, saveRecentItem } from './ItemPickerSheet'

interface ItemRowProps {
  item: Item
  onUpdate: (updates: Partial<Item>) => void
  onRemove: () => void
  canRemove: boolean
}

export const ItemRow: React.FC<ItemRowProps> = ({
  item,
  onUpdate,
  onRemove,
  canRemove,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [itemPickerOpen, setItemPickerOpen] = useState(false)

  const handleSupplyValueChange = (value: string) => {
    const numValue = Number(value || 0)
    onUpdate({ supplyValue: numValue })
  }

  const handleQuantityPriceChange = (qty: string, price: string) => {
    const quantity = Number(qty || 0)
    const unitPrice = Number(price || 0)
    onUpdate({
      quantity,
      unitPrice,
      supplyValue: quantity * unitPrice,
    })
  }

  const handleItemSelect = (selectedItem: Item) => {
    onUpdate({
      name: selectedItem.name,
      specification: selectedItem.specification ?? '',
      unitPrice: selectedItem.unitPrice,
      quantity: item.quantity || 1,
      supplyValue: (item.quantity || 1) * (selectedItem.unitPrice || 0),
    })
  }

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

  return (
    <div className="border-b border-gray-200 pb-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="품목명을 입력하거나 선택하세요"
            value={item.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full h-12 px-4 pr-14 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => setItemPickerOpen(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-12 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 transition-colors z-10"
            aria-label="자주 사용하는 품목 선택"
            type="button"
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
        {canRemove && (
          <button
            onClick={onRemove}
            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            삭제
          </button>
        )}
      </div>

      <div className="mb-2">
        <Input
          placeholder="공급가액"
          type="number"
          value={item.supplyValue || ''}
          onChange={(e) => handleSupplyValueChange(e.target.value)}
        />
      </div>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-gray-500 hover:text-gray-700 mb-2"
      >
        {isExpanded ? '▲ 접기' : '▼ 규격/수량/단가 입력'}
      </button>

      {isExpanded && (
        <div className="space-y-2 mt-2 pl-2 border-l-2 border-gray-200">
          <Input
            placeholder="규격"
            value={item.specification || ''}
            onChange={(e) => onUpdate({ specification: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="수량"
              type="number"
              value={item.quantity || ''}
              onChange={(e) =>
                handleQuantityPriceChange(
                  e.target.value,
                  item.unitPrice?.toString() || ''
                )
              }
            />
            <Input
              placeholder="단가"
              type="number"
              value={item.unitPrice || ''}
              onChange={(e) =>
                handleQuantityPriceChange(
                  item.quantity?.toString() || '',
                  e.target.value
                )
              }
            />
          </div>
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

