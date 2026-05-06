import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import AppLayout from '../components/layout/AppLayout'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import VerifyPhone from '../pages/auth/VerifyPhone'
import CustomerDashboard from '../pages/customer/Dashboard'
import CustomerLoadsPage from '../pages/customer/Loads'
import CustomerLoadCreatePage from '../pages/customer/LoadCreate'
import CustomerLoadDetailPage from '../pages/customer/LoadDetail'
import CustomerBidsPage from '../pages/customer/Bids'
import CustomerTrackPage from '../pages/customer/Track'
import CustomerHistoryPage from '../pages/customer/History'
import DriverDashboard from '../pages/driver/Dashboard'
import DriverLoadsPage from '../pages/driver/Loads'
import DriverLoadDetailPage from '../pages/driver/LoadDetail'
import DriverDocumentsPage from '../pages/driver/Documents'
import DriverBidsPage from '../pages/driver/Bids'
import DriverTrackPage from '../pages/driver/Track'
import DriverHistoryPage from '../pages/driver/History'
import AdminDashboard from '../pages/admin/Dashboard'
import AdminReviewsPage from '../pages/admin/Reviews'
import AdminUsersPage from '../pages/admin/Users'
import AdminDocumentsPage from '../pages/admin/Documents'
import AdminLoadsPage from '../pages/admin/Loads'
import AdminLogsPage from '../pages/admin/Logs'

function RootRedirect() {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role === 'Customer') return <Navigate to="/customer/dashboard" replace />
  if (user?.role === 'Driver')   return <Navigate to="/driver/dashboard"   replace />
  if (user?.role === 'Admin')    return <Navigate to="/admin/dashboard"    replace />
  return <Navigate to="/login" replace />
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
  { path: '/', element: <RootRedirect /> },
  { path: '/login',        element: <Login /> },
  { path: '/register',     element: <Register /> },
  { path: '/verify-phone', element: <VerifyPhone /> },
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
          { path: 'track', element: <DriverTrackPage /> },
          { path: 'history', element: <DriverHistoryPage /> },
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
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'documents', element: <AdminDocumentsPage /> },
          { path: 'loads', element: <AdminLoadsPage /> },
          { path: 'logs', element: <AdminLogsPage /> },
        ],
      },
    ],
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
