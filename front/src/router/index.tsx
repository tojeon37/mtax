import { Routes, Route } from 'react-router-dom'
import { Home } from '../pages/Home'
import { Login } from '../pages/Login'
import { Signup } from '../pages/Signup'
import { Dashboard } from '../pages/Dashboard'
import { InvoiceQuick } from '../pages/InvoiceQuick'
import { History } from '../pages/History'
import ClientsPage from '../pages/ClientsPage'
import ClientEditPage from '../pages/ClientEditPage'
import CompanyListPage from '../pages/CompanyListPage'
import CompanyEditPage from '../pages/CompanyEditPage'
// CertificatePage는 단일 컴포넌트만 로드되도록 명확하게 import
import CertificatePage from '../pages/CertificatePage'
import { Settings } from '../pages/Settings'
import BillingDashboard from '../pages/BillingDashboard'
import UsageHistoryPage from '../pages/billing/UsageHistoryPage'
import BillingCycleListPage from '../pages/billing/BillingCycleListPage'
import BillingCycleDetail from '../pages/BillingCycleDetail'
import PaymentMethodPage from '../pages/billing/PaymentMethodPage'
// CurrentMonthUsagePage는 더 이상 사용하지 않음 (UsageHistoryPage의 탭으로 통합됨)
import ChangePasswordPage from '../pages/ChangePasswordPage'
import DeleteAccountPage from '../pages/DeleteAccountPage'
import SessionManagePage from '../pages/SessionManagePage'
import DataExportPage from '../pages/DataExportPage'
import GoodbyePage from '../pages/GoodbyePage'
import { GuidePage } from '../pages/GuidePage'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'

export const AppRouter = () => {
  return (
    <Routes>
      {/* 대시보드는 설정 페이지에서만 접근 가능하도록 변경 */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      {/* 메인 페이지는 바로 세금계산서 입력 페이지 */}
      <Route path="/" element={<InvoiceQuick />} />
      <Route path="/invoice" element={<InvoiceQuick />} />
      <Route path="/invoice/quick" element={<InvoiceQuick />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/invoice/history"
        element={
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        }
      />

      {/* 거래처 관리 */}
      <Route
        path="/clients"
        element={
          <ProtectedRoute>
            <ClientsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients/new"
        element={
          <ProtectedRoute>
            <ClientEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients/edit/:id"
        element={
          <ProtectedRoute>
            <ClientEditPage />
          </ProtectedRoute>
        }
      />

      {/* 회사 관리 - 다중 회사 지원 */}
      <Route
        path="/company"
        element={
          <ProtectedRoute>
            <CompanyListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/company/new"
        element={
          <ProtectedRoute>
            <CompanyEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/company/edit/:id"
        element={
          <ProtectedRoute>
            <CompanyEditPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/certificate"
        element={
          <ProtectedRoute>
            <CertificatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/password"
        element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/delete-account"
        element={
          <ProtectedRoute>
            <DeleteAccountPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/sessions"
        element={
          <ProtectedRoute>
            <SessionManagePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/export"
        element={
          <ProtectedRoute>
            <DataExportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/account"
        element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/password-change"
        element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />
      <Route path="/guide" element={<GuidePage />} />
      <Route path="/goodbye" element={<GoodbyePage />} />
      {/* 사용요금 관리 */}
      <Route
        path="/billing"
        element={
          <ProtectedRoute>
            <BillingDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing/usage"
        element={
          <ProtectedRoute>
            <UsageHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing/cycles"
        element={
          <ProtectedRoute>
            <BillingCycleListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing/cycles/:id"
        element={
          <ProtectedRoute>
            <BillingCycleDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing/payment-methods"
        element={
          <ProtectedRoute>
            <PaymentMethodPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
