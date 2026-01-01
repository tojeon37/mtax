import React, { useState, useEffect } from 'react'
import { formatBizNumber, formatTel, formatHp, fixEmailTypo } from '../../utils/formHelpers'
import AddressSearch from '../AddressSearch'
import { createClient, updateClient, Client } from '../../api/clientApi'

interface ClientFormProps {
  client?: Client | null
  onSuccess: () => void
  onCancel: () => void
  onCloseRequest?: (closeCallback: () => void) => void
  onDirtyChange?: (isDirty: boolean) => void
}

const ClientForm: React.FC<ClientFormProps> = ({ client, onSuccess, onCancel, onCloseRequest, onDirtyChange }) => {
  const isNew = !client

  const [form, setForm] = useState({
    businessNumber: '',
    companyName: '',
    ceoName: '',
    businessType: '',
    businessItem: '',
    address: '',
    addressDetail: '',
    email: '',
    tel: '',
    hp: '',
    memo: '',
  })

  const [originalForm, setOriginalForm] = useState(form)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isNew && client) {
      // 기존 주소는 이미 합쳐진 형태이므로 address 필드에만 설정
      // UI에서는 주소와 상세주소를 분리해서 입력받지만, 저장 시에는 합쳐서 저장됨
      const initialForm = {
        businessNumber: client.businessNumber || '',
        companyName: client.companyName || '',
        ceoName: client.ceoName || '',
        businessType: client.businessType || '',
        businessItem: client.businessItem || '',
        address: client.address || '', // 이미 합쳐진 주소
        addressDetail: '', // UI에서 새로 입력받을 상세주소
        email: client.email || '',
        tel: '', // 거래처에는 전화번호 필드가 없으므로 빈 문자열
        hp: '', // 거래처에는 휴대폰번호 필드가 없으므로 빈 문자열
        memo: client.memo || '',
      }
      setForm(initialForm)
      setOriginalForm(initialForm)
    } else {
      // 새로 생성하는 경우
      const emptyForm = {
        businessNumber: '',
        companyName: '',
        ceoName: '',
        businessType: '',
        businessItem: '',
        address: '',
        addressDetail: '',
        email: '',
        tel: '',
        hp: '',
        memo: '',
      }
      setForm(emptyForm)
      setOriginalForm(emptyForm)
    }
  }, [client, isNew])

  // isDirty 계산
  const isDirty = JSON.stringify(form) !== JSON.stringify(originalForm)

  // isDirty 상태 변경 시 상위 컴포넌트에 알림
  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(isDirty)
    }
  }, [isDirty, onDirtyChange])

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    // Validation - 필수 필드 확인
    if (!form.businessNumber || !form.companyName || !form.ceoName || !form.address) {
      alert('사업자번호, 회사명, 대표자명, 주소는 필수 입력 항목입니다.')
      return
    }

    // 백엔드 필수 필드 확인 (businessType, businessItem, email, hp)
    if (!form.businessType || !form.businessItem || !form.email || !form.hp) {
      alert('업태, 종목, 이메일, 휴대폰번호는 필수 입력 항목입니다.')
      return
    }

    try {
      setLoading(true)

      // 상세주소를 주소 뒤에 붙여서 전송
      const submitData: any = {
        businessNumber: form.businessNumber.trim(),
        companyName: form.companyName.trim(),
        ceoName: form.ceoName.trim(),
        businessType: form.businessType.trim(),
        businessItem: form.businessItem.trim(),
        address: form.addressDetail
          ? `${form.address} ${form.addressDetail}`.trim()
          : form.address.trim(),
        email: form.email.trim(),
      }

      // 선택 필드만 추가 (빈 문자열이 아닌 경우에만)
      if (form.tel && form.tel.trim()) {
        submitData.tel = form.tel.trim()
      }
      if (form.hp && form.hp.trim()) {
        submitData.hp = form.hp.trim()
      }
      if (form.memo && form.memo.trim()) {
        submitData.memo = form.memo.trim()
      }

      if (isNew) {
        // 새로 등록
        await createClient(submitData)
        alert('거래처가 성공적으로 등록되었습니다.')
      } else if (client?.id) {
        // 기존 거래처 수정
        await updateClient(client.id, submitData)
        alert('거래처 정보가 성공적으로 수정되었습니다.')
      }

      // 성공 시 originalForm 업데이트
      setOriginalForm(form)
      onSuccess()
    } catch (e: any) {
      console.error('거래처 저장 실패:', e)
      const errorMessage = e.response?.data?.detail || e.message || '저장에 실패했습니다.'
      alert(`저장에 실패했습니다: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (onCloseRequest) {
      onCloseRequest(onCancel)
    } else {
      onCancel()
    }
  }

  return (
    <div 
      className="space-y-4"
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 사업자등록증 안내 문구 */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-700 text-sm text-gray-700 dark:text-gray-300 rounded">
        사업자등록증과 동일한 정보를 입력해 주세요.
      </div>

      {/* 1. 사업자등록번호 */}
      <div>
        <label className="required-label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          사업자등록번호
        </label>
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
      </div>

      {/* 2. 회사명 */}
      <div>
        <label className="required-label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          회사명
        </label>
        <input
          type="text"
          placeholder=""
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          value={form.companyName}
          onChange={(e) => handleChange('companyName', e.target.value)}
        />
      </div>

      {/* 3. 대표자명 */}
      <div>
        <label className="required-label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          대표자명
        </label>
        <input
          type="text"
          placeholder=""
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          value={form.ceoName}
          onChange={(e) => handleChange('ceoName', e.target.value)}
          required
        />
      </div>

      {/* 4. 업태 */}
      <div>
        <label className="required-label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          업태
        </label>
        <input
          type="text"
          placeholder="(예:도소매업 / 서비스업 / 제조업 등)"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          value={form.businessType}
          onChange={(e) => handleChange('businessType', e.target.value)}
          required
        />
      </div>

      {/* 5. 종목 */}
      <div>
        <label className="required-label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          종목
        </label>
        <input
          type="text"
          placeholder="(예:전자상거래업 / 상품판매 / 컨설팅 등)"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          value={form.businessItem}
          onChange={(e) => handleChange('businessItem', e.target.value)}
          required
        />
      </div>

      {/* 6. 주소 (AddressSearch) */}
      <div>
        <label className="required-label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          주소
        </label>
        <AddressSearch
          address={form.address}
          addressDetail={form.addressDetail}
          onAddressChange={(addr) => handleChange('address', addr)}
          onAddressDetailChange={(addrDetail) => handleChange('addressDetail', addrDetail)}
        />
      </div>

      {/* 7. 이메일 */}
      <div>
        <label className="required-label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          이메일
        </label>
        <input
          type="email"
          placeholder=""
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={(e) => handleChange('email', fixEmailTypo(e.target.value))}
          required
        />
      </div>

      {/* 8. 전화번호 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          전화번호
        </label>
        <input
          type="tel"
          placeholder="02-1234-5678"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          value={form.tel}
          onChange={(e) => handleChange('tel', formatTel(e.target.value))}
          maxLength={13}
        />
      </div>

      {/* 9. 휴대폰번호 */}
      <div>
        <label className="required-label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          휴대폰번호
        </label>
        <input
          type="tel"
          placeholder="010-1234-5678"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          value={form.hp}
          onChange={(e) => handleChange('hp', formatHp(e.target.value))}
          maxLength={13}
          required
        />
      </div>

      {/* 10. 비고 */}
      <textarea
        placeholder=""
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm h-24"
        value={form.memo}
        onChange={(e) => handleChange('memo', e.target.value)}
      />

      {/* 버튼 */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="flex-1 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition"
        >
          {loading ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  )
}

export default ClientForm

