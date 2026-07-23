import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { Wordmark } from "./components/Logo";
import { TopMenu } from "./components/TopMenu";
import { BottomNav } from "./components/BottomNav";
import { SplashScreen } from "./components/SplashScreen";
import { LocaleProvider } from "./components/LocaleProvider";
import { Onboarding } from "./components/Onboarding";
import { LangSwitch } from "./components/LangSwitch";
import { IconVerifier } from "./components/Icons";
import { readLocale, localeChoisie } from "@/lib/i18n/server";
import { getDict } from "@/lib/i18n/dictionary";

export const metadata: Metadata = {
  title: "VoCit — Vérifier avant de partager / Check before you share",
  description:
    "VoCit (Voice of the Citizen) : vérifiez un contenu douteux et recevez un verdict explicable et sourcé.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0E7A3B",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = readLocale();
  const chosen = localeChoisie();
  const d = getDict(locale);

  return (
    <html lang={locale}>
      <body className="min-h-dvh bg-[#f7f8fa] text-ink">
        <LocaleProvider initialLocale={locale} initialChosen={chosen}>
          {/* Barre de marque : le dégradé tornade en signature */}
          <div className="h-1 w-full bg-tornado" />
          <header className="sticky top-0 z-20 border-b border-black/5 bg-white/90 backdrop-blur">
            {/* Barre header plus large sur desktop (lg) */}
            <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-2 lg:max-w-5xl">
              <Link href="/" aria-label="VoCit" className="rounded-lg">
                <Wordmark />
              </Link>
              <div className="flex items-center gap-2">
                {/* « Vérifier » toujours accessible depuis le header */}
                <Link
                  href="/"
                  className="flex items-center gap-1.5 rounded-full bg-tornado px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-95"
                >
                  <IconVerifier size={16} />
                  <span>{d.nav.verifier}</span>
                </Link>
                {/* Langue modifiable à tout moment */}
                <LangSwitch />
                <TopMenu />
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-2xl px-4 pb-28 pt-4">{children}</main>
          <footer className="mx-auto max-w-2xl px-4 pb-28 text-center text-xs text-verdict-insuffisant">
            {d.footer}
          </footer>
          <BottomNav />
          <SplashScreen />
          <Onboarding />
        </LocaleProvider>
      </body>
    </html>
  );
}
