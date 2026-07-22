"use client";

import { useEffect, useState } from "react";

interface RumeurBreve {
  id: string;
  texte: string;
  verdict: string;
  dateVerification: string;
}

/** Bas d'accueil : rumeurs récemment démenties, issues du corpus. */
export function RecentRumors() {
  const [rumeurs, setRumeurs] = useState<RumeurBreve[]>([]);

  useEffect(() => {
    fetch("/api/rumors")
      .then((r) => r.json())
      .then((d) => setRumeurs(d.rumeurs ?? []))
      .catch(() => setRumeurs([]));
  }, []);

  if (rumeurs.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold text-ink">Rumeurs récemment démenties</h2>
      <ul className="space-y-2">
        {rumeurs.map((r) => (
          <li
            key={r.id}
            className="rounded-xl border border-black/5 bg-white p-3 shadow-card"
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                Faux
              </span>
              <p className="text-sm text-ink/80">{r.texte}</p>
            </div>
            <p className="mt-1 pl-1 text-[11px] text-gray-400">
              Vérifié le {r.dateVerification}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
