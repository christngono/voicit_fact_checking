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
| 2 | Module **LIEN** (fetch page, réputation domaine, écart titre/contenu) | ⬜ à faire |
| 3 | Module **NUMÉRO** (consultation `data/numeros.json`, sans LLM) | ⬜ à faire |
| 4 | Module **IMAGE** (`analyzeImage`, OCR + affirmation implicite) | ⬜ à faire |
| — | Hero carrousel + header allégé (UI accueil) | ✅ FAIT (hors plan initial, demandé en cours) |

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
  LLM**, timeouts (`lib/util.ts`), enrichissement mémoire.
- Mémoire `lib/memory.ts` : interface `MemoryStore` + `InMemoryStore`
  (similarité Jaccard + racinisation à 7 car.). **Aucune écriture disque.**
- Réputation `lib/reputation.ts` (+ `data/domaines.json`), normalisation numéro
  `lib/phone.ts` (déjà prête pour l'étape 3).
- API : `POST /api/verify/text` (SSE, robuste, jamais de stack trace →
  « insuffisant »), `GET /api/rumors`.
- UI accueil : Hero carrousel, onglets (Texte actif ; Lien/Image/Numéro = « bientôt »),
  formulaire, progression SSE réelle, écran résultat (preuves → sources →
  affirmations → conseil).

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

## 9. PROCHAINE ÉTAPE — Module LIEN (étape 2)

Plan prévu (à implémenter dans `lib/` + `app/api/verify/link/route.ts` + UI onglet) :

1. `lib/fetchPage.ts` : récupérer la page avec **timeout explicite 5 s**
   (`AbortController`), extraire titre / date de publication / auteur / corps.
   Si page inaccessible → « insuffisant » propre (pas de crash).
2. Réputation via `lib/reputation.ts` (déjà là) : âge apparent du domaine, domaine
   imitant un site officiel (`domaineImiteOfficiel`), absence d'auteur/date →
   signaux `domaine_suspect`, etc.
3. Extraction des affirmations (LLM) → **pipeline 2 temps** (réutiliser la logique
   de `pipeline.ts` ; factoriser la partie commune mémoire→web→scoring).
4. Écart titre/contenu (LLM, `promptEcartTitreContenu` existe déjà) → signal
   `ecart_titre_contenu`.
5. Contenu ancien présenté comme actuel (date de publication) → signal
   `contenu_ancien_presente_actuel`.
6. Scoring déterministe → rédaction → SSE, même format `VerifyResult`.
7. Activer l'onglet « Lien » dans `app/page.tsx` (retirer `pret:false`, ajouter le
   champ URL + l'appel SSE).

Tous les `SignalCode` nécessaires existent déjà dans `lib/types.ts` et sont
pondérés dans `lib/scoring.ts`.

## 10. Carte des fichiers

```
app/
  layout.tsx                header allégé + shell
  page.tsx                  accueil : Hero + onglets + form + SSE + résultat
  components/               Hero, Logo, ProgressSteps, VerdictCard, ResultParts,
                            RecentRumors, niveau.ts
  api/verify/text/route.ts  pipeline TEXTE en SSE (robuste)
  api/rumors/route.ts       rumeurs récentes
lib/
  llm/          interface + factory + gemini/claude/openai + prompts + json
  scoring.ts    ★ verdict déterministe (testé)  |  scoring.test.ts
  pipeline.ts   orchestration 2 temps (TEXTE)
  memory.ts     MemoryStore + InMemoryStore (pas de disque)
  reputation.ts fiabilité domaines            phone.ts  normalisation numéros
  util.ts       withTimeout                   sse.ts    flux SSE
  types.ts      types partagés (Signal, VerifyResult, Rumeur, …)
data/           rumeurs.json (30) · numeros.json (40) · domaines.json
public/hero/    deinfos1..3.jpg (images hero optimisées)
```
