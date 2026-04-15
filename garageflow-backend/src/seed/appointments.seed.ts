import { Appointment } from '@/models/Appointment.model'
import { Vehicle } from '@/models/Vehicle.model'
import { Service } from '@/models/Service.model'
import { User } from '@/models/User.model'
import { garage1Id } from './garages.seed'

export async function seedAppointments(): Promise<void> {
  const vehicles = await Vehicle.find({ garageId: garage1Id }).limit(20)
  const services = await Service.find({ garageId: garage1Id }).limit(10)
  const mechanics = await User.find({ garageId: garage1Id, role: 'mechanic' })
  const mechIds = mechanics.map((m) => m._id)
  const statuses: Array<'pending' | 'confirmed' | 'cancelled'> = [
    'confirmed',
    'confirmed',
    'confirmed',
    'confirmed',
    'confirmed',
    'confirmed',
    'confirmed',
    'confirmed',
    'confirmed',
    'confirmed',
    'confirmed',
    'confirmed',
    'confirmed',
    'confirmed',
    'confirmed',
    'pending',
    'pending',
    'pending',
    'cancelled',
    'cancelled',
  ]
  for (let i = 0; i < 20; i += 1) {
    const v = vehicles[i % vehicles.length]
    const day = new Date()
    day.setDate(day.getDate() + (i % 14))
    day.setHours(8 + (i % 8), 0, 0, 0)
    const end = new Date(day.getTime() + 60 * 60 * 1000)
    await Appointment.create({
      garageId: garage1Id,
      clientId: v.clientId,
      vehicleId: v._id,
      serviceId: services[i % services.length]._id,
      mechanicId: mechIds[i % mechIds.length],
      start: day,
      end,
      status: statuses[i],
      notes: 'RDV seed',
    })
  }
}
