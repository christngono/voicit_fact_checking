import { getLLM } from "@/lib/llm";
import { verifierLien } from "@/lib/pipelineLien";
import { conseilResponsabilite } from "@/lib/verifyShared";
import { creerFluxSSE } from "@/lib/sse";
import type { VerifyResult } from "@/lib/types";

// Runtime Node.js requis (SDK LLM + fetch de page distante).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/verify/link  { url }
 * Réponse : flux SSE d'étapes réelles puis événement "resultat".
 *
 * Même contrat de robustesse que le module Texte : aucune stack trace, aucun
 * écran blanc. Tout échec total → « Éléments insuffisants ». Les clés API sont
 * lues côté serveur uniquement (getLLM()).
 */
export async function POST(req: Request) {
  let url = "";
  try {
    const body = await req.json();
    url = (body?.url ?? "").toString().trim();
  } catch {
    return Response.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  if (!url) {
    return Response.json({ error: "Le champ 'url' est requis." }, { status: 400 });
  }

  return creerFluxSSE(async (emit) => {
    try {
      const llm = getLLM();
      const resultat = await verifierLien(url, emit, llm);
      emit({ type: "resultat", data: resultat });
    } catch (err) {
      const message = (err as Error).message || "Service momentanément indisponible.";
      emit({ type: "etape", id: "score", statut: "termine", label: "Calcul du score" });
      emit({ type: "resultat", data: resultatInsuffisant(message) });
    }
  });
}

function resultatInsuffisant(raison: string): VerifyResult {
  return {
    verdict: "insuffisant",
    score: 50,
    niveau: "insuffisant",
    origine: "recherche_web",
    composantes: [
      "Éléments insuffisants — soumis à vérification humaine.",
      "Le service de vérification n'a pas pu aboutir pour ce lien.",
    ],
    sources: [],
    affirmations: [],
    conseil: conseilResponsabilite("insuffisant"),
    explication:
      "Nous n'avons pas pu conclure automatiquement (" +
      raison.slice(0, 160) +
      "). Par prudence, ne partagez pas ce lien comme un fait avéré.",
  };
}
