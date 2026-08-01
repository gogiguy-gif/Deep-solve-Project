import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
  image?: string;
}

interface ChatRequestBody {
  messages: IncomingMessage[];}

function encodeResult(text: string) {
  return `data: ${JSON.stringify({ text })}\n\n`;
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (s: string) => controller.enqueue(encoder.encode(s));
      const close = () => controller.close();

      try {
        const body = (await req.json()) as ChatRequestBody;
        const messages = body.messages ?? [];
        const system = SYSTEM_PROMPT;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          send(
            encodeResult(
              "API 키가 설정되지 않았어. 관리자에게 문의해 줘. 🔑"
            )
          );
          send("data: [DONE]\n\n");
          close();
          return;
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          systemInstruction: system,
        });

        // Convert chat history to Gemini format.
        // Gemini expects alternating turns starting with a user message.
        const history = messages.slice(0, -1).map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: buildParts(m),
        }));

        const lastMessage = messages[messages.length - 1];
        if (!lastMessage || lastMessage.role !== "user") {
          send(encodeResult("메시지를 입력해 줘."));
          send("data: [DONE]\n\n");
          close();
          return;
        }

        const chat = model.startChat({
          history,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2048,
          },
        });

        const result = await chat.sendMessageStream(
          buildParts(lastMessage)
        );

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            send(encodeResult(text));
          }
        }

        send("data: [DONE]\n\n");
        close();
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했어.";
        send(encodeResult(`오류가 발생했어: ${msg} 🔄`));
        send("data: [DONE]\n\n");
        close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function buildParts(m: IncomingMessage) {
  const parts: any[] = [];
  if (m.image) {
    const match = m.image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (match) {
      parts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2],
        },
      });
    }
  }
  if (m.content) {
    parts.push({ text: m.content });
  }
  if (parts.length === 0) {
    parts.push({ text: " " });
  }
  return parts;
}
