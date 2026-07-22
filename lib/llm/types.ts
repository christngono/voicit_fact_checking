import type { Source } from "../types";

/**
 * Contrat commun à TOUS les fournisseurs LLM.
 *
 * Le reste de l'application n'importe JAMAIS un SDK de fournisseur : elle passe
 * exclusivement par cette interface (obtenue via `lib/llm/index.ts`).
 * Changer de fournisseur = changer la variable d'env LLM_PROVIDER, rien d'autre.
 *
 * Aucune méthode ici ne demande au modèle « est-ce vrai ? » ou « donne un score ».
 * Le LLM sert à comprendre, normaliser, extraire, rechercher et rédiger — jamais
 * à trancher le verdict (c'est le rôle de lib/scoring.ts).
 */
export interface LLMProvider {
  readonly name: string;
  readonly model: string;

  /** Complétion texte libre → texte. */
  complete(prompt: string, options?: LLMOptions): Promise<string>;

  /** Complétion contrainte à un objet JSON, parsé en T. */
  completeJSON<T>(prompt: string, options?: LLMOptions): Promise<T>;

  /** Lecture/description d'une image (OCR + description). Ne juge pas la véracité. */
  analyzeImage(
    image: Buffer | string,
    prompt: string,
    mimeType?: string
  ): Promise<string>;

  /**
   * Recherche web + synthèse SOURCÉE.
   * Encapsule les différences entre fournisseurs (Google Search grounding pour
   * Gemini, web search tool pour Claude/OpenAI).
   * Si le fournisseur ne peut pas chercher, retourne `available: false` et
   * AUCUNE source inventée — jamais un repli halluciné.
   */
  searchAndAnswer(query: string): Promise<SearchResult>;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  /** Instruction système optionnelle. */
  system?: string;
}

export interface SearchResult {
  available: boolean;
  text: string;
  sources: Source[];
}
