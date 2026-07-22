import { getLLM } from "@/lib/llm";
import { verifierImage } from "@/lib/pipelineImage";
import { conseilResponsabilite } from "@/lib/verifyShared";
import { creerFluxSSE } from "@/lib/sse";
import type { VerifyResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Limite de taille du base64 reçu (~4,7 Mo d'image environ), pour tenir sous la
// limite de corps des fonctions serverless Vercel.
const MAX_BASE64 = 6_300_000;

/**
 * POST /api/verify/image  { image: dataURL|base64, mimeType? }
 * Réponse : flux SSE d'étapes réelles puis événement "resultat".
 *
 * Même contrat de robustesse que Texte/Lien : aucune stack trace, aucun écran
 * blanc, clés API lues côté serveur uniquement. Image trop lourde ou illisible →
 * résultat « insuffisant » honnête, jamais un crash.
 */
export async function POST(req: Request) {
  let image = "";
  let mimeType = "image/jpeg";
  try {
    const body = await req.json();
    image = (body?.image ?? "").toString();
    if (body?.mimeType) mimeType = body.mimeType.toString();
  } catch {
    return Response.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  if (!image) {
    return Response.json({ error: "Le champ 'image' est requis." }, { status: 400 });
  }

  // Sépare un éventuel préfixe data URL (data:image/png;base64,XXXX).
  let base64 = image;
  const m = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/s);
  if (m) {
    mimeType = m[1];
    base64 = m[2];
  }

  return creerFluxSSE(async (emit) => {
    try {
      if (base64.length > MAX_BASE64) {
        emit({ type: "etape", id: "score", statut: "termine", label: "Calcul du score" });
        emit({ type: "resultat", data: resultatInsuffisant("Image trop volumineuse (max ~4,5 Mo).") });
        return;
      }
      const llm = getLLM();
      const resultat = await verifierImage(base64, mimeType, emit, llm);
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
      "Le service de vérification n'a pas pu aboutir pour cette image.",
    ],
    sources: [],
    affirmations: [],
    conseil: conseilResponsabilite("insuffisant"),
    explication:
      "Nous n'avons pas pu conclure automatiquement (" +
      raison.slice(0, 160) +
      "). Par prudence, ne partagez pas cette image comme un fait avéré.",
  };
}
