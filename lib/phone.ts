/**
 * Normalisation des numéros camerounais — CODE pur, aucun LLM, aucune recherche.
 * +237 6XX…, 6XX…, 237 6XX…, 00237 6XX… doivent pointer vers la même entrée.
 */
export function normaliserNumero(input: string): string | null {
  // Ne garder que les chiffres (et un éventuel + de tête).
  let n = input.trim().replace(/[\s.\-()]/g, "");
  n = n.replace(/^\+/, "");
  n = n.replace(/^00/, ""); // 00237… → 237…

  if (n.startsWith("237")) n = n.slice(3);
  // À ce stade on attend 9 chiffres commençant par 6 (mobile camerounais).
  if (!/^6\d{8}$/.test(n)) return null;
  return "+237" + n;
}

/** Vrai si l'entrée ressemble à un numéro de téléphone (pour router le module). */
export function ressembleANumero(input: string): boolean {
  const digits = input.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 13;
}
