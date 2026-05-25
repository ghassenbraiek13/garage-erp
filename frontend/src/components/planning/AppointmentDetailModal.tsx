import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { ApiAppointment } from '@/hooks/api/useAppointments'
import { refLabel } from '@/lib/quoteUtils'

type AppointmentDetailModalProps = {
  open: boolean
  onClose: () => void
  appointment: ApiAppointment | null
  onDelete?: () => void
  deletePending?: boolean
}

export function AppointmentDetailModal({
  open,
  onClose,
  appointment,
  onDelete,
  deletePending,
}: AppointmentDetailModalProps): React.ReactElement {
  const { t } = useTranslation(['planning', 'common'])

  if (!appointment) {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent />
      </Dialog>
    )
  }

  const start = new Date(appointment.start)
  const end = new Date(appointment.end)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('planning:appointmentDetailTitle')}</DialogTitle>
          <DialogDescription>
            {format(start, 'PPp', { locale: fr })} — {format(end, 'HH:mm', { locale: fr })}
          </DialogDescription>
        </DialogHeader>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase text-ink-muted">{t('planning:fieldClient')}</dt>
            <dd className="font-medium text-ink-primary">{refLabel(appointment.clientId)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-ink-muted">{t('planning:fieldVehicle')}</dt>
            <dd className="font-medium text-ink-primary">{refLabel(appointment.vehicleId)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-ink-muted">{t('planning:fieldMechanic')}</dt>
            <dd className="font-medium text-ink-primary">{refLabel(appointment.mechanicId, '—')}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-ink-muted">{t('planning:fieldService')}</dt>
            <dd className="font-medium text-ink-primary">{refLabel(appointment.serviceId, '—')}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-ink-muted">{t('common:status')}</dt>
            <dd>
              <Badge variant="primary">{appointment.status}</Badge>
            </dd>
          </div>
          {appointment.notes ? (
            <div>
              <dt className="text-xs font-semibold uppercase text-ink-muted">{t('planning:fieldNotes')}</dt>
              <dd className="text-ink-secondary">{appointment.notes}</dd>
            </div>
          ) : null}
        </dl>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            {t('common:close')}
          </Button>
          {onDelete ? (
            <Button variant="danger" type="button" disabled={deletePending} onClick={onDelete}>
              {t('common:delete')}
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
