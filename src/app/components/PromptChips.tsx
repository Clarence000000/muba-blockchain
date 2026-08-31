import React from "react";

const PROMPTS = [
  {
    label: "Bet ETH goes up",
    prompt: "Bet ETH goes up in the next few days",
  },
  {
    label: "Protect my ETH",
    prompt: "Protect my ETH from a drop this week",
  },
  {
    label: "Yield on USDC",
    prompt: "I want to earn yield on my USDC with ETH options",
  },
  {
    label: "High Volatility play",
    prompt: "Find high volatility option plays for ETH",
  },
];

interface PromptChipsProps {
  onSelect: (promptText: string) => void;
  disabled?: boolean;
}

export function PromptChips({ onSelect, disabled }: PromptChipsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 py-2">
      {PROMPTS.map((item) => (
        <button
          key={item.label}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(item.prompt)}
          className="inline-flex items-center px-4 py-2 rounded-full font-mono text-xs text-slate-300 hover:text-white bg-[#141e2e] hover:bg-[#1c2a40] hover:border-cyan-500/40 border border-slate-700/60 transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
