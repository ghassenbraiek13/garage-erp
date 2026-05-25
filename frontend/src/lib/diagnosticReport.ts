export type ChecklistStatus = 'good' | 'watch' | 'replace'

export type DiagnosticReportData = {
  version: 1
  type: 'general' | 'pre_purchase'
  inspectionDate: string
  mileage: number
  mechanicId: string
  mechanicName: string
  checklist: Record<string, ChecklistStatus>
  observations: string
  recommendedWork: string
  urgency: 'immediate' | '1_month' | '3_months' | 'not_urgent'
  purchaseConclusion?: 'recommended' | 'reserves' | 'not_recommended'
  purchaseJustification?: string
  estimatedWorkBeforeUse?: string
}

export const CHECKLIST_ITEM_KEYS = [
  'engine',
  'gearbox',
  'braking',
  'steeringSuspension',
  'tyres',
  'batteryElectrical',
  'ac',
  'lighting',
  'bodyChassis',
  'fluids',
  'timingBelt',
  'exhaust',
] as const

export type ChecklistItemKey = (typeof CHECKLIST_ITEM_KEYS)[number]

export function parseDiagnosticReport(diagnosis?: string | null): DiagnosticReportData | null {
  if (!diagnosis?.trim()) return null
  try {
    const parsed = JSON.parse(diagnosis) as DiagnosticReportData
    if (parsed?.version === 1 && parsed.checklist) return parsed
  } catch {
    /* legacy plain text */
  }
  return null
}

export function hasDiagnosticReport(diagnosis?: string | null): boolean {
  return parseDiagnosticReport(diagnosis) !== null
}
