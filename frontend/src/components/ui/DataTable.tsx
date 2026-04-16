import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ApiMeta } from '@/hooks/api/types'

export type DataColumn<T> = {
  id: string
  header: React.ReactNode
  cell: (row: T) => React.ReactNode
  headerClassName?: string
  cellClassName?: string
}

type DataTableProps<T> = {
  columns: DataColumn<T>[]
  data: T[]
  getRowKey: (row: T) => string
  emptyMessage?: string
  meta?: ApiMeta
  onPageChange?: (page: number) => void
  selectable?: boolean
  selectedIds?: Set<string>
  onToggleRow?: (id: string) => void
  onToggleAll?: (ids: string[]) => void
  bulkBar?: React.ReactNode
}

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  emptyMessage = 'Aucune donnée',
  meta,
  onPageChange,
  selectable,
  selectedIds,
  onToggleRow,
  onToggleAll,
  bulkBar,
}: DataTableProps<T>): React.ReactElement {
  const allIds = data.map(getRowKey)
  const allSelected = selectable && allIds.length > 0 && allIds.every((id) => selectedIds?.has(id))

  return (
    <div className="space-y-3">
      {bulkBar ? (
        <div
          className="flex flex-wrap items-center gap-2 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface-solid)] px-3 py-2 text-sm text-[var(--text-secondary)]"
          style={{ borderColor: 'var(--border)' }}
        >
          {bulkBar}
        </div>
      ) : null}
      <div
        className="overflow-hidden rounded-[var(--radius-card)] border bg-[var(--bg-surface-solid)]"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="overflow-x-auto">
          <table className="gf-data-table w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr
                className="text-[var(--text-secondary)]"
                style={{ background: 'var(--bg-table-header)', color: 'var(--text-secondary)' }}
              >
                {selectable ? (
                  <th className="w-10 px-3 py-3 text-start">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-[var(--border-strong)]"
                      style={{ accentColor: 'var(--accent-primary)' }}
                      checked={allSelected}
                      onChange={() => onToggleAll?.(allIds)}
                      aria-label="Tout sélectionner"
                    />
                  </th>
                ) : null}
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className={cn('border-b px-3 py-3 font-semibold', col.headerClassName)}
                    style={{ borderBottom: '1px solid var(--border-table)', color: 'inherit' }}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="px-3 py-10 text-center"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((row) => {
                  const key = getRowKey(row)
                  return (
                    <tr key={key} className="gf-data-table-row transition-colors">
                      {selectable ? (
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-[var(--border-strong)]"
                            style={{ accentColor: 'var(--accent-primary)' }}
                            checked={selectedIds?.has(key) ?? false}
                            onChange={() => onToggleRow?.(key)}
                            aria-label="Sélectionner la ligne"
                          />
                        </td>
                      ) : null}
                      {columns.map((col) => (
                        <td
                          key={col.id}
                          className={cn('border-b px-3 py-3 align-middle', col.cellClassName)}
                          style={{ borderBottom: '1px solid var(--border-table)', color: 'inherit' }}
                        >
                          {col.cell(row)}
                        </td>
                      ))}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {meta && onPageChange && meta.totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span>
            Page {meta.page} / {meta.totalPages} ({meta.total} résultats)
          </span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={meta.page <= 1}
              onClick={() => onPageChange(meta.page - 1)}
              className="border-[var(--border)] bg-[var(--bg-surface)]"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange(meta.page + 1)}
              className="border-[var(--border)] bg-[var(--bg-surface)]"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
