import type { StreamEvent } from "./types";

/**
 * Utilitaire Server-Sent Events (SSE) sur un ReadableStream Web standard,
 * compatible avec les Route Handlers Next.js (runtime Node ou Edge).
 *
 * Le pipeline émet de VRAIES étapes au fil de son exécution (pas d'animation
 * factice) : chaque `emit` pousse immédiatement un événement au client.
 */
export function creerFluxSSE(
  run: (emit: (e: StreamEvent) => void) => Promise<void>
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (e: StreamEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`));
      };
      try {
        await run(emit);
      } catch (err) {
        // Toute erreur non gérée devient un événement propre, jamais un plantage.
        emit({ type: "erreur", message: (err as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
