import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function PortalCouponsPage() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {['GF10', 'GF25'].map((c) => (
        <ClayCard key={c} variant="elevated">
          <CardHeader>
            <CardTitle className="text-base font-mono">{c}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid h-32 w-full place-items-center rounded-[var(--radius-card)] border border-dashed border-[var(--border)] bg-white text-black">
              QR
            </div>
          </CardContent>
        </ClayCard>
      ))}
    </div>
  )
}
