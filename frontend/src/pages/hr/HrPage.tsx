import { useMemo } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableSkeleton } from '@/components/ui/TableSkeleton'
import { useTasksKanban, usePatchTaskStatus, type ApiTask } from '@/hooks/api/useTasks'
import { useMechanics } from '@/hooks/api/useUsers'
import type { TaskStatus } from '@/types'
import { toast } from 'sonner'

const COLS: { key: TaskStatus; titleKey: 'todo' | 'doing' | 'done' }[] = [
  { key: 'todo', titleKey: 'todo' },
  { key: 'in_progress', titleKey: 'doing' },
  { key: 'done', titleKey: 'done' },
]

const ITEM = 'TASK'

function popName(x: unknown): string {
  if (x && typeof x === 'object' && 'name' in x && typeof (x as { name: unknown }).name === 'string') {
    return (x as { name: string }).name
  }
  return '—'
}

function refId(x: unknown): string {
  if (x && typeof x === 'object' && '_id' in x) return String((x as { _id: unknown })._id)
  return String(x ?? '')
}

function TaskCard({
  task,
  move,
}: {
  task: ApiTask
  move: (id: string, status: TaskStatus) => void
}) {
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
      <p className="text-xs text-ink-secondary">{popName(task.assigneeId)}</p>
      <p className="mt-2 text-xs text-ink-muted">{popName(task.vehicleId)}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Badge variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'default'}>
          {task.priority ?? '—'}
        </Badge>
        {task.dueDate ? (
          <Badge variant="primary">{new Date(task.dueDate).toLocaleDateString('fr-FR')}</Badge>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {COLS.filter((c) => c.key !== task.status).map((c) => (
          <Button key={c.key} size="sm" variant="secondary" type="button" onClick={() => move(task.id, c.key)}>
            → {c.titleKey}
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
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} move={move} />
        ))}
        <Button className="w-full" variant="ghost" type="button" onClick={() => toast.message('Création tâche — bientôt')}>
          + Ajouter
        </Button>
      </div>
    </div>
  )
}

export function HrPage(): React.ReactElement {
  const { t } = useTranslation('hr')
  const { data, isLoading, isError, error, refetch } = useTasksKanban()
  const patch = usePatchTaskStatus()
  const { data: mechanics } = useMechanics()

  const grouped = useMemo(() => {
    const todo = data?.todo ?? []
    const doing = data?.in_progress ?? []
    const done = data?.done ?? []
    return { todo, in_progress: doing, done }
  }, [data])

  const move = (id: string, status: TaskStatus) => {
    patch.mutate(
      { id, status },
      {
        onError: () => toast.error('Mise à jour impossible'),
      },
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-4">
        <div>
          <h1 className="text-fluid-h1 font-semibold">{t('title')}</h1>
          <p className="text-sm text-ink-secondary">Kanban — données API</p>
        </div>

        <QueryBoundary
          isLoading={isLoading}
          isError={isError}
          error={error as Error}
          onRetry={() => void refetch()}
          isEmpty={false}
          loading={<TableSkeleton rows={4} />}
          empty={<p className="text-sm text-ink-muted">Aucune tâche</p>}
        >
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {COLS.map((c) => (
              <Column
                key={c.key}
                status={c.key}
                title={t(c.titleKey)}
                tasks={grouped[c.key]}
                move={move}
              />
            ))}
          </div>
        </QueryBoundary>

        <ClayCard variant="elevated">
          <CardHeader>
            <CardTitle className="text-base">{t('roster')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {(mechanics ?? []).map((m) => (
              <div key={m.id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-sidebar)] p-4">
                <p className="font-semibold">{m.name}</p>
                <p className="text-xs text-ink-secondary">Tâches assignées</p>
                <ul className="mt-2 list-disc ps-5 text-sm text-ink-secondary">
                  {[...grouped.todo, ...grouped.in_progress, ...grouped.done]
                    .filter((x) => refId(x.assigneeId) === m.id)
                    .slice(0, 3)
                    .map((x) => (
                      <li key={x.id}>{x.title}</li>
                    ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </ClayCard>
      </div>
    </DndProvider>
  )
}
