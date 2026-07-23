"use client";

import { useLocale } from "./LocaleProvider";
import type { Locale } from "@/lib/i18n/dictionary";

/**
 * Sélecteur de langue compact du header — accessible à tout moment.
 * Bascule FR ⇄ EN (écrit le cookie + rafraîchit les composants serveur).
 */
export function LangSwitch() {
  const { locale, setLocale } = useLocale();

  return (
    <div
      role="group"
      aria-label="Langue / Language"
      className="flex items-center rounded-full border border-black/5 bg-gray-100 p-0.5 text-xs font-semibold"
    >
      {(["fr", "en"] as Locale[]).map((l) => {
        const actif = locale === l;
        return (
          <button
            key={l}
            onClick={() => !actif && setLocale(l)}
            aria-pressed={actif}
            className={
              "rounded-full px-2.5 py-1 uppercase transition " +
              (actif ? "bg-white text-brand-600 shadow-sm" : "text-gray-400 hover:text-ink")
            }
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
