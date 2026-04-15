import type { Garage } from '@/types'

export const mockGarages: Garage[] = [
  {
    id: 'g-1',
    name: 'Garage Dupont Performance',
    address: '14 rue des Artisans, Lyon',
    subscriptionTier: 'pro',
    createdAt: '2019-04-12',
    status: 'active',
  },
  {
    id: 'g-2',
    name: 'AutoCare Marseille',
    address: '102 avenue du Prado, Marseille',
    subscriptionTier: 'starter',
    createdAt: '2021-09-03',
    status: 'active',
  },
  {
    id: 'g-3',
    name: 'MecaSud Toulouse',
    address: '8 chemin des Palettes, Toulouse',
    subscriptionTier: 'enterprise',
    createdAt: '2017-01-22',
    status: 'suspended',
  },
]
