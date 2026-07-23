import type { Metadata } from "next";
import { PageBanner } from "../components/PageBanner";
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
      <PageBanner image="/conseils.png" titre={d.title} sous={d.sub} />
      <ConseilsResponsabilite />
    </div>
  );
}
