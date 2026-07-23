"use client";

import { useEffect, useState } from "react";
import { useT } from "./LocaleProvider";
import { LogoImage } from "./Logo";

/**
 * Écran d'ouverture animé (splash) — reprend le logo tornade de VoCit.
 *
 * Déroulé : le logo officiel apparaît (échelle) puis oscille doucement, la
 * baseline monte en fondu, une barre de progression « tornade » se remplit,
 * puis tout s'efface (~2,4 s).
 *
 * S'affiche à CHAQUE ouverture réelle de l'app (tout rechargement complet). La
 * navigation interne ne le rejoue pas : le composant reste monté dans le layout.
 * Cliquer/toucher passe l'animation. Respecte prefers-reduced-motion (voir CSS).
 */

export function SplashScreen() {
  const t = useT();
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
      aria-label="Ouverture de VoCit"
      onClick={() => setPhase("out")}
    >
      {/* Halo vert doux derrière la tornade */}
      <div className="pointer-events-none absolute h-72 w-72 rounded-full bg-brand-100/60 blur-3xl" />

      <div className="relative flex flex-col items-center">
        {/* Logo officiel VoCit, animé (échelle + oscillation douce) */}
        <div className="splash-mark" style={{ transformOrigin: "50% 88%" }}>
          <LogoImage height={92} priority />
        </div>

        <p
          className="splash-rise mt-4 text-sm font-medium text-verdict-insuffisant"
          style={{ animationDelay: "540ms" }}
        >
          {t.tagline}
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
