import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { formatBizNumber, fixEmailTypo } from '../utils/formHelpers'
import AddressSearch from '../components/AddressSearch'
import { getCompanies, createCompany, updateCompany } from '../api/companyApi'
import { useCompanyStore } from '../store/useCompanyStore'

const CompanyEditPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  const { loadCurrentCompany } = useCompanyStore()
  // /company/new 경로이거나 id가 'new'인 경우 새로 등록
  const isNew = location.pathname === '/company/new' || id === 'new'

  const [form, setForm] = useState({
    businessNumber: '',
    name: '',
    ceoName: '',
    bizType: '',
    bizClass: '',
    address: '',
    addressDetail: '',
    email: '',
    memo: '',
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isNew && id) {
      loadCompany(parseInt(id))
    }
  }, [id, isNew])

  const loadCompany = async (companyId: number) => {
    try {
      setLoading(true)
      const companies = await getCompanies()
      const company = companies.find((c) => c.id === companyId)
      if (company) {
        // 기존 주소는 이미 합쳐진 형태이므로 address 필드에만 설정
        // UI에서는 주소와 상세주소를 분리해서 입력받지만, 저장 시에는 합쳐서 저장됨
        setForm({
          businessNumber: company.businessNumber || '',
          name: company.name || '',
          ceoName: company.ceoName || '',
          bizType: company.bizType || '',
          bizClass: company.bizClass || '',
          address: company.address || '', // 이미 합쳐진 주소
          addressDetail: '', // UI에서 새로 입력받을 상세주소
          email: company.email || '',
          memo: company.memo || '',
        })
      }
    } catch (e) {
      console.error('회사 정보 불러오기 실패:', e)
      alert('회사 정보를 불러올 수 없습니다.')
      navigate('/company')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    // Validation - 필수 필드 확인
    if (!form.businessNumber || !form.name || !form.ceoName || !form.address) {
      alert('사업자번호, 회사명, 대표자명, 주소는 필수 입력 항목입니다.')
      return
    }

    // 백엔드 필수 필드 확인 (biz_type, biz_class, email)
    if (!form.bizType || !form.bizClass || !form.email) {
      alert('업태, 종목, 이메일은 필수 입력 항목입니다.')
      return
    }

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

      // 선택 필드만 추가 (빈 문자열이 아닌 경우에만)
      if (form.memo && form.memo.trim()) {
        submitData.memo = form.memo.trim()
      }

      // addressDetail은 주소에 포함되었으므로 포함하지 않음 (백엔드에서 Optional이므로 undefined로 처리)
      // undefined는 JSON 직렬화 시 제외되므로 백엔드에서 None으로 처리됨

      console.log('저장할 데이터:', submitData)
      console.log('isNew:', isNew, 'id:', id, 'location.pathname:', location.pathname)

      if (isNew) {
        // 새로 등록
        await createCompany(submitData)
        alert('회사가 성공적으로 등록되었습니다.')
      } else if (id && !isNaN(parseInt(id))) {
        // 기존 회사 수정
        await updateCompany(parseInt(id), submitData)
        alert('회사 정보가 성공적으로 수정되었습니다.')
      } else {
        // 예상치 못한 상황
        console.error('예상치 못한 상황:', { isNew, id, pathname: location.pathname })
        throw new Error('저장할 수 없습니다. 페이지를 새로고침하고 다시 시도해주세요.')
      }

      // 저장 후 회사 정보 다시 로드 (상단 메뉴바 업데이트를 위해)
      await loadCurrentCompany()

      // 저장 후 목록 페이지로 이동 (목록이 자동으로 다시 불러와짐)
      navigate('/company', { replace: true })
    } catch (e: any) {
      console.error('회사 저장 실패:', e)
      const errorMessage = e.response?.data?.detail || e.message || '저장에 실패했습니다.'
      alert(`저장에 실패했습니다: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !isNew) {
    return (
      <div className="px-4 py-6">
        <div className="text-center py-10 text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {isNew ? '새 회사 등록' : '회사 정보 수정'}
        </h1>
        <button
          onClick={() => navigate('/company')}
          className="text-gray-400 dark:text-gray-300 text-xl hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <div className="space-y-4">
        {/* 1. 사업자등록번호 */}
        <input
          type="text"
          placeholder="123-45-67890"
          maxLength={13}
          inputMode="numeric"
          pattern="[0-9\-]*"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          value={form.businessNumber}
          onChange={(e) => {
            // 숫자만 추출하고 최대 10자리로 제한
            const onlyNumber = e.target.value.replace(/[^0-9]/g, '').slice(0, 10)
            handleChange('businessNumber', formatBizNumber(onlyNumber))
          }}
        />

        {/* 2. 회사명 */}
        <input
          type="text"
          placeholder="회사명"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
        />

        {/* 3. 대표자명 */}
        <input
          type="text"
          placeholder="대표자명"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          value={form.ceoName}
          onChange={(e) => handleChange('ceoName', e.target.value)}
          required
        />

        {/* 4. 업태 */}
        <input
          type="text"
          placeholder="업태 (예: 도소매업 / 서비스업 / 제조업 등)"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          value={form.bizType}
          onChange={(e) => handleChange('bizType', e.target.value)}
          required
        />

        {/* 5. 종목 */}
        <input
          type="text"
          placeholder="종목 (예: 상품판매 / 컨설팅 / 의류·잡화)"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          value={form.bizClass}
          onChange={(e) => handleChange('bizClass', e.target.value)}
          required
        />

        {/* 6. 주소 (AddressSearch) */}
        <AddressSearch
          address={form.address}
          addressDetail={form.addressDetail}
          onAddressChange={(addr) => handleChange('address', addr)}
          onAddressDetailChange={(addrDetail) => handleChange('addressDetail', addrDetail)}
        />

        {/* 7. 이메일 */}
        <input
          type="email"
          placeholder="이메일"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={(e) => handleChange('email', fixEmailTypo(e.target.value))}
          required
        />

        {/* 8. 비고 */}
        <textarea
          placeholder="비고 (선택)"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm h-24"
          value={form.memo}
          onChange={(e) => handleChange('memo', e.target.value)}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-md font-semibold transition"
      >
        {loading ? '저장 중...' : '저장하기'}
      </button>
    </div>
  )
}

export default CompanyEditPage

