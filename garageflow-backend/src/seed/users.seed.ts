import { User } from '@/models/User.model'
import { garage1Id, garage2Id } from './garages.seed'
import { portalClientId } from './clients.seed'

export async function seedUsers(): Promise<void> {
  await User.create({
    email: 'manager@garageflow.app',
    password: 'Manager@2024!',
    name: 'Marc Lefebvre',
    role: 'manager',
    garageId: garage1Id,
  })
  await User.create({
    email: 'mechanic1@garageflow.app',
    password: 'Mechanic@2024!',
    name: 'Lucas Mécano',
    role: 'mechanic',
    garageId: garage1Id,
  })
  await User.create({
    email: 'mechanic2@garageflow.app',
    password: 'Mechanic@2024!',
    name: 'Sara Atelier',
    role: 'mechanic',
    garageId: garage1Id,
  })
  await User.create({
    email: 'cashier@garageflow.app',
    password: 'Cashier@2024!',
    name: 'Julie Accueil',
    role: 'cashier',
    garageId: garage1Id,
  })
  await User.create({
    email: 'client@garageflow.app',
    password: 'Client@2024!',
    name: 'Jean Portail',
    role: 'client',
    garageId: garage1Id,
    clientId: portalClientId,
  })
  await User.create({
    email: 'manager.marseille@garageflow.app',
    password: 'Manager@2024!',
    name: 'Omar Manager',
    role: 'manager',
    garageId: garage2Id,
  })
}
