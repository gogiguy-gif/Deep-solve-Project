"use client";

export default function TypingIndicator() {
  return (
    <div className="flex animate-fade-up items-center gap-1.5 rounded-2xl rounded-tl-sm border border-ink-700 bg-ink-800 px-4 py-3">
      <span className="h-2 w-2 rounded-full bg-accent-400 animate-dot-pulse" style={{ animationDelay: "0ms" }} />
      <span className="h-2 w-2 rounded-full bg-accent-400 animate-dot-pulse" style={{ animationDelay: "150ms" }} />
      <span className="h-2 w-2 rounded-full bg-accent-400 animate-dot-pulse" style={{ animationDelay: "300ms" }} />
    </div>
  );
}
