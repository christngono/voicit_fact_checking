import { describe, it, expect } from "vitest";
import { extraireContenu, normaliserUrl } from "./fetchPage";

describe("normaliserUrl", () => {
  it("ajoute https:// et valide un domaine", () => {
    expect(normaliserUrl("exemple.cm/article")).toBe("https://exemple.cm/article");
  });
  it("rejette les entrées sans domaine", () => {
    expect(normaliserUrl("bonjour le monde")).toBeNull();
    expect(normaliserUrl("")).toBeNull();
    expect(normaliserUrl("javascript:alert(1)")).toBeNull();
  });
});

describe("extraireContenu", () => {
  const html = `<!doctype html><html><head>
    <title>Vieux titre</title>
    <meta property="og:title" content="Le vrai titre &amp; complet" />
    <meta name="author" content="Awa N." />
    <meta property="article:published_time" content="2019-03-05T10:00:00Z" />
    <style>.x{color:red}</style>
  </head><body>
    <script>var a = 1;</script>
    <h1>Actualité</h1>
    <p>Le corps de l'article contient des faits &agrave; v&eacute;rifier.</p>
  </body></html>`;

  const r = extraireContenu(html);

  it("préfère og:title et décode les entités", () => {
    expect(r.titre).toBe("Le vrai titre & complet");
  });
  it("extrait auteur et date normalisée", () => {
    expect(r.auteur).toBe("Awa N.");
    expect(r.date).toBe("2019-03-05");
  });
  it("retire scripts/styles et garde le texte", () => {
    expect(r.corps).toContain("Le corps de l'article");
    expect(r.corps).not.toContain("var a");
    expect(r.corps).not.toContain("color:red");
  });
});
