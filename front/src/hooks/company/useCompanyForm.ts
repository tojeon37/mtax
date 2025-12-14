/**
 * 회사 정보 폼 관리 Hook
 */
import { useState, useEffect } from 'react'
import { createCompany, updateCompany, Company } from '../../api/companyApi'
import { autoLinkBarobill } from '../../api/barobillApi'

export interface CompanyFormData {
  businessNumber: string
  name: string
  ceoName: string
  bizType: string
  bizClass: string
  address: string
  addressDetail: string
  email: string
  tel: string
  hp: string
  memo: string
}

export const useCompanyForm = (company?: Company | null) => {
  const isNew = !company

  const [form, setForm] = useState<CompanyFormData>({
    businessNumber: '',
    name: '',
    ceoName: '',
    bizType: '',
    bizClass: '',
    address: '',
    addressDetail: '',
    email: '',
    tel: '',
    hp: '',
    memo: '',
  })

  const [loading, setLoading] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [pendingCompanyId, setPendingCompanyId] = useState<number | null>(null)

  // 기존 회사 정보로 폼 초기화
  useEffect(() => {
    if (!isNew && company) {
      setForm({
        businessNumber: company.businessNumber || '',
        name: company.name || '',
        ceoName: company.ceoName || '',
        bizType: company.bizType || '',
        bizClass: company.bizClass || '',
        address: company.address || '',
        addressDetail: company.addressDetail || '',
        email: company.email || '',
        tel: company.tel || '',
        hp: company.hp || '',
        memo: company.memo || '',
      })
    }
  }, [company, isNew])

  const handleChange = (key: keyof CompanyFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // 바로빌 연동
  const linkBarobill = async (companyId: number, password: string) => {
    try {
      const linkResult = await autoLinkBarobill(companyId, password)
      if (linkResult.success) {
        return {
          success: true,
          message: '✅ 바로빌 연동이 완료되었습니다!\n\n동일한 아이디/비밀번호로 바로빌에도 로그인할 수 있습니다.',
        }
      } else {
        return {
          success: false,
          message: `⚠️ ${linkResult.message}\n\n회사 정보는 저장되었습니다. 나중에 다시 시도하거나 관리자에게 문의해주세요.`,
        }
      }
    } catch (linkError: any) {
      const errorMessage =
        linkError.response?.data?.detail ||
        linkError.response?.data?.message ||
        linkError.message ||
        '바로빌 연동 중 오류가 발생했습니다.'
      console.error('바로빌 연동 에러:', linkError)
      return {
        success: false,
        message: `⚠️ 바로빌 연동 중 오류가 발생했습니다: ${errorMessage}\n\n회사 정보는 저장되었습니다. 관리자에게 문의해주세요.`,
      }
    }
  }

  // 비밀번호 제출 핸들러
  const handlePasswordSubmit = async (): Promise<{ success: boolean }> => {
    if (!passwordInput.trim()) {
      alert('비밀번호를 입력해주세요.')
      return { success: false }
    }

    if (!pendingCompanyId) {
      setShowPasswordModal(false)
      setPasswordInput('')
      return { success: false }
    }

    sessionStorage.setItem('barobill_password', passwordInput)

    const result = await linkBarobill(pendingCompanyId, passwordInput)
    alert(result.message)

    setShowPasswordModal(false)
    setPasswordInput('')
    setPendingCompanyId(null)

    return { success: result.success }
  }

  const handlePasswordCancel = () => {
    setShowPasswordModal(false)
    setPasswordInput('')
    setPendingCompanyId(null)
    alert(
      '⚠️ 비밀번호가 입력되지 않아 바로빌 연동을 건너뜁니다.\n\n회사 정보는 저장되었습니다. 나중에 다시 시도하거나 관리자에게 문의해주세요.'
    )
  }

  // 폼 제출 핸들러
  const handleSubmit = async (): Promise<{ success: boolean; company?: Company }> => {
    try {
      setLoading(true)

      // 상세주소를 주소 뒤에 붙여서 전송
      const submitData: any = {
        businessNumber: form.businessNumber.trim(),
        name: form.name.trim(),
        ceoName: form.ceoName.trim(),
        bizType: form.bizType.trim(),
        bizClass: form.bizClass.trim(),
        address: form.addressDetail
          ? `${form.address} ${form.addressDetail}`.trim()
          : form.address.trim(),
        email: form.email.trim(),
      }

      // 선택 필드만 추가
      if (form.tel && form.tel.trim()) {
        submitData.tel = form.tel.trim()
      }
      if (form.hp && form.hp.trim()) {
        submitData.hp = form.hp.trim()
      }
      if (form.memo && form.memo.trim()) {
        submitData.memo = form.memo.trim()
      }

      let savedCompany: Company

      if (isNew) {
        savedCompany = await createCompany(submitData)
      } else if (company?.id) {
        savedCompany = await updateCompany(company.id, submitData)
      } else {
        throw new Error('회사 정보를 저장할 수 없습니다.')
      }

      // 회사 정보 저장 성공 후 바로빌 자동 연동 시도
      const barobillPassword = sessionStorage.getItem('barobill_password')

      if (!barobillPassword) {
        setPendingCompanyId(savedCompany.id)
        setShowPasswordModal(true)
        return { success: true, company: savedCompany }
      }

      const linkResult = await linkBarobill(savedCompany.id, barobillPassword)
      alert(linkResult.message)

      return { success: true, company: savedCompany }
    } catch (e: any) {
      console.error('회사 저장 실패:', e)
      const errorMessage = e.response?.data?.detail || e.message || '저장에 실패했습니다.'
      alert(`저장에 실패했습니다: ${errorMessage}`)
      return { success: false }
    } finally {
      setLoading(false)
    }
  }

  return {
    form,
    loading,
    showPasswordModal,
    passwordInput,
    setPasswordInput,
    handleChange,
    handleSubmit,
    handlePasswordSubmit,
    handlePasswordCancel,
  }
}

