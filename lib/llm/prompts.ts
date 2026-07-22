/**
 * Tous les prompts de VoiCit, centralisés.
 *
 * RÈGLE : aucun prompt ne demande au LLM de trancher la véracité ni de donner
 * un score. Les prompts servent à normaliser, extraire, classer, chercher et
 * rédiger. Le verdict est calculé par lib/scoring.ts.
 */

/**
 * APPEL 1 (combiné) — normalisation + extraction + marqueurs en UN seul appel.
 *
 * Contrainte Vercel : limiter les appels LLM chaînés (viser 2-3 max par
 * vérification). On regroupe donc trois tâches de COMPRÉHENSION (jamais de
 * jugement de véracité) dans une seule complétion JSON.
 */
export function promptAnalyseTexte(contenu: string): string {
  return `Tu assistes une plateforme camerounaise de vérification. Le message peut être
en français, anglais, pidgin camerounais ou camfranglais.

Fais TROIS choses, sans jamais juger si le contenu est vrai ou faux, sans rien chercher :
1. "traduction" : traduis le message en français standard clair (garde chiffres, lieux,
   montants FCFA, dates à l'identique).
2. "affirmations" : liste les affirmations FACTUELLES vérifiables (un fait précis, daté
   ou chiffrable). Pas d'opinions, questions ni appels à l'action. Max 4.
3. "marqueurs" : marqueurs de manipulation rhétorique présents (urgence, injonction de
   partage, source anonyme, appel à la peur). Type ∈ urgence|partage|source_anonyme|peur|autre.

Réponds STRICTEMENT en JSON :
{"traduction":"...","affirmations":["..."],"marqueurs":[{"type":"...","extrait":"..."}]}

MESSAGE :
"""
${contenu}
"""`;
}

/**
 * APPEL 3 (combiné) — évaluation des affirmations + résumé factuel, en UN appel.
 *
 * Le LLM classe chaque affirmation À PARTIR DES EXTRAITS fournis (jamais de
 * mémoire) et rédige un résumé NEUTRE de ce que montrent les sources. Il ne
 * donne NI verdict NI score : ceux-ci sont calculés ensuite par lib/scoring.ts.
 */
export function promptSyntheseWeb(
  affirmations: string[],
  resultatsWeb: string
): string {
  return `Voici des affirmations et des EXTRAITS DE SOURCES trouvés sur le web.
En t'appuyant UNIQUEMENT sur ces extraits (jamais sur tes connaissances) :
- pour chaque affirmation, donne un "statut" : "corroboree" | "contredite" | "non_trouvee".
  En cas de doute, "non_trouvee". Ne devine pas.
- rédige un "resume" NEUTRE (2 phrases max) de ce que montrent les sources, en français
  simple. NE donne PAS de verdict ni de score : décris seulement ce qui a été trouvé.

Réponds STRICTEMENT en JSON :
{"statuts":[{"affirmation":"...","statut":"..."}],"resume":"..."}

AFFIRMATIONS :
${JSON.stringify(affirmations)}

EXTRAITS DE SOURCES :
"""
${resultatsWeb}
"""`;
}

/** Normalise un contenu (fr / en / pidgin / camfranglais) vers un français clair. */
export function promptNormalisation(contenu: string): string {
  return `Tu es un assistant linguistique pour le Cameroun. Le message ci-dessous peut être
en français, anglais, pidgin camerounais ou camfranglais.

Traduis-le en français standard clair, SANS rien ajouter, retirer ni juger sa véracité.
Conserve les chiffres, noms de lieux, montants (FCFA) et dates exactement.

Réponds uniquement par la traduction française, sans préambule.

MESSAGE :
"""
${contenu}
"""`;
}

/**
 * Extrait les affirmations factuelles vérifiables.
 * Sortie JSON stricte : { "affirmations": string[] }
 */
export function promptExtractionAffirmations(contenuFr: string): string {
  return `Analyse ce contenu et liste UNIQUEMENT les affirmations factuelles vérifiables
(un fait précis, daté ou chiffrable, qu'on pourrait confirmer ou infirmer via des sources).

N'inclus PAS les opinions, questions, appels à l'action ou généralités.
Ne juge PAS si elles sont vraies ou fausses. Ne cherche rien. Liste-les seulement.

Réponds STRICTEMENT en JSON : {"affirmations": ["...", "..."]}
Si aucune affirmation vérifiable, renvoie {"affirmations": []}.

CONTENU :
"""
${contenuFr}
"""`;
}

/**
 * Détecte des marqueurs de manipulation (rhétorique), PAS la véracité.
 * Sortie JSON : { "marqueurs": [{ "type": string, "extrait": string }] }
 */
export function promptMarqueursManipulation(contenuFr: string): string {
  return `Repère dans ce contenu les MARQUEURS DE MANIPULATION rhétorique éventuels :
urgence artificielle, injonction de partage ("partagez vite", "avant suppression"),
source anonyme ("un ami de la police m'a dit"), appel à la peur, absence de source.

Tu n'évalues PAS la véracité, seulement la forme rhétorique.

Réponds STRICTEMENT en JSON :
{"marqueurs": [{"type": "urgence|partage|source_anonyme|peur|autre", "extrait": "..."}]}
Si aucun, renvoie {"marqueurs": []}.

CONTENU :
"""
${contenuFr}
"""`;
}

/**
 * Évalue le statut d'une affirmation À PARTIR des extraits de recherche fournis.
 * Le LLM ne répond PAS de mémoire : il ne s'appuie que sur `resultatsWeb`.
 * Sortie JSON : { "statut": "corroboree|contredite|non_trouvee", "justification": string }
 */
export function promptEvaluationAffirmation(
  affirmation: string,
  resultatsWeb: string
): string {
  return `Voici une affirmation et des EXTRAITS DE SOURCES trouvés sur le web.
Détermine, EN T'APPUYANT UNIQUEMENT sur ces extraits (jamais sur tes connaissances),
si l'affirmation est :
- "corroboree" : des sources l'appuient clairement,
- "contredite" : des sources la démentent clairement,
- "non_trouvee" : les extraits ne permettent pas de conclure.

Ne devine pas. En cas de doute, réponds "non_trouvee".

Réponds STRICTEMENT en JSON : {"statut": "...", "justification": "phrase courte"}

AFFIRMATION :
"""
${affirmation}
"""

EXTRAITS DE SOURCES :
"""
${resultatsWeb}
"""`;
}

/**
 * APPEL 1 du module LIEN (combiné) — extraction d'affirmations + écart
 * titre/contenu en UN seul appel JSON. Comme pour le texte, le LLM ne juge
 * jamais la véracité : il comprend et extrait, le scoring tranche.
 */
export function promptAnalyseLien(titre: string, corps: string): string {
  return `Tu assistes une plateforme camerounaise de vérification. Voici le TITRE et le
CORPS d'un article web. Fais DEUX choses, sans juger si c'est vrai ou faux, sans rien
chercher sur le web :

1. "affirmations" : liste les affirmations FACTUELLES vérifiables portées par l'article
   (un fait précis, daté ou chiffrable). Pas d'opinions, questions ni appels à l'action.
   Formule-les en français standard clair. Max 4.
2. "ecart_titre_contenu" : le titre promet-il/affirme-t-il quelque chose que le corps ne
   soutient pas (exagération, sensationnalisme, piège à clic) ? Donne {"ecart": true|false,
   "explication": "phrase courte"}.

Réponds STRICTEMENT en JSON :
{"affirmations":["..."],"ecart_titre_contenu":{"ecart":false,"explication":"..."}}

TITRE : """${titre}"""
CORPS : """${corps.slice(0, 4000)}"""`;
}

/** Détecte un écart entre un titre (accrocheur) et le corps d'un article. Module Lien. */
export function promptEcartTitreContenu(titre: string, corps: string): string {
  return `Compare ce TITRE et ce CORPS d'article. Y a-t-il un écart notable (le titre
promet/affirme quelque chose que le corps ne soutient pas, exagération, sensationnalisme) ?

Réponds STRICTEMENT en JSON : {"ecart": true|false, "explication": "phrase courte"}

TITRE : """${titre}"""
CORPS : """${corps.slice(0, 4000)}"""`;
}

/** Décrit une image + lit le texte incrusté (OCR). Ne juge pas la véracité. */
export function promptAnalyseImage(): string {
  return `Décris factuellement cette image et RETRANSCRIS tout texte incrusté (OCR),
mot pour mot. Ne juge pas si le contenu est vrai ou faux. Indique s'il s'agit
visiblement d'une capture d'écran, d'un montage ou d'une photo.

Format :
TEXTE INCRUSTÉ : ...
DESCRIPTION : ...`;
}

/** Formule l'affirmation implicite véhiculée par une image (à partir de sa description). */
export function promptAffirmationImplicite(description: string): string {
  return `À partir de cette description d'image, formule en UNE phrase l'affirmation
factuelle implicite que l'image véhicule (ce qu'elle veut faire croire).

Réponds STRICTEMENT en JSON : {"affirmation": "..."}

DESCRIPTION :
"""
${description}
"""`;
}

/**
 * Rédige l'explication finale en langage simple.
 * On lui fournit les COMPOSANTES déjà calculées par le scoring : il ne recalcule
 * rien, il met en mots. Le verdict/score sont déjà fixés.
 */
export function promptRedactionFinale(
  niveau: string,
  composantes: string[],
  affirmations: { texte: string; statut: string }[]
): string {
  return `Tu écris pour un citoyen camerounais, en français simple et rassurant.
Le verdict et le score ont DÉJÀ été calculés par notre système (ne les recalcule pas,
ne les remets pas en cause). Ton rôle : expliquer en 2-3 phrases POURQUOI, à partir
des éléments ci-dessous, sans dramatiser et sans inventer de faits nouveaux.

Niveau retenu : ${niveau}
Éléments de preuve : ${JSON.stringify(composantes)}
Affirmations examinées : ${JSON.stringify(affirmations)}

Écris uniquement l'explication (pas de titre, pas de score chiffré).`;
}
