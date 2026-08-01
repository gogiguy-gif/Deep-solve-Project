"use client";

interface Choice {
  label: string;
  text: string;
}

interface ActionButtonsProps {
  choices: Choice[];
  onSelect: (choice: Choice) => void;
  disabled: boolean;
}

export default function ActionButtons({
  choices,
  onSelect,
  disabled,
}: ActionButtonsProps) {
  return (
    <div className="border-t border-ink-700 bg-ink-900/95 px-3 py-2.5 backdrop-blur-xl">
      <div className="mx-auto max-w-md">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-ink-300">
          답을 골라봐
        </p>
        <div className="grid grid-cols-2 gap-2">
          {choices.map((choice, i) => (
            <button
              key={i}
              onClick={() => onSelect(choice)}
              disabled={disabled}
              className="group flex items-center gap-2.5 rounded-xl border border-ink-600 bg-ink-800 px-3 py-2.5 text-left transition-all hover:border-accent-500 hover:bg-ink-700 active:scale-[0.98] disabled:opacity-50"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-600/20 text-base font-bold text-accent-300 transition-colors group-hover:bg-accent-600 group-hover:text-white">
                {choice.label}
              </span>
              <span className="line-clamp-2 text-xs font-medium text-gray-200">
                {choice.text}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

