"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { lireHistorique, viderHistorique, type EntreeHistorique } from "@/lib/history";
import { NIVEAU_UI } from "../components/niveau";
import { PageIntro } from "../components/PageIntro";
import { IconVerifier } from "../components/Icons";
import { useLocale } from "../components/LocaleProvider";

export default function HistoriquePage() {
  const { d, locale } = useLocale();
  const [entrees, setEntrees] = useState<EntreeHistorique[]>([]);
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    setEntrees(lireHistorique());
    setCharge(true);
  }, []);

  function vider() {
    viderHistorique();
    setEntrees([]);
  }

  return (
    <div>
      <PageIntro titre={d.historique.title} sous={d.historique.sub} />

      {charge && entrees.length === 0 && (
        <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-card">
          <p className="text-sm text-gray-500">{d.historique.empty}</p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-tornado px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
          >
            <IconVerifier className="h-[18px] w-[18px]" />
            {d.historique.verifyBtn}
          </Link>
        </div>
      )}

      {entrees.length > 0 && (
        <>
          <ul className="space-y-2">
            {entrees.map((e) => {
              const ui = NIVEAU_UI[e.verdict];
              return (
                <li
                  key={e.id}
                  className="rounded-xl border border-black/5 bg-white p-3 shadow-card"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: ui.couleur }}
                    >
                      {ui.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-semibold ${ui.texte}`}>
                          {d.niveaux[e.verdict]}
                        </span>
                        <span className="shrink-0 text-xs font-medium text-gray-400">
                          {e.score}/100
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-sm text-ink/80">{e.apercu}</p>
                      <p className="mt-1 text-[11px] text-gray-400">
                        {new Date(e.date).toLocaleString(locale === "en" ? "en-GB" : "fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <button
            onClick={vider}
            className="mt-4 w-full rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            {d.historique.clear}
          </button>
        </>
      )}
    </div>
  );
}
