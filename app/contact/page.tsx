import type { Metadata } from "next";
import { PageIntro } from "../components/PageIntro";
import { readLocale } from "@/lib/i18n/server";
import { getDict } from "@/lib/i18n/dictionary";

export const metadata: Metadata = {
  title: "Contact / Partenaires — VoCit",
  description:
    "Médias, institutions, opérateurs et plateformes : intégrez la vérification VoCit via nos API. Contactez l'équipe VoCit.",
};

export default function ContactPage() {
  const d = getDict(readLocale()).contact;
  return (
    <div>
      <PageIntro titre={d.title} sous={d.sub} />

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          {d.offers.map((o) => (
            <div
              key={o.titre}
              className="rounded-2xl border border-black/5 bg-white p-4 shadow-card"
            >
              <p className="text-sm font-semibold text-ink">{o.titre}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink/70">{o.desc}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-card">
          <h2 className="text-base font-extrabold tracking-tight text-ink">{d.contactTitle}</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink/80">{d.contactBody}</p>
          <a
            href="mailto:partenaires@vocit.cm?subject=Partenariat%20VoCit"
            className="mt-4 inline-block rounded-xl bg-tornado px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
          >
            partenaires@vocit.cm
          </a>
          <p className="mt-3 text-xs text-gray-400">{d.note}</p>
        </div>
      </div>
    </div>
  );
}
