import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getCompanies, deleteCompany, Company } from '../api/companyApi'
import { useCompanyStore } from '../store/useCompanyStore'
import { PlusButton } from '../components/ui/PlusButton'

const CompanyListPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCompanies()
  }, [location.pathname]) // 경로가 변경될 때마다 목록 다시 불러오기

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

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) {
      return
    }
    try {
      await deleteCompany(id)
      loadCompanies()
    } catch (e) {
      console.error('회사 삭제 실패:', e)
      alert('회사 삭제에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const handleEdit = (id: number) => {
    navigate(`/company/edit/${id}`)
  }

  const handleAddNew = () => {
    navigate('/company/new')
  }

  const { setCurrentCompany } = useCompanyStore()

  const handleCardClick = (company: Company) => {
    // 3 dots 메뉴가 열려있으면 카드 클릭 무시
    if (showMenu === company.id) {
      return
    }
    // 전역 스토어에 회사 정보 저장
    setCurrentCompany(company)
    // 발행 페이지로 이동하며 URL에 companyId 추가
    navigate(`/invoice/quick?companyId=${company.id}`)
  }

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

  return (
    <div className="px-4 py-6 pb-24">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          우리회사 관리
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          사업자 정보를 관리하세요.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">로딩 중...</div>
      ) : companies.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            등록된 회사가 없습니다.
          </div>
          <button
            onClick={handleAddNew}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
          >
            새 회사 등록하기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {companies.map((company) => (
            <div
              key={company.id}
              className="relative p-4 bg-white hover:bg-gray-50 active:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 dark:active:bg-gray-600 rounded-lg shadow border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-all"
              onClick={() => handleCardClick(company)}
            >
              {/* 3 dots 메뉴 버튼 */}
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
                    onClick={() => {
                      handleEdit(company.id)
                      setShowMenu(null)
                    }}
                  >
                    수정
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => {
                      handleDelete(company.id)
                      setShowMenu(null)
                    }}
                  >
                    삭제
                  </button>
                </div>
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

      {/* Floating Add Button */}
      <div className="fixed bottom-20 right-4 z-10">
        <PlusButton onClick={handleAddNew} ariaLabel="새 회사 추가" />
      </div>
    </div>
  )
}

export default CompanyListPage

