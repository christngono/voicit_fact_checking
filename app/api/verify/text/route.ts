import { getLLM } from "@/lib/llm";
import { verifierTexte, conseilResponsabilite } from "@/lib/pipeline";
import { creerFluxSSE } from "@/lib/sse";
import type { VerifyResult } from "@/lib/types";

// Runtime Node.js requis (SDK des fournisseurs LLM).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Marge de durée max pour la fonction serverless (plan gratuit Vercel : 10 s Hobby).
export const maxDuration = 60;

/**
 * POST /api/verify/text  { contenu }
 * Réponse : flux SSE d'étapes réelles puis événement "resultat".
 *
 * Robustesse démo (jury) : AUCUN écran blanc ni stack trace. En cas d'échec
 * total (clé absente, LLM indisponible, quota, réseau), on renvoie un résultat
 * « Éléments insuffisants — soumis à vérification humaine » plutôt qu'une erreur.
 * Aucune clé API n'est exposée : getLLM() lit l'env côté serveur uniquement.
 */
export async function POST(req: Request) {
  let contenu = "";
  try {
    const body = await req.json();
    contenu = (body?.contenu ?? "").toString().trim();
  } catch {
    return Response.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  if (!contenu) {
    return Response.json({ error: "Le champ 'contenu' est requis." }, { status: 400 });
  }

  return creerFluxSSE(async (emit) => {
    try {
      const llm = getLLM(); // peut lever si la clé du fournisseur est absente
      const resultat = await verifierTexte(contenu, emit, llm);
      emit({ type: "resultat", data: resultat });
    } catch (err) {
      // Filet de sécurité ultime : on livre un résultat honnête, jamais un crash.
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
      "Le service de vérification n'a pas pu aboutir pour cette demande.",
    ],
    sources: [],
    affirmations: [],
    conseil: conseilResponsabilite("insuffisant"),
    explication:
      "Nous n'avons pas pu conclure automatiquement (" +
      raison.slice(0, 160) +
      "). Par prudence, ne partagez pas ce contenu comme un fait avéré.",
  };
}
