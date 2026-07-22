"use client";

import { useEffect, useState } from "react";

/**
 * Écran d'ouverture animé (splash) — reprend le logo tornade de VoiCit.
 *
 * Déroulé : les 5 bandes de la tornade apparaissent en cascade, la marque se
 * forme puis oscille, le wordmark et la baseline montent en fondu, une barre de
 * progression « tornade » se remplit, puis tout s'efface (~2,4 s).
 *
 * S'affiche à CHAQUE ouverture réelle de l'app (tout rechargement complet). La
 * navigation interne ne le rejoue pas : le composant reste monté dans le layout.
 * Cliquer/toucher passe l'animation. Respecte prefers-reduced-motion (voir CSS).
 */

// Tracés IDENTIQUES à ceux du logo (components/Logo.tsx) — cohérence de marque.
const BANDES = [
  "M12 20 Q52 8 92 22 L86 31 Q50 22 18 30 Z",
  "M20 36 Q54 27 82 39 L76 47 Q48 39 26 45 Z",
  "M28 51 Q54 44 74 54 L68 62 Q48 55 34 60 Z",
  "M37 65 Q54 60 66 68 L58 77 Q50 72 44 74 Z",
  "M46 79 L58 80 L52 94 Z",
];

export function SplashScreen() {
  const [phase, setPhase] = useState<"show" | "out" | "done">("show");

  useEffect(() => {
    const versSortie = setTimeout(() => setPhase("out"), 1900);
    const versFin = setTimeout(() => setPhase("done"), 2450);
    return () => {
      clearTimeout(versSortie);
      clearTimeout(versFin);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className={
        "splash-overlay flex flex-col items-center justify-center bg-white " +
        (phase === "out" ? "splash-overlay--out" : "")
      }
      role="status"
      aria-label="Ouverture de VoiCit"
      onClick={() => setPhase("out")}
    >
      {/* Halo vert doux derrière la tornade */}
      <div className="pointer-events-none absolute h-72 w-72 rounded-full bg-brand-100/60 blur-3xl" />

      <div className="relative flex flex-col items-center">
        <div className="splash-mark" style={{ transformOrigin: "50% 88%" }}>
          <svg width={108} height={108} viewBox="0 0 100 100" role="img" aria-label="VoiCit">
            <defs>
              <linearGradient id="splash-tornado" x1="0" y1="0" x2="0.4" y2="1">
                <stop offset="0%" stopColor="#0E7A3B" />
                <stop offset="38%" stopColor="#4c8a2b" />
                <stop offset="60%" stopColor="#E23B26" />
                <stop offset="80%" stopColor="#F5871F" />
                <stop offset="100%" stopColor="#FBC02D" />
              </linearGradient>
            </defs>
            <g fill="url(#splash-tornado)">
              {BANDES.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  className="splash-band"
                  style={{ animationDelay: `${i * 95}ms` }}
                />
              ))}
            </g>
          </svg>
        </div>

        <div className="splash-rise mt-4" style={{ animationDelay: "540ms" }}>
          <span className="text-3xl font-extrabold tracking-tight text-ink">
            Voi<span className="text-brand-500">Cit</span>
          </span>
        </div>

        <p
          className="splash-rise mt-1 text-sm font-medium text-verdict-insuffisant"
          style={{ animationDelay: "780ms" }}
        >
          Vérifier avant de partager
        </p>

        <div
          className="splash-rise mt-6 h-1 w-28 overflow-hidden rounded-full bg-gray-100"
          style={{ animationDelay: "840ms" }}
        >
          <div className="splash-progress h-full w-full bg-tornado" />
        </div>
      </div>
    </div>
  );
}
