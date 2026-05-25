import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ar from './locales/ar.json'
import fr from './locales/fr.json'

export const namespaces = [
  'common',
  'navigation',
  'dashboard',
  'clients',
  'vehicles',
  'services',
  'repairs',
  'planning',
  'quotes',
  'stock',
  'hr',
  'tasks',
  'loyalty',
  'storefront',
  'chatbot',
  'superAdmin',
  'clientPortal',
  'auth',
  'rdv',
  'diagnostic',
  'notifications',
  'profile',
  'mechanicDashboard',
] as const

void i18n.use(initReactI18next).init({
  resources: {
    fr: fr as unknown as Record<string, Record<string, string>>,
    ar: ar as unknown as Record<string, Record<string, string>>,
  },
  lng: 'fr',
  fallbackLng: 'fr',
  supportedLngs: ['fr', 'ar'],
  ns: namespaces as unknown as string[],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
})

export { i18n }
