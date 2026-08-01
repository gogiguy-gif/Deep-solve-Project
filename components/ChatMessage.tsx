"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import type { Message } from "@/app/page";

export default function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex animate-fade-up gap-2 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {!isUser && (
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 shadow-md shadow-accent-600/20">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-4 w-4 text-white"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 7h16M4 12h10M4 17h6" />
            <circle cx="18" cy="16" r="3" />
            <path d="m20.5 18.5 2 2" />
          </svg>
        </div>
      )}
      <div
        className={`flex max-w-[80%] flex-col gap-1 ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {message.image && (
          <div className="overflow-hidden rounded-2xl border border-ink-600">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.image}
              alt="업로드한 문제"
              className="max-h-48 w-auto object-cover"
            />
          </div>
        )}
        {message.content && (
          <div
            className={`msg-prose rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              isUser
                ? "rounded-tr-sm bg-accent-600 text-white"
                : "rounded-tl-sm border border-ink-700 bg-ink-800 text-gray-100"
            }`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeKatex]}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        {message.pending && !message.content && (
          <div className="rounded-2xl rounded-tl-sm border border-ink-700 bg-ink-800 px-3.5 py-2.5 text-sm text-ink-300">
            생각하는 중...
          </div>
        )}
      </div>
    </div>
  );
}
