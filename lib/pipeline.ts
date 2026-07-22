import type { LLMProvider } from "./llm";
import { promptAnalyseTexte, promptSyntheseWeb } from "./llm/prompts";
import { calculerScore } from "./scoring";
import { memoryStore } from "./memory";
import { annoterSources, compterFiables } from "./reputation";
import { withTimeout } from "./util";
import type {
  Affirmation,
  Rumeur,
  Signal,
  Source,
  StatutAffirmation,
  StreamEvent,
  VerifyResult,
} from "./types";

/**
 * ════════════════════════════════════════════════════════════════════════════
 *  PIPELINE DE VÉRIFICATION EN DEUX TEMPS (module TEXTE).
 * ════════════════════════════════════════════════════════════════════════════
 *
 *  Le LLM (via l'interface `LLMProvider`) NORMALISE, EXTRAIT, CHERCHE, RÉSUME.
 *  Il ne décide JAMAIS du verdict : les SIGNAUX collectés ici sont passés à
 *  `calculerScore()` (code déterministe) qui seul fixe `niveau` et `score`.
 *
 *  Contraintes Vercel respectées :
 *   • ≤ 3 appels LLM chaînés par vérification (analyse → recherche → synthèse).
 *   • Timeouts explicites : si une étape traîne, on poursuit avec les signaux
 *     déjà collectés (résultat partiel honnête) au lieu d'échouer.
 *   • Aucune écriture disque : l'enrichissement passe par memoryStore (mémoire).
 */

type Emit = (e: StreamEvent) => void;

// Budgets de temps (ms) — bornés pour tenir sous la limite serverless Vercel.
const T_ANALYSE = 15000;
const T_RECHERCHE = 18000;
const T_SYNTHESE = 15000;

interface Analyse {
  traduction: string;
  affirmations: string[];
  marqueurs: { type: string; extrait: string }[];
}

export async function verifierTexte(
  contenu: string,
  emit: Emit,
  llm: LLMProvider
): Promise<VerifyResult> {
  // ── Étape 1 : réception ───────────────────────────────────────────────────
  emit({ type: "etape", id: "reception", statut: "termine", label: "Réception du contenu" });

  // ── Étape 2 : ANALYSE (APPEL LLM 1) — traduction + affirmations + marqueurs ─
  emit({ type: "etape", id: "extraction", statut: "en_cours", label: "Lecture et traduction" });
  const analyse = await withTimeout<Analyse>(
    llm.completeJSON<Analyse>(promptAnalyseTexte(contenu)),
    T_ANALYSE,
    { traduction: contenu, affirmations: [], marqueurs: [] } // repli : texte brut
  );
  const contenuFr = (analyse.traduction || contenu).trim();
  const affirmationsTxt = (analyse.affirmations || []).slice(0, 4);
  emit({ type: "etape", id: "extraction", statut: "termine", label: "Lecture et traduction" });

  emit({ type: "etape", id: "affirmations", statut: "en_cours", label: "Identification des affirmations" });
  emit({ type: "etape", id: "affirmations", statut: "termine", label: "Identification des affirmations" });

  // ── Étape 3 : MÉMOIRE COLLECTIVE (Temps 1, sans web, sans LLM) ─────────────
  emit({ type: "etape", id: "corpus", statut: "en_cours", label: "Recherche dans le corpus VoiCit" });
  const match = await memoryStore.search(contenuFr);
  if (match) {
    emit({ type: "etape", id: "corpus", statut: "termine", label: "Trouvé dans le corpus VoiCit" });
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

  const affirmations: Affirmation[] = [];
  const toutesSources: Source[] = [];
  let resumeWeb = "";
  let rechercheDisponible = false;

  // ── Étape 4 : RECHERCHE WEB (APPEL LLM 2) — une seule requête groupée ──────
  emit({ type: "etape", id: "web", statut: "en_cours", label: "Recherche de sources sur le web" });

  if (affirmationsTxt.length > 0) {
    const requete =
      "Vérifie ces affirmations au Cameroun et cite des sources fiables :\n" +
      affirmationsTxt.map((a, i) => `${i + 1}. ${a}`).join("\n");

    const recherche = await withTimeout(
      llm.searchAndAnswer(requete),
      T_RECHERCHE,
      { available: false, text: "", sources: [] as Source[] }
    );

    if (recherche.available) {
      rechercheDisponible = true;
      const sources = annoterSources(recherche.sources);
      toutesSources.push(...sources);

      // ── Étape 6a : SYNTHÈSE (APPEL LLM 3) — statuts + résumé neutre ────────
      const synthese = await withTimeout<{
        statuts: { affirmation: string; statut: StatutAffirmation }[];
        resume: string;
      }>(
        llm.completeJSON(promptSyntheseWeb(affirmationsTxt, resumeSources(recherche.text, sources))),
        T_SYNTHESE,
        { statuts: [], resume: recherche.text.slice(0, 300) }
      );
      resumeWeb = synthese.resume || "";

      const nbFiables = compterFiables(sources);
      for (const aff of affirmationsTxt) {
        const st =
          synthese.statuts.find((s) => s.affirmation?.slice(0, 20) === aff.slice(0, 20))?.statut ??
          "non_trouvee";
        affirmations.push({ texte: aff, statut: st, sources });
        signaux.push(...signauxDepuisAffirmation(aff, st, nbFiables, sources.length));
      }
    }
  }

  emit({ type: "etape", id: "web", statut: "termine", label: "Recherche de sources sur le web" });

  // Recherche impossible / vide : signal neutre explicite (jamais de source inventée).
  if (!rechercheDisponible) {
    signaux.push({
      code: "recherche_indisponible",
      sens: "neutre",
      libelle: "La recherche web n'a rien remonté d'exploitable",
    });
  }

  // ── Étape finale : SCORING DÉTERMINISTE (aucun LLM) ────────────────────────
  emit({ type: "etape", id: "score", statut: "en_cours", label: "Calcul du score" });
  const preuvesSuffisantes = signaux.some((s) => s.code !== "recherche_indisponible");
  const { score, niveau, composantes } = calculerScore(signaux, preuvesSuffisantes);

  // Explication : le résumé NEUTRE déjà rédigé par le LLM (appel 3), sinon repli
  // déterministe à partir des composantes. AUCUN appel LLM supplémentaire ici.
  const explication =
    resumeWeb.trim() ||
    (niveau === "insuffisant"
      ? "Les vérifications n'ont pas permis de trouver de sources exploitables sur ce contenu."
      : composantes.map((c) => c.texte).join(". ") + ".");

  emit({ type: "etape", id: "score", statut: "termine", label: "Calcul du score" });

  const sourcesUniques = dedupeSources(toutesSources);
  const resultat: VerifyResult = {
    verdict: niveau,
    score,
    niveau,
    origine: "recherche_web",
    composantes: composantes.map((c) => c.texte),
    sources: sourcesUniques,
    affirmations,
    conseil: conseilResponsabilite(niveau),
    explication,
  };

  // ── Enrichissement automatique (mémoire uniquement, pas de disque) ─────────
  if (niveau === "faux" || niveau === "fiable") {
    const nouvelle: Rumeur = {
      id: "auto-" + Date.now().toString(36),
      texte: contenuFr,
      motsCles: motsClesDepuis(contenuFr),
      verdict: niveau,
      explication,
      sources: sourcesUniques,
      dateVerification: new Date().toISOString().slice(0, 10),
    };
    await memoryStore.add(nouvelle);
  }

  return resultat;
}

// ── Helpers déterministes ────────────────────────────────────────────────────

function resultatDepuisMemoire(rumeur: Rumeur, affirmationsTxt: string[]): VerifyResult {
  const signaux: Signal[] =
    rumeur.verdict === "faux"
      ? [{ code: "deja_dementi", sens: "negatif", libelle: `Déjà démenti par VoiCit le ${rumeur.dateVerification}` }]
      : rumeur.verdict === "fiable"
      ? [{ code: "deja_confirme", sens: "positif", libelle: `Déjà confirmé par VoiCit le ${rumeur.dateVerification}` }]
      : [{ code: "sources_non_fiables_seulement", sens: "neutre", libelle: `Déjà examiné par VoiCit le ${rumeur.dateVerification}` }];

  const base =
    rumeur.verdict === "faux" || rumeur.verdict === "fiable"
      ? calculerScore(signaux)
      : {
          niveau: rumeur.verdict,
          score: rumeur.verdict === "douteux" ? 45 : 50,
          composantes: signaux.map((s) => ({ texte: s.libelle, sens: s.sens })),
        };

  return {
    verdict: base.niveau,
    score: base.score,
    niveau: base.niveau,
    origine: "memoire",
    composantes: base.composantes.map((c) => c.texte),
    sources: annoterSources(rumeur.sources),
    affirmations: affirmationsTxt.map((texte) => ({
      texte,
      statut: rumeur.verdict === "faux" ? "contredite" : "corroboree",
    })),
    conseil: conseilResponsabilite(base.niveau),
    dateVerification: rumeur.dateVerification,
    explication: rumeur.explication,
  };
}

function signauxDepuisAffirmation(
  texte: string,
  statut: StatutAffirmation,
  nbFiables: number,
  nbSources: number
): Signal[] {
  const court = texte.length > 60 ? texte.slice(0, 57) + "…" : texte;
  if (statut === "corroboree" && nbFiables > 0)
    return [{ code: "corrobore_sources_fiables", sens: "positif", libelle: `« ${court} » est corroborée par des sources fiables` }];
  if (statut === "contredite" && nbFiables > 0)
    return [{ code: "contredit_source_fiable", sens: "negatif", libelle: `« ${court} » est contredite par une source fiable` }];
  if (statut === "corroboree" || statut === "contredite")
    return [{ code: "sources_non_fiables_seulement", sens: "neutre", libelle: `« ${court} » : seules des sources peu fiables en parlent` }];
  if (nbSources === 0)
    return [{ code: "aucune_source", sens: "negatif", libelle: `Aucune source ne corrobore « ${court} »` }];
  return [];
}

function resumeSources(texte: string, sources: Source[]): string {
  const liste = sources
    .map((s, i) => `[${i + 1}] ${s.titre} (${s.fiabilite}) — ${s.url}${s.extrait ? " : " + s.extrait : ""}`)
    .join("\n");
  return `${texte}\n\nSOURCES:\n${liste}`;
}

function dedupeSources(sources: Source[]): Source[] {
  const seen = new Set<string>();
  return sources.filter((s) => (seen.has(s.url) ? false : (seen.add(s.url), true)));
}

function motsClesDepuis(texte: string): string[] {
  return Array.from(
    new Set(
      texte
        .toLowerCase()
        .replace(/[^a-z0-9àâäéèêëïîôöùûüç\s]/gi, " ")
        .split(/\s+/)
        .filter((w) => w.length > 4)
    )
  ).slice(0, 12);
}

/** Conseil de responsabilité numérique, adapté au niveau (déterministe). */
export function conseilResponsabilite(niveau: string): string {
  switch (niveau) {
    case "faux":
      return "Ne partagez pas ce contenu. Il est démenti par les éléments consultés. Prévenez la personne qui vous l'a envoyé et signalez-le.";
    case "douteux":
      return "Dans le doute, ne partagez pas. Attendez une confirmation d'une source officielle ou d'un média établi avant de relayer.";
    case "fiable":
      return "Ce contenu est appuyé par des sources fiables. Vous pouvez le partager, en citant vos sources pour aider les autres à vérifier.";
    default:
      return "Les éléments sont insuffisants pour conclure. Ne partagez pas comme un fait avéré : cherchez une source officielle avant de relayer.";
  }
}
