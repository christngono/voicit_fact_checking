import { GoogleGenAI } from "@google/genai";
import type { LLMOptions, LLMProvider, SearchResult } from "./types";
import type { Source } from "../types";
import { parseJSONLoose } from "./json";

/**
 * Implémentation Gemini.
 * Recherche web via le Google Search grounding (natif Gemini).
 * SEUL fichier — avec ses frères claude.ts / openai.ts — autorisé à importer un SDK.
 */
export class GeminiProvider implements LLMProvider {
  readonly name = "gemini";
  readonly model: string;
  private client: GoogleGenAI;

  constructor(apiKey: string, model?: string) {
    this.client = new GoogleGenAI({ apiKey });
    // "gemini-flash-latest" pointe vers le Flash courant. NB : "gemini-2.5-flash"
    // renvoie 404 pour les clés récentes ("no longer available to new users").
    this.model = model || "gemini-flash-latest";
  }

  async complete(prompt: string, options?: LLMOptions): Promise<string> {
    const res = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        temperature: options?.temperature ?? 0.2,
        maxOutputTokens: options?.maxTokens,
        systemInstruction: options?.system,
      },
    });
    return res.text ?? "";
  }

  async completeJSON<T>(prompt: string, options?: LLMOptions): Promise<T> {
    const res = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        temperature: options?.temperature ?? 0,
        responseMimeType: "application/json",
        systemInstruction: options?.system,
      },
    });
    return parseJSONLoose<T>(res.text ?? "");
  }

  async analyzeImage(
    image: Buffer | string,
    prompt: string,
    mimeType = "image/jpeg"
  ): Promise<string> {
    const data = typeof image === "string" ? image : image.toString("base64");
    const res = await this.client.models.generateContent({
      model: this.model,
      contents: [
        { inlineData: { data, mimeType } },
        { text: prompt },
      ],
    });
    return res.text ?? "";
  }

  async searchAndAnswer(query: string): Promise<SearchResult> {
    try {
      const res = await this.client.models.generateContent({
        model: this.model,
        contents: query,
        // Google Search grounding : la recherche web native de Gemini.
        config: { tools: [{ googleSearch: {} }], temperature: 0 },
      });

      const sources: Source[] = [];
      const meta = res.candidates?.[0]?.groundingMetadata;
      const chunks = meta?.groundingChunks ?? [];
      for (const c of chunks) {
        const web = (c as { web?: { uri?: string; title?: string } }).web;
        if (web?.uri) {
          sources.push({ titre: web.title || web.uri, url: web.uri });
        }
      }
      return { available: true, text: res.text ?? "", sources };
    } catch (err) {
      // Repli explicite : jamais de sources inventées.
      return {
        available: false,
        text: "recherche indisponible : " + (err as Error).message,
        sources: [],
      };
    }
  }
}
