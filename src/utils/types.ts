export type Famille =
  | 'extreme_gauche'
  | 'gauche'
  | 'centre'
  | 'droite'
  | 'extreme_droite'
  | 'divers'

export interface Candidat {
  nuance: string
  famille: Famille
  nom: string | null
  prenom: string | null
  voix: number
  pourcentage: number   // % voix / exprimés
}

export interface BVResult {
  id_election: string
  scrutin: string
  annee: number
  tour: number
  bureau_vote: string        // ex: "0001"
  inscrits: number
  votants: number
  abstentions: number
  blancs: number
  nuls: number
  exprimes: number
  candidats: Candidat[]
  // calculé à la volée
  taux_abstention?: number
}

export interface Scrutin {
  id: string               // ex: "2022_pres_t1"
  label: string            // ex: "Présidentielle 2022 — T1"
  annee: number
  type: string
  tour: number
}

export type Metrique =
  | 'abstention'
  | 'famille'
  | { type: 'candidat'; nuance: string }

export interface BVFeatureProperties {
  numeroBureauVote: string
  codeBureauVote: string    // ex: "59646_0001"
  id_bv: string
  nomCommune?: string
}
