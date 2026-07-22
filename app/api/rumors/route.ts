import { memoryStore } from "@/lib/memory";

export const runtime = "nodejs";

/**
 * GET /api/rumors — dernières rumeurs démenties, pour l'accueil.
 * Lecture seule du corpus via l'interface MemoryStore.
 */
export async function GET() {
  try {
    const recentes = (await memoryStore.recent(30))
      .filter((r) => r.verdict === "faux")
      .slice(0, 6)
      .map((r) => ({
        id: r.id,
        texte: r.texte.length > 130 ? r.texte.slice(0, 127) + "…" : r.texte,
        verdict: r.verdict,
        dateVerification: r.dateVerification,
      }));
    return Response.json({ rumeurs: recentes });
  } catch {
    // Jamais d'erreur brute : l'accueil se contente d'une liste vide.
    return Response.json({ rumeurs: [] });
  }
}
