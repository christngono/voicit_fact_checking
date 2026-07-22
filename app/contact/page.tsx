import type { Metadata } from "next";
import { PageIntro } from "../components/PageIntro";

export const metadata: Metadata = {
  title: "Contact / Partenaires — VoCit",
  description:
    "Médias, institutions, opérateurs et plateformes : intégrez la vérification VoCit via nos API. Contactez l'équipe VoCit.",
};

const OFFRES = [
  {
    titre: "Médias & rédactions",
    desc: "Vérifiez rumeurs et contenus viraux avant publication, avec sources et verdict explicable.",
  },
  {
    titre: "Institutions & administrations",
    desc: "Démentez les faux communiqués et arnaques usurpant votre identité, à grande échelle.",
  },
  {
    titre: "Opérateurs & plateformes",
    desc: "Intégrez la vérification de contenus, de liens et de numéros via l'API VoCit.",
  },
];

export default function ContactPage() {
  return (
    <div>
      <PageIntro
        titre="Contact / Partenaires"
        sous="VoCit s'adresse aussi aux acteurs professionnels. Notre corpus et notre moteur de vérification sont accessibles via API."
      />

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          {OFFRES.map((o) => (
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
          <h2 className="text-base font-extrabold tracking-tight text-ink">Nous contacter</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink/80">
            Vous représentez un média, une institution, un opérateur ou une plateforme
            intéressés par la vérification VoCit ou par un accès API ? Écrivez-nous.
          </p>
          <a
            href="mailto:partenaires@voicit.cm?subject=Partenariat%20VoCit"
            className="mt-4 inline-block rounded-xl bg-tornado px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
          >
            partenaires@voicit.cm
          </a>
          <p className="mt-3 text-xs text-gray-400">
            VoCit vérifie des faits, jamais des opinions. Aucun contenu n'est supprimé :
            nous informons et nous instruisons.
          </p>
        </div>
      </div>
    </div>
  );
}
