import { Part } from '@/models/Part.model'
import { garage1Id } from './garages.seed'

const CAT = [
  'filtres',
  'freins',
  'huiles',
  'pneumatiques',
  'electricite',
  'carrosserie',
  'moteur',
  'transmission',
  'suspension',
  'autre',
] as const

export async function seedParts(): Promise<void> {
  for (let i = 0; i < 30; i += 1) {
    const low = i < 8
    const pub = i < 5
    await Part.create({
      garageId: garage1Id,
      reference: `REF-${1000 + i}`,
      name: `Pièce ${i + 1}`,
      category: CAT[i % CAT.length],
      price: 10 + i * 3,
      purchasePrice: 5 + i * 2,
      stock: low ? 2 : 20 + i,
      minStock: 5,
      supplier: 'EuroPieces',
      compatibleVehicles: ['Peugeot 308', 'Renault Clio'],
      isPublic: pub,
    })
  }
}
