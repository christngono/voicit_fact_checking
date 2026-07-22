import { cookies } from "next/headers";
import { isLocale, type Locale } from "./dictionary";
import { LOCALE_COOKIE } from "./cookie";

/**
 * Lecture de la langue côté SERVEUR (composants serveur, layout).
 * Ce fichier importe `next/headers` : ne JAMAIS l'importer dans un composant
 * client. Le client passe par `LocaleProvider` / `useT`.
 */

/** Langue courante (par défaut « fr » si aucun choix mémorisé). */
export function readLocale(): Locale {
  const v = cookies().get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : "fr";
}

/** Vrai si l'utilisateur a déjà choisi une langue (cookie présent et valide). */
export function localeChoisie(): boolean {
  return isLocale(cookies().get(LOCALE_COOKIE)?.value);
}
