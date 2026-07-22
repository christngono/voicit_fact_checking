import type { Metadata } from "next";
import { TornadoMark } from "../components/Logo";

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

const PROTECTIONS = [
  {
    emoji: "🗣️",
    titre: "La désinformation",
    desc: "Rumeurs, photos et vidéos sorties de leur contexte, faux communiqués.",
  },
  {
    emoji: "💸",
    titre: "Les escroqueries numériques",
    desc: "Faux dépôts Mobile Money, phishing, usurpations d'identité.",
  },
  {
    emoji: "🤖",
    titre: "Les dérives de l'IA",
    desc: "Contenus trompeurs générés ou manipulés par intelligence artificielle.",
  },
];

export default function AProposPage() {
  return (
    <div className="space-y-4">
      {/* Bandeau d'introduction — signature visuelle de la marque */}
      <header className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-card">
        <div className="h-1.5 w-full bg-tornado" />
        <div className="p-6">
          <div className="mb-3 flex items-center gap-3">
            <TornadoMark size={40} />
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">
              À propos de VoCit
            </h1>
          </div>
          <p className="text-sm leading-relaxed text-ink/80">
            <strong className="font-semibold text-ink">VoCit (Voice of the Citizen)</strong>{" "}
            est une plateforme camerounaise qui aide chaque citoyen à vérifier un contenu
            douteux — texte, image, lien ou numéro de téléphone — avant de le croire ou de
            le partager.
          </p>
        </div>
      </header>

      <Section titre="Pourquoi VoCit existe">
        <p>
          Le cyberespace camerounais est traversé chaque jour par des rumeurs, des contenus
          sortis de leur contexte, des images et des vidéos parfois générées par intelligence
          artificielle, et des tentatives d'escroquerie numérique. Beaucoup de citoyens
          veulent vérifier avant de partager, mais ils n'ont pas d'outil simple, rapide, et
          adapté à leur réalité pour le faire.
        </p>
        <p>
          VoCit répond à ce besoin. Vous soumettez un contenu, VoCit vous répond en quelques
          secondes.
        </p>
      </Section>

      <Section titre="Comment ça fonctionne">
        <p>VoCit ne dit jamais simplement « vrai » ou « faux ». Il vous montre les preuves :</p>
        <ul className="space-y-2 pl-1">
          {[
            "Le contenu est d'abord comparé à notre corpus de rumeurs déjà vérifiées. S'il y correspond, la réponse est instantanée.",
            "S'il est nouveau, VoCit recherche des sources fiables sur le web pour établir les faits.",
            "Un score est calculé à partir de ces preuves — jamais deviné par une intelligence artificielle.",
            "Vous recevez le verdict, les sources consultées, et un conseil pour décider en connaissance de cause.",
          ].map((t, i) => (
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
        <p className="relative text-base font-semibold leading-relaxed">
          Notre principe : l'IA ne juge pas. Elle traduit, elle cherche, elle explique.
          Le verdict vient des preuves.
        </p>
      </blockquote>

      <Section titre="VoCit vérifie, mais aussi instruit">
        <p>
          VoCit ne se limite pas à répondre « vrai » ou « faux ». À chaque vérification, la
          plateforme explique pourquoi un contenu est fiable ou non, quels signes permettent
          de le reconnaître, et quels réflexes adopter avant de partager. L'objectif est que
          chaque utilisateur devienne, avec le temps, plus autonome pour reconnaître seul une
          désinformation, sans dépendre uniquement de l'outil.
        </p>
        <p>
          C'est pour cela que VoCit accompagne aussi les citoyens, notamment les plus jeunes,
          à travers des contenus pédagogiques et des campagnes de sensibilisation à l'esprit
          critique et à l'usage responsable du numérique.
        </p>
      </Section>

      <Section titre="Ce que VoCit protège">
        <div className="grid gap-3 sm:grid-cols-3">
          {PROTECTIONS.map((p) => (
            <div key={p.titre} className="rounded-xl bg-gray-50 p-3">
              <div className="text-2xl">{p.emoji}</div>
              <p className="mt-1 text-sm font-semibold text-ink">{p.titre}</p>
              <p className="mt-0.5 text-xs text-ink/70">{p.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section titre="Une mémoire collective">
        <p>
          Chaque contenu vérifié enrichit un corpus commun, hébergé au Cameroun. Une rumeur
          démentie une fois est démentie pour toujours, pour tout le monde. C'est cette
          mémoire partagée qui rend VoCit plus utile chaque jour.
        </p>
      </Section>

      <Section titre="Notre engagement">
        <p>
          VoCit vérifie des faits, jamais des opinions. Nous ne supprimons aucun contenu :
          nous informons et nous instruisons. Chaque verdict peut être contesté, et les cas
          ambigus sont examinés par des vérificateurs humains.
        </p>
      </Section>

      <p className="py-2 text-center text-sm font-semibold italic text-brand-600">
        Vérifier avant de partager.
      </p>
    </div>
  );
}
