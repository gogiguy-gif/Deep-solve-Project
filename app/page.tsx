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

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "**Deep-Solve v8.0** · 22개정 교육과정 수학 AI 튜터\n\n문제를 직접 입력하거나 사진을 올려줘.\n\n힌트로 스스로 풀어보거나, 해설을 바로 보거나 — 널 선택해. 🎯",
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
