import { describe, it, expect } from "vitest";
import { calculerScore } from "./scoring";
import type { Signal } from "./types";

const sig = (code: Signal["code"], sens: Signal["sens"] = "negatif"): Signal => ({
  code,
  sens,
  libelle: code,
});

describe("calculerScore — verdict déterministe, sans LLM", () => {
  it("démenti en base ⇒ faux, court-circuit décisif", () => {
    const r = calculerScore([sig("deja_dementi")]);
    expect(r.niveau).toBe("faux");
    expect(r.score).toBeLessThan(10);
  });

  it("confirmé en base ⇒ fiable", () => {
    const r = calculerScore([sig("deja_confirme", "positif")]);
    expect(r.niveau).toBe("fiable");
    expect(r.score).toBeGreaterThan(90);
  });

  it("corroboré par sources fiables ⇒ fiable", () => {
    const r = calculerScore([sig("corrobore_sources_fiables", "positif")]);
    expect(r.niveau).toBe("fiable");
  });

  it("contredit par source fiable + aucune couverture ⇒ faux", () => {
    const r = calculerScore([
      sig("contredit_source_fiable"),
      sig("aucune_couverture_evenement_majeur"),
    ]);
    expect(r.niveau).toBe("faux");
    expect(r.score).toBeLessThan(40);
  });

  it("marqueurs de manipulation seuls ⇒ douteux (poids moyen, non décisif)", () => {
    const r = calculerScore([sig("marqueur_manipulation"), sig("marqueur_manipulation")]);
    expect(r.niveau).toBe("douteux");
  });

  it("preuves insuffisantes ⇒ niveau insuffisant quel que soit le score", () => {
    const r = calculerScore([sig("corrobore_sources_fiables", "positif")], false);
    expect(r.niveau).toBe("insuffisant");
  });

  it("uniquement recherche indisponible ⇒ insuffisant", () => {
    const r = calculerScore([sig("recherche_indisponible", "neutre")]);
    expect(r.niveau).toBe("insuffisant");
  });

  it("chaque composante est une phrase lisible", () => {
    const r = calculerScore([
      { code: "aucune_source", sens: "negatif", libelle: "Aucune source ne corrobore cette affirmation" },
    ]);
    expect(r.composantes[0].texte).toContain("Aucune source");
  });

  it("le score reste borné 0..100", () => {
    const r = calculerScore(Array(10).fill(sig("contredit_source_fiable")));
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });
});
