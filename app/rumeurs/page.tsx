import fs from "node:fs";
import path from "node:path";
import type { Rumeur } from "@/lib/types";
import { NIVEAU_UI } from "../components/niveau";
import { PageIntro } from "../components/PageIntro";

export const runtime = "nodejs";

/** Liste publique des cas déjà présents dans le corpus VoiCit (lecture seule). */
function chargerCorpus(): Rumeur[] {
  try {
    const fichier = path.join(process.cwd(), "data", "rumeurs.json");
    const brut = fs.readFileSync(fichier, "utf-8");
    const data = JSON.parse(brut) as Rumeur[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default function RumeursPage() {
  const rumeurs = chargerCorpus().sort((a, b) =>
    (b.dateVerification ?? "").localeCompare(a.dateVerification ?? "")
  );

  return (
    <div>
      <PageIntro
        titre="Rumeurs"
        sous="Le corpus public de VoiCit : des cas déjà vérifiés, consultables sans rien soumettre. Une rumeur démentie une fois est démentie pour tout le monde."
      />

      {rumeurs.length === 0 ? (
        <p className="rounded-2xl border border-black/5 bg-white p-8 text-center text-sm text-gray-500 shadow-card">
          Le corpus est momentanément indisponible.
        </p>
      ) : (
        <ul className="space-y-3">
          {rumeurs.map((r) => {
            const ui = NIVEAU_UI[r.verdict];
            return (
              <li
                key={r.id}
                className="rounded-2xl border border-black/5 bg-white p-4 shadow-card"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
                    style={{ backgroundColor: ui.couleur }}
                  >
                    {ui.label}
                  </span>
                  {r.dateVerification && (
                    <span className="text-[11px] text-gray-400">
                      Vérifié le {r.dateVerification}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm font-medium text-ink">{r.texte}</p>
                {r.explication && (
                  <p className="mt-1.5 text-sm text-ink/70">{r.explication}</p>
                )}
                {r.sources?.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {r.sources.map((s, i) => (
                      <a
                        key={i}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-full items-center gap-1 truncate rounded-lg bg-gray-50 px-2 py-1 text-[11px] font-medium text-brand-600 hover:bg-gray-100"
                      >
                        <span className="truncate">{s.titre}</span>
                      </a>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
