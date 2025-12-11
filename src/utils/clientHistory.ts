/**
 * 거래처 사용 이력 관리 유틸리티
 */

interface ClientUsageHistory {
  clientId: number
  usageCount: number
  lastUsedAt: string // ISO date string
}

const STORAGE_KEY = 'client_usage_history'

/**
 * 거래처 사용 이력 가져오기
 */
export const getClientUsageHistory = (): Record<number, ClientUsageHistory> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

/**
 * 거래처 사용 이력 저장
 */
export const saveClientUsageHistory = (history: Record<number, ClientUsageHistory>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch (error) {
    console.error('거래처 사용 이력 저장 실패:', error)
  }
}

/**
 * 거래처 사용 기록 추가/업데이트
 */
export const recordClientUsage = (clientId: number) => {
  const history = getClientUsageHistory()
  const now = new Date().toISOString()
  
  if (history[clientId]) {
    // 기존 기록이 있으면 사용 횟수 증가 및 마지막 사용 시간 업데이트
    history[clientId] = {
      ...history[clientId],
      usageCount: history[clientId].usageCount + 1,
      lastUsedAt: now,
    }
  } else {
    // 새 기록 생성
    history[clientId] = {
      clientId,
      usageCount: 1,
      lastUsedAt: now,
    }
  }
  
  saveClientUsageHistory(history)
}

/**
 * 거래처 목록을 사용 빈도와 마지막 사용 시간 기준으로 정렬
 */
export const sortClientsByUsage = <T extends { id: number }>(
  clients: T[]
): T[] => {
  const history = getClientUsageHistory()
  
  return [...clients].sort((a, b) => {
    const historyA = history[a.id]
    const historyB = history[b.id]
    
    // 둘 다 사용 이력이 없는 경우: 등록 순서 유지 (id 기준)
    if (!historyA && !historyB) {
      return a.id - b.id
    }
    
    // 사용 이력이 있는 것이 우선
    if (historyA && !historyB) return -1
    if (!historyA && historyB) return 1
    
    // 둘 다 사용 이력이 있는 경우
    if (historyA && historyB) {
      // 1순위: 사용 횟수 (많은 것 우선)
      if (historyA.usageCount !== historyB.usageCount) {
        return historyB.usageCount - historyA.usageCount
      }
      // 2순위: 마지막 사용 시간 (최근 것 우선)
      return new Date(historyB.lastUsedAt).getTime() - new Date(historyA.lastUsedAt).getTime()
    }
    
    return 0
  })
}

/**
 * 최근 사용한 거래처 N개 가져오기
 */
export const getRecentClients = <T extends { id: number }>(
  clients: T[],
  limit: number = 3
): T[] => {
  const sorted = sortClientsByUsage(clients)
  return sorted.slice(0, limit)
}

