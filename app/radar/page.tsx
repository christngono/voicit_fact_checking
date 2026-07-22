import Link from "next/link";
import type { Metadata } from "next";
import { PageIntro } from "../components/PageIntro";
import { IconRadar } from "../components/Icons";

export const metadata: Metadata = {
  title: "Radar — VoCit",
  description:
    "Radar VoCit : cartographie de circulation des rumeurs dans le cyberespace camerounais. Bientôt disponible.",
};

export default function RadarPage() {
  return (
    <div>
      <PageIntro
        titre="Radar"
        sous="Cartographie de la circulation des rumeurs dans le cyberespace camerounais."
      />

      <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-card">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-600">
          <IconRadar className="h-8 w-8" />
        </span>
        <p className="mt-4 inline-block rounded-full bg-accent-yellow px-3 py-1 text-xs font-bold text-ink">
          Bientôt disponible
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink/70">
          Le Radar montrera comment une rumeur circule : où elle apparaît, comment elle se
          propage, et à quel moment elle a été démentie. Ce module est en préparation.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-tornado px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
        >
          Vérifier un contenu
        </Link>
      </div>
    </div>
  );
}
