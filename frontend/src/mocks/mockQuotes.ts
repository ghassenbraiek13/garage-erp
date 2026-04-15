import type { Quote, Invoice } from '@/types'

const statuses = ['draft', 'sent', 'accepted', 'invoiced', 'paid'] as const

export const mockQuotes: Quote[] = Array.from({ length: 10 }).map((_, i) => {
  const lines = [
    {
      id: `ql-${i}-1`,
      label: 'Main d’œuvre diagnostic',
      kind: 'service' as const,
      qty: 1,
      unitPrice: 85,
      tva: 20,
    },
    {
      id: `ql-${i}-2`,
      label: 'Filtre à huile',
      kind: 'part' as const,
      qty: 1,
      unitPrice: 24,
      tva: 20,
    },
  ]
  const totalHt = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0)
  const tvaAmt = lines.reduce((s, l) => s + l.qty * l.unitPrice * (l.tva / 100), 0)
  return {
    id: `q-${i + 1}`,
    clientId: `c-${(i % 15) + 1}`,
    vehicleId: `v-${(i % 25) + 1}`,
    lines,
    totalHt,
    totalTtc: totalHt + tvaAmt,
    tva: tvaAmt,
    discount: i % 3 === 0 ? 40 : 0,
    status: statuses[i % statuses.length],
    validUntil: new Date(2026, 5, 1 + i).toISOString(),
  }
})

export const mockInvoices: Invoice[] = mockQuotes
  .filter((q) => q.status === 'invoiced' || q.status === 'paid')
  .map((q, i) => ({
    id: `inv-${i + 1}`,
    quoteId: q.id,
    clientId: q.clientId,
    vehicleId: q.vehicleId,
    totalTtc: q.totalTtc - q.discount,
    paidAt: q.status === 'paid' ? new Date(2026, 3, 10 + i).toISOString() : undefined,
    paymentMethod: i % 2 === 0 ? 'card' : 'transfer',
    status: q.status === 'paid' ? 'paid' : 'unpaid',
  }))
