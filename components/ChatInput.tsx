"use client";

import { useRef, useState, KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  onImageSelect: (dataUrl: string | null) => void;
  attachedImage: string | null;
  disabled: boolean;
}

export default function ChatInput({
  onSend,
  onImageSelect,
  attachedImage,
  disabled,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!text.trim() && !attachedImage) return;
    onSend(text);
    setText("");
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      onImageSelect(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="border-t border-ink-700 bg-ink-900/95 px-3 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-xl">
      <div className="mx-auto max-w-md">
        {attachedImage && (
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-800 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachedImage}
              alt="첨부 사진"
              className="h-12 w-12 rounded-lg object-cover"
            />
            <span className="flex-1 truncate text-xs text-ink-300">
              첨부된 문제 사진
            </span>
            <button
              onClick={() => onImageSelect(null)}
              className="rounded-lg p-1 text-ink-300 transition-colors hover:bg-ink-700 hover:text-white"
              aria-label="사진 삭제"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex items-end gap-2 rounded-2xl border border-ink-600 bg-ink-800 p-2 transition-colors focus-within:border-accent-500">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={disabled}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-300 transition-colors hover:bg-ink-700 hover:text-accent-400 disabled:opacity-40"
            aria-label="사진 업로드"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.5-3.5a2 2 0 0 0-2.8 0L5 21" />
            </svg>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            disabled={disabled}
            rows={1}
            placeholder="문제를 입력하거나 사진을 올려줘..."
            className="max-h-28 min-h-[36px] flex-1 resize-none bg-transparent py-1.5 text-sm text-white placeholder:text-ink-300 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={disabled || (!text.trim() && !attachedImage)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-600 text-white transition-all hover:bg-accent-500 active:scale-95 disabled:bg-ink-600 disabled:text-ink-300"
            aria-label="전송"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-ink-400">
          Deep-Solve는 가끔 틀릴 수 있어. 중요한 건 직접 확인해 봐.
        </p>
      </div>
    </div>
  );
}
