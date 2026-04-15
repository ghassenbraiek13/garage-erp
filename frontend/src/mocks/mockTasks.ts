import type { Task } from '@/types'

const statuses = ['todo', 'doing', 'done'] as const
const prios = ['low', 'medium', 'high'] as const

export const mockTasks: Task[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `t-${i + 1}`,
  title: `Tâche atelier #${i + 1}`,
  assigneeId: `m-${(i % 3) + 1}`,
  vehicleId: `v-${(i % 25) + 1}`,
  priority: prios[i % prios.length],
  status: statuses[i % statuses.length],
  dueDate: new Date(2026, 3, 5 + (i % 10)).toISOString(),
}))
