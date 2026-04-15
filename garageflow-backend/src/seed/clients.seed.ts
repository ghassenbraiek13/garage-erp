import type { HydratedDocument } from 'mongoose'
import { Client, type IClient } from '@/models/Client.model'
import { garage1Id } from './garages.seed'
import type { Types } from 'mongoose'

export let portalClientId: Types.ObjectId

const DATA = [
  { name: 'Jean Dupont', phone: '0612345678', email: 'jean.dupont@email.fr', city: 'Paris' },
  { name: 'Marie Martin', phone: '0623456789', email: 'marie.martin@email.fr', city: 'Versailles' },
  { name: 'Ahmed Benali', phone: '0634567890', email: 'a.benali@email.fr', city: 'Clichy' },
  { name: 'Sophie Bernard', phone: '0645678901', email: 's.bernard@email.fr', city: 'Boulogne' },
  { name: 'Karim Trabelsi', phone: '0656789012', email: 'k.trabelsi@email.fr', city: 'Levallois' },
  { name: 'Isabelle Moreau', phone: '0667890123', email: 'i.moreau@email.fr', city: 'Neuilly' },
  { name: 'Mohamed Hassani', phone: '0678901234', email: 'm.hassani@email.fr', city: 'Montreuil' },
  { name: 'Claire Fontaine', phone: '0689012345', email: 'c.fontaine@email.fr', city: 'Vincennes' },
  { name: 'Pierre Leroy', phone: '0690123456', email: 'p.leroy@email.fr', city: 'Charenton' },
  { name: 'Fatima Ouali', phone: '0601234567', email: 'f.ouali@email.fr', city: 'Saint-Denis' },
  { name: 'Thomas Garnier', phone: '0611234567', email: 't.garnier@email.fr', city: 'Ivry' },
  { name: 'Nadia Slimane', phone: '0622345678', email: 'n.slimane@email.fr', city: 'Aubervilliers' },
  { name: 'François Petit', phone: '0633456789', email: 'f.petit@email.fr', city: 'Pantin' },
  { name: 'Yasmine Khelil', phone: '0644567890', email: 'y.khelil@email.fr', city: 'Bobigny' },
  { name: 'Nicolas Girard', phone: '0655678901', email: 'n.girard@email.fr', city: 'Créteil' },
]

export async function seedClients(): Promise<void> {
  const created: HydratedDocument<IClient>[] = []
  for (let i = 0; i < DATA.length; i += 1) {
    const d = DATA[i]
    const pts = 100 + Math.floor(Math.random() * 7900)
    const c = await Client.create({
      garageId: garage1Id,
      name: d.name,
      email: d.email,
      phone: d.phone,
      address: { street: `${10 + i} rue Exemple`, city: d.city, postalCode: '75000' },
      loyaltyPoints: pts,
      totalSpent: Math.floor(Math.random() * 5000),
    })
    created.push(c)
  }
  portalClientId = created[0]!._id
}
