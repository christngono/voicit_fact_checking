/**
 * Historique des vérifications — stockage côté client uniquement (sessionStorage).
 *
 * Volontairement SANS compte ni base de données : l'historique n'existe que pour
 * la session en cours de l'utilisateur, sur son appareil. Rien n'est envoyé au
 * serveur, cohérent avec la contrainte « FS lecture seule » de VoiCit.
 */
import type { Niveau, TypeContenu } from "./types";

export interface EntreeHistorique {
  id: string;
  type: TypeContenu;
  apercu: string;
  verdict: Niveau;
  score: number;
  /** Horodatage (ms) de la vérification. */
  date: number;
}

const CLE = "voicit:historique";
const MAX = 50;

export function lireHistorique(): EntreeHistorique[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = window.sessionStorage.getItem(CLE);
    if (!brut) return [];
    const data = JSON.parse(brut) as EntreeHistorique[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function ajouterHistorique(entree: Omit<EntreeHistorique, "id" | "date">): void {
  if (typeof window === "undefined") return;
  try {
    const item: EntreeHistorique = {
      ...entree,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: Date.now(),
    };
    const suite = [item, ...lireHistorique()].slice(0, MAX);
    window.sessionStorage.setItem(CLE, JSON.stringify(suite));
  } catch {
    // Session pleine ou indisponible : on ignore silencieusement.
  }
}

export function viderHistorique(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(CLE);
  } catch {
    /* ignore */
  }
}
