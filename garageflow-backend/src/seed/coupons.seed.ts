import { Coupon } from '@/models/Coupon.model'
import { qrToBase64 } from '@/services/qr.service'
import { garage1Id } from './garages.seed'

const ROWS = [
  { code: 'BIENVENUE20', type: 'percentage' as const, value: 20, maxUses: 100 },
  { code: 'FIDELITE50', type: 'fixed' as const, value: 50, minSpend: 200 },
  { code: 'LAVAGE10', type: 'percentage' as const, value: 10 },
  { code: 'ETE2024', type: 'percentage' as const, value: 15, expiresAt: new Date('2024-12-31') },
  { code: 'VIP100', type: 'fixed' as const, value: 100, minSpend: 500, maxUses: 10 },
  { code: 'REVISION25', type: 'percentage' as const, value: 25, maxUses: 50 },
]

export async function seedCoupons(): Promise<void> {
  for (const row of ROWS) {
    const qrCode = await qrToBase64(`${row.code}:${garage1Id.toString()}`)
    await Coupon.create({
      garageId: garage1Id,
      code: row.code,
      type: row.type,
      value: row.value,
      minSpend: (row as { minSpend?: number }).minSpend ?? 0,
      maxUses: (row as { maxUses?: number }).maxUses ?? null,
      expiresAt: row.expiresAt,
      qrCode,
      isActive: true,
    })
  }
}
