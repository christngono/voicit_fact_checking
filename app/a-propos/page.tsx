import type { Metadata } from "next";
import { TornadoMark } from "../components/Logo";
import { readLocale } from "@/lib/i18n/server";
import { getDict } from "@/lib/i18n/dictionary";

export const metadata: Metadata = {
  title: "À propos de VoCit — Vérifier avant de partager",
  description:
    "VoCit (Voice of the Citizen) aide chaque citoyen camerounais à vérifier un contenu douteux avant de le croire ou de le partager. L'IA ne juge pas : le verdict vient des preuves.",
};

/** Petit titre de section, homogène sur toute la page. */
function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-card">
      <h2 className="mb-2 text-base font-extrabold tracking-tight text-ink">{titre}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-ink/80">{children}</div>
    </section>
  );
}

const EMOJIS = ["🗣️", "💸", "🤖"];

export default function AProposPage() {
  const a = getDict(readLocale()).apropos;
  return (
    <div className="space-y-4">
      {/* Bandeau d'introduction — signature visuelle de la marque */}
      <header className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-card">
        <div className="h-1.5 w-full bg-tornado" />
        <div className="p-6">
          <div className="mb-3 flex items-center gap-3">
            <TornadoMark size={40} />
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">{a.title}</h1>
          </div>
          <p className="text-sm leading-relaxed text-ink/80">{a.intro}</p>
        </div>
      </header>

      <Section titre={a.whyTitle}>
        {a.whyBody.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </Section>

      <Section titre={a.howTitle}>
        <p>{a.howIntro}</p>
        <ul className="space-y-2 pl-1">
          {a.howList.map((t, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Citation mise en avant — le principe fondateur */}
      <blockquote className="relative overflow-hidden rounded-2xl bg-tornado p-6 text-white shadow-card">
        <span
          aria-hidden
          className="pointer-events-none absolute -left-1 -top-4 select-none text-8xl font-black leading-none text-white/20"
        >
          “
        </span>
        <p className="relative text-base font-semibold leading-relaxed">{a.quote}</p>
      </blockquote>

      <Section titre={a.instructTitle}>
        {a.instructBody.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </Section>

      <Section titre={a.protectTitle}>
        <div className="grid gap-3 sm:grid-cols-3">
          {a.protect.map((p, i) => (
            <div key={p.titre} className="rounded-xl bg-gray-50 p-3">
              <div className="text-2xl">{EMOJIS[i] ?? "🛡️"}</div>
              <p className="mt-1 text-sm font-semibold text-ink">{p.titre}</p>
              <p className="mt-0.5 text-xs text-ink/70">{p.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section titre={a.memoryTitle}>
        <p>{a.memoryBody}</p>
      </Section>

      <Section titre={a.engageTitle}>
        <p>{a.engageBody}</p>
      </Section>

      <p className="py-2 text-center text-sm font-semibold italic text-brand-600">{a.closing}</p>
    </div>
  );
}
