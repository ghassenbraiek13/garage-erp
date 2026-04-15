import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrencyEUR(value: number, locale: string) {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : 'fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : 'fr-FR').format(value)
}
