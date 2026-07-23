/**
 * Marque VoCit — tornade dégradée reproduisant l'esprit du logo
 * (bandes empilées vert → rouge → orange → jaune se resserrant en pointe).
 */
export function TornadoMark({ size = 34 }: { size?: number }) {
  const id = "voicit-tornado";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="VoCit"
      className="shrink-0"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#0E7A3B" />
          <stop offset="38%" stopColor="#4c8a2b" />
          <stop offset="60%" stopColor="#E23B26" />
          <stop offset="80%" stopColor="#F5871F" />
          <stop offset="100%" stopColor="#FBC02D" />
        </linearGradient>
      </defs>
      <g fill={`url(#${id})`}>
        <path d="M12 20 Q52 8 92 22 L86 31 Q50 22 18 30 Z" />
        <path d="M20 36 Q54 27 82 39 L76 47 Q48 39 26 45 Z" />
        <path d="M28 51 Q54 44 74 54 L68 62 Q48 55 34 60 Z" />
        <path d="M37 65 Q54 60 66 68 L58 77 Q50 72 44 74 Z" />
        <path d="M46 79 L58 80 L52 94 Z" />
      </g>
    </svg>
  );
}

/**
 * Logo officiel VoCit (fichier fourni `public/logo-vocit.svg`).
 * SVG figé (image embarquée) → on l'affiche via <img>, dimensionné par la hauteur.
 * Rapport d'aspect natif 482×302 ≈ 1,6.
 */
export function LogoImage({
  height = 30,
  className = "",
  priority = false,
}: {
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-vocit.svg"
      alt="VoCit"
      height={height}
      style={{ height, width: "auto" }}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={"select-none " + className}
    />
  );
}

/** Marque affichée dans le header : le logo officiel. */
export function Wordmark() {
  return <LogoImage height={30} priority className="shrink-0" />;
}
