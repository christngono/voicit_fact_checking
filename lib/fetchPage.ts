/**
 * Récupération d'une page distante pour le module LIEN.
 *
 * CODE déterministe, aucun LLM. Contraintes respectées :
 *  • Timeout explicite (AbortController) : jamais de requête pendante.
 *  • Taille bornée : on ne télécharge pas un fichier géant.
 *  • Extraction par regex (aucune dépendance) : titre, auteur, date, corps texte.
 *  • Échec propre : `ok: false` + raison, jamais d'exception qui plante le pipeline.
 */

export interface PageRecuperee {
  ok: boolean;
  /** URL demandée (normalisée). */
  url: string;
  /** URL finale après redirections. */
  urlFinale?: string;
  titre?: string;
  auteur?: string;
  /** Date de publication détectée (ISO AAAA-MM-JJ) si trouvée. */
  datePublication?: string;
  /** Texte principal nettoyé (borné). */
  corps: string;
  /** Renseignée quand ok === false. */
  raison?: string;
}

const TIMEOUT_MS = 5000;
const TAILLE_MAX = 800_000; // ~800 Ko de HTML, largement suffisant
const CORPS_MAX = 6000; // caractères de texte conservés pour l'analyse

/** Valide et normalise l'URL ; n'accepte que http/https. */
export function normaliserUrl(brut: string): string | null {
  const essai = brut.trim();
  if (!essai) return null;
  const avecSchema = /^https?:\/\//i.test(essai) ? essai : `https://${essai}`;
  try {
    const u = new URL(avecSchema);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export async function recupererPage(urlBrut: string): Promise<PageRecuperee> {
  const url = normaliserUrl(urlBrut);
  if (!url) {
    return { ok: false, url: urlBrut, corps: "", raison: "URL invalide." };
  }

  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), TIMEOUT_MS);

  try {
    const rep = await fetch(url, {
      signal: controleur.signal,
      redirect: "follow",
      headers: {
        // Un UA de navigateur : certains sites renvoient 403 à un client anonyme.
        "User-Agent":
          "Mozilla/5.0 (compatible; VoiCitBot/1.0; +https://voicit.cm) verification-fact-checking",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "fr,en;q=0.8",
      },
    });

    if (!rep.ok) {
      return { ok: false, url, corps: "", raison: `Page inaccessible (HTTP ${rep.status}).` };
    }

    const type = rep.headers.get("content-type") || "";
    if (!type.includes("text/html") && !type.includes("application/xhtml")) {
      return {
        ok: false,
        url,
        urlFinale: rep.url,
        corps: "",
        raison: "Le lien ne pointe pas vers une page web lisible (HTML).",
      };
    }

    const html = await lireBorne(rep, TAILLE_MAX);
    const extrait = extraireContenu(html);

    if (!extrait.titre && extrait.corps.length < 40) {
      return {
        ok: false,
        url,
        urlFinale: rep.url,
        corps: "",
        raison: "Contenu illisible ou vide sur cette page.",
      };
    }

    return { ok: true, url, urlFinale: rep.url, corps: extrait.corps, titre: extrait.titre, auteur: extrait.auteur, datePublication: extrait.date };
  } catch (e) {
    const abort = (e as Error)?.name === "AbortError";
    return {
      ok: false,
      url,
      corps: "",
      raison: abort ? "La page a mis trop de temps à répondre (5 s)." : "Impossible de joindre le lien.",
    };
  } finally {
    clearTimeout(minuteur);
  }
}

/** Lit le corps de la réponse en s'arrêtant au-delà de `max` octets. */
async function lireBorne(rep: Response, max: number): Promise<string> {
  const reader = rep.body?.getReader();
  if (!reader) return await rep.text();
  const decodeur = new TextDecoder("utf-8");
  let out = "";
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    out += decodeur.decode(value, { stream: true });
    if (total >= max) {
      try {
        await reader.cancel();
      } catch {
        /* ignore */
      }
      break;
    }
  }
  return out;
}

interface ContenuExtrait {
  titre?: string;
  auteur?: string;
  date?: string;
  corps: string;
}

/** Extraction regex : métadonnées + texte principal débarrassé des balises. */
export function extraireContenu(html: string): ContenuExtrait {
  const titre =
    meta(html, "og:title") ||
    balise(html, "title") ||
    meta(html, "twitter:title");

  const auteur =
    metaName(html, "author") ||
    meta(html, "article:author") ||
    metaName(html, "byl") ||
    undefined;

  const dateBrute =
    meta(html, "article:published_time") ||
    metaName(html, "date") ||
    metaName(html, "publish-date") ||
    meta(html, "og:updated_time") ||
    attribut(html, "time", "datetime") ||
    undefined;

  return {
    titre: titre?.trim() || undefined,
    auteur: auteur?.trim() || undefined,
    date: normaliserDate(dateBrute),
    corps: texteBrut(html).slice(0, CORPS_MAX),
  };
}

// ── Petits extracteurs regex (tolérants, insensibles à la casse) ─────────────

function meta(html: string, prop: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${escapeRe(prop)}["'][^>]*content=["']([^"']+)["']`,
    "i"
  );
  const m = html.match(re) || html.match(
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escapeRe(prop)}["']`, "i")
  );
  return m?.[1] ? decodeEntites(m[1]) : undefined;
}

function metaName(html: string, name: string): string | undefined {
  return meta(html, name);
}

function balise(html: string, tag: string): string | undefined {
  const m = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m?.[1] ? decodeEntites(m[1].replace(/\s+/g, " ")) : undefined;
}

function attribut(html: string, tag: string, attr: string): string | undefined {
  const m = html.match(new RegExp(`<${tag}[^>]+${attr}=["']([^"']+)["']`, "i"));
  return m?.[1];
}

/** Retire scripts/styles/balises et renvoie du texte lisible condensé. */
function texteBrut(html: string): string {
  const sansTete = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<head[\s\S]*?<\/head>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  return decodeEntites(sansTete.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/** Ramène une date détectée à AAAA-MM-JJ quand c'est possible. */
function normaliserDate(brut?: string): string | undefined {
  if (!brut) return undefined;
  const iso = brut.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const t = Date.parse(brut);
  if (!Number.isNaN(t)) return new Date(t).toISOString().slice(0, 10);
  return undefined;
}

function decodeEntites(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
