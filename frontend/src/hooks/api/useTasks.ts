import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/api'

export type ApiTask = {
  id: string
  title: string
  status: string
  priority?: string
  assigneeId?: unknown
  vehicleId?: unknown
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

export function usePatchTaskStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/tasks/${id}/status`, { status })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
