import { Garage } from '@/models/Garage.model'
import type { Types } from 'mongoose'

export let garage1Id: Types.ObjectId
export let garage2Id: Types.ObjectId

export async function seedGarages(): Promise<void> {
  const g1 = await Garage.create({
    name: 'Garage Lefebvre & Fils',
    address: { street: '12 rue de la République', city: 'Paris', postalCode: '75011', country: 'France' },
    phone: '0142000000',
    email: 'contact@lefebvre-garage.fr',
    subscriptionTier: 'pro',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: new Date(Date.now() + 365 * 86400000),
  })
  const g2 = await Garage.create({
    name: 'Auto Service Maghreb',
    address: { street: '45 La Canebière', city: 'Marseille', postalCode: '13001', country: 'France' },
    phone: '0491000000',
    email: 'contact@autoservice-maghreb.fr',
    subscriptionTier: 'basic',
    subscriptionStatus: 'active',
  })
  garage1Id = g1._id
  garage2Id = g2._id
}
