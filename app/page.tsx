"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Header from "@/components/Header";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import ActionButtons from "@/components/ActionButtons";
import TypingIndicator from "@/components/TypingIndicator";

export type Role = "user" | "assistant";

export interface Message {
  id: string;
  role: Role;
  content: string;
  image?: string;
  pending?: boolean;
}

interface Choice {
  label: string;
  text: string;
}

const SYSTEM_PROMPT = `You are Deep-Solve, an AI math tutor for high school students. Your job is to guide students toward understanding, not just hand them answers.

Guidelines:
- Use LaTeX for ALL math expressions. Inline math with $...$ and display math with $$...$$.
- Explain concepts step by step in clear, simple Korean (unless the student writes in English).
- When you present multiple-choice options, format them EXACTLY as: ①, ②, ③, ④, ⑤ each on its own line, followed by the option text.
- Encourage the student and ask guiding questions when they seem stuck.
- Be concise. Use short paragraphs and bullet points.
- If a photo is provided, first identify the problem, then walk through the solution.`;

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "안녕! **Deep-Solve**야. 📐\n\n수학 문제가 막히거나 개념이 헷갈릴 때 언제든 도와줄게.\n\n- 문제 사진을 올려도 되고\n- 직접 타이핑해도 돼\n\n오늘은 어떤 문제로 도움이 필요해?",
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, choices, isStreaming]);

  const parseChoices = (text: string): Choice[] => {
    const lines = text.split("\n");
    const found: Choice[] = [];
    let collecting = false;
    for (const line of lines) {
      const m = line.match(/^\s*([①②③④⑤])\s*(.+)$/);
      if (m) {
        collecting = true;
        found.push({ label: m[1], text: m[2].trim() });
      } else if (collecting && line.trim() === "") {
        continue;
      } else if (collecting) {
        break;
      }
    }
    return found.length >= 2 ? found : [];
  };

  const sendMessage = useCallback(
    async (text: string, image?: string | null) => {
      if (!text.trim() && !image) return;
      if (isStreaming) return;

      setChoices([]);
      setAttachedImage(null);

      const userMsg: Message = {
        id: uid(),
        role: "user",
        content: text.trim(),
        image: image || undefined,
      };
      setMessages((prev) => [...prev, userMsg]);

      const assistantId = uid();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", pending: true },
      ]);
      setIsStreaming(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMsg]
              .filter((m) => m.id !== "welcome")
              .map((m) => ({
                role: m.role,
                content: m.content,
                image: m.image,
              })),
            system: SYSTEM_PROMPT,
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`Request failed (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, pending: false } : m
          )
        );

        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                const token = parsed.text || "";
                full += token;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: full } : m
                  )
                );
              } catch {
                // partial JSON — skip
              }
            }
          }
        }

        const parsedChoices = parseChoices(full);
        if (parsedChoices.length > 0) setChoices(parsedChoices);
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  pending: false,
                  content:
                    "앗, 연결에 문제가 생겼어. 잠시 후 다시 시도해 줘. 🔄",
                }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming]
  );

  const handleSend = (text: string) => {
    sendMessage(text, attachedImage);
  };

  const handleImageSelect = (dataUrl: string | null) => {
    setAttachedImage(dataUrl);
  };

  const handleChoice = (choice: Choice) => {
    sendMessage(`${choice.label} ${choice.text}`);
    setChoices([]);
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-ink-900">
      <Header />
      <div
        ref={scrollRef}
        className="chat-scroll flex-1 overflow-y-auto px-4 pb-2 pt-3"
      >
        <div className="mx-auto flex max-w-md flex-col gap-3">
          {messages.map((m) => (
            <ChatMessage key={m.id} message={m} />
          ))}
          {isStreaming &&
            messages[messages.length - 1]?.content === "" &&
            messages[messages.length - 1]?.pending && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>
      {choices.length > 0 && (
        <ActionButtons choices={choices} onSelect={handleChoice} disabled={isStreaming} />
      )}
      <ChatInput
        onSend={handleSend}
        onImageSelect={handleImageSelect}
        attachedImage={attachedImage}
        disabled={isStreaming}
      />
    </div>
  );
}
