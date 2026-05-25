export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'invoiced'
  | 'expired'

export type InvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'overdue' | 'cancelled'

export type QuoteLineInput = {
  type: 'service' | 'part'
  refId?: string
  label: string
  quantity: number
  unitPrice: number
  discount: number
  tva: number
}

export type QuoteLineComputed = QuoteLineInput & {
  totalHT: number
  totalTTC: number
}

const REPAIR_MARKER = /__repairId:([a-fA-F0-9]{24})__/

export function embedRepairIdInNotes(notes: string | undefined, repairId: string | undefined): string | undefined {
  const base = stripRepairMarker(notes ?? '').trim()
  if (!repairId) return base || undefined
  const tag = `__repairId:${repairId}__`
  return base ? `${base}\n${tag}` : tag
}

export function extractRepairIdFromNotes(notes?: string): string | undefined {
  if (!notes) return undefined
  const m = notes.match(REPAIR_MARKER)
  return m?.[1]
}

export function stripRepairMarker(notes: string): string {
  return notes.replace(REPAIR_MARKER, '').trim()
}

export function computeLine(line: QuoteLineInput): QuoteLineComputed {
  const qty = line.quantity
  const unit = line.unitPrice
  const discPct = line.discount ?? 0
  const tvaPct = line.tva ?? 20
  const lineHt = qty * unit * (1 - discPct / 100)
  const totalHT = Math.round(lineHt * 100) / 100
  const totalTTC = Math.round(lineHt * (1 + tvaPct / 100) * 100) / 100
  return { ...line, totalHT, totalTTC }
}

export function computeQuoteTotals(lines: QuoteLineInput[]) {
  const computed = lines.map(computeLine)
  let subtotalHT = 0
  let totalTVA = 0
  let totalDiscount = 0
  for (const line of computed) {
    const grossHt = line.quantity * line.unitPrice
    totalDiscount += Math.round((grossHt * (line.discount ?? 0)) / 100 * 100) / 100
    subtotalHT += line.totalHT
    totalTVA += Math.round((line.totalTTC - line.totalHT) * 100) / 100
  }
  const totalTTC = Math.round((subtotalHT + totalTVA) * 100) / 100
  return { lines: computed, subtotalHT, totalTVA, totalDiscount, totalTTC }
}

export const QUOTE_STATUS_ORDER: QuoteStatus[] = ['draft', 'sent', 'accepted', 'invoiced']

export function quoteStatusBadgeVariant(
  status: string,
): 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'purple' {
  switch (status) {
    case 'draft':
      return 'default'
    case 'sent':
      return 'primary'
    case 'accepted':
      return 'success'
    case 'rejected':
      return 'danger'
    case 'invoiced':
      return 'purple'
    case 'expired':
      return 'warning'
    default:
      return 'default'
  }
}

export function invoiceStatusBadgeVariant(
  status: string,
): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'paid':
      return 'success'
    case 'partial':
      return 'primary'
    case 'overdue':
      return 'danger'
    case 'cancelled':
      return 'default'
    default:
      return 'warning'
  }
}

export function refIdStr(x: unknown): string {
  if (!x) return ''
  if (typeof x === 'string') return x
  if (typeof x === 'object' && x !== null) {
    const o = x as Record<string, unknown>
    if (o.id) return String(o.id)
    if (o._id) return String(o._id)
  }
  return String(x)
}

export function refLabel(x: unknown, fallback = '—'): string {
  if (!x) return fallback
  if (typeof x === 'object' && x !== null) {
    const o = x as Record<string, unknown>
    if (typeof o.name === 'string') return o.name
    if (typeof o.number === 'string') return o.number
    if (typeof o.plate === 'string') {
      const make = typeof o.make === 'string' ? o.make : ''
      const model = typeof o.model === 'string' ? o.model : ''
      const year = o.year ? ` ${o.year}` : ''
      return `${make} ${model}${year} (${o.plate})`.trim()
    }
  }
  return fallback
}

export function repairShortId(id: string): string {
  return `REP-${id.slice(-6).toUpperCase()}`
}
