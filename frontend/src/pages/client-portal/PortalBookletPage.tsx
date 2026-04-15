import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function PortalBookletPage() {
  const items = [
    { date: '2026-03-02', label: 'Vidange + filtres' },
    { date: '2025-11-18', label: 'Freinage AV' },
    { date: '2025-06-10', label: 'Révision annuelle' },
  ]
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Carnet d’entretien</h1>
      <div className="space-y-3">
        {items.map((it) => (
          <ClayCard key={it.date} variant="elevated">
            <CardHeader>
              <CardTitle className="text-base">{it.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-ink-secondary">{it.date}</CardContent>
          </ClayCard>
        ))}
      </div>
    </div>
  )
}
