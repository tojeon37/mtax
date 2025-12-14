import React, { useState, useEffect, useMemo } from 'react'
import { Item } from '../../store/invoiceStore'
import { Input } from '../ui/Input'

interface ItemPickerSheetProps {
  open: boolean
  onClose: () => void
  favorites: Item[]
  recents: Item[]
  onSelect: (item: Item) => void
}

// 더미 데이터 (TODO: 실제 API 연결 필요)
const DUMMY_FAVORITES: Item[] = [
  {
    id: '1',
    name: '컴퓨터',
    specification: '데스크탑',
    unitPrice: 1500000,
    supplyValue: 1500000,
  },
  {
    id: '2',
    name: '모니터',
    specification: '27인치',
    unitPrice: 300000,
    supplyValue: 300000,
  },
  {
    id: '3',
    name: '키보드',
    specification: '기계식',
    unitPrice: 150000,
    supplyValue: 150000,
  },
  {
    id: '4',
    name: '마우스',
    specification: '무선',
    unitPrice: 50000,
    supplyValue: 50000,
  },
  {
    id: '5',
    name: '의자',
    specification: '사무용',
    unitPrice: 200000,
    supplyValue: 200000,
  },
  {
    id: '6',
    name: '책상',
    specification: 'L자형',
    unitPrice: 400000,
    supplyValue: 400000,
  },
  {
    id: '7',
    name: '프린터',
    specification: '잉크젯',
    unitPrice: 250000,
    supplyValue: 250000,
  },
  {
    id: '8',
    name: '스캐너',
    specification: 'A4',
    unitPrice: 180000,
    supplyValue: 180000,
  },
]

const DUMMY_RECENTS: Item[] = [
  {
    id: 'r1',
    name: '노트북',
    specification: '15인치',
    unitPrice: 2000000,
    supplyValue: 2000000,
  },
  {
    id: 'r2',
    name: '헤드셋',
    specification: '무선',
    unitPrice: 120000,
    supplyValue: 120000,
  },
  {
    id: 'r3',
    name: '웹캠',
    specification: 'FHD',
    unitPrice: 80000,
    supplyValue: 80000,
  },
]

// localStorage 키
const RECENT_ITEMS_KEY = 'recent_items'
const FAVORITE_ITEMS_KEY = 'favorite_items'

// 최근 사용 품목 저장
export const saveRecentItem = (item: Item) => {
  try {
    const stored = localStorage.getItem(RECENT_ITEMS_KEY)
    const recentItems: Item[] = stored ? JSON.parse(stored) : []
    
    // 중복 제거 (같은 이름의 품목이 있으면 제거)
    const filtered = recentItems.filter(i => i.name !== item.name)
    
    // 새 항목을 맨 앞에 추가
    const updated = [
      {
        ...item,
        id: `recent_${Date.now()}`,
      },
      ...filtered,
    ].slice(0, 10) // 최대 10개만 유지
    
    localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save recent item:', error)
  }
}

// 최근 사용 품목 불러오기
export const getRecentItems = (): Item[] => {
  try {
    const stored = localStorage.getItem(RECENT_ITEMS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to load recent items:', error)
    return []
  }
}

// 자주 사용하는 품목 저장
export const saveFavoriteItems = (items: Item[]) => {
  try {
    localStorage.setItem(FAVORITE_ITEMS_KEY, JSON.stringify(items))
  } catch (error) {
    console.error('Failed to save favorite items:', error)
  }
}

// 자주 사용하는 품목 불러오기
export const getFavoriteItems = (): Item[] => {
  try {
    const stored = localStorage.getItem(FAVORITE_ITEMS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to load favorite items:', error)
    return []
  }
}

export const ItemPickerSheet: React.FC<ItemPickerSheetProps> = ({
  open,
  onClose,
  favorites,
  recents,
  onSelect,
}) => {
  // 관리 모드 상태
  const [isManageMode, setIsManageMode] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ name: string; specification: string; unitPrice: string }>({
    name: '',
    specification: '',
    unitPrice: '',
  })
  
  // localStorage에서 자주 사용하는 품목 불러오기
  const [localFavorites, setLocalFavorites] = useState<Item[]>([])
  
  // localStorage에서 최근 사용 품목 불러오기
  const [localRecents, setLocalRecents] = useState<Item[]>([])
  
  useEffect(() => {
    if (open) {
      // 자주 사용하는 품목 불러오기
      const storedFavorites = getFavoriteItems()
      const mergedFavorites = favorites && favorites.length > 0 
        ? favorites 
        : storedFavorites.length > 0 
          ? storedFavorites 
          : DUMMY_FAVORITES
      setLocalFavorites(mergedFavorites)
      
      // 최근 사용 품목 불러오기
      const storedRecents = getRecentItems()
      const mergedRecents = recents && recents.length > 0 
        ? [...recents, ...storedRecents.filter(r => !recents.some(rec => rec.name === r.name))]
        : storedRecents.length > 0 
          ? storedRecents 
          : DUMMY_RECENTS
      setLocalRecents(mergedRecents.slice(0, 10))
      
      // 모달이 열릴 때 관리 모드 초기화
      setIsManageMode(false)
      setEditingItemId(null)
    }
  }, [open, favorites, recents])
  
  const displayFavorites = localFavorites
  const displayRecents = localRecents.length > 0 ? localRecents : DUMMY_RECENTS
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce 검색어 (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // 검색 필터링
  const filteredFavorites = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return displayFavorites
    }
    const query = debouncedQuery.toLowerCase()
    return displayFavorites.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.specification?.toLowerCase().includes(query)
    )
  }, [displayFavorites, debouncedQuery])

  const filteredRecents = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return displayRecents
    }
    const query = debouncedQuery.toLowerCase()
    return displayRecents.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.specification?.toLowerCase().includes(query)
    )
  }, [displayRecents, debouncedQuery])

  const handleSelect = (item: Item) => {
    if (isManageMode) return // 관리 모드에서는 선택 비활성화
    onSelect(item)
    onClose()
    setSearchQuery('')
  }

  const handleEdit = (item: Item, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingItemId(item.id)
    setEditForm({
      name: item.name,
      specification: item.specification || '',
      unitPrice: item.unitPrice?.toString() || '',
    })
  }

  const handleSaveEdit = (itemId: string) => {
    const updatedFavorites = displayFavorites.map(item => {
      if (item.id === itemId) {
        const unitPrice = Number(editForm.unitPrice.replace(/,/g, '')) || 0
        return {
          ...item,
          name: editForm.name.trim(),
          specification: editForm.specification.trim(),
          unitPrice,
          supplyValue: unitPrice * (item.quantity || 1),
        }
      }
      return item
    })
    
    setLocalFavorites(updatedFavorites)
    saveFavoriteItems(updatedFavorites)
    setEditingItemId(null)
    setEditForm({ name: '', specification: '', unitPrice: '' })
    
    // TODO: 실제 API 연동 시 이 부분에서 API 호출
  }

  const handleCancelEdit = () => {
    setEditingItemId(null)
    setEditForm({ name: '', specification: '', unitPrice: '' })
  }

  const handleDelete = (itemId: string, itemName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm(`"${itemName}" 품목을 삭제할까요?`)) {
      const updatedFavorites = displayFavorites.filter(item => item.id !== itemId)
      setLocalFavorites(updatedFavorites)
      saveFavoriteItems(updatedFavorites)
      
      // TODO: 실제 API 연동 시 이 부분에서 API 호출
    }
  }

  const formatPrice = (price?: number) => {
    if (!price) return '0원'
    return `${price.toLocaleString('ko-KR')}원`
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" />

      {/* Bottom Sheet */}
      <div
        className="relative w-full max-w-[480px] max-h-[85vh] bg-white dark:bg-gray-800 rounded-t-2xl shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {isManageMode ? '자주 사용하는 품목 관리' : '자주 사용하는 품목'}
          </h2>
          <div className="flex items-center gap-2">
            {isManageMode && (
              <button
                onClick={() => {
                  setIsManageMode(false)
                  setEditingItemId(null)
                }}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                완료
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="닫기"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Input
            placeholder="품목명 검색 (선택)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* 최근 사용 섹션 */}
          {filteredRecents.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                최근 사용
              </h3>
              <div className="flex flex-wrap gap-2">
                {filteredRecents.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors min-h-[52px]"
                  >
                    {item.name}
                    {item.specification && (
                      <span className="text-gray-500 dark:text-gray-400 ml-1">
                        ({item.specification})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 자주 사용하는 품목 섹션 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              자주 사용하는 품목
            </h3>
            {filteredFavorites.length > 0 ? (
              <div className="space-y-2">
                {filteredFavorites.map((item) => (
                  editingItemId === item.id ? (
                    // 수정 모드
                    <div
                      key={item.id}
                      className="w-full p-[10px] bg-white dark:bg-gray-700 border border-blue-300 dark:border-blue-600 rounded-lg min-h-[52px]"
                    >
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="품목명"
                          className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                        <input
                          type="text"
                          value={editForm.specification}
                          onChange={(e) => setEditForm({ ...editForm, specification: e.target.value })}
                          placeholder="규격 (선택)"
                          className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                        <input
                          type="text"
                          value={editForm.unitPrice}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '')
                            setEditForm({ ...editForm, unitPrice: value })
                          }}
                          placeholder="단가"
                          className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                          >
                            저장
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 text-sm font-medium"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // 일반 모드
                    <div
                      key={item.id}
                      className={`w-full p-[10px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors min-h-[52px] ${
                        !isManageMode ? 'hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer' : ''
                      }`}
                      onClick={() => handleSelect(item)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            {item.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {item.specification ? (
                              <>규격: {item.specification} · 단가 {formatPrice(item.unitPrice)}</>
                            ) : (
                              <>단가 {formatPrice(item.unitPrice)}</>
                            )}
                          </div>
                        </div>
                        {isManageMode && (
                          <div className="flex items-center gap-2 ml-2">
                            <button
                              onClick={(e) => handleEdit(item, e)}
                              className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              aria-label="수정"
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
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => handleDelete(item.id, item.name, e)}
                              className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              aria-label="삭제"
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {debouncedQuery.trim()
                  ? '검색 결과가 없어요.'
                  : '아직 저장된 품목이 없어요.'}
              </div>
            )}
          </div>
        </div>

        {/* 하단 고정 영역 */}
        {!isManageMode && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setIsManageMode(true)}
              className="w-full py-3 text-center text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-sm"
            >
              ⚙ 자주 사용하는 품목 관리
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

