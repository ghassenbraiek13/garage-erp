/**
 * Format a number as TND currency
 * @example formatTND(150)    → "150.000 TND"
 * @example formatTND(1500.5) → "1 500.500 TND"
 */
export function formatTND(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '0.000 TND'
  return (
    new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(amount) + ' TND'
  )
}

/**
 * Format a compact TND amount (no decimals) for badges/chips
 * @example formatTNDCompact(1500) → "1 500 TND"
 */
export function formatTNDCompact(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '0 TND'
  return (
    new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' TND'
  )
}

/** Currency symbol constant */
export const CURRENCY = 'TND'
export const CURRENCY_SYMBOL = 'TND'
