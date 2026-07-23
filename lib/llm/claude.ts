import Anthropic from "@anthropic-ai/sdk";
import type { LLMOptions, LLMProvider, SearchResult } from "./types";
import { raisonEchecRecherche } from "./types";
import type { Source } from "../types";
import { parseJSONLoose } from "./json";

/**
 * Implémentation Anthropic Claude.
 * Recherche web via l'outil `web_search` de l'API Messages.
 */
export class ClaudeProvider implements LLMProvider {
  readonly name = "claude";
  readonly model: string;
  private client: Anthropic;

  constructor(apiKey: string, model?: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model || "claude-haiku-4-5-20251001";
  }

  private async raw(prompt: string, options?: LLMOptions): Promise<string> {
    const msg = await this.client.messages.create({
      model: this.model,
      max_tokens: options?.maxTokens ?? 1024,
      temperature: options?.temperature ?? 0.2,
      system: options?.system,
      messages: [{ role: "user", content: prompt }],
    });
    return msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
  }

  async complete(prompt: string, options?: LLMOptions): Promise<string> {
    return this.raw(prompt, options);
  }

  async completeJSON<T>(prompt: string, options?: LLMOptions): Promise<T> {
    const text = await this.raw(prompt, { ...options, temperature: 0 });
    return parseJSONLoose<T>(text);
  }

  async analyzeImage(
    image: Buffer | string,
    prompt: string,
    mimeType = "image/jpeg"
  ): Promise<string> {
    const data = typeof image === "string" ? image : image.toString("base64");
    const msg = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as
                  | "image/jpeg"
                  | "image/png"
                  | "image/gif"
                  | "image/webp",
                data,
              },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    });
    return msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
  }

  async searchAndAnswer(query: string): Promise<SearchResult> {
    try {
      const msg = await this.client.messages.create({
        model: this.model,
        max_tokens: 1536,
        messages: [{ role: "user", content: query }],
        tools: [
          // Outil de recherche web natif de Claude.
          { type: "web_search_20250305", name: "web_search", max_uses: 5 } as never,
        ],
      });

      const sources: Source[] = [];
      let text = "";
      for (const block of msg.content) {
        if (block.type === "text") {
          text += block.text;
          // Les citations éventuelles portent l'URL et le titre.
          const cits = (block as { citations?: unknown[] }).citations ?? [];
          for (const c of cits as { url?: string; title?: string }[]) {
            if (c.url) sources.push({ titre: c.title || c.url, url: c.url });
          }
        }
        // Résultats bruts de l'outil de recherche.
        if ((block as { type: string }).type === "web_search_tool_result") {
          const content = (block as { content?: unknown[] }).content ?? [];
          for (const r of content as { url?: string; title?: string; page_age?: string }[]) {
            if (r.url)
              sources.push({ titre: r.title || r.url, url: r.url, date: r.page_age });
          }
        }
      }
      return { available: true, text, sources: dedupe(sources) };
    } catch (err) {
      const message = (err as Error).message || "";
      return {
        available: false,
        text: "recherche indisponible : " + message,
        sources: [],
        raison: raisonEchecRecherche(message),
      };
    }
  }
}

function dedupe(sources: Source[]): Source[] {
  const seen = new Set<string>();
  return sources.filter((s) => (seen.has(s.url) ? false : (seen.add(s.url), true)));
}
