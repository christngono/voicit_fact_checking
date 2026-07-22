"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconVerifier, IconHistorique, IconRumeurs, IconInfo } from "./Icons";
import { useT } from "./LocaleProvider";

type Item = {
  href: string;
  key: "verifier" | "historique" | "rumeurs" | "apropos";
  Icon: (p: { className?: string }) => JSX.Element;
};

/**
 * Barre de navigation basse — mobile-first, 4 éléments maximum.
 * « Vérifier » est le premier élément : toujours accessible en un tap,
 * jamais caché derrière le menu secondaire.
 */
const ITEMS: Item[] = [
  { href: "/", key: "verifier", Icon: IconVerifier },
  { href: "/historique", key: "historique", Icon: IconHistorique },
  { href: "/rumeurs", key: "rumeurs", Icon: IconRumeurs },
  { href: "/a-propos", key: "apropos", Icon: IconInfo },
];

export function BottomNav() {
  const pathname = usePathname();
  const d = useT();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto grid max-w-2xl grid-cols-4">
        {ITEMS.map(({ href, key, Icon }) => {
          const actif = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={actif ? "page" : undefined}
                className={
                  "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition " +
                  (actif ? "text-brand-500" : "text-gray-400 hover:text-ink")
                }
              >
                <Icon className="h-[22px] w-[22px]" />
                <span>{d.nav[key]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
