"use client";

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-ink-700 bg-ink-900/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 shadow-lg shadow-accent-600/20">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5 text-white"
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
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">
              Deep-Solve
            </h1>
            <p className="text-[10px] font-medium uppercase tracking-wider text-ink-300">
              22개정 수학 튜터
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-ink-600 bg-ink-800 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-medium text-ink-300">학생 · 무료 플랜</span>
        </div>
      </div>
    </header>
  );
}
