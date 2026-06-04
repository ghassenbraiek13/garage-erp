import type { ApiConversation, ChatMessage } from '@/hooks/api/useChatbot'

/** Mode démo : réponses statiques + conversations fictives (pas de n8n). */
export const CHATBOT_DEMO_MODE =
  import.meta.env.VITE_CHATBOT_DEMO === 'true' || import.meta.env.DEV

type FaqEntry = {
  keywords: string[]
  answer: string
}

const DEMO_FAQ: FaqEntry[] = [
  {
    keywords: ['rendez-vous', 'rendez vous', 'rdv', 'appointment', 'réserver', 'reserver', 'créneau', 'creneau'],
    answer:
      'Pour prendre rendez-vous, connectez-vous à votre espace client et utilisez « Réserver ». Vous pouvez aussi nous appeler au +216 71 000 000. Créneaux du lundi au samedi, 8h–18h.',
  },
  {
    keywords: ['horaire', 'horaires', 'ouvert', 'ouverture', 'fermé', 'heure', 'heures'],
    answer:
      'Nous sommes ouverts du lundi au samedi de 8h00 à 18h00. Le dimanche le garage est fermé. Les urgences sont traitées sur appel.',
  },
  {
    keywords: ['adresse', 'localisation', 'situation', 'trouver', 'maps', 'situé', 'situe'],
    answer:
      'GarageFlow — Avenue Habib Bourguiba, Tunis 1000. Parking client gratuit devant l’atelier. GPS : 36.8065, 10.1815.',
  },
  {
    keywords: ['prix', 'tarif', 'tarifs', 'coût', 'cout', 'combien', 'devis', 'estimation'],
    answer:
      'Les tarifs dépendent du véhicule et de la prestation. Exemples indicatifs : vidange à partir de 89.000 TND, diagnostic 45.000 TND. Demandez un devis gratuit depuis votre portail.',
  },
  {
    keywords: ['vidange', 'huile', 'filtre'],
    answer:
      'La vidange complète (huile + filtre) prend environ 45 minutes. Prix à partir de 89.000 TND selon le véhicule. Pensez à apporter votre carnet d’entretien.',
  },
  {
    keywords: ['facture', 'factures', 'paiement', 'payer', 'impayé', 'impaye'],
    answer:
      'Vos factures sont disponibles dans l’onglet « Factures » du portail client. Paiement sur place (espèces, carte) ou virement. Contactez-nous pour un échéancier.',
  },
  {
    keywords: ['devis', 'quote', 'accepter', 'refuser'],
    answer:
      'Consultez vos devis dans « Mes devis ». Vous pouvez accepter, refuser ou appliquer un coupon avant validation. Un conseiller vous rappelle sous 24h après acceptation.',
  },
  {
    keywords: ['coupon', 'fidélité', 'fidelite', 'points', 'promo', 'réduction', 'reduction'],
    answer:
      'Programme fidélité : 1 point par 10 TND dépensés. Les coupons actifs sont visibles dans « Fidélité ». Saisissez le code sur un devis en attente pour appliquer la remise.',
  },
  {
    keywords: ['réparation', 'reparation', 'avancement', 'statut', 'voiture', 'véhicule', 'vehicule'],
    answer:
      'Suivez l’avancement de votre réparation dans « Mes véhicules » → détail du véhicule. Vous recevez une notification à chaque changement de statut.',
  },
  {
    keywords: ['contact', 'téléphone', 'telephone', 'email', 'appeler', 'whatsapp'],
    answer:
      'Téléphone : +216 71 000 000 — Email : contact@garageflow.tn — WhatsApp : +216 98 000 000. Réponse sous 2h en journée ouvrée.',
  },
  {
    keywords: ['bonjour', 'salut', 'hello', 'bonsoir', 'coucou'],
    answer:
      'Bonjour ! Je suis l’assistant GarageFlow. Posez-moi une question sur les rendez-vous, horaires, tarifs, factures ou fidélité.',
  },
]

const DEFAULT_ANSWER =
  'Je n’ai pas trouvé de réponse précise. Essayez : « rendez-vous », « horaires », « prix », « facture », « coupon » ou « adresse ». Un conseiller peut aussi vous rappeler si vous écrivez « parler à un humain ».'

const HUMAN_KEYWORDS = ['humain', 'conseiller', 'agent', 'personne', 'appeler', 'rappeler']

export function matchDemoReply(question: string): { contenu: string; humanNeeded: boolean } {
  const q = question.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')

  if (HUMAN_KEYWORDS.some((k) => q.includes(k))) {
    return {
      contenu:
        'Très bien, je transmets votre demande à un conseiller. Vous serez recontacté sous peu (généralement sous 2h en journée ouvrée).',
      humanNeeded: true,
    }
  }

  for (const entry of DEMO_FAQ) {
    if (entry.keywords.some((k) => q.includes(k.normalize('NFD').replace(/\p{Diacritic}/gu, '')))) {
      return { contenu: entry.answer, humanNeeded: false }
    }
  }

  return { contenu: DEFAULT_ANSWER, humanNeeded: false }
}

export const DEMO_SUGGESTED_PROMPTS = [
  'Prendre rendez-vous',
  'Horaires d’ouverture',
  'Tarifs vidange',
  'Mes factures',
  'Programme fidélité',
]

function msg(
  auteur: ChatMessage['auteur'],
  contenu: string,
  minutesAgo: number,
  type: ChatMessage['type'] = auteur === 'client' ? 'human' : 'bot',
): ChatMessage {
  return {
    auteur,
    contenu,
    type,
    timestamp: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
  }
}

export const DEMO_CONVERSATIONS: ApiConversation[] = [
  {
    id: 'demo-conv-1',
    clientId: { id: 'demo-client-1', name: 'Amine Ben Salah', email: 'amine.bensalah@email.tn' },
    garageId: 'demo-garage',
    statut: 'open',
    updatedAt: new Date(Date.now() - 12 * 60_000).toISOString(),
    messages: [
      msg('client', 'Bonjour, je voudrais prendre rendez-vous pour une vidange', 25),
      msg('bot', matchDemoReply('rendez-vous').contenu, 24),
      msg('client', 'Merci ! Et vos horaires le samedi ?', 18),
      msg('bot', matchDemoReply('horaires').contenu, 17),
    ],
  },
  {
    id: 'demo-conv-2',
    clientId: { id: 'demo-client-2', name: 'Sonia Trabelsi', email: 'sonia.t@email.tn' },
    garageId: 'demo-garage',
    statut: 'pending_human',
    updatedAt: new Date(Date.now() - 45 * 60_000).toISOString(),
    messages: [
      msg('client', 'Combien coûte un diagnostic moteur ?', 90),
      msg('bot', matchDemoReply('prix').contenu, 89),
      msg('client', 'Je préfère parler à un conseiller pour mon devis', 50),
      msg('bot', matchDemoReply('parler à un humain').contenu, 49),
    ],
  },
  {
    id: 'demo-conv-3',
    clientId: { id: 'demo-client-3', name: 'Karim Gharbi', email: 'karim.gharbi@email.tn' },
    garageId: 'demo-garage',
    statut: 'open',
    updatedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    messages: [
      msg('client', 'Où êtes-vous situés ?', 8),
      msg('bot', matchDemoReply('adresse').contenu, 7),
      msg('client', 'Comment utiliser mon coupon fidélité ?', 6),
      msg('bot', matchDemoReply('coupon').contenu, 5),
    ],
  },
  {
    id: 'demo-conv-4',
    clientId: { id: 'demo-client-4', name: 'Leila Mansour', email: 'leila.m@email.tn' },
    garageId: 'demo-garage',
    statut: 'closed',
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString(),
    messages: [
      msg('client', 'Je ne trouve pas ma facture du mois dernier', 3000),
      msg('bot', matchDemoReply('facture').contenu, 2999),
      msg('manager', 'Bonjour Leila, votre facture FAC-2026-042 est disponible dans le portail.', 2980, 'human'),
      msg('client', 'Parfait, merci beaucoup !', 2975),
    ],
  },
]

export function createDemoBotMessage(contenu: string): ChatMessage {
  return {
    auteur: 'bot',
    contenu,
    timestamp: new Date().toISOString(),
    type: 'bot',
  }
}

export function createDemoClientMessage(contenu: string): ChatMessage {
  return {
    auteur: 'client',
    contenu,
    timestamp: new Date().toISOString(),
    type: 'human',
  }
}
