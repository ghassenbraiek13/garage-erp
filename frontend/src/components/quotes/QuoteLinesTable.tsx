import { useTranslation } from 'react-i18next'
import type { ApiQuoteLine } from '@/hooks/api/useQuotes'
import { formatTND } from '@/utils/currency'
import { useLocaleStore } from '@/store/locale'

type QuoteLinesTableProps = {
  lines: ApiQuoteLine[]
  subtotalHT?: number
  totalTVA?: number
  totalDiscount?: number
  totalTTC?: number
  readOnly?: boolean
}

export function QuoteLinesTable({
  lines,
  subtotalHT = 0,
  totalTVA = 0,
  totalDiscount = 0,
  totalTTC = 0,
}: QuoteLinesTableProps) {
  const { t } = useTranslation('quotes')
  const locale = useLocaleStore((s) => s.locale)

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="gf-data-table w-full min-w-[640px] text-sm">
          <thead>
            <tr>
              <th>{t('lineType')}</th>
              <th>{t('lineLabel')}</th>
              <th className="text-end">{t('qty')}</th>
              <th className="text-end">{t('unit')}</th>
              <th className="text-end">{t('discountPct')}</th>
              <th className="text-end">{t('tva')}</th>
              <th className="text-end">{t('lineTotal')}</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => (
              <tr key={i}>
                <td className="capitalize">{line.type === 'part' ? t('linePart') : t('lineService')}</td>
                <td>{line.label}</td>
                <td className="text-end">{line.quantity}</td>
                <td className="text-end">{formatTND(line.unitPrice)}</td>
                <td className="text-end">{line.discount ?? 0}%</td>
                <td className="text-end">{line.tva ?? 20}%</td>
                <td className="text-end font-medium">
                  {formatTND(line.totalTTC ?? line.quantity * line.unitPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="ms-auto max-w-xs space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-ink-secondary">{t('subtotalHT')}</span>
          <span>{formatTND(subtotalHT)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-ink-secondary">{t('totalTVA')}</span>
          <span>{formatTND(totalTVA)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-ink-secondary">{t('totalDiscount')}</span>
          <span>{formatTND(totalDiscount)}</span>
        </div>
        <div className="flex justify-between gap-4 border-t border-[var(--border)] pt-2 text-base font-bold">
          <span>{t('totalTTC')}</span>
          <span className="text-clay-primary">{formatTND(totalTTC)}</span>
        </div>
      </div>
    </div>
  )
}
