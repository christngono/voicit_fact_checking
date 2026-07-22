import type {
  Composante,
  Niveau,
  ScoreResult,
  Signal,
  SignalCode,
} from "./types";

/**
 * ════════════════════════════════════════════════════════════════════════════
 *  SCORING DÉTERMINISTE — AUCUN APPEL AU LLM DANS CE FICHIER.
 * ════════════════════════════════════════════════════════════════════════════
 *
 *  C'est ICI, et seulement ici, que le verdict est décidé. Le LLM a fourni des
 *  signaux (affirmation corroborée/contredite, domaine suspect, marqueur de
 *  manipulation…) ; ce module les pondère et calcule un score reproductible.
 *
 *  Fonction pure : mêmes signaux en entrée ⇒ même résultat en sortie. Testable
 *  sans réseau ni clé API (voir scoring.test.ts).
 */

/** Pondérations, regroupées et commentées pour être ajustables d'un coup d'œil. */
export const POIDS: Record<SignalCode, number> = {
  // Décisif : la mémoire collective a déjà tranché.
  deja_dementi: -100,
  deja_confirme: +100,

  // Signaux forts issus de la recherche web.
  contredit_source_fiable: -45,
  corrobore_sources_fiables: +40,
  aucune_source: -30,
  aucune_couverture_evenement_majeur: -40, // l'absence de couverture est une preuve
  sources_non_fiables_seulement: -8, // faible : on ne conclut pas là-dessus

  // Signaux de réputation / forme (modules Lien & Texte).
  domaine_suspect: -35,
  contenu_ancien_presente_actuel: -30,
  ecart_titre_contenu: -18,
  marqueur_manipulation: -12, // poids moyen, cumulable

  // Indices de génération par IA : poids FAIBLE (détecteurs peu fiables).
  indice_ia: -5,

  // Neutre : signale seulement qu'on n'a pas pu chercher.
  recherche_indisponible: 0,
};

/** Score de départ : neutre, sans preuve on ne penche ni vers vrai ni vers faux. */
const SCORE_NEUTRE = 55;

/** Seuils de bascule des niveaux. */
const SEUIL_FIABLE = 70;
const SEUIL_DOUTEUX = 40;

/**
 * Calcule le verdict à partir des signaux collectés.
 * @param signaux signaux vérifiables (aucun n'est « le LLM pense que c'est faux »)
 * @param preuvesSuffisantes false ⇒ on renvoie "insuffisant" quel que soit le score
 */
export function calculerScore(
  signaux: Signal[],
  preuvesSuffisantes = true
): ScoreResult {
  // Cas décisifs de la mémoire collective : court-circuit.
  const dementi = signaux.find((s) => s.code === "deja_dementi");
  if (dementi) {
    return {
      score: 5,
      niveau: "faux",
      composantes: toComposantes(signaux),
    };
  }
  const confirme = signaux.find((s) => s.code === "deja_confirme");
  if (confirme) {
    return {
      score: 95,
      niveau: "fiable",
      composantes: toComposantes(signaux),
    };
  }

  // Accumulation pondérée.
  let score = SCORE_NEUTRE;
  for (const s of signaux) {
    score += POIDS[s.code] ?? 0;
  }
  score = clamp(score, 0, 100);

  // Détermination du niveau.
  let niveau: Niveau;
  if (!preuvesSuffisantes || onlyRechercheIndisponible(signaux)) {
    niveau = "insuffisant";
  } else if (score >= SEUIL_FIABLE) {
    niveau = "fiable";
  } else if (score < SEUIL_DOUTEUX && aSignalFactuelNegatifFort(signaux)) {
    // "Faux" n'est prononcé QUE si une preuve factuelle négative forte existe.
    // La seule forme manipulatoire (urgence, appel au partage) ne rend pas
    // une affirmation fausse : au pire elle la rend douteuse.
    niveau = "faux";
  } else {
    niveau = "douteux";
  }

  return { score, niveau, composantes: toComposantes(signaux) };
}

/** Transforme chaque signal en phrase de preuve lisible (déjà rédigée à la source). */
function toComposantes(signaux: Signal[]): Composante[] {
  return signaux.map((s) => ({ texte: s.libelle, sens: s.sens }));
}

/** Codes de preuve FACTUELLE négative forte, seuls habilités à conclure "faux". */
const FACTUELS_NEGATIFS_FORTS: SignalCode[] = [
  "contredit_source_fiable",
  "aucune_source",
  "aucune_couverture_evenement_majeur",
  "domaine_suspect",
  "contenu_ancien_presente_actuel",
];

function aSignalFactuelNegatifFort(signaux: Signal[]): boolean {
  return signaux.some((s) => FACTUELS_NEGATIFS_FORTS.includes(s.code));
}

/** Vrai si l'on n'a que le signal « recherche indisponible » (rien d'exploitable). */
function onlyRechercheIndisponible(signaux: Signal[]): boolean {
  const utiles = signaux.filter((s) => s.code !== "recherche_indisponible");
  return utiles.length === 0 && signaux.length > 0;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Libellé humain d'un niveau (pour l'UI et les tests). */
export function libelleNiveau(niveau: Niveau): string {
  switch (niveau) {
    case "fiable":
      return "Fiable";
    case "douteux":
      return "Douteux";
    case "faux":
      return "Faux";
    case "insuffisant":
      return "Éléments insuffisants";
  }
}
