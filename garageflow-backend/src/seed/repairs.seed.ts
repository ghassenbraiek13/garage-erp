import { Repair } from '@/models/Repair.model'
import { Vehicle } from '@/models/Vehicle.model'
import { Service } from '@/models/Service.model'
import { User } from '@/models/User.model'
import { garage1Id } from './garages.seed'

const STATUSES: Array<'pending' | 'in_progress' | 'waiting_parts' | 'completed' | 'cancelled'> = [
  'pending',
  'pending',
  'pending',
  'pending',
  'in_progress',
  'in_progress',
  'in_progress',
  'in_progress',
  'in_progress',
  'waiting_parts',
  'waiting_parts',
  'completed',
  'completed',
  'completed',
  'completed',
  'completed',
  'completed',
  'completed',
  'completed',
  'cancelled',
]

export async function seedRepairs(): Promise<void> {
  const vehicles = await Vehicle.find({ garageId: garage1Id }).limit(25)
  const services = await Service.find({ garageId: garage1Id }).limit(5)
  const mechanics = await User.find({ garageId: garage1Id, role: 'mechanic' }).select('_id')
  const mechIds = mechanics.map((m) => m._id)
  for (let i = 0; i < 20; i += 1) {
    const v = vehicles[i % vehicles.length]
    const st = STATUSES[i]
    const daysAgo = st === 'completed' ? 5 + i : 0
    const completedAt =
      st === 'completed' ? new Date(Date.now() - daysAgo * 86400000) : undefined
    await Repair.create({
      garageId: garage1Id,
      vehicleId: v._id,
      clientId: v.clientId,
      mechanicId: mechIds[i % mechIds.length],
      serviceIds: services.slice(0, 2).map((s) => s._id),
      status: st,
      priority: i % 4 === 0 ? 'urgent' : 'normal',
      diagnosis: 'Contrôle général',
      notes: 'Intervention seed',
      estimatedDuration: 60,
      startDate: new Date(),
      endDate: st === 'completed' ? completedAt : undefined,
      completedAt,
    })
  }
}
