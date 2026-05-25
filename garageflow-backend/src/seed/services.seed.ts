import { Service, type DiagnosticKind } from '@/models/Service.model'
import { garage1Id } from './garages.seed'

type ServiceRow = {
  name: string
  category:
    | 'lavage'
    | 'vidange'
    | 'freinage'
    | 'diagnostic'
    | 'pneumatique'
    | 'carrosserie'
    | 'electricite'
    | 'climatisation'
    | 'autre'
  price: number
  duration: number
  description?: string
  diagnosticKind?: DiagnosticKind
}

const ROWS: ServiceRow[] = [
  { name: 'Vidange moteur', category: 'vidange', price: 49.9, duration: 30 },
  { name: 'Vidange + filtres', category: 'vidange', price: 89.9, duration: 45 },
  { name: 'Freinage avant', category: 'freinage', price: 129, duration: 90 },
  { name: 'Freinage complet', category: 'freinage', price: 219, duration: 120 },
  {
    name: 'Diagnostic électronique',
    category: 'diagnostic',
    price: 59.9,
    duration: 45,
    description: 'Lecture des codes défaut et analyse des calculateurs.',
  },
  {
    name: 'Diagnostic général des problèmes',
    category: 'diagnostic',
    diagnosticKind: 'general',
    price: 79.9,
    duration: 60,
    description:
      'Inspection complète du véhicule : moteur, freinage, direction, suspension et points de sécurité.',
  },
  {
    name: 'Consultation diagnostic d\'achat',
    category: 'diagnostic',
    diagnosticKind: 'purchase_consultation',
    price: 49.9,
    duration: 45,
    description:
      'Conseil avant achat d\'un véhicule d\'occasion : points à vérifier et estimation des travaux.',
  },
  {
    name: 'Diagnostic général d\'achat',
    category: 'diagnostic',
    diagnosticKind: 'purchase_general',
    price: 99.9,
    duration: 90,
    description:
      'Contrôle approfondi avant achat : essai, historique visible, état mécanique et rapport détaillé.',
  },
  { name: 'Lavage extérieur', category: 'lavage', price: 19.9, duration: 20 },
  { name: 'Lavage intérieur + extérieur', category: 'lavage', price: 39.9, duration: 45 },
  { name: 'Pneumatiques (4 pneus)', category: 'pneumatique', price: 299, duration: 60 },
  { name: 'Équilibrage roues', category: 'pneumatique', price: 49.9, duration: 30 },
  { name: 'Révision 30 000 km', category: 'vidange', price: 149, duration: 90 },
  { name: 'Révision 60 000 km', category: 'vidange', price: 249, duration: 120 },
  { name: 'Climatisation (recharge)', category: 'climatisation', price: 89.9, duration: 60 },
  { name: 'Batterie (remplacement)', category: 'electricite', price: 119, duration: 30 },
  { name: 'Alternateur', category: 'electricite', price: 289, duration: 120 },
  { name: 'Distribution (courroie)', category: 'autre', price: 399, duration: 180 },
  { name: 'Embrayage', category: 'autre', price: 599, duration: 240 },
  { name: 'Amortisseurs (paire)', category: 'autre', price: 349, duration: 120 },
  {
    name: 'Contrôle technique préparation',
    category: 'diagnostic',
    price: 39.9,
    duration: 30,
    description: 'Vérifications avant passage au contrôle technique.',
  },
]

export async function seedServices(): Promise<void> {
  for (const s of ROWS) {
    await Service.create({ ...s, garageId: garage1Id, isActive: true, isCustom: false })
  }
}
