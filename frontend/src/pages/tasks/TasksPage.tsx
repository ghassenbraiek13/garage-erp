import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { useCreateTask, usePatchTaskStatus, useTasksKanban, type ApiTask, type ApiTaskRepair } from '@/hooks/api/useTasks'
import { useAuthStore } from '@/store/auth'
import { refLabel } from '@/lib/quoteUtils'
import type { TaskStatus } from '@/types'
import { toast } from 'sonner'

const COLS: { key: TaskStatus; titleKey: 'todo' | 'doing' | 'done' }[] = [
  { key: 'todo', titleKey: 'todo' },
  { key: 'in_progress', titleKey: 'doing' },
  { key: 'done', titleKey: 'done' },
]

const ITEM = 'TASK_ME'

function refId(x: unknown): string {
  if (x && typeof x === 'object' && '_id' in x) return String((x as { _id: unknown })._id)
  if (x && typeof x === 'object' && 'id' in x) return String((x as { id: unknown }).id)
  return String(x ?? '')
}

function repairContext(task: ApiTask): ApiTaskRepair | null {
  const r = task.repairId
  if (!r || typeof r === 'string') return null
  return r
}

function priorityVariant(p?: string): 'default' | 'primary' | 'warning' | 'danger' {
  if (p === 'urgent' || p === 'high') return 'danger'
  if (p === 'normal') return 'primary'
  return 'default'
}

function TaskCard({
  task,
  move,
}: {
  task: ApiTask
  move: (id: string, status: TaskStatus) => void
}) {
  const { t } = useTranslation('tasks')
  const repair = repairContext(task)
  const clientName = repair?.clientId ? refLabel(repair.clientId) : '—'
  const vehicleLabel = repair?.vehicleId ? refLabel(repair.vehicleId) : '—'
  const services =
    repair?.serviceIds?.map((s) => (typeof s === 'object' && s?.name ? s.name : refLabel(s))).filter(Boolean) ?? []

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: ITEM,
      item: { id: task.id, from: task.status },
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }),
    [task],
  )

  return (
    <div
      ref={drag as unknown as React.RefCallback<HTMLDivElement>}
      className="cursor-grab rounded-2xl border border-[var(--border)] bg-[var(--bg-sidebar)] p-3 text-sm shadow-clay active:cursor-grabbing"
      style={{ opacity: isDragging ? 0.6 : 1 }}
    >
      <p className="font-semibold text-ink-primary">{task.title}</p>
      <p className="mt-1 text-xs text-ink-secondary">
        <span className="font-medium">{t('client')}:</span> {clientName}
      </p>
      <p className="text-xs text-ink-secondary">
        <span className="font-medium">{t('vehicle')}:</span> {vehicleLabel}
      </p>
      {services.length > 0 ? (
        <ul className="mt-2 list-inside list-disc text-xs text-ink-muted">
          {services.slice(0, 4).map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2">
        <Badge variant={priorityVariant(task.priority)}>{task.priority ?? '—'}</Badge>
        {task.dueDate ? (
          <Badge variant="primary">{new Date(task.dueDate).toLocaleDateString('fr-FR')}</Badge>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {COLS.filter((c) => c.key !== task.status).map((c) => (
          <Button key={c.key} size="sm" variant="secondary" type="button" onClick={() => move(task.id, c.key)}>
            → {t(c.titleKey)}
          </Button>
        ))}
      </div>
    </div>
  )
}

function Column({
  status,
  title,
  tasks,
  move,
}: {
  status: TaskStatus
  title: string
  tasks: ApiTask[]
  move: (id: string, status: TaskStatus) => void
}) {
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: ITEM,
      drop: (item: { id: string }) => move(item.id, status),
      collect: (m) => ({ isOver: m.isOver() }),
    }),
    [status, move],
  )

  return (
    <div
      ref={drop as unknown as React.RefCallback<HTMLDivElement>}
      className="min-h-[240px] rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface)] p-3 shadow-inner"
      style={{ outline: isOver ? '2px dashed var(--accent-primary)' : undefined }}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">{title}</p>
        <Badge variant="primary">{tasks.length}</Badge>
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} move={move} />
        ))}
      </div>
    </div>
  )
}

const taskSchema = z.object({
  title: z.string().min(1),
})

export function TasksPage(): React.ReactElement {
  const { t } = useTranslation(['tasks', 'common'])
  const user = useAuthStore((s) => s.user)
  const userId = user?.id ?? ''
  const [taskOpen, setTaskOpen] = useState(false)
  const { data, isLoading, isError, error, refetch } = useTasksKanban()
  const patch = usePatchTaskStatus()
  const createTask = useCreateTask()
  const taskForm = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: '' },
  })

  const filterMine = (list: ApiTask[]) => list.filter((task) => refId(task.assigneeId) === userId)

  const grouped = useMemo(() => {
    const todo = filterMine(data?.todo ?? [])
    const doing = filterMine(data?.in_progress ?? [])
    const done = filterMine(data?.done ?? [])
    return { todo, in_progress: doing, done }
  }, [data, userId])

  const move = (id: string, status: TaskStatus) => {
    patch.mutate(
      { id, status },
      {
        onError: () => toast.error(t('tasks:updateError')),
      },
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-fluid-h1 font-semibold">{t('tasks:title')}</h1>
            <p className="text-sm text-ink-secondary">{t('tasks:subtitle')}</p>
          </div>
          <Button type="button" onClick={() => setTaskOpen(true)}>
            + {t('tasks:addTask')}
          </Button>
        </div>

        <QueryBoundary
          isLoading={isLoading}
          isError={isError}
          error={error as Error}
          onRetry={() => void refetch()}
          isEmpty={false}
          loading={<TableSkeleton rows={4} />}
          empty={<p className="text-sm text-ink-muted">{t('tasks:empty')}</p>}
        >
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {COLS.map((c) => (
              <Column
                key={c.key}
                status={c.key}
                title={t(`tasks:${c.titleKey}`)}
                tasks={grouped[c.key]}
                move={move}
              />
            ))}
          </div>
        </QueryBoundary>

        <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('tasks:newTaskTitle')}</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-3"
              onSubmit={taskForm.handleSubmit(async (values) => {
                try {
                  await createTask.mutateAsync({
                    title: values.title,
                    status: 'todo',
                    assigneeId: userId,
                  })
                  toast.success(t('tasks:taskCreated'))
                  setTaskOpen(false)
                  taskForm.reset()
                } catch {
                  toast.error(t('tasks:taskCreateError'))
                }
              })}
            >
              <div>
                <Label>{t('tasks:taskTitle')}</Label>
                <Input {...taskForm.register('title')} />
              </div>
              <Button className="w-full" type="submit" disabled={createTask.isPending}>
                {t('common:save')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  )
}
