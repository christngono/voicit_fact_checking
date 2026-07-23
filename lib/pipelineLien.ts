import type { LLMProvider } from "./llm";
import { promptAnalyseLien } from "./llm/prompts";
import { memoryStore } from "./memory";
import { recupererPage, type PageRecuperee } from "./fetchPage";
import {
  annoterSources,
  domaineImiteOfficiel,
  extraireDomaine,
  fiabiliteDomaine,
} from "./reputation";
import { withTimeout } from "./util";
import {
  assemblerResultat,
  conseilResponsabilite,
  enrichirMemoire,
  evaluerParRecherche,
  resultatDepuisMemoire,
} from "./verifyShared";
import type { Locale } from "./i18n/dictionary";
import type { Signal, Source, StreamEvent, VerifyResult } from "./types";

/**
 * ════════════════════════════════════════════════════════════════════════════
 *  PIPELINE DE VÉRIFICATION — module LIEN.
 * ════════════════════════════════════════════════════════════════════════════
 *
 *  Partie SPÉCIFIQUE au lien :
 *   1. récupérer la page distante (code, timeout 5 s) — `fetchPage.ts` ;
 *   2. signaux de RÉPUTATION (domaine imitant un officiel, contenu ancien) ;
 *   3. 1 appel LLM : affirmations + écart titre/contenu.
 *  Puis on délègue au cœur partagé (`verifyShared.ts`) : mémoire → web →
 *  scoring déterministe → enrichissement. Le LLM ne décide JAMAIS du verdict.
 *
 *  Budget : ≤ 3 appels LLM (analyse + recherche + synthèse). La récupération de
 *  page ne consomme AUCUN appel LLM.
 */

type Emit = (e: StreamEvent) => void;

const T_ANALYSE = 15000;
const DEUX_ANS_MS = 2 * 365 * 24 * 60 * 60 * 1000;

interface AnalyseLien {
  affirmations: string[];
  ecart_titre_contenu: { ecart: boolean; explication: string };
}

export async function verifierLien(
  urlBrut: string,
  emit: Emit,
  llm: LLMProvider,
  loc: Locale = "fr"
): Promise<VerifyResult> {
  // ── Étape 1 : réception ───────────────────────────────────────────────────
  emit({ type: "etape", id: "reception", statut: "termine", label: "Réception du lien" });

  // ── Étape 2 : RÉCUPÉRATION DE LA PAGE (code, pas de LLM) ───────────────────
  emit({ type: "etape", id: "page", statut: "en_cours", label: "Récupération de la page" });
  const page = await recupererPage(urlBrut);
  if (!page.ok) {
    // Échec propre : on n'invente rien, on renvoie « insuffisant » honnête.
    emit({ type: "etape", id: "page", statut: "termine", label: "Page inaccessible" });
    for (const id of ["extraction", "corpus", "web"] as const) {
      emit({ type: "etape", id, statut: "ignore", label: "Étape ignorée" });
    }
    emit({ type: "etape", id: "score", statut: "termine", label: "Calcul du score" });
    return resultatLienInsuffisant(page);
  }
  emit({ type: "etape", id: "page", statut: "termine", label: "Page récupérée" });

  const titre = page.titre || extraireDomaine(page.urlFinale || page.url);
  const corps = page.corps;

  // Source « point de départ » : la page analysée elle-même, avec sa réputation.
  const sourcePage: Source = annoterSources([
    { titre, url: page.urlFinale || page.url, date: page.datePublication },
  ])[0];

  // ── Signaux de RÉPUTATION / FORME (déterministes, sans LLM) ────────────────
  const signaux: Signal[] = [];
  const fiabilite = fiabiliteDomaine(page.urlFinale || page.url);

  if (domaineImiteOfficiel(page.urlFinale || page.url) || fiabilite === "frauduleux") {
    signaux.push({
      code: "domaine_suspect",
      sens: "negatif",
      libelle: `Le domaine « ${extraireDomaine(page.urlFinale || page.url)} » imite un site officiel ou est connu comme trompeur`,
    });
  }

  // Contenu ancien présenté comme actuel : uniquement si la source n'est pas
  // établie (un média fiable qui archive un vieil article reste légitime).
  if (page.datePublication && (fiabilite === "inconnu" || fiabilite === "frauduleux")) {
    const age = Date.now() - Date.parse(page.datePublication);
    if (Number.isFinite(age) && age > DEUX_ANS_MS) {
      signaux.push({
        code: "contenu_ancien_presente_actuel",
        sens: "negatif",
        libelle: `Article daté du ${page.datePublication}, potentiellement ancien présenté comme actuel`,
      });
    }
  }

  // ── Étape 3 : ANALYSE (APPEL LLM 1) — affirmations + écart titre/contenu ───
  emit({ type: "etape", id: "extraction", statut: "en_cours", label: "Lecture du contenu" });
  const analyse = await withTimeout<AnalyseLien>(
    llm.completeJSON<AnalyseLien>(promptAnalyseLien(titre, corps, loc)),
    T_ANALYSE,
    { affirmations: [], ecart_titre_contenu: { ecart: false, explication: "" } }
  );
  const affirmationsTxt = (analyse.affirmations || []).slice(0, 4);
  if (analyse.ecart_titre_contenu?.ecart) {
    signaux.push({
      code: "ecart_titre_contenu",
      sens: "negatif",
      libelle:
        "Écart entre le titre et le contenu" +
        (analyse.ecart_titre_contenu.explication
          ? ` : ${analyse.ecart_titre_contenu.explication}`
          : ""),
    });
  }
  emit({ type: "etape", id: "extraction", statut: "termine", label: "Lecture du contenu" });

  // ── Étape 4 : MÉMOIRE COLLECTIVE (Temps 1) ────────────────────────────────
  emit({ type: "etape", id: "corpus", statut: "en_cours", label: "Recherche dans le corpus VoCit" });
  const requeteMemoire = `${titre}. ${corps.slice(0, 400)}`.trim();
  const match = await memoryStore.search(requeteMemoire);
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
    sources: [sourcePage, ...web.sources],
    affirmations: web.affirmations,
    resumeWeb: web.resumeWeb,
    origine: "recherche_web",
  });
  emit({ type: "etape", id: "score", statut: "termine", label: "Calcul du score" });

  await enrichirMemoire(`${titre}. ${corps.slice(0, 200)}`, resultat);

  return resultat;
}

/** Résultat honnête quand la page n'a pas pu être lue (pas de crash, pas d'invention). */
function resultatLienInsuffisant(page: PageRecuperee): VerifyResult {
  return {
    verdict: "insuffisant",
    score: 50,
    niveau: "insuffisant",
    origine: "recherche_web",
    composantes: [
      "La page n'a pas pu être analysée.",
      page.raison || "Lien inaccessible.",
    ],
    sources: [],
    affirmations: [],
    conseil: conseilResponsabilite("insuffisant"),
    explication:
      `Nous n'avons pas pu lire cette page (${page.raison || "lien inaccessible"}). ` +
      "Par prudence, ne partagez pas son contenu comme un fait avéré tant qu'il n'est pas vérifié.",
  };
}
