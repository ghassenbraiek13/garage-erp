import { format } from 'date-fns'
import { arSA, fr } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp, Pencil, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AddVehicleModal } from '@/components/portal/AddVehicleModal'
import { ClientEditModal } from '@/components/clients/ClientEditModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog'
import type { ApiClient } from '@/hooks/api/useClients'
import { useClientRepairs } from '@/hooks/api/useClients'
import { useClientVehicles, useVehicleRepairs } from '@/hooks/api/useVehicles'
import { cn, formatNumber } from '@/lib/utils'
import { formatTND } from '@/utils/currency'
import { useLocaleStore } from '@/store/locale'

function tierBadgeClass(tier?: string): string {
  switch (tier) {
    case 'gold':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300'
    case 'silver':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300'
    default:
      return 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300'
  }
}

function sectionTitleClass(): string {
  return cn(
    'mb-3 pb-2 text-sm font-semibold uppercase tracking-wide text-ink-muted',
    'border-b border-[var(--border)]',
  )
}

type ClientDetailModalProps = {
  client: ApiClient | null
  open: boolean
  onClose: () => void
  onClientUpdated?: (client: ApiClient) => void
}

function VehicleHistoryBlock({ vehicleId }: { vehicleId: string }) {
  const { t } = useTranslation(['clients', 'common'])
  const locale = useLocaleStore((s) => s.locale)
  const localeDate = locale === 'ar' ? arSA : fr
  const { data: repairs = [] } = useVehicleRepairs(vehicleId)

  if (!repairs.length) {
    return <p className="text-xs text-ink-muted ps-2">{t('clients:noRepairs')}</p>
  }

  return (
    <ul className="mt-2 space-y-2 border-s-2 border-[var(--border)] ps-3">
      {repairs.map((r) => {
        const id = String(r._id ?? r.id ?? '')
        const createdAt = r.createdAt ? String(r.createdAt) : undefined
        return (
          <li key={id} className="text-xs text-ink-secondary">
            <span className="font-medium text-ink-primary">{String(r.status ?? '—')}</span>
            {createdAt ? (
              <span className="ms-2 text-ink-muted">
                {format(new Date(createdAt), 'PP', { locale: localeDate })}
              </span>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

export function ClientDetailModal({ client, open, onClose, onClientUpdated }: ClientDetailModalProps) {
  const { t } = useTranslation(['clients', 'common'])
  const locale = useLocaleStore((s) => s.locale)
  const localeDate = locale === 'ar' ? arSA : fr
  const { data: vehicles, refetch: refetchVehicles } = useClientVehicles(client?.id, 'garage')
  const { data: repairsRaw } = useClientRepairs(client?.id)
  const [editOpen, setEditOpen] = useState(false)
  const [addVehicleOpen, setAddVehicleOpen] = useState(false)
  const [expandedVehicleId, setExpandedVehicleId] = useState<string | null>(null)

  if (!client) return null

  const tier = client.loyaltyTier ?? 'bronze'

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent
          className={cn(
            'max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border)]',
            'bg-[var(--bg-surface)] p-6 shadow-clay',
            'max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:left-0 max-sm:max-h-[92vh]',
            'max-sm:w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-2xl',
            '[&>button:last-child]:hidden',
          )}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
          >
            <div className="absolute end-4 top-4 z-10 flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setEditOpen(true)}
                className="gap-1"
              >
                <Pencil className="h-3.5 w-3.5" />
                {t('common:edit')}
              </Button>
              <DialogClose
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full',
                  'text-ink-muted transition-colors hover:bg-[var(--bg-sidebar)] hover:text-ink-primary',
                )}
                aria-label={t('common:close')}
              >
                <X className="h-4 w-4" />
              </DialogClose>
            </div>

            <header className="pe-28">
              <h2 className="text-lg font-bold text-ink-primary">{client.name}</h2>
              <p className="text-sm text-ink-secondary">
                {[client.email, client.phone].filter(Boolean).join(' · ') || '—'}
              </p>
            </header>

            <div className="mt-6 space-y-6">
              <section>
                <h3 className={sectionTitleClass()}>{t('clients:personalInfo')}</h3>
                <dl className="grid gap-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-secondary">{t('clients:name')}</dt>
                    <dd className="font-medium text-ink-primary">{client.name}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-secondary">{t('clients:email')}</dt>
                    <dd className="text-ink-primary">{client.email ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-secondary">{t('clients:phone')}</dt>
                    <dd className="text-ink-primary">{client.phone}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-secondary">{t('clients:address')}</dt>
                    <dd className="text-end text-ink-primary">
                      {client.address
                        ? [client.address.street, client.address.postalCode, client.address.city]
                            .filter(Boolean)
                            .join(', ')
                        : '—'}
                    </dd>
                  </div>
                </dl>
              </section>

              <section>
                <h3 className={sectionTitleClass()}>{t('clients:vehicles')}</h3>
                <div className="space-y-2">
                  {(vehicles ?? []).map((v) => (
                    <div
                      key={v.id}
                      className="rounded-xl border border-[var(--border)] bg-[var(--bg-sidebar)] px-3 py-2 text-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-ink-primary">
                            {v.make} {v.model}
                            {v.year ? ` (${v.year})` : ''}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge variant="primary">{v.plate}</Badge>
                            <span className="text-xs text-ink-muted">
                              {(v.mileage ?? 0).toLocaleString(locale === 'ar' ? 'ar-TN' : 'fr-FR')} km
                            </span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="gap-1 text-xs"
                          onClick={() =>
                            setExpandedVehicleId((cur) => (cur === v.id ? null : v.id))
                          }
                        >
                          {t('clients:viewHistory')}
                          {expandedVehicleId === v.id ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                      {expandedVehicleId === v.id ? <VehicleHistoryBlock vehicleId={v.id} /> : null}
                    </div>
                  ))}
                  {!vehicles?.length ? (
                    <p className="text-sm text-ink-muted">{t('clients:noVehicles')}</p>
                  ) : null}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-2 gap-1"
                    onClick={() => setAddVehicleOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    {t('clients:addVehicle')}
                  </Button>
                </div>
              </section>

              <section>
                <h3 className={sectionTitleClass()}>{t('clients:history')}</h3>
                <div className="space-y-2">
                  {(repairsRaw ?? []).map((r) => {
                    const id = String(r._id ?? r.id ?? '')
                    const status = String(r.status ?? '—')
                    const createdAt = r.createdAt ? String(r.createdAt) : undefined
                    return (
                      <div
                        key={id}
                        className="rounded-xl border border-[var(--border)] bg-[var(--bg-sidebar)] px-3 py-2 text-sm"
                      >
                        <p className="font-medium text-ink-primary">{status}</p>
                        {createdAt ? (
                          <p className="text-xs text-ink-muted">
                            {format(new Date(createdAt), 'PP', { locale: localeDate })}
                          </p>
                        ) : null}
                      </div>
                    )
                  })}
                  {!repairsRaw?.length ? (
                    <p className="text-sm text-ink-muted">{t('clients:noRepairs')}</p>
                  ) : null}
                </div>
              </section>

              <section>
                <h3 className={sectionTitleClass()}>{t('clients:loyalty')}</h3>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-ink-secondary">{t('clients:loyaltyPoints')}:</span>
                  <span className="font-semibold text-ink-primary">
                    {formatNumber(client.loyaltyPoints ?? 0, locale)}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
                      tierBadgeClass(tier),
                    )}
                  >
                    {t(`clients:tier.${tier}`, { defaultValue: tier })}
                  </span>
                  <span className="ms-auto text-ink-secondary">{t('clients:spent')}:</span>
                  <span className="font-semibold text-ink-primary">
                    {formatTND(client.totalSpent ?? 0)}
                  </span>
                </div>
              </section>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      <ClientEditModal
        client={client}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={(updated) => {
          onClientUpdated?.(updated)
          setEditOpen(false)
        }}
      />

      <AddVehicleModal
        open={addVehicleOpen}
        onOpenChange={setAddVehicleOpen}
        clientId={client.id}
        onCreated={() => void refetchVehicles()}
      />
    </>
  )
}
