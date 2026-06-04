import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export { formatTND, formatTNDCompact, CURRENCY, CURRENCY_SYMBOL } from '@/utils/currency'

export function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : 'fr-FR').format(value)
}
