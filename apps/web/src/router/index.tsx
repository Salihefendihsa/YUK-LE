import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import AppLayout from '../components/layout/AppLayout'

const Landing = lazy(() => import('../pages/landing/Landing'))
const Login = lazy(() => import('../pages/auth/Login'))
const Register = lazy(() => import('../pages/auth/Register'))
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPassword'))
const VerifyPhone = lazy(() => import('../pages/auth/VerifyPhone'))

const KvkkPage = lazy(() => import('../pages/legal/Kvkk'))
const KullanimKosullariPage = lazy(() => import('../pages/legal/KullanimKosullari'))
const GizlilikPage = lazy(() => import('../pages/legal/Gizlilik'))

const CustomerDashboard = lazy(() => import('../pages/customer/Dashboard'))
const CustomerLoadsPage = lazy(() => import('../pages/customer/Loads'))
const CustomerLoadCreatePage = lazy(() => import('../pages/customer/LoadCreate'))
const CustomerLoadDetailPage = lazy(() => import('../pages/customer/LoadDetail'))
const CustomerBidsPage = lazy(() => import('../pages/customer/Bids'))
const CustomerTrackPage = lazy(() => import('../pages/customer/Track'))
const CustomerHistoryPage = lazy(() => import('../pages/customer/History'))
const CustomerAddressesPage = lazy(() => import('../pages/customer/Addresses'))
const CustomerProfilePage = lazy(() => import('../pages/customer/Profile'))
const CustomerChatsPage = lazy(() => import('../pages/customer/Chats'))
const CustomerSettingsPage = lazy(() => import('../pages/customer/Settings'))
const CustomerAnalyticsPage = lazy(() => import('../pages/customer/Analytics'))

const DriverDashboard = lazy(() => import('../pages/driver/Dashboard'))
const DriverLoadsPage = lazy(() => import('../pages/driver/Loads'))
const DriverLoadDetailPage = lazy(() => import('../pages/driver/LoadDetail'))
const DriverDocumentsPage = lazy(() => import('../pages/driver/Documents'))
const DriverBidsPage = lazy(() => import('../pages/driver/Bids'))
const DriverHistoryPage = lazy(() => import('../pages/driver/History'))
const DriverWalletPage = lazy(() => import('../pages/driver/Wallet'))
const DriverActiveLoadPage = lazy(() => import('../pages/driver/ActiveLoad'))
const DriverListingsPage = lazy(() => import('../pages/driver/Listings'))
const DriverListingCreatePage = lazy(() => import('../pages/driver/ListingCreate'))
const DriverTrackPage = lazy(() => import('../pages/driver/Track'))
const DriverProfilePage = lazy(() => import('../pages/driver/Profile'))
const DriverChatsPage = lazy(() => import('../pages/driver/Chats'))
const DriverSettingsPage = lazy(() => import('../pages/driver/Settings'))

const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'))
const AdminReviewsPage = lazy(() => import('../pages/admin/Reviews'))
const AdminDriversPage = lazy(() => import('../pages/admin/Drivers'))
const AdminCustomersPage = lazy(() => import('../pages/admin/Customers'))
const AdminLoadsPage = lazy(() => import('../pages/admin/Loads'))
const AdminPaymentsPage = lazy(() => import('../pages/admin/Payments'))
const AdminSystemPage = lazy(() => import('../pages/admin/System'))
const AdminLogsPage = lazy(() => import('../pages/admin/Logs'))
const AdminUsersPage = lazy(() => import('../pages/admin/Users'))
const AdminDocumentsPage = lazy(() => import('../pages/admin/Documents'))
const AdminChatsPage = lazy(() => import('../pages/admin/Chats'))
const AdminSettingsPage = lazy(() => import('../pages/admin/Settings'))
const AdminDriverDetailPage = lazy(() => import('../pages/admin/DriverDetail'))
const AdminCustomerDetailPage = lazy(() => import('../pages/admin/CustomerDetail'))
const AdminLoadDetailPage = lazy(() => import('../pages/admin/LoadDetail'))
const AdminTrackingPage = lazy(() => import('../pages/admin/Tracking'))
const AdminRatingsPage = lazy(() => import('../pages/admin/Ratings'))
const AdminLoginPage = lazy(() => import('../pages/admin/AdminLogin'))

const MySupportPage = lazy(() => import('../pages/support/MySupport'))
const AdminSupportPage = lazy(() => import('../pages/admin/Support'))

const MarketingDocumentPage = lazy(() => import('../pages/marketing/MarketingDocumentPage'))
const DemoRequestPage = lazy(() => import('../pages/marketing/DemoRequestPage'))

const NotFoundPage = lazy(() =>
  import('../pages/system/ErrorPages').then((m) => ({ default: m.NotFoundPage })),
)
const RouteErrorPage = lazy(() =>
  import('../pages/system/ErrorPages').then((m) => ({ default: m.RouteErrorPage })),
)
const ServerErrorPage = lazy(() =>
  import('../pages/system/ErrorPages').then((m) => ({ default: m.ServerErrorPage })),
)
const UnauthorizedPage = lazy(() =>
  import('../pages/system/ErrorPages').then((m) => ({ default: m.UnauthorizedPage })),
)

function RouteFallback() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '14px',
      }}
    >
      <div className="route-spinner" />
    </div>
  )
}

function LazyRouteOutlet() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Outlet />
    </Suspense>
  )
}

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
        <div
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            background: '#090B0E',
            color: '#fff',
          }}
        >
          Navlonix…
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
  {
    path: '/',
    element: <HomeRoute />,
    errorElement: (
      <Suspense fallback={<RouteFallback />}>
        <RouteErrorPage />
      </Suspense>
    ),
  },
  {
    element: <LazyRouteOutlet />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/admin/login', element: <AdminLoginPage /> },
      { path: '/register', element: <Register /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/verify-phone', element: <VerifyPhone /> },
      { path: '/kvkk', element: <KvkkPage /> },
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
              { path: 'support', element: <MySupportPage /> },
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
              { path: 'listings', element: <DriverListingsPage /> },
              { path: 'listings/create', element: <DriverListingCreatePage /> },
              { path: 'track', element: <DriverTrackPage /> },
              { path: 'profile', element: <DriverProfilePage /> },
              { path: 'chats', element: <DriverChatsPage /> },
              { path: 'support', element: <MySupportPage /> },
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
              { path: 'support', element: <AdminSupportPage /> },
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
    ],
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
