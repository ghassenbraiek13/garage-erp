import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PageLoader } from '@/components/shared/PageLoader'
import { AdminLayout } from '@/layouts/AdminLayout'
import { ClientLayout } from '@/layouts/ClientLayout'
import { GarageLayout } from '@/layouts/GarageLayout'

const DashboardPage = lazy(async () => {
  const m = await import('@/pages/dashboard/DashboardPage')
  return { default: m.DashboardPage }
})
const ClientsPage = lazy(async () => {
  const m = await import('@/pages/clients/ClientsPage')
  return { default: m.ClientsPage }
})
const VehiclesPage = lazy(async () => {
  const m = await import('@/pages/vehicles/VehiclesPage')
  return { default: m.VehiclesPage }
})
const RepairsPage = lazy(async () => {
  const m = await import('@/pages/repairs/RepairsPage')
  return { default: m.RepairsPage }
})
const QuotesPage = lazy(async () => {
  const m = await import('@/pages/quotes/QuotesPage')
  return { default: m.QuotesPage }
})
const PlanningPage = lazy(async () => {
  const m = await import('@/pages/planning/PlanningPage')
  return { default: m.PlanningPage }
})
const PlanningNewRedirect = lazy(async () => {
  const m = await import('@/pages/planning/PlanningNewRedirect')
  return { default: m.PlanningNewRedirect }
})
const StockPage = lazy(async () => {
  const m = await import('@/pages/stock/StockPage')
  return { default: m.StockPage }
})
const HrPage = lazy(async () => {
  const m = await import('@/pages/hr/HrPage')
  return { default: m.HrPage }
})
const LoyaltyPage = lazy(async () => {
  const m = await import('@/pages/loyalty/LoyaltyPage')
  return { default: m.LoyaltyPage }
})
const StorefrontPage = lazy(async () => {
  const m = await import('@/pages/storefront/StorefrontPage')
  return { default: m.StorefrontPage }
})
const ChatbotPage = lazy(async () => {
  const m = await import('@/pages/chatbot/ChatbotPage')
  return { default: m.ChatbotPage }
})
const SettingsPage = lazy(async () => {
  const m = await import('@/pages/settings/SettingsPage')
  return { default: m.SettingsPage }
})

const LoginPage = lazy(async () => {
  const m = await import('@/pages/auth/LoginPage')
  return { default: m.LoginPage }
})
const RegisterPage = lazy(async () => {
  const m = await import('@/pages/auth/RegisterPage')
  return { default: m.RegisterPage }
})
const ForgotPasswordPage = lazy(async () => {
  const m = await import('@/pages/auth/ForgotPasswordPage')
  return { default: m.ForgotPasswordPage }
})

const SuperAdminOverview = lazy(async () => {
  const m = await import('@/pages/super-admin/SuperAdminOverview')
  return { default: m.SuperAdminOverview }
})
const SuperAdminGarages = lazy(async () => {
  const m = await import('@/pages/super-admin/SuperAdminGarages')
  return { default: m.SuperAdminGarages }
})
const SuperAdminUsers = lazy(async () => {
  const m = await import('@/pages/super-admin/SuperAdminUsers')
  return { default: m.SuperAdminUsers }
})
const SuperAdminSubscriptions = lazy(async () => {
  const m = await import('@/pages/super-admin/SuperAdminSubscriptions')
  return { default: m.SuperAdminSubscriptions }
})

const PortalLoginPage = lazy(async () => {
  const m = await import('@/pages/client-portal/PortalLoginPage')
  return { default: m.PortalLoginPage }
})
const PortalHomePage = lazy(async () => {
  const m = await import('@/pages/client-portal/PortalHomePage')
  return { default: m.PortalHomePage }
})
const PortalVehiclesPage = lazy(async () => {
  const m = await import('@/pages/client-portal/PortalVehiclesPage')
  return { default: m.PortalVehiclesPage }
})
const PortalBookletPage = lazy(async () => {
  const m = await import('@/pages/client-portal/PortalBookletPage')
  return { default: m.PortalBookletPage }
})
const PortalCouponsPage = lazy(async () => {
  const m = await import('@/pages/client-portal/PortalCouponsPage')
  return { default: m.PortalCouponsPage }
})
const PortalBookPage = lazy(async () => {
  const m = await import('@/pages/client-portal/PortalBookPage')
  return { default: m.PortalBookPage }
})

const NotFoundPage = lazy(async () => {
  const m = await import('@/pages/NotFoundPage')
  return { default: m.NotFoundPage }
})

function Suspensed({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  { path: '/login', element: <Suspensed><LoginPage /></Suspensed> },
  { path: '/register', element: <Suspensed><RegisterPage /></Suspensed> },
  { path: '/forgot-password', element: <Suspensed><ForgotPasswordPage /></Suspensed> },

  {
    path: '/',
    element: <GarageLayout />,
    children: [
      { index: true, element: <Suspensed><DashboardPage /></Suspensed> },
      { path: 'clients', element: <Suspensed><ClientsPage /></Suspensed> },
      { path: 'vehicles', element: <Suspensed><VehiclesPage /></Suspensed> },
      { path: 'repairs', element: <Suspensed><RepairsPage /></Suspensed> },
      { path: 'quotes', element: <Suspensed><QuotesPage /></Suspensed> },
      { path: 'planning', element: <Suspensed><PlanningPage /></Suspensed> },
      { path: 'planning/new', element: <Suspensed><PlanningNewRedirect /></Suspensed> },
      { path: 'stock', element: <Suspensed><StockPage /></Suspensed> },
      { path: 'hr', element: <Suspensed><HrPage /></Suspensed> },
      { path: 'loyalty', element: <Suspensed><LoyaltyPage /></Suspensed> },
      { path: 'storefront', element: <Suspensed><StorefrontPage /></Suspensed> },
      { path: 'chatbot', element: <Suspensed><ChatbotPage /></Suspensed> },
      { path: 'settings', element: <Suspensed><SettingsPage /></Suspensed> },
    ],
  },

  {
    path: '/super-admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Suspensed><SuperAdminOverview /></Suspensed> },
      { path: 'garages', element: <Suspensed><SuperAdminGarages /></Suspensed> },
      { path: 'users', element: <Suspensed><SuperAdminUsers /></Suspensed> },
      { path: 'stats', element: <Suspensed><SuperAdminOverview /></Suspensed> },
      { path: 'subscriptions', element: <Suspensed><SuperAdminSubscriptions /></Suspensed> },
    ],
  },

  { path: '/portal/login', element: <Suspensed><PortalLoginPage /></Suspensed> },
  {
    path: '/portal',
    element: <ClientLayout />,
    children: [
      { index: true, element: <Suspensed><PortalHomePage /></Suspensed> },
      { path: 'vehicles', element: <Suspensed><PortalVehiclesPage /></Suspensed> },
      { path: 'booklet', element: <Suspensed><PortalBookletPage /></Suspensed> },
      { path: 'coupons', element: <Suspensed><PortalCouponsPage /></Suspensed> },
      { path: 'book', element: <Suspensed><PortalBookPage /></Suspensed> },
    ],
  },

  { path: '/404', element: <Suspensed><NotFoundPage /></Suspensed> },
  { path: '*', element: <Navigate to="/404" replace /> },
])
