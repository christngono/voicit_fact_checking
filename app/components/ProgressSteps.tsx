"use client";

import type { EtapeId } from "@/lib/types";
import { useT } from "./LocaleProvider";

export interface EtapeUI {
  id: EtapeId;
  label: string;
  statut: "attente" | "en_cours" | "termine" | "ignore";
}

/**
 * Ordre canonique des étapes par module (reflète le pipeline réel).
 * Les LIBELLÉS ne sont pas ici : ils viennent du dictionnaire i18n (`d.steps`),
 * construits dans la page. Ici on ne garde que l'enchaînement des identifiants.
 */
export const ETAPE_ORDRE = {
  text: ["reception", "extraction", "affirmations", "corpus", "web", "score"],
  link: ["reception", "page", "extraction", "corpus", "web", "score"],
  image: ["reception", "extraction", "affirmations", "corpus", "web", "score"],
} as const;

export type ModuleEtapes = keyof typeof ETAPE_ORDRE;

/** Construit les étapes initiales localisées pour un module donné. */
export function construireEtapes(
  module: ModuleEtapes,
  labels: Record<string, string>
): EtapeUI[] {
  return ETAPE_ORDRE[module].map((id) => ({
    id: id as EtapeId,
    label: labels[id] ?? id,
    statut: "attente",
  }));
}

export function ProgressSteps({ etapes }: { etapes: EtapeUI[] }) {
  const d = useT();
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-card">
      <p className="mb-4 text-sm font-semibold text-ink">{d.analysing}</p>
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
