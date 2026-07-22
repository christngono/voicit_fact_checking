import type { LLMProvider } from "./llm";
import { promptSyntheseWeb } from "./llm/prompts";
import type { Locale } from "./i18n/dictionary";
import { calculerScore } from "./scoring";
import { memoryStore } from "./memory";
import { annoterSources, compterFiables } from "./reputation";
import { withTimeout } from "./util";
import type {
  Affirmation,
  Origine,
  Rumeur,
  Signal,
  Source,
  StatutAffirmation,
  VerifyResult,
} from "./types";

/**
 * ════════════════════════════════════════════════════════════════════════════
 *  CŒUR DE VÉRIFICATION PARTAGÉ (Texte, Lien, …).
 * ════════════════════════════════════════════════════════════════════════════
 *
 *  Tout ce qui est COMMUN aux modules est ici : recherche web + synthèse,
 *  scoring déterministe, enrichissement mémoire, conseils. Chaque module
 *  (pipeline.ts pour TEXTE, pipelineLien.ts pour LIEN) ne garde que sa partie
 *  SPÉCIFIQUE (récupérer la page, extraire les affirmations, signaux de forme)
 *  puis délègue ici. Le LLM ne décide JAMAIS du verdict : `calculerScore()` seul.
 */

// Budgets de temps (ms) — bornés pour tenir sous la limite serverless Vercel.
export const BUDGET_RECHERCHE = 18000;
export const BUDGET_SYNTHESE = 15000;

export interface ResultatRecherche {
  signaux: Signal[];
  affirmations: Affirmation[];
  sources: Source[];
  resumeWeb: string;
  rechercheDisponible: boolean;
}

/**
 * TEMPS 2 — recherche web groupée (1 appel) + synthèse (1 appel) → signaux.
 * Repli explicite si la recherche est indisponible : AUCUNE source inventée.
 */
export async function evaluerParRecherche(
  affirmationsTxt: string[],
  llm: LLMProvider,
  loc: Locale = "fr"
): Promise<ResultatRecherche> {
  const signaux: Signal[] = [];
  const affirmations: Affirmation[] = [];
  const sourcesOut: Source[] = [];
  let resumeWeb = "";
  let rechercheDisponible = false;

  if (affirmationsTxt.length > 0) {
    const entete =
      loc === "en"
        ? "Fact-check these claims about Cameroon and cite reliable sources:\n"
        : "Vérifie ces affirmations au Cameroun et cite des sources fiables :\n";
    const requete = entete + affirmationsTxt.map((a, i) => `${i + 1}. ${a}`).join("\n");

    const recherche = await withTimeout(
      llm.searchAndAnswer(requete),
      BUDGET_RECHERCHE,
      { available: false, text: "", sources: [] as Source[] }
    );

    if (recherche.available) {
      rechercheDisponible = true;
      const sources = annoterSources(recherche.sources);
      sourcesOut.push(...sources);

      const synthese = await withTimeout<{
        statuts: { affirmation: string; statut: StatutAffirmation }[];
        resume: string;
      }>(
        llm.completeJSON(
          promptSyntheseWeb(affirmationsTxt, resumeSources(recherche.text, sources), loc)
        ),
        BUDGET_SYNTHESE,
        { statuts: [], resume: recherche.text.slice(0, 300) }
      );
      resumeWeb = synthese.resume || "";

      const nbFiables = compterFiables(sources);
      for (const aff of affirmationsTxt) {
        const st =
          synthese.statuts.find((s) => s.affirmation?.slice(0, 20) === aff.slice(0, 20))
            ?.statut ?? "non_trouvee";
        affirmations.push({ texte: aff, statut: st, sources });
        signaux.push(...signauxDepuisAffirmation(aff, st, nbFiables, sources.length));
      }
    }
  }

  return { signaux, affirmations, sources: sourcesOut, resumeWeb, rechercheDisponible };
}

/**
 * SCORING DÉTERMINISTE + assemblage du résultat final (aucun appel LLM ici).
 * `preuvesSuffisantes` : faux dès qu'on n'a QUE « recherche indisponible ».
 */
export function assemblerResultat(opts: {
  signaux: Signal[];
  sources: Source[];
  affirmations: Affirmation[];
  resumeWeb: string;
  origine: Origine;
}): VerifyResult {
  const { signaux, sources, affirmations, resumeWeb, origine } = opts;
  const preuvesSuffisantes = signaux.some((s) => s.code !== "recherche_indisponible");
  const { score, niveau, composantes } = calculerScore(signaux, preuvesSuffisantes);

  const explication =
    resumeWeb.trim() ||
    (niveau === "insuffisant"
      ? "Les vérifications n'ont pas permis de trouver de sources exploitables sur ce contenu."
      : composantes.map((c) => c.texte).join(". ") + ".");

  return {
    verdict: niveau,
    score,
    niveau,
    origine,
    composantes: composantes.map((c) => c.texte),
    sources: dedupeSources(sources),
    affirmations,
    conseil: conseilResponsabilite(niveau),
    explication,
  };
}

/**
 * Enrichissement automatique de la mémoire collective (MÉMOIRE uniquement, pas de
 * disque). Un contenu conclu « faux » ou « fiable » devient un cas réutilisable.
 */
export async function enrichirMemoire(texteCanonique: string, r: VerifyResult): Promise<void> {
  if (r.niveau !== "faux" && r.niveau !== "fiable") return;
  const nouvelle: Rumeur = {
    id: "auto-" + Date.now().toString(36),
    texte: texteCanonique,
    motsCles: motsClesDepuis(texteCanonique),
    verdict: r.niveau,
    explication: r.explication ?? "",
    sources: r.sources,
    dateVerification: new Date().toISOString().slice(0, 10),
  };
  await memoryStore.add(nouvelle);
}

/** Résultat instantané quand la mémoire collective a déjà tranché ce contenu. */
export function resultatDepuisMemoire(
  rumeur: Rumeur,
  affirmationsTxt: string[]
): VerifyResult {
  const signaux: Signal[] =
    rumeur.verdict === "faux"
      ? [{ code: "deja_dementi", sens: "negatif", libelle: `Déjà démenti par VoCit le ${rumeur.dateVerification}` }]
      : rumeur.verdict === "fiable"
      ? [{ code: "deja_confirme", sens: "positif", libelle: `Déjà confirmé par VoCit le ${rumeur.dateVerification}` }]
      : [{ code: "sources_non_fiables_seulement", sens: "neutre", libelle: `Déjà examiné par VoCit le ${rumeur.dateVerification}` }];

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

// ── Helpers déterministes ────────────────────────────────────────────────────

export function signauxDepuisAffirmation(
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

export function resumeSources(texte: string, sources: Source[]): string {
  const liste = sources
    .map((s, i) => `[${i + 1}] ${s.titre} (${s.fiabilite}) — ${s.url}${s.extrait ? " : " + s.extrait : ""}`)
    .join("\n");
  return `${texte}\n\nSOURCES:\n${liste}`;
}

export function dedupeSources(sources: Source[]): Source[] {
  const seen = new Set<string>();
  return sources.filter((s) => (seen.has(s.url) ? false : (seen.add(s.url), true)));
}

export function motsClesDepuis(texte: string): string[] {
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
