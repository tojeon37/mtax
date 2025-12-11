import React, { useState } from 'react'
import { Item } from '../../store/invoiceStore'
import { Input } from '../ui/Input'

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

  const handleSupplyValueChange = (value: string) => {
    const numValue = parseFloat(value) || 0
    onUpdate({ supplyValue: numValue })
  }

  const handleQuantityPriceChange = (qty: string, price: string) => {
    const quantity = parseFloat(qty) || 0
    const unitPrice = parseFloat(price) || 0
    onUpdate({
      quantity,
      unitPrice,
      supplyValue: quantity * unitPrice,
    })
  }

  return (
    <div className="border-b border-gray-200 pb-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Input
          placeholder="품목명"
          value={item.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="flex-1"
        />
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
                  item.unitPrice?.toString() || '0'
                )
              }
            />
            <Input
              placeholder="단가"
              type="number"
              value={item.unitPrice || ''}
              onChange={(e) =>
                handleQuantityPriceChange(
                  item.quantity?.toString() || '0',
                  e.target.value
                )
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}

