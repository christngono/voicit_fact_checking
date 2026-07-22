"use client";

import type { VerifyResult } from "@/lib/types";
import { NIVEAU_UI } from "./niveau";
import { useT } from "./LocaleProvider";

/** En-tête du résultat : niveau (code couleur) + jauge de score. */
export function VerdictCard({ r }: { r: VerifyResult }) {
  const d = useT();
  const ui = NIVEAU_UI[r.niveau];
  return (
    <div className={`rounded-2xl border border-black/5 p-5 shadow-card ${ui.bg}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="grid h-11 w-11 place-items-center rounded-full text-xl font-bold text-white"
            style={{ backgroundColor: ui.couleur }}
          >
            {ui.emoji}
          </span>
          <div>
            <p className={`text-lg font-extrabold ${ui.texte}`}>{d.niveaux[r.niveau]}</p>
            {r.origine === "memoire" && (
              <p className="text-xs text-gray-500">
                {d.result.instantCorpus}
                {r.dateVerification ? ` · ${d.result.verifiedOn} ${r.dateVerification}` : ""}
              </p>
            )}
            {r.origine === "recherche_web" && (
              <p className="text-xs text-gray-500">{d.result.verifiedWeb}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold" style={{ color: ui.couleur }}>
            {r.score}
            <span className="text-sm font-medium text-gray-400">/100</span>
          </p>
          <p className="text-[11px] text-gray-500">{d.result.scoreLabel}</p>
        </div>
      </div>

      {/* Jauge */}
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-black/5">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${r.score}%`, backgroundColor: ui.couleur }}
        />
      </div>

      {r.explication && (
        <p className="mt-4 text-sm leading-relaxed text-ink/80">{r.explication}</p>
      )}
    </div>
  );
}
