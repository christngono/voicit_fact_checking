import rumeursData from "../data/rumeurs.json";
import type { Rumeur } from "./types";

/**
 * Mémoire collective (Temps 1 du pipeline) — CODE déterministe, aucun LLM.
 *
 * ⚠️ Contrainte Vercel : le système de fichiers est en LECTURE SEULE et éphémère
 * en production. On ne fait donc JAMAIS d'écriture disque (`fs.writeFile`).
 * L'enrichissement vit UNIQUEMENT en cache mémoire, derrière l'interface
 * `MemoryStore` ci-dessous. Une implémentation persistante (Vercel KV / Postgres)
 * pourra être branchée plus tard SANS modifier le reste du code : il suffit de
 * fournir une autre classe qui respecte `MemoryStore` et de la câbler ici.
 */

// ── Interface de stockage (point d'extension pour la persistance future) ──────
export interface MatchMemoire {
  rumeur: Rumeur;
  similarite: number;
}

export interface MemoryStore {
  /** Cherche une rumeur similaire au contenu (similarité lexicale). */
  search(query: string): Promise<MatchMemoire | null>;
  /** Ajoute une rumeur vérifiée (enrichissement). En mémoire uniquement. */
  add(entry: Rumeur): Promise<void>;
  /** Rumeurs les plus récemment vérifiées (pour l'accueil). */
  recent(limit: number): Promise<Rumeur[]>;
}

// ── Similarité lexicale (tokenisation + racinisation + Jaccard) ───────────────

const STOPWORDS = new Set([
  "le","la","les","de","des","du","un","une","et","ou","a","à","au","aux","en",
  "ce","cette","ces","pour","par","sur","dans","que","qui","est","sont","va",
  "vous","votre","vos","ne","pas","plus","tout","tous","son","sa","ses","il",
  "elle","the","to","of","and","for","you","your","is","are",
]);

function tokeniser(texte: string): Set<string> {
  return new Set(
    texte
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "") // enlève les accents (diacritiques combinants)
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOPWORDS.has(t))
      // Racinisation grossière : tronque à 7 caractères pour rapprocher les
      // variantes morphologiques (« démission » ≈ « démissionné »).
      .map((t) => t.slice(0, 7))
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

const SEUIL_SIMILARITE = 0.26;

// ── Implémentation en mémoire (aucune écriture disque) ────────────────────────

class InMemoryStore implements MemoryStore {
  private corpus: Rumeur[];

  constructor(seed: Rumeur[]) {
    // Charge data/rumeurs.json au démarrage. Les ajouts restent en mémoire pour
    // la durée de vie de l'instance serverless (pas de persistance disque).
    this.corpus = [...seed];
  }

  async search(query: string): Promise<MatchMemoire | null> {
    const tokensReq = tokeniser(query);
    let meilleur: MatchMemoire | null = null;

    for (const r of this.corpus) {
      const tokensRum = new Set([
        ...tokeniser(r.texte),
        ...r.motsCles.flatMap((m) => [...tokeniser(m)]),
      ]);
      const sim = jaccard(tokensReq, tokensRum);
      if (sim > (meilleur?.similarite ?? 0)) meilleur = { rumeur: r, similarite: sim };
    }

    return meilleur && meilleur.similarite >= SEUIL_SIMILARITE ? meilleur : null;
  }

  async add(entry: Rumeur): Promise<void> {
    // Enrichissement : purement en mémoire. AUCUN fs.writeFile (Vercel read-only).
    this.corpus.push(entry);
  }

  async recent(limit: number): Promise<Rumeur[]> {
    return [...this.corpus]
      .sort((a, b) => (a.dateVerification < b.dateVerification ? 1 : -1))
      .slice(0, limit);
  }
}

// Point d'extension : pour une persistance durable, remplacer l'instanciation
// ci-dessous par un PersistentStore (Vercel KV / Postgres) respectant MemoryStore.
export const memoryStore: MemoryStore = new InMemoryStore(rumeursData as Rumeur[]);
