# PROGRESS — VoiCit

> Journal de progression pour reprendre le travail dans une nouvelle session sans
> relire tout le contexte. **Lis ce fichier en premier.** Détails produit dans
> [README.md](README.md).

Dernière mise à jour : **2026-07-22**

---

## 1. En une phrase

VoiCit (« Voice of the Citizen ») : appli web camerounaise de vérification de
contenus (Next.js App Router + TS + Tailwind). Un citoyen soumet **texte / lien /
image / numéro** et reçoit un **verdict explicable et sourcé**.

## 2. Règle d'architecture NON NÉGOCIABLE

**Le LLM ne décide JAMAIS du verdict.** Il sert à comprendre, normaliser,
extraire, chercher sur le web et rédiger. Le **verdict + score** sont calculés par
du **code déterministe** dans [lib/scoring.ts](lib/scoring.ts) (testé, sans LLM).
Ne jamais demander au LLM « est-ce vrai ? » ni « donne un score /100 ».

Corollaires :
- Seuls les fichiers `lib/llm/*.ts` importent un SDK de fournisseur. Le reste passe
  par l'interface `LLMProvider` + la factory `getLLM()`.
- Bascule de fournisseur = changer la variable d'env `LLM_PROVIDER`, rien d'autre.

## 3. État d'avancement

| Étape | Contenu | État |
|-------|---------|------|
| **1** | Couche LLM interchangeable + module **TEXTE** de bout en bout | ✅ **FAIT** |
| **2** | Module **LIEN** (fetch page, réputation domaine, écart titre/contenu) | ✅ **FAIT** |
| **3** | Module **IMAGE** (`analyzeImage`, OCR + type visuel + affirmations) | ✅ **FAIT** |
| 4 | Module **NUMÉRO** (consultation `data/numeros.json`, sans LLM) | ⬜ à faire |
| — | Module **VIDÉO** | ⬜ onglet « bientôt » seulement (pas de pipeline) |
| — | Hero carrousel + header allégé (UI accueil) | ✅ FAIT (hors plan initial, demandé en cours) |
| — | Navigation (barre basse 4 items + menu secondaire) + pages dédiées | ✅ FAIT (hors plan, demandé en cours) |
| — | Splash screen animé (logo) + message d'aide « comment utiliser » | ✅ FAIT (hors plan, demandé en cours) |

**Méthode de travail convenue avec l'utilisateur : s'arrêter après chaque étape
pour qu'il teste, avant d'enchaîner.**

## 4. Ce qui MARCHE aujourd'hui (étape 1 + hero)

- Couche LLM : `lib/llm/` — interface `types.ts`, impls `gemini.ts` / `claude.ts`
  / `openai.ts`, factory `index.ts`, prompts `prompts.ts`. `searchAndAnswer()`
  encapsule la recherche web ; repli explicite « recherche indisponible » (jamais
  de sources inventées).
- Scoring déterministe `lib/scoring.ts` + tests `lib/scoring.test.ts` (**9/9**,
  `npm test`). Règle clé : « faux » n'est prononcé que s'il existe une preuve
  factuelle négative forte ; la seule manipulation rhétorique → au pire « douteux ».
- Pipeline TEXTE `lib/pipeline.ts` : **2 temps** (mémoire → web), **≤ 3 appels
  LLM**, timeouts (`lib/util.ts`), enrichissement mémoire. Le cœur commun (web +
  synthèse + scoring + enrichissement + mémoire) est factorisé dans
  `lib/verifyShared.ts`, partagé avec le module Lien.
- Pipeline LIEN `lib/pipelineLien.ts` : récupération de page `lib/fetchPage.ts`
  (**timeout 5 s** AbortController, taille bornée, extraction regex sans dépendance :
  titre/auteur/date/corps), signaux réputation (`domaine_suspect` via
  `domaineImiteOfficiel`, `contenu_ancien_presente_actuel` si vieux + domaine non
  fiable), **1 appel** `promptAnalyseLien` (affirmations + `ecart_titre_contenu`),
  puis mémoire → web → scoring via `verifyShared`. **≤ 3 appels LLM.** La page
  analysée est ajoutée comme 1re source. Échec de fetch → « insuffisant » propre.
  Tests `lib/fetchPage.test.ts` (5). API : `POST /api/verify/link` (SSE, robuste).
- Pipeline IMAGE `lib/pipelineImage.ts` : **1 appel vision** (`promptAnalyseImage`
  renvoie JSON : `texte_incruste` OCR + `description` + `type_visuel` +
  `affirmations`), signal `indice_ia` (poids FAIBLE) si montage/`genere_ia`, puis
  mémoire → web → scoring via `verifyShared`. **≤ 3 appels LLM.** API : `POST
  /api/verify/image` (SSE) — accepte data URL, sépare le préfixe, borne la taille
  (~4,5 Mo), image illisible/lourde → « insuffisant » propre. Onglet « Image »
  actif (upload + aperçu). Étapes UI : `ETAPES_INIT_IMAGE`.
- Onglet **Vidéo** ajouté avec badge « bientôt » (aucun pipeline). Grille d'onglets
  passée à 5 colonnes (Texte, Lien, Image, Vidéo, Numéro).
- Message d'aide « Comment ça marche » sur l'accueil (au-dessus des onglets).
- Mémoire `lib/memory.ts` : interface `MemoryStore` + `InMemoryStore`
  (similarité Jaccard + racinisation à 7 car.). **Aucune écriture disque.**
- Réputation `lib/reputation.ts` (+ `data/domaines.json`), normalisation numéro
  `lib/phone.ts` (déjà prête pour l'étape 3).
- API : `POST /api/verify/text` (SSE, robuste, jamais de stack trace →
  « insuffisant »), `GET /api/rumors`.
- UI accueil : Hero carrousel, onglets (Texte actif ; Lien/Image/Numéro = « bientôt »),
  formulaire, progression SSE réelle, écran résultat (preuves → sources →
  affirmations → conseil).
- Navigation : barre basse mobile-first 4 items (`BottomNav`) — Vérifier `/`,
  Historique `/historique`, Rumeurs `/rumeurs`, À propos `/a-propos` — + menu
  secondaire (`TopMenu`, coin haut droit) : Radar `/radar` (« bientôt »), Contester
  `/contester`, Contact `/contact`. « Vérifier » toujours en un tap (jamais dans le
  menu secondaire). Icônes SVG inline (`components/Icons.tsx`), aucune dépendance.
- Pages : `/a-propos` (sections + citation « l'IA ne juge pas » en encart tornado),
  `/rumeurs` (server component, lit `data/rumeurs.json` en lecture seule),
  `/historique` (session client via `lib/history.ts` → sessionStorage, aucun compte,
  rien envoyé au serveur), `/contester` (formulaire, confirmation client — pas encore
  de file de modération persistée : FS lecture seule), `/contact`, `/radar`.
- ⚠️ Le texte « À propos » emploie **« VoCit »** (fourni tel quel par l'utilisateur)
  alors que le reste du produit dit **« VoiCit »**. Marque à harmoniser si voulu.

## 5. Contraintes Vercel déjà respectées (ne pas régresser)

- **FS lecture seule** : zéro `fs.writeFile`. Enrichissement en mémoire via
  `MemoryStore`. Point d'extension documenté pour KV/Postgres.
- **Durée** : ≤ 3 appels LLM/vérif, timeouts explicites, résultat partiel honnête.
- **Routes** : `export const runtime = "nodejs"`, clés lues côté serveur seulement.
- **Robustesse démo** : toute panne → « Éléments insuffisants — soumis à
  vérification humaine », jamais d'écran blanc ni de trace technique.

## 6. Déploiement

- **GitHub** : https://github.com/christngono/voicit_fact_checking (branche `main`).
  `git push origin main` → Vercel redéploie automatiquement.
- **Vercel** : projet connecté. ⚠️ **Variables d'env à créer côté Vercel** (Settings
  → Environment Variables) : `LLM_PROVIDER`, `LLM_MODEL`, `GEMINI_API_KEY`
  (+ `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` selon le provider).

## 7. ⚠️ Limites connues / pièges

- **Modèle Gemini** : `gemini-2.5-flash` renvoie **404 « no longer available to new
  users »** sur la clé de test. On utilise **`gemini-flash-latest`** (dans
  `.env.local` et par défaut dans `lib/llm/gemini.ts`).
- **Grounding Gemini (recherche web)** : **quota 0** en tier gratuit → `429
  RESOURCE_EXHAUSTED`. Conséquence : sur clé gratuite, les contenus inédits
  tombent en « douteux/insuffisant » (comportement honnête, pas un bug). Pour voir
  le chemin web aboutir : activer la facturation Google, OU basculer
  `LLM_PROVIDER=claude` / `openai` avec leur clé.
- **`.env.local` n'est PAS commité** (gitignore). Il contient la vraie clé Gemini
  en local. Les PNG sources `deinfos*.png` sont gitignorés (versions optimisées
  dans `public/hero/`).
- Prompts individuels (`promptNormalisation`, `promptEvaluationAffirmation`, etc.)
  encore présents mais **non utilisés** par le pipeline texte (qui utilise les
  prompts combinés `promptAnalyseTexte` / `promptSyntheseWeb`). Réutilisables pour
  Lien/Image.

## 8. Commandes utiles

```bash
npm install
cp .env.example .env.local     # renseigner GEMINI_API_KEY (déjà fait en local)
npm run dev                    # http://localhost:3000
npm test                       # tests scoring (9/9)
npx tsc --noEmit               # typecheck
npx next build                 # build prod
```

## 9. PROCHAINE ÉTAPE — Module NUMÉRO (étape 4)

Consultation de `data/numeros.json` (40 numéros signalés), **sans LLM** — c'est de
la donnée locale déterministe.

1. `lib/phone.ts` normalise déjà un numéro vers `+2376XXXXXXXX` (prêt).
2. Créer `lib/numeros.ts` : charger `data/numeros.json`, chercher le numéro
   normalisé, renvoyer `NumeroSignale` (nbSignalements, motifPrincipal, dates).
3. Scoring déterministe simple : nb de signalements distincts → niveau
   (aucun appel LLM ; un `NumeroSignale` connu = signal négatif fort).
4. API `POST /api/verify/phone` (peut être synchrone, pas besoin de SSE ni de LLM)
   OU réutiliser le format SSE pour homogénéité de l'UI.
5. Activer l'onglet « Numéro » dans `app/page.tsx` (champ tel + validation via
   `lib/phone.ts`).

Rappel : le module Lien (étape 2) réutilise `lib/verifyShared.ts` — même schéma à
suivre si le module Numéro doit faire une recherche web (a priori non).

## 10. Carte des fichiers

```
app/
  layout.tsx                header + TopMenu + shell + BottomNav
  page.tsx                  accueil « Vérifier » : Hero + onglets + form + SSE + résultat
  a-propos/ rumeurs/ historique/ radar/ contester/ contact/   pages de navigation
  components/               Hero, Logo, ProgressSteps, VerdictCard, ResultParts,
                            RecentRumors, niveau.ts, BottomNav, TopMenu, Icons,
                            PageIntro
  api/verify/text/route.ts  pipeline TEXTE en SSE (robuste)
  api/verify/link/route.ts  pipeline LIEN en SSE (robuste)
  api/verify/image/route.ts pipeline IMAGE en SSE (robuste)
  api/rumors/route.ts       rumeurs récentes
lib/
  history.ts    historique de session (sessionStorage, client)
  llm/          interface + factory + gemini/claude/openai + prompts + json
  scoring.ts    ★ verdict déterministe (testé)  |  scoring.test.ts
  verifyShared.ts ★ cœur commun (web + synthèse + scoring + mémoire)
  pipeline.ts   orchestration TEXTE (partie spécifique)
  pipelineLien.ts orchestration LIEN (partie spécifique)
  pipelineImage.ts orchestration IMAGE (vision + OCR, partie spécifique)
  fetchPage.ts  récupération + extraction de page (testé : fetchPage.test.ts)
  memory.ts     MemoryStore + InMemoryStore (pas de disque)
  reputation.ts fiabilité domaines            phone.ts  normalisation numéros
  util.ts       withTimeout                   sse.ts    flux SSE
  types.ts      types partagés (Signal, VerifyResult, Rumeur, …)
data/           rumeurs.json (30) · numeros.json (40) · domaines.json
public/hero/    deinfos1..3.jpg (images hero optimisées)
```
