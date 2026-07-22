import type { LLMProvider } from "./llm";
import { promptAnalyseTexte } from "./llm/prompts";
import type { Locale } from "./i18n/dictionary";
import { memoryStore } from "./memory";
import { withTimeout } from "./util";
import {
  assemblerResultat,
  conseilResponsabilite,
  enrichirMemoire,
  evaluerParRecherche,
  resultatDepuisMemoire,
} from "./verifyShared";
import type { Signal, StreamEvent, VerifyResult } from "./types";

/**
 * ════════════════════════════════════════════════════════════════════════════
 *  PIPELINE DE VÉRIFICATION EN DEUX TEMPS — module TEXTE.
 * ════════════════════════════════════════════════════════════════════════════
 *
 *  Partie SPÉCIFIQUE au texte : traduction + extraction d'affirmations +
 *  marqueurs de manipulation (1 appel LLM). Le TEMPS 2 (mémoire → web →
 *  scoring → enrichissement) est délégué à `verifyShared.ts`, commun à tous les
 *  modules. Le LLM ne décide JAMAIS du verdict : `calculerScore()` seul tranche.
 *
 *  Contraintes Vercel : ≤ 3 appels LLM chaînés, timeouts explicites, résultat
 *  partiel honnête, aucune écriture disque.
 */

// Ré-export pour compatibilité avec les routes qui l'importaient depuis ce module.
export { conseilResponsabilite };

type Emit = (e: StreamEvent) => void;

const T_ANALYSE = 15000;

interface Analyse {
  traduction: string;
  affirmations: string[];
  marqueurs: { type: string; extrait: string }[];
}

export async function verifierTexte(
  contenu: string,
  emit: Emit,
  llm: LLMProvider,
  loc: Locale = "fr"
): Promise<VerifyResult> {
  // ── Étape 1 : réception ───────────────────────────────────────────────────
  emit({ type: "etape", id: "reception", statut: "termine", label: "Réception du contenu" });

  // ── Étape 2 : ANALYSE (APPEL LLM 1) — traduction + affirmations + marqueurs ─
  emit({ type: "etape", id: "extraction", statut: "en_cours", label: "Lecture et traduction" });
  const analyse = await withTimeout<Analyse>(
    llm.completeJSON<Analyse>(promptAnalyseTexte(contenu, loc)),
    T_ANALYSE,
    { traduction: contenu, affirmations: [], marqueurs: [] } // repli : texte brut
  );
  const contenuFr = (analyse.traduction || contenu).trim();
  const affirmationsTxt = (analyse.affirmations || []).slice(0, 4);
  emit({ type: "etape", id: "extraction", statut: "termine", label: "Lecture et traduction" });

  emit({ type: "etape", id: "affirmations", statut: "en_cours", label: "Identification des affirmations" });
  emit({ type: "etape", id: "affirmations", statut: "termine", label: "Identification des affirmations" });

  // ── Étape 3 : MÉMOIRE COLLECTIVE (Temps 1, sans web, sans LLM) ─────────────
  emit({ type: "etape", id: "corpus", statut: "en_cours", label: "Recherche dans le corpus VoCit" });
  const match = await memoryStore.search(contenuFr);
  if (match) {
    emit({ type: "etape", id: "corpus", statut: "termine", label: "Trouvé dans le corpus VoCit" });
    emit({ type: "etape", id: "web", statut: "ignore", label: "Recherche web non nécessaire" });
    emit({ type: "etape", id: "score", statut: "en_cours", label: "Calcul du score" });
    const resultat = resultatDepuisMemoire(match.rumeur, affirmationsTxt);
    emit({ type: "etape", id: "score", statut: "termine", label: "Calcul du score" });
    return resultat; // chemin le plus rapide : 1 seul appel LLM au total
  }
  emit({ type: "etape", id: "corpus", statut: "termine", label: "Aucune correspondance en base" });

  // Signaux « forme » (marqueurs) — issus de l'analyse, sans appel supplémentaire.
  const signaux: Signal[] = [];
  for (const mk of (analyse.marqueurs || []).slice(0, 3)) {
    signaux.push({
      code: "marqueur_manipulation",
      sens: "negatif",
      libelle: `Marqueur de manipulation détecté (${mk.type})`,
    });
  }

  // ── Étape 4 : RECHERCHE WEB (APPELS LLM 2 & 3) — délégué au cœur partagé ────
  emit({ type: "etape", id: "web", statut: "en_cours", label: "Recherche de sources sur le web" });
  const web = await evaluerParRecherche(affirmationsTxt, llm, loc);
  signaux.push(...web.signaux);
  emit({ type: "etape", id: "web", statut: "termine", label: "Recherche de sources sur le web" });

  // Recherche impossible / vide : signal neutre explicite (jamais de source inventée).
  if (!web.rechercheDisponible) {
    signaux.push({
      code: "recherche_indisponible",
      sens: "neutre",
      libelle: "La recherche web n'a rien remonté d'exploitable",
    });
  }

  // ── Étape finale : SCORING DÉTERMINISTE (aucun LLM) ────────────────────────
  emit({ type: "etape", id: "score", statut: "en_cours", label: "Calcul du score" });
  const resultat = assemblerResultat({
    signaux,
    sources: web.sources,
    affirmations: web.affirmations,
    resumeWeb: web.resumeWeb,
    origine: "recherche_web",
  });
  emit({ type: "etape", id: "score", statut: "termine", label: "Calcul du score" });

  // ── Enrichissement automatique (mémoire uniquement, pas de disque) ─────────
  await enrichirMemoire(contenuFr, resultat);

  return resultat;
}
