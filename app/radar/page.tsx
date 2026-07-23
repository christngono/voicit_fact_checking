import type { Metadata } from "next";
import { PageIntro } from "../components/PageIntro";
import { RadarView } from "../components/RadarView";
import { readLocale } from "@/lib/i18n/server";
import { getDict } from "@/lib/i18n/dictionary";

export const metadata: Metadata = {
  title: "Radar — VoCit",
  description:
    "Radar VoCit : cartographie des signalements par région du Cameroun. Données de démonstration.",
};

export default function RadarPage() {
  const d = getDict(readLocale()).radar;
  return (
    <div>
      <PageIntro titre={d.title} sous={d.sub} />
      <RadarView />
    </div>
  );
}
