"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { DICT, type Dict, type Locale } from "@/lib/i18n/dictionary";
import { LOCALE_COOKIE } from "@/lib/i18n/cookie";

/**
 * Contexte de langue côté CLIENT.
 *
 * L'état initial vient du serveur (cookie lu dans le layout) → aucun écart
 * d'hydratation. Choisir une langue écrit le cookie et rafraîchit les
 * composants serveur (`router.refresh()`) pour qu'ils se re-rendent traduits.
 */

interface LocaleCtx {
  locale: Locale;
  /** Vrai si l'utilisateur a déjà choisi (sinon l'écran de choix s'affiche). */
  chosen: boolean;
  /** Dictionnaire localisé prêt à l'emploi. */
  d: Dict;
  setLocale: (l: Locale) => void;
}

const Ctx = createContext<LocaleCtx | null>(null);

export function LocaleProvider({
  initialLocale,
  initialChosen,
  children,
}: {
  initialLocale: Locale;
  initialChosen: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLoc] = useState<Locale>(initialLocale);
  const [chosen, setChosen] = useState<boolean>(initialChosen);

  const setLocale = useCallback(
    (l: Locale) => {
      // Cookie (lu par le serveur) + persistance locale de secours.
      document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
      try {
        localStorage.setItem(LOCALE_COOKIE, l);
      } catch {
        /* stockage indisponible : le cookie suffit. */
      }
      document.documentElement.lang = l;
      setLoc(l);
      setChosen(true);
      router.refresh(); // re-render des composants serveur dans la nouvelle langue
    },
    [router]
  );

  return (
    <Ctx.Provider value={{ locale, chosen, d: DICT[locale], setLocale }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLocale(): LocaleCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useLocale doit être utilisé dans <LocaleProvider>.");
  return c;
}

/** Raccourci : renvoie directement le dictionnaire localisé. */
export function useT(): Dict {
  return useLocale().d;
}
