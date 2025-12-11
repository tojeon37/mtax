import React from 'react'
import { formatBizNumber, formatTel, formatHp, fixEmailTypo } from '../../utils/formHelpers'
import AddressSearch from '../AddressSearch'
import { Company } from '../../api/companyApi'
import { ModalBase } from '../common/ModalBase'
import { useCompanyForm } from '../../hooks/company/useCompanyForm'
import { validateCompanyForm } from '../../utils/validators/companyValidator'

interface CompanyFormProps {
  company?: Company | null
  onSuccess: () => void
  onCancel: () => void
}

const CompanyForm: React.FC<CompanyFormProps> = ({ company, onSuccess, onCancel }) => {
  const {
    form,
    loading,
    showPasswordModal,
    passwordInput,
    setPasswordInput,
    handleChange,
    handleSubmit: submitForm,
    handlePasswordSubmit,
    handlePasswordCancel,
  } = useCompanyForm(company)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 폼 검증
    const validation = validateCompanyForm(form)
    if (!validation.isValid) {
      alert(validation.message)
      return
    }

    const result = await submitForm()
    if (result.success) {
      if (result.company) {
        alert(company ? '회사 정보가 성공적으로 수정되었습니다.' : '회사가 성공적으로 등록되었습니다.')
      }
      // 비밀번호 모달이 열려있지 않으면 성공 처리
      if (!showPasswordModal) {
        onSuccess()
      }
    }
  }

  const handlePasswordSubmitWithCallback = async () => {
    const result = await handlePasswordSubmit()
    if (result.success) {
      onSuccess()
    }
  }

  const handlePasswordCancelWithCallback = () => {
    handlePasswordCancel()
    onSuccess()
  }

  return (
    <>
      {/* 비밀번호 입력 모달 */}
      <ModalBase
        isOpen={showPasswordModal}
        onClose={handlePasswordCancelWithCallback}
        title="바로빌 연동을 위한 비밀번호 입력"
        maxWidth="md"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            바로빌 연동을 위해 비밀번호를 입력해주세요.
          </p>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="비밀번호 입력"
            className="w-full h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handlePasswordSubmitWithCallback()
              }
            }}
          />
          <div className="flex gap-3 pt-2">
            <button
              onClick={handlePasswordCancelWithCallback}
              className="flex-1 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handlePasswordSubmitWithCallback}
              disabled={!passwordInput.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition"
            >
              확인
            </button>
          </div>
        </div>
      </ModalBase>

      <div className="space-y-4">
      {/* 바로빌 연동 안내 문구 */}
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
          <span className="font-semibold">계발이는 바로빌의 공식 파트너사입니다.</span>
          <br />
          우리회사 정보를 저장하면 동일한 아이디/비밀번호로 바로빌에도 자동 로그인할 수 있습니다.
        </p>
      </div>

      {/* 사업자등록증 안내 문구 */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-700 text-sm text-gray-700 dark:text-gray-300 rounded">
        사업자등록증과 동일한 정보를 입력하세요.
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
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
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
          value={form.bizType}
          onChange={(e) => handleChange('bizType', e.target.value)}
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
          value={form.bizClass}
          onChange={(e) => handleChange('bizClass', e.target.value)}
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
          onClick={onCancel}
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
    </>
  )
}

export default CompanyForm

