import React from 'react'

declare global {
  interface Window {
    daum: any
  }
}

interface Props {
  address: string
  addressDetail: string
  onAddressChange: (address: string) => void
  onAddressDetailChange: (addressDetail: string) => void
}

const AddressSearch: React.FC<Props> = ({
  address,
  addressDetail,
  onAddressChange,
  onAddressDetailChange,
}) => {
  const openSearch = () => {
    if (!window.daum || !window.daum.Postcode) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    new window.daum.Postcode({
      oncomplete: function (data: any) {
        // 도로명 주소 또는 지번 주소 선택
        const fullAddress = data.roadAddress || data.jibunAddress
        onAddressChange(fullAddress)
        // 상세주소는 초기화하지 않고 유지
      }
    }).open()
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="도로명 또는 지번 주소"
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          readOnly
        />
        <button
          type="button"
          onClick={openSearch}
          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm whitespace-nowrap transition-colors"
        >
          주소검색
        </button>
      </div>
      <input
        type="text"
        placeholder="상세주소 (선택)"
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
        value={addressDetail}
        onChange={(e) => onAddressDetailChange(e.target.value)}
      />
    </div>
  )
}

export default AddressSearch
