/**
 * 빠른 세금계산서 발행 관련 로직 Hook
 */
import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useInvoiceStore } from '../../store/invoiceStore'
import { useCompanyStore } from '../../store/useCompanyStore'
import { useAuth } from '../useAuth'
import { getClients, Client } from '../../api/clientApi'
import { getCompanies } from '../../api/companyApi'
import { recordClientUsage } from '../../utils/clientHistory'
import { Company } from '../../api/companyApi'

export const useQuickInvoice = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)
  const clientId = params.get('clientId') || params.get('customerId')
  const companyId = params.get('companyId')
  
  const {
    buyer,
    items,
    addItem,
    updateItem,
    removeItem,
    setBuyer,
    expandedItemId,
    setExpandedItemId,
  } = useInvoiceStore()
  
  const { currentCompany, setCurrentCompany, loadCurrentCompany } = useCompanyStore()
  const { isAuthenticated } = useAuth()
  
  const [buyerSearch, setBuyerSearch] = useState('')
  const [isCustomerModalOpen, setCustomerModalOpen] = useState(false)
  const [isCompanyModalOpen, setCompanyModalOpen] = useState(false)

  // 거래처 정보 가져오기
  const fetchClient = async (id: string) => {
    try {
      const clients = await getClients()
      const client = clients.find((c: any) => c.id === parseInt(id))
      if (!client) {
        throw new Error('거래처를 찾을 수 없습니다.')
      }
      return {
        id: client.id.toString(),
        name: client.companyName,
        bizNo: client.businessNumber,
        address: client.address,
        email: client.email,
        type: client.businessType,
      }
    } catch (e) {
      console.error('거래처 정보 불러오기 실패:', e)
      throw e
    }
  }

  // 페이지 마운트 시 자동 네트워크 요청 제거
  // 발행 플로우는 버튼 클릭 이벤트에서만 실행됨

  // MainPage에서 선택된 거래처 정보 받기
  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    if (!clientId) {
      const selectedClient = (location.state as any)?.selectedClient
      if (selectedClient) {
        if (selectedClient.id) {
          recordClientUsage(parseInt(selectedClient.id))
        }
        setBuyer({
          id: selectedClient.id,
          name: selectedClient.companyName,
          businessNumber: selectedClient.businessNumber,
          ceoName: selectedClient.ceoName,
          address: selectedClient.address,
          email: selectedClient.email,
          businessType: selectedClient.businessType,
          businessItem: selectedClient.businessItem,
        })
        setBuyerSearch(selectedClient.companyName)
      }
    }
  }, [location.state, clientId, setBuyer, isAuthenticated])

  // 품목 추가 핸들러
  const handleAddItem = () => {
    addItem()
    setTimeout(() => {
      const newItems = useInvoiceStore.getState().items
      if (newItems.length > 0) {
        setExpandedItemId(newItems[newItems.length - 1].id)
      }
    }, 0)
  }

  // 품목 삭제 핸들러
  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId)
    if (expandedItemId === itemId && items.length > 1) {
      const remainingItems = items.filter(i => i.id !== itemId)
      setExpandedItemId(remainingItems[0]?.id || null)
    }
  }

  // 거래처 선택 핸들러
  const handleSelectCustomer = (client: Client) => {
    setBuyer({
      id: client.id.toString(),
      name: client.companyName,
      businessNumber: client.businessNumber,
      ceoName: client.ceoName,
      address: client.address,
      email: client.email,
      businessType: client.businessType,
      businessItem: client.businessItem,
    })
    setBuyerSearch('')
  }

  // 회사 선택 핸들러
  const handleSelectCompany = (company: Company) => {
    setCurrentCompany(company)
  }

  return {
    buyer,
    buyerSearch,
    setBuyerSearch,
    items,
    updateItem,
    expandedItemId,
    setExpandedItemId,
    currentCompany,
    isAuthenticated,
    isCustomerModalOpen,
    setCustomerModalOpen,
    isCompanyModalOpen,
    setCompanyModalOpen,
    handleAddItem,
    handleRemoveItem,
    handleSelectCustomer,
    handleSelectCompany,
    navigate,
    location,
  }
}

