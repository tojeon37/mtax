import React, { useState, useEffect } from 'react'
import axiosInstance from '../api/axiosInstance'

// 기기 정보 인터페이스
interface Device {
  user_agent: string
  ip?: string
  last_login?: string
}

const SessionManagePage: React.FC = () => {
  // 기기 목록 상태
  const [deviceList, setDeviceList] = useState<Device[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 기기 목록 로드
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setIsLoading(true)
        const response = await axiosInstance.get<{ devices: Device[] }>('/account/devices')
        setDeviceList(response.data.devices || [])
      } catch (error: any) {
        console.error('기기 목록 로드 실패:', error)
        console.error('에러 상세:', error.response?.data)
        console.error('에러 상태:', error.response?.status)
        
        if (error.response?.status === 401) {
          alert('로그인이 필요합니다.')
        } else if (error.response?.status === 404) {
          // 테이블이 없을 수 있음 - 빈 배열로 설정
          console.warn('기기 테이블이 없거나 엔드포인트를 찾을 수 없습니다.')
          setDeviceList([])
        } else if (error.response?.status === 500) {
          const errorMessage = error.response?.data?.detail || '서버 오류가 발생했습니다.'
          console.error('서버 오류:', errorMessage)
          alert(`서버 오류: ${errorMessage}`)
        } else {
          const errorMessage = error.response?.data?.detail || error.message || '기기 목록을 불러오는 중 오류가 발생했습니다.'
          alert(errorMessage)
        }
        setDeviceList([])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchDevices()
  }, [])


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6 pt-24 pb-8">
      <div className="max-w-[480px] mx-auto">
        {/* 제목 */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          로그인 기기 관리
        </h1>

        {/* 기기 목록 */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            로딩 중...
          </div>
        ) : deviceList.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              로그인된 기기가 없습니다.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {deviceList.map((device, index) => {
              const formatDate = (dateString: string | undefined) => {
                if (!dateString) return '알 수 없음'
                try {
                  const date = new Date(dateString)
                  return date.toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                } catch {
                  return dateString
                }
              }
              
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        기기 {index + 1}
                      </span>
                    </div>
                    {device.ip && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        IP: {device.ip}
                      </p>
                    )}
                    {device.user_agent && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {device.user_agent.length > 50 
                          ? `${device.user_agent.substring(0, 50)}...` 
                          : device.user_agent}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      마지막 로그인: {formatDate(device.last_login)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default SessionManagePage

