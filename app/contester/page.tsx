"use client";

import Link from "next/link";
import { useState } from "react";
import { PageIntro } from "../components/PageIntro";
import { useT } from "../components/LocaleProvider";

/**
 * Formulaire de contestation d'un verdict.
 *
 * MVP : la contestation est confirmée côté client. Aucune écriture disque n'est
 * possible sur l'hébergement actuel (FS lecture seule) ; le branchement vers une
 * file de modération (KV / Postgres / e-mail) est le point d'extension prévu.
 */
export default function ContesterPage() {
  const d = useT();
  const [contenu, setContenu] = useState("");
  const [raison, setRaison] = useState("");
  const [envoye, setEnvoye] = useState(false);

  function soumettre(e: React.FormEvent) {
    e.preventDefault();
    if (!contenu.trim() || !raison.trim()) return;
    setEnvoye(true);
  }

  if (envoye) {
    return (
      <div>
        <PageIntro titre={d.contester.title} />
        <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-card">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-2xl text-brand-600">
            ✓
          </span>
          <p className="mt-4 text-sm font-semibold text-ink">{d.contester.sentTitle}</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/70">
            {d.contester.sentBody}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <button
              onClick={() => {
                setContenu("");
                setRaison("");
                setEnvoye(false);
              }}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              {d.contester.again}
            </button>
            <Link
              href="/"
              className="rounded-xl bg-tornado px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              {d.contester.backHome}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageIntro titre={d.contester.title} sous={d.contester.sub} />

      <form
        onSubmit={soumettre}
        className="space-y-4 rounded-2xl border border-black/5 bg-white p-5 shadow-card"
      >
        <div>
          <label htmlFor="contenu" className="mb-1.5 block text-sm font-semibold text-ink">
            {d.contester.contentLabel}
          </label>
          <input
            id="contenu"
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            placeholder={d.contester.contentPlaceholder}
            className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div>
          <label htmlFor="raison" className="mb-1.5 block text-sm font-semibold text-ink">
            {d.contester.reasonLabel}
          </label>
          <textarea
            id="raison"
            value={raison}
            onChange={(e) => setRaison(e.target.value)}
            rows={5}
            placeholder={d.contester.reasonPlaceholder}
            className="w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <button
          type="submit"
          disabled={!contenu.trim() || !raison.trim()}
          className="w-full rounded-xl bg-tornado py-3 text-sm font-semibold text-white shadow-sm transition enabled:hover:opacity-95 disabled:opacity-40"
        >
          {d.contester.submit}
        </button>
      </form>
    </div>
  );
}
