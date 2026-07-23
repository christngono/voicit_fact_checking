"use client";

import { useEffect, useState } from "react";
import { useT } from "./LocaleProvider";

/**
 * Conseils de responsabilité numérique affichés en bas de page.
 * Un conseil est mis en avant et défile automatiquement (effet « à la une »),
 * avec la liste complète en dessous. Purement pédagogique.
 */
export function ConseilsResponsabilite() {
  const d = useT();
  const items = d.conseilsResp.items;
  const [actif, setActif] = useState(0);

  // Rotation automatique du conseil mis en avant (respecte prefers-reduced-motion).
  useEffect(() => {
    const reduit =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduit || items.length <= 1) return;
    const t = setInterval(() => setActif((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [items.length]);

  const enAvant = items[actif];

  return (
    <section className="mt-8">
      <h2 className="mb-1 text-sm font-semibold text-ink">{d.conseilsResp.title}</h2>
      <p className="mb-3 text-xs text-gray-500">{d.conseilsResp.sub}</p>

      {/* Conseil « à la une » qui défile automatiquement */}
      <div className="rounded-2xl border border-brand-100 bg-brand-50/70 p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-tornado text-sm font-bold text-white">
            {actif + 1}
          </span>
          <div key={actif} className="animate-reveal">
            <h3 className="text-sm font-semibold text-brand-700">{enAvant.titre}</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink/80">{enAvant.corps}</p>
          </div>
        </div>

        {/* Pastilles de navigation */}
        <div className="mt-3 flex justify-center gap-1.5">
          {items.map((it, i) => (
            <button
              key={i}
              onClick={() => setActif(i)}
              aria-label={it.titre}
              className={
                "h-1.5 rounded-full transition-all " +
                (i === actif ? "w-5 bg-brand-500" : "w-1.5 bg-brand-200 hover:bg-brand-300")
              }
            />
          ))}
        </div>
      </div>

      {/* Liste complète (toujours visible, pour ne rien manquer) */}
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map((it, i) => (
          <li
            key={i}
            className="rounded-xl border border-black/5 bg-white p-3 shadow-card"
          >
            <p className="text-[13px] font-semibold text-ink">{it.titre}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{it.corps}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
