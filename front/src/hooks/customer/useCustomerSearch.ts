/**
 * 거래처 검색 및 필터링 로직 Hook
 */
import { useState, useEffect } from 'react'
import { getClients, Client, deleteClient } from '../../api/clientApi'
import { getRecentClients, recordClientUsage } from '../../utils/clientHistory'

export const useCustomerSearch = (isOpen: boolean, isAuthenticated: boolean) => {
  const [clients, setClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [recentClients, setRecentClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // 거래처 목록 로드
  const loadClients = async () => {
    if (!isAuthenticated) {
      setClients([])
      setRecentClients([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const allClients = await getClients()
      setClients(allClients)
      const recent = getRecentClients<Client>(allClients, 3)
      setRecentClients(recent)
    } catch (error) {
      console.error('거래처 목록 로드 실패:', error)
      setClients([])
      setRecentClients([])
    } finally {
      setIsLoading(false)
    }
  }

  // 거래처 목록 로드 (모달이 열릴 때)
  useEffect(() => {
    if (isOpen) {
      loadClients()
    }
  }, [isOpen, isAuthenticated])

  // 검색 필터링
  const filteredClients = clients.filter((client) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      client.companyName?.toLowerCase().includes(query) ||
      client.businessNumber?.includes(query) ||
      client.ceoName?.toLowerCase().includes(query)
    )
  })

  // 거래처 삭제
  const handleDelete = async (id: number): Promise<boolean> => {
    if (!confirm('정말 삭제하시겠습니까?')) {
      return false
    }

    try {
      await deleteClient(id)
      await loadClients()
      return true
    } catch (e) {
      console.error('거래처 삭제 실패:', e)
      alert('거래처 삭제에 실패했습니다. 다시 시도해주세요.')
      return false
    }
  }

  // 거래처 선택 처리
  const handleSelect = (client: Client, onSelect: (client: Client) => void) => {
    try {
      recordClientUsage(client.id)
    } catch (e) {
      // 에러 무시
    }
    onSelect(client)
  }

  return {
    clients,
    searchQuery,
    setSearchQuery,
    recentClients,
    filteredClients,
    isLoading,
    loadClients,
    handleDelete,
    handleSelect,
  }
}

