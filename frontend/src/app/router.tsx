import { lazy, Suspense, type ReactNode } from 'react'

import { createBrowserRouter, Navigate } from 'react-router-dom'

import { RoleGuard } from '@/components/auth/RoleGuard'

import { PageLoader } from '@/components/shared/PageLoader'

import { AdminLayout } from '@/layouts/AdminLayout'

import { ClientLayout } from '@/layouts/ClientLayout'

import { GarageLayout } from '@/layouts/GarageLayout'

import { useAuthStore } from '@/store/auth'



function ClientPortalGate() {

  const user = useAuthStore((s) => s.user)

  if (!user) {

    return <Navigate to="/login" replace />

  }

  if (user.role !== 'client') {

    return <Navigate to="/" replace />

  }

  return <ClientLayout />

}



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

const ServicesPage = lazy(async () => {

  const m = await import('@/pages/services/ServicesPage')

  return { default: m.ServicesPage }

})

const RepairsPage = lazy(async () => {

  const m = await import('@/pages/repairs/RepairsPage')

  return { default: m.RepairsPage }

})

const RepairDetailPage = lazy(async () => {

  const m = await import('@/pages/repairs/RepairDetailPage')

  return { default: m.RepairDetailPage }

})

const QuotesPage = lazy(async () => {

  const m = await import('@/pages/quotes/QuotesPage')

  return { default: m.QuotesPage }

})

const QuoteDetailPage = lazy(async () => {

  const m = await import('@/pages/quotes/QuoteDetailPage')

  return { default: m.QuoteDetailPage }

})

const InvoiceDetailPage = lazy(async () => {

  const m = await import('@/pages/invoices/InvoiceDetailPage')

  return { default: m.InvoiceDetailPage }

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

const TasksPage = lazy(async () => {

  const m = await import('@/pages/tasks/TasksPage')

  return { default: m.TasksPage }

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

const ProfilePage = lazy(async () => {
  const m = await import('@/pages/profile/ProfilePage')
  return { default: m.ProfilePage }
})

const SettingsPage = lazy(async () => {

  const m = await import('@/pages/settings/SettingsPage')

  return { default: m.SettingsPage }

})

const UsersTeamPage = lazy(async () => {

  const m = await import('@/pages/users/UsersTeamPage')

  return { default: m.UsersTeamPage }

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



const PortalHomePage = lazy(async () => {

  const m = await import('@/pages/client-portal/PortalHomePage')

  return { default: m.PortalHomePage }

})

const PortalVehiclesPage = lazy(async () => {

  const m = await import('@/pages/client-portal/PortalVehiclesPage')

  return { default: m.PortalVehiclesPage }

})

const PortalVehicleDetailPage = lazy(async () => {
  const m = await import('@/pages/client-portal/PortalVehicleDetailPage')
  return { default: m.PortalVehicleDetailPage }
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

const PortalDiagnosticsPage = lazy(async () => {

  const m = await import('@/pages/client-portal/PortalDiagnosticsPage')

  return { default: m.PortalDiagnosticsPage }

})



const NotFoundPage = lazy(async () => {

  const m = await import('@/pages/NotFoundPage')

  return { default: m.NotFoundPage }

})



function Suspensed({ children }: { children: ReactNode }) {

  return <Suspense fallback={<PageLoader />}>{children}</Suspense>

}



function Guarded({

  roles,

  children,

}: {

  roles: string[]

  children: ReactNode

}) {

  return <RoleGuard allowedRoles={roles}>{children}</RoleGuard>

}



export const router = createBrowserRouter([

  { path: '/login', element: <Suspense fallback={null}><LoginPage /></Suspense> },

  { path: '/register', element: <Suspensed><RegisterPage /></Suspensed> },

  { path: '/forgot-password', element: <Suspensed><ForgotPasswordPage /></Suspensed> },



  {

    path: '/',

    element: <GarageLayout />,

    children: [

      { index: true, element: <Suspensed><DashboardPage /></Suspensed> },

      {

        path: 'clients',

        element: (

          <Guarded roles={['manager', 'cashier']}>

            <Suspensed><ClientsPage /></Suspensed>

          </Guarded>

        ),

      },

      {

        path: 'users',

        element: (

          <Guarded roles={['manager']}>

            <Suspensed><UsersTeamPage /></Suspensed>

          </Guarded>

        ),

      },

      {

        path: 'vehicles',

        element: (

          <Guarded roles={['manager', 'mechanic']}>

            <Suspensed><VehiclesPage /></Suspensed>

          </Guarded>

        ),

      },

      {

        path: 'services',

        element: (

          <Guarded roles={['manager']}>

            <Suspensed><ServicesPage /></Suspensed>

          </Guarded>

        ),

      },

      {

        path: 'repairs',

        element: (

          <Guarded roles={['manager', 'mechanic']}>

            <Suspensed><RepairsPage /></Suspensed>

          </Guarded>

        ),

      },

      {

        path: 'repairs/:id',

        element: (

          <Guarded roles={['manager', 'mechanic']}>

            <Suspensed><RepairDetailPage /></Suspensed>

          </Guarded>

        ),

      },

      {

        path: 'quotes',

        element: (

          <Guarded roles={['manager', 'cashier']}>

            <Suspensed><QuotesPage /></Suspensed>

          </Guarded>

        ),

      },

      {

        path: 'quotes/:id',

        element: (

          <Guarded roles={['manager', 'cashier']}>

            <Suspensed><QuoteDetailPage /></Suspensed>

          </Guarded>

        ),

      },

      {

        path: 'invoices/:id',

        element: (

          <Guarded roles={['manager', 'cashier']}>

            <Suspensed><InvoiceDetailPage /></Suspensed>

          </Guarded>

        ),

      },

      {

        path: 'planning',

        element: (

          <Guarded roles={['manager', 'mechanic']}>

            <Suspensed><PlanningPage /></Suspensed>

          </Guarded>

        ),

      },

      {

        path: 'planning/new',

        element: (

          <Guarded roles={['manager', 'mechanic']}>

            <Suspensed><PlanningNewRedirect /></Suspensed>

          </Guarded>

        ),

      },

      {

        path: 'stock',

        element: (

          <Guarded roles={['manager', 'mechanic', 'cashier']}>

            <Suspensed><StockPage /></Suspensed>

          </Guarded>

        ),

      },

      {

        path: 'hr',

        element: (

          <Guarded roles={['manager']}>

            <Suspensed><HrPage /></Suspensed>

          </Guarded>

        ),

      },

      {

        path: 'tasks',

        element: (

          <Guarded roles={['mechanic']}>

            <Suspensed><TasksPage /></Suspensed>

          </Guarded>

        ),

      },

      {

        path: 'loyalty',

        element: (

          <Guarded roles={['manager', 'cashier']}>

            <Suspensed><LoyaltyPage /></Suspensed>

          </Guarded>

        ),

      },

      {

        path: 'storefront',

        element: (

          <Guarded roles={['manager']}>

            <Suspensed><StorefrontPage /></Suspensed>

          </Guarded>

        ),

      },

      {

        path: 'chatbot',

        element: (

          <Guarded roles={['manager', 'mechanic', 'cashier']}>

            <Suspensed><ChatbotPage /></Suspensed>

          </Guarded>

        ),

      },

      {

        path: 'profile',

        element: (

          <Guarded roles={['manager', 'mechanic', 'cashier']}>

            <Suspensed><ProfilePage /></Suspensed>

          </Guarded>

        ),

      },

      {

        path: 'settings',

        element: (

          <Guarded roles={['manager']}>

            <Suspensed><SettingsPage /></Suspensed>

          </Guarded>

        ),

      },

    ],

  },



  {

    path: '/super-admin',

    element: <AdminLayout />,

    children: [

      { index: true, element: <Navigate to="dashboard" replace /> },

      { path: 'dashboard', element: <Suspensed><SuperAdminOverview /></Suspensed> },

      { path: 'garages', element: <Suspensed><SuperAdminGarages /></Suspensed> },

      { path: 'users', element: <Suspensed><SuperAdminUsers /></Suspensed> },

      { path: 'stats', element: <Suspensed><SuperAdminOverview /></Suspensed> },

      { path: 'subscriptions', element: <Suspensed><SuperAdminSubscriptions /></Suspensed> },

    ],

  },



  { path: '/portal/login', element: <Navigate to="/login" replace /> },

  {

    path: '/portal',

    element: <ClientPortalGate />,

    children: [

      { index: true, element: <Suspensed><PortalHomePage /></Suspensed> },

      { path: 'vehicles', element: <Suspensed><PortalVehiclesPage /></Suspensed> },
      { path: 'vehicles/:id', element: <Suspensed><PortalVehicleDetailPage /></Suspensed> },

      { path: 'booklet', element: <Suspensed><PortalBookletPage /></Suspensed> },

      { path: 'coupons', element: <Suspensed><PortalCouponsPage /></Suspensed> },

      { path: 'book', element: <Suspensed><PortalBookPage /></Suspensed> },

      { path: 'diagnostics', element: <Suspensed><PortalDiagnosticsPage /></Suspensed> },

    ],

  },



  { path: '/404', element: <Suspensed><NotFoundPage /></Suspensed> },

  { path: '*', element: <Navigate to="/404" replace /> },

])


