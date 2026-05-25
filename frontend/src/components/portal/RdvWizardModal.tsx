import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useTranslation } from 'react-i18next'
import { RdvWizard } from '@/components/portal/RdvWizard'

type RdvWizardModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicleId?: string
}

export function RdvWizardModal({ open, onOpenChange, vehicleId }: RdvWizardModalProps) {
  const { t } = useTranslation('clientPortal')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('bookRdvTitle')}</DialogTitle>
        </DialogHeader>
        {open ? (
          <RdvWizard mode="modal" initialVehicleId={vehicleId} onClose={() => onOpenChange(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
