import type { Part } from '@/types'

const categories = ['Freinage', 'Filtration', 'Éclairage', 'Moteur', 'Suspension'] as const

export const mockParts: Part[] = Array.from({ length: 30 }).map((_, i) => {
  const stock = (i * 7 + 3) % 45
  return {
    id: `p-${i + 1}`,
    reference: `GF-${1000 + i}`,
    name: `Pièce ${categories[i % categories.length]} ${i + 1}`,
    category: categories[i % categories.length],
    price: 12 + i * 3.5,
    stock,
    minStock: 10,
    supplier: i % 2 === 0 ? 'AutoPieces Pro' : 'MecaSupply',
    visibility: i % 4 === 0 ? 'private' : 'public',
  }
})
