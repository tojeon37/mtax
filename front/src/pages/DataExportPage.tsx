import React, { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { createClient, getClients } from '../api/clientApi'
import { formatError } from '../utils/errorHelpers'

// 거래처 데이터 인터페이스
interface ClientData {
  businessNumber: string
  companyName: string
  ceoName: string
  businessType: string
  businessItem: string
  address: string  // 주소 (주소 + 상세주소 통합)
  email: string
  tel?: string  // 전화번호
  hp?: string  // 휴대폰번호
  memo?: string
}

const DataExportPage: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{
    success: number
    failed: number
    errors: string[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 모바일 환경 감지
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  // 샘플 데이터 생성
  const getSampleData = (): ClientData[] => {
    return [
      {
        businessNumber: '123-45-67890',
        companyName: '샘플회사',
        ceoName: '홍길동',
        businessType: '도소매',
        businessItem: '상품판매',
        address: '서울시 강남구 테헤란로 123 101호', // 통합된 주소
        email: 'sample@example.com',
        tel: '02-1234-5678',
        hp: '010-1234-5678',
        memo: '샘플 데이터입니다',
      },
      {
        businessNumber: '987-65-43210',
        companyName: '테스트기업',
        ceoName: '김철수',
        businessType: '서비스업',
        businessItem: '컨설팅',
        address: '서울시 서초구 서초대로 456',
        email: 'test@example.com',
        tel: '031-123-4567',
        hp: '010-9876-5432',
      },
    ]
  }

  // 파일 다운로드 헬퍼 함수
  const downloadFile = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName

    if (isMobile) {
      if (window.navigator && (window.navigator as any).msSaveOrOpenBlob) {
        (window.navigator as any).msSaveOrOpenBlob(blob, fileName)
      } else {
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      setTimeout(() => URL.revokeObjectURL(url), 100)
    } else {
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(url), 100)
    }
  }

  // 샘플 CSV 다운로드
  const handleDownloadSampleCSV = () => {
    const sampleData = getSampleData()
    const headers = ['사업자번호', '회사명', '대표자명', '업태', '종목', '주소', '이메일', '전화번호', '휴대폰번호', '비고']

    const csvRows = [
      headers.join(','),
      ...sampleData.map(row => [
        row.businessNumber,
        row.companyName,
        row.ceoName,
        row.businessType,
        row.businessItem,
        row.address, // 주소와 상세주소가 합쳐진 형태
        row.email,
        row.tel || '',
        row.hp || '',
        row.memo || '',
      ].map(cell => `"${cell}"`).join(','))
    ]

    const csvContent = csvRows.join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    downloadFile(blob, '거래처_샘플파일.csv')
  }

  // 샘플 XLSX 다운로드
  const handleDownloadSampleXLSX = () => {
    const sampleData = getSampleData()
    const headers = ['사업자번호', '회사명', '대표자명', '업태', '종목', '주소', '이메일', '전화번호', '휴대폰번호', '비고']

    const worksheetData = [
      headers,
      ...sampleData.map(row => [
        row.businessNumber,
        row.companyName,
        row.ceoName,
        row.businessType,
        row.businessItem,
        row.address, // 주소와 상세주소가 합쳐진 형태
        row.email,
        row.tel || '',
        row.hp || '',
        row.memo || '',
      ])
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '거래처')

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    downloadFile(blob, '거래처_샘플파일.xlsx')
  }

  // CSV 다운로드 함수
  const handleExportCSV = async () => {
    setIsExporting(true)

    try {
      // 실제 거래처 데이터 가져오기
      const clients = await getClients()

      if (!clients || clients.length === 0) {
        alert('다운로드할 거래처 데이터가 없습니다.')
        setIsExporting(false)
        return
      }

      // CSV 헤더 정의
      const headers = ['사업자번호', '회사명', '대표자명', '업태', '종목', '주소', '이메일', '전화번호', '휴대폰번호', '비고']

      // 클라이언트 데이터를 CSV 행으로 변환
      const csvRows = [
        headers.join(','),
        ...clients.map((client: any) => {
          // 주소는 이미 통합된 형태로 저장되어 있음
          return [
            client.businessNumber || '',
            client.companyName || '',
            client.ceoName || '',
            client.businessType || '',
            client.businessItem || '',
            client.address || '', // 통합된 주소
            client.email || '',
            client.tel || '',
            client.hp || '',
            client.memo || '',
          ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        })
      ]

      const csvContent = csvRows.join('\n')
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const fileName = `거래처리스트_${new Date().toISOString().split('T')[0]}.csv`

      downloadFile(blob, fileName)
      alert(`총 ${clients.length}건의 거래처 리스트가 다운로드되었습니다.`)
    } catch (error: any) {
      console.error('CSV 다운로드 실패:', error)
      const errorMessage = formatError(error) || '알 수 없는 오류'
      alert(`데이터 다운로드 중 오류가 발생했습니다: ${errorMessage}`)
    } finally {
      setIsExporting(false)
    }
  }

  // 파일 파싱 함수
  const parseFile = async (file: File): Promise<ClientData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const parsedData: ClientData[] = []

          if (file.name.endsWith('.csv')) {
            // CSV 파싱
            const text = data as string
            const lines = text.split('\n').filter(line => line.trim())
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))

            // 헤더 매핑
            const headerMap: { [key: string]: string } = {
              '사업자번호': 'businessNumber',
              '회사명': 'companyName',
              '대표자명': 'ceoName',
              '업태': 'businessType',
              '종목': 'businessItem',
              '주소': 'address',
              '이메일': 'email',
              '전화번호': 'tel',
              '휴대폰번호': 'hp',
              '비고': 'memo',
            }

            for (let i = 1; i < lines.length; i++) {
              const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
              const row: any = {}

              headers.forEach((header, index) => {
                const key = headerMap[header] || header
                const value = values[index] || ''

                // 상세주소는 더 이상 처리하지 않음 (주소 필드에 통합)
                if (key !== 'addressDetail') {
                  row[key] = value
                }
              })

              // 주소는 CSV에서 그대로 사용 (이미 통합된 형태)
              parsedData.push(row as ClientData)
            }
          } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            // Excel 파싱
            const workbook = XLSX.read(data, { type: 'binary' })
            const firstSheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[firstSheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

            if (jsonData.length < 2) {
              reject(new Error('파일에 데이터가 없습니다.'))
              return
            }

            const headers = jsonData[0].map((h: any) => String(h).trim())
            const headerMap: { [key: string]: string } = {
              '사업자번호': 'businessNumber',
              '회사명': 'companyName',
              '대표자명': 'ceoName',
              '업태': 'businessType',
              '종목': 'businessItem',
              '주소': 'address',
              '이메일': 'email',
              '전화번호': 'tel',
              '휴대폰번호': 'hp',
              '비고': 'memo',
            }

            for (let i = 1; i < jsonData.length; i++) {
              const row: any = {}

              headers.forEach((header, index) => {
                const key = headerMap[header] || header
                const value = jsonData[i][index] ? String(jsonData[i][index]).trim() : ''

                // 상세주소는 더 이상 처리하지 않음 (주소 필드에 통합)
                if (key !== 'addressDetail') {
                  row[key] = value
                }
              })

              // 주소는 Excel에서 그대로 사용 (이미 통합된 형태)
              parsedData.push(row as ClientData)
            }
          } else {
            reject(new Error('지원하지 않는 파일 형식입니다.'))
            return
          }

          resolve(parsedData)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => reject(new Error('파일 읽기 실패'))

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file, 'UTF-8')
      } else {
        reader.readAsArrayBuffer(file)
      }
    })
  }

  // 데이터 검증
  const validateClientData = (data: ClientData, index: number): string | null => {
    if (!data.businessNumber || !data.businessNumber.trim()) {
      return `${index + 1}행: 사업자번호가 없습니다.`
    }
    if (!data.companyName || !data.companyName.trim()) {
      return `${index + 1}행: 회사명이 없습니다.`
    }
    if (!data.ceoName || !data.ceoName.trim()) {
      return `${index + 1}행: 대표자명이 없습니다.`
    }
    if (!data.businessType || !data.businessType.trim()) {
      return `${index + 1}행: 업태가 없습니다.`
    }
    if (!data.businessItem || !data.businessItem.trim()) {
      return `${index + 1}행: 종목이 없습니다.`
    }
    if (!data.address || !data.address.trim()) {
      return `${index + 1}행: 주소가 없습니다.`
    }
    if (!data.email || !data.email.trim()) {
      return `${index + 1}행: 이메일이 없습니다.`
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return `${index + 1}행: 이메일 형식이 올바르지 않습니다.`
    }

    // 휴대폰번호 필수 검증
    if (!data.hp || !data.hp.trim()) {
      return `${index + 1}행: 휴대폰번호가 없습니다.`
    }

    return null
  }

  // 파일 업로드 처리
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 파일 형식 확인
    const validExtensions = ['.csv', '.xls', '.xlsx']
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

    if (!validExtensions.includes(fileExtension)) {
      alert('CSV, XLS, XLSX 파일만 업로드 가능합니다.')
      return
    }

    setIsUploading(true)
    setUploadResult(null)

    try {
      // 파일 파싱
      const parsedData = await parseFile(file)

      if (parsedData.length === 0) {
        alert('파일에 유효한 데이터가 없습니다.')
        setIsUploading(false)
        return
      }

      // 데이터 검증 및 추가
      const errors: string[] = []
      let successCount = 0
      let failedCount = 0

      for (let i = 0; i < parsedData.length; i++) {
        const data = parsedData[i]
        const error = validateClientData(data, i)

        if (error) {
          errors.push(error)
          failedCount++
          continue
        }

        try {
          // 주소는 이미 통합된 형태로 파싱됨 (address 필드에 주소+상세주소가 포함)
          const clientData: any = {
            businessNumber: data.businessNumber.trim(),
            companyName: data.companyName.trim(),
            ceoName: data.ceoName.trim(),
            businessType: data.businessType.trim(),
            businessItem: data.businessItem.trim(),
            address: data.address.trim(), // 통합된 주소
            email: data.email.trim(),
          }

          // 선택 필드만 추가 (빈 문자열이 아닌 경우에만)
          if (data.tel && data.tel.trim()) {
            clientData.tel = data.tel.trim()
          }
          if (data.hp && data.hp.trim()) {
            clientData.hp = data.hp.trim()
          }
          if (data.memo && data.memo.trim()) {
            clientData.memo = data.memo.trim()
          }

          await createClient(clientData)

          successCount++
        } catch (error: any) {
          const errorMsg = error.response?.data?.detail || error.message || '알 수 없는 오류'
          errors.push(`${i + 1}행: ${errorMsg}`)
          failedCount++
        }
      }

      setUploadResult({
        success: successCount,
        failed: failedCount,
        errors: errors.slice(0, 10), // 최대 10개만 표시
      })

      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      if (successCount > 0) {
        alert(`총 ${parsedData.length}건 중 ${successCount}건이 성공적으로 추가되었습니다.`)
      }
    } catch (error: any) {
      console.error('파일 업로드 실패:', error)
      alert(`파일 처리 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6 pt-24 pb-8">
      <div className="max-w-[480px] mx-auto">
        {/* 제목 */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          거래처 업로드/다운로드
        </h1>

        {/* 샘플 파일 다운로드 섹션 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            샘플 파일 다운로드
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDownloadSampleCSV}
              className="py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors text-sm"
            >
              CSV 샘플 다운로드
            </button>
            <button
              onClick={handleDownloadSampleXLSX}
              className="py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors text-sm"
            >
              Excel 샘플 다운로드
            </button>
          </div>
        </div>

        {/* 데이터 업로드 섹션 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xls,.xlsx"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            id="file-upload"
          />

          <label
            htmlFor="file-upload"
            className={`
              block w-full py-3 px-6 rounded-lg font-semibold text-base text-center cursor-pointer
              transition-all duration-200
              ${isUploading
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white shadow-sm hover:shadow-md'
              }
            `}
          >
            {isUploading ? '업로드 중...' : '거래처 업로드'}
          </label>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            CSV/XLS/XLSX 파일로 거래처를 일괄 등록합니다.
          </p>
        </div>

        {/* 업로드 결과 */}
        {uploadResult && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              업로드 결과
            </h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">성공:</span>
                <span className="text-sm font-semibold text-green-600">{uploadResult.success}건</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">실패:</span>
                <span className="text-sm font-semibold text-red-600">{uploadResult.failed}건</span>
              </div>
            </div>
            {uploadResult.errors.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">오류 내역:</p>
                <ul className="text-xs text-red-600 dark:text-red-400 space-y-1 max-h-40 overflow-y-auto">
                  {uploadResult.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 다운로드 카드 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className={`
              w-full py-3 px-6 rounded-lg font-semibold text-base
              transition-all duration-200
              ${isExporting
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-sm hover:shadow-md'
              }
            `}
          >
            {isExporting ? '다운로드 중...' : '거래처 다운로드'}
          </button>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            등록된 거래처 전체를 CSV 파일로 다운로드합니다.
          </p>
        </div>

        {/* 추가 안내 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            <strong className="text-gray-700 dark:text-gray-300">파일 형식 안내:</strong>
          </p>
          <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-3">
            <li>• <strong>필수 항목:</strong> 사업자번호, 회사명, 대표자명, 업태, 종목, 주소, 이메일, 휴대폰번호</li>
            <li>• <strong>선택 항목:</strong> 전화번호, 비고</li>
            <li>• CSV 파일은 UTF-8 인코딩으로 저장됩니다.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default DataExportPage

/* 
========================================
API 연동 포인트
========================================

1. 거래처 리스트 조회
   - 엔드포인트: GET /api/v1/clients
   - 응답: Array<ClientItem>
   - 모든 거래처 데이터를 가져옴

2. 거래처 일괄 등록
   - 엔드포인트: POST /api/v1/clients/bulk
   - 요청 본문: {
       clients: Array<{
         businessNumber: string,
         companyName: string,
         ceoName: string,
         businessType: string,
         businessItem: string,
         address: string,  // 주소 (주소 + 상세주소 통합)
         email: string,
         memo?: string
       }>
     }
   - 응답: {
       success: number,
       failed: number,
       errors: Array<{ row: number, error: string }>
     }

3. CSV 변환 함수
   - 클라이언트 데이터를 CSV 형식으로 변환
   - 헤더: 사업자번호, 회사명, 대표자명, 업태, 종목, 주소, 이메일, 전화번호, 휴대폰번호, 비고
   - UTF-8 BOM 추가 (한글 깨짐 방지)

4. 파일 파싱
   - CSV: 텍스트 파싱
   - XLS/XLSX: xlsx 라이브러리 사용
   - 헤더 매핑: 한글 헤더를 영문 필드명으로 변환

5. 데이터 검증
   - 필수 필드 검증
   - 이메일 형식 검증
   - 사업자번호 중복 체크 (API에서 처리)

6. 에러 처리
   - 파일 형식 오류
   - 파싱 오류
   - 검증 오류
   - API 오류
*/
