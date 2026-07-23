"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IconPlus, IconHistorique, IconInfo, IconFlag, IconMail } from "./Icons";
import { useT } from "./LocaleProvider";

type Entree = {
  href: string;
  key: "historique" | "apropos" | "contester" | "contact";
  descKey: "historiqueDesc" | "aproposDesc" | "contesterDesc" | "contactDesc";
  Icon: (p: { className?: string }) => JSX.Element;
  bientot?: boolean;
};

/**
 * Menu secondaire (coin haut droit). Regroupe les fonctions moins fréquentes,
 * SANS jamais y cacher « Vérifier » (qui reste dans la barre basse).
 */
const ENTREES: Entree[] = [
  { href: "/historique", key: "historique", descKey: "historiqueDesc", Icon: IconHistorique },
  { href: "/a-propos", key: "apropos", descKey: "aproposDesc", Icon: IconInfo },
  { href: "/contester", key: "contester", descKey: "contesterDesc", Icon: IconFlag },
  { href: "/contact", key: "contact", descKey: "contactDesc", Icon: IconMail },
];

export function TopMenu() {
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const d = useT();

  // Ferme le menu à chaque changement de page.
  useEffect(() => setOuvert(false), [pathname]);

  // Ferme au clic extérieur / touche Échap.
  useEffect(() => {
    if (!ouvert) return;
    function surClic(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOuvert(false);
    }
    function surTouche(e: KeyboardEvent) {
      if (e.key === "Escape") setOuvert(false);
    }
    document.addEventListener("mousedown", surClic);
    document.addEventListener("keydown", surTouche);
    return () => {
      document.removeEventListener("mousedown", surClic);
      document.removeEventListener("keydown", surTouche);
    };
  }, [ouvert]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={ouvert}
        aria-label={d.menu.more}
        className="grid h-9 w-9 place-items-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-ink"
      >
        <IconPlus />
      </button>

      {ouvert && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-40 w-72 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-card"
        >
          {ENTREES.map(({ href, key, descKey, Icon, bientot }) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              className="flex items-start gap-3 px-4 py-3 transition hover:bg-gray-50"
            >
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                  {d.menu[key]}
                  {bientot && (
                    <span className="rounded-full bg-accent-yellow px-1.5 py-0.5 text-[9px] font-bold text-ink">
                      {d.home.soon}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-xs text-gray-500">{d.menu[descKey]}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
