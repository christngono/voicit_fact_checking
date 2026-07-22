/**
 * Jeu d'icônes VoCit — SVG inline (aucune dépendance externe, aucune requête réseau).
 * Toutes tracées en `currentColor` pour hériter de la couleur du texte parent.
 */
type IconProps = { className?: string; size?: number };

function base(size: number, className?: string) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };
}

/** Vérifier — bouclier + loupe (protéger / examiner). */
export function IconVerifier({ className, size = 22 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 3l7 2.5v5.5c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V5.5L12 3z" />
      <circle cx="11" cy="10.5" r="2.4" />
      <path d="M13 12.5l2 2" />
    </svg>
  );
}

/** Historique — horloge. */
export function IconHistorique({ className, size = 22 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  );
}

/** Rumeurs — liste. */
export function IconRumeurs({ className, size = 22 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M8 6h11M8 12h11M8 18h11" />
      <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** À propos — info. */
export function IconInfo({ className, size = 22 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5" />
      <circle cx="12" cy="7.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Menu secondaire — trois points. */
export function IconPlus({ className, size = 22 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Radar — cartographie de circulation. */
export function IconRadar({ className, size = 22 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 12l6-4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Contester — drapeau. */
export function IconFlag({ className, size = 22 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M6 21V4" />
      <path d="M6 4.5h10.5l-2 3.5 2 3.5H6" />
    </svg>
  );
}

/** Contact / Partenaires — enveloppe. */
export function IconMail({ className, size = 22 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M4 7l8 5.5L20 7" />
    </svg>
  );
}
