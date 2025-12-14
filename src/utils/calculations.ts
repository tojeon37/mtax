import { removeCommas } from './numberFormat'

export interface InvoiceItem {
  id: string
  item: string
  specification: string
  quantity: string
  unitPrice: string
  total: string
  supplyValue: string
  taxAmount: string
  remarks: string
}

/**
 * 품목의 공급가액과 세액 계산
 */
export const calculateItemAmounts = (quantity: string, unitPrice: string) => {
  const qty = parseFloat(removeCommas(quantity)) || 0
  const price = parseFloat(removeCommas(unitPrice)) || 0
  const supplyValue = qty * price
  const taxAmount = Math.floor(supplyValue * 0.1) // 부가세 10%
  const total = supplyValue + taxAmount
  
  return {
    supplyValue: supplyValue.toString(),
    taxAmount: taxAmount.toString(),
    total: total.toString(),
  }
}

/**
 * 전체 합계 계산
 */
export const calculateTotals = (items: InvoiceItem[]) => {
  let total = 0
  let supply = 0
  let tax = 0

  items.forEach(item => {
    const itemTotal = parseFloat(removeCommas(item.total)) || 0
    const itemSupply = parseFloat(removeCommas(item.supplyValue)) || 0
    const itemTax = parseFloat(removeCommas(item.taxAmount)) || 0

    total += itemTotal
    supply += itemSupply
    tax += itemTax
  })

  return {
    totalAmount: total.toString(),
    supplyValue: supply.toString(),
    taxAmount: tax.toString(),
  }
}






