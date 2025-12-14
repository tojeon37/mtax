import React from 'react'

export const GuidePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-[480px] mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          이용안내
        </h1>

        {/* [🔐 로그인 및 계정 이용] */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
            🔐 로그인 및 계정 이용
          </h2>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <p>로그인하면 최대 90일 동안 자동 로그인 상태가 유지됩니다.</p>
            <p>90일 동안 접속하지 않으면, 보안을 위해 다시 로그인해 주세요.</p>
          </div>
        </section>

        {/* [🎁 무료 제공 안내] */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
            🎁 무료 제공 안내
          </h2>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <p>신규 가입 시 아래 기능을 무료로 체험하실 수 있습니다.</p>
            <p className="pl-4">· 전자세금계산서 발행 5건</p>
            <p className="pl-4">· 사업자등록 상태조회</p>
            <p className="pl-8 text-gray-600 dark:text-gray-400">→ 전자세금계산서 무료 제공 기간 동안 함께 제공됩니다.</p>
            <p>무료 제공은 사업자등록번호 기준으로 1회만 제공됩니다.</p>
            <p>전자세금계산서 무료 제공분(5건)을 모두 사용하면, 이후에는 상태조회도 유료로 전환됩니다.</p>
          </div>
        </section>

        {/* [💳 요금 및 결제 방식] */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
            💳 요금 및 결제 방식
          </h2>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <p>이용 요금은 아래와 같습니다.</p>
            <p className="pl-4">· 전자세금계산서 발행: 건당 200원</p>
            <p className="pl-4">· 사업자등록 상태조회: 건당 15원</p>
            <p>사용한 금액은 지난달 사용량 기준으로 매월 초 후불 청구됩니다.</p>
            <p>무료 제공분을 모두 사용한 이후에는 결제수단 등록이 필요합니다.</p>
            <p>미결제된 사용요금이 있는 경우, 회원탈퇴가 제한될 수 있습니다.</p>
          </div>
        </section>

        {/* [🧾 바로빌 연동 및 발행 상태 안내] */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
            🧾 바로빌 연동 및 발행 상태 안내
          </h2>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <p>우리회사 정보를 등록하면 바로빌에도 자동으로 로그인됩니다.</p>
            <p>전자세금계산서는 바로빌 시스템을 통해 발행됩니다.</p>
            <p>발행 상태는 다음과 같이 표시됩니다.</p>
            <p className="pl-4">
              · <span className="font-bold text-yellow-600 dark:text-yellow-400">'대기'</span> 상태
            </p>
            <p className="pl-8 text-gray-600 dark:text-gray-400">
              → 바로빌로 전송된 상태이며, 이 단계에서는 발행취소가 가능합니다.
            </p>
            <p className="pl-4">
              · <span className="font-bold text-green-600 dark:text-green-400">'완료'</span> 상태
            </p>
            <p className="pl-8 text-gray-600 dark:text-gray-400">
              → 홈택스로 전송이 완료된 상태로, 발행취소는 불가능하며 수정이 필요한 경우 홈택스에서 '수정세금계산서'로 처리해야 합니다.
            </p>
          </div>
        </section>

        {/* [🏢 서비스 안내] */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
            🏢 서비스 안내
          </h2>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <p>계발이는 전자세금계산서 간편발급 서비스로, 바로빌의 제휴 파트너 서비스입니다.</p>
            <p>전자세금계산서 발행과 인증서 처리는 바로빌 시스템을 기반으로 제공됩니다.</p>
          </div>
        </section>

        {/* [📂 데이터 보관 및 이용 제한] */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
            📂 데이터 보관 및 이용 제한
          </h2>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <p>전자세금계산서 발행내역은 관련 법령에 따라 보관되며, 회원탈퇴 후에도 삭제되지 않습니다.</p>
            <p>계정 정보는 회원탈퇴 시 삭제됩니다.</p>
            <p>결제수단이 등록되지 않은 경우, 발행 및 조회 기능 이용이 제한될 수 있습니다.</p>
          </div>
        </section>
      </div>
    </div>
  )
}
