import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

type ContextDevice = {
  name: string;
  type: string;
  ip?: string;
  ping?: number | null;
  status?: string;
  ports?: number;
};

type ChatBody = {
  messages?: unknown;
  context?: {
    equipmentList?: { id: string; name: string; kind: string }[];
    connections?: string[];
    cameras?: ContextDevice[];
    switches?: ContextDevice[];
    linksCount?: number;
  };
};

function buildSystemPrompt(ctx: ChatBody["context"]) {
  const parts: string[] = [
    "Você é o NetVision Copilot, um assistente de operações de CFTV e redes para um NOC.",
    "Fale em português do Brasil, de forma direta, técnica e gentil.",
    "Suas especialidades: câmeras IP (Dome, Bullet, PTZ, Fisheye, Box), switches L2/L3/PoE, VLANs, multicast, ONVIF, RTSP, sub-redes, troubleshooting de ping, identificação de fabricantes por OUI, topologia de rede e sistemas de energia.",
    "Use bullets curtos e blocos de código quando ajudar. Não invente dados que não estejam no contexto.",
  ];
  if (ctx && (ctx.cameras?.length || ctx.switches?.length || ctx.equipmentList?.length)) {
    parts.push("\n=== Snapshot atual da rede do usuário ===");
    if (ctx.switches?.length) {
      parts.push("Switches:");
      ctx.switches.forEach((s) => parts.push(`- ${s.name} (${s.type}, ${s.ports ?? "?"} portas)`));
    }
    if (ctx.cameras?.length) {
      parts.push("Câmeras:");
      ctx.cameras.forEach((c) =>
        parts.push(`- ${c.name} (${c.type}) IP ${c.ip ?? "?"} • ${c.status ?? "?"} • ${c.ping ?? "—"}ms`)
      );
    }
    
    const otherEquipment = ctx.equipmentList?.filter(e => !["camera", "switch"].includes(e.kind));
    if (otherEquipment?.length) {
      parts.push("Outros Equipamentos:");
      otherEquipment.forEach(e => parts.push(`- ${e.name} (${e.kind})`));
    }

    if (ctx.connections?.length) {
      parts.push("Conexões (Topologia):");
      ctx.connections.forEach(c => parts.push(`- ${c}`));
    } else if (typeof ctx.linksCount === "number") {
      parts.push(`Links ativos no diagrama: ${ctx.linksCount}`);
    }
    
    parts.push("Use este snapshot para responder perguntas específicas sobre a infraestrutura e topologia do usuário.");
  } else {
    parts.push("\nO usuário ainda não montou o diagrama. Sugira que adicione equipamentos e conexões na aba Diagrama quando fizer sentido.");
  }
  return parts.join("\n");
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, context } = (await request.json()) as ChatBody;
        if (!Array.isArray(messages)) {
          return new Response("messages required", { status: 400 });
        }

        const DEFAULT_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || "";
        const headerKey = request.headers.get("x-gemini-key")?.trim();
        const envKey = (process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY)?.trim();

        const isValidKey = (k?: string) => !!k && k !== "COLE_SUA_CHAVE_AQUI";
        const key = isValidKey(headerKey)
          ? headerKey!
          : isValidKey(envKey)
            ? envKey!
            : DEFAULT_KEY;

        // Use Google's OpenAI-compatible endpoint (no version conflicts)
        const google = createOpenAICompatible({
          name: "google-gemini",
          baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
          apiKey: key,
        });

        const model = google("gemini-flash-latest");

        const result = streamText({
          model,
          system: buildSystemPrompt(context),
          messages: await convertToModelMessages(messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
          onError: (err) => {
            console.error("chat stream error", err);
            return err instanceof Error ? err.message : "Erro ao gerar resposta";
          },
        });
      },
    },
  },
});
