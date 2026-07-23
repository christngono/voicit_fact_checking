"use client";

import { useRef, useState } from "react";
import regionsGeo from "../../data/cameroon-regions.json";
import type { RegionData, RegionGeo } from "@/lib/types";
import { colorForVolume } from "./radarScale";
import { useT } from "./LocaleProvider";

/**
 * Carte SVG interactive des 10 régions du Cameroun.
 *
 * Géométrie : contours administratifs réels (ADM1), projetés en équirectangulaire
 * à échelle uniforme (data/cameroon-regions.json, généré depuis geoBoundaries).
 * viewBox fixe issu de la projection : 400 × 587.
 *
 * Chaque région est colorée selon son volume de signalements (échelle séquentielle,
 * voir radarScale.ts). Survol → surbrillance + infobulle ; clic ou Entrée/Espace →
 * sélection remontée au parent. Une région absente de `data` reste en gris neutre
 * mais demeure survolable / cliquable (pas de plantage sur données incomplètes).
 */
export const MAP_VIEWBOX = "0 0 400 587";

const GEO = regionsGeo as RegionGeo[];

type Props = {
  /** Signalements indexés par nom de région (ex. data["Littoral"]). */
  data: Record<string, RegionData>;
  selectedName: string | null;
  onSelect: (name: string) => void;
};

type Tip = { x: number; y: number; name: string; nb: number | null };

export function CameroonMap({ data, selectedName, onSelect }: Props) {
  const t = useT().radar;
  const boxRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [tip, setTip] = useState<Tip | null>(null);

  const volumes = Object.values(data).map((d) => d.nbSignalements);
  const max = volumes.length ? Math.max(...volumes) : 0;

  // Dessine les régions active / survolée en dernier pour que leur liseré passe
  // au-dessus des voisines.
  const ordered = [...GEO].sort((a, b) => rank(a.name) - rank(b.name));
  function rank(name: string) {
    if (name === selectedName) return 2;
    if (name === hovered) return 1;
    return 0;
  }

  function moveTip(e: React.MouseEvent, name: string, nb: number | null) {
    const box = boxRef.current;
    if (!box) return;
    const r = box.getBoundingClientRect();
    setTip({ x: e.clientX - r.left, y: e.clientY - r.top, name, nb });
  }

  return (
    <div ref={boxRef} className="relative">
      <svg
        viewBox={MAP_VIEWBOX}
        role="group"
        aria-label="Carte interactive des 10 régions du Cameroun, colorées selon le volume de signalements"
        className="mx-auto h-auto w-full max-w-md"
      >
        {ordered.map((r) => {
          const d = data[r.name];
          const active = r.name === selectedName;
          const hot = r.name === hovered;
          const dimmed = hovered !== null && !hot && !active;
          return (
            <path
              key={r.id}
              d={r.path}
              fill={colorForVolume(d?.nbSignalements, max)}
              stroke={active ? "#111827" : "#ffffff"}
              strokeWidth={active ? 2.4 : 1.2}
              strokeLinejoin="round"
              className="cursor-pointer outline-none transition-[opacity,filter] focus-visible:stroke-ink"
              style={{
                opacity: dimmed ? 0.82 : 1,
                filter: hot && !active ? "brightness(0.93)" : undefined,
              }}
              role="button"
              tabIndex={0}
              aria-pressed={active}
              aria-label={
                d ? `${r.name}, ${d.nbSignalements} ${t.reports}` : `${r.name}, ${t.noData}`
              }
              onMouseEnter={(e) => {
                setHovered(r.name);
                moveTip(e, r.name, d ? d.nbSignalements : null);
              }}
              onMouseMove={(e) => moveTip(e, r.name, d ? d.nbSignalements : null)}
              onMouseLeave={() => {
                setHovered(null);
                setTip(null);
              }}
              onFocus={() => setHovered(r.name)}
              onBlur={() => setHovered(null)}
              onClick={() => onSelect(r.name)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(r.name);
                }
              }}
            >
              <title>{r.name}</title>
            </path>
          );
        })}
      </svg>

      {tip && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-xs font-medium text-white shadow-lg"
          style={{ left: tip.x, top: tip.y - 8 }}
        >
          {tip.name}
          {tip.nb != null ? ` · ${tip.nb} ${t.reports}` : " · —"}
        </div>
      )}
    </div>
  );
}
