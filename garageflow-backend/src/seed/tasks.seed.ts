import { Task } from '@/models/Task.model'
import { User } from '@/models/User.model'
import { Vehicle } from '@/models/Vehicle.model'
import { garage1Id } from './garages.seed'

export async function seedTasks(): Promise<void> {
  const mechanics = await User.find({ garageId: garage1Id, role: 'mechanic' })
  const vehicles = await Vehicle.find({ garageId: garage1Id }).limit(8)
  const cols: Array<'todo' | 'in_progress' | 'done'> = [
    'todo',
    'todo',
    'todo',
    'todo',
    'todo',
    'in_progress',
    'in_progress',
    'in_progress',
    'in_progress',
    'done',
    'done',
    'done',
  ]
  for (let i = 0; i < 12; i += 1) {
    await Task.create({
      garageId: garage1Id,
      title: `Tâche ${i + 1}`,
      description: 'Suivi atelier',
      assigneeId: mechanics[i % mechanics.length]!._id,
      vehicleId: vehicles[i % vehicles.length]._id,
      priority: i % 4 === 0 ? 'urgent' : 'normal',
      status: cols[i],
      dueDate: new Date(Date.now() + 3 * 86400000),
    })
  }
}
