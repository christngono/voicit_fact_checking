"use client";

import { useLocale } from "./LocaleProvider";
import { TornadoMark } from "./Logo";

/**
 * Écran de choix de la langue, à l'ouverture (après le splash).
 *
 * Ne s'affiche que si aucune langue n'a encore été choisie (cookie absent).
 * z-index sous le splash (z-100) : le splash joue d'abord, puis ce choix
 * apparaît. Volontairement BILINGUE (indépendant de la langue courante).
 */
export function LanguageGate() {
  const { chosen, setLocale } = useLocale();
  if (chosen) return null;

  return (
    <div className="fixed inset-0 z-[95] flex flex-col items-center justify-center bg-white px-6">
      <TornadoMark size={64} />
      <span className="mt-3 text-2xl font-extrabold tracking-tight text-ink">
        Vo<span className="text-brand-500">Cit</span>
      </span>

      <h1 className="mt-8 text-center text-lg font-bold text-ink">
        Choisissez votre langue
        <span className="mt-0.5 block text-sm font-medium text-gray-400">
          Choose your language
        </span>
      </h1>

      <div className="mt-7 flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={() => setLocale("fr")}
          className="flex items-center justify-center gap-2 rounded-xl bg-tornado py-3.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
        >
          <span aria-hidden>🇫🇷</span> Français
        </button>
        <button
          onClick={() => setLocale("en")}
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-semibold text-ink transition hover:bg-gray-50"
        >
          <span aria-hidden>🇬🇧</span> English
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-gray-400">
        Vérifier avant de partager · Check before you share
      </p>
    </div>
  );
}
