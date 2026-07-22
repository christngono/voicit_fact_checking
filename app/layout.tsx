import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { Wordmark } from "./components/Logo";
import { TopMenu } from "./components/TopMenu";
import { BottomNav } from "./components/BottomNav";

export const metadata: Metadata = {
  title: "VoiCit — Vérifier avant de partager",
  description:
    "VoiCit (Voice of the Citizen) : vérifiez un contenu douteux et recevez un verdict explicable et sourcé. Vérifier avant de partager.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0E7A3B",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh bg-[#f7f8fa] text-ink">
        {/* Barre de marque : le dégradé tornade en signature */}
        <div className="h-1 w-full bg-tornado" />
        <header className="sticky top-0 z-20 border-b border-black/5 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-2">
            <Link href="/" aria-label="Accueil VoiCit" className="rounded-lg">
              <Wordmark />
            </Link>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs font-medium text-verdict-insuffisant sm:block">
                Vérifier avant de partager
              </span>
              <TopMenu />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-4 pb-28 pt-4">{children}</main>
        <footer className="mx-auto max-w-2xl px-4 pb-28 text-center text-xs text-verdict-insuffisant">
          VoiCit présente des preuves consultées, jamais un oracle. Le verdict est
          calculé par des règles transparentes à partir de sources vérifiables.
        </footer>
        <BottomNav />
      </body>
    </html>
  );
}
