import { zodResolver } from '@hookform/resolvers/zod'
import { Copy, QrCode } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClayCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { mockClients } from '@/mocks/mockClients'

const couponSchema = z.object({
  type: z.enum(['percent', 'fixed']),
  value: z.coerce.number().min(1),
  minSpend: z.coerce.number().min(0),
  expiresAt: z.string().min(4),
  usageLimit: z.coerce.number().min(1),
})

const tiers = ['Bronze', 'Silver', 'Gold'] as const

export function LoyaltyPage() {
  const { t } = useTranslation('loyalty')
  const [open, setOpen] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const form = useForm<z.infer<typeof couponSchema>>({ resolver: zodResolver(couponSchema), defaultValues: { type: 'percent' } })

  const coupons = [
    { code: 'GF10', value: '10%', expires: '2026-06-01' },
    { code: 'GF25', value: '25€', expires: '2026-05-15' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-fluid-h1 font-semibold">{t('title')}</h1>
          <p className="text-sm text-ink-secondary">Points, paliers et coupons</p>
        </div>
        <Button type="button" onClick={() => setOpen(true)}>
          {t('coupon')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {mockClients.slice(0, 9).map((c, idx) => (
          <ClayCard key={c.id} variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">{c.name}</CardTitle>
              <Badge variant="purple">{tiers[idx % tiers.length]}</Badge>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                {t('points')}: <span className="font-semibold">{c.loyaltyPoints}</span>
              </p>
              <p className="text-xs text-ink-secondary">Historique disponible dans le CRM.</p>
            </CardContent>
          </ClayCard>
        ))}
      </div>

      <ClayCard variant="elevated">
        <CardHeader>
          <CardTitle className="text-base">{t('activeCoupons')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {coupons.map((cp) => (
            <div key={cp.code} className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-sidebar)] px-3 py-2 text-sm">
              <span className="font-mono font-semibold">{cp.code}</span>
              <span className="text-ink-secondary">{cp.value}</span>
              <Button
                size="sm"
                variant="secondary"
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(cp.code)
                  toast.success('Code copié')
                }}
              >
                <Copy className="h-4 w-4" />
                {t('copy')}
              </Button>
              <Button size="sm" variant="secondary" type="button" onClick={() => setQrOpen(true)}>
                <QrCode className="h-4 w-4" />
                {t('qr')}
              </Button>
            </div>
          ))}
        </CardContent>
      </ClayCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('coupon')}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={form.handleSubmit(() => {
              toast.success('Coupon créé (démo)')
              setOpen(false)
            })}
          >
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Type</Label>
                <select className="h-11 w-full rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--bg-surface)] px-3" {...form.register('type')}>
                  <option value="percent">%</option>
                  <option value="fixed">€</option>
                </select>
              </div>
              <div>
                <Label>Valeur</Label>
                <Input type="number" {...form.register('value')} />
              </div>
            </div>
            <div>
              <Label>{t('coupon')} min</Label>
              <Input type="number" {...form.register('minSpend')} />
            </div>
            <div>
              <Label>Expire</Label>
              <Input type="date" {...form.register('expiresAt')} />
            </div>
            <div>
              <Label>Limite d’usage</Label>
              <Input type="number" {...form.register('usageLimit')} />
            </div>
            <Button className="w-full" type="submit">
              Créer
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('qr')}</DialogTitle>
          </DialogHeader>
          <div className="mx-auto grid h-48 w-48 place-items-center rounded-[var(--radius-card)] border border-dashed border-[var(--border)] bg-white text-black">
            QR
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
