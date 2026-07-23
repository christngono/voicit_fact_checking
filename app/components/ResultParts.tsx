"use client";

import type { Affirmation, Source } from "@/lib/types";
import { useT } from "./LocaleProvider";

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
  const d = useT();
  if (composantes.length === 0) return null;
  return (
    <Section titre={d.result.evidenceTitle}>
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

const BADGE_CLS: Record<string, string> = {
  fiable: "bg-brand-50 text-brand-700",
  officiel: "bg-brand-50 text-brand-700",
  frauduleux: "bg-red-50 text-red-700",
  inconnu: "bg-gray-100 text-gray-500",
};

export function SourceList({ sources }: { sources: Source[] }) {
  const d = useT();
  if (sources.length === 0) return null;
  return (
    <Section titre={d.result.sourcesTitle}>
      <ul className="space-y-3">
        {sources.map((s, i) => {
          const fiab = (s.fiabilite ?? "inconnu") as keyof typeof d.result.badges;
          const cls = BADGE_CLS[fiab] ?? BADGE_CLS.inconnu;
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
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${cls}`}>
                    {d.result.badges[fiab]}
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

const STATUT_CLS: Record<Affirmation["statut"], string> = {
  corroboree: "bg-brand-50 text-brand-700",
  contredite: "bg-red-50 text-red-700",
  non_trouvee: "bg-gray-100 text-gray-500",
  non_verifiee: "bg-gray-100 text-gray-500",
};

export function ClaimList({ affirmations }: { affirmations: Affirmation[] }) {
  const d = useT();
  if (affirmations.length === 0) return null;
  return (
    <Section titre={d.result.claimsTitle}>
      <ul className="space-y-2.5">
        {affirmations.map((a, i) => (
          <li key={i} className="flex items-start justify-between gap-3">
            <span className="text-sm text-ink/85">{a.texte}</span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUT_CLS[a.statut]}`}
            >
              {d.result.statuts[a.statut]}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/**
 * Ce que VoCit a réellement LU sur l'image (OCR + description + affirmations).
 * Purement informatif : n'intervient pas dans le verdict.
 */
export function ExtractedInfo({
  ocr,
  description,
  affirmations,
}: {
  ocr: string;
  description: string;
  affirmations: string[];
}) {
  const d = useT();
  const rien = !ocr && !description && affirmations.length === 0;
  return (
    <Section titre={d.extraction.title}>
      <div className="space-y-3">
        {ocr ? (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {d.extraction.ocrLabel}
            </p>
            <p className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-ink/85">
              {ocr}
            </p>
          </div>
        ) : null}
        {description ? (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {d.extraction.descLabel}
            </p>
            <p className="text-sm text-ink/85">{description}</p>
          </div>
        ) : null}
        {affirmations.length > 0 ? (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {d.extraction.claimsLabel}
            </p>
            <ul className="space-y-1.5">
              {affirmations.map((a, i) => (
                <li key={i} className="flex gap-2 text-sm text-ink/85">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {rien && <p className="text-sm text-gray-400">{d.extraction.empty}</p>}
        <p className="border-t border-black/5 pt-2 text-xs text-gray-400">{d.extraction.note}</p>
      </div>
    </Section>
  );
}

/**
 * Bandeau honnête quand la recherche web n'a pas pu être lancée.
 * `raison === "quota"` = crédit/quota API épuisé (message dédié).
 */
export function WebUnavailableNotice({ raison }: { raison: "quota" | "erreur" }) {
  const d = useT();
  const quota = raison === "quota";
  return (
    <div className="rounded-2xl border border-accent-yellow/50 bg-accent-yellow/10 p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-yellow text-sm text-ink">
          !
        </span>
        <div>
          <h3 className="text-sm font-semibold text-ink">
            {quota ? d.webNotice.quotaTitle : d.webNotice.errTitle}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-ink/75">
            {quota ? d.webNotice.quotaBody : d.webNotice.errBody}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AdviceBox({ conseil }: { conseil: string }) {
  const d = useT();
  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-500 text-white">
          ♻
        </span>
        <div>
          <h3 className="text-sm font-semibold text-brand-700">{d.result.adviceTitle}</h3>
          <p className="mt-1 text-sm leading-relaxed text-brand-700/90">{conseil}</p>
        </div>
      </div>
    </div>
  );
}
