import OpenAI from "openai";
import type { LLMOptions, LLMProvider, SearchResult } from "./types";
import type { Source } from "../types";
import { parseJSONLoose } from "./json";

/**
 * Implémentation OpenAI.
 * Recherche web via l'outil `web_search_preview` de l'API Responses.
 */
export class OpenAIProvider implements LLMProvider {
  readonly name = "openai";
  readonly model: string;
  private client: OpenAI;

  constructor(apiKey: string, model?: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model || "gpt-4o-mini";
  }

  async complete(prompt: string, options?: LLMOptions): Promise<string> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      temperature: options?.temperature ?? 0.2,
      max_tokens: options?.maxTokens,
      messages: [
        ...(options?.system ? [{ role: "system" as const, content: options.system }] : []),
        { role: "user", content: prompt },
      ],
    });
    return res.choices[0]?.message?.content ?? "";
  }

  async completeJSON<T>(prompt: string, options?: LLMOptions): Promise<T> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        ...(options?.system ? [{ role: "system" as const, content: options.system }] : []),
        { role: "user", content: prompt },
      ],
    });
    return parseJSONLoose<T>(res.choices[0]?.message?.content ?? "");
  }

  async analyzeImage(
    image: Buffer | string,
    prompt: string,
    mimeType = "image/jpeg"
  ): Promise<string> {
    const data = typeof image === "string" ? image : image.toString("base64");
    const url = data.startsWith("data:") ? data : `data:${mimeType};base64,${data}`;
    const res = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url } },
          ],
        },
      ],
    });
    return res.choices[0]?.message?.content ?? "";
  }

  async searchAndAnswer(query: string): Promise<SearchResult> {
    try {
      // API Responses + outil de recherche web natif OpenAI.
      const res = await this.client.responses.create({
        model: this.model,
        tools: [{ type: "web_search_preview" }],
        input: query,
      });

      const sources: Source[] = [];
      // Les annotations "url_citation" portent les sources consultées.
      for (const item of (res.output ?? []) as unknown[]) {
        const content = (item as { content?: unknown[] }).content ?? [];
        for (const c of content as { annotations?: unknown[] }[]) {
          for (const a of (c.annotations ?? []) as {
            type?: string;
            url?: string;
            title?: string;
          }[]) {
            if (a.type === "url_citation" && a.url) {
              sources.push({ titre: a.title || a.url, url: a.url });
            }
          }
        }
      }
      return {
        available: true,
        text: res.output_text ?? "",
        sources: dedupe(sources),
      };
    } catch (err) {
      return {
        available: false,
        text: "recherche indisponible : " + (err as Error).message,
        sources: [],
      };
    }
  }
}

function dedupe(sources: Source[]): Source[] {
  const seen = new Set<string>();
  return sources.filter((s) => (seen.has(s.url) ? false : (seen.add(s.url), true)));
}
