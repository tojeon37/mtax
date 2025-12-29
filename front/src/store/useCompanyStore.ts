import { create } from 'zustand'
import { Company } from '../api/companyApi'

interface CompanyStore {
  currentCompany: Company | null
  setCurrentCompany: (company: Company | null) => void
  loadCurrentCompany: () => Promise<void>
}

export const useCompanyStore = create<CompanyStore>((set) => ({
  currentCompany: null,

  setCurrentCompany: (company) => {
    set({ currentCompany: company })
    // localStorage에도 저장
    if (company) {
      localStorage.setItem('lastSelectedCompanyId', company.id.toString())
    } else {
      localStorage.removeItem('lastSelectedCompanyId')
    }
  },

  loadCurrentCompany: async () => {
    try {
      const { getCompanies } = await import('../api/companyApi')
      const companies = await getCompanies()

      console.log('[useCompanyStore] 회사 목록 로드:', companies.length, '개')

      if (companies.length > 0) {
        // localStorage에서 저장된 회사 ID 확인
        const savedCompanyId = localStorage.getItem('lastSelectedCompanyId')
        if (savedCompanyId) {
          const savedCompany = companies.find(
            (c) => c.id === parseInt(savedCompanyId)
          )
          if (savedCompany) {
            console.log('[useCompanyStore] 저장된 회사 선택:', savedCompany.name)
            set({ currentCompany: savedCompany })
            return
          }
        }

        // 저장된 ID가 없거나 유효하지 않으면 첫 번째 회사 사용
        console.log('[useCompanyStore] 첫 번째 회사 선택:', companies[0].name)
        set({ currentCompany: companies[0] })
        localStorage.setItem('lastSelectedCompanyId', companies[0].id.toString())
      } else {
        console.log('[useCompanyStore] 등록된 회사가 없습니다.')
        set({ currentCompany: null })
      }
    } catch (error) {
      console.error('[useCompanyStore] 회사 정보 로드 실패:', error)
      set({ currentCompany: null })
    }
  },
}))
