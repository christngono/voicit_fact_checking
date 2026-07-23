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
 * Ce que VoCit a réellement LU (image : OCR/description ; lien : titre/auteur/… ;
 * texte : traduction) + affirmations. Purement informatif : n'intervient pas dans
 * le verdict. Chaque bloc apparaît en cascade (effet « l'IA travaille »).
 */
export function ExtractedInfo({
  champs,
  affirmations,
}: {
  champs: { cle: string; valeur: string }[];
  affirmations: string[];
}) {
  const d = useT();
  const rien = champs.length === 0 && affirmations.length === 0;

  // Un délai croissant par bloc → révélation progressive.
  const delai = (i: number) => ({ animationDelay: `${i * 160}ms` });

  return (
    <Section titre={d.extraction.title}>
      <div className="space-y-3">
        {champs.map((c, i) => (
          <div key={c.cle} className="animate-reveal" style={delai(i)}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {d.extraction.champs[c.cle as keyof typeof d.extraction.champs] ?? c.cle}
            </p>
            <p
              className={
                c.cle === "ocr" || c.cle === "extrait"
                  ? "whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-ink/85"
                  : "text-sm text-ink/85"
              }
            >
              {c.cle === "fiabilite"
                ? d.result.badges[c.valeur as keyof typeof d.result.badges] ?? c.valeur
                : c.valeur}
            </p>
          </div>
        ))}

        {affirmations.length > 0 && (
          <div className="animate-reveal" style={delai(champs.length)}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {d.extraction.claimsLabel}
            </p>
            <ul className="space-y-1.5">
              {affirmations.map((a, i) => (
                <li
                  key={i}
                  className="flex animate-reveal gap-2 text-sm text-ink/85"
                  style={delai(champs.length + 1 + i)}
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {rien && <p className="text-sm text-gray-400">{d.extraction.empty}</p>}
        <p className="border-t border-black/5 pt-2 text-xs text-gray-400">{d.extraction.note}</p>
      </div>
    </Section>
  );
}

/**
 * « Comment ce score est calculé » : regroupe les preuves par sens (pour/contre/
 * neutre) et liste ce qui manque pour un score complet. Transparence : rappelle
 * que le verdict vient d'une règle déterministe, jamais d'un avis de l'IA.
 */
export function ScoreExplanation({
  composantes,
  scoreComplet,
  elementsManquants,
}: {
  composantes?: { texte: string; sens: "positif" | "negatif" | "neutre" }[];
  scoreComplet?: boolean;
  elementsManquants?: string[];
}) {
  const d = useT();
  const items = composantes ?? [];
  const pour = items.filter((c) => c.sens === "positif");
  const contre = items.filter((c) => c.sens === "negatif");
  const neutre = items.filter((c) => c.sens === "neutre");
  const manquants = elementsManquants ?? [];

  const Groupe = ({
    titre,
    couleur,
    liste,
  }: {
    titre: string;
    couleur: string;
    liste: { texte: string }[];
  }) =>
    liste.length === 0 ? null : (
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">{titre}</p>
        <ul className="space-y-1.5">
          {liste.map((c, i) => (
            <li key={i} className="flex gap-2 text-sm text-ink/85">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${couleur}`} />
              <span>{c.texte}</span>
            </li>
          ))}
        </ul>
      </div>
    );

  return (
    <Section titre={d.scoreInfo.title}>
      <p className="mb-3 text-sm leading-relaxed text-ink/75">{d.scoreInfo.intro}</p>

      <div className="space-y-3">
        <Groupe titre={d.scoreInfo.positive} couleur="bg-brand-500" liste={pour} />
        <Groupe titre={d.scoreInfo.negative} couleur="bg-accent-red" liste={contre} />
        <Groupe titre={d.scoreInfo.neutral} couleur="bg-gray-300" liste={neutre} />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span
          className={
            "rounded-full px-2.5 py-0.5 text-[11px] font-medium " +
            (scoreComplet === false
              ? "bg-accent-yellow/20 text-ink"
              : "bg-brand-50 text-brand-700")
          }
        >
          {scoreComplet === false ? d.scoreInfo.provisional : d.scoreInfo.complete}
        </span>
      </div>

      {manquants.length > 0 && (
        <div className="mt-3 rounded-lg border border-black/5 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-ink">{d.scoreInfo.missingTitle}</p>
          <p className="mt-0.5 text-xs text-gray-500">{d.scoreInfo.missingIntro}</p>
          <ul className="mt-2 space-y-1">
            {manquants.map((code) => (
              <li key={code} className="flex gap-2 text-xs text-ink/80">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                <span>
                  {d.scoreInfo.missing[code] ?? code}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
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
