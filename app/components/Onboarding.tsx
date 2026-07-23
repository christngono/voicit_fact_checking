"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";
import { LogoImage } from "./Logo";
import { DICT, type Locale } from "@/lib/i18n/dictionary";
import { normaliserNumero } from "@/lib/phone";

/**
 * Onboarding d'ouverture (après le splash) — remplace l'ancien écran de choix
 * de langue. Déroulé :
 *   1. 3 diapositives présentant les fonctions essentielles (Texte, Lien, Image),
 *      chacune avec une image et un message + bouton « Continuer ».
 *   2. Une étape finale : choix de la langue + saisie du numéro de téléphone.
 * À la validation, la langue est enregistrée (cookie) et le numéro localement
 * (localStorage) ; le numéro réapparaît ensuite sur la page principale.
 *
 * Ne s'affiche que tant qu'aucune langue n'a été choisie (cookie absent) — même
 * condition de portail que l'ancien LanguageGate, donc pas de ré-affichage ensuite.
 */

// Images réelles illustrant les 3 fonctions (réutilise les visuels du hero).
const VISUELS = ["/hero/deinfos1.jpg", "/hero/deinfos2.jpg", "/hero/deinfos3.jpg"];
const BADGES: ("texte" | "lien" | "image")[] = ["texte", "lien", "image"];

export function Onboarding() {
  const { chosen, locale, setLocale, setPhone } = useLocale();
  const [preview, setPreview] = useState<Locale>(locale);
  const [etape, setEtape] = useState(0); // 0..2 = fonctions, 3 = langue + numéro
  const [numero, setNumero] = useState("");
  const [err, setErr] = useState("");

  // À chaque réapparition (ouverture initiale OU déconnexion), on repart de la
  // première diapositive avec un formulaire vierge.
  useEffect(() => {
    if (!chosen) {
      setEtape(0);
      setNumero("");
      setErr("");
      setPreview(locale);
    }
  }, [chosen, locale]);

  const d = DICT[preview];
  const o = d.onboarding;
  const total = o.slides.length; // 3 diapositives de présentation

  if (chosen) return null;

  function terminer() {
    const norm = normaliserNumero(numero);
    if (!norm) {
      setErr(o.phoneError);
      return;
    }
    setPhone(norm);
    setLocale(preview); // écrit le cookie + refresh → l'onboarding se démonte
  }

  const surFonctions = etape < total;

  return (
    <div className="fixed inset-0 z-[95] flex flex-col overflow-y-auto bg-white">
      {/* En-tête : logo + « Passer » pendant la présentation */}
      <div className="flex items-center justify-between px-5 pt-5">
        <LogoImage height={28} priority />
        {surFonctions && (
          <button
            onClick={() => setEtape(total)}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-gray-400 transition hover:text-ink"
          >
            {o.skip}
          </button>
        )}
      </div>

      {surFonctions ? (
        /* ── Étapes 0..2 : présentation des fonctions ─────────────────────── */
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-6">
          <div className="w-full max-w-sm">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-card">
              <Image
                src={VISUELS[etape]}
                alt=""
                fill
                priority={etape === 0}
                sizes="(max-width: 640px) 100vw, 384px"
                className="object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-700/90 via-brand-700/25 to-transparent" />
              <span className="absolute left-4 top-4 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                {d.home.tabs[BADGES[etape]]}
              </span>
            </div>

            <h1 className="mt-6 text-center text-2xl font-extrabold tracking-tight text-ink">
              {o.slides[etape].titre}
            </h1>
            <p className="mx-auto mt-2 max-w-xs text-center text-sm leading-relaxed text-gray-500">
              {o.slides[etape].corps}
            </p>

            {/* Points de progression */}
            <div className="mt-7 flex items-center justify-center gap-2">
              {o.slides.map((_, i) => (
                <span
                  key={i}
                  className={
                    "h-1.5 rounded-full transition-all " +
                    (i === etape ? "w-6 bg-brand-500" : "w-1.5 bg-gray-200")
                  }
                />
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3">
              {etape > 0 && (
                <button
                  onClick={() => setEtape((e) => e - 1)}
                  className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-gray-50"
                >
                  {o.back}
                </button>
              )}
              <button
                onClick={() => setEtape((e) => e + 1)}
                className="flex-1 rounded-xl bg-tornado py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
              >
                {o.next}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Étape finale : langue + numéro ───────────────────────────────── */
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-6">
          <div className="w-full max-w-sm">
            <LogoImage height={40} className="mx-auto" />

            {/* Langue */}
            <h2 className="mt-6 text-center text-base font-bold text-ink">{o.langTitle}</h2>
            <p className="mt-1 text-center text-xs text-gray-400">{o.langSub}</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {(["fr", "en"] as Locale[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setPreview(l)}
                  aria-pressed={preview === l}
                  className={
                    "flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition " +
                    (preview === l
                      ? "border-brand-500 bg-brand-50 text-brand-600"
                      : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50")
                  }
                >
                  <span aria-hidden>{l === "fr" ? "🇫🇷" : "🇬🇧"}</span>
                  {l === "fr" ? d.gate.fr : d.gate.en}
                </button>
              ))}
            </div>

            {/* Numéro */}
            <h2 className="mt-7 text-center text-base font-bold text-ink">{o.phoneTitle}</h2>
            <p className="mx-auto mt-1 max-w-xs text-center text-xs text-gray-400">{o.phoneSub}</p>
            <div className="mt-3">
              <label className="mb-1.5 block text-sm font-medium text-ink">{o.phoneLabel}</label>
              <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
                <span className="select-none border-r border-gray-200 bg-gray-50 px-3 py-3 text-sm font-medium text-gray-500">
                  +237
                </span>
                <input
                  type="tel"
                  inputMode="tel"
                  value={numero}
                  onChange={(e) => {
                    setNumero(e.target.value);
                    setErr("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && terminer()}
                  placeholder={o.phonePlaceholder}
                  className="w-full px-3 py-3 text-sm outline-none"
                />
              </div>
              {err ? (
                <p className="mt-1.5 text-xs text-red-600">{err}</p>
              ) : (
                <p className="mt-1.5 text-xs text-gray-400">{o.phoneHint}</p>
              )}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => setEtape(total - 1)}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-gray-50"
              >
                {o.back}
              </button>
              <button
                onClick={terminer}
                className="flex-1 rounded-xl bg-tornado py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
              >
                {o.start}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
