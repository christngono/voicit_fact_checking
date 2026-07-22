import type { Niveau } from "@/lib/types";

/** Correspondances niveau → couleur / libellé, partagées par les composants d'UI. */
export const NIVEAU_UI: Record<
  Niveau,
  { label: string; couleur: string; bg: string; texte: string; emoji: string }
> = {
  fiable: {
    label: "Fiable",
    couleur: "#0E7A3B",
    bg: "bg-brand-50",
    texte: "text-brand-700",
    emoji: "✓",
  },
  douteux: {
    label: "Douteux",
    couleur: "#F5871F",
    bg: "bg-orange-50",
    texte: "text-orange-700",
    emoji: "!",
  },
  faux: {
    label: "Faux",
    couleur: "#E23B26",
    bg: "bg-red-50",
    texte: "text-red-700",
    emoji: "✕",
  },
  insuffisant: {
    label: "Éléments insuffisants",
    couleur: "#6B7280",
    bg: "bg-gray-100",
    texte: "text-gray-600",
    emoji: "?",
  },
};
