export function TableSkeleton({ rows = 6 }: { rows?: number }): React.ReactElement {
  return (
    <div className="space-y-2 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-surface-solid)] p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-10 animate-shimmer rounded-lg bg-gradient-to-r from-[var(--bg-table-row-alt)] via-[var(--bg-table-header)] to-[var(--bg-table-row-alt)] bg-[length:200%_100%]"
        />
      ))}
    </div>
  )
}
