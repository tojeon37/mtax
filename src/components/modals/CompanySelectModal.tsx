import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModalBase } from '../common/ModalBase'
import { getCompanies, deleteCompany, Company } from '../../api/companyApi'
import { useCompanyStore } from '../../store/useCompanyStore'
import { useAuth } from '../../hooks/useAuth'
import CompanyForm from '../forms/CompanyForm'

interface CompanySelectModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (company: Company) => void
  onAddNew?: () => void
}

export const CompanySelectModal: React.FC<CompanySelectModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  onAddNew,
}) => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [showMenu, setShowMenu] = useState<number | null>(null)
  const { setCurrentCompany } = useCompanyStore()

  useEffect(() => {
    if (isOpen && !showForm) {
      // 로그인된 경우에만 데이터 로드
      if (isAuthenticated) {
        loadCompanies()
      } else {
        // 비로그인 시 빈 배열로 설정
        setCompanies([])
        setLoading(false)
      }
    }
  }, [isOpen, showForm, isAuthenticated])

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

  const loadCompanies = async () => {
    try {
      setLoading(true)
      const data = await getCompanies()
      setCompanies(data || [])
    } catch (e) {
      console.error('회사 목록 불러오기 실패:', e)
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (company: Company) => {
    // 로그인 체크
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    
    // 3 dots 메뉴가 열려있으면 선택 무시
    if (showMenu === company.id) {
      return
    }
    setCurrentCompany(company)
    onSelect(company)
    onClose()
  }

  const handleEdit = (company: Company) => {
    // 로그인 체크
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    
    setEditingCompany(company)
    setShowForm(true)
    setShowMenu(null)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) {
      return
    }
    try {
      await deleteCompany(id)
      loadCompanies()
      setShowMenu(null)
    } catch (e) {
      console.error('회사 삭제 실패:', e)
      alert('회사 삭제에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const handleAddNew = () => {
    // 로그인 체크
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    
    setEditingCompany(null)
    setShowForm(true)
    if (onAddNew) {
      onAddNew()
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingCompany(null)
    loadCompanies()
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingCompany(null)
    loadCompanies()
  }

  if (!isOpen) return null

  // 폼 모드
  if (showForm) {
    return (
      <ModalBase
        isOpen={isOpen}
        onClose={handleFormClose}
        title={editingCompany ? '회사 정보 수정' : '새 회사 등록'}
        maxWidth="full"
      >
        <div className="p-6">
          <CompanyForm
            company={editingCompany}
            onSuccess={handleFormSuccess}
            onCancel={handleFormClose}
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
      title="우리회사 선택"
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

      {/* 검색 입력 (필요시 추가) */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            발행에 사용할 회사를 선택하세요
          </p>
          <button
            onClick={handleAddNew}
            disabled={!isAuthenticated}
            className={`w-8 h-8 flex items-center justify-center rounded-full shadow active:scale-95 transition-all ${
              isAuthenticated
                ? 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
            aria-label="새 회사 추가"
          >
            +
          </button>
        </div>
      </div>

      {/* 회사 목록 */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            로딩 중...
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-gray-500 dark:text-gray-400">
              등록된 회사가 없습니다.
            </div>
            {!isAuthenticated && (
              <div className="mt-4 text-sm text-gray-400 dark:text-gray-300">
                상단의 + 버튼을 눌러 새 회사를 등록하세요.
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {companies.map((company) => (
              <div
                key={company.id}
                className={`relative p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 transition-all ${
                  isAuthenticated
                    ? 'hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-gray-700 dark:active:bg-gray-600 cursor-pointer hover:shadow-lg'
                    : 'opacity-60 cursor-not-allowed'
                }`}
                onClick={() => handleSelect(company)}
              >
                {/* 3 dots 메뉴 버튼 (로그인된 경우에만 표시) */}
                {isAuthenticated && (
                  <>
                    <button
                      className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl leading-none"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowMenu(showMenu === company.id ? null : company.id)
                      }}
                    >
                      ⋮
                    </button>

                    {/* 더보기 메뉴 */}
                    {showMenu === company.id && (
                      <div
                        className="absolute right-4 top-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg py-2 w-32 z-20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => handleEdit(company)}
                        >
                          수정
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleDelete(company.id)}
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </>
                )}

                <div className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2 pr-8">
                  {company.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  사업자번호: {company.businessNumber}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  대표자명: {company.ceoName}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {company.bizType} / {company.bizClass}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {company.address}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {company.email}
                </div>
                {company.memo && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    비고: {company.memo}
                  </div>
                )}
              </div>
            ))}
          </div>
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

