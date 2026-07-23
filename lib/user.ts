/**
 * Préférences utilisateur locales (numéro saisi à l'onboarding).
 * Stockage 100 % CLIENT (localStorage) — rien n'est envoyé au serveur, aucun compte.
 */
const PHONE_KEY = "voicit:phone";

export function lireNumero(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(PHONE_KEY);
  } catch {
    return null;
  }
}

export function enregistrerNumero(numero: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PHONE_KEY, numero);
  } catch {
    /* stockage indisponible : on ignore silencieusement. */
  }
}
