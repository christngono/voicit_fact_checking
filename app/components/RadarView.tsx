"use client";

import { useMemo, useState } from "react";
import { CameroonMap } from "./CameroonMap";
import { RegionDetailPanel } from "./RegionDetailPanel";
import { colorForVolume, MISSING_COLOR, RAMP_CSS } from "./radarScale";
import { useT } from "./LocaleProvider";
import radarData from "../../data/radar.json";
import type { RegionData } from "@/lib/types";

/**
 * Assemble le Radar côté client : bandeau « démonstration », Top 3 des régions,
 * carte interactive, légende, et panneau de détail (latéral desktop / tiroir
 * mobile). Détient la région sélectionnée, partagée entre le Top 3, la carte et
 * le panneau.
 */
export function RadarView() {
  const t = useT().radar;
  const [selected, setSelected] = useState<string | null>(null);

  const all = radarData as RegionData[];
  const byName = useMemo<Record<string, RegionData>>(
    () => Object.fromEntries(all.map((r) => [r.region, r])),
    [all]
  );
  const globalMax = useMemo(
    () => (all.length ? Math.max(...all.map((r) => r.nbSignalements)) : 0),
    [all]
  );
  const top3 = useMemo(
    () => [...all].sort((a, b) => b.nbSignalements - a.nbSignalements).slice(0, 3),
    [all]
  );

  const sel = selected ? byName[selected] ?? null : null;
  const close = () => setSelected(null);

  return (
    <div>
      {/* Bandeau « données de démonstration » */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-accent-yellow/40 bg-accent-yellow/15 px-3 py-2">
        <span className="rounded-full bg-accent-yellow px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">
          {t.demoBanner}
        </span>
        <span className="text-xs text-ink/70">{t.demoNote}</span>
      </div>

      {/* Top 3 des régions les plus actives */}
      <section className="mb-4">
        <h2 className="mb-2 text-sm font-semibold text-ink">{t.top3Title}</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {top3.map((r, i) => (
            <button
              key={r.region}
              type="button"
              onClick={() => setSelected(r.region)}
              aria-pressed={selected === r.region}
              className={
                "flex items-center gap-3 rounded-xl border bg-white p-3 text-left shadow-card transition hover:border-brand-100 " +
                (selected === r.region ? "border-ink" : "border-black/5")
              }
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-white">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">{r.region}</span>
                <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${Math.round((r.nbSignalements / (globalMax || 1)) * 100)}%`,
                      backgroundColor: colorForVolume(r.nbSignalements, globalMax),
                    }}
                  />
                </span>
              </span>
              <span className="shrink-0 text-sm font-bold text-ink">{r.nbSignalements}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Carte + panneau */}
      <div className="md:grid md:grid-cols-[1fr_320px] md:items-start md:gap-5">
        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-card">
          <CameroonMap data={byName} selectedName={selected} onSelect={setSelected} />

          {/* Légende de l'échelle de couleur */}
          <div className="mt-3">
            <p className="mb-1 text-[11px] font-semibold text-gray-500">{t.legendTitle}</p>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400">{t.legendLess}</span>
              <span
                className="h-2.5 flex-1 rounded-full"
                style={{ background: RAMP_CSS }}
                aria-hidden="true"
              />
              <span className="text-[11px] text-gray-400">{t.legendMore}</span>
              <span className="ml-2 flex items-center gap-1">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: MISSING_COLOR }}
                  aria-hidden="true"
                />
                <span className="text-[11px] text-gray-400">{t.legendNoData}</span>
              </span>
            </div>
          </div>

          <p className="mt-3 text-center text-[11px] text-gray-400">{t.credit}</p>
        </div>

        {/* Colonne de détail — desktop */}
        <div className="mt-4 hidden md:mt-0 md:block">
          {sel ? (
            <RegionDetailPanel region={sel} onClose={close} variant="side" />
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">
              {t.hint}
            </div>
          )}
        </div>
      </div>

      {/* Tiroir de détail — mobile */}
      {sel && (
        <div className="md:hidden">
          <RegionDetailPanel region={sel} onClose={close} variant="drawer" />
        </div>
      )}
    </div>
  );
}
