"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "./LocaleProvider";

/**
 * Hero — carrousel narratif juste sous le header.
 * Image plein cadre + scrim dégradé vert de marque, légende superposée.
 * Slide auto (fondu-glissé), points cliquables, swipe tactile, effet Ken Burns.
 * Respecte prefers-reduced-motion (pas d'autoplay ni d'animation si demandé).
 */

// Images fixes du carrousel (le texte des slides vient du dictionnaire i18n).
const IMGS = ["/hero/deinfos3.jpg", "/hero/deinfos1.jpg", "/hero/deinfos2.jpg"];

const DELAI = 5500;

export function Hero() {
  const t = useT();
  const SLIDES = t.hero.slides.map((s, i) => ({ ...s, img: IMGS[i] ?? IMGS[0] }));
  const [index, setIndex] = useState(0);
  const [pause, setPause] = useState(false);
  const n = SLIDES.length;

  const drag = useRef<{ x: number; active: boolean }>({ x: 0, active: false });

  const aller = useCallback((i: number) => setIndex(((i % n) + n) % n), [n]);

  // Autoplay — désactivé au survol/toucher et si l'utilisateur réduit les animations.
  useEffect(() => {
    const reduit =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (pause || reduit) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % n), DELAI);
    return () => clearInterval(t);
  }, [pause, n]);

  // Swipe tactile.
  const onStart = (x: number) => {
    drag.current = { x, active: true };
    setPause(true);
  };
  const onEnd = (x: number) => {
    if (!drag.current.active) return;
    const delta = x - drag.current.x;
    if (Math.abs(delta) > 45) aller(index + (delta < 0 ? 1 : -1));
    drag.current.active = false;
    setPause(false);
  };

  return (
    <section
      aria-roledescription="carrousel"
      aria-label={t.hero.label}
      className="relative mb-5 h-56 select-none overflow-hidden rounded-2xl shadow-card sm:h-72 md:h-80"
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
      onTouchStart={(e) => onStart(e.touches[0].clientX)}
      onTouchEnd={(e) => onEnd(e.changedTouches[0].clientX)}
    >
      {/* Piste des slides */}
      <div
        className="flex h-full motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {SLIDES.map((s, i) => {
          const actif = i === index;
          return (
            <div key={s.img} className="relative h-full w-full shrink-0">
              {/* Image + Ken Burns sur la slide active */}
              <Image
                src={s.img}
                alt=""
                fill
                priority={i === 0}
                sizes="(max-width: 672px) 100vw, 672px"
                className={
                  "object-cover object-top motion-safe:transition-transform motion-safe:duration-[6000ms] motion-safe:ease-out " +
                  (actif ? "scale-105" : "scale-100")
                }
              />
              {/* Scrim dégradé vert de marque, du bas vers le haut */}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-700/95 via-brand-700/45 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/35 to-transparent" />

              {/* Légende */}
              <div
                className={
                  "absolute inset-x-0 bottom-0 p-4 sm:p-5 motion-safe:transition-all motion-safe:duration-500 " +
                  (actif ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0")
                }
              >
                <span className="mb-2 inline-block rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                  VoCit
                </span>
                <h2 className="max-w-xl text-lg font-extrabold leading-tight text-white drop-shadow sm:text-2xl">
                  {s.titre}
                </h2>
                <p className="mt-1.5 max-w-xl text-xs leading-snug text-white/90 sm:text-sm">
                  {s.sous}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Points de navigation */}
      <div className="absolute bottom-3 right-4 z-10 flex items-center gap-1.5">
        {SLIDES.map((s, i) => (
          <button
            key={s.img}
            aria-label={`Aller au message ${i + 1}`}
            aria-current={i === index}
            onClick={() => aller(i)}
            className={
              "h-1.5 rounded-full transition-all " +
              (i === index ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80")
            }
          />
        ))}
      </div>
    </section>
  );
}
