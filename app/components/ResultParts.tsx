"use client";

import type { Affirmation, Source } from "@/lib/types";

/** Bloc générique de section de résultat. */
function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-card">
      <h3 className="mb-3 text-sm font-semibold text-ink">{titre}</h3>
      {children}
    </div>
  );
}

/** Les composantes du verdict = preuves lisibles présentées à l'utilisateur. */
export function EvidenceList({ composantes }: { composantes: string[] }) {
  if (composantes.length === 0) return null;
  return (
    <Section titre="Ce que nous avons constaté">
      <ul className="space-y-2">
        {composantes.map((c, i) => (
          <li key={i} className="flex gap-2 text-sm text-ink/85">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
            <span>{c}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

const BADGE: Record<string, { label: string; cls: string }> = {
  fiable: { label: "source fiable", cls: "bg-brand-50 text-brand-700" },
  officiel: { label: "site officiel", cls: "bg-brand-50 text-brand-700" },
  frauduleux: { label: "domaine frauduleux", cls: "bg-red-50 text-red-700" },
  inconnu: { label: "à vérifier", cls: "bg-gray-100 text-gray-500" },
};

export function SourceList({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null;
  return (
    <Section titre="Sources consultées">
      <ul className="space-y-3">
        {sources.map((s, i) => {
          const b = BADGE[s.fiabilite ?? "inconnu"] ?? BADGE.inconnu;
          return (
            <li key={i}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-black/5 p-3 transition hover:bg-gray-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="line-clamp-2 text-sm font-medium text-brand-600">
                    {s.titre}
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${b.cls}`}>
                    {b.label}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-gray-400">{s.url}</p>
                {s.date && <p className="text-[11px] text-gray-400">{s.date}</p>}
              </a>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

const STATUT_UI: Record<Affirmation["statut"], { label: string; cls: string }> = {
  corroboree: { label: "Corroborée", cls: "bg-brand-50 text-brand-700" },
  contredite: { label: "Contredite", cls: "bg-red-50 text-red-700" },
  non_trouvee: { label: "Non trouvée", cls: "bg-gray-100 text-gray-500" },
  non_verifiee: { label: "Non vérifiée", cls: "bg-gray-100 text-gray-500" },
};

export function ClaimList({ affirmations }: { affirmations: Affirmation[] }) {
  if (affirmations.length === 0) return null;
  return (
    <Section titre="Affirmations examinées">
      <ul className="space-y-2.5">
        {affirmations.map((a, i) => {
          const s = STATUT_UI[a.statut];
          return (
            <li key={i} className="flex items-start justify-between gap-3">
              <span className="text-sm text-ink/85">{a.texte}</span>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${s.cls}`}>
                {s.label}
              </span>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

export function AdviceBox({ conseil }: { conseil: string }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-500 text-white">
          ♻
        </span>
        <div>
          <h3 className="text-sm font-semibold text-brand-700">
            Conseil de responsabilité numérique
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-brand-700/90">{conseil}</p>
        </div>
      </div>
    </div>
  );
}
