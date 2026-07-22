import type { LLMProvider } from "./types";
import { GeminiProvider } from "./gemini";
import { ClaudeProvider } from "./claude";
import { OpenAIProvider } from "./openai";

export type { LLMProvider, SearchResult } from "./types";

/**
 * FACTORY — unique point d'entrée LLM du reste de l'application.
 *
 * Le fournisseur est choisi par la variable d'environnement LLM_PROVIDER.
 * La clé du fournisseur sélectionné doit être présente, sinon on échoue
 * proprement avec un message clair (jamais un crash opaque en pleine requête).
 *
 * Toutes ces variables sont lues CÔTÉ SERVEUR uniquement.
 */
export function getLLM(): LLMProvider {
  const provider = (process.env.LLM_PROVIDER || "gemini").toLowerCase();
  const model = process.env.LLM_MODEL || undefined;

  switch (provider) {
    case "gemini": {
      const key = requireKey("GEMINI_API_KEY", "gemini");
      return new GeminiProvider(key, model);
    }
    case "claude": {
      const key = requireKey("ANTHROPIC_API_KEY", "claude");
      return new ClaudeProvider(key, model);
    }
    case "openai": {
      const key = requireKey("OPENAI_API_KEY", "openai");
      return new OpenAIProvider(key, model);
    }
    default:
      throw new Error(
        `LLM_PROVIDER="${provider}" inconnu. Valeurs acceptées : gemini | claude | openai.`
      );
  }
}

function requireKey(envName: string, provider: string): string {
  const key = process.env[envName];
  if (!key) {
    throw new Error(
      `Configuration manquante : LLM_PROVIDER=${provider} mais ${envName} est absent. ` +
        `Renseignez ${envName} dans .env.local (voir .env.example).`
    );
  }
  return key;
}
