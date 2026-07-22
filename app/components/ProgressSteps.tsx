"use client";

import type { EtapeId } from "@/lib/types";

export interface EtapeUI {
  id: EtapeId;
  label: string;
  statut: "attente" | "en_cours" | "termine" | "ignore";
}

/** Ordre canonique des étapes affichées (module TEXTE, reflète le pipeline réel). */
export const ETAPES_INIT: EtapeUI[] = [
  { id: "reception", label: "Réception du contenu", statut: "attente" },
  { id: "extraction", label: "Lecture et traduction", statut: "attente" },
  { id: "affirmations", label: "Identification des affirmations", statut: "attente" },
  { id: "corpus", label: "Recherche dans le corpus VoiCit", statut: "attente" },
  { id: "web", label: "Recherche de sources sur le web", statut: "attente" },
  { id: "score", label: "Calcul du score", statut: "attente" },
];

/** Étapes du module LIEN : la récupération de la page remplace la traduction. */
export const ETAPES_INIT_LIEN: EtapeUI[] = [
  { id: "reception", label: "Réception du lien", statut: "attente" },
  { id: "page", label: "Récupération de la page", statut: "attente" },
  { id: "extraction", label: "Lecture du contenu", statut: "attente" },
  { id: "corpus", label: "Recherche dans le corpus VoiCit", statut: "attente" },
  { id: "web", label: "Recherche de sources sur le web", statut: "attente" },
  { id: "score", label: "Calcul du score", statut: "attente" },
];

/** Étapes du module IMAGE : OCR + affirmation véhiculée remplacent la traduction. */
export const ETAPES_INIT_IMAGE: EtapeUI[] = [
  { id: "reception", label: "Réception de l'image", statut: "attente" },
  { id: "extraction", label: "Lecture de l'image (OCR)", statut: "attente" },
  { id: "affirmations", label: "Affirmation véhiculée", statut: "attente" },
  { id: "corpus", label: "Recherche dans le corpus VoiCit", statut: "attente" },
  { id: "web", label: "Recherche de sources sur le web", statut: "attente" },
  { id: "score", label: "Calcul du score", statut: "attente" },
];

export function ProgressSteps({ etapes }: { etapes: EtapeUI[] }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-card">
      <p className="mb-4 text-sm font-semibold text-ink">Analyse en cours…</p>
      <ol className="space-y-3">
        {etapes.map((e) => (
          <li key={e.id} className="flex items-center gap-3">
            <Puce statut={e.statut} />
            <span
              className={
                e.statut === "termine"
                  ? "text-sm text-ink"
                  : e.statut === "en_cours"
                  ? "text-sm font-medium text-brand-600"
                  : e.statut === "ignore"
                  ? "text-sm text-gray-400 line-through"
                  : "text-sm text-gray-400"
              }
            >
              {e.label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Puce({ statut }: { statut: EtapeUI["statut"] }) {
  if (statut === "termine")
    return (
      <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-[11px] text-white">
        ✓
      </span>
    );
  if (statut === "en_cours")
    return (
      <span className="h-5 w-5 animate-pulse-soft rounded-full border-2 border-brand-500 border-t-transparent" />
    );
  if (statut === "ignore")
    return <span className="grid h-5 w-5 place-items-center rounded-full bg-gray-200 text-[11px] text-gray-500">–</span>;
  return <span className="h-5 w-5 rounded-full border-2 border-gray-200" />;
}
