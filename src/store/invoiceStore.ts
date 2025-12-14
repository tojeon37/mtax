import { create } from 'zustand'

export interface Item {
  id: string
  name: string
  specification?: string
  quantity?: number
  unitPrice?: number
  supplyValue: number
  note?: string
}

export interface Buyer {
  id?: string
  name: string
  businessNumber?: string
  ceoName?: string
  address?: string
  email?: string
  businessType?: string
  businessItem?: string
}

interface InvoiceState {
  items: Item[]
  buyer: Buyer | null
  supplyValue: number
  taxAmount: number
  totalAmount: number
  paymentType: 'receipt' | 'invoice' // 영수/청구
  paymentMethod: 'cash' | 'credit' | 'check' | 'bill' // 결제수단: 현금/외상미수금/수표/어음
  issueDate: string
  expandedItemId: string | null
  setBuyer: (buyer: Buyer | null) => void
  addItem: () => void
  updateItem: (id: string, updates: Partial<Item>) => void
  removeItem: (id: string) => void
  setSupplyValue: (value: number) => void
  setPaymentType: (type: 'receipt' | 'invoice') => void
  setPaymentMethod: (method: 'cash' | 'credit' | 'check' | 'bill') => void
  setIssueDate: (date: string) => void
  setExpandedItemId: (id: string | null) => void
  resetInvoice: () => void
  calculateTotals: () => void
}

const createDefaultItem = (): Item => ({
  id: Date.now().toString(),
  name: '',
  supplyValue: 0,
})

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  items: [createDefaultItem()],
  buyer: null,
  supplyValue: 0,
  taxAmount: 0,
  totalAmount: 0,
  paymentType: 'receipt',
  paymentMethod: 'cash',
  issueDate: new Date().toISOString().split('T')[0],
  expandedItemId: null,

  setBuyer: (buyer) => set({ buyer }),

  setExpandedItemId: (id) => set({ expandedItemId: id }),

  addItem: () =>
    set((state) => ({
      items: [...state.items, createDefaultItem()],
    })),

  updateItem: (id, updates) =>
    set((state) => {
      let updatedItems = state.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
      
      // 공급가액 자동 계산 (수량 * 단가가 업데이트된 경우)
      updatedItems = updatedItems.map((item) => {
        if (item.id === id && (updates.quantity !== undefined || updates.unitPrice !== undefined)) {
          const qty = updates.quantity ?? item.quantity ?? 0
          const price = updates.unitPrice ?? item.unitPrice ?? 0
          return { ...item, supplyValue: qty * price }
        }
        return item
      })

      // 전체 공급가액 재계산 (항상 수행)
      const totalSupply = updatedItems.reduce((sum, item) => sum + (item.supplyValue || 0), 0)
      const tax = totalSupply * 0.1
      const total = totalSupply + tax

      return {
        items: updatedItems,
        supplyValue: totalSupply,
        taxAmount: tax,
        totalAmount: total,
      }
    }),

  removeItem: (id) =>
    set((state) => {
      const newItems = state.items.filter((item) => item.id !== id)
      if (newItems.length === 0) {
        newItems.push(createDefaultItem())
      }
      
      const totalSupply = newItems.reduce((sum, item) => sum + item.supplyValue, 0)
      const tax = totalSupply * 0.1
      const total = totalSupply + tax

      return {
        items: newItems,
        supplyValue: totalSupply,
        taxAmount: tax,
        totalAmount: total,
      }
    }),

  setSupplyValue: (value) => {
    const tax = value * 0.1
    const total = value + tax
    set({ supplyValue: value, taxAmount: tax, totalAmount: total })
  },

  setPaymentType: (type) => set({ paymentType: type }),

  setPaymentMethod: (method) => set({ paymentMethod: method }),

  setIssueDate: (date) => set({ issueDate: date }),

  resetInvoice: () =>
    set({
      items: [createDefaultItem()],
      buyer: null,
      supplyValue: 0,
      taxAmount: 0,
      totalAmount: 0,
      paymentType: 'receipt',
      paymentMethod: 'cash',
      issueDate: new Date().toISOString().split('T')[0],
      expandedItemId: null,
    }),

  calculateTotals: () => {
    const state = get()
    const totalSupply = state.items.reduce((sum, item) => sum + item.supplyValue, 0)
    const tax = totalSupply * 0.1
    const total = totalSupply + tax
    set({ supplyValue: totalSupply, taxAmount: tax, totalAmount: total })
  },
}))

