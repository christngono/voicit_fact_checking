import domaines from "../data/domaines.json";
import type { Source } from "./types";

/**
 * Réputation des domaines — CODE déterministe, aucun LLM.
 * Sert à pondérer la fiabilité des sources et à détecter les domaines trompeurs.
 */

const FIABLES = new Set(domaines.fiables.map((d) => d.toLowerCase()));
const OFFICIELS = new Set(domaines.officiels.map((d) => d.toLowerCase()));
const FRAUDULEUX = new Set(domaines.frauduleux.map((d) => d.toLowerCase()));

export function extraireDomaine(url: string): string {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h.startsWith("www.") ? h.slice(4) : h;
  } catch {
    return url.toLowerCase();
  }
}

export function fiabiliteDomaine(url: string): Source["fiabilite"] {
  const d = extraireDomaine(url);
  if (FRAUDULEUX.has(d)) return "frauduleux";
  if (OFFICIELS.has(d)) return "officiel";
  if (FIABLES.has(d)) return "fiable";
  // Sous-domaine d'un domaine connu (ex : sport.crtv.cm).
  for (const f of FIABLES) if (d.endsWith("." + f)) return "fiable";
  for (const o of OFFICIELS) if (d.endsWith("." + o)) return "officiel";
  return "inconnu";
}

/** Annote une liste de sources avec leur fiabilité (mutation défensive : copie). */
export function annoterSources(sources: Source[]): Source[] {
  return sources.map((s) => ({ ...s, fiabilite: fiabiliteDomaine(s.url) }));
}

/**
 * Un domaine « suspect » imite un site officiel connu sans en être un.
 * Heuristique : contient le nom d'un officiel mais n'est ni officiel ni fiable,
 * ou figure explicitement dans la liste frauduleuse.
 */
export function domaineImiteOfficiel(url: string): boolean {
  const d = extraireDomaine(url);
  if (FRAUDULEUX.has(d)) return true;
  if (OFFICIELS.has(d) || FIABLES.has(d)) return false;
  const marqueurs = ["gov", "prc", "minsante", "eneo", "elecam", "momo", "money", "officiel"];
  return marqueurs.some((m) => d.includes(m));
}

export const compterFiables = (sources: Source[]): number =>
  sources.filter((s) => s.fiabilite === "fiable" || s.fiabilite === "officiel").length;
