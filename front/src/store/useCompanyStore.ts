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
      
      if (companies.length > 0) {
        // localStorage에서 저장된 회사 ID 확인
        const savedCompanyId = localStorage.getItem('lastSelectedCompanyId')
        if (savedCompanyId) {
          const savedCompany = companies.find(
            (c) => c.id === parseInt(savedCompanyId)
          )
          if (savedCompany) {
            set({ currentCompany: savedCompany })
            return
          }
        }
        
        // 저장된 ID가 없거나 유효하지 않으면 첫 번째 회사 사용
        set({ currentCompany: companies[0] })
        localStorage.setItem('lastSelectedCompanyId', companies[0].id.toString())
      }
    } catch (error) {
      console.error('회사 정보 로드 실패:', error)
    }
  },
}))

