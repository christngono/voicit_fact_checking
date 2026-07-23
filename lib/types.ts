/**
 * Types partagés de VoCit.
 *
 * Frontière de responsabilité (À RESPECTER) :
 *  - Le LLM produit uniquement du CONTENU normalisé et des SIGNAUX bruts
 *    (affirmations, marqueurs, résultats de recherche).
 *  - Le VERDICT (`niveau`, `score`) est calculé par `lib/scoring.ts`, du code
 *    déterministe, à partir de ces signaux. Le LLM ne décide jamais du verdict.
 */

// ── Niveaux et verdict ──────────────────────────────────────────────────────

export type Niveau = "fiable" | "douteux" | "faux" | "insuffisant";

/** D'où vient le résultat : mémoire collective (rapide) ou recherche web. */
export type Origine = "memoire" | "recherche_web";

export type TypeContenu = "texte" | "lien" | "image" | "numero";

// ── Sources et affirmations ─────────────────────────────────────────────────

export interface Source {
  titre: string;
  url: string;
  extrait?: string;
  date?: string;
  /** Fiabilité estimée d'après data/domaines.json — remplie côté code, pas LLM. */
  fiabilite?: "fiable" | "officiel" | "inconnu" | "frauduleux";
}

export type StatutAffirmation =
  | "corroboree"
  | "contredite"
  | "non_trouvee"
  | "non_verifiee";

export interface Affirmation {
  texte: string;
  statut: StatutAffirmation;
  /** Sources qui appuient / contredisent cette affirmation précise. */
  sources?: Source[];
}

// ── Signaux transmis au scoring (produits par code + LLM, jamais un verdict) ──

/**
 * Un signal vérifiable. `poids` et `sens` sont interprétés par le scoring.
 * Le champ `libelle` est une phrase lisible par un humain, réutilisée telle
 * quelle dans les « composantes » du verdict.
 */
export interface Signal {
  code: SignalCode;
  libelle: string;
  /** positif = va vers "fiable", negatif = va vers "faux". */
  sens: "positif" | "negatif" | "neutre";
}

export type SignalCode =
  | "deja_dementi" // trouvé démenti dans le corpus VoCit
  | "deja_confirme" // trouvé confirmé dans le corpus VoCit
  | "contredit_source_fiable"
  | "corrobore_sources_fiables"
  | "aucune_source"
  | "aucune_couverture_evenement_majeur"
  | "sources_non_fiables_seulement"
  | "domaine_suspect"
  | "contenu_ancien_presente_actuel"
  | "ecart_titre_contenu"
  | "marqueur_manipulation"
  | "indice_ia" // poids FAIBLE : les détecteurs sont peu fiables
  | "recherche_indisponible";

// ── Sortie du scoring déterministe ──────────────────────────────────────────

export interface Composante {
  /** Phrase de preuve lisible, ex : « Aucune source ne corrobore… ». */
  texte: string;
  sens: "positif" | "negatif" | "neutre";
}

export interface ScoreResult {
  score: number; // 0..100
  niveau: Niveau;
  composantes: Composante[];
}

// ── Réponse d'API renvoyée à l'interface ────────────────────────────────────

export interface VerifyResult {
  verdict: Niveau;
  score: number;
  niveau: Niveau;
  origine: Origine;
  composantes: string[];
  sources: Source[];
  affirmations: Affirmation[];
  conseil: string;
  /** Renseigné quand origine === "memoire". */
  dateVerification?: string;
  /** Résumé rédigé par le LLM en langage simple (jamais un verdict chiffré). */
  explication?: string;
}

// ── Corpus (mémoire collective) ─────────────────────────────────────────────

export interface Rumeur {
  id: string;
  texte: string;
  motsCles: string[];
  verdict: Niveau;
  explication: string;
  sources: Source[];
  dateVerification: string;
}

export interface NumeroSignale {
  numero: string; // format normalisé +2376XXXXXXXX
  nbSignalements: number;
  nbSignalantsDistincts: number;
  motifPrincipal: string;
  premierSignalement: string;
  dernierSignalement: string;
}

export interface DomainesConfig {
  fiables: string[]; // médias établis, agences, fact-checkers
  officiels: string[]; // sites gouvernementaux camerounais
  frauduleux: string[]; // domaines connus comme trompeurs
}

// ── Étapes de progression (SSE) ─────────────────────────────────────────────

export type EtapeId =
  | "reception"
  | "page" // module LIEN : récupération de la page distante
  | "extraction"
  | "affirmations"
  | "corpus"
  | "web"
  | "score";

export interface EtapeEvent {
  type: "etape";
  id: EtapeId;
  statut: "en_cours" | "termine" | "ignore";
  label: string;
}

export interface ResultEvent {
  type: "resultat";
  data: VerifyResult;
}

export interface ErreurEvent {
  type: "erreur";
  message: string;
}

/**
 * Contenu réellement extrait d'une image (module IMAGE) : montré à l'utilisateur
 * pour qu'il voie ce que VoCit a lu avant de conclure. Purement informatif —
 * n'intervient pas dans le verdict (calculé par `scoring.ts`).
 */
export interface ExtractionEvent {
  type: "extraction";
  ocr: string;
  description: string;
  affirmations: string[];
}

/**
 * La recherche web n'a pas pu être lancée. `raison === "quota"` = crédit/quota
 * API épuisé. Affiché honnêtement plutôt qu'un faux « rien trouvé ».
 */
export interface WebIndisponibleEvent {
  type: "web_indisponible";
  raison: "quota" | "erreur";
}

export type StreamEvent =
  | EtapeEvent
  | ResultEvent
  | ErreurEvent
  | ExtractionEvent
  | WebIndisponibleEvent;
