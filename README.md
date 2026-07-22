# VoiCit — Voice of the Citizen

> **Vérifier avant de partager.**
> Plateforme camerounaise de vérification de contenus douteux. Un citoyen soumet
> un texte, un lien, une image ou un numéro, et reçoit un **verdict explicable et
> sourcé** — présenté comme des **preuves**, jamais comme un oracle.

---

## Principe fondamental : le LLM ne décide jamais du verdict

C'est la règle d'architecture centrale de VoiCit, et elle est visible dans le code.

- **Le LLM** ([lib/llm/](lib/llm/)) sert uniquement à : comprendre et normaliser
  le contenu (traduction fr/en/pidgin/camfranglais), extraire les affirmations
  vérifiables, classer, **interroger le web et synthétiser les sources**, et
  rédiger l'explication finale en langage simple.
- **Le verdict et le score** sont calculés par du **code déterministe**
  ([lib/scoring.ts](lib/scoring.ts)) à partir de signaux vérifiables. On ne demande
  **jamais** au LLM « est-ce vrai ? » ni « donne un score sur 100 ».

Le LLM ne se prononce que sur la base des **sources effectivement récupérées** —
jamais de mémoire. Voir les commentaires en tête de [lib/scoring.ts](lib/scoring.ts)
et [lib/pipeline.ts](lib/pipeline.ts).

---

## Stack

Next.js (App Router) · React · TypeScript strict · Tailwind CSS · API Routes.
Données en fichiers JSON locaux ([data/](data/)). Déploiement cible : Vercel.

---

## Installation

```bash
npm install
cp .env.example .env.local   # puis renseignez la clé du fournisseur choisi
npm run dev                  # http://localhost:3000
```

## Configuration des clés (côté serveur uniquement)

Aucune clé n'apparaît jamais côté client ni dans le dépôt. Tout est lu côté
serveur depuis `.env.local` (ignoré par git). Renseignez **uniquement** la clé du
fournisseur actif :

```bash
LLM_PROVIDER=gemini          # gemini | claude | openai
LLM_MODEL=                   # optionnel, sinon défaut du provider
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
```

Si la clé du fournisseur sélectionné est absente, l'API échoue **proprement** avec
un message clair (via un événement d'erreur), jamais par un plantage opaque.

## Basculer d'un fournisseur à l'autre

**Une seule ligne à changer**, rien d'autre dans le code :

```bash
LLM_PROVIDER=claude   # ou gemini, ou openai
```

Le reste de l'application n'importe **jamais** un SDK de fournisseur directement :
elle passe exclusivement par l'interface `LLMProvider` obtenue via la factory
[lib/llm/index.ts](lib/llm/index.ts). Les implémentations
([gemini.ts](lib/llm/gemini.ts), [claude.ts](lib/llm/claude.ts),
[openai.ts](lib/llm/openai.ts)) sont les seuls fichiers autorisés à importer un SDK.

**Recherche web.** Chaque fournisseur l'expose différemment (Google Search
grounding pour Gemini, `web_search` pour Claude, `web_search_preview` pour OpenAI).
Cette différence est encapsulée derrière `searchAndAnswer()`. Si un fournisseur ne
peut pas chercher, il retourne un repli explicite « recherche indisponible » et
**aucune source inventée**.

Modèles par défaut (surchargables via `LLM_MODEL`) :

| Fournisseur | Modèle par défaut          |
|-------------|----------------------------|
| gemini      | `gemini-2.5-flash`         |
| claude      | `claude-haiku-4-5-20251001`|
| openai      | `gpt-4o-mini`              |

> Selon la version du SDK installée, un nom de modèle peut devoir être ajusté :
> il suffit de renseigner `LLM_MODEL`, sans toucher au code.

---

## Pipeline de vérification en deux temps

1. **Mémoire collective (rapide).** On cherche d'abord dans
   [data/rumeurs.json](data/rumeurs.json) par similarité
   ([lib/memory.ts](lib/memory.ts)). Correspondance trouvée ⇒ verdict archivé
   renvoyé instantanément (`origine: "memoire"`), sans appel web.
2. **Recherche web (si rien en base).** `searchAndAnswer()` interroge le web sur
   chaque affirmation ; les sources sont pondérées par fiabilité
   ([lib/reputation.ts](lib/reputation.ts) + [data/domaines.json](data/domaines.json)) ;
   chaque affirmation est classée corroborée / contredite / non trouvée. Les
   **signaux** sont transmis au scoring déterministe (`origine: "recherche_web"`).
   Toute vérification web aboutie **enrichit** automatiquement le corpus.

Si la recherche ne remonte rien d'exploitable ⇒ **« Éléments insuffisants »**
(gris), jamais une conclusion inventée.

## Progression en temps réel

L'API `/api/verify/text` renvoie un **flux SSE** ([lib/sse.ts](lib/sse.ts)) : les
étapes affichées reflètent le traitement **réel**, pas une animation
(Réception → Lecture/traduction → Affirmations → Corpus → Web → Score).

---

## Tests

Le scoring déterministe est testé **sans réseau ni clé API** :

```bash
npm test
```

Voir [lib/scoring.test.ts](lib/scoring.test.ts).

---

## Déploiement Vercel (pas à pas)

1. **Pousser le code sur GitHub** (le `.gitignore` protège `.env.local` et
   `.env*` — aucune clé n'est jamais commitée).
   ```bash
   git init && git add -A && git commit -m "VoiCit MVP"
   git branch -M main
   git remote add origin https://github.com/<vous>/voicit_fact_checking.git
   git push -u origin main
   ```
2. **Importer dans Vercel** : New Project → sélectionner le dépôt. Vercel détecte
   Next.js automatiquement (aucune configuration de build à toucher, pas de
   `postinstall`, aucune dépendance native).
3. **Créer les variables d'environnement** dans
   *Settings → Environment Variables* (Production **et** Preview). Exactement :

   | Variable            | Exemple / valeur                     | Obligatoire ?                    |
   |---------------------|--------------------------------------|----------------------------------|
   | `LLM_PROVIDER`      | `gemini`                             | ✅                               |
   | `LLM_MODEL`         | `gemini-flash-latest`                | optionnel (défaut du provider)   |
   | `GEMINI_API_KEY`    | votre clé Google AI Studio           | si `LLM_PROVIDER=gemini`         |
   | `ANTHROPIC_API_KEY` | votre clé Anthropic                  | si `LLM_PROVIDER=claude`         |
   | `OPENAI_API_KEY`    | votre clé OpenAI                     | si `LLM_PROVIDER=openai`         |

   > Ne renseignez que la clé du fournisseur actif. Si elle manque, l'app ne
   > plante pas : elle renvoie un résultat « Éléments insuffisants » avec un
   > message clair (voir *Robustesse* ci-dessous).
4. **Déployer** (Deploy). Les redéploiements sont automatiques à chaque `git push`.

### Contraintes Vercel prises en compte dès la conception

- **Système de fichiers en lecture seule / éphémère.** Aucune écriture disque
  (`fs.writeFile`) nulle part. L'enrichissement de la mémoire collective passe
  par l'interface `MemoryStore` et son implémentation `InMemoryStore`
  ([lib/memory.ts](lib/memory.ts)) : les ajouts vivent **en cache mémoire** pour
  la durée de vie de l'instance. Point d'extension documenté pour brancher une
  persistance (Vercel KV / Postgres) **sans toucher au reste du code**.
- **Durée d'exécution limitée.** Le pipeline plafonne à **3 appels LLM chaînés**
  par vérification (analyse → recherche → synthèse), avec **timeouts explicites**
  ([lib/util.ts](lib/util.ts)) : si une étape dépasse son délai, on poursuit avec
  les signaux déjà collectés (résultat partiel honnête) au lieu d'échouer.
  `maxDuration` est déclaré sur la route.
- **Routes 100 % serveur.** Toutes les routes `app/api/**` tournent en
  `runtime = "nodejs"` ; aucune clé n'atteint le client.
- **Robustesse en démonstration.** Aucune erreur brute, aucun écran blanc :
  toute défaillance (clé absente, quota, réseau, LLM indisponible) est capturée
  et présentée comme un résultat **« Éléments insuffisants — soumis à
  vérification humaine »** ([app/api/verify/text/route.ts](app/api/verify/text/route.ts)).

---

## État d'avancement (construction par étapes)

- [x] **Étape 1** — Couche LLM interchangeable + module **Texte** de bout en bout
- [ ] Étape 2 — Module **Lien**
- [ ] Étape 3 — Module **Numéro**
- [ ] Étape 4 — Module **Image**

## Structure

```
app/            UI (accueil, onglets, progression, résultat) + API routes
  api/verify/text   pipeline Texte en flux SSE
  api/rumors        rumeurs récemment démenties
lib/
  llm/          ★ seule zone autorisée à importer un SDK ; factory + 3 providers
  scoring.ts    ★ verdict déterministe, zéro LLM, testé
  pipeline.ts   orchestration 2 temps (mémoire → web → scoring → rédaction)
  memory.ts     mémoire collective + enrichissement
  reputation.ts fiabilité des domaines
  phone.ts      normalisation des numéros (+237…)
data/           rumeurs.json · numeros.json · domaines.json
```
