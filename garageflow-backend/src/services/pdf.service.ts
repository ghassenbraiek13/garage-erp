import fs from 'fs'
import path from 'path'
import PDFDocument from 'pdfkit'
import { getEnv } from '@/config/env'
import type { IQuote } from '@/models/Quote.model'
import type { IInvoice } from '@/models/Invoice.model'
import type { IGarage } from '@/models/Garage.model'
import type { IClient } from '@/models/Client.model'

type PopulatedQuote = IQuote & { garage?: IGarage; client?: IClient }
type PopulatedInvoice = IInvoice & { garage?: IGarage; client?: IClient }

function docBuffer(doc: InstanceType<typeof PDFDocument>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    doc.on('data', (c: Buffer) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
    doc.end()
  })
}

function tryEmbedLogo(doc: InstanceType<typeof PDFDocument>, logoRel?: string): number {
  if (!logoRel) return 40
  const abs = path.resolve(getEnv().UPLOADS_DIR, logoRel)
  if (!fs.existsSync(abs)) return 40
  try {
    doc.image(abs, 40, 40, { width: 72, height: 48 })
    return 100
  } catch {
    return 40
  }
}

function garageHeaderBlock(doc: InstanceType<typeof PDFDocument>, g: IGarage, yStart: number): number {
  let y = yStart
  doc.fontSize(12).fillColor('#000').text(g.name, 120, y)
  y += 16
  doc.fontSize(9).text(
    [g.address?.street, g.address?.postalCode, g.address?.city].filter(Boolean).join(', '),
    120,
    y,
  )
  y += 12
  if (g.phone) {
    doc.text(`Tél. ${g.phone}`, 120, y)
    y += 12
  }
  if (g.email) {
    doc.text(g.email, 120, y)
    y += 12
  }
  return y
}

function clientBlock(doc: InstanceType<typeof PDFDocument>, c: IClient, y: number): number {
  doc.fontSize(11).fillColor('#000').text('Facturé à :', 40, y, { underline: true })
  y += 14
  doc.fontSize(10).text(c.name, 40, y)
  y += 12
  const addr = [c.address?.street, c.address?.postalCode, c.address?.city].filter(Boolean).join(', ')
  if (addr) {
    doc.text(addr, 40, y)
    y += 12
  }
  if (c.email) {
    doc.text(c.email, 40, y)
    y += 12
  }
  if (c.phone) {
    doc.text(c.phone, 40, y)
    y += 12
  }
  return y
}

const INVOICE_STATUS_LABELS: Record<string, string> = {
  unpaid: 'Impayée',
  partial: 'Partiellement payée',
  paid: 'Payée',
  overdue: 'En retard',
  cancelled: 'Annulée',
}

export async function generateQuotePDF(quote: PopulatedQuote): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40 })
  const g = quote.garage
  const c = quote.client
  doc.fontSize(18).text('Devis', { continued: false })
  doc.moveDown(0.5)
  doc.fontSize(10).text(`N° ${quote.number}`)
  doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`)
  if (g) {
    doc.moveDown()
    doc.fontSize(12).text(g.name, { continued: false })
    doc.fontSize(10).text(`${g.address?.street ?? ''}, ${g.address?.postalCode ?? ''} ${g.address?.city ?? ''}`)
  }
  if (c) {
    doc.moveDown()
    doc.fontSize(11).text('Client')
    doc.fontSize(10).text(`${c.name} — ${c.phone}${c.email ? ` — ${c.email}` : ''}`)
  }
  doc.moveDown()
  doc.fontSize(10)
  for (const line of quote.lines) {
    doc.text(
      `${line.label} | Qté ${line.quantity} | PU ${line.unitPrice} € | TVA ${line.tva}% | TTC ${line.totalTTC} €`,
    )
  }
  doc.moveDown()
  doc.fontSize(12).text(`TOTAL TTC: ${quote.totalTTC} €`, { underline: true })
  if (quote.validUntil) {
    doc.moveDown()
    doc.fontSize(9).text(`Devis valable jusqu'au ${new Date(quote.validUntil).toLocaleDateString('fr-FR')}`)
  }
  return docBuffer(doc)
}

export async function generateInvoicePDF(invoice: PopulatedInvoice): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40, size: 'A4' })
  const g = invoice.garage
  const c = invoice.client

  const headerY = g ? tryEmbedLogo(doc, g.logo) : 40
  if (g) {
    garageHeaderBlock(doc, g, headerY)
  }

  doc.fontSize(20).fillColor('#1e3a5f').text('FACTURE', 400, 40, { align: 'right', width: 155 })
  doc.fontSize(10).fillColor('#000').text(`N° ${invoice.number}`, 400, 68, { align: 'right', width: 155 })
  doc.text(
    `Date d'émission : ${invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}`,
    400,
    82,
    { align: 'right', width: 155 },
  )
  if (invoice.dueDate) {
    doc.text(`Échéance : ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}`, 400, 96, {
      align: 'right',
      width: 155,
    })
  }

  let y = Math.max(headerY + 20, 130)
  if (c) {
    y = clientBlock(doc, c, y) + 8
  }

  y += 8
  const colX = [40, 200, 240, 290, 340, 390, 450, 510]
  const headers = ['Désignation', 'Qté', 'Prix HT', 'Remise', 'TVA %', 'Total HT', 'Total TTC']
  doc.fontSize(8).fillColor('#444')
  headers.forEach((h, i) => doc.text(h, colX[i], y, { width: i === 0 ? 155 : 48 }))
  y += 14
  doc.moveTo(40, y).lineTo(555, y).stroke('#ccc')
  y += 6

  doc.fontSize(9).fillColor('#000')
  invoice.lines.forEach((line, rowIdx) => {
    if (y > 700) {
      doc.addPage()
      y = 40
    }
    const rowH = 16
    if (rowIdx % 2 === 0) {
      doc.save()
      doc.rect(40, y - 2, 515, rowH).fill('#f9f9f9')
      doc.restore()
    }
    doc.fillColor('#000')
    doc.text(line.label, colX[0], y, { width: 155 })
    doc.text(String(line.quantity), colX[1], y, { width: 36 })
    doc.text(line.unitPrice.toFixed(2), colX[2], y, { width: 44 })
    doc.text(`${line.discount ?? 0}%`, colX[3], y, { width: 44 })
    doc.text(`${line.tva ?? 20}%`, colX[4], y, { width: 44 })
    doc.text(line.totalHT.toFixed(2), colX[5], y, { width: 52 })
    doc.text(line.totalTTC.toFixed(2), colX[6], y, { width: 52 })
    y += rowH
  })

  y += 12
  doc.moveTo(320, y).lineTo(555, y).stroke('#ccc')
  y += 10
  doc.fontSize(10)
  doc.text('Sous-total HT', 320, y)
  doc.text(`${invoice.subtotalHT.toFixed(2)} €`, 480, y, { align: 'right', width: 75 })
  y += 14
  doc.text('Total remise', 320, y)
  doc.text(`${invoice.totalDiscount.toFixed(2)} €`, 480, y, { align: 'right', width: 75 })
  y += 14
  doc.text('Total TVA', 320, y)
  doc.text(`${invoice.totalTVA.toFixed(2)} €`, 480, y, { align: 'right', width: 75 })
  y += 16
  doc.fontSize(14).fillColor('#1e3a5f')
  doc.text('Total TTC', 320, y)
  doc.text(`${invoice.totalTTC.toFixed(2)} €`, 480, y, { align: 'right', width: 75 })

  y += 40
  doc.fontSize(8).fillColor('#666')
  doc.text(
    'Mentions légales : TVA non applicable, article 293 B du CGI — sauf mention contraire. Pénalités de retard applicables.',
    40,
    y,
    { width: 515 },
  )
  y += 28
  const statusLabel = INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status
  doc.fontSize(9).fillColor('#000')
  doc.text(`Statut paiement : ${statusLabel}`, 40, y)
  if (invoice.paymentMethod) {
    doc.text(`Moyen de paiement : ${invoice.paymentMethod}`, 40, y + 12)
    y += 12
  }
  if (invoice.dueDate) {
    doc.text(`Date d'échéance : ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}`, 40, y + 12)
  }

  if (invoice.status === 'paid') {
    doc.save()
    doc.rotate(-35, { origin: [250, 400] })
    doc.fontSize(40).fillColor('grey', 0.2).text('FACTURE ACQUITTÉE', 100, 300)
    doc.restore()
  }

  return docBuffer(doc)
}

export type MaintenanceBookletRow = {
  date: string
  service: string
  mileage: string
  mechanic: string
  status: string
}

export async function generateMaintenanceBookletPdf(input: {
  garageName: string
  client: { name: string; email?: string; phone: string }
  vehicle: { plate: string; make: string; model: string; year?: number }
  rows: MaintenanceBookletRow[]
}): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40 })
  doc.fontSize(18).text('GarageFlow', { continued: false })
  doc.fontSize(12).text(input.garageName)
  doc.moveDown()
  doc.fontSize(14).text("Carnet d'entretien")
  doc.moveDown(0.5)
  doc.fontSize(10).text('Client')
  doc.text(`${input.client.name} — ${input.client.phone}${input.client.email ? ` — ${input.client.email}` : ''}`)
  doc.moveDown(0.5)
  doc.text('Véhicule')
  doc.text(
    `${input.vehicle.make} ${input.vehicle.model}${input.vehicle.year ? ` (${input.vehicle.year})` : ''} — ${input.vehicle.plate}`,
  )
  doc.moveDown()
  doc.fontSize(9).text('Date | Service | Kilométrage | Mécanicien | Statut', { underline: true })
  doc.moveDown(0.3)
  for (const r of input.rows) {
    doc.text(`${r.date} | ${r.service} | ${r.mileage} km | ${r.mechanic} | ${r.status}`)
  }
  if (input.rows.length === 0) {
    doc.text('Aucune intervention enregistrée.')
  }
  return docBuffer(doc)
}

export async function generateClientsListPdf(rows: string[][]): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40 })
  doc.fontSize(14).text('Liste clients')
  doc.moveDown()
  doc.fontSize(9)
  for (const r of rows) {
    doc.text(r.join(' | '))
  }
  return docBuffer(doc)
}
