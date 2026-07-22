/**
 * Garde-fou de durée : renvoie `fallback` si la promesse dépasse `ms`.
 *
 * Contrainte Vercel (fonctions serverless à durée limitée) : on ne laisse jamais
 * un appel réseau bloquer indéfiniment. En cas de dépassement, le pipeline
 * poursuit avec les signaux déjà collectés plutôt que d'échouer.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    let regle = false;
    const t = setTimeout(() => {
      if (!regle) {
        regle = true;
        resolve(fallback);
      }
    }, ms);
    promise
      .then((v) => {
        if (!regle) {
          regle = true;
          clearTimeout(t);
          resolve(v);
        }
      })
      .catch(() => {
        if (!regle) {
          regle = true;
          clearTimeout(t);
          resolve(fallback);
        }
      });
  });
}
