import { Quote } from '@/models/Quote.model'
import { Client } from '@/models/Client.model'
import { Vehicle } from '@/models/Vehicle.model'
import { Service } from '@/models/Service.model'
import { Part } from '@/models/Part.model'
import { garage1Id } from './garages.seed'

const STATUSES = ['draft', 'draft', 'draft', 'sent', 'sent', 'accepted', 'accepted', 'invoiced', 'invoiced', 'expired'] as const

export async function seedQuotes(): Promise<void> {
  const clients = await Client.find({ garageId: garage1Id }).limit(5)
  const vehicles = await Vehicle.find({ garageId: garage1Id }).limit(5)
  const services = await Service.find({ garageId: garage1Id }).limit(3)
  const parts = await Part.find({ garageId: garage1Id }).limit(2)
  for (let i = 0; i < 10; i += 1) {
    const c = clients[i % clients.length]
    const v = vehicles[i % vehicles.length]
    const lines = [
      {
        type: 'service' as const,
        refId: services[0]!._id,
        label: services[0]!.name,
        quantity: 1,
        unitPrice: services[0]!.price,
        discount: 0,
        tva: 20,
        totalHT: 0,
        totalTTC: 0,
      },
      {
        type: 'part' as const,
        refId: parts[0]!._id,
        label: parts[0]!.name,
        quantity: 1,
        unitPrice: parts[0]!.price,
        discount: 5,
        tva: 20,
        totalHT: 0,
        totalTTC: 0,
      },
    ]
    await Quote.create({
      garageId: garage1Id,
      clientId: c._id,
      vehicleId: v._id,
      lines,
      status: STATUSES[i],
      validUntil: new Date(Date.now() + 30 * 86400000),
      notes: 'Devis seed',
    })
  }
}
