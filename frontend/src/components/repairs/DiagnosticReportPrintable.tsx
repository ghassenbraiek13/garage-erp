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

export function DiagnosticReportPrintable({
  report,
  vehicleLabel,
  clientLabel,
  reportType,
  garageName = 'GarageFlow',
}: {
  report: DiagnosticReportData
  vehicleLabel?: string
  clientLabel?: string
  reportType: 'general' | 'pre_purchase' | null
  garageName?: string
}) {
  const { t } = useTranslation('diagnostic')
  const dateLabel = report.inspectionDate
    ? format(parseISO(report.inspectionDate), 'PPP', { locale: fr })
    : format(new Date(), 'PPP', { locale: fr })

  return (
    <div className="diagnostic-report-printable hidden print:block">
      <div className="space-y-4 p-8 text-black">
        <header className="border-b border-gray-300 pb-4">
          <p className="text-2xl font-bold">{garageName}</p>
          <p className="text-lg font-semibold">{t('printTitle')}</p>
          <p className="text-sm text-gray-600">
            {reportType === 'pre_purchase' ? t('typePrePurchase') : t('typeGeneral')}
          </p>
        </header>

        <section className="grid grid-cols-2 gap-2 text-sm">
          <p>
            <strong>{t('client')}:</strong> {clientLabel ?? '—'}
          </p>
          <p>
            <strong>{t('vehicle')}:</strong> {vehicleLabel ?? '—'}
          </p>
          <p>
            <strong>{t('inspectionDate')}:</strong> {dateLabel}
          </p>
          <p>
            <strong>{t('mileage')}:</strong> {report.mileage.toLocaleString('fr-FR')} km
          </p>
          <p className="col-span-2">
            <strong>{t('mechanic')}:</strong> {report.mechanicName}
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold">{t('sectionChecklist')}</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-1 text-start">{t('checklistItem')}</th>
                <th className="py-1 text-start">{t('checklistResult')}</th>
              </tr>
            </thead>
            <tbody>
              {CHECKLIST_ITEM_KEYS.map((key) => {
                const st = report.checklist[key] ?? 'good'
                return (
                  <tr key={key} className="border-b border-gray-200">
                    <td className="py-1">{t(`checklist.${key}`)}</td>
                    <td className={cn('py-1 font-medium', statusColor[st])}>{t(`status.${st}`)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

        <section className="text-sm">
          <h2 className="font-semibold">{t('observations')}</h2>
          <p className="whitespace-pre-wrap">{report.observations}</p>
        </section>

        <section className="text-sm">
          <h2 className="font-semibold">{t('recommendedWork')}</h2>
          <p className="whitespace-pre-wrap">{report.recommendedWork}</p>
          <p className="mt-1">
            <strong>{t('urgencyLabel')}:</strong> {t(`urgency.${report.urgency}`)}
          </p>
        </section>

        {report.type === 'pre_purchase' && report.purchaseConclusion ? (
          <section className="rounded border-2 border-gray-800 p-3 text-sm">
            <h2 className="text-lg font-bold">{t('sectionPurchase')}</h2>
            <p className="text-base font-semibold">{t(`purchase.${report.purchaseConclusion}`)}</p>
            <p className="mt-2 whitespace-pre-wrap">{report.purchaseJustification}</p>
            {report.estimatedWorkBeforeUse ? (
              <p className="mt-2">
                <strong>{t('estimatedWork')}:</strong> {report.estimatedWorkBeforeUse}
              </p>
            ) : null}
          </section>
        ) : null}

        <footer className="mt-8 border-t pt-4 text-sm">
          <p>{t('signatureLine')}</p>
          <p className="mt-6 font-medium">{report.mechanicName}</p>
        </footer>
      </div>
    </div>
  )
}
