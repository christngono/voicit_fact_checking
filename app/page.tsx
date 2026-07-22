"use client";

import { useState } from "react";
import type { StreamEvent, VerifyResult } from "@/lib/types";
import { Hero } from "./components/Hero";
import { ProgressSteps, ETAPES_INIT, type EtapeUI } from "./components/ProgressSteps";
import { VerdictCard } from "./components/VerdictCard";
import { EvidenceList, SourceList, ClaimList, AdviceBox } from "./components/ResultParts";
import { RecentRumors } from "./components/RecentRumors";

type Onglet = "texte" | "lien" | "image" | "numero";

const ONGLETS: { id: Onglet; label: string; pret: boolean }[] = [
  { id: "texte", label: "Texte", pret: true },
  { id: "lien", label: "Lien", pret: false },
  { id: "image", label: "Image", pret: false },
  { id: "numero", label: "Numéro", pret: false },
];

export default function Accueil() {
  const [onglet, setOnglet] = useState<Onglet>("texte");
  const [contenu, setContenu] = useState("");
  const [etat, setEtat] = useState<"idle" | "analyse" | "resultat" | "erreur">("idle");
  const [etapes, setEtapes] = useState<EtapeUI[]>(ETAPES_INIT);
  const [resultat, setResultat] = useState<VerifyResult | null>(null);
  const [erreur, setErreur] = useState<string>("");

  async function verifier() {
    if (!contenu.trim() || etat === "analyse") return;
    setEtat("analyse");
    setResultat(null);
    setErreur("");
    setEtapes(ETAPES_INIT.map((e) => ({ ...e })));

    try {
      const res = await fetch("/api/verify/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenu }),
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
    } else if (evt.type === "erreur") {
      setErreur(evt.message);
      setEtat("erreur");
    }
  }

  function reinitialiser() {
    setEtat("idle");
    setResultat(null);
    setContenu("");
    setErreur("");
  }

  const surAccueil = etat === "idle" || etat === "erreur";

  return (
    <div>
      {/* Hero narratif — sur l'accueil uniquement, pour rester focalisé pendant l'analyse */}
      {surAccueil && <Hero />}

      {/* Onglets */}
      <div className="mb-4 grid grid-cols-4 gap-1 rounded-xl bg-gray-100 p-1">
        {ONGLETS.map((o) => (
          <button
            key={o.id}
            onClick={() => o.pret && setOnglet(o.id)}
            disabled={!o.pret}
            className={
              "relative rounded-lg py-2 text-sm font-medium transition " +
              (onglet === o.id
                ? "bg-white text-brand-600 shadow-sm"
                : o.pret
                ? "text-gray-500 hover:text-ink"
                : "cursor-not-allowed text-gray-300")
            }
          >
            {o.label}
            {!o.pret && (
              <span className="absolute -right-0 -top-1 rounded-full bg-accent-yellow px-1 text-[8px] font-bold text-ink">
                bientôt
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Zone de soumission (module Texte) */}
      {etat === "idle" || etat === "erreur" ? (
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-card">
          {onglet === "texte" ? (
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
              {erreur && (
                <p className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-700">{erreur}</p>
              )}
              <button
                onClick={verifier}
                disabled={!contenu.trim()}
                className="mt-4 w-full rounded-xl bg-tornado py-3 text-sm font-semibold text-white shadow-sm transition enabled:hover:opacity-95 disabled:opacity-40"
              >
                Vérifier
              </button>
            </>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">
              Module « {ONGLETS.find((o) => o.id === onglet)?.label} » disponible
              à la prochaine étape de construction.
            </p>
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
