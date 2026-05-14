import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import AppLayout from '../components/layout/AppLayout'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import ForgotPasswordPage from '../pages/auth/ForgotPassword'
import VerifyPhone from '../pages/auth/VerifyPhone'
import KvkkPage from '../pages/legal/Kvkk'
import KullanimKosullariPage from '../pages/legal/KullanimKosullari'
import GizlilikPage from '../pages/legal/Gizlilik'
import CustomerDashboard from '../pages/customer/Dashboard'
import CustomerLoadsPage from '../pages/customer/Loads'
import CustomerLoadCreatePage from '../pages/customer/LoadCreate'
import CustomerLoadDetailPage from '../pages/customer/LoadDetail'
import CustomerBidsPage from '../pages/customer/Bids'
import CustomerTrackPage from '../pages/customer/Track'
import CustomerHistoryPage from '../pages/customer/History'
import CustomerAddressesPage from '../pages/customer/Addresses'
import CustomerProfilePage from '../pages/customer/Profile'
import CustomerChatsPage from '../pages/customer/Chats'
import CustomerSettingsPage from '../pages/customer/Settings'
import CustomerAnalyticsPage from '../pages/customer/Analytics'
import DriverDashboard from '../pages/driver/Dashboard'
import DriverLoadsPage from '../pages/driver/Loads'
import DriverLoadDetailPage from '../pages/driver/LoadDetail'
import DriverDocumentsPage from '../pages/driver/Documents'
import DriverBidsPage from '../pages/driver/Bids'
import DriverHistoryPage from '../pages/driver/History'
import DriverWalletPage from '../pages/driver/Wallet'
import DriverActiveLoadPage from '../pages/driver/ActiveLoad'
import DriverProfilePage from '../pages/driver/Profile'
import DriverChatsPage from '../pages/driver/Chats'
import DriverSettingsPage from '../pages/driver/Settings'
import AdminDashboard from '../pages/admin/Dashboard'
import AdminReviewsPage from '../pages/admin/Reviews'
import AdminDriversPage from '../pages/admin/Drivers'
import AdminCustomersPage from '../pages/admin/Customers'
import AdminLoadsPage from '../pages/admin/Loads'
import AdminPaymentsPage from '../pages/admin/Payments'
import AdminSystemPage from '../pages/admin/System'
import AdminLogsPage from '../pages/admin/Logs'
import AdminUsersPage from '../pages/admin/Users'
import AdminDocumentsPage from '../pages/admin/Documents'
import AdminChatsPage from '../pages/admin/Chats'
import AdminSettingsPage from '../pages/admin/Settings'
import AdminDriverDetailPage from '../pages/admin/DriverDetail'
import AdminCustomerDetailPage from '../pages/admin/CustomerDetail'
import AdminLoadDetailPage from '../pages/admin/LoadDetail'
import AdminTrackingPage from '../pages/admin/Tracking'
import AdminRatingsPage from '../pages/admin/Ratings'
import AdminLoginPage from '../pages/admin/AdminLogin'
import MarketingDocumentPage from '../pages/marketing/MarketingDocumentPage'
import DemoRequestPage from '../pages/marketing/DemoRequestPage'
import { NotFoundPage, RouteErrorPage, ServerErrorPage, UnauthorizedPage } from '../pages/system/ErrorPages'

const Landing = lazy(() => import('../pages/landing/Landing'))

function HomeRoute() {
  const { isAuthenticated, user } = useAuthStore()
  if (isAuthenticated && user) {
    if (user.role === 'Customer') return <Navigate to="/customer/dashboard" replace />
    if (user.role === 'Driver') return <Navigate to="/driver/dashboard" replace />
    if (user.role === 'Admin') return <Navigate to="/admin/dashboard" replace />
  }
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#090B0E', color: '#fff' }}>
          YÜK-LE…
        </div>
      }
    >
      <Landing />
    </Suspense>
  )
}

function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}

const router = createBrowserRouter([
  { path: '/', element: <HomeRoute />, errorElement: <RouteErrorPage /> },
  { path: '/login',        element: <Login /> },
  { path: '/admin/login',  element: <AdminLoginPage /> },
  { path: '/register',     element: <Register /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/verify-phone', element: <VerifyPhone /> },
  { path: '/kvkk',         element: <KvkkPage /> },
  { path: '/kullanim-kosullari', element: <KullanimKosullariPage /> },
  { path: '/gizlilik', element: <GizlilikPage /> },
  { path: '/features', element: <MarketingDocumentPage id="features" /> },
  { path: '/features/belge-tanima', element: <MarketingDocumentPage id="belge-tanima" /> },
  { path: '/features/adil-fiyat', element: <MarketingDocumentPage id="adil-fiyat" /> },
  { path: '/features/akilli-eslestirme', element: <MarketingDocumentPage id="akilli-eslestirme" /> },
  { path: '/pricing', element: <MarketingDocumentPage id="pricing" /> },
  { path: '/demo', element: <DemoRequestPage /> },
  { path: '/api-docs', element: <MarketingDocumentPage id="api-docs" /> },
  { path: '/hakkimizda', element: <MarketingDocumentPage id="hakkimizda" /> },
  { path: '/kariyer', element: <MarketingDocumentPage id="kariyer" /> },
  { path: '/blog', element: <MarketingDocumentPage id="blog" /> },
  { path: '/basin', element: <MarketingDocumentPage id="basin" /> },
  { path: '/cerezler', element: <MarketingDocumentPage id="cerezler" /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },
  { path: '/500', element: <ServerErrorPage /> },
  {
    element: <ProtectedRoute allowedRoles={['Customer']} />,
    children: [
      {
        path: '/customer',
        element: <AppLayout />,
        children: [
          { path: 'dashboard', element: <CustomerDashboard /> },
          { path: 'loads', element: <CustomerLoadsPage /> },
          { path: 'loads/create', element: <CustomerLoadCreatePage /> },
          { path: 'loads/:id', element: <CustomerLoadDetailPage /> },
          { path: 'bids', element: <CustomerBidsPage /> },
          { path: 'track', element: <CustomerTrackPage /> },
          { path: 'history', element: <CustomerHistoryPage /> },
          { path: 'addresses', element: <CustomerAddressesPage /> },
          { path: 'profile', element: <CustomerProfilePage /> },
          { path: 'chats', element: <CustomerChatsPage /> },
          { path: 'settings', element: <CustomerSettingsPage /> },
          { path: 'analytics', element: <CustomerAnalyticsPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['Driver']} />,
    children: [
      {
        path: '/driver',
        element: <AppLayout />,
        children: [
          { path: 'dashboard', element: <DriverDashboard /> },
          { path: 'loads', element: <DriverLoadsPage /> },
          { path: 'loads/:id', element: <DriverLoadDetailPage /> },
          { path: 'documents', element: <DriverDocumentsPage /> },
          { path: 'bids', element: <DriverBidsPage /> },
          { path: 'history', element: <DriverHistoryPage /> },
          { path: 'wallet', element: <DriverWalletPage /> },
          { path: 'active-load', element: <DriverActiveLoadPage /> },
          { path: 'profile', element: <DriverProfilePage /> },
          { path: 'chats', element: <DriverChatsPage /> },
          { path: 'settings', element: <DriverSettingsPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['Admin']} />,
    children: [
      {
        path: '/admin',
        element: <AppLayout />,
        children: [
          { path: 'dashboard', element: <AdminDashboard /> },
          { path: 'reviews', element: <AdminReviewsPage /> },
          { path: 'drivers', element: <AdminDriversPage /> },
          { path: 'drivers/:id', element: <AdminDriverDetailPage /> },
          { path: 'customers', element: <AdminCustomersPage /> },
          { path: 'customers/:id', element: <AdminCustomerDetailPage /> },
          { path: 'loads', element: <AdminLoadsPage /> },
          { path: 'loads/:id', element: <AdminLoadDetailPage /> },
          { path: 'documents', element: <AdminDocumentsPage /> },
          { path: 'chats', element: <AdminChatsPage /> },
          { path: 'payments', element: <AdminPaymentsPage /> },
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'system', element: <AdminSystemPage /> },
          { path: 'logs', element: <AdminLogsPage /> },
          { path: 'settings', element: <AdminSettingsPage /> },
          { path: 'tracking', element: <AdminTrackingPage /> },
          { path: 'ratings', element: <AdminRatingsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
