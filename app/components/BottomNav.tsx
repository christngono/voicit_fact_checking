"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconVerifier, IconRadar, IconConseils, IconRumeurs } from "./Icons";
import { useT } from "./LocaleProvider";

type Item = {
  href: string;
  key: "verifier" | "radar" | "conseils" | "rumeurs";
  Icon: (p: { className?: string }) => JSX.Element;
};

/**
 * Barre de navigation basse — mobile-first, 4 éléments maximum.
 * « Vérifier » est le premier élément : toujours accessible en un tap,
 * jamais caché derrière le menu secondaire.
 */
const ITEMS: Item[] = [
  { href: "/", key: "verifier", Icon: IconVerifier },
  { href: "/radar", key: "radar", Icon: IconRadar },
  { href: "/conseils", key: "conseils", Icon: IconConseils },
  { href: "/rumeurs", key: "rumeurs", Icon: IconRumeurs },
];

export function BottomNav() {
  const pathname = usePathname();
  const d = useT();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-30 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      {/* Liseré signature : le dégradé de la tornade, rappel de la marque */}
      <div className="h-[3px] w-full bg-tornado" />
      <ul className="mx-auto grid max-w-2xl grid-cols-4">
        {ITEMS.map(({ href, key, Icon }) => {
          const actif = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={actif ? "page" : undefined}
                className={
                  "flex flex-col items-center gap-1 pb-2 pt-1.5 text-[11px] font-medium transition " +
                  (actif ? "text-ink" : "text-gray-400 hover:text-ink")
                }
              >
                <span
                  className={
                    "grid h-9 w-9 place-items-center rounded-full transition " +
                    (actif
                      ? "bg-accent-yellow text-ink shadow-sm ring-1 ring-black/5"
                      : "text-gray-400")
                  }
                >
                  <Icon className="h-[22px] w-[22px]" />
                </span>
                <span>{d.nav[key]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
