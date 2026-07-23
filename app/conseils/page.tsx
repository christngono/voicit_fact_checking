import type { Metadata } from "next";
import { PageIntro } from "../components/PageIntro";
import { ConseilsResponsabilite } from "../components/ConseilsResponsabilite";
import { readLocale } from "@/lib/i18n/server";
import { getDict } from "@/lib/i18n/dictionary";

export const metadata: Metadata = {
  title: "Conseils — VoCit",
  description:
    "Conseils de responsabilité numérique VoCit : des réflexes simples pour reconnaître et stopper la désinformation.",
};

export default function ConseilsPage() {
  const d = getDict(readLocale()).conseilsPage;
  return (
    <div>
      <PageIntro titre={d.title} sous={d.sub} />
      <ConseilsResponsabilite />
    </div>
  );
}
