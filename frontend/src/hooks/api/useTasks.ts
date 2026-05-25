import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/api'

export type ApiTaskRepair = {
  clientId?: { name?: string; email?: string } | string
  vehicleId?: { make?: string; model?: string; plate?: string } | string
  serviceIds?: Array<{ name?: string; price?: number } | string>
}

export type ApiTask = {
  id: string
  title: string
  status: string
  priority?: string
  assigneeId?: unknown
  vehicleId?: unknown
  repairId?: ApiTaskRepair | string | null
  dueDate?: string
  _id?: string
}

export type KanbanData = {
  todo: ApiTask[]
  in_progress: ApiTask[]
  done: ApiTask[]
}

function mapKanTask(raw: Record<string, unknown>): ApiTask {
  return { ...(raw as unknown as ApiTask), id: String(raw._id ?? raw.id ?? '') }
}

export function useMyTasks() {
  return useQuery({
    queryKey: ['tasks', 'me'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Record<string, unknown>[] }>('/tasks/me')
      return data.data.map(mapKanTask)
    },
  })
}

export function useTasksKanban() {
  return useQuery({
    queryKey: ['tasks', 'kanban'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { todo: Record<string, unknown>[]; in_progress: Record<string, unknown>[]; done: Record<string, unknown>[] } }>(
        '/tasks/kanban',
      )
      return {
        todo: data.data.todo.map(mapKanTask),
        in_progress: data.data.in_progress.map(mapKanTask),
        done: data.data.done.map(mapKanTask),
      } satisfies KanbanData
    },
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      title: string
      description?: string
      assigneeId?: string
      priority?: 'low' | 'normal' | 'high' | 'urgent'
      status?: 'todo' | 'in_progress' | 'done'
    }) => {
      const { data } = await api.post('/tasks', body)
      return mapKanTask(data.data as Record<string, unknown>)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function usePatchTaskStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/tasks/${id}/status`, { status })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tasks'] })
      void qc.invalidateQueries({ queryKey: ['tasks', 'me'] })
    },
  })
}
