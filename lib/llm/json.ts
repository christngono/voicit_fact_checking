/**
 * Extraction robuste d'un objet JSON depuis une réponse LLM.
 * Les modèles ajoutent parfois du texte ou des ```fences``` autour du JSON.
 */
export function parseJSONLoose<T>(raw: string): T {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/,"").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Repli : isoler la première accolade équilibrée.
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new Error("Réponse LLM non parsable en JSON : " + raw.slice(0, 200));
  }
}
