"use client";

import { useEffect, useRef, useState } from "react";
import type { StreamEvent, TypeContenu, VerifyResult } from "@/lib/types";
import { lireNumero } from "@/lib/user";
import { Hero } from "./components/Hero";
import { ProgressSteps, construireEtapes, type EtapeUI } from "./components/ProgressSteps";
import { VerdictCard } from "./components/VerdictCard";
import {
  EvidenceList,
  SourceList,
  ClaimList,
  AdviceBox,
  ExtractedInfo,
  WebUnavailableNotice,
  ScoreExplanation,
} from "./components/ResultParts";
import { RecentRumors } from "./components/RecentRumors";
import { ConseilsResponsabilite } from "./components/ConseilsResponsabilite";
import { ajouterHistorique } from "@/lib/history";
import { useLocale } from "./components/LocaleProvider";

type Onglet = "texte" | "lien" | "image" | "video" | "numero";

const ONGLETS: { id: Onglet; pret: boolean }[] = [
  { id: "texte", pret: true },
  { id: "lien", pret: true },
  { id: "image", pret: true },
  { id: "video", pret: false },
  { id: "numero", pret: false },
];

// Limite d'upload image (avant encodage base64) — cohérente avec la route serveur.
const MAX_IMAGE_OCTETS = 4_500_000;

/** Vérifie sommairement qu'une saisie ressemble à une URL (le serveur revalide). */
function ressembleUrl(v: string): boolean {
  const s = v.trim();
  return /\.[a-z]{2,}(\/|$|\?|#)/i.test(s) || /^https?:\/\//i.test(s);
}

export default function Accueil() {
  const { d, locale } = useLocale();
  const [onglet, setOnglet] = useState<Onglet>("texte");
  const [contenu, setContenu] = useState("");
  const [imageData, setImageData] = useState("");
  const [imageNom, setImageNom] = useState("");
  const [etat, setEtat] = useState<"idle" | "analyse" | "resultat" | "erreur">("idle");
  const [etapes, setEtapes] = useState<EtapeUI[]>([]);
  const [resultat, setResultat] = useState<VerifyResult | null>(null);
  const [erreur, setErreur] = useState<string>("");
  // Contenu extrait (image / lien / texte) — montré en direct puis au résultat.
  const [extraction, setExtraction] = useState<{
    champs: { cle: string; valeur: string }[];
    affirmations: string[];
  } | null>(null);
  // Recherche web non lancée (crédit/quota API épuisé ou autre panne).
  const [webIndispo, setWebIndispo] = useState<"quota" | "erreur" | null>(null);
  // Numéro saisi à l'onboarding (localStorage) — lu côté client pour éviter tout
  // écart d'hydratation, puis affiché en bienvenue sur la page principale.
  const [numero, setNumero] = useState<string | null>(null);
  const fichierRef = useRef<HTMLInputElement>(null);

  useEffect(() => setNumero(lireNumero()), []);

  const estLien = onglet === "lien";
  const estImage = onglet === "image";

  function changerOnglet(id: Onglet) {
    if (!ONGLETS.find((o) => o.id === id)?.pret) return;
    setOnglet(id);
    setContenu("");
    setImageData("");
    setImageNom("");
    setErreur("");
  }

  function surFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setErreur("");
    if (!f.type.startsWith("image/")) {
      setErreur(d.home.errNotImage);
      return;
    }
    if (f.size > MAX_IMAGE_OCTETS) {
      setErreur(d.home.errTooBig);
      return;
    }
    const lecteur = new FileReader();
    lecteur.onload = () => {
      setImageData((lecteur.result as string) || "");
      setImageNom(f.name);
    };
    lecteur.readAsDataURL(f);
  }

  const saisieValide = estImage
    ? imageData.length > 0
    : estLien
    ? ressembleUrl(contenu)
    : contenu.trim().length > 0;

  async function verifier() {
    if (!saisieValide || etat === "analyse") return;
    setEtat("analyse");
    setResultat(null);
    setErreur("");
    setExtraction(null);
    setWebIndispo(null);
    const module = estImage ? "image" : estLien ? "link" : "text";
    const labels = estImage ? d.steps.image : estLien ? d.steps.link : d.steps.text;
    setEtapes(construireEtapes(module, labels));

    const endpoint = estImage
      ? "/api/verify/image"
      : estLien
      ? "/api/verify/link"
      : "/api/verify/text";
    const payload = estImage
      ? { image: imageData, locale }
      : estLien
      ? { url: contenu, locale }
      : { contenu, locale };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.body) throw new Error("Réponse vide du serveur.");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Lecture du flux SSE : chaque bloc "data: {json}\n\n" = un événement réel.
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocs = buffer.split("\n\n");
        buffer = blocs.pop() ?? "";
        for (const bloc of blocs) {
          const ligne = bloc.split("\n").find((l) => l.startsWith("data: "));
          if (!ligne) continue;
          const evt = JSON.parse(ligne.slice(6)) as StreamEvent;
          appliquerEvenement(evt);
        }
      }
    } catch (e) {
      setErreur((e as Error).message || "Erreur.");
      setEtat("erreur");
    }
  }

  function appliquerEvenement(evt: StreamEvent) {
    if (evt.type === "etape") {
      // On garde le LIBELLÉ localisé (issu du dictionnaire) et on ne met à jour
      // que le statut : le label serveur (français) est volontairement ignoré.
      setEtapes((prev) =>
        prev.map((e) =>
          e.id === evt.id
            ? {
                ...e,
                statut:
                  evt.statut === "termine"
                    ? "termine"
                    : evt.statut === "ignore"
                    ? "ignore"
                    : "en_cours",
              }
            : e
        )
      );
    } else if (evt.type === "extraction") {
      setExtraction({ champs: evt.champs, affirmations: evt.affirmations });
    } else if (evt.type === "web_indisponible") {
      setWebIndispo(evt.raison);
    } else if (evt.type === "resultat") {
      setResultat(evt.data);
      setEtat("resultat");
      // Trace la vérification dans l'historique de session (client uniquement).
      ajouterHistorique({
        type: onglet as TypeContenu,
        apercu: estImage ? imageNom || d.home.tabs.image : contenu.trim().slice(0, 140),
        verdict: evt.data.niveau,
        score: evt.data.score,
      });
    } else if (evt.type === "erreur") {
      setErreur(evt.message);
      setEtat("erreur");
    }
  }

  function reinitialiser() {
    setEtat("idle");
    setResultat(null);
    setContenu("");
    setImageData("");
    setImageNom("");
    setErreur("");
    setExtraction(null);
    setWebIndispo(null);
    if (fichierRef.current) fichierRef.current.value = "";
  }

  const surAccueil = etat === "idle" || etat === "erreur";

  return (
    <div>
      {/* Bienvenue : le numéro saisi à l'onboarding réapparaît sur la page principale */}
      {surAccueil && numero && (
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50/70 px-3 py-1.5 text-xs font-medium text-brand-700">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
              👋
            </span>
            {d.home.greeting} · {numero}
          </span>
        </div>
      )}

      {/* Hero narratif — sur l'accueil uniquement, pour rester focalisé pendant l'analyse */}
      {surAccueil && <Hero />}

      {/* Message d'aide : comment utiliser VoCit */}
      {surAccueil && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50/60 p-3">
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-500 text-xs font-bold text-white">
            ?
          </span>
          <p className="text-xs leading-relaxed text-ink/80">
            <strong className="font-semibold text-ink">{d.home.helpTitle}</strong>{" "}
            {d.home.helpBody}
          </p>
        </div>
      )}

      {/* Onglets */}
      <div className="mb-4 grid grid-cols-5 gap-1 rounded-xl bg-gray-100 p-1">
        {ONGLETS.map((o) => (
          <button
            key={o.id}
            onClick={() => changerOnglet(o.id)}
            disabled={!o.pret}
            className={
              "relative rounded-lg py-2 text-[13px] font-medium transition " +
              (onglet === o.id
                ? "bg-white text-brand-600 shadow-sm"
                : o.pret
                ? "text-gray-500 hover:text-ink"
                : "cursor-not-allowed text-gray-300")
            }
          >
            {d.home.tabs[o.id]}
            {!o.pret && (
              <span className="absolute -right-0.5 -top-1 rounded-full bg-accent-yellow px-1 text-[8px] font-bold text-ink">
                {d.home.soon}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Zone de soumission (Texte / Lien / Image) */}
      {etat === "idle" || etat === "erreur" ? (
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-card">
          {onglet === "texte" && (
            <>
              <label className="mb-2 block text-sm font-semibold text-ink">
                {d.home.textLabel}
              </label>
              <textarea
                value={contenu}
                onChange={(e) => setContenu(e.target.value)}
                rows={5}
                placeholder={d.home.textPlaceholder}
                className="w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
              <p className="mt-1 text-xs text-gray-400">{d.home.textHint}</p>
            </>
          )}

          {onglet === "lien" && (
            <>
              <label className="mb-2 block text-sm font-semibold text-ink">
                {d.home.linkLabel}
              </label>
              <input
                type="url"
                inputMode="url"
                value={contenu}
                onChange={(e) => setContenu(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verifier()}
                placeholder={d.home.linkPlaceholder}
                className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
              <p className="mt-1 text-xs text-gray-400">{d.home.linkHint}</p>
            </>
          )}

          {onglet === "image" && (
            <>
              <label className="mb-2 block text-sm font-semibold text-ink">
                {d.home.imageLabel}
              </label>
              <input
                ref={fichierRef}
                type="file"
                accept="image/*"
                onChange={surFichier}
                className="hidden"
              />
              {!imageData ? (
                <button
                  onClick={() => fichierRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-8 text-center transition hover:border-brand-500 hover:bg-brand-50/40"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-xl text-brand-600">
                    ＋
                  </span>
                  <span className="text-sm font-medium text-gray-600">{d.home.imageChoose}</span>
                  <span className="text-xs text-gray-400">{d.home.imageFormats}</span>
                </button>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  {/* Aperçu local de l'image sélectionnée */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageData} alt="" className="max-h-64 w-full object-contain bg-gray-50" />
                  <div className="flex items-center justify-between gap-2 px-3 py-2">
                    <span className="truncate text-xs text-gray-500">{imageNom}</span>
                    <button
                      onClick={() => fichierRef.current?.click()}
                      className="shrink-0 text-xs font-medium text-brand-600 hover:underline"
                    >
                      {d.home.imageChange}
                    </button>
                  </div>
                </div>
              )}
              <p className="mt-1 text-xs text-gray-400">{d.home.imageHint}</p>
            </>
          )}

          {(onglet === "video" || onglet === "numero") && (
            <p className="py-8 text-center text-sm text-gray-400">
              {d.home.soonModuleA}
              {d.home.tabs[onglet]}
              {d.home.soonModuleB}
            </p>
          )}

          {(onglet === "texte" || onglet === "lien" || onglet === "image") && (
            <>
              {erreur && (
                <p className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-700">{erreur}</p>
              )}
              <button
                onClick={verifier}
                disabled={!saisieValide}
                className="mt-4 w-full rounded-xl bg-tornado py-3 text-sm font-semibold text-white shadow-sm transition enabled:hover:opacity-95 disabled:opacity-40"
              >
                {estImage ? d.home.btnVerifyImage : estLien ? d.home.btnVerifyLink : d.home.btnVerify}
              </button>
            </>
          )}
        </div>
      ) : null}

      {/* Analyse en cours */}
      {etat === "analyse" && (
        <div className="space-y-4">
          <ProgressSteps etapes={etapes} />
          {extraction && <ExtractedInfo {...extraction} />}
          {webIndispo && <WebUnavailableNotice raison={webIndispo} />}
        </div>
      )}

      {/* Résultat */}
      {etat === "resultat" && resultat && (
        <div className="space-y-4">
          <VerdictCard r={resultat} />
          {webIndispo && <WebUnavailableNotice raison={webIndispo} />}
          {extraction && <ExtractedInfo {...extraction} />}
          <EvidenceList composantes={resultat.composantes} />
          <SourceList sources={resultat.sources} />
          <ClaimList affirmations={resultat.affirmations} />
          <AdviceBox conseil={resultat.conseil} />
          <ScoreExplanation
            composantes={resultat.composantesDetail}
            scoreComplet={resultat.scoreComplet}
            elementsManquants={resultat.elementsManquants}
          />
          <button
            onClick={reinitialiser}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            {d.home.verifyAnother}
          </button>
          <ConseilsResponsabilite />
        </div>
      )}

      {/* Accueil : rumeurs récemment démenties + conseils de responsabilité */}
      {(etat === "idle" || etat === "erreur") && (
        <>
          <RecentRumors />
          <ConseilsResponsabilite />
        </>
      )}
    </div>
  );
}
