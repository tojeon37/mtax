import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModalBase } from '../common/ModalBase'
import { Client } from '../../api/clientApi'
import { useAuth } from '../../hooks/useAuth'
import { useCustomerSearch } from '../../hooks/customer/useCustomerSearch'
import ClientForm from '../forms/ClientForm'

interface CustomerSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (client: Client) => void
  onAddNew?: () => void
}

export const CustomerSelectModal: React.FC<CustomerSelectModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingClose, setPendingClose] = useState<(() => void) | null>(null)
  const [formIsDirty, setFormIsDirty] = useState(false)
  
  const {
    searchQuery,
    setSearchQuery,
    recentClients,
    filteredClients,
    isLoading,
    loadClients,
    handleDelete: deleteClient,
    handleSelect: selectClient,
  } = useCustomerSearch(isOpen && !showForm, isAuthenticated)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [showMenu, setShowMenu] = useState<number | null>(null)

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      if (showMenu !== null) {
        setShowMenu(null)
      }
    }
    if (showMenu !== null) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showMenu])

  // 새로운 거래처 추가 핸들러
  const handleAddNewCustomer = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setFormIsDirty(false)
    setEditingClient(null)
    setShowForm(true)
  }

  const handleEdit = (client: Client) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setFormIsDirty(false)
    setEditingClient(client)
    setShowForm(true)
    setShowMenu(null)
  }

  const handleDelete = async (id: number) => {
    const success = await deleteClient(id)
    if (success) {
      setShowMenu(null)
    }
  }

  const handleFormCloseRequest = (closeCallback: () => void) => {
    // isDirty 상태일 때만 확인 모달 표시
    if (formIsDirty) {
      setPendingClose(() => closeCallback)
      setShowConfirmModal(true)
    } else {
      closeCallback()
    }
  }

  const handleConfirmClose = () => {
    if (pendingClose) {
      pendingClose()
    }
    setShowConfirmModal(false)
    setPendingClose(null)
    setShowForm(false)
    setEditingClient(null)
    setFormIsDirty(false)
    loadClients()
  }

  const handleCancelClose = () => {
    setShowConfirmModal(false)
    setPendingClose(null)
  }

  const handleFormClose = () => {
    setFormIsDirty(false)
    setShowForm(false)
    setEditingClient(null)
    loadClients()
  }

  const handleFormSuccess = () => {
    setFormIsDirty(false)
    setShowForm(false)
    setEditingClient(null)
    loadClients()
  }

  const handleSelect = (client: Client) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    // 3 dots 메뉴가 열려있으면 선택 무시
    if (showMenu === client.id) {
      return
    }

    selectClient(client, onSelect)
    onClose()
  }

  if (!isOpen) return null

  // 확인 모달
  if (showConfirmModal) {
    return (
      <ModalBase
        isOpen={showConfirmModal}
        onClose={handleCancelClose}
        title="확인"
        maxWidth="sm"
        closeOnClickOutside={false}
        closeOnEscape={false}
      >
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            입력 중인 내용이 있습니다. 정말 닫을까요?
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleCancelClose}
              className="flex-1 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleConfirmClose}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition"
            >
              닫기
            </button>
          </div>
        </div>
      </ModalBase>
    )
  }

  // 폼 모드
  if (showForm) {
    return (
      <ModalBase
        isOpen={isOpen}
        onClose={() => handleFormCloseRequest(handleFormClose)}
        title={editingClient ? '거래처 정보 수정' : '새 거래처 등록'}
        maxWidth="full"
        closeOnClickOutside={false}
        closeOnEscape={false}
      >
        <div 
          className="p-6" 
          onMouseDown={(e) => e.stopPropagation()} 
          onMouseUp={(e) => e.stopPropagation()}
        >
          <ClientForm
            client={editingClient}
            onSuccess={handleFormSuccess}
            onCancel={() => handleFormCloseRequest(handleFormClose)}
            onCloseRequest={handleFormCloseRequest}
            onDirtyChange={(isDirty) => {
              setFormIsDirty(isDirty)
            }}
          />
        </div>
      </ModalBase>
    )
  }

  // 목록 모드
  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="거래처 선택"
      maxWidth="full"
    >
      {/* 안내 문구 */}
      {!isAuthenticated && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-400 dark:text-gray-300 text-center">
            로그인하면 데이터를 등록하고 선택할 수 있습니다.
          </p>
        </div>
      )}

      {/* 검색 입력 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="거래처 검색..."
          disabled={!isAuthenticated}
          className={`w-full h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
            !isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          autoFocus={isAuthenticated}
        />
      </div>

      {/* 거래처 목록 */}
      <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              로딩 중...
            </div>
          ) : (
            <>
              {/* 최근 거래처 (검색어가 없을 때만 표시, 로그인된 경우에만) */}
              {isAuthenticated && !searchQuery && recentClients.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    최근 거래처
                  </p>
                  <div className="space-y-2">
                    {recentClients.map((client) => (
                      <button
                        key={client.id}
                        onClick={() => handleSelect(client)}
                        className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
                      >
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {client.companyName}
                        </div>
                        {client.businessNumber && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            사업자번호: {client.businessNumber}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 전체 거래처 목록 */}
              <div>
                <div className="flex items-center justify-between px-1 mb-3">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {searchQuery ? '검색 결과' : recentClients.length > 0 ? '전체 거래처' : '거래처'}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation() // 모달 닫기 방지
                      handleAddNewCustomer()
                    }}
                    disabled={!isAuthenticated}
                    className={`w-8 h-8 flex items-center justify-center rounded-full shadow active:scale-95 transition-all z-10 ${
                      isAuthenticated
                        ? 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                    aria-label="새로운 거래처 추가"
                  >
                    +
                  </button>
                </div>
                {filteredClients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {searchQuery ? '검색 결과가 없습니다' : '거래처가 없습니다'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredClients.map((client) => (
                      <div
                        key={client.id}
                        className={`relative p-4 bg-white dark:bg-gray-800 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 ${
                          isAuthenticated
                            ? 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                            : 'opacity-60 cursor-not-allowed'
                        }`}
                        onClick={() => handleSelect(client)}
                      >
                        {/* 3 dots 메뉴 버튼 (로그인된 경우에만 표시) */}
                        {isAuthenticated && (
                          <>
                            <button
                              className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl leading-none"
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowMenu(showMenu === client.id ? null : client.id)
                              }}
                            >
                              ⋮
                            </button>

                            {/* 더보기 메뉴 */}
                            {showMenu === client.id && (
                              <div
                                className="absolute right-4 top-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg py-2 w-32 z-20"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  onClick={() => handleEdit(client)}
                                >
                                  수정
                                </button>
                                <button
                                  className="w-full text-left px-3 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  onClick={() => handleDelete(client.id)}
                                >
                                  삭제
                                </button>
                              </div>
                            )}
                          </>
                        )}

                        <div className="font-semibold text-gray-900 dark:text-gray-100 pr-8">
                          {client.companyName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 space-y-1">
                          {client.businessNumber && (
                            <div>사업자번호: {client.businessNumber}</div>
                          )}
                          {client.ceoName && <div>대표자: {client.ceoName}</div>}
                          {client.address && <div>주소: {client.address}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            닫기
          </button>
        </div>
    </ModalBase>
  )
}

