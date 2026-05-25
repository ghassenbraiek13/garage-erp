import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import {
  CHECKLIST_ITEM_KEYS,
  type ChecklistStatus,
  type DiagnosticReportData,
} from '@/lib/diagnosticReport'
import { cn } from '@/lib/utils'

const statusColor: Record<ChecklistStatus, string> = {
  good: 'text-clay-green',
  watch: 'text-clay-orange',
  replace: 'text-clay-red',
}

export function DiagnosticReportView({
  report,
  reportType,
}: {
  report: DiagnosticReportData
  reportType: 'general' | 'pre_purchase' | null
}) {
  const { t } = useTranslation('diagnostic')
  const dateLabel = report.inspectionDate
    ? format(parseISO(report.inspectionDate), 'PPP', { locale: fr })
    : '—'

  return (
    <div className="space-y-4 text-sm">
      <div className="grid gap-2 sm:grid-cols-2">
        <p>
          <span className="font-semibold text-ink-primary">{t('inspectionDate')}:</span> {dateLabel}
        </p>
        <p>
          <span className="font-semibold text-ink-primary">{t('mileage')}:</span>{' '}
          {report.mileage.toLocaleString('fr-FR')} km
        </p>
        <p className="sm:col-span-2">
          <span className="font-semibold text-ink-primary">{t('mechanic')}:</span> {report.mechanicName}
        </p>
      </div>

      <section>
        <h3 className="mb-2 font-semibold text-ink-primary">{t('sectionChecklist')}</h3>
        <ul className="space-y-1">
          {CHECKLIST_ITEM_KEYS.map((key) => {
            const st = report.checklist[key] ?? 'good'
            return (
              <li key={key} className="flex justify-between gap-2 border-b border-[var(--border)] py-1">
                <span>{t(`checklist.${key}`)}</span>
                <span className={cn('font-medium', statusColor[st])}>{t(`status.${st}`)}</span>
              </li>
            )
          })}
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-ink-primary">{t('observations')}</h3>
        <p className="whitespace-pre-wrap text-ink-secondary">{report.observations}</p>
      </section>

      <section>
        <h3 className="font-semibold text-ink-primary">{t('recommendedWork')}</h3>
        <p className="whitespace-pre-wrap text-ink-secondary">{report.recommendedWork}</p>
        <p className="mt-1 text-ink-secondary">
          <span className="font-semibold">{t('urgencyLabel')}:</span> {t(`urgency.${report.urgency}`)}
        </p>
      </section>

      {reportType === 'pre_purchase' && report.purchaseConclusion ? (
        <section className="rounded-lg border-2 border-[var(--border-strong)] bg-[var(--bg-table-header)] p-3">
          <h3 className="font-semibold text-ink-primary">{t('sectionPurchase')}</h3>
          <p className="text-base font-semibold text-clay-primary">{t(`purchase.${report.purchaseConclusion}`)}</p>
          <p className="mt-2 whitespace-pre-wrap text-ink-secondary">{report.purchaseJustification}</p>
          {report.estimatedWorkBeforeUse ? (
            <p className="mt-2 text-ink-secondary">
              <span className="font-semibold">{t('estimatedWork')}:</span> {report.estimatedWorkBeforeUse}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
