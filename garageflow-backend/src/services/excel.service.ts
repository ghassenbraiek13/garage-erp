import ExcelJS from 'exceljs'

export async function exportClientsExcel(
  rows: Array<{
    id: string
    name: string
    email: string
    phone: string
    vehicles: number
    points: number
    spent: number
    created: string
  }>,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Clients')
  ws.columns = [
    { header: 'ID', key: 'id', width: 28 },
    { header: 'Nom', key: 'name', width: 24 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Téléphone', key: 'phone', width: 16 },
    { header: 'Véhicules', key: 'vehicles', width: 12 },
    { header: 'Points', key: 'points', width: 10 },
    { header: 'Total dépensé', key: 'spent', width: 14 },
    { header: 'Créé le', key: 'created', width: 14 },
  ]
  const header = ws.getRow(1)
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  header.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E40AF' },
  }
  for (const r of rows) {
    ws.addRow(r)
  }
  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf)
}

export async function exportStockExcel(
  rows: Array<{
    reference: string
    name: string
    category: string
    price: number
    purchase?: number
    stock: number
    minStock: number
    supplier?: string
  }>,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Stock')
  ws.columns = [
    { header: 'Référence', key: 'reference', width: 16 },
    { header: 'Nom', key: 'name', width: 28 },
    { header: 'Catégorie', key: 'category', width: 14 },
    { header: 'Prix vente', key: 'price', width: 12 },
    { header: 'Prix achat', key: 'purchase', width: 12 },
    { header: 'Stock', key: 'stock', width: 10 },
    { header: 'Stock min', key: 'minStock', width: 10 },
    { header: 'Fournisseur', key: 'supplier', width: 20 },
  ]
  const header = ws.getRow(1)
  header.font = { bold: true }
  let i = 2
  for (const r of rows) {
    const row = ws.addRow(r)
    if (r.stock < r.minStock) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFCDD2' },
        }
      })
    }
    i += 1
  }
  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf)
}

export async function exportInvoicesMonthExcel(
  rows: Array<Record<string, string | number>>,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Factures')
  if (rows.length) {
    ws.columns = Object.keys(rows[0]).map((k) => ({ header: k, key: k, width: 18 }))
    for (const r of rows) ws.addRow(r)
  }
  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf)
}
