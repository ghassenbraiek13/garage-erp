export function generateQuoteNumber(year: number, seq: number): string {
  return `DEV-${year}-${String(seq).padStart(4, '0')}`
}

export function generateInvoiceNumber(year: number, seq: number): string {
  return `FAC-${year}-${String(seq).padStart(4, '0')}`
}

export function randomOtp6(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}
