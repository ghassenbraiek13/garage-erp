import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { quoteStatusBadgeVariant, invoiceStatusBadgeVariant } from '@/lib/quoteUtils'

export function QuoteStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation('quotes')
  return (
    <Badge variant={quoteStatusBadgeVariant(status)} className="capitalize">
      {t(`status.${status}`, { defaultValue: status })}
    </Badge>
  )
}

export function InvoiceStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation('quotes')
  return (
    <Badge variant={invoiceStatusBadgeVariant(status)} className="capitalize">
      {t(`invoiceStatus.${status}`, { defaultValue: status })}
    </Badge>
  )
}
