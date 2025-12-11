import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export const Home: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="px-4 py-8 pt-20 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="text-center mb-12">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">세금계산서</h1>
        <p className="text-gray-600 dark:text-gray-400">3초만에 빠르게 발행하세요</p>
      </div>

      <div className="space-y-4">
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate('/invoice/quick')}
          className="w-full"
        >
          빠른 발행
        </Button>

        <Button
          variant="secondary"
          size="lg"
          onClick={() => navigate('/clients')}
          className="w-full"
        >
          거래처
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate('/invoice/history')}
          className="w-full"
        >
          발행내역
        </Button>
      </div>
    </div>
  )
}

