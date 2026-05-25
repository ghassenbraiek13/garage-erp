export type DefaultPrestation = {
  label: string
  description?: string
  category: string
  requiresReport?: boolean
  hint?: string
}

export const DEFAULT_PRESTATIONS: DefaultPrestation[] = [
  {
    label: 'Diagnostic général',
    description: 'Bruit, vibration, voyant allumé, panne inconnue',
    category: 'diagnostic',
    requiresReport: true,
    hint: 'general',
  },
  {
    label: 'Diagnostic avant achat',
    description: "Inspection complète d'un véhicule avant acquisition",
    category: 'diagnostic',
    requiresReport: true,
    hint: 'prePurchase',
  },
  { label: 'Vidange huile moteur', category: 'vidange' },
  { label: 'Remplacement filtre à huile', category: 'vidange' },
  { label: 'Remplacement filtre à air', category: 'vidange' },
  { label: 'Remplacement filtre d\'habitacle', category: 'vidange' },
  { label: 'Remplacement filtre à carburant', category: 'vidange' },
  { label: 'Contrôle système de freinage', category: 'freinage' },
  { label: 'Remplacement plaquettes de frein', category: 'freinage' },
  { label: 'Remplacement disques de frein', category: 'freinage' },
  { label: 'Purge circuit de freinage', category: 'freinage' },
  { label: 'Changement de pneus', category: 'pneumatique' },
  { label: 'Équilibrage des roues', category: 'pneumatique' },
  { label: 'Permutation des pneus', category: 'pneumatique' },
  { label: 'Réparation crevaison', category: 'pneumatique' },
  { label: "Gonflage à l'azote", category: 'pneumatique' },
  { label: 'Recharge climatisation', category: 'climatisation' },
  { label: 'Diagnostic climatisation', category: 'climatisation' },
  { label: 'Remplacement filtre climatisation', category: 'climatisation' },
  { label: 'Test et remplacement batterie', category: 'electricite' },
  { label: 'Diagnostic électronique (OBD)', category: 'electricite' },
  { label: 'Remplacement alternateur', category: 'electricite' },
  { label: 'Remplacement démarreur', category: 'electricite' },
  { label: 'Contrôle carrosserie', category: 'carrosserie' },
  { label: 'Réparation pare-brise', category: 'carrosserie' },
  { label: 'Lavage extérieur', category: 'lavage' },
  { label: 'Lavage intérieur complet', category: 'lavage' },
  { label: 'Lavage + désinfection habitacle', category: 'lavage' },
  { label: 'Révision complète', category: 'autre' },
  { label: 'Contrôle technique préparatoire', category: 'autre' },
  { label: 'Remplacement courroie de distribution', category: 'autre' },
  { label: 'Remplacement amortisseurs', category: 'autre' },
]

export const DEFAULT_GROUP_ORDER = [
  'diagnostic',
  'vidange',
  'freinage',
  'pneumatique',
  'climatisation',
  'electricite',
  'carrosserie',
  'lavage',
  'autre',
] as const

export function garagePrestationKey(id: string): string {
  return `garage:${id}`
}

export function defaultPrestationKey(label: string): string {
  return `default:${label}`
}

export function parsePrestationKey(key: string): { kind: 'garage' | 'default'; id?: string; label?: string } | null {
  if (key.startsWith('garage:')) return { kind: 'garage', id: key.slice(7) }
  if (key.startsWith('default:')) return { kind: 'default', label: key.slice(8) }
  return null
}

export function getDefaultPrestationByKey(key: string): DefaultPrestation | undefined {
  const parsed = parsePrestationKey(key)
  if (parsed?.kind !== 'default' || !parsed.label) return undefined
  return DEFAULT_PRESTATIONS.find((p) => p.label === parsed.label)
}

export function buildNotesWithPrestation(prestationLabel: string, userNotes?: string): string {
  const prefix = `[Prestation: ${prestationLabel}]`
  const trimmed = userNotes?.trim()
  return trimmed ? `${prefix}\n${trimmed}` : prefix
}

export const DIAGNOSTIC_NOTES_PREFIX = '[Prestation: Diagnostic'

export function isDiagnosticRepairNotes(notes?: string | null): boolean {
  return Boolean(notes?.startsWith(DIAGNOSTIC_NOTES_PREFIX))
}

export function getDiagnosticTypeFromNotes(notes?: string | null): 'general' | 'pre_purchase' | null {
  if (!notes) return null
  if (notes.includes('[Prestation: Diagnostic général]')) return 'general'
  if (notes.includes('[Prestation: Diagnostic avant achat]')) return 'pre_purchase'
  if (notes.startsWith(DIAGNOSTIC_NOTES_PREFIX)) return 'general'
  return null
}
