"use client";

import { useEffect } from "react";
import type { HistoriquePoint, RegionData } from "@/lib/types";
import { IconClose } from "./Icons";
import { useT } from "./LocaleProvider";

/**
 * Détail d'une région sélectionnée sur le Radar.
 *
 * Deux présentations selon l'écran (même contenu) :
 *  - `variant="side"`  : panneau latéral in-flow (desktop).
 *  - `variant="drawer"`: tiroir plein largeur qui remonte du bas + fond assombri
 *    (mobile). Fermable par le bouton ✕, un clic sur le fond, ou la touche Échap.
 */
type Props = {
  region: RegionData;
  onClose: () => void;
  variant: "side" | "drawer";
};

/** Couleur du type dominant. Rouge = escroquerie, orange = désinformation. */
function typeColor(type: string): string {
  switch (type) {
    case "escroquerie":
      return "#E23B26";
    case "désinformation":
      return "#F5871F";
    case "usurpation":
      return "#B45309";
    default:
      return "#6B7280";
  }
}

/** ISO "YYYY-MM-DD" → "JJ/MM". */
function jjmm(iso: string): string {
  const [, m, d] = iso.split("-");
  return m && d ? `${d}/${m}` : iso;
}

function PanelContent({ region, onClose }: { region: RegionData; onClose: () => void }) {
  const t = useT().radar;
  const color = typeColor(region.typeDominant);
  const typeLabel =
    t.types[region.typeDominant] ??
    region.typeDominant.charAt(0).toUpperCase() + region.typeDominant.slice(1);

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold leading-tight text-ink">{region.region}</h3>
          {region.derniereMaj && (
            <p className="mt-0.5 text-xs text-gray-500">
              {t.updatedOn} {jjmm(region.derniereMaj)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.close}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-ink"
        >
          <IconClose className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span className="text-3xl font-extrabold leading-none text-ink">
          {region.nbSignalements}
        </span>
        <span className="text-xs leading-tight text-gray-500">
          {t.reports}
          <br />
          {t.reportsRecensed}
        </span>
        <span
          className="ml-auto rounded-full px-2.5 py-1 text-xs font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          {typeLabel}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          {t.themeLabel}
        </p>
        <p className="mt-0.5 text-sm text-ink">{region.themePrincipal}</p>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
          {t.evolutionTitle}
        </p>
        <MiniBars points={region.historique} color={color} />
      </div>
    </>
  );
}

/** Mini-graphique en barres (SVG natif) de l'évolution temporelle. */
function MiniBars({ points, color }: { points: HistoriquePoint[]; color: string }) {
  const t = useT().radar;

  if (!points || points.length === 0) {
    return <p className="text-xs text-gray-400">{t.noHistory}</p>;
  }

  const slot = 46; // largeur d'un créneau (barre + marge)
  const barW = 24;
  const top = 16; // place pour l'étiquette de valeur
  const plot = 64; // hauteur de la zone des barres
  const bottom = 18; // place pour l'étiquette de date
  const W = points.length * slot;
  const H = top + plot + bottom;
  const max = Math.max(1, ...points.map((p) => p.nb));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`${t.evolutionTitle} : ${points.map((p) => `${jjmm(p.date)} ${p.nb}`).join(", ")}`}
      className="h-24 w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <line x1={0} y1={top + plot} x2={W} y2={top + plot} stroke="#E5E7EB" strokeWidth={1} />
      {points.map((p, i) => {
        const h = Math.round((p.nb / max) * plot);
        const x = i * slot + (slot - barW) / 2;
        const y = top + plot - h;
        const recent = i === points.length - 1;
        return (
          <g key={p.date}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(2, h)}
              rx={3}
              fill={color}
              opacity={recent ? 1 : 0.55}
            />
            <text
              x={x + barW / 2}
              y={y - 4}
              textAnchor="middle"
              className="fill-ink"
              style={{ fontSize: 11, fontWeight: 700 }}
            >
              {p.nb}
            </text>
            <text
              x={x + barW / 2}
              y={H - 5}
              textAnchor="middle"
              className="fill-gray-400"
              style={{ fontSize: 10 }}
            >
              {jjmm(p.date)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function RegionDetailPanel({ region, onClose, variant }: Props) {
  // Échap ferme le panneau (utile surtout pour le tiroir mobile).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (variant === "side") {
    return (
      <aside className="animate-reveal rounded-2xl border border-black/5 bg-white p-4 shadow-card md:sticky md:top-4">
        <PanelContent region={region} onClose={onClose} />
      </aside>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" aria-hidden="true" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={region.region}
        className="animate-drawer fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-2xl"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300" aria-hidden="true" />
        <PanelContent region={region} onClose={onClose} />
      </aside>
    </>
  );
}
