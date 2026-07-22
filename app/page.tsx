"use client";

import { useRef, useState } from "react";
import type { StreamEvent, TypeContenu, VerifyResult } from "@/lib/types";
import { Hero } from "./components/Hero";
import {
  ProgressSteps,
  ETAPES_INIT,
  ETAPES_INIT_LIEN,
  ETAPES_INIT_IMAGE,
  type EtapeUI,
} from "./components/ProgressSteps";
import { VerdictCard } from "./components/VerdictCard";
import { EvidenceList, SourceList, ClaimList, AdviceBox } from "./components/ResultParts";
import { RecentRumors } from "./components/RecentRumors";
import { ajouterHistorique } from "@/lib/history";

type Onglet = "texte" | "lien" | "image" | "video" | "numero";

const ONGLETS: { id: Onglet; label: string; pret: boolean }[] = [
  { id: "texte", label: "Texte", pret: true },
  { id: "lien", label: "Lien", pret: true },
  { id: "image", label: "Image", pret: true },
  { id: "video", label: "Vidéo", pret: false },
  { id: "numero", label: "Numéro", pret: false },
];

// Limite d'upload image (avant encodage base64) — cohérente avec la route serveur.
const MAX_IMAGE_OCTETS = 4_500_000;

/** Vérifie sommairement qu'une saisie ressemble à une URL (le serveur revalide). */
function ressembleUrl(v: string): boolean {
  const t = v.trim();
  return /\.[a-z]{2,}(\/|$|\?|#)/i.test(t) || /^https?:\/\//i.test(t);
}

export default function Accueil() {
  const [onglet, setOnglet] = useState<Onglet>("texte");
  const [contenu, setContenu] = useState("");
  const [imageData, setImageData] = useState("");
  const [imageNom, setImageNom] = useState("");
  const [etat, setEtat] = useState<"idle" | "analyse" | "resultat" | "erreur">("idle");
  const [etapes, setEtapes] = useState<EtapeUI[]>(ETAPES_INIT);
  const [resultat, setResultat] = useState<VerifyResult | null>(null);
  const [erreur, setErreur] = useState<string>("");
  const fichierRef = useRef<HTMLInputElement>(null);

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
      setErreur("Veuillez choisir un fichier image (JPG, PNG, WebP…).");
      return;
    }
    if (f.size > MAX_IMAGE_OCTETS) {
      setErreur("Image trop lourde (max ~4,5 Mo). Réduisez-la et réessayez.");
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
    const etapesInit = estImage ? ETAPES_INIT_IMAGE : estLien ? ETAPES_INIT_LIEN : ETAPES_INIT;
    setEtapes(etapesInit.map((e) => ({ ...e })));

    const endpoint = estImage
      ? "/api/verify/image"
      : estLien
      ? "/api/verify/link"
      : "/api/verify/text";
    const payload = estImage ? { image: imageData } : estLien ? { url: contenu } : { contenu };

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
      setErreur((e as Error).message || "Une erreur est survenue.");
      setEtat("erreur");
    }
  }

  function appliquerEvenement(evt: StreamEvent) {
    if (evt.type === "etape") {
      setEtapes((prev) =>
        prev.map((e) =>
          e.id === evt.id
            ? {
                ...e,
                label: evt.label,
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
    } else if (evt.type === "resultat") {
      setResultat(evt.data);
      setEtat("resultat");
      // Trace la vérification dans l'historique de session (client uniquement).
      ajouterHistorique({
        type: onglet as TypeContenu,
        apercu: estImage
          ? imageNom || "Image analysée"
          : contenu.trim().slice(0, 140),
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
    if (fichierRef.current) fichierRef.current.value = "";
  }

  const surAccueil = etat === "idle" || etat === "erreur";

  return (
    <div>
      {/* Hero narratif — sur l'accueil uniquement, pour rester focalisé pendant l'analyse */}
      {surAccueil && <Hero />}

      {/* Message d'aide : comment utiliser VoiCit */}
      {surAccueil && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50/60 p-3">
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-500 text-xs font-bold text-white">
            ?
          </span>
          <p className="text-xs leading-relaxed text-ink/80">
            <strong className="font-semibold text-ink">Comment ça marche —</strong> choisissez
            le type de contenu ci-dessous (un <strong>texte</strong>, un{" "}
            <strong>lien</strong> d'article, une <strong>image</strong>… bientôt une{" "}
            <strong>vidéo</strong> ou un <strong>numéro</strong>), collez-le ou importez-le,
            puis touchez <strong>Vérifier</strong>. VoiCit vous répond en quelques secondes
            avec un verdict, les <strong>preuves</strong> et les <strong>sources</strong>
            consultées. En cas de doute, ne partagez pas.
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
            {o.label}
            {!o.pret && (
              <span className="absolute -right-0.5 -top-1 rounded-full bg-accent-yellow px-1 text-[8px] font-bold text-ink">
                bientôt
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
                Collez le message à vérifier
              </label>
              <textarea
                value={contenu}
                onChange={(e) => setContenu(e.target.value)}
                rows={5}
                placeholder="Ex : MTN offre 50 000 FCFA de crédit gratuit, partagez à 10 contacts…"
                className="w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
              <p className="mt-1 text-xs text-gray-400">
                Français, anglais, pidgin ou camfranglais — VoiCit traduit avant d'analyser.
              </p>
            </>
          )}

          {onglet === "lien" && (
            <>
              <label className="mb-2 block text-sm font-semibold text-ink">
                Collez le lien de l'article à vérifier
              </label>
              <input
                type="url"
                inputMode="url"
                value={contenu}
                onChange={(e) => setContenu(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verifier()}
                placeholder="https://exemple.cm/un-article…"
                className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
              <p className="mt-1 text-xs text-gray-400">
                VoiCit ouvre la page, lit le titre, l'auteur et la date, vérifie le domaine
                et cherche des sources avant de conclure.
              </p>
            </>
          )}

          {onglet === "image" && (
            <>
              <label className="mb-2 block text-sm font-semibold text-ink">
                Importez l'image à vérifier
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
                  <span className="text-sm font-medium text-gray-600">
                    Choisir une image (capture, affiche, photo…)
                  </span>
                  <span className="text-xs text-gray-400">JPG, PNG ou WebP — max ~4,5 Mo</span>
                </button>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  {/* Aperçu local de l'image sélectionnée */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageData} alt="Aperçu" className="max-h-64 w-full object-contain bg-gray-50" />
                  <div className="flex items-center justify-between gap-2 px-3 py-2">
                    <span className="truncate text-xs text-gray-500">{imageNom}</span>
                    <button
                      onClick={() => fichierRef.current?.click()}
                      className="shrink-0 text-xs font-medium text-brand-600 hover:underline"
                    >
                      Changer
                    </button>
                  </div>
                </div>
              )}
              <p className="mt-1 text-xs text-gray-400">
                VoiCit lit le texte de l'image (OCR), repère un éventuel montage et vérifie
                les affirmations véhiculées.
              </p>
            </>
          )}

          {(onglet === "video" || onglet === "numero") && (
            <p className="py-8 text-center text-sm text-gray-400">
              Module « {ONGLETS.find((o) => o.id === onglet)?.label} » disponible à une
              prochaine étape de construction.
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
                {estImage ? "Vérifier l'image" : estLien ? "Vérifier le lien" : "Vérifier"}
              </button>
            </>
          )}
        </div>
      ) : null}

      {/* Analyse en cours */}
      {etat === "analyse" && <ProgressSteps etapes={etapes} />}

      {/* Résultat */}
      {etat === "resultat" && resultat && (
        <div className="space-y-4">
          <VerdictCard r={resultat} />
          <EvidenceList composantes={resultat.composantes} />
          <SourceList sources={resultat.sources} />
          <ClaimList affirmations={resultat.affirmations} />
          <AdviceBox conseil={resultat.conseil} />
          <button
            onClick={reinitialiser}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Vérifier un autre contenu
          </button>
        </div>
      )}

      {/* Accueil : rumeurs récemment démenties */}
      {(etat === "idle" || etat === "erreur") && <RecentRumors />}
    </div>
  );
}
