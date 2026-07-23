import type { LLMProvider } from "./llm";
import { promptAnalyseImage } from "./llm/prompts";
import { parseJSONLoose } from "./llm/json";
import { memoryStore } from "./memory";
import { withTimeout } from "./util";
import {
  assemblerResultat,
  enrichirMemoire,
  evaluerParRecherche,
  resultatDepuisMemoire,
} from "./verifyShared";
import type { Locale } from "./i18n/dictionary";
import type { ChampExtrait, Signal, StreamEvent, VerifyResult } from "./types";

/**
 * ════════════════════════════════════════════════════════════════════════════
 *  PIPELINE DE VÉRIFICATION — module IMAGE.
 * ════════════════════════════════════════════════════════════════════════════
 *
 *  Partie SPÉCIFIQUE à l'image (1 appel LLM vision) :
 *   • OCR du texte incrusté + description + type visuel + affirmations ;
 *   • signal `indice_ia` (poids FAIBLE) si montage / image générée par IA.
 *  Puis on délègue au cœur partagé (`verifyShared.ts`) : mémoire → web →
 *  scoring déterministe → enrichissement. Le LLM ne décide JAMAIS du verdict.
 *
 *  Budget : ≤ 3 appels LLM (vision + recherche + synthèse).
 */

type Emit = (e: StreamEvent) => void;

const T_VISION = 20000;

interface AnalyseImage {
  texte_incruste: string;
  description: string;
  type_visuel: string;
  affirmations: string[];
}

export async function verifierImage(
  base64: string,
  mimeType: string,
  emit: Emit,
  llm: LLMProvider,
  loc: Locale = "fr"
): Promise<VerifyResult> {
  // ── Étape 1 : réception ───────────────────────────────────────────────────
  emit({ type: "etape", id: "reception", statut: "termine", label: "Réception de l'image" });

  // ── Étape 2 : VISION (APPEL LLM 1) — OCR + description + affirmations ───────
  emit({ type: "etape", id: "extraction", statut: "en_cours", label: "Lecture de l'image (OCR)" });
  const brut = await withTimeout<string>(
    llm.analyzeImage(base64, promptAnalyseImage(loc), mimeType),
    T_VISION,
    ""
  );
  let analyse: AnalyseImage = {
    texte_incruste: "",
    description: "",
    type_visuel: "inconnu",
    affirmations: [],
  };
  try {
    if (brut.trim()) analyse = parseJSONLoose<AnalyseImage>(brut);
  } catch {
    /* réponse non exploitable : on continue avec l'analyse vide (résultat honnête). */
  }
  const ocr = (analyse.texte_incruste || "").trim();
  const description = (analyse.description || "").trim();
  const affirmationsTxt = (analyse.affirmations || []).slice(0, 4);
  emit({ type: "etape", id: "extraction", statut: "termine", label: "Lecture de l'image (OCR)" });

  // Montre à l'utilisateur ce que VoCit a réellement lu sur l'image (informatif).
  const champs: ChampExtrait[] = [];
  if (ocr) champs.push({ cle: "ocr", valeur: ocr });
  if (description) champs.push({ cle: "description", valeur: description });
  emit({ type: "extraction", champs, affirmations: affirmationsTxt });

  // ── Étape 3 : signal de FORME (montage / IA) — poids faible, sans appel ─────
  emit({ type: "etape", id: "affirmations", statut: "en_cours", label: "Affirmation véhiculée" });
  const signaux: Signal[] = [];
  const type = (analyse.type_visuel || "").toLowerCase();
  if (type.includes("ia") || type.includes("montage")) {
    signaux.push({
      code: "indice_ia",
      sens: "negatif",
      libelle: type.includes("ia")
        ? "Indice d'image générée par IA (détection peu fiable, non décisive)"
        : "Indice de montage/retouche visuelle (détection peu fiable, non décisive)",
    });
  }
  emit({ type: "etape", id: "affirmations", statut: "termine", label: "Affirmation véhiculée" });

  // ── Étape 4 : MÉMOIRE COLLECTIVE (Temps 1) ────────────────────────────────
  emit({ type: "etape", id: "corpus", statut: "en_cours", label: "Recherche dans le corpus VoCit" });
  const requeteMemoire = `${ocr}. ${description}`.trim();
  const match = requeteMemoire.length > 4 ? await memoryStore.search(requeteMemoire) : null;
  if (match) {
    emit({ type: "etape", id: "corpus", statut: "termine", label: "Trouvé dans le corpus VoCit" });
    emit({ type: "etape", id: "web", statut: "ignore", label: "Recherche web non nécessaire" });
    emit({ type: "etape", id: "score", statut: "en_cours", label: "Calcul du score" });
    const resultat = resultatDepuisMemoire(match.rumeur, affirmationsTxt);
    emit({ type: "etape", id: "score", statut: "termine", label: "Calcul du score" });
    return resultat;
  }
  emit({ type: "etape", id: "corpus", statut: "termine", label: "Aucune correspondance en base" });

  // ── Étape 5 : RECHERCHE WEB (APPELS LLM 2 & 3) — cœur partagé ──────────────
  emit({ type: "etape", id: "web", statut: "en_cours", label: "Recherche de sources sur le web" });
  const web = await evaluerParRecherche(affirmationsTxt, llm, loc);
  signaux.push(...web.signaux);
  emit({ type: "etape", id: "web", statut: "termine", label: "Recherche de sources sur le web" });

  if (!web.rechercheDisponible) {
    if (web.raisonIndisponible) {
      emit({ type: "web_indisponible", raison: web.raisonIndisponible });
    }
    signaux.push({
      code: "recherche_indisponible",
      sens: "neutre",
      libelle: "La recherche web n'a rien remonté d'exploitable",
    });
  }

  // ── Étape finale : SCORING DÉTERMINISTE ────────────────────────────────────
  emit({ type: "etape", id: "score", statut: "en_cours", label: "Calcul du score" });
  const resultat = assemblerResultat({
    signaux,
    sources: web.sources,
    affirmations: web.affirmations,
    resumeWeb: web.resumeWeb,
    origine: "recherche_web",
  });
  emit({ type: "etape", id: "score", statut: "termine", label: "Calcul du score" });

  await enrichirMemoire(requeteMemoire.slice(0, 200), resultat);

  return resultat;
}
