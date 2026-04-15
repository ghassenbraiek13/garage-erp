import PDFDocument from 'pdfkit'
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
  const doc = new PDFDocument({ margin: 40 })
  const g = invoice.garage
  const c = invoice.client
  doc.fontSize(18).text('Facture', { continued: false })
  doc.moveDown(0.5)
  doc.fontSize(10).text(`N° ${invoice.number}`)
  if (g) {
    doc.moveDown()
    doc.fontSize(12).text(g.name)
    doc.fontSize(10).text(`${g.address?.street ?? ''}, ${g.address?.postalCode ?? ''} ${g.address?.city ?? ''}`)
  }
  if (c) {
    doc.moveDown()
    doc.fontSize(11).text('Client')
    doc.fontSize(10).text(`${c.name} — ${c.phone}`)
  }
  doc.moveDown()
  for (const line of invoice.lines) {
    doc.fontSize(10).text(`${line.label} | TTC ${line.totalTTC} €`)
  }
  doc.moveDown()
  doc.fontSize(12).text(`TOTAL TTC: ${invoice.totalTTC} €`)
  if (invoice.status === 'paid') {
    doc.save()
    doc.rotate(-35, { origin: [250, 400] })
    doc.fontSize(40).fillColor('grey', 0.2).text('FACTURE ACQUITTÉE', 100, 300)
    doc.restore()
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
