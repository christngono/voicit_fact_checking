/**
 * Échelle de couleur du Radar.
 *
 * Choroplèthe = encodage de MAGNITUDE → échelle SÉQUENTIELLE : une seule
 * progression clair → foncé (jaune pâle → orange → rouge profond), reprise du
 * dégradé de marque (la « tornade »). Peu de signalements = pâle, beaucoup =
 * rouge foncé. Une région sans donnée est neutre (gris), jamais confondue avec
 * un faible volume.
 */

/** Gris neutre pour une région absente de radar.json. */
export const MISSING_COLOR = "#E5E7EB";

/** Rampe séquentielle clair→foncé, en points [position 0..1, RGB]. */
const RAMP: Array<[number, [number, number, number]]> = [
  [0.0, [254, 240, 200]], // jaune très pâle
  [0.3, [253, 210, 110]], // jaune
  [0.6, [245, 135, 31]], // orange (accent-orange marque)
  [0.85, [226, 59, 38]], // rouge (accent-red marque)
  [1.0, [142, 27, 18]], // rouge profond
];

/** Gradient CSS équivalent, pour la légende de l'échelle. */
export const RAMP_CSS =
  "linear-gradient(90deg,#FEF0C8,#FDD26E,#F5871F,#E23B26,#8E1B12)";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Couleur d'une région selon son volume, rapportée au maximum de la carte.
 * `nb` absent (ou `max` invalide) → gris neutre.
 */
export function colorForVolume(nb: number | undefined, max: number): string {
  if (nb == null || max <= 0) return MISSING_COLOR;
  const t = Math.max(0, Math.min(1, nb / max));
  for (let i = 1; i < RAMP.length; i++) {
    const [t0, c0] = RAMP[i - 1];
    const [t1, c1] = RAMP[i];
    if (t <= t1) {
      const f = (t1 - t0) === 0 ? 0 : (t - t0) / (t1 - t0);
      const r = Math.round(lerp(c0[0], c1[0], f));
      const g = Math.round(lerp(c0[1], c1[1], f));
      const b = Math.round(lerp(c0[2], c1[2], f));
      return `rgb(${r} ${g} ${b})`;
    }
  }
  const [r, g, b] = RAMP[RAMP.length - 1][1];
  return `rgb(${r} ${g} ${b})`;
}
